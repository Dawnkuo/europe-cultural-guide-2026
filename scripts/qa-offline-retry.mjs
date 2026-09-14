import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { githubPreview } from './github-preview-server.mjs';

const root = '/europe-cultural-guide-2026';
const output = 'work/experience/offline-retry';
const unavailable = new Set([`${root}/images/st-peters-hero.jpg`]);
const preview = await githubPreview('dist/client', root, unavailable);
const manifest = JSON.parse(await readFile('dist/client/guide-precache.json', 'utf8'));
const browser = await chromium.launch({ channel: 'chrome' });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'allow', reducedMotion: 'reduce' });
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const report = { revision: manifest.revision, initialFailure: false, retry: false, offlineVariants: [], errors };
await mkdir(output, { recursive: true });

try {
  await page.goto(`${preview.url}/`, { waitUntil: 'domcontentloaded' });
  const trigger = page.locator('.offline-mark').first();
  await page.waitForFunction(() => document.querySelector('.offline-mark')?.textContent.includes('未完成'), null, { timeout: 60000 });
  await trigger.click();
  const panel = page.getByRole('dialog', { name: '离线导览', exact: true });
  assert.match(await panel.locator('.offline-panel-status').textContent(), /未完成/);
  assert.equal(await panel.getByRole('button', { name: '重试下载' }).isEnabled(), true);
  await page.screenshot({ path: `${output}/failed-mobile.png` });
  report.initialFailure = true;

  unavailable.clear();
  await panel.getByRole('button', { name: '重试下载' }).click();
  await page.waitForFunction(() => document.querySelector('dialog[open] progress')?.getAttribute('max') > 0, null, { timeout: 30000 });
  await page.waitForFunction(() => document.querySelector('dialog[open] .offline-panel-status')?.textContent.includes('已缓存'), null, { timeout: 240000 });
  const counts = await panel.locator('progress').evaluate(progress => ({ completed: progress.value, total: progress.max }));
  assert.equal(counts.completed, counts.total);
  assert.ok(counts.total > 100);
  const ready = await page.evaluate(async ({ root, revision }) => {
    const key = (await caches.keys()).find(name => name.endsWith(revision));
    return key && Boolean(await (await caches.open(key)).match(`${root}/offline-ready`));
  }, { root, revision: manifest.revision });
  assert.equal(ready, true);
  report.retry = true;
  report.resources = counts.total;
  await page.screenshot({ path: `${output}/ready-mobile.png` });
  await panel.getByRole('button', { name: '关闭离线状态' }).click();
  assert.equal(await trigger.evaluate(element => element === document.activeElement), true);

  await context.setOffline(true);
  for (const route of ['/?v=older-release', '/itinerary/index.html?v=older-release', '/guides/pantheon?v=older-release', '/guides/vatican-museums/?v=older-release#work-vatican-museums-highlight-1']) {
    await page.goto(`${preview.url}${route}`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { level: 1 }).waitFor();
    assert.equal(await page.locator('body').innerText().then(text => /This page couldn.t load|RUNTIME ERROR/.test(text)), false);
    if (route.includes('/guides/')) {
      await page.locator('.architectural-map').waitFor();
      assert.equal(await page.getByRole('button', { name: '2D 俯视', exact: true }).getAttribute('aria-pressed'), 'true');
    }
    report.offlineVariants.push(route);
  }
  const detail = page.getByRole('dialog', { name: '基督变容', exact: true });
  await detail.waitFor();
  await detail.getByRole('button', { name: /查看图片 2/ }).click();
  const photo = detail.getByRole('img', { name: '《基督变容》上半部：基督、摩西与以利亚', exact: true });
  assert.ok(await photo.evaluate(async image => { await image.decode(); return image.naturalWidth >= 900; }));
  await page.screenshot({ path: `${output}/unvisited-gallery-offline-mobile.png` });
  report.unvisitedDetailPhoto = true;
  await detail.getByRole('button', { name: /放大查看/ }).click();
  const viewer = page.locator('.artwork-viewer');
  await viewer.getByRole('button', { name: '放大图片', exact: true }).click();
  assert.ok(Number.parseInt(await viewer.getByLabel('图片缩放比例').textContent()) > 100);
  assert.ok(await viewer.getByRole('img').evaluate(async image => { await image.decode(); return image.naturalWidth >= 900; }));
  await viewer.screenshot({ path: `${output}/unvisited-zoom-offline-mobile.png` });
  await page.keyboard.press('Escape');
  assert.equal(await detail.isVisible(), true);
  report.unvisitedZoomModule = true;
  await page.keyboard.press('Escape');
  report.addedWorks = [];
  for (const id of [
    'vatican-nile', 'vatican-stefaneschi', 'vatican-expulsion', 'vatican-deluge', 'vatican-libyan-sibyl', 'vatican-angelico-madonna', 'vatican-borgia', 'vatican-momo', 'vatican-djedmut', 'vatican-lady-shroud', 'vatican-hercules', 'vatican-candelabra', 'vatican-sphere', 'vatican-sistine-hall', 'vatican-dogmatic', 'peter-necropolis',
    'vatican-keys', 'vatican-disputation', 'vatican-fire-borgo', 'vatican-museums-highlight-4', 'vatican-foligno', 'vatican-melozzo', 'vatican-augustus', 'vatican-todi', 'vatican-round-basin', 'vatican-tapestry', 'vatican-pigna', 'vatican-fibula',
    'st-peters-basilica-highlight-1', 'st-peters-basilica-highlight-2', 'st-peters-basilica-highlight-3', 'st-peters-basilica-highlight-5', 'peter-bronze', 'peter-alexander', 'st-peters-square-highlight-1', 'st-peters-square-highlight-2',
    'vatican-apoxyomenos', 'vatican-braccio', 'vatican-temptations', 'vatican-last-supper', 'vatican-anubis',
    'st-peters-basilica-highlight-4', 'st-peters-basilica-highlight-6', 'peter-longinus', 'peter-clement', 'peter-gregory', 'peter-filarete', 'peter-holy-door', 'peter-narthex',
  ]) {
    const slug = id.startsWith('st-peters-square-') ? 'st-peters-square' : id.startsWith('peter-') || id.startsWith('st-peters-basilica-') ? 'st-peters-basilica' : 'vatican-museums';
    await page.goto(`${preview.url}/guides/${slug}/?v=older-release#work-${id}`, { waitUntil: 'domcontentloaded' });
    const added = page.locator('.highlight-detail');
    await added.waitFor();
    const photoCount = await added.locator('.highlight-detail__gallery button').count();
    await added.getByRole('button', { name: /放大查看/ }).click();
    const full = page.locator('.artwork-viewer');
    assert.ok(await full.getByRole('img').evaluate(async image => { await image.decode(); return image.naturalWidth >= 900 || image.naturalHeight >= 900; }));
    const seenSources = new Set([await full.getByRole('img').getAttribute('src')]);
    for (let index = 2; index <= photoCount; index++) {
      await full.getByRole('button', { name: '下一张图片', exact: true }).click();
      assert.equal(await full.getByLabel('图片序号').textContent(), `${index} / ${photoCount}`);
      const source = await full.getByRole('img').getAttribute('src');
      assert.equal(seenSources.has(source), false);
      seenSources.add(source);
      assert.ok(await full.getByRole('img').evaluate(async image => { await image.decode(); return image.naturalWidth >= 900 || image.naturalHeight >= 900; }));
    }
    await full.getByRole('button', { name: '放大图片', exact: true }).click();
    assert.ok(Number.parseInt(await full.getByLabel('图片缩放比例').textContent()) > 100);
    await full.screenshot({ path: `${output}/${id}-offline.png` });
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    report.addedWorks.push({ id, decodedOffline: true, zoomOffline: true, photoCount });
  }
  const arbitraryQuery = await page.evaluate(async base => {
    try { await fetch(`${base}/guides/pantheon/?filter=not-a-cached-page`); return true; } catch { return false; }
  }, preview.url);
  assert.equal(arbitraryQuery, false, 'Unknown application queries must not alias cached pages');
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
  assert.deepEqual(errors, []);
  report.passed = true;
} catch (error) {
  report.failure = error.message;
  await page.screenshot({ path: `${output}/unexpected-failure.png` }).catch(() => {});
  throw error;
} finally {
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
  await context.close();
  await browser.close();
  await preview.close();
}
console.log(JSON.stringify(report, null, 2));
