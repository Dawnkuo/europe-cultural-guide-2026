import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import sharp from 'sharp';

const origin = process.env.QA_ORIGIN ?? 'http://localhost:55910';
const output = process.env.QA_OUTPUT ?? 'work/experience/braccio-nuovo-qa';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const report = [];
try {
  for (const width of [1440, 820, 390, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 960 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${origin}/guides/vatican-museums/`, { waitUntil: 'networkidle' });
    assert.equal(await page.getByRole('button', { name: '2D 俯视', exact: true }).getAttribute('aria-pressed'), 'true');
    await page.getByRole('button', { name: '外观', exact: true }).click();
    const canvas = page.locator('.guide-spatial-3d__canvas');
    await page.waitForFunction(() => document.querySelector('.guide-spatial-3d__canvas')?.dataset.rendered === 'true');
    const result = { width, views: [], errors };
    assert.equal(await canvas.getAttribute('data-model'), 'braccio-nuovo-plan-cutaway-v1');
    const initialCamera = await canvas.getAttribute('data-camera');
    const stageSize = await canvas.boundingBox();
    assert.ok(stageSize.width > width * 0.75, 'map was squeezed into the legacy sidebar column');
    for (const name of ['新翼全景', '八柱门廊', '半圆厅', '长廊']) {
      await page.getByRole('group', { name: '新翼建筑范围' }).getByRole('button', { name, exact: true }).click();
      await page.evaluate(() => window.scrollBy(0, document.querySelector('.guide-spatial-3d__canvas').getBoundingClientRect().top - 160));
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      if (name === '新翼全景') assert.equal(await canvas.getAttribute('data-camera'), initialCamera, 'initial view must use the same reviewed framing as reset');
      const png = await canvas.screenshot({ path: `${output}/${width}-${name}.png` });
      const { data } = await sharp(png).resize(200, 200).removeAlpha().raw().toBuffer({ resolveWithObject: true });
      let light = 0;
      for (let i = 0; i < data.length; i += 3) if (data[i] > 100 && data[i + 1] > 90 && data[i + 2] > 65) light++;
      assert.ok(light > 900, `${width} ${name}: too little visible geometry (${light})`);
      result.views.push({ name, lightPixels: light, drawCalls: Number(await canvas.getAttribute('data-draw-calls')), triangles: Number(await canvas.getAttribute('data-triangles')) });
    }
    await page.getByRole('button', { name: '重置三维视角', exact: true }).click();
    await canvas.focus();
    const before = await canvas.getAttribute('data-camera');
    await page.keyboard.press('ArrowRight');
    await page.waitForFunction(previous => document.querySelector('.guide-spatial-3d__canvas').dataset.camera !== previous, before);
    const rect = await canvas.boundingBox();
    const beforeDrag = await canvas.getAttribute('data-camera');
    await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
    await page.mouse.down();
    await page.mouse.move(rect.x + rect.width / 2 + 50, rect.y + rect.height / 2 + 25, { steps: 8 });
    await page.mouse.up();
    await page.waitForFunction(previous => document.querySelector('.guide-spatial-3d__canvas').dataset.camera !== previous, beforeDrag);
    await page.getByRole('button', { name: '放大外观', exact: true }).click();
    await canvas.focus();
    await page.keyboard.press('Home');
    assert.equal(await page.getByRole('button', { name: '新翼全景', exact: true }).getAttribute('aria-pressed'), 'true');
    if (width === 1440) {
      await page.setViewportSize({ width: 390, height: 960 });
      await page.evaluate(() => window.scrollBy(0, document.querySelector('.guide-spatial-3d__canvas').getBoundingClientRect().top - 160));
      await page.waitForFunction(previous => document.querySelector('.guide-spatial-3d__canvas').dataset.camera !== previous, initialCamera);
      await canvas.screenshot({ path: `${output}/desktop-resized-to-phone.png` });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
      await page.setViewportSize({ width: 1440, height: 960 });
      await page.getByRole('button', { name: '重置三维视角', exact: true }).click();
      result.responsiveResize = true;
    }
    if (width <= 390) {
      await page.evaluate(() => window.scrollBy(0, document.querySelector('.guide-spatial-3d__canvas').getBoundingClientRect().top - 160));
      const box = await canvas.boundingBox();
      const x = box.x + box.width / 2, y = box.y + box.height / 2;
      const prior = await canvas.getAttribute('data-camera');
      const cdp = await page.context().newCDPSession(page);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x - 35, y }, { x: x + 35, y }] });
      for (let delta = 40; delta <= 70; delta += 5) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - delta, y }, { x: x + delta, y }] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await page.waitForFunction(previous => document.querySelector('.guide-spatial-3d__canvas').dataset.camera !== previous, prior);
      await page.getByRole('button', { name: '八柱门廊', exact: true }).click();
      assert.equal(await page.getByRole('button', { name: '八柱门廊', exact: true }).getAttribute('aria-pressed'), 'true');
      result.emulatedPinch = true;
      await cdp.detach();
    }
    await page.getByText('新翼平面', { exact: true }).click();
    const plan = page.getByRole('img', { name: '新翼陈列馆平面：长廊、二十八个壁龛、半圆厅和八柱门廊', exact: true });
    await plan.screenshot({ path: `${output}/${width}-plan.png` });
    assert.equal(await plan.locator('[data-feature-id^="portico-column-"]').count(), 8);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
    for (let index = 0; index < 3; index++) {
      await page.getByRole('button', { name: '内部', exact: true }).click();
      assert.equal(await page.getByRole('button', { name: '2D 俯视', exact: true }).getAttribute('aria-pressed'), 'true');
      await page.getByRole('button', { name: '外观', exact: true }).click();
      await page.waitForFunction(() => document.querySelector('.guide-spatial-3d__canvas')?.dataset.rendered === 'true');
    }
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForFunction(() => document.querySelector('.guide-spatial-3d__canvas')?.dataset.suspended === 'true');
    await canvas.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => document.querySelector('.guide-spatial-3d__canvas')?.dataset.suspended === 'false');
    if (width === 1440) {
      await canvas.evaluate(canvas => canvas.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
      await page.getByText('外观模型暂时无法显示，导览内容仍可阅读。', { exact: true }).waitFor();
      assert.equal(await page.locator('.guide-spatial-3d__fallback svg [data-feature-id^="portico-column-"]').count(), 8);
      await page.getByRole('button', { name: '重新加载外观', exact: true }).click();
      await page.waitForFunction(() => document.querySelector('.guide-spatial-3d__canvas')?.dataset.rendered === 'true');
      result.contextLossRetry = true;
    }
    assert.deepEqual(errors, []);
    result.keyboard = true;
    result.drag = true;
    result.viewRoundTrips = 3;
    report.push(result);
    await page.close();
    console.log(JSON.stringify({ width, passed: true }));
  }
  const page = await browser.newPage({ reducedMotion: 'reduce', serviceWorkers: 'block' });
  await page.addInitScript(() => {
    // oxlint-disable-next-line typescript/unbound-method -- Called with the original canvas receiver below.
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return type.startsWith('webgl') ? null : getContext.call(this, type, ...args);
    };
  });
  await page.goto(`${origin}/guides/vatican-museums/`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: '外观', exact: true }).click();
  await page.getByText('外观模型暂时无法显示，导览内容仍可阅读。', { exact: true }).waitFor();
  assert.equal(await page.locator('.guide-spatial-3d__fallback svg [data-feature-id^="portico-column-"]').count(), 8);
  await page.getByRole('button', { name: '内部', exact: true }).click();
  assert.equal(await page.getByRole('button', { name: '2D 俯视', exact: true }).getAttribute('aria-pressed'), 'true');
  report.push({ blockedWebGLKeepsSourcePlanAndInterior: true });
  await page.close();
} finally {
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
  await browser.close();
}
