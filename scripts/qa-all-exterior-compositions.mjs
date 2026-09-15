import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import sharp from 'sharp';

const base = (process.env.EXTERIOR_QA_URL ?? 'http://localhost:55910').replace(/\/$/, '');
const output = process.env.EXTERIOR_QA_OUTPUT ?? 'work/exterior-composition-review';
const requested = process.argv.slice(2);
const sites = JSON.parse(await readFile('sources/exteriors/context/sites.json', 'utf8'));
const fixtures = sites.filter(site => site.location && (!requested.length || requested.includes(site.slug)));
const widths = (process.env.QA_WIDTHS ?? '1440,390').split(',').map(Number);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const report = { target: base, scope: 'Composition and visual review; not architectural accuracy certification', checks: [], excluded: sites.filter(site => !site.location).map(site => ({ slug: site.slug, reason: 'No fixed building location' })) };
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  for (const width of widths) for (const { slug } of fixtures) {
    const page = await browser.newPage({ viewport: { width, height: 1000 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
    const errors = [], downloads = [], images = [];
    const record = { slug, width, errors, images };
    report.checks.push(record);
    page.on('pageerror', error => errors.push(error.message));
    // Verify the exact bytes delivered to the renderer without relying on
    // DevTools' bounded response cache, which evicts large indoor GLBs.
    await page.route(/\/(?:models\/.*\.glb|maps\/exterior-context\/.*\.json)(?:\?.*)?$/, async route => {
      const path = new URL(route.request().url()).pathname;
      const asset = path.match(/\/(models|maps\/exterior-context)\/[^?]+\.(glb|json)$/)?.[0];
      const task = (async () => {
        const response = await route.fetch();
        assert.equal(response.status(), 200, asset);
        const bytes = await response.body();
        assert.equal(hash(bytes), hash(await readFile(`public${asset}`)), `Served revision differs: ${asset}`);
        await route.fulfill({ response, body: bytes });
        return { asset, sha256: hash(bytes) };
      })().then(value => ({ value }), async error => {
        await route.abort().catch(() => {});
        return { error: String(error) };
      });
      downloads.push(task);
      await task;
    });
    const shot = async (canvas, suffix) => {
      await canvas.evaluate(el => el.scrollIntoView({ block: 'center' }));
      const file = `${width}-${slug}-${suffix}.png`;
      const bytes = await canvas.screenshot({ path: `${output}/${file}` });
      images.push(file);
      return bytes;
    };
    try {
      await page.goto(`${base}/guides/${slug}/#guide-spatial`, { waitUntil: 'domcontentloaded' });
      const inside = page.getByRole('button', { name: '内部', exact: true });
      if (await inside.count()) {
        const twoD = page.getByRole('button', { name: '2D 俯视', exact: true });
        await twoD.waitFor();
        assert.equal(await twoD.getAttribute('aria-pressed'), 'true');
        await page.getByRole('button', { name: '外观', exact: true }).click();
      }
      const canvas = page.locator('.guide-spatial-3d__canvas');
      await canvas.scrollIntoViewIfNeeded();
      await page.waitForFunction(() => document.querySelector('.guide-spatial-3d__canvas')?.dataset.rendered === 'true', null, { timeout: 60000 });
      record.initial = await canvas.evaluate(el => Object.fromEntries(Object.entries(el.dataset)));
      assert.equal(record.initial.context, 'ready');
      assert.equal(record.initial.framing, 'complete');
      assert.equal(await page.locator('iframe').count(), 0);
      const initial = await shot(canvas, 'fit');
      assert.ok((await sharp(initial).stats()).channels.slice(0, 3).some(c => c.stdev > 8), 'Blank canvas');
      // Fit and close inspection are distinct: preserve the first whole-scene image.
      await page.getByRole('button', { name: '放大外观', exact: true }).click({ clickCount: 2 });
      for (let angle = 0; angle < 4; angle++) {
        await canvas.focus();
        if (angle) for (let step = 0; step < 16; step++) await canvas.press('ArrowRight');
        await shot(canvas, `angle-${angle}`);
      }
      await page.getByRole('button', { name: '重置三维视角', exact: true }).click();
      for (const name of ['周边建筑', '道路', '围墙', '绿地与水域']) {
        const layer = page.getByRole('checkbox', { name, exact: true });
        if (await layer.count() && await layer.isEnabled()) await layer.uncheck();
      }
      await page.getByRole('button', { name: '放大外观', exact: true }).click({ clickCount: 2 });
      await shot(canvas, 'subject');
      for (const name of ['周边建筑', '道路', '围墙', '绿地与水域']) {
        const layer = page.getByRole('checkbox', { name, exact: true });
        if (await layer.count() && await layer.isEnabled()) await layer.check();
      }
      await page.getByRole('button', { name: '重置三维视角', exact: true }).click();
      assert.equal(await canvas.getAttribute('data-framing'), 'complete');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
      const resources = await Promise.all(downloads);
      assert.deepEqual(resources.filter(resource => resource.error), [], 'Asset response verification failed');
      record.assets = resources.map(resource => resource.value);
      assert.deepEqual(errors, []);
      record.passed = true;
      console.log(`${width} ${slug}: pass`);
    } catch (error) {
      record.passed = false;
      record.failure = String(error);
      await Promise.allSettled(downloads);
      console.error(`${width} ${slug}: ${String(error)}`);
    } finally {
      await page.close();
      await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2) + '\n');
    }
  }
} finally { await browser.close(); }

// Contact sheets are for manual review; a nonblank image is not a geometry verdict.
for (const width of widths) {
  const checks = report.checks.filter(row => row.width === width && row.passed);
  for (let start = 0; start < checks.length; start += 6) {
    const composite = [];
    for (const [row, check] of checks.slice(start, start + 6).entries()) {
      const title = Buffer.from(`<svg width="1500" height="28"><rect width="1500" height="28" fill="#08121c"/><text x="8" y="20" font-family="sans-serif" font-size="16" fill="#e6c977">${check.slug} / ${width}px</text></svg>`);
      composite.push({ input: title, left: 0, top: row * 260 });
      for (let column = 0; column < 5; column++) {
        const suffix = column < 4 ? `angle-${column}` : 'subject';
        const image = await sharp(`${output}/${width}-${check.slug}-${suffix}.png`).resize(300, 230, { fit: 'contain', background: '#061019' }).toBuffer();
        composite.push({ input: image, left: column * 300, top: row * 260 + 28 });
      }
    }
    await sharp({ create: { width: 1500, height: 260 * Math.min(6, checks.length - start), channels: 3, background: '#061019' } }).composite(composite).png().toFile(`${output}/contact-${width}-${String(start / 6 + 1).padStart(2, '0')}.png`);
  }
}
assert.ok(report.checks.length === fixtures.length * widths.length && report.checks.every(check => check.passed), 'Inspect the failures in report.json');
