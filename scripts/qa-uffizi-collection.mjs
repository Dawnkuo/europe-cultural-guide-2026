import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { githubPreview } from './github-preview-server.mjs';

const preview = process.env.QA_BUILD === '1' ? await githubPreview() : null;
const origin = preview?.url ?? process.env.QA_ORIGIN ?? 'http://localhost:55910';
const offline = process.env.QA_OFFLINE === '1';
const output = process.env.QA_OUTPUT ?? 'work/experience/uffizi-collection';
const guide = JSON.parse(await readFile('work/experience/inventory.json', 'utf8')).find(guide => guide.slug === 'uffizi');
const rooms = {
  'L2-A9-1': ['uffizi-highlight-1', 'uffizi-birth-venus'],
  'L2-A25-1': ['uffizi-urbino-diptych'],
  'L2-A35-1': ['uffizi-highlight-2', 'uffizi-leonardo-magi', 'uffizi-baptism'],
  'L2-A38-1': ['uffizi-highlight-3', 'uffizi-goldfinch'],
  'L2-A4-1': ['uffizi-ognissanti', 'uffizi-santa-trinita', 'uffizi-rucellai'],
  'L2-A5-1': ['uffizi-martini-annunciation'], 'L2-A7-1': ['uffizi-gentile-magi'],
  'L2-A8-1': ['uffizi-saint-anne', 'uffizi-san-romano'], 'L1-C6-1': ['uffizi-lippi-madonna'],
  'L1-D23-1': ['uffizi-venus-urbino'],
  'L1-E4-1': ['uffizi-medusa', 'uffizi-artemisia-judith'], 'L1-E5-1': ['uffizi-bacchus'],
  'L1-D4-1': ['uffizi-long-neck'], 'L2-A13-1': ['uffizi-portinari'],
  'L2-A20-1': ['uffizi-durer-magi'], 'L1-D15-1': ['uffizi-eleonora'],
  'L1-D12-1': ['uffizi-musical-angel'], 'L2-A39-1': ['uffizi-niobe'],
  'L2-A16-1': ['uffizi-wrestlers', 'uffizi-medici-venus'], 'L1-C1-1': ['uffizi-raphael-self'],
};
const locationByWork = new Map(Object.entries(rooms).flatMap(([place, ids]) => ids.map(id => [id, place])));
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const report = { origin, offline, cases: [] };
async function assertFullImage(viewer) {
  await viewer.locator('.artwork-viewer__canvas').waitFor();
  await viewer.locator('img').evaluate(image => image.decode());
  const geometry = await viewer.locator('.artwork-viewer__stage').evaluate(stage => {
    const canvas = stage.querySelector('.artwork-viewer__canvas');
    const image = stage.querySelector('img');
    const a = stage.getBoundingClientRect();
    const b = image.getBoundingClientRect();
    const transform = new DOMMatrixReadOnly(getComputedStyle(canvas).transform);
    return { fit: getComputedStyle(image).objectFit, transition: getComputedStyle(canvas).transitionProperty,
      identity: transform.isIdentity, contained: b.left >= a.left - 1 && b.top >= a.top - 1 && b.right <= a.right + 1 && b.bottom <= a.bottom + 1 };
  });
  assert.equal(geometry.fit, 'contain');
  assert.equal(geometry.transition, 'none');
  assert.equal(geometry.identity, true);
  assert.equal(geometry.contained, true);
}
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
    await page.goto(`${origin}/guides/uffizi/`, { waitUntil: 'networkidle' });
    const highlights = page.locator('#guide-highlights');
    await highlights.scrollIntoViewIfNeeded();
    assert.equal(await highlights.locator('.highlight-browser__grid article').count(), guide.highlights.length);
    await highlights.getByRole('combobox', { name: '分类', exact: true }).selectOption('北方文艺复兴');
    assert.equal(await highlights.locator('.highlight-browser__grid article').count(), 2);
    await highlights.getByRole('combobox', { name: '分类', exact: true }).selectOption('古代雕塑');
    assert.equal(await highlights.locator('.highlight-browser__grid article').count(), 3);
    await highlights.getByRole('combobox', { name: '分类', exact: true }).selectOption('全部');
    await highlights.getByLabel('筛选展厅', { exact: true }).selectOption('L2-A16-1');
    assert.equal(await highlights.locator('.highlight-browser__grid article').count(), 2);
    await highlights.getByLabel('筛选展厅', { exact: true }).selectOption('all');
    assert.equal(await highlights.locator('.highlight-browser__grid article').count(), guide.highlights.length);
    for (const work of guide.highlights) {
      await page.goto(`${origin}/guides/uffizi/#work-${work.id}`, { waitUntil: 'networkidle' });
      const detail = page.locator('.highlight-detail');
      await detail.getByRole('heading', { name: work.title, exact: true }).waitFor();
      await detail.locator('.highlight-detail__image img').first().evaluate(image => image.decode());
      assert.ok(await detail.evaluate(element => element.scrollTop <= 2));
      assert.ok(await detail.locator('ol li').count() >= 3);
      assert.equal(await detail.getByText(work.background, { exact: true }).count(), 1);
      await page.screenshot({ path: `${output}/${work.id}-${width}-detail.png` });
      await detail.locator('ol li').last().scrollIntoViewIfNeeded();
      assert.equal(await detail.evaluate(element => element.scrollWidth > element.clientWidth + 1), false);
      await page.screenshot({ path: `${output}/${work.id}-${width}-reading.png` });
      await detail.getByRole('button', { name: /放大查看/ }).click();
      const viewer = page.locator('.artwork-viewer');
      await viewer.locator('img').evaluate(image => image.decode());
      await assertFullImage(viewer);
      await viewer.getByRole('button', { name: '放大图片', exact: true }).click();
      await viewer.getByRole('button', { name: '重置图片', exact: true }).click();
      const galleryCount = work.gallery?.length ?? 1;
      for (let index = 1; index <= galleryCount; index++) {
        await viewer.locator('img').evaluate(image => image.decode());
        await assertFullImage(viewer);
        await page.screenshot({ path: `${output}/${work.id}-${width}-image-${index}.png` });
        if (index < galleryCount) {
          await viewer.getByRole('button', { name: '下一张图片', exact: true }).click();
          assert.equal(await viewer.getByLabel('图片缩放比例').textContent(), '100%');
        }
      }
      await page.keyboard.press('Escape');
      const place = locationByWork.get(work.id);
      if (place) {
        await detail.getByRole('button', { name: /在地图中定位/ }).first().click();
        await page.waitForFunction(id => document.querySelector(`[data-place-id="${id}"] button`)?.getAttribute('aria-pressed') === 'true', place);
        const floor = place.startsWith('L1-') ? '一层 · B / C / D / E' : '二层 · A';
        assert.equal(await page.locator('.architectural-map__floors').getByRole('button', { name: floor, exact: true }).getAttribute('aria-pressed'), 'true');
        await page.locator('.guide-room-works button').filter({ has: page.getByText(work.title, { exact: true }) }).click();
        await detail.getByRole('heading', { name: work.title, exact: true }).waitFor();
      } else {
        assert.equal(await detail.getByRole('button', { name: /在地图中定位|定位所在区域/ }).count(), 0);
        assert.match(await detail.locator('.highlight-detail__note').textContent(), /地图|定位/);
      }
      assert.equal(await page.locator('.artwork-viewer').count(), 0);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
      await detail.getByRole('button', { name: '关闭作品详情', exact: true }).click();
      const record = { id: work.id, width, galleryCount, deepLink: true, mapRoundTrip: place ?? null, passed: true };
      report.cases.push(record);
      await writeFile(`${output}/report.json`, `${JSON.stringify(report, null, 2)}\n`);
      console.log(JSON.stringify(record));
    }
    assert.deepEqual(errors, []);
    await context.close();
  }
} finally {
  await browser.close();
  await preview?.close();
  await writeFile(`${output}/report.json`, `${JSON.stringify(report, null, 2)}\n`);
}
