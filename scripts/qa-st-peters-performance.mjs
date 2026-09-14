import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { githubPreview } from './github-preview-server.mjs';

const preview = await githubPreview('dist/client');
const browser = await chromium.launch({ channel: 'chrome' });
const revision = JSON.parse(await readFile('dist/client/guide-precache.json', 'utf8')).revision;
const report = { revision, scope: 'Headless Chrome on this Mac, emulated touch; not a physical-phone frame-rate claim', samples: [] };
try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 844 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
    const page = await context.newPage();
    await page.goto(`${preview.url}/guides/st-peters-basilica/`, { waitUntil: 'networkidle' });
    const result = { width, disposedContexts: 0 };
    const canvas = page.locator('.guide-spatial-3d__canvas');
    for (let index = 0; index < 6; index++) {
      await page.getByRole('button', { name: '外观', exact: true }).click();
      await page.waitForFunction(() => document.querySelector('.guide-spatial-3d__canvas')?.dataset.rendered === 'true');
      await page.evaluate(() => { window.releasedContext = document.querySelector('.guide-spatial-3d__canvas').getContext('webgl2'); });
      await page.getByRole('button', { name: '内部', exact: true }).click();
      await page.waitForFunction(() => window.releasedContext.isContextLost());
      result.disposedContexts++;
    }
    await page.getByRole('button', { name: '外观', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('.guide-spatial-3d__canvas')?.dataset.rendered === 'true');
    await canvas.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => document.querySelector('.guide-spatial-3d__canvas').dataset.suspended === 'false');
    await page.getByRole('button', { name: '继续自动旋转', exact: true }).click();
    const camera = await canvas.getAttribute('data-camera');
    result.frames = await page.evaluate(() => new Promise(resolve => {
      const intervals = []; let before;
      function frame(time) {
        if (before != null) intervals.push(time - before);
        before = time;
        if (intervals.length < 180) return requestAnimationFrame(frame);
        const sorted = [...intervals].sort((a,b) => a-b);
        resolve({ fps: 1000 * intervals.length / intervals.reduce((a,b) => a+b, 0), p95ms: sorted[Math.floor(sorted.length * .95)], triangles: Number(document.querySelector('.guide-spatial-3d__canvas').dataset.triangles) });
      }
      requestAnimationFrame(frame);
    }));
    assert.notEqual(await canvas.getAttribute('data-camera'), camera);
    await page.getByRole('button', { name: '暂停自动旋转', exact: true }).click();
    if (width === 390) {
      const client = await context.newCDPSession(page);
      await client.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 2 });
      const bounds = await canvas.boundingBox();
      const x = bounds.x + bounds.width / 2, y = bounds.y + bounds.height / 2;
      const before = await canvas.getAttribute('data-camera');
      const points = distance => [{ x: x-distance, y, id: 1 }, { x: x+distance, y, id: 2 }];
      await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: points(25) });
      for (let distance = 30; distance <= 60; distance += 5) await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: points(distance) });
      await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await page.waitForFunction(value => document.querySelector('.guide-spatial-3d__canvas').dataset.camera !== value, before);
      await page.getByRole('group', { name: '外观范围' }).getByRole('button', { name: '圣彼得广场', exact: true }).click();
      assert.equal(await page.getByRole('group', { name: '外观范围' }).getByRole('button', { name: '圣彼得广场', exact: true }).getAttribute('aria-pressed'), 'true');
      result.emulatedPinch = true;
    }
    await page.evaluate(() => {
      window.lostCanvas = document.querySelector('.guide-spatial-3d__canvas');
      window.lostCanvas.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext();
    });
    await page.getByRole('button', { name: '重新加载外观', exact: true }).waitFor();
    await page.getByRole('button', { name: '重新加载外观', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('.guide-spatial-3d__canvas')?.dataset.rendered === 'true');
    assert.equal(await page.evaluate(() => window.lostCanvas !== document.querySelector('.guide-spatial-3d__canvas')), true);
    result.contextLossRecovery = true;
    report.samples.push(result);
    await context.close();
  }
  console.log(JSON.stringify(report, null, 2));
} finally {
  await writeFile('work/experience/st-peters-source/performance.json', JSON.stringify(report, null, 2));
  await browser.close();
  await preview.close();
}
