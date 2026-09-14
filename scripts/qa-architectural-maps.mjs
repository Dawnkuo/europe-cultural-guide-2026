import { chromium } from 'playwright';
import sharp from 'sharp';
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { spaceForPlace, polygonPath } from '../app/lib/architectural-plan.ts';

const baseUrl = (process.env.MAP_QA_URL ?? 'http://localhost:55838').replace(/\/$/, '');
const output = process.env.MAP_QA_OUTPUT ?? 'work/map-review/browser';
const slugs = process.argv.slice(2);
const files = (await readdir('app/data/architectural-plans')).filter((f) => f.endsWith('.json') && (!slugs.length || slugs.includes(f.slice(0, -5))));
const viewports = [{ width: 1440, height: 1000 }, { width: 1094, height: 768 }, { width: 390, height: 844 }];
const browser = await chromium.launch({ headless: true, channel: 'chrome', args: ['--enable-webgl', '--ignore-gpu-blocklist'] });
await mkdir(output, { recursive: true });
const results = [];
const hash = (value) => createHash('sha256').update(value).digest('hex');
const check = (condition, message) => { if (!condition) throw new Error(message); };

async function screenshotMap(page, path) {
  const map = page.locator('.architectural-map');
  // Isolate the complete component; page-sticky navigation otherwise covers
  // the upper part of an element screenshot taller than the viewport.
  const buffer = await map.screenshot({ path, style: '.subnav, .guide-local-nav { visibility: hidden !important; }' });
  const { channels } = await sharp(buffer).stats();
  return Number(channels.slice(0, 3).reduce((sum, c) => sum + c.stdev, 0).toFixed(2));
}

async function checkLabelPixels(map, floorId) {
  const labels = await map.locator('.architectural-map__2d-labels button').all();
  const painted = new Set();
  const viewport = map.locator('.architectural-map__viewport');
  for (const [index, button] of labels.entries()) {
    if (painted.has(index)) continue;
    await button.scrollIntoViewIfNeeded();
    const buffer = await viewport.screenshot({ style: '.subnav,.guide-local-nav{visibility:hidden!important}' });
    const metadata = await sharp(buffer).metadata();
    const visible = await map.locator('.architectural-map__2d-labels button').evaluateAll(nodes => {
      const viewport = nodes[0]?.closest('.architectural-map__viewport')?.getBoundingClientRect();
      if (!viewport) return [];
      return nodes.flatMap((button, index) => {
        const text = button.querySelector('[data-place-label]');
        const node = text?.classList.contains('sr-only') ? button.querySelector('svg') : text;
        if (!node) return [];
        const rect = node.getBoundingClientRect();
        const left = rect.left - viewport.left, top = rect.top - viewport.top;
        if (rect.width <= 0 || rect.height <= 0 || left < 0 || top < 0 || left + rect.width > viewport.width || top + rect.height > viewport.height) return [];
        return [{ index, label: text.textContent, left, top, width: rect.width, height: rect.height, viewportWidth: viewport.width, viewportHeight: viewport.height }];
      });
    });
    // One viewport capture verifies every fully visible glyph, not just the scrolled target.
    for (const glyph of visible) {
      if (painted.has(glyph.index)) continue;
      const sx = metadata.width / glyph.viewportWidth, sy = metadata.height / glyph.viewportHeight;
      const left = Math.floor(glyph.left * sx), top = Math.floor(glyph.top * sy);
      const width = Math.min(metadata.width - left, Math.ceil(glyph.width * sx));
      const height = Math.min(metadata.height - top, Math.ceil(glyph.height * sy));
      const { channels } = await sharp(buffer).extract({ left, top, width, height }).stats();
      check(channels.slice(0, 3).some(channel => channel.stdev > 8), `Label has no painted glyph pixels: ${floorId}/${glyph.label}`);
      painted.add(glyph.index);
    }
    if (painted.has(index)) continue;
    // Oversized labels still receive an individual glyph capture.
    const text = button.locator('[data-place-label]');
    const label = await text.textContent();
    const node = (await text.getAttribute('class'))?.includes('sr-only') ? button.locator('svg').first() : text;
    const glyph = await node.screenshot({ style: '.subnav,.guide-local-nav{visibility:hidden!important}' });
    const { channels } = await sharp(glyph).stats();
    check(channels.slice(0, 3).some(channel => channel.stdev > 8), `Label has no painted glyph pixels: ${floorId}/${label}`);
    painted.add(index);
  }
  return painted.size;
}

