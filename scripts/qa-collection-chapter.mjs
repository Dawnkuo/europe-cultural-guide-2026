import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { createServer } from 'vite';
import { chromium } from 'playwright';
import { githubPreview } from './github-preview-server.mjs';

const slug = process.env.QA_GUIDE ?? 'accademia-florence';
const vite = await createServer({ configFile: false, cacheDir: 'node_modules/.vite-chapter-audit', server: { middlewareMode: true } });
let guide, bindings;
try {
  const { guideCatalog } = await vite.ssrLoadModule('/app/data/guides.ts');
  const { guideWorkLocations } = await vite.ssrLoadModule('/app/data/guide-experience.ts');
  guide = guideCatalog.find(guide => guide.slug === slug);
  bindings = guideWorkLocations[slug] ?? {};
  assert.ok(guide);
} finally { await vite.close(); }
const preview = process.env.QA_BUILD === '1' ? await githubPreview() : null;
const origin = preview?.url ?? process.env.QA_ORIGIN ?? 'http://localhost:55910';
const offline = process.env.QA_OFFLINE === '1';
const output = process.env.QA_OUTPUT ?? `work/experience/${slug}-chapter`;
await mkdir(output, { recursive: true });
const report = { slug, origin, offline, cases: [] };
const browser = await chromium.launch({ channel: 'chrome' });
try {
  for (const width of (process.env.QA_WIDTHS ?? (offline ? '390' : '1440,390,320')).split(',').map(Number)) {
    const context = await browser.newContext({ viewport: { width, height: 960 }, reducedMotion: 'reduce', serviceWorkers: offline ? 'allow' : 'block' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    if (offline) {
      const manifest = await fetch(`${origin}/guide-precache.json`).then(response => response.json());
      report.revision = manifest.revision;
      await page.goto(`${origin}/`, { waitUntil: 'domcontentloaded' });
      await page.evaluate(async () => { await navigator.serviceWorker.register(`${location.pathname}sw.js`); await navigator.serviceWorker.ready; });
      await page.waitForFunction(async revision => {
        const key = (await caches.keys()).find(key => key.endsWith(revision));
        return key && Boolean(await (await caches.open(key)).match(`${location.pathname}offline-ready`));
      }, manifest.revision, { timeout: 240000 });
      await context.setOffline(true);
    }
    const url = `${origin}/guides/${slug}/`;
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.locator('#guide-highlights').scrollIntoViewIfNeeded();
    const highlights = page.locator('#guide-highlights');
    assert.equal(await highlights.locator('.highlight-browser__grid article').count(), guide.highlights.length);
    await highlights.getByRole('searchbox').fill('zzzz-no-result');
    assert.equal(await highlights.locator('.highlight-browser__grid article').count(), 0);
    await highlights.getByRole('searchbox').fill('');
    assert.equal(await highlights.locator('.highlight-browser__grid article').count(), guide.highlights.length);
    await page.screenshot({ path: `${output}/catalog-${width}.png` });
    for (const work of guide.highlights) {
      await page.goto(`${url}#work-${work.id}`, { waitUntil: 'networkidle' });
      const detail = page.locator('.highlight-detail');
      await detail.getByRole('heading', { name: work.title, exact: true }).waitFor();
      await detail.locator('.highlight-detail__image img').first().evaluate(image => image.decode());
      assert.ok(await detail.locator('ol li').count() >= 3);
      assert.equal(await detail.getByText(work.background, { exact: true }).count(), 1);
      await page.screenshot({ path: `${output}/${work.id}-${width}-detail.png` });
      await detail.locator('ol li').last().scrollIntoViewIfNeeded();
      assert.equal(await detail.evaluate(node => node.scrollWidth > node.clientWidth + 1), false);
      await page.screenshot({ path: `${output}/${work.id}-${width}-reading.png` });
      await detail.getByRole('button', { name: /放大查看/ }).click();
      const viewer = page.locator('.artwork-viewer');
      await viewer.locator('.artwork-viewer__canvas').waitFor();
      const galleryCount = work.gallery?.length ?? 1;
      for (let index = 0; index < galleryCount; index++) {
        await viewer.locator('img').evaluate(image => image.decode());
        const geometry = await viewer.locator('.artwork-viewer__stage').evaluate(stage => {
          const image = stage.querySelector('img');
          const a = stage.getBoundingClientRect(), b = image.getBoundingClientRect();
          return { fit: getComputedStyle(image).objectFit, contained: b.left >= a.left - 1 && b.top >= a.top - 1 && b.right <= a.right + 1 && b.bottom <= a.bottom + 1 };
        });
        assert.equal(geometry.fit, 'contain');
        assert.equal(geometry.contained, true);
        await page.screenshot({ path: `${output}/${work.id}-${width}-image-${index + 1}.png` });
        if (index < galleryCount - 1) await viewer.getByRole('button', { name: '下一张图片', exact: true }).click();
      }
      await viewer.getByRole('button', { name: '放大图片', exact: true }).click();
      await viewer.getByRole('button', { name: '重置图片', exact: true }).click();
      await page.keyboard.press('Escape');
      const placeId = bindings[work.id]?.placeIds[0];
      const locate = detail.getByRole('button', { name: /在地图中定位|定位所在区域/ });
      if (placeId) {
        await locate.first().click();
        await page.waitForFunction(id => document.querySelector(`[data-place-id="${id}"] button`)?.getAttribute('aria-pressed') === 'true', placeId);
        assert.equal(await page.getByRole('button', { name: '2D 俯视', exact: true }).getAttribute('aria-pressed'), 'true');
        await page.locator('.guide-room-works button').filter({ has: page.getByText(work.title, { exact: true }) }).click();
        await detail.getByRole('heading', { name: work.title, exact: true }).waitFor();
      } else assert.equal(await locate.count(), 0);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
      await detail.getByRole('button', { name: '关闭作品详情', exact: true }).click();
      report.cases.push({ id: work.id, width, galleryCount, placeId, passed: true });
      await writeFile(`${output}/report.json`, `${JSON.stringify(report, null, 2)}\n`);
      console.log(`${width} ${work.id}: pass`);
    }
    assert.deepEqual(errors, []);
    await context.close();
  }
} finally {
  await browser.close();
  await preview?.close();
}
