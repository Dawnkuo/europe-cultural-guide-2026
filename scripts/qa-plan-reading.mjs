import assert from 'node:assert/strict';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { githubPreview } from './github-preview-server.mjs';

const preview = process.env.QA_BUILD === '1' ? await githubPreview() : null;
const origin =
  preview?.url ?? process.env.QA_ORIGIN ?? 'http://localhost:55910';
const output = process.env.QA_OUTPUT ?? 'work/experience/plan-reading';
const selected = process.env.QA_SLUGS?.split(',');
const plans = [];
for (const file of await readdir('app/data/architectural-plans'))
  if (file.endsWith('.json')) {
    const plan = JSON.parse(
      await readFile(`app/data/architectural-plans/${file}`, 'utf8'),
    );
    if (!selected || selected.includes(plan.slug)) plans.push(plan);
  }
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const report = { origin, cases: [] };
try {
  if (preview)
    report.revision = JSON.parse(
      await readFile('dist/client/guide-precache.json', 'utf8'),
    ).revision;
  for (const width of (process.env.QA_WIDTHS ?? '1440,390,320')
    .split(',')
    .map(Number)) {
    const motion =
      process.env.QA_MOTION ?? (width === 390 ? 'no-preference' : 'reduce');
    const context = await browser.newContext({
      viewport: { width, height: 960 },
      reducedMotion: motion,
      hasTouch: width < 700,
      serviceWorkers: 'block',
    });
    const page = await context.newPage();
    for (const plan of plans) {
      const errors = [];
      const handler = (error) => errors.push(error.message);
      page.on('pageerror', handler);
      await page.goto(`${origin}/guides/${plan.slug}/#guide-spatial`, {
        waitUntil: 'networkidle',
      });
      const viewport = page.locator('.architectural-map__viewport');
      await viewport.scrollIntoViewIfNeeded();
      await page.locator('.architectural-map__plane > svg').waitFor();
      await page.waitForFunction(
        () =>
          document.querySelector('.architectural-map__overview use')?.getBBox()
            .width > 0,
      );
      const sizes = new Map();
      for (const zoom of [1, 4]) {
        if (zoom === 4)
          for (let i = 0; i < 6; i++)
            await page
              .getByRole('button', { name: '放大地图', exact: true })
              .click();
        for (const floor of plan.floors) {
          await page
            .locator('.architectural-map__floors')
            .getByRole('button', { name: floor.label, exact: true })
            .click();
          await page.waitForFunction(
            (label) =>
              document
                .querySelector('.architectural-map__plane > svg')
                ?.getAttribute('aria-label') === `${label}俯视图`,
            floor.label,
          );
          const dimensions = await page
            .locator('.architectural-map__plane')
            .evaluate((element) =>
              [element, element.querySelector('svg')].map((e) => ({
                width: e.getBoundingClientRect().width,
                height: e.getBoundingClientRect().height,
                expectedWidth: parseFloat(e.style.width),
                expectedHeight: parseFloat(e.style.height),
                animations: e.getAnimations().length,
              })),
            );
          for (const d of dimensions) {
            assert.ok(
              Math.abs(d.width - d.expectedWidth) < 1 &&
                Math.abs(d.height - d.expectedHeight) < 1,
              `${plan.slug}: drawing dimensions are still transitioning`,
            );
            assert.equal(d.animations, 0);
          }
          const observed = await page
            .locator('.architectural-map__2d-labels')
            .evaluate((root) =>
              [...root.querySelectorAll('[data-place-id]')].map((element) => {
                const button = element.querySelector('button'),
                  rect = button.getBoundingClientRect(),
                  plane = root.getBoundingClientRect();
                return {
                  id: element.dataset.placeId,
                  label: button.querySelector('[data-place-label]').textContent,
                  numbers:
                    button.querySelector('[data-guide-numbers]')?.dataset
                      .guideNumbers ?? '',
                  width: rect.width,
                  height: rect.height,
                  x: rect.x - plane.x,
                  y: rect.y - plane.y,
                  font: getComputedStyle(button).fontSize,
                  overflow: button.scrollWidth > button.clientWidth + 1,
                };
              }),
            );
          const expected = plan.places.filter(
            (place) => place.floorId === floor.id,
          );
          assert.deepEqual(
            observed.map((x) => x.id).sort((a, b) => a.localeCompare(b)),
            expected.map((x) => x.id).sort((a, b) => a.localeCompare(b)),
          );
          for (const a of observed) {
            const place = expected.find((p) => p.id === a.id);
            assert.equal(a.label, place.label);
            assert.equal(
              a.numbers,
              [
                ...new Set(
                  plan.stopBindings
                    .filter((b) => b.placeId === a.id)
                    .map((b) => b.stopIndex + 1),
                ),
              ]
                .sort((a, b) => a - b)
                .join(','),
            );
            assert.equal(a.font, '13px');
            assert.equal(
              a.overflow,
              false,
              `${plan.slug}/${floor.id}/${a.id}: text clipped`,
            );
            assert.ok(a.height >= 24 && a.x >= -1 && a.y >= -1);
            if (zoom === 1) sizes.set(a.id, [a.width, a.height]);
            else assert.deepEqual([a.width, a.height], sizes.get(a.id));
            for (const b of observed)
              if (a.id !== b.id)
                assert.ok(
                  a.x + a.width + 4 <= b.x ||
                    b.x + b.width + 4 <= a.x ||
                    a.y + a.height + 4 <= b.y ||
                    b.y + b.height + 4 <= a.y,
                  `${plan.slug}: overlapping labels ${a.id}/${b.id}`,
                );
          }
          assert.equal(
            await page
              .locator('.architectural-map__plane [data-feature-id]')
              .count(),
            floor.features.length,
          );
          const pick = expected.find((p) => p.kind === 'room') ?? expected[0];
          if (pick) {
            await page
              .getByRole('combobox', { name: '定位地点', exact: true })
              .selectOption(pick.id);
            await page.waitForFunction(
              (id) =>
                document
                  .querySelector(`[data-place-id="${id}"] button`)
                  ?.getAttribute('aria-pressed') === 'true',
              pick.id,
            );
            const inside = await viewport.evaluate((host, at) => {
              const svg = host.querySelector('svg'),
                matrix = svg.getScreenCTM(),
                p = new DOMPoint(...at).matrixTransform(matrix),
                r = host.getBoundingClientRect();
              return {
                visible:
                  p.x >= r.left &&
                  p.x <= r.right &&
                  p.y >= r.top &&
                  p.y <= r.bottom,
                x: p.x - r.left,
                y: p.y - r.top,
                width: r.width,
                height: r.height,
                scroll: [host.scrollLeft, host.scrollTop],
                viewBox: svg.getAttribute('viewBox'),
                svgStyle: svg.getAttribute('style'),
                svgRect: svg.getBoundingClientRect().toJSON(),
                scale: matrix.a,
                planeStyle: host
                  .querySelector('.architectural-map__plane')
                  .getAttribute('style'),
              };
            }, pick.at);
            assert.ok(
              inside.visible,
              `${plan.slug}/${floor.id}/${zoom}/${pick.id}: focus missed the physical anchor ${JSON.stringify(inside)}`,
            );
          }
          const geometry = await page
            .locator('.architectural-map__overview use')
            .evaluate((e) => ({
              width: e.getBBox().width,
              height: e.getBBox().height,
            }));
          assert.ok(geometry.width > 0 && geometry.height > 0);
          const result = {
            slug: plan.slug,
            floorId: floor.id,
            width,
            zoom,
            motion,
            labels: observed.length,
            passed: true,
          };
          report.cases.push(result);
        }
      }
      await page
        .getByRole('button', { name: '重置地图视角', exact: true })
        .click();
      await viewport.scrollIntoViewIfNeeded();
      await page.screenshot({ path: `${output}/${plan.slug}-${width}.png` });
      const overview = await page
        .getByRole('button', { name: '地图总览定位', exact: true })
        .screenshot();
      assert.ok(
        (await sharp(overview).stats()).channels[0].stdev > 5,
        'Blank overview',
      );
      await page
        .getByRole('button', { name: '地图总览定位', exact: true })
        .click({ position: { x: 25, y: 25 } });
      assert.equal(
        await page.evaluate(() =>
          document.activeElement?.classList.contains(
            'architectural-map__viewport',
          ),
        ),
        true,
      );
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth + 1,
        ),
        false,
      );
      assert.deepEqual(errors, []);
      page.off('pageerror', handler);
      await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
      console.log(
        JSON.stringify({
          slug: plan.slug,
          width,
          floors: plan.floors.length,
          passed: true,
        }),
      );
    }
    await context.close();
  }
} finally {
  await browser.close();
  await preview?.close();
}
