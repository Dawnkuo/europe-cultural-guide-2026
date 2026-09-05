import { chromium } from 'playwright';
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { githubPreview } from './github-preview-server.mjs';

const root = 'dist/client';
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
const report = { revision: manifest.revision, target: base, scope: `${preview ? 'Local exported GitHub Pages build' : 'Live GitHub Pages deployment'}; real Chromium offline reloads, lazy maps and cache inventory. Visual source fidelity is a separate review.`, routes: [] };
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
        await map.locator('canvas').waitFor({ timeout: 45000 });
        const pixels = await map.locator('canvas').screenshot();
        if ((await sharp(pixels).stats()).channels.slice(0, 3).every((c) => c.stdev < 1)) throw new Error('Offline WebGL is blank');
        await map.getByRole('button', { name: '2D 俯视', exact: true }).click();
        for (const floor of model.floors) {
          await map.getByRole('button', { name: floor.label, exact: true }).click();
          const expected = model.places.filter((p) => p.floorId === floor.id).map((p) => `${p.id}:${p.label}`).sort();
          const actual = await map.locator('.architectural-map__2d-labels [data-place-id]').evaluateAll((nodes) => nodes.map((node) => `${node.dataset.placeId}:${node.querySelector('button').textContent}`).sort());
          if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`Offline room inventory mismatch ${floor.id}`);
        }
        record.modelDigest = createHash('sha256').update(JSON.stringify(model)).digest('hex');
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
