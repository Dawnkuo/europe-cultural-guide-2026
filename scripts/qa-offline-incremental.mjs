import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm, symlink, unlink, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright';
import { githubPreview } from './github-preview-server.mjs';

assert.ok(process.argv[2], 'Pass the previous production export directory');
const before = resolve(process.argv[2]);
const after = resolve('dist/client');
const oldManifest = JSON.parse(await readFile(join(before, 'guide-precache.json'), 'utf8'));
const manifest = JSON.parse(await readFile(join(after, 'guide-precache.json'), 'utf8'));
assert.notEqual(manifest.revision, oldManifest.revision);
const root = '/europe-cultural-guide-2026';
const output = 'work/offline-incremental';
const temp = await mkdtemp(join(tmpdir(), 'guide-incremental-'));
const exported = join(temp, 'site');
await symlink(before, exported);
const broken = root + manifest.assets.filter(path => path.endsWith('.js') && !oldManifest.assets.includes(path)).at(-1);
assert.notEqual(broken, root + 'undefined', 'Expected a new lazy module');
const corrupt = manifest.assets.find(path => path.startsWith('/images/photo-spots/') && oldManifest.integrity[path] === manifest.integrity[path]);
assert.ok(corrupt);
const unavailable = new Set();
const requests = [];
let stage = 'old';
const preview = await githubPreview(exported, root, unavailable, (path, headers) => requests.push({ stage, path, destination: headers['sec-fetch-dest'] }));
const options = { channel: 'chrome', headless: true, viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', serviceWorkers: 'allow' };
const report = { from: oldManifest.revision, revision: manifest.revision, steps: [], errors: [] };
let context;
await mkdir(output, { recursive: true });
async function open() {
  context = await chromium.launchPersistentContext(join(temp, 'profile'), options);
  const page = await context.newPage();
  page.on('pageerror', error => report.errors.push(error.message));
  await page.goto(preview.url + '/', { waitUntil: 'domcontentloaded' });
  return page;
}
async function saved(page, revision, marker) {
  return await page.evaluate(async ({ revision, marker, root }) => {
    const key = (await caches.keys()).find(key => key.endsWith(revision));
    return key && await (await (await caches.open(key)).match(root + marker))?.json();
  }, { revision, marker, root });
}
async function waitFor(page, revision, phase) {
  const deadline = Date.now() + 240000;
  while (Date.now() < deadline) {
    const value = await saved(page, revision, phase === 'ready' ? '/offline-ready' : '/offline-progress');
    if (value?.phase === phase) return value;
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for ${revision} ${phase}`);
}
const downloads = () => requests.filter(r => r.stage === 'new' && (!r.destination || r.destination === 'empty'));
try {
  let page = await open();
  await waitFor(page, oldManifest.revision, 'ready');
  await page.waitForFunction(() => navigator.serviceWorker.controller?.state === 'activated');
  await page.evaluate(async ({ revision, path, root }) => {
    const key = (await caches.keys()).find(key => key.endsWith(revision));
    const cache = await caches.open(key);
    const old = await cache.match(root + path);
    await cache.put(root + path, new Response('corrupt cached photo', { headers: old.headers }));
  }, { revision: oldManifest.revision, path: corrupt, root });
  report.steps.push({ name: 'previous production version fully cached', ...await saved(page, oldManifest.revision, '/offline-ready') });
  console.log('Previous production cache installed');
  await unlink(exported); await symlink(after, exported);
  unavailable.add(broken); stage = 'new';
  await page.evaluate(async () => { await (await navigator.serviceWorker.getRegistration()).update(); });
  const failed = await waitFor(page, manifest.revision, 'failed');
  console.log('Failed update checkpoint', failed, 'blocked', broken);
  assert.ok(failed.reused > 0 && failed.completed < failed.total);
  assert.ok(await saved(page, oldManifest.revision, '/offline-ready'));
  assert.equal(await saved(page, manifest.revision, '/offline-ready'), undefined);
  report.steps.push({ name: 'failed update retains the previous complete version', ...failed });
  console.log('Interrupted incremental update', failed);
  await context.setOffline(true);
  await page.goto(preview.url + '/itinerary/'); await page.reload();
  await page.locator('h1').first().waitFor();
  assert.ok(await saved(page, oldManifest.revision, '/offline-ready'));
  await context.close(); context = null;
  page = await open();
  const reopened = await waitFor(page, manifest.revision, 'failed');
  assert.ok(reopened.completed >= failed.completed && reopened.reused >= failed.reused);
  report.steps.push({ name: 'browser restart retains incremental progress', ...reopened });
  unavailable.clear();
  await page.locator('.offline-mark').click();
  await page.getByRole('button', { name: /^(继续下载|检查更新)$/ }).click();
  await waitFor(page, manifest.revision, 'ready');
  await page.waitForFunction(async old => !(await caches.keys()).some(key => key.endsWith(old)), oldManifest.revision);
  await page.reload(); await page.locator('.offline-mark').click();
  await page.getByText(/已复用 \d.*项 · 已下载/).waitFor();
  const ready = await saved(page, manifest.revision, '/offline-ready');
  assert.equal(ready.completed, ready.total);
  assert.equal(ready.reused + ready.downloaded, ready.total);
  const unchanged = manifest.assets.filter(path => oldManifest.integrity[path] === manifest.integrity[path] && path !== corrupt);
  assert.ok(ready.reused >= unchanged.length);
  const transfers = await page.evaluate(async ({ revision, root }) => {
    const key = (await caches.keys()).find(key => key.endsWith(revision));
    const cache = await caches.open(key);
    const entries = [];
    for (const request of await cache.keys()) {
      const response = await cache.match(request);
      if (response.headers.has('X-Offline-Sha256')) entries.push([new URL(request.url).pathname.slice(root.length), response.headers.get('X-Offline-Transfer')]);
    }
    return Object.fromEntries(entries);
  }, { revision: manifest.revision, root });
  for (const path of unchanged) assert.equal(transfers[path], 'reused', `Unchanged cache entry was not reused: ${path}`);
  // Normal online navigation remains network-first, including JavaScript and
  // hero images. Distinguish those requests from the offline package transfer.
  const coldAssets = unchanged.filter(path => /\/(photo-spots|exterior-context|floorplans|models)\//.test(path));
  for (const path of coldAssets) assert.ok(!downloads().some(r => r.path === root + path), `Redownloaded cold asset: ${path}`);
  assert.equal(downloads().filter(r => r.path === root + corrupt).length, 1, 'Corrupt photo must be repaired once');
  const downloadedPaths = Object.keys(transfers).filter(path => transfers[path] === 'downloaded');
  assert.equal(downloadedPaths.length, ready.downloaded);
  let downloadedBytes = 0;
  for (const path of downloadedPaths) downloadedBytes += (await stat(join(after, path.endsWith('/') ? path + 'index.html' : path))).size;
  report.steps.push({ name: 'unchanged package entries reused; changed/new/corrupt files fetched', ...ready, unchangedAssets: unchanged.length, coldAssetsAvoidingNetwork: coldAssets.length, downloadedPayloadBytes: downloadedBytes, corruptPhotoRepaired: corrupt });
  await page.screenshot({ path: `${output}/incremental-complete-390.png` });
  console.log('Incremental cache ready', ready, 'downloaded bytes', downloadedBytes);
  await page.getByRole('button', { name: '关闭离线状态' }).click();
  await context.setOffline(true);
  await page.goto(preview.url + '/photo-spots/#kind=indoor'); await page.reload();
  await page.waitForFunction(() => document.querySelectorAll('.photo-spot').length === 51 && document.querySelector('.photo-directory')?.dataset.ready === 'true');
  await page.locator('.photo-spot__image img').evaluateAll(async images => { for (const image of images) { image.loading = 'eager'; await image.decode(); } });
  await page.getByRole('button', { name: /查看完整成片/ }).first().click();
  await page.getByRole('dialog').locator('img').evaluate(image => image.decode());
  await page.keyboard.press('Escape');
  await page.goto(preview.url + '/guides/casa-batllo/#guide-spatial'); await page.reload();
  const map = page.locator('.architectural-map'); await map.waitFor();
  assert.equal(await map.getByRole('button', { name: '2D 俯视', exact: true }).getAttribute('aria-pressed'), 'true');
  assert.deepEqual(report.errors, []);
  report.steps.push({ name: 'updated version opens unvisited photos, lazy zoom and maps offline', indoorPhotos: 51 });
  report.passed = true;
} catch (error) {
  report.failure = error.stack; process.exitCode = 1; console.error(error);
  const page = context?.pages().at(-1);
  if (page && !page.isClosed()) {
    console.error(await page.locator('.offline-panel').textContent().catch(() => 'No status panel'));
    await page.screenshot({ path: `${output}/failure.png` }).catch(() => {});
  }
}
finally {
  await context?.close(); await preview.close(); await rm(temp, { recursive: true, force: true });
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2) + '\n');
}