try {
  for (const file of files) {
    const model = JSON.parse(await readFile(join('app/data/architectural-plans', file), 'utf8'));
    const record = { slug: model.slug, modelDigest: hash(JSON.stringify(model)), sourceDigest: model.sourceDigest, viewports: [] };
    for (const viewport of viewports) {
      const context = await browser.newContext({ viewport, reducedMotion: 'reduce', serviceWorkers: 'block' });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      const result = { viewport, floors: [], screenshots: [], errors };
      record.viewports.push(result);
      try {
        await page.goto(`${baseUrl}/guides/${model.slug}/?mapQa=${record.modelDigest.slice(0, 10)}#guide-spatial`, { waitUntil: 'domcontentloaded', timeout: 45000 });
        const map = page.locator('.architectural-map');
        await map.waitFor({ timeout: 45000 });
        await map.scrollIntoViewIfNeeded();
        check(await map.getByRole('button', { name: '2D 俯视', exact: true }).getAttribute('aria-pressed') === 'true', 'Map must open in 2D');
        await map.getByRole('button', { name: '3D', exact: true }).click();
        const canvas = map.locator('canvas');
        await canvas.waitFor({ timeout: 45000 });
        await page.waitForFunction(() => {
          const c = document.querySelector('.architectural-map__scene canvas');
          return c?.width > 0 && c?.height > 0;
        });
        const scene = page.locator('.architectural-map__scene');
        const sample = Number(await scene.getAttribute('data-visible-samples'));
        if (await scene.getAttribute('data-visible-samples') !== null) check(sample > 20, `Empty GPU map: ${sample}`);
        result.gpuSamples = sample;
        const prefix = `${model.slug}-${viewport.width}`;
        const first = join(output, `${prefix}-3d.png`);
        result.screenshots.push(first);
        check(await screenshotMap(page, first) > 6, 'Blank map screenshot');

        // These are browser mouse and keyboard actions, not a real phone test.
        await canvas.scrollIntoViewIfNeeded();
        const box = await canvas.boundingBox();
        await page.mouse.move(box.x + box.width * .55, box.y + box.height * .55);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width * .8, box.y + box.height + 18, { steps: 12 });
        await page.mouse.up();
        for (const floor of model.floors) {
          await map.getByRole('button', { name: floor.label, exact: true }).click();
          check(await scene.getAttribute('data-active-floor') === floor.id, `Floor button failed after drag: ${floor.id}`);
        }
        await canvas.focus();
        const before = await canvas.screenshot();
        await page.keyboard.press('ArrowRight');
        const after = await canvas.screenshot();
        check(hash(before) !== hash(after), 'Keyboard rotation did not redraw');
        result.keyboard = true;
        result.interruptedMouseDrag = true;
        await map.getByRole('button', { name: '重置地图视角', exact: true }).click();

        await map.getByRole('button', { name: '2D 俯视', exact: true }).click();
        for (const floor of model.floors) {
          await map.getByRole('button', { name: floor.label, exact: true }).click();
          await map.getByRole('button', { name: '重置地图视角', exact: true }).click();
          const expected = model.places.filter((p) => p.floorId === floor.id).map((p) => ({ id: p.id, label: p.label })).sort((a, b) => a.id.localeCompare(b.id));
          const expectedBadges = expected.flatMap(({ id }) => {
            const numbers = [...new Set(model.stopBindings.filter((binding) => binding.placeId === id).map((binding) => binding.stopIndex + 1))].sort((a,b) => a-b);
            return numbers.length ? [{ id, numbers: numbers.join(','), text: numbers.join('·') }] : [];
          });
          const checkBadges = async () => {
            const badges = await map.locator('.architectural-map__2d-labels [data-guide-numbers]').evaluateAll((nodes) => nodes.map((node) => ({ id: node.closest('[data-place-id]').dataset.placeId, numbers: node.dataset.guideNumbers, text: node.textContent })).sort((a,b) => a.id.localeCompare(b.id)));
            check(JSON.stringify(badges) === JSON.stringify(expectedBadges), `Guide numbers differ from stop bindings: ${floor.id}`);
          };
          const readLabels = () => map.locator('.architectural-map__2d-labels [data-place-id]').evaluateAll((nodes) => nodes.map((node) => ({ id: node.dataset.placeId, label: node.querySelector('[data-place-label]')?.textContent })).sort((a, b) => a.id.localeCompare(b.id)));
          const readPaint = () => map.locator('.architectural-map__2d-labels button').evaluateAll((nodes) => nodes.map((node) => {
            const rect = node.getBoundingClientRect(), style = getComputedStyle(node);
            return { label: node.textContent, width: rect.width, height: rect.height, fontSize: Number.parseFloat(style.fontSize), visible: style.visibility === 'visible' && style.display !== 'none' && Number(style.opacity) > 0 };
          }));
          const overview = await map.locator('.architectural-map__viewport').evaluate(host => {
            const plane = host.querySelector('.architectural-map__plane').getBoundingClientRect();
            return { fits: plane.width <= host.clientWidth + 1 && plane.height <= host.clientHeight + 1, zoom: Number(host.dataset.zoom) };
          });
          check(overview.fits && overview.zoom === 1, `Initial map does not fit the viewport: ${floor.id}`);
          check((await readPaint()).every(label => label.visible && label.width > 0 && label.height > 0), `Hidden overview label: ${floor.id}`);
          check(await map.locator('foreignObject').count() === 0, '2D labels must not depend on embedded HTML inside scaled SVG');
          check(JSON.stringify(await readLabels()) === JSON.stringify(expected), `Missing/changed room labels at minimum zoom: ${floor.id}`);
          await checkBadges();
          const path = join(output, `${prefix}-${floor.id}-2d.png`);
          result.screenshots.push(path);
          await screenshotMap(page, path);
          const readable = labels => labels.every(label => label.visible && label.width >= 24 && label.height >= 21 && label.fontSize >= 12);
          for (let step = 0; step < 20 && !readable(await readPaint()); step++) await map.getByRole('button', { name: '放大地图', exact: true }).click();
          check(readable(await readPaint()), `Labels cannot reach readable size: ${floor.id}`);
          const readingZoom = Number(await map.locator('.architectural-map__viewport').getAttribute('data-zoom'));
          const paintedLabels = await checkLabelPixels(map, floor.id);
          for (let i = 0; i < 6; i++) await map.getByRole('button', { name: '放大地图', exact: true }).click();
          await page.waitForFunction(() => {
            const host = document.querySelector('.architectural-map__viewport');
            return host && host.querySelector('svg').getBoundingClientRect().width >= host.clientWidth * 4 - 4;
          });
          check(JSON.stringify(await readLabels()) === JSON.stringify(expected), `Missing/changed room labels at maximum zoom: ${floor.id}`);
          await checkBadges();
          result.paintedLabels = (result.paintedLabels ?? 0) + paintedLabels;
          const scroll = map.locator('.architectural-map__viewport');
          await scroll.evaluate((node) => { node.scrollTo(node.scrollWidth, node.scrollHeight); });
          const reached = await scroll.evaluate((node) => ({ x: node.scrollLeft + node.clientWidth >= node.scrollWidth - 2, y: node.scrollTop + node.clientHeight >= node.scrollHeight - 2 }));
          check(reached.x && reached.y, `Cannot reach map edge: ${floor.id}`);
          await map.getByRole('button', { name: '重置地图视角', exact: true }).click();
          if (expected.length) {
            const id = expected.at(-1).id;
            await map.getByRole('combobox', { name: '定位地点', exact: true }).selectOption(id);
            check(await map.locator(`[data-place-id="${id}"] button`).getAttribute('aria-pressed') === 'true', `Room selection failed: ${id}`);
            await map.getByRole('button', { name: '3D', exact: true }).click();
            await canvas.waitFor();
            check(await scene.getAttribute('data-active-floor') === floor.id, 'Switching view lost the floor');
            await map.getByRole('button', { name: '2D 俯视', exact: true }).click();
            check(await map.getByRole('combobox', { name: '定位地点', exact: true }).inputValue() === id, 'Switching view lost selection');
          }
          const firstBinding = model.stopBindings.find((binding) => model.places.find((p) => p.id === binding.placeId)?.floorId === floor.id);
          if (firstBinding) {
            // Test a fresh explicit focus, independently of the preserved selection above.
            await page.reload({ waitUntil: 'domcontentloaded' });
            await map.waitFor();
            await map.getByRole('button', { name: floor.label, exact: true }).click();
            await map.getByRole('button', { name: '3D', exact: true }).click();
            await canvas.waitFor();
            // Opening 3D fits every floor; an explicit selection then focuses its anchor.
            await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
            const picker = map.getByRole('combobox', { name: '定位地点', exact: true });
            check(await picker.inputValue() === '', '3D focus check must start without an existing selection');
            await picker.selectOption(firstBinding.placeId);
            const badge = map.locator(`.architectural-map__scene-labels [data-place-id="${firstBinding.placeId}"] [data-guide-numbers]`);
            await badge.waitFor({ state: 'visible', timeout: 15000 });
            check((await badge.getAttribute('data-guide-numbers')).split(',').includes(String(firstBinding.stopIndex + 1)), `Focused 3D guide number missing: ${floor.id}`);
            await map.getByRole('button', { name: '2D 俯视', exact: true }).click();
          }
          result.floors.push({ id: floor.id, exactLabels: expected.length, guideNumbers: expectedBadges.length, minMaxZoom: true, overviewFit: true, readingZoom, viewRoundTrip: true, scrollEdges: reached });
        }
        result.selectedSpaces = [];
        const capturedSelectionFloors = new Set();
        for (const [stopIndex, bindings] of Map.groupBy(model.stopBindings, (binding) => binding.stopIndex)) {
          const row = map.locator(`.architectural-map__stops [data-stop-index="${stopIndex}"]`);
          const buttons = row.getByRole('button');
          check(await buttons.count() === bindings.length, `Missing stop target: ${stopIndex}`);
          for (let i = 0; i < bindings.length; i++) {
            await buttons.nth(i).click();
            check(await map.getByRole('combobox', { name: '定位地点', exact: true }).inputValue() === bindings[i].placeId, `Stop focus failed: ${stopIndex}/${bindings[i].placeId}`);
            check(await row.getAttribute('data-selected') === 'true', `Selected guide row did not highlight: ${stopIndex}`);
            const badge = map.locator(`.architectural-map__2d-labels [data-place-id="${bindings[i].placeId}"] [data-guide-numbers]`);
            check((await badge.getAttribute('data-guide-numbers')).split(',').includes(String(stopIndex + 1)), `Focused 2D number missing: ${stopIndex}`);
            const selectedSpace = spaceForPlace(model, bindings[i].placeId);
            if (selectedSpace) {
              const overlay = map.locator(`svg [data-selected-space-id="${selectedSpace.id}"]`);
              check(await overlay.isVisible(), `Selected room is not drawn in 2D: ${selectedSpace.id}`);
              const paths = await overlay.locator('path').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('d')));
              check(JSON.stringify(paths) === JSON.stringify(selectedSpace.polygons.map(polygonPath)), `2D selection changed room geometry: ${selectedSpace.id}`);
              if (!result.selectedSpaces.includes(selectedSpace.id)) {
                const captureSelection = !capturedSelectionFloors.has(selectedSpace.floorId);
                if (captureSelection) {
                  const path = join(output, `${prefix}-${selectedSpace.floorId}-selection-2d.png`);
                  await screenshotMap(page, path);
                  result.screenshots.push(path);
                }
                await map.getByRole('button', { name: '3D', exact: true }).click();
                await page.waitForFunction((id) => {
                  const scene = document.querySelector('.architectural-map__scene');
                  return scene?.dataset.selectedSpaceId === id && Number(scene.dataset.selectionVertices) > 0;
                }, selectedSpace.id);
                check(await scene.getAttribute('data-active-floor') === selectedSpace.floorId, `Selected 3D room is on the wrong floor: ${selectedSpace.id}`);
                if (captureSelection) {
                  const path = join(output, `${prefix}-${selectedSpace.floorId}-selection-3d.png`);
                  await screenshotMap(page, path);
                  result.screenshots.push(path);
                  capturedSelectionFloors.add(selectedSpace.floorId);
                }
                await map.getByRole('button', { name: '2D 俯视', exact: true }).click();
                result.selectedSpaces.push(selectedSpace.id);
              }
            }
          }
        }
        result.stopTargets = model.stopBindings.length;
        const unlocated = await map.locator('.architectural-map__stops [data-location-state="unlocated"]').evaluateAll((rows) => rows.map((row) => ({ index: Number(row.dataset.stopIndex), reason: row.querySelector('.architectural-map__stop-unlocated')?.textContent, buttons: row.querySelectorAll('button').length })));
        check(unlocated.every((row) => row.reason?.includes('未定位') && row.buttons === 0 && !model.stopBindings.some((binding) => binding.stopIndex === row.index)), 'An unlocated step has a false map action or lacks its explanation');
        result.routeNumbering = true;
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        check(overflow <= 1, `Page horizontal overflow: ${overflow}`);
        check(!errors.length, errors.join('; '));
        result.passed = true;
      } catch (error) {
        result.passed = false;
        result.failure = error.message;
        await page.screenshot({ path: join(output, `${model.slug}-${viewport.width}-failure.png`) }).catch(() => {});
      } finally {
        await context.close();
      }
      console.log(model.slug, viewport.width, result.passed ? 'pass' : result.failure);
    }
    results.push(record);
    await writeFile(join(output, `${model.slug}-report.json`), JSON.stringify({ target: baseUrl, timestamp: new Date().toISOString(), ...record }, null, 2));
    await writeFile(join(output, 'report.json'), JSON.stringify({ target: baseUrl, timestamp: new Date().toISOString(), scope: 'Automated real-browser rendering, exact labels, mouse/keyboard and viewport checks; screenshots require visual review. No physical-device touch/FPS or offline certification is implied.', results }, null, 2));
  }
} finally {
  await browser.close();
}
if (results.some((r) => r.viewports.some((v) => !v.passed))) process.exitCode = 1;
