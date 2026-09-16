import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { githubPreview } from './github-preview-server.mjs';

const root = '/europe-cultural-guide-2026';
const output = 'work/offline-resume';
const manifest = JSON.parse(await readFile('dist/client/guide-precache.json', 'utf8'));
const broken = `${root}${manifest.assets.find(path => path.startsWith('/maps/exterior-context/'))}`;
const unavailable = new Set([broken]);
const requests = [];
const preview = await githubPreview('dist/client', root, unavailable, (path, headers) => requests.push({ path, destination: headers['sec-fetch-dest'] }));
const profile = await mkdtemp(join(tmpdir(), 'guide-resume-'));
const options = { channel: 'chrome', headless: true, viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', serviceWorkers: 'allow' };
let context;
const report = { revision: manifest.revision, steps: [], errors: [] };
await mkdir(output, { recursive: true });
async function open() {
  context = await chromium.launchPersistentContext(profile, options);
  const page = await context.newPage();
  page.on('pageerror', error => report.errors.push(error.message));
  await page.goto(preview.url + '/', { waitUntil: 'domcontentloaded' });
  return page;
}
async function failed(page) {
  await page.waitForFunction(() => document.querySelector('.offline-mark')?.textContent.includes('未完成'), null, { timeout: 180000 });
  if (!await page.locator('.offline-panel').isVisible()) await page.locator('.offline-mark').click();
  const progress = page.locator('.offline-panel progress');
  const count = await progress.evaluate(element => ({ completed: element.value, total: element.max }));
  assert.ok(count.completed > 30 && count.completed < count.total);
  assert.ok(await page.getByRole('button', { name: '继续下载', exact: true }).isEnabled());
  return count;
}
const countRequests = path => requests.filter(request => request.path === path && request.destination !== 'document').length;
try {
  let page = await open();
  const first = await failed(page);
  await page.screenshot({ path: `${output}/interrupted-mobile.png` });
  const reuse = ['/itinerary/', '/cities/', '/bookings/', '/guides/uffizi/', '/guides/sforza/'].map(path => `${root}${path}`);
  const initialRequests = Object.fromEntries(reuse.map(path => [path, countRequests(path)]));
  for (const count of Object.values(initialRequests)) assert.equal(count, 1);
  const cached = await page.evaluate(async revision => {
    const key = (await caches.keys()).find(key => key.endsWith(revision));
    const cache = await caches.open(key);
    return { ready: Boolean(await cache.match(location.pathname + 'offline-ready')), files: (await cache.keys()).length };
  }, manifest.revision);
  assert.equal(cached.ready, false);
  report.steps.push({ name: 'interrupted download retains successful files', ...first, cached });

  await page.reload({ waitUntil: 'domcontentloaded' });
  const reloaded = await failed(page);
  assert.ok(reloaded.completed >= first.completed);
  for (const path of reuse) assert.equal(countRequests(path), initialRequests[path], `Redownloaded after reload: ${path}`);
  report.steps.push({ name: 'reload resumes without repeating verified files', ...reloaded });

  await context.close();
  context = null;
  page = await open();
  const reopened = await failed(page);
  assert.ok(reopened.completed >= reloaded.completed);
  for (const path of reuse) assert.equal(countRequests(path), initialRequests[path], `Redownloaded after browser restart: ${path}`);
  report.steps.push({ name: 'browser restart restores the persisted cache', ...reopened });
  unavailable.clear();
  await page.getByRole('button', { name: '继续下载', exact: true }).click();
  await page.waitForFunction(completed => {
    const progress = document.querySelector('.offline-panel progress');
    return progress && progress.value > completed + 8 && progress.value < progress.max;
  }, reopened.completed, { timeout: 60000 });
  await context.setOffline(true);
  await page.waitForFunction(() => navigator.onLine === false);
  await page.waitForFunction(() => document.querySelector('.offline-retry')?.textContent.includes('继续下载'), null, { timeout: 60000 });
  const interrupted = await page.locator('.offline-panel progress').evaluate(element => ({ completed: element.value, total: element.max }));
  assert.ok(interrupted.completed > reopened.completed && interrupted.completed < interrupted.total);
  report.steps.push({ name: 'real network disconnect during active downloading preserves progress', ...interrupted });
  assert.ok(await page.getByRole('button', { name: '继续下载', exact: true }).isDisabled());
  await page.screenshot({ path: `${output}/paused-mobile.png` });
  await context.setOffline(false);
  await page.waitForFunction(() => document.querySelector('.offline-mark')?.textContent.includes('已缓存'), null, { timeout: 240000 });
  await page.waitForFunction(() => navigator.serviceWorker.controller?.state === 'activated');
  for (const path of reuse) assert.equal(countRequests(path), initialRequests[path], `Redownloaded on reconnect: ${path}`);
  const final = await page.locator('.offline-panel progress').evaluate(element => ({ completed: element.value, total: element.max }));
  assert.equal(final.completed, final.total);
  report.steps.push({ name: 'reconnection automatically completes missing files', ...final, reusedRequestCounts: initialRequests });
  await page.screenshot({ path: `${output}/complete-mobile.png` });

  await context.setOffline(true);
  for (const path of ['/', '/itinerary/', '/guides/sforza/']) {
    await page.goto(preview.url + path, { waitUntil: 'domcontentloaded' });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.locator('h1').first().waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
  }
  assert.deepEqual(report.errors, []);
  report.steps.push({ name: 'completed package reloads offline', routes: 3 });
  report.passed = true;
} catch (error) {
  report.failure = String(error);
  throw error;
} finally {
  await context?.close();
  await preview.close();
  await rm(profile, { recursive: true, force: true });
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
}
console.log(JSON.stringify(report, null, 2));
