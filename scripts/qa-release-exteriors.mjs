import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import sharp from 'sharp';

const base = (process.env.EXTERIOR_QA_URL ?? 'http://localhost:55910').replace(/\/$/, '');
const output = process.env.EXTERIOR_QA_OUTPUT ?? 'work/release-exteriors';
const fixtures = [
  ['florence-duomo', 'churches', 'church'],
  ['sagrada-familia', 'churches', 'church'],
  ['st-mark-basilica', 'churches', 'church'],
  ['correr', 'museums', 'museum'],
  ['vatican-museums', 'museums', 'museum'],
  ['spanish-steps', 'landmarks', 'landmark'],
];
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const report = { target: base, checks: [] };
try {
  for (const width of [1440, 390]) for (const [slug, family, kind] of fixtures) {
    const page = await browser.newPage({ viewport: { width, height: 1000 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const record = { slug, width, errors };
    report.checks.push(record);
    try {
      const asset = `/models/${family}/${slug}.glb`;
      const contextAsset = `/maps/exterior-context/${slug}.json`;
      const modelResponse = page.waitForResponse(response => response.url().endsWith(asset));
      const contextResponse = page.waitForResponse(response => response.url().endsWith(contextAsset));
      await page.goto(`${base}/guides/${slug}/#guide-spatial`, { waitUntil: 'domcontentloaded' });
      const exterior = page.getByRole('button', { name: '外观', exact: true });
      if (await exterior.count()) {
        assert.equal(await page.getByRole('button', { name: '2D 俯视', exact: true }).getAttribute('aria-pressed'), 'true');
        await exterior.click();
      }
      const canvas = page.locator('.guide-spatial-3d__canvas');
      await canvas.scrollIntoViewIfNeeded();
      await page.waitForFunction(() => document.querySelector('.guide-spatial-3d__canvas')?.dataset.rendered === 'true', null, { timeout: 60000 });
      assert.equal(await page.locator('iframe').count(), 0);
      assert.equal(await canvas.getAttribute('data-model'), `${kind}-massing:${slug}`);
      assert.equal(await canvas.getAttribute('data-context'), 'ready');
      assert.equal(await canvas.getAttribute('data-framing'), 'complete');
      record.modelSha256 = hash(await (await modelResponse).body());
      record.contextSha256 = hash(await (await contextResponse).body());
      assert.equal(record.modelSha256, hash(await readFile(`public${asset}`)));
      assert.equal(record.contextSha256, hash(await readFile(`public${contextAsset}`)));
      const image = await canvas.screenshot({ path: `${output}/${width}-${slug}.png` });
      assert.ok((await sharp(image).stats()).channels.slice(0, 3).some(channel => channel.stdev > 8));
      const before = await canvas.getAttribute('data-camera');
      await canvas.focus();
      await canvas.press('ArrowRight');
      await page.waitForFunction(value => document.querySelector('.guide-spatial-3d__canvas')?.dataset.camera !== value, before);
      await canvas.screenshot({ path: `${output}/${width}-${slug}-rotated.png` });
      for (const name of ['周边建筑', '道路', '围墙', '绿地与水域']) {
        const layer = page.getByRole('checkbox', { name, exact: true });
        await layer.uncheck();
        await layer.check();
      }
      await page.getByRole('button', { name: '重置三维视角', exact: true }).click();
      assert.equal(await canvas.getAttribute('data-framing'), 'complete');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
      assert.deepEqual(errors, []);
      record.passed = true;
      console.log(`${slug} ${width}: pass`);
    } catch (error) {
      record.passed = false;
      record.failure = String(error);
      console.error(`${slug} ${width}: ${String(error)}`);
    } finally { await page.close(); }
  }
} finally {
  await browser.close();
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2) + '\n');
}
assert.ok(report.checks.every(check => check.passed), 'Release exterior regression failed');
