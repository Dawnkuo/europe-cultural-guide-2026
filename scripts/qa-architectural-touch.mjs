import { chromium } from 'playwright';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const output = 'work/map-review/touch';
await mkdir(output, { recursive: true });
const hash = (buffer) => createHash('sha256').update(buffer).digest('hex');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  for (const slug of process.argv.slice(2)) {
    const model = JSON.parse(await readFile(`app/data/architectural-plans/${slug}.json`, 'utf8'));
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const report = { slug, modelDigest: hash(JSON.stringify(model)), environment: 'Chromium CDP touch input, 390x844; not a physical phone', errors };
    try {
      await page.goto(`http://localhost:55838/guides/${slug}/#guide-spatial`, { waitUntil: 'domcontentloaded' });
      const map = page.locator('.architectural-map');
      await map.scrollIntoViewIfNeeded();
      await map.getByRole('button', { name: '3D', exact: true }).click();
      const canvas = map.locator('canvas');
      await canvas.waitFor({ timeout: 60000 });
      const session = await context.newCDPSession(page);
      const touch = async (type, points) => {
        await session.send('Input.dispatchTouchEvent', { type, touchPoints: points.map(([x, y], id) => ({ x, y, id, radiusX: 3, radiusY: 3, force: 1 })) });
        await page.evaluate(() => new Promise(requestAnimationFrame));
      };
      const center = async () => {
        await canvas.scrollIntoViewIfNeeded();
        const box = await canvas.boundingBox();
        return [box.x + box.width / 2, box.y + box.height / 2];
      };
      const rotate = async () => {
        const [x, y] = await center();
        const before = hash(await canvas.screenshot());
        await touch('touchStart', [[x, y]]);
        for (let step = 1; step <= 8; step++) await touch('touchMove', [[x + step * 9, y + step * 2]]);
        await touch('touchEnd', []);
        if (before === hash(await canvas.screenshot())) throw new Error('Touch rotation did not redraw');
      };
      await rotate();
      report.drag = true;
      const [x, y] = await center();
      const beforePinch = hash(await canvas.screenshot());
      await touch('touchStart', [[x - 35, y], [x + 35, y]]);
      for (let step = 1; step <= 8; step++) await touch('touchMove', [[x - 35 - step * 6, y], [x + 35 + step * 6, y]]);
      await touch('touchEnd', []);
      if (beforePinch === hash(await canvas.screenshot())) throw new Error('Two-finger pinch did not redraw');
      report.pinch = true;
      await touch('touchStart', [[x, y]]);
      await touch('touchMove', [[x + 25, y + 10]]);
      await touch('touchCancel', []);
      for (const floor of model.floors) {
        await map.getByRole('button', { name: floor.label, exact: true }).tap();
        if (await map.locator('.architectural-map__scene').getAttribute('data-active-floor') !== floor.id) throw new Error(`Floor tap failed after cancellation: ${floor.id}`);
      }
      await rotate();
      report.cancellationRecovery = true;
      report.floorTaps = model.floors.map((floor) => floor.id);
      await map.getByRole('button', { name: '重置地图视角', exact: true }).tap();
      await map.screenshot({ path: `${output}/${slug}.png`, style: '.subnav, .guide-local-nav { visibility: hidden !important; }' });
      if (errors.length) throw new Error(errors.join('; '));
      report.passed = true;
      console.log(slug, 'touch drag, pinch, cancellation recovery and floor taps pass');
    } catch (error) {
      report.passed = false;
      report.failure = error.message;
      process.exitCode = 1;
      console.error(slug, error.message);
    } finally {
      await writeFile(`${output}/${slug}.json`, JSON.stringify(report, null, 2) + '\n');
      await context.close();
    }
  }
} finally {
  await browser.close();
}
