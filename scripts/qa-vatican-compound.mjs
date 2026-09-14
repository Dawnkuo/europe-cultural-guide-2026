import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import sharp from 'sharp';

const origin = process.env.QA_ORIGIN ?? 'http://localhost:55910';
const output = process.env.QA_OUTPUT ?? 'work/experience/vatican-compound-qa';
const widths = (process.env.QA_WIDTHS ?? '1440,820,390,320').split(',').map(Number);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const report = [];
const canvasSelector = '.vatican-campus__three-stage canvas';
async function ready(page) {
  await page.locator('.vatican-campus__three-stage').scrollIntoViewIfNeeded();
  await page.waitForFunction(selector => Number(document.querySelector(selector)?.dataset.frames) > 0, canvasSelector, { timeout: 60000 });
}
async function capture(canvas, path) {
  const image = await canvas.screenshot({ path });
  const { data, info } = await sharp(image).resize(200, 200, { fit: 'fill' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  let detail = 0;
  for (let index = 0; index < data.length; index += info.channels) if (data[index] > 65 && data[index + 1] > 65) detail++;
  assert.ok(detail > 600, `Blank or undersized compound: ${path}, ${detail}`);
  return { detail, camera: await canvas.getAttribute('data-camera'), drawCalls: Number(await canvas.getAttribute('data-draw-calls')), triangles: Number(await canvas.getAttribute('data-triangles')) };
}
try {
  for (const width of widths) {
    const page = await browser.newPage({ viewport: { width, height: 1000 }, reducedMotion: 'reduce', hasTouch: width <= 390, serviceWorkers: 'block' });
    const errors = [];
    const models = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (request.url().endsWith('st-peters-exterior.glb')) models.push(request.url()); });
    await page.goto(`${origin}/guides/vatican-museums/`, { waitUntil: 'networkidle' });
    assert.equal(await page.getByRole('button', { name: '2D 俯视', exact: true }).getAttribute('aria-pressed'), 'true');
    await page.getByRole('button', { name: '馆区总览', exact: true }).click();
    assert.equal(await page.getByRole('button', { name: '2D 馆区', exact: true }).getAttribute('aria-pressed'), 'true');
    assert.equal(models.length, 0, '3D mesh must not load for 2D campus');
    await page.getByRole('button', { name: '3D 馆区', exact: true }).click();
    await ready(page);
    const canvas = page.locator(canvasSelector);
    const campus = page.getByRole('region', { name: '梵蒂冈馆区总览', exact: true });
    const result = { width, views: [], selections: [], errors };
    result.views.push({ id: 'initial', ...await capture(canvas, `${output}/whole-${width}.png`) });
    assert.equal(models.length, 1);
    assert.equal(await canvas.getAttribute('data-focus'), 'campus');
    const list = campus.getByLabel('馆区列表');
    async function selectRegion(name) {
      const frames = Number(await canvas.getAttribute('data-frames'));
      await list.getByRole('button', { name, exact: true }).click();
      await page.evaluate(selector => scrollBy(0, document.querySelector(selector).getBoundingClientRect().top - 160), canvasSelector);
      // A selection made below the canvas can precede its next visible render.
      await page.waitForFunction(({ selector, frames }) => Number(document.querySelector(selector)?.dataset.frames) > frames, { selector: canvasSelector, frames });
    }
    assert.equal(await list.getByRole('button').count(), 14);
    for (const button of await list.getByRole('button').all()) {
      const name = await button.innerText();
      await selectRegion(name);
      assert.equal(await button.getAttribute('aria-pressed'), 'true');
      assert.equal(await campus.locator('.vatican-campus__detail h3').innerText(), name);
      result.selections.push({ name, focus: await canvas.getAttribute('data-focus') });
    }
    for (const [name, id] of [['圣彼得大教堂', 'basilica'], ['圣彼得广场', 'square'], ['西斯廷礼拜堂', 'sistine'], ['松果庭院', 'pigna']]) {
      await selectRegion(name);
      await page.waitForFunction(({ selector, id }) => document.querySelector(selector)?.dataset.focus === id, { selector: canvasSelector, id });
      await page.evaluate(selector => scrollBy(0, document.querySelector(selector).getBoundingClientRect().top - 160), canvasSelector);
      if (id === 'sistine') {
        await page.waitForFunction(selector => document.querySelector(selector)?.dataset.target?.split(',')[1] === '31.00', canvasSelector);
        assert.ok(Number(await canvas.getAttribute('data-zoom')) > 1);
        result.sistineUsesRaisedMeshTarget = true;
      }
      result.views.push({ id, ...await capture(canvas, `${output}/${id}-${width}.png`) });
    }
    await campus.getByRole('button', { name: '显示完整三维馆区', exact: true }).click();
    result.views.push({ id: 'reset', ...await capture(canvas, `${output}/reset-${width}.png`) });
    assert.equal(result.views.at(-1).camera, result.views[0].camera);
    // A selected region is a zoom into the SAME overview, not a new 100% baseline.
    await selectRegion('松果庭院');
    assert.ok(Number(await canvas.getAttribute('data-zoom')) > 1);
    for (let i = 0; i < 10; i++) {
      const out = campus.getByRole('button', { name: '缩小三维馆区', exact: true });
      const previous = Number(await canvas.getAttribute('data-zoom'));
      if (previous <= 1) break;
      await out.click();
      await page.evaluate(selector => scrollBy(0, document.querySelector(selector).getBoundingClientRect().top - 160), canvasSelector);
      try {
        await page.waitForFunction(({ selector, previous }) => Number(document.querySelector(selector)?.dataset.zoom) < previous, { selector: canvasSelector, previous }, { timeout: 6000 });
      } catch (error) {
        await page.screenshot({ path: `${output}/zoom-failure-${width}.png` });
        console.error(JSON.stringify({ width, i, previous, canvas: await canvas.evaluate(c => Object.fromEntries(Object.entries(c.dataset))), buttonDisabled: await out.isDisabled(), button: await out.boundingBox(), stage: await canvas.boundingBox() }));
        throw error;
      }
    }
    await page.waitForFunction(selector => document.querySelector(selector)?.dataset.zoom === '1', canvasSelector);
    assert.equal(await canvas.getAttribute('data-focus'), 'campus');
    assert.equal(await canvas.getAttribute('data-camera'), result.views[0].camera);
    result.focusZoomOutReturnsWhole = true;
    const stage = campus.getByRole('application', { name: '梵蒂冈馆区三维地图', exact: true });
    await stage.focus();
    await page.keyboard.press('+');
    await page.waitForFunction(selector => Number(document.querySelector(selector).dataset.zoom) > 1, canvasSelector);
    const before = await canvas.getAttribute('data-camera');
    await page.keyboard.press('ArrowRight');
    await page.waitForFunction(({ selector, before }) => document.querySelector(selector).dataset.camera !== before, { selector: canvasSelector, before });
    const beforeDrag = await canvas.getAttribute('data-camera');
    const beforeDragImage = await canvas.screenshot();
    const bounds = await canvas.boundingBox();
    await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    await page.mouse.down();
    await page.mouse.move(bounds.x + bounds.width / 2 + 60, bounds.y + bounds.height / 2 + 35, { steps: 10 });
    await page.mouse.up();
    await page.waitForFunction(({ selector, before }) => document.querySelector(selector).dataset.camera !== before, { selector: canvasSelector, before: beforeDrag });
    const afterDragImage = await canvas.screenshot({ path: `${output}/rotated-${width}.png` });
    assert.notDeepEqual(afterDragImage, beforeDragImage, 'Rotation must change rendered pixels, not only camera metadata');
    result.rotationPixelsChanged = true;
    await stage.focus(); await page.keyboard.press('Home');
    if (width <= 390) {
      const client = await page.context().newCDPSession(page);
      const points = d => [-1, 1].map((sign, id) => ({ x: bounds.x + bounds.width / 2 + sign * d, y: bounds.y + bounds.height / 2, id }));
      try {
        await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: points(25) });
        for (let d = 30; d <= 60; d += 5) await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: points(d) });
        await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await page.waitForFunction(selector => Number(document.querySelector(selector).dataset.zoom) > 1.2, canvasSelector);
        result.emulatedPinch = true;
      } finally { await client.detach(); }
    }
    await page.evaluate(() => scrollTo(0, 0));
    const idle = await canvas.getAttribute('data-frames');
    await page.waitForTimeout(250);
    assert.equal(await canvas.getAttribute('data-frames'), idle, 'Offscreen scene must not animate');
    await canvas.scrollIntoViewIfNeeded();
    await campus.getByRole('button', { name: '显示完整三维馆区' }).click();
    await page.evaluate(() => scrollBy(0, document.querySelector('.vatican-campus').getBoundingClientRect().top - 170));
    await page.screenshot({ path: `${output}/viewport-${width}.png` });
    await list.getByRole('button', { name: '西侧长廊', exact: true }).click();
    await page.getByRole('button', { name: '2D 馆区', exact: true }).click();
    assert.equal(await list.getByRole('button', { name: '西侧长廊', exact: true }).getAttribute('aria-pressed'), 'true');
    await campus.getByRole('button', { name: '地图廊', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('[data-place-id="second-8-1"] button')?.getAttribute('aria-pressed') === 'true');
    assert.equal(await page.getByRole('button', { name: '2D 俯视', exact: true }).getAttribute('aria-pressed'), 'true');
    await page.getByRole('button', { name: '馆区总览', exact: true }).click();
    await page.getByRole('button', { name: '3D 馆区', exact: true }).click();
    await ready(page);
    await selectRegion('西斯廷礼拜堂');
    await campus.locator('.vatican-campus__links').getByRole('button', { name: '西斯廷礼拜堂', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('[data-place-id="first-12-1"] button')?.getAttribute('aria-pressed') === 'true');
    assert.equal(await page.getByRole('button', { name: '2D 俯视', exact: true }).getAttribute('aria-pressed'), 'true');
    result.sistineExteriorToCanonicalInterior = 'first-12-1';
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
    assert.deepEqual(errors, []);
    report.push(result);
    console.log(JSON.stringify({ width, passed: true }));
    await page.close();
  }
  const page = await browser.newPage({ viewport: { width: 1280, height: 960 }, serviceWorkers: 'block' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${origin}/guides/vatican-museums/`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: '馆区总览', exact: true }).click();
  await page.route('**/models/st-peters-exterior.glb', route => route.fulfill({ status: 503, body: 'unavailable' }));
  await page.getByRole('button', { name: '3D 馆区', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: '三维馆区暂不可用' }).waitFor();
  await page.getByLabel('馆区列表').getByRole('button', { name: '松果庭院', exact: true }).click();
  await page.getByRole('button', { name: '返回二维馆区', exact: true }).click();
  assert.equal(await page.getByLabel('馆区列表').getByRole('button', { name: '松果庭院', exact: true }).getAttribute('aria-pressed'), 'true');
  await page.unrouteAll();
  await page.getByRole('button', { name: '3D 馆区', exact: true }).click();
  await ready(page);
  await page.locator(canvasSelector).evaluate(canvas => canvas.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
  await page.getByRole('alert').filter({ hasText: '三维馆区暂不可用' }).waitFor();
  await page.getByRole('button', { name: '重试三维馆区', exact: true }).click();
  await ready(page);
  await page.getByLabel('馆区列表').getByRole('button', { name: '西斯廷礼拜堂', exact: true }).click();
  for (let index = 0; index < 3; index++) {
    await page.locator(canvasSelector).evaluate(canvas => { window.__oldCompoundContext = canvas.getContext('webgl2'); });
    await page.getByRole('button', { name: '2D 馆区', exact: true }).click();
    assert.equal(await page.locator(canvasSelector).count(), 0);
    assert.equal(await page.evaluate(() => window.__oldCompoundContext.isContextLost()), true);
    await page.getByRole('button', { name: '3D 馆区', exact: true }).click();
    await ready(page);
    assert.equal(await page.locator(canvasSelector).count(), 1);
    assert.equal(await page.locator(canvasSelector).getAttribute('data-focus'), 'sistine');
    assert.equal((await page.locator(canvasSelector).getAttribute('data-target')).split(',')[1], '31.00');
  }
  await page.getByRole('button', { name: '显示完整三维馆区', exact: true }).click();
  await page.setViewportSize({ width: 390, height: 960 });
  await ready(page);
  await capture(page.locator(canvasSelector), `${output}/resize-390.png`);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
  assert.deepEqual(errors, []);
  report.push({ failedFetch: true, selectionRetained: true, realContextLossRecovery: true, remountsDisposed: 3, sistineRefocusedAfterRemount: true, responsiveResize: true, errors });
  await page.close();

  const noGl = await browser.newPage({ viewport: { width: 390, height: 960 }, serviceWorkers: 'block' });
  await noGl.addInitScript(() => {
    // oxlint-disable-next-line typescript/unbound-method -- Rebound to each real canvas below with call.
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) { return type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl' ? null : original.call(this, type, ...args); };
  });
  await noGl.goto(`${origin}/guides/vatican-museums/`, { waitUntil: 'networkidle' });
  await noGl.getByRole('button', { name: '馆区总览', exact: true }).click();
  await noGl.getByRole('button', { name: '3D 馆区', exact: true }).click();
  await noGl.getByRole('alert').filter({ hasText: '三维馆区暂不可用' }).waitFor();
  await noGl.getByRole('button', { name: '返回二维馆区', exact: true }).click();
  await noGl.locator('.vatican-campus__canvas img').evaluate(img => img.decode());
  assert.equal(await noGl.getByLabel('馆区列表').getByRole('button').count(), 14);
  report.push({ noWebGLFallback: true });
  await noGl.close();

  const noModule = await browser.newPage({ viewport: { width: 390, height: 960 }, serviceWorkers: 'block' });
  const moduleErrors = [];
  let intercepted = 0;
  noModule.on('pageerror', error => moduleErrors.push(error.message));
  await noModule.route(/\/VaticanCampusScene[^/]*\.(?:js|tsx)(?:\?|$)/, route => { intercepted++; return route.fulfill({ status: 503, body: 'unavailable' }); });
  await noModule.goto(`${origin}/guides/vatican-museums/`, { waitUntil: 'networkidle' });
  await noModule.getByRole('button', { name: '馆区总览', exact: true }).click();
  await noModule.getByRole('button', { name: '3D 馆区', exact: true }).click();
  await noModule.getByRole('alert').filter({ hasText: '三维馆区组件加载失败' }).waitFor();
  assert.ok(intercepted > 0, 'Dynamic module failure must be actually exercised');
  await noModule.getByRole('button', { name: '返回二维馆区', exact: true }).click();
  await noModule.locator('.vatican-campus__canvas img').evaluate(img => img.decode());
  assert.deepEqual(moduleErrors, []);
  report.push({ dynamicModuleFailureContained: true, moduleErrors });
  await noModule.close();
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
} finally { await browser.close(); }
