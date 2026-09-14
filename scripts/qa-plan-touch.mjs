import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { githubPreview } from './github-preview-server.mjs';

const preview = process.env.QA_BUILD === '1' ? await githubPreview() : null;
const origin =
  preview?.url ?? process.env.QA_ORIGIN ?? 'http://localhost:55910';
const output = process.env.QA_OUTPUT ?? 'work/experience/plan-touch';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const report = { origin, cases: [] };
try {
  if (preview)
    report.revision = JSON.parse(
      await readFile('dist/client/guide-precache.json', 'utf8'),
    ).revision;
  for (const motion of ['reduce', 'no-preference'])
    for (const width of [390, 320]) {
      const context = await browser.newContext({
        viewport: { width, height: 960 },
        hasTouch: true,
        reducedMotion: motion,
        serviceWorkers: 'block',
      });
      const page = await context.newPage(),
        cdp = await context.newCDPSession(page),
        errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(`${origin}/guides/vatican-museums/#guide-spatial`, {
        waitUntil: 'networkidle',
      });
      const host = page.locator('.architectural-map__viewport');
      await host.scrollIntoViewIfNeeded();
      const state = () =>
        host.evaluate((e) => ({
          zoom: Number(e.dataset.zoom),
          left: e.scrollLeft,
          top: e.scrollTop,
        }));
      const point = (id, x, y) => ({
        id,
        x,
        y,
        radiusX: 5,
        radiusY: 5,
        force: 1,
      });
      const gesture = async (type, touchPoints) =>
        cdp.send('Input.dispatchTouchEvent', { type, touchPoints });
      const focal = async (x, y) =>
        host.evaluate(
          (e, [x, y]) => {
            const p = new DOMPoint(x, y).matrixTransform(
              e.querySelector('svg').getScreenCTM().inverse(),
            );
            return [p.x, p.y];
          },
          [x, y],
        );
      const box = await host.boundingBox(),
        cx = box.x + box.width / 2,
        cy = box.y + box.height / 2;
      const before = await focal(cx, cy);
      await gesture('touchStart', [
        point(1, cx - 35, cy),
        point(2, cx + 35, cy),
      ]);
      for (let i = 1; i <= 10; i++)
        await gesture('touchMove', [
          point(1, cx - 35 - i * 5, cy),
          point(2, cx + 35 + i * 5, cy),
        ]);
      await gesture('touchEnd', []);
      await page.waitForFunction(
        () =>
          Math.abs(
            Number(
              document.querySelector('.architectural-map__viewport').dataset
                .zoom,
            ) -
              17 / 7,
          ) < 0.02,
      );
      await page.evaluate(
        () =>
          new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          ),
      );
      const after = await focal(cx, cy),
        scale = await host.evaluate(
          (e) => e.querySelector('svg').getScreenCTM().a,
        );
      assert.ok(
        Math.hypot(after[0] - before[0], after[1] - before[1]) * scale < 3,
        `Pinch focal point drifted: ${JSON.stringify({ before, after, scale, state: await state() })}`,
      );
      const selected = await page
        .getByRole('combobox', { name: '定位地点', exact: true })
        .inputValue();
      const panBefore = await state();
      await gesture('touchStart', [point(1, cx, cy)]);
      for (let i = 1; i <= 8; i++)
        await gesture('touchMove', [point(1, cx - i * 9, cy - i * 7)]);
      await gesture('touchEnd', []);
      const panAfter = await state();
      assert.ok(
        Math.abs(panAfter.left - panBefore.left) > 40 ||
          Math.abs(panAfter.top - panBefore.top) > 40,
        `Touch pan did not move ${JSON.stringify({ width, panBefore, panAfter, box })}`,
      );
      assert.equal(
        await page
          .getByRole('combobox', { name: '定位地点', exact: true })
          .inputValue(),
        selected,
        'Drag accidentally selected a room',
      );
      const room = await host.evaluate((e) => {
        const rect = e.getBoundingClientRect();
        return [...e.querySelectorAll('[data-place-id]')]
          .map((label) => ({
            id: label.dataset.placeId,
            rect: label.getBoundingClientRect(),
          }))
          .filter(
            (label) =>
              label.rect.left > rect.left + 5 &&
              label.rect.right < rect.right - 5 &&
              label.rect.top > rect.top + 60 &&
              label.rect.bottom < rect.bottom - 5,
          )
          .map((label) => ({
            id: label.id,
            x: label.rect.x + label.rect.width / 2,
            y: label.rect.y + label.rect.height / 2,
          }))[0];
      });
      assert.ok(room, 'Need a visible room label to verify capture transfer');
      const roomPanBefore = await state();
      await gesture('touchStart', [point(1, room.x, room.y)]);
      for (let i = 1; i <= 8; i++)
        await gesture('touchMove', [point(1, room.x - i * 7, room.y - i * 7)]);
      await gesture('touchEnd', []);
      const roomPanAfter = await state();
      assert.ok(
        roomPanAfter.left - roomPanBefore.left > 40 ||
          roomPanAfter.top - roomPanBefore.top > 40,
        'Drag starting on a room lost pointer capture',
      );
      assert.equal(
        await page
          .getByRole('combobox', { name: '定位地点', exact: true })
          .inputValue(),
        selected,
      );
      // Real touch cancellation, followed by another drag and a floor change.
      await gesture('touchStart', [point(1, cx, cy)]);
      await gesture('touchMove', [point(1, cx + 25, cy + 25)]);
      await gesture('touchCancel', []);
      const cancelled = await state();
      await gesture('touchStart', [point(1, cx, cy)]);
      await gesture('touchMove', [point(1, 6, cy + 45)]);
      await gesture('touchEnd', []);
      assert.ok(
        Math.abs((await state()).left - cancelled.left) > 40,
        'Drag outside the viewport failed after cancellation',
      );
      const floors = page.locator('.architectural-map__floors button');
      await floors.first().click();
      assert.equal(await floors.first().getAttribute('aria-pressed'), 'true');
      const floor = await floors.first().innerText();
      await page.getByRole('button', { name: '3D', exact: true }).click();
      await page.locator('.architectural-map__scene canvas').waitFor();
      await page.getByRole('button', { name: '2D 俯视', exact: true }).click();
      assert.equal(await floors.first().getAttribute('aria-pressed'), 'true');
      await page
        .getByRole('button', { name: '重置地图视角', exact: true })
        .click();
      assert.equal((await state()).zoom, 1);
      assert.equal(await floors.first().innerText(), floor);
      await host.focus();
      await page.keyboard.press('+');
      assert.equal((await state()).zoom, 1.5);
      const pos = await state();
      await page.keyboard.press(pos.left > 0 ? 'ArrowLeft' : 'ArrowRight');
      await page.waitForFunction(
        (left) =>
          document.querySelector('.architectural-map__viewport').scrollLeft !==
          left,
        pos.left,
      );
      const mini = page.getByRole('button', {
        name: '地图总览定位',
        exact: true,
      });
      await mini.scrollIntoViewIfNeeded();
      const rect = await mini.boundingBox();
      await page.touchscreen.tap(rect.x + 25, rect.y + 25);
      assert.equal(
        await page.evaluate(() =>
          document.activeElement?.classList.contains(
            'architectural-map__viewport',
          ),
        ),
        true,
      );
      await host.scrollIntoViewIfNeeded();
      await page.screenshot({
        path: `${output}/vatican-${width}-${motion}.png`,
      });
      assert.deepEqual(errors, []);
      report.cases.push({
        width,
        motion,
        pinch: true,
        focalDriftPixels:
          Math.hypot(after[0] - before[0], after[1] - before[1]) * scale,
        pan: true,
        roomCaptureTransfer: true,
        touchCancelRecovery: true,
        outsideRelease: true,
        floorAndView: true,
        overviewTouch: true,
        keyboard: true,
        passed: true,
      });
      await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
      await context.close();
    }
} finally {
  await browser.close();
  await preview?.close();
}
