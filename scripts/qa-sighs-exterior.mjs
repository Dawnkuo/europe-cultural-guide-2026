import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { githubPreview } from './github-preview-server.mjs';

const output = process.env.QA_OUTPUT ?? 'work/experience/sighs-exterior';
await mkdir(output, { recursive: true });
const preview = process.env.QA_BUILD ? await githubPreview() : null;
const origin = preview?.url ?? 'http://localhost:55910';
const browser = await chromium.launch({ channel: 'chrome' });
const report = [];
try {
  const revision = preview ? await (await fetch(`${origin}/guide-precache.json`)).json() : null;
  for (const width of (process.env.QA_WIDTHS ?? '1440,820,390,320').split(',').map(Number)) {
    const page = await browser.newPage({ viewport: { width, height: 960 }, reducedMotion: 'reduce', hasTouch: width < 500, isMobile: width < 500 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    if (process.env.QA_OFFLINE) {
      assert.ok(revision);
      await page.goto(`${origin}/`, { waitUntil: 'domcontentloaded' });
      await page.evaluate(async () => { await navigator.serviceWorker.register(`${location.pathname}sw.js`); await navigator.serviceWorker.ready; });
      await page.waitForFunction(async revision => {
        const key = (await caches.keys()).find(key => key.endsWith(revision));
        return key && Boolean(await (await caches.open(key)).match(`${location.pathname}offline-ready`));
      }, revision.revision, { timeout: 240000 });
      await page.context().setOffline(true);
    }
    await page.goto(`${origin}/guides/bridge-of-sighs/`, { waitUntil: 'networkidle' });
    const section = page.locator('.guide-spatial-3d');
    await section.scrollIntoViewIfNeeded();
    const canvas = page.locator('.guide-spatial-3d__canvas');
    await canvas.evaluate(element => element.scrollIntoView({ block: 'center' }));
    await page.waitForFunction(() => document.querySelector('.guide-spatial-3d__canvas')?.dataset.rendered === 'true');
    const data = await canvas.evaluate(element => Object.fromEntries(Object.entries(element.dataset)));
    assert.equal(data.model, 'sighs-double-passage');
    assert.equal(JSON.parse(data.features)['open-window-frame'], 4);
    assert.ok(Number(data.drawCalls) <= 10);
    const shot = await canvas.screenshot({ path: `${output}/${width}-overview.png` });
    const { data: pixels, info } = await sharp(shot).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    let count = 0, minX = info.width, maxX = 0, minY = info.height, maxY = 0;
    for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
      const i = (y * info.width + x) * info.channels;
      if (pixels[i] > 120 && pixels[i + 1] > 110 && pixels[i + 2] > 85) {
        count++; minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      }
    }
    assert.ok(count > 2000);
    assert.ok(minX > 5 && maxX < info.width - 5 && minY > 5 && maxY < info.height - 5, 'Whole bridge must fit');
    assert.ok(maxX - minX > info.width * 0.60 || maxY - minY > info.height * 0.60, 'Bridge must occupy its frame');
    const tools = await page.locator('.guide-spatial-3d__toolbar').boundingBox();
    const box = await canvas.boundingBox();
    assert.ok(box.y >= tools.y + tools.height);
    const home = await canvas.getAttribute('data-camera');
    const cameras = [];
    for (const [id, label] of [['south', '南面·稻草桥方向'], ['north', '北面·卡诺尼卡桥方向'], ['arch', '桥腹拱洞']]) {
      const button = page.getByRole('button', { name: label, exact: true });
      await button.click();
      assert.equal(await button.getAttribute('aria-pressed'), 'true');
      await canvas.evaluate(element => element.scrollIntoView({ block: 'center' }));
      await page.waitForFunction(previous => document.querySelector('.guide-spatial-3d__canvas')?.dataset.camera !== previous, cameras.at(-1) ?? home);
      cameras.push(await canvas.getAttribute('data-camera'));
      await canvas.screenshot({ path: `${output}/${width}-${id}.png` });
    }
    assert.ok(Number(cameras[0].split(',')[2]) > 0 && Number(cameras[1].split(',')[2]) < 0);
    await page.getByRole('button', { name: '重置三维视角', exact: true }).click();
    await page.waitForFunction(expected => document.querySelector('.guide-spatial-3d__canvas')?.dataset.camera === expected, home);
    await canvas.focus(); await page.keyboard.press('ArrowRight');
    await page.waitForFunction(expected => document.querySelector('.guide-spatial-3d__canvas')?.dataset.camera !== expected, home);
    await canvas.evaluate(element => element.scrollIntoView({ block: 'center' }));
    const dragBox = await canvas.boundingBox(), before = await canvas.getAttribute('data-camera');
    await page.mouse.move(dragBox.x + dragBox.width / 2, dragBox.y + dragBox.height / 2);
    await page.mouse.down(); await page.mouse.move(dragBox.x + dragBox.width * 0.7, dragBox.y + dragBox.height * 0.55, { steps: 10 }); await page.mouse.up();
    await page.waitForFunction(expected => document.querySelector('.guide-spatial-3d__canvas')?.dataset.camera !== expected, before);
    if (width < 500) {
      const session = await page.context().newCDPSession(page), previous = await canvas.getAttribute('data-camera');
      const center = { x: dragBox.x + dragBox.width / 2, y: dragBox.y + dragBox.height / 2 };
      await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ id: 0, x: center.x - 24, y: center.y }, { id: 1, x: center.x + 24, y: center.y }] });
      for (let step = 1; step <= 6; step++) await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ id: 0, x: center.x - 24 - step * 4, y: center.y }, { id: 1, x: center.x + 24 + step * 4, y: center.y }] });
      await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await page.waitForFunction(expected => document.querySelector('.guide-spatial-3d__canvas')?.dataset.camera !== expected, previous);
      await session.detach();
    }
    await canvas.evaluate(element => element.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
    const fallback = page.locator('.guide-spatial-3d__fallback img');
    await fallback.waitFor();
    await fallback.evaluate(image => image.decode());
    assert.equal(await fallback.evaluate(image => image.naturalWidth), 1440);
    await page.screenshot({ path: `${output}/${width}-fallback.png` });
    await page.getByRole('button', { name: '重新加载外观', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('.guide-spatial-3d__canvas')?.dataset.rendered === 'true');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
    assert.deepEqual(errors, []);
    report.push({ width, revision: revision?.revision, offline: Boolean(process.env.QA_OFFLINE), features: JSON.parse(data.features), drawCalls: Number(data.drawCalls), triangles: Number(data.triangles), count, cameras, passed: true });
    await page.close();
  }
} finally {
  await browser.close(); await preview?.close();
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
}
console.log(JSON.stringify(report.map(({ width, passed, drawCalls, triangles }) => ({ width, passed, drawCalls, triangles }))));
