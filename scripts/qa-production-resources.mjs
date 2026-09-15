import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { createServer } from 'vite';
import { chromium } from 'playwright';
import { githubPreview } from './github-preview-server.mjs';

const output = process.env.RESOURCE_QA_OUTPUT ?? 'work/production-cleanup/resources';
await mkdir(output, { recursive: true });
const images = new Set();
const vite = await createServer({ configFile: false, cacheDir: 'node_modules/.vite-resource-audit', server: { middlewareMode: true } });
try {
  const { guideCatalog } = await vite.ssrLoadModule('/app/data/guides.ts');
  function collect(value) {
    if (typeof value === 'string' && /^\/(?:images|vatican-guide\/assets\/images)\//.test(value)) images.add(value);
    else if (Array.isArray(value)) value.forEach(collect);
    else if (value && typeof value === 'object') Object.values(value).forEach(collect);
  }
  collect(guideCatalog);
} finally { await vite.close(); }

const unchanged = [];
async function compareDirectory(directory) {
  for (const entry of await readdir(`public/${directory}`, { withFileTypes: true })) {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) await compareDirectory(path);
    else {
      const original = await readFile(`public/${path}`);
      assert.ok(original.equals(await readFile(`dist/client/${path}`)), `Production asset changed: ${path}`);
      unchanged.push({ path, sha256: createHash('sha256').update(original).digest('hex') });
    }
  }
}
for (const directory of ['models', 'maps', 'map-data', 'textures']) await compareDirectory(directory);
const preview = process.env.RESOURCE_QA_URL ? null : await githubPreview();
const base = (process.env.RESOURCE_QA_URL ?? preview.url).replace(/\/$/, '');
const manifest = await (await fetch(`${base}/guide-precache.json`, { cache: 'no-store' })).json();
for (const image of images) assert.ok(manifest.assets.includes(image), `Gallery image missing from precache: ${image}`);
const pruned = JSON.parse(await readFile('work/production-cleanup/pruned.json', 'utf8'));
for (const item of pruned.removed) assert.ok(!manifest.assets.includes(`/${item.path}`), `Removed asset still precached: ${item.path}`);
const staleImage = pruned.removed.find(item => item.reason === 'unreferenced-media').path;
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'allow' });
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
try {
  // Seed an earlier release cache before any application code registers a worker.
  await page.goto(`${base}/favicon.svg`);
  await page.evaluate(async url => {
    const old = await caches.open('europe-cultural-guide-v9-cleanup-old');
    await old.put(url, new Response('obsolete image'));
  }, `${base}/${staleImage}`);
  assert.equal((await context.request.get(`${base}/models/`)).status(), 404);
  assert.equal((await context.request.get(`${base}/${staleImage}`)).status(), 404);
  await page.goto(`${base}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => navigator.serviceWorker.controller?.state === 'activated', null, { timeout: 240000 });
  assert.equal(await page.evaluate(async ({ revision, base }) => {
    const keys = await caches.keys();
    const current = keys.find(key => key.endsWith(revision));
    return Boolean(current && !keys.includes('europe-cultural-guide-v9-cleanup-old') && await (await caches.open(current)).match(`${base}/offline-ready`));
  }, { revision: manifest.revision, base }), true);
  const cached = await page.evaluate(async revision => {
    const key = (await caches.keys()).find(key => key.endsWith(revision));
    return (await (await caches.open(key)).keys()).map(request => request.url);
  }, manifest.revision);
  for (const item of pruned.removed) assert.ok(!cached.includes(`${base}/${item.path}`), `Removed asset remains cached: ${item.path}`);
  assert.ok(cached.includes(`${base}/`), 'Home route is missing from the new cache');
  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  const failures = await page.evaluate(async ({ base, sources }) => {
    const failures = [];
    for (const src of sources) {
      const image = new Image();
      image.src = `${base}${src}`;
      try { await image.decode(); } catch { failures.push(src); }
    }
    return failures;
  }, { base, sources: [...images] });
  assert.deepEqual(failures, []);
  assert.deepEqual(errors, []);
  const report = { target: base, revision: manifest.revision, galleryImagesDecodedOffline: images.size, unchangedSpatialAssets: unchanged, oldCacheRemoved: true, removedResourcesNotCached: pruned.removed.length, trialRouteStatus: 404, errors, passed: true };
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
  console.log({ ...report, unchangedSpatialAssets: unchanged.length });
} finally {
  await context.close();
  await browser.close();
  await preview?.close();
}
