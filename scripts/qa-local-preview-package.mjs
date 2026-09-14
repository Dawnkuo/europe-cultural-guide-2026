import assert from 'node:assert/strict';
import { createReadStream } from 'node:fs';
import { readFile, mkdir, stat, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync, spawn } from 'node:child_process';
import { once } from 'node:events';
import { basename, join, resolve } from 'node:path';
import { chromium } from 'playwright';

const archive = resolve(process.argv[2]);
const output = resolve(process.env.QA_OUTPUT ?? 'work/experience/local-preview-package');
await mkdir(output, { recursive: true });
const extracted = join(output, 'extracted');
await mkdir(extracted);
execFileSync('/usr/bin/unzip', ['-q', archive, '-d', extracted]);
const root = join(extracted, basename(archive, '.zip'));
const files = JSON.parse(await readFile(join(root, 'files.sha256.json'), 'utf8'));
for (const file of files) {
  assert.ok(file.path.startsWith('site/') || ['serve.mjs', 'Start.command', 'README.md', 'release.json'].includes(file.path));
  const path = join(root, file.path), hash = createHash('sha256');
  assert.equal((await stat(path)).size, file.bytes);
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  assert.equal(hash.digest('hex'), file.sha256, file.path);
}
assert.ok((await stat(join(root, 'Start.command'))).mode & 0o111);
const release = JSON.parse(await readFile(join(root, 'release.json'), 'utf8'));
const manifest = JSON.parse(await readFile(join(root, 'site/guide-precache.json'), 'utf8'));
assert.equal(release.revision, manifest.revision);

const child = spawn(process.execPath, [join(root, 'serve.mjs')], { stdio: ['ignore', 'pipe', 'pipe'] });
let log = '';
child.stdout.on('data', data => { log += data; });
child.stderr.on('data', data => { log += data; });
let browser;
const report = { revision: release.revision, files: files.length, archive, checks: [] };
try {
  const url = await new Promise((done, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Preview did not start: ${log}`)), 15000);
    child.on('error', reject);
    child.stdout.on('data', () => {
      const match = log.match(/Local Europe guide: (http:\/\/[^\s]+)/);
      if (match) { clearTimeout(timeout); done(match[1]); }
    });
  });
  report.url = url;
  const status = await (await fetch(`${new URL(url).origin}/__local-preview.json`)).json();
  assert.equal(status.revision, release.revision);
  browser = await chromium.launch({ channel: 'chrome' });
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 960 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const route of ['', 'itinerary/', 'cities/', 'bookings/', 'guides/', 'guides/accademia-florence/']) {
      await page.goto(`${url}${route}`, { waitUntil: 'networkidle' });
      await page.locator('h1').first().waitFor();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
      if (!route) await page.screenshot({ path: `${output}/home-${width}.png` });
      if (route === 'guides/accademia-florence/') {
        const map = page.locator('.architectural-map');
        await map.scrollIntoViewIfNeeded();
        assert.equal(await map.getByRole('button', { name: '2D 俯视', exact: true }).getAttribute('aria-pressed'), 'true');
        await map.screenshot({ path: `${output}/accademia-map-${width}.png` });
      }
      report.checks.push({ width, route: `/${route}`, passed: true });
    }
    assert.deepEqual(errors, []);
    await page.close();
  }
  await browser.close(); browser = null;
  const offline = spawn(process.execPath, ['scripts/qa-architectural-offline.mjs'], {
    stdio: 'inherit', env: { ...process.env, OFFLINE_QA_URL: url, OFFLINE_QA_OUTPUT: join(output, 'offline') },
  });
  const [code] = await once(offline, 'exit');
  assert.equal(code, 0);
  report.offline = JSON.parse(await readFile(join(output, 'offline/report.json'), 'utf8'));
  assert.equal(report.offline.revision, release.revision);
  report.passed = true;
} finally {
  await browser?.close();
  child.kill('SIGTERM');
  await once(child, 'exit');
  await writeFile(join(output, 'report.json'), JSON.stringify(report, null, 2));
}
console.log(JSON.stringify({ revision: report.revision, files: report.files, checks: report.checks.length, offlineRoutes: report.offline?.routes.length, passed: report.passed }));
