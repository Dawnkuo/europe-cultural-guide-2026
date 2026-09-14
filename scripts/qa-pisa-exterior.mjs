import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { githubPreview } from './github-preview-server.mjs';

const output = process.env.QA_OUTPUT ?? 'work/experience/pisa-exterior';
await mkdir(output, { recursive: true });
const preview = process.env.QA_BUILD ? await githubPreview() : null;
const origin = preview?.url ?? process.env.QA_ORIGIN ?? 'http://localhost:55910';
const browser = await chromium.launch({ channel: 'chrome' });
const report = [];
try {
  const revision = preview ? await (await fetch(`${origin}/guide-precache.json`)).json() : null;
  for (const width of (process.env.QA_WIDTHS ?? '1440,820,390,320').split(',').map(Number)) {
    const page = await browser.newPage({ viewport: { width, height: 960 }, reducedMotion: 'reduce', hasTouch: width < 500, isMobile: width < 500 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    if (process.env.QA_OFFLINE) {
      assert.ok(revision, 'Offline verification requires exported build');
      await page.goto(`${origin}/`, { waitUntil: 'domcontentloaded' });
      await page.evaluate(async () => { await navigator.serviceWorker.register(`${location.pathname}sw.js`); await navigator.serviceWorker.ready; });
      await page.waitForFunction(async revision => {
        const key = (await caches.keys()).find(key => key.endsWith(revision));
        return key && Boolean(await (await caches.open(key)).match(`${location.pathname}offline-ready`));
      }, revision.revision, { timeout: 240000 });
      await page.context().setOffline(true);
    }
    const response = await page.goto(`${origin}/guides/leaning-tower/`, { waitUntil: 'networkidle' });
    assert.equal(response.status(), 200);
    const floor = page.locator('.architectural-map__floors button[aria-pressed="true"]');
    const entrance = await floor.innerText();
    assert.equal(await page.getByRole('button', { name: '2D 俯视', exact: true }).getAttribute('aria-pressed'), 'true');
    await page.getByRole('button', { name: '外观', exact: true }).click();
    const canvas = page.locator('.guide-spatial-3d__canvas');
    await canvas.evaluate(element => element.scrollIntoView({ block: 'center' }));
    await page.waitForFunction(() => document.querySelector('.guide-spatial-3d__canvas')?.dataset.rendered === 'true');
    const data = await canvas.evaluate(element => Object.fromEntries(Object.entries(element.dataset)));
    const toolbarBottom = await page.locator('.guide-spatial-3d__toolbar').evaluate(element => element.getBoundingClientRect().bottom);
    assert.ok((await canvas.boundingBox()).y > toolbarBottom, 'Tools must not overlap tower viewport');
    assert.equal(data.model, 'pisa-arcaded-tower');
    assert.equal(JSON.parse(data.features)['loggia-column'], 180);
    assert.ok(Number(data.drawCalls) <= 10);
    const image = await canvas.screenshot({ path: `${output}/${width}-overview.png` });
    const { data: pixels, info } = await sharp(image).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    let count = 0, minY = info.height, maxY = 0;
    for (let y = 0; y < info.height; y++) for (let x = info.width * 0.3 | 0; x < info.width * 0.7; x++) {
      const i = (y * info.width + x) * info.channels;
      if (pixels[i] > 120 && pixels[i + 1] > 115 && pixels[i + 2] > 95) { count++; minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
    }
    assert.ok(count > 1000, 'Model must be materially visible');
    assert.ok(minY > 5 && maxY < info.height - 5, 'Full tower must not clip');
    assert.ok(maxY - minY > info.height * 0.6, 'Tower must use its viewport height');
    const home = await canvas.getAttribute('data-camera');
    for (const label of ['底层盲拱', '六层柱廊', '顶部钟室']) {
      const button = page.getByRole('button', { name: label, exact: true });
      await button.click();
      assert.equal(await button.getAttribute('aria-pressed'), 'true');
      await canvas.evaluate(element => element.scrollIntoView({ block: 'center' }));
      await canvas.screenshot({ path: `${output}/${width}-${label}.png` });
    }
    await canvas.focus(); await page.keyboard.press('ArrowRight');
    await page.getByRole('button', { name: '重置三维视角', exact: true }).click();
    await page.waitForFunction(expected => document.querySelector('.guide-spatial-3d__canvas')?.dataset.camera === expected, home);
    await canvas.evaluate(element => element.scrollIntoView({ block: 'center' }));
    const box = await canvas.boundingBox();
    assert.equal(await page.evaluate(box => document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)?.tagName, box), 'CANVAS');
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
    await page.mouse.down(); await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.55, { steps: 10 }); await page.mouse.up();
    await page.waitForFunction(expected => document.querySelector('.guide-spatial-3d__canvas')?.dataset.camera !== expected, home);
    if (width < 500) {
      const session = await page.context().newCDPSession(page);
      const center = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
      const before = await canvas.getAttribute('data-camera');
      await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ id: 0, x: center.x - 24, y: center.y }, { id: 1, x: center.x + 24, y: center.y }] });
      for (let step = 1; step <= 6; step++) await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ id: 0, x: center.x - 24 - step * 4, y: center.y }, { id: 1, x: center.x + 24 + step * 4, y: center.y }] });
      await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await page.waitForFunction(expected => document.querySelector('.guide-spatial-3d__canvas')?.dataset.camera !== expected, before);
      await session.detach();
    }
    await page.getByRole('button', { name: '顶部钟室', exact: true }).click();
    await page.getByRole('button', { name: '内部', exact: true }).click();
    assert.equal(await floor.innerText(), entrance);
    assert.equal(await page.getByRole('button', { name: '2D 俯视', exact: true }).getAttribute('aria-pressed'), 'true');
    await page.getByRole('button', { name: '外观', exact: true }).click();
    await canvas.evaluate(element => element.scrollIntoView({ block: 'center' }));
    await page.waitForFunction(() => document.querySelector('.guide-spatial-3d__canvas')?.dataset.rendered === 'true');
    // Actual WebGL context loss, not a fake loading flag.
    await canvas.evaluate(element => element.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
    const fallback = page.locator('.guide-spatial-3d__fallback img');
    await fallback.waitFor();
    await fallback.evaluate(image => image.decode());
    assert.ok(await fallback.evaluate(image => image.naturalWidth > 1000));
    await page.screenshot({ path: `${output}/${width}-fallback.png` });
    await page.getByRole('button', { name: '重新加载外观', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('.guide-spatial-3d__canvas')?.dataset.rendered === 'true');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
    assert.deepEqual(errors, []);
    report.push({ target: origin, revision: revision?.revision, offline: Boolean(process.env.QA_OFFLINE), width, entrance, features: JSON.parse(data.features), drawCalls: Number(data.drawCalls), triangles: Number(data.triangles), visiblePixels: count, passed: true });
    await page.close();
  }
} finally {
  await browser.close();
  await preview?.close();
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
}
console.log(JSON.stringify(report.map(({width, passed, drawCalls, triangles}) => ({width, passed, drawCalls, triangles}))));
