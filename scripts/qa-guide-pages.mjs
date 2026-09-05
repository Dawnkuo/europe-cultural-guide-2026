import { chromium } from 'playwright';
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import { githubPreview } from './github-preview-server.mjs';

const output = process.env.GUIDE_QA_OUTPUT ?? 'work/map-review/guide-pages';
const preview = process.env.GUIDE_QA_URL ? null : await githubPreview('dist/client');
const base = (process.env.GUIDE_QA_URL ?? preview.url).replace(/\/$/, '');
let manifest;
if (process.env.GUIDE_QA_URL) {
  const response = await fetch(`${base}/guide-precache.json`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Live page manifest HTTP ${response.status}`);
  manifest = await response.json();
} else manifest = JSON.parse(await readFile('dist/client/guide-precache.json', 'utf8'));
const requested = process.argv.slice(2);
const routes = requested.length ? requested : [...new Set(['/', '/itinerary/', '/cities/', '/bookings/', '/vatican-guide/', ...manifest.routes])];
const indoorRoutes = new Set((await readdir('app/data/architectural-plans')).filter((f) => f.endsWith('.json')).map((f) => `/guides/${f.slice(0, -5)}/`));
indoorRoutes.add('/vatican-guide/');
const browser = await chromium.launch({ headless: true, channel: 'chrome', args: ['--enable-webgl', '--ignore-gpu-blocklist'] });
const report = { revision: manifest.revision, base, pages: [] };
await mkdir(output, { recursive: true });
try {
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 1094, height: 768 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport, reducedMotion: 'reduce', serviceWorkers: 'block' });
    const page = await context.newPage();
    for (const route of routes) {
      const errors = [];
      const onError = (error) => errors.push(error.message);
      page.on('pageerror', onError);
      const record = { route, viewport, errors };
      report.pages.push(record);
      try {
        const response = await page.goto(`${base}${route}?releaseQa=${manifest.revision}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
        if (!response.ok()) throw new Error(`HTTP ${response.status()}`);
        await page.locator('h1').first().waitFor();
        const map = page.locator('.architectural-map');
        if (indoorRoutes.has(route)) {
          await map.waitFor({ timeout: 45000 });
          await map.scrollIntoViewIfNeeded();
          const canvas = map.locator('canvas');
          await canvas.waitFor({ timeout: 45000 });
          const pixels = await canvas.screenshot();
          record.mapSpread = (await sharp(pixels).stats()).channels.slice(0, 3).reduce((sum, channel) => sum + channel.stdev, 0);
          if (record.mapSpread <= 3) throw new Error('Indoor map canvas is blank');
          if (await map.locator('.architectural-map__loading').count()) throw new Error('Map is still loading');
        }
        const failures = await page.locator('img').evaluateAll(async (images) => {
          const failures = [];
          for (const image of images) {
            image.loading = 'eager';
            try { await image.decode(); } catch { failures.push(image.getAttribute('src')); }
          }
          return failures;
        });
        if (failures.length) throw new Error(`Image decode failures: ${failures.join(', ')}`);
        const size = await page.evaluate(() => ({ width: window.innerWidth, body: document.body.scrollWidth, html: document.documentElement.scrollWidth }));
        if (Math.max(size.body, size.html) > size.width + 1) throw new Error(`Horizontal overflow: ${JSON.stringify(size)}`);
        await page.evaluate(() => window.scrollTo(0, 0));
        record.screenshot = `${output}/${route.replaceAll('/', '_') || 'index'}-${viewport.width}.png`;
        await page.screenshot({ path: record.screenshot, fullPage: true });
        if (errors.length) throw new Error(errors.join('; '));
        record.passed = true;
      } catch (error) {
        record.passed = false;
        record.failure = error.message;
        process.exitCode = 1;
      } finally { page.off('pageerror', onError); }
      console.log(viewport.width, route, record.passed ? 'page pass' : record.failure);
      await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2) + '\n');
    }
    await context.close();
  }
} finally {
  await browser.close();
  await preview?.close();
}
