import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const origin = process.env.QA_ORIGIN ?? 'http://localhost:55910';
const output = process.env.QA_OUTPUT ?? 'work/experience/retained-local-build';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
try {
  await page.goto(`${origin}/guides/uffizi`, { waitUntil: 'networkidle' });
  await page.locator('#guide-highlights').scrollIntoViewIfNeeded();
  assert.equal(await page.locator('.highlight-browser__grid article').count(), 32);
  const log = createWriteStream(`${output}/build.log`);
  try {
    await new Promise((resolve, reject) => {
      const child = spawn('npm', ['run', 'build:github'], { stdio: ['ignore', 'pipe', 'pipe'] });
      child.stdout.pipe(log, { end: false });
      child.stderr.pipe(log, { end: false });
      child.on('error', reject);
      child.on('exit', code => code === 0 ? resolve() : reject(new Error(`Local export failed: ${code}`)));
    });
  } finally { await new Promise(resolve => log.end(resolve)); }
  await page.goto(`${origin}/`, { waitUntil: 'networkidle' });
  await page.getByRole('link', { name: '景点导览', exact: true }).first().click();
  await page.locator('a[href="/guides/uffizi/"]').first().click();
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('#guide-spatial').scrollIntoViewIfNeeded();
  await page.locator('.architectural-map__plane > svg').waitFor();
  assert.equal(await page.getByRole('button', { name: '2D 俯视', exact: true }).getAttribute('aria-pressed'), 'true');
  await page.getByRole('button', { name: '放大地图', exact: true }).click();
  await page.screenshot({ path: `${output}/retained-dev.png` });
  assert.deepEqual(errors, []);
  await writeFile(`${output}/report.json`, JSON.stringify({ origin, retainedTab: true, build: true, directoryNavigation: true, reload: true, default2d: true, errors, passed: true }, null, 2));
  console.log('Local export and retained development-tab checks passed');
} finally { await browser.close(); }
