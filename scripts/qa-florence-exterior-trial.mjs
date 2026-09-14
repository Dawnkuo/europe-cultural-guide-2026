import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import sharp from 'sharp';

const directory = 'work/florence-exterior-trial';
await mkdir(directory, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const report = [];
try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, isMobile: width < 500, hasTouch: width < 500, reducedMotion: 'reduce' });
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    try {
      await page.goto('http://localhost:55910/guides/florence-duomo#guide-spatial', { waitUntil: 'domcontentloaded' });
      const twoD = page.getByRole('button', { name: '2D 俯视', exact: true });
      await twoD.waitFor();
      assert.equal(await twoD.getAttribute('aria-pressed'), 'true');
      assert.equal(await page.locator('iframe').count(), 0);
      const floor = await page.locator('.architectural-map__floors [aria-pressed="true"]').textContent();
      const views = page.getByRole('group', { name: '内外视图', exact: true });
      await views.getByRole('button', { name: '外观', exact: true }).click();
      const viewport = page.locator('[data-model-id="382fa42bca4346979e673c12e93a2df8"]');
      await viewport.scrollIntoViewIfNeeded();
      await page.waitForFunction(() => document.querySelector('.reference-exterior__viewport')?.getAttribute('data-state') === 'ready', null, { timeout: 70000 });
      await page.waitForTimeout(4500);
      assert.equal(await page.locator('iframe').count(), 1);
      assert.equal(await page.locator('.guide-spatial-3d').count(), 0);
      const bytes = await viewport.screenshot({ path: `${directory}/${width}-online.png` });
      assert.ok((await sharp(bytes).stats()).channels.some(channel => channel.stdev > 8));
      await page.screenshot({ path: `${directory}/${width}-page.png` });
      const frame = viewport.locator('iframe'), before = await frame.getAttribute('data-camera');
      assert.ok(before);
      const box = await frame.boundingBox();
      await page.mouse.move(box.x + box.width * .4, box.y + box.height * .5);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width * .6, box.y + box.height * .55, { steps: 15 });
      await page.mouse.up();
      await page.waitForFunction(initial => document.querySelector('.reference-exterior iframe')?.getAttribute('data-camera') !== initial, before);
      await viewport.screenshot({ path: `${directory}/${width}-rotated.png` });
      await page.getByRole('button', { name: '重置模型视角', exact: true }).click();
      await page.waitForFunction(initial => {
        const current = document.querySelector('.reference-exterior iframe')?.getAttribute('data-camera');
        if (!current) return false;
        const a = JSON.parse(current), b = JSON.parse(initial);
        return [...a.position, ...a.target].every((v, i) => Math.abs(v - [...b.position, ...b.target][i]) < .01);
      }, before);
      await views.getByRole('button', { name: '内部', exact: true }).click();
      assert.equal(await page.locator('iframe').count(), 0);
      assert.equal(await twoD.getAttribute('aria-pressed'), 'true');
      assert.equal(await page.locator('.architectural-map__floors [aria-pressed="true"]').textContent(), floor);

      await page.route('https://sketchfab.com/**', route => route.abort());
      await views.getByRole('button', { name: '外观', exact: true }).click();
      await page.locator('[data-reference-fallback="load-error"]').waitFor({ timeout: 70000 });
      assert.equal(await page.locator('iframe').count(), 0);
      await page.getByRole('button', { name: '重置三维视角', exact: true }).waitFor();
      await page.waitForFunction(() => !document.querySelector('.guide-spatial-3d__toolbar button:disabled'), null, { timeout: 20000 });
      await page.locator('.guide-spatial-3d').screenshot({ path: `${directory}/${width}-original-fallback.png` });
      await context.setOffline(true);
      await page.locator('[data-reference-fallback="offline"]').waitFor();
      assert.equal(await page.locator('iframe').count(), 0);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
      await context.setOffline(false);
      assert.deepEqual(errors, []);
      report.push({ width, passed: true, initial2D: true, entryPreserved: true, onlineRendered: true, mouseDrag: true, reset: true, loadFailureFallback: true, warmOfflineTransition: true, errors });
      console.log(`${width}: PASS`);
    } catch (error) {
      report.push({ width, passed: false, error: String(error), errors });
      await page.screenshot({ path: `${directory}/${width}-failure.png` });
      console.log(`${width}: ${String(error)}`);
    } finally { await context.close(); }
  }
} finally {
  await browser.close();
  await writeFile(`${directory}/report.json`, JSON.stringify(report, null, 2) + '\n');
}
assert.ok(report.every(item => item.passed), 'See Florence trial QA report');
