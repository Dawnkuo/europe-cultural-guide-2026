import { chromium } from 'playwright';
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { githubPreview } from './github-preview-server.mjs';

const root = 'dist/client';
const entries = JSON.parse(await readFile('app/data/architectural-entry-floors.json', 'utf8'));
const output = process.env.OFFLINE_QA_OUTPUT ?? 'work/map-review/offline';
const preview = process.env.OFFLINE_QA_URL ? null : await githubPreview(root);
const base = (process.env.OFFLINE_QA_URL ?? preview.url).replace(/\/$/, '');
let manifest;
if (process.env.OFFLINE_QA_URL) {
  const response = await fetch(`${base}/guide-precache.json`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Live offline manifest HTTP ${response.status}`);
  manifest = await response.json();
} else manifest = JSON.parse(await readFile(`${root}/guide-precache.json`, 'utf8'));
const requested = process.argv.slice(2);
const coreRoutes = ['/', '/itinerary/', '/cities/', '/bookings/', '/vatican-guide/'];
const routes = requested.length ? requested.map((slug) => slug.startsWith('/') ? slug : `/guides/${slug}/`) : [...new Set([...coreRoutes, ...manifest.routes])];
const models = new Map(await Promise.all((await readdir('app/data/architectural-plans')).filter((f) => f.endsWith('.json')).map(async (f) => {
  const model = JSON.parse(await readFile(`app/data/architectural-plans/${f}`, 'utf8'));
  return [model.slug, model];
})));
const browser = await chromium.launch({ headless: true, channel: 'chrome', args: ['--enable-webgl', '--ignore-gpu-blocklist'] });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', serviceWorkers: 'allow' });
const page = await context.newPage();
const localTarget = preview || ['127.0.0.1', 'localhost', '[::1]'].includes(new URL(base).hostname);
const report = { revision: manifest.revision, target: base, scope: `${localTarget ? 'Local exported or packaged build' : 'Remote deployment'}; real Chromium offline reloads, lazy maps and cache inventory. Visual source fidelity is a separate review.`, routes: [] };
await mkdir(output, { recursive: true });
try {
  await page.goto(`${base}/`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(async () => { await navigator.serviceWorker.register(`${location.pathname}sw.js`); await navigator.serviceWorker.ready; });
  await page.waitForFunction(async (revision) => {
    const keys = await caches.keys();
    const key = keys.find((key) => key.endsWith(revision));
    return key && Boolean(await (await caches.open(key)).match(`${location.pathname}offline-ready`));
  }, manifest.revision, { timeout: 240000 });
  const missing = await page.evaluate(async ({ assets, routes, revision }) => {
    const key = (await caches.keys()).find((key) => key.endsWith(revision));
    const cache = await caches.open(key);
    const absent = [];
    for (const path of [...assets, ...routes]) if (!await cache.match(`${location.pathname.replace(/\/$/, '')}${path}`)) absent.push(path);
    return absent;
  }, manifest);
  report.missingPrecache = missing;
  if (missing.length) throw new Error(`Missing precache resources: ${missing.join(', ')}`);
  await context.setOffline(true);
  for (const route of routes) {
    const slug = route.split('/').filter(Boolean).at(-1);
    const model = models.get(route === '/vatican-guide/' ? 'vatican-museums' : slug);
    const errors = [];
    const onError = (error) => errors.push(error.message);
    page.on('pageerror', onError);
    const record = { route, hasMap: Boolean(model), errors };
    report.routes.push(record);
    try {
      await page.goto(`${base}${route}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 45000 });
      if (model) {
        const map = page.locator('.architectural-map');
        await map.waitFor({ timeout: 45000 });
        await map.scrollIntoViewIfNeeded();
        if (await map.getByRole('button', { name: '2D 俯视', exact: true }).getAttribute('aria-pressed') !== 'true') throw new Error('Offline map must open in 2D');
        const entry = entries[model.slug];
        const entryFloor = model.floors.find((floor) => floor.id === (entry.floorId ?? entry.fallbackFloorId));
        if (await map.getByRole('button', { name: entryFloor.label, exact: true }).getAttribute('aria-pressed') !== 'true') throw new Error('Offline entrance floor mismatch');
        if (entry.status === 'unmapped' && await map.locator('[data-entry-notice]').textContent() !== entry.notice) throw new Error('Missing offline entrance limitation');
        record.default2d = true;
        record.entryFloor = entryFloor.id;
        await map.getByRole('button', { name: '3D', exact: true }).click();
        await map.locator('canvas').waitFor({ timeout: 45000 });
        if (await map.locator('.architectural-map__scene').getAttribute('data-active-floor') !== entryFloor.id) throw new Error('Offline 3D lost entrance floor');
        const pixels = await map.locator('canvas').screenshot();
        if ((await sharp(pixels).stats()).channels.slice(0, 3).every((c) => c.stdev < 1)) throw new Error('Offline WebGL is blank');
        await map.getByRole('button', { name: '2D 俯视', exact: true }).click();
        for (const floor of model.floors) {
          await map.getByRole('button', { name: floor.label, exact: true }).click();
          const expected = model.places.filter((p) => p.floorId === floor.id).map((p) => `${p.id}:${p.label}`).sort();
          const actual = await map.locator('.architectural-map__2d-labels [data-place-id]').evaluateAll((nodes) => nodes.map((node) => `${node.dataset.placeId}:${node.querySelector('[data-place-label]').textContent}`).sort());
          if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`Offline room inventory mismatch ${floor.id}`);
          const expectedNumbers = model.places.filter((p) => p.floorId === floor.id).flatMap((place) => {
            const numbers = [...new Set(model.stopBindings.filter((binding) => binding.placeId === place.id).map((binding) => binding.stopIndex + 1))].sort((a,b) => a-b);
            return numbers.length ? [`${place.id}:${numbers.join(',')}`] : [];
          }).sort();
          const actualNumbers = await map.locator('.architectural-map__2d-labels [data-guide-numbers]').evaluateAll((nodes) => nodes.map((node) => `${node.closest('[data-place-id]').dataset.placeId}:${node.dataset.guideNumbers}`).sort());
          if (JSON.stringify(actualNumbers) !== JSON.stringify(expectedNumbers)) throw new Error(`Offline guide numbers mismatch ${floor.id}`);
        }
        record.modelDigest = createHash('sha256').update(JSON.stringify(model)).digest('hex');
        record.routeNumbering = true;
      }
      if (['st-peters-basilica', 'st-peters-square'].includes(slug)) {
        if (model) await page.getByRole('button', { name: '外观', exact: true }).click();
        await page.waitForFunction(() => document.querySelector('.guide-spatial-3d__canvas')?.dataset.rendered === 'true', null, { timeout: 45000 });
        for (const name of ['全景', '圣彼得大教堂', '圣彼得广场']) {
          await page.getByRole('group', { name: '外观范围' }).getByRole('button', { name, exact: true }).click();
        }
        const canvas = page.locator('.guide-spatial-3d__canvas');
        await canvas.scrollIntoViewIfNeeded();
        const pixels = await canvas.screenshot({ path: `${output}/${slug}-exterior-offline.png` });
        if ((await sharp(pixels).stats()).channels.slice(0, 3).every((c) => c.stdev < 1)) throw new Error('Offline exterior is blank');
        record.firstOpenedExteriorOffline = true;
      }
      if (['vatican-museums', 'vatican-guide'].includes(slug)) {
        await page.getByRole('button', { name: '外观', exact: true }).click();
        await page.waitForFunction(() => document.querySelector('.guide-spatial-3d__canvas')?.dataset.rendered === 'true', null, { timeout: 45000 });
        const canvas = page.locator('.guide-spatial-3d__canvas');
        if (await canvas.getAttribute('data-model') !== 'museum-massing:vatican-museums') throw new Error('Offline museum exterior did not load the current local asset');
        if (await canvas.getAttribute('data-context') !== 'ready') throw new Error('Offline museum exterior lost its OSM surroundings');
        const counts = JSON.parse(await canvas.getAttribute('data-context-counts'));
        if (!(counts.buildings > 0 && counts.roads > 0)) throw new Error('Offline museum surroundings are empty');
        await page.getByRole('button', { name: '放大外观', exact: true }).click();
        await page.getByRole('button', { name: '重置三维视角', exact: true }).click();
        if (await canvas.getAttribute('data-framing') !== 'complete') throw new Error('Offline museum exterior did not restore complete framing');
        await canvas.scrollIntoViewIfNeeded();
        const pixels = await canvas.screenshot({ path: `${output}/${slug}-museum-exterior-offline.png` });
        if ((await sharp(pixels).stats()).channels.slice(0, 3).every(channel => channel.stdev < 1)) throw new Error('Offline museum model is blank');
        record.firstOpenedMuseumExteriorOffline = true;
        record.museumContextCounts = counts;
      }
      if (['vatican-museums', 'vatican-guide', 'st-peters-basilica', 'st-peters-square'].includes(slug)) {
        await page.getByRole('button', { name: '馆区总览', exact: true }).click();
        const campus = page.getByRole('region', { name: '梵蒂冈馆区总览', exact: true });
        await campus.locator('img').evaluate(image => image.decode());
        const list = campus.getByLabel('馆区列表');
        if (await list.getByRole('button').count() !== 14) throw new Error('Offline campus region inventory mismatch');
        await list.getByRole('button', { name: '西侧长廊', exact: true }).click();
        if (await campus.locator('.vatican-campus__pin').getAttribute('data-campus-region') !== 'west-galleries') throw new Error('Offline campus selection failed');
        await campus.getByRole('button', { name: '3D 馆区', exact: true }).click();
        const compound = campus.locator('.vatican-campus__three-stage canvas');
        await compound.scrollIntoViewIfNeeded();
        await page.waitForFunction(() => Number(document.querySelector('.vatican-campus__three-stage canvas')?.dataset.frames) > 0, null, { timeout: 45000 });
        await campus.getByRole('button', { name: '显示完整三维馆区', exact: true }).click();
        const compoundPixels = await compound.screenshot({ path: `${output}/${slug}-compound-offline.png` });
        if ((await sharp(compoundPixels).stats()).channels.slice(0, 3).every(channel => channel.stdev < 1)) throw new Error('Offline registered compound is blank');
        if (await compound.getAttribute('data-model') !== 'registered-basilica-square-and-sistine-with-flat-campus-context') throw new Error('Unexpected offline compound geometry');
        await list.getByRole('button', { name: '西斯廷礼拜堂', exact: true }).click();
        await compound.scrollIntoViewIfNeeded();
        await page.waitForFunction(() => document.querySelector('.vatican-campus__three-stage canvas')?.dataset.target?.split(',')[1] === '31.00');
        if (await compound.getAttribute('data-focus') !== 'sistine') throw new Error('Offline Sistine selection missed the source mesh');
        await page.evaluate(() => scrollBy(0, document.querySelector('.vatican-campus__three-stage').getBoundingClientRect().top - 160));
        await compound.screenshot({ path: `${output}/${slug}-sistine-offline.png` });
        record.firstOpenedSistineFocusOffline = true;
        await list.getByRole('button', { name: '西侧长廊', exact: true }).click();
        await campus.getByRole('button', { name: '2D 馆区', exact: true }).click();
        if (await campus.getByLabel('馆区缩放比例').innerText() !== '100%') throw new Error('Restored 2D campus zoom disagrees with initial transform');
        if (await list.getByRole('button', { name: '西侧长廊', exact: true }).getAttribute('aria-pressed') !== 'true') throw new Error('Compound switch lost area selection');
        record.firstOpenedRegisteredCompoundOffline = true;
        await list.getByRole('button', { name: '图书馆横翼', exact: true }).click();
        const library = campus.locator('.vatican-library');
        await library.locator('summary').click();
        await library.getByRole('img').waitFor();
        await library.getByRole('button', { name: '3D 剖切', exact: true }).click();
        await library.locator('canvas').scrollIntoViewIfNeeded();
        await page.waitForFunction(() => Number(document.querySelector('.vatican-library canvas')?.dataset.frames) > 0, null, { timeout: 45000 });
        const libraryPixels = await library.locator('canvas').screenshot({ path: `${output}/${slug}-library-offline.png` });
        if ((await sharp(libraryPixels).stats()).channels[0].stdev < 15) throw new Error('Offline library cutaway is blank');
        await library.getByRole('button', { name: '2D 平面', exact: true }).click();
        if (await library.getByRole('listitem').count() !== 3) throw new Error('Offline library spaces missing');
        record.firstOpenedLibraryStudyOffline = true;
        await list.getByRole('button', { name: '西侧长廊', exact: true }).click();
        if (['vatican-museums', 'vatican-guide'].includes(slug)) {
          await campus.getByRole('button', { name: '地图廊', exact: true }).click();
          await page.waitForFunction(() => document.querySelector('[data-place-id="second-8-1"] button')?.getAttribute('aria-pressed') === 'true');
          if (await page.getByRole('button', { name: '2D 俯视', exact: true }).getAttribute('aria-pressed') !== 'true') throw new Error('Offline campus room link lost 2D view');
          record.campusRoomLink = 'second-8-1';
        }
        record.firstOpenedCampusOffline = true;
      }
      const imageFailures = await page.locator('img').evaluateAll(async (images) => {
        const failed = [];
        for (const image of images) {
          image.loading = 'eager';
          try { await image.decode(); } catch { failed.push(image.getAttribute('src')); }
          if (!image.naturalWidth && !failed.includes(image.getAttribute('src'))) failed.push(image.getAttribute('src'));
        }
        return failed;
      });
      if (imageFailures.length) throw new Error(`Offline image failures: ${imageFailures.join(', ')}`);
      if (errors.length) throw new Error(errors.join('; '));
      record.passed = true;
    } catch (error) {
      record.passed = false;
      record.failure = error.message;
      await page.screenshot({ path: `${output}/${slug}-failure.png` }).catch(() => {});
    } finally {
      page.off('pageerror', onError);
    }
    console.log(route, record.passed ? 'offline pass' : record.failure);
    await writeFile(`${output}/${slug || 'index'}-report.json`, JSON.stringify({ revision: manifest.revision, ...record }, null, 2));
    await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
  }
} finally {
  await context.close();
  await browser.close();
  await preview?.close();
}
if (report.routes.some((r) => !r.passed)) process.exitCode = 1;
