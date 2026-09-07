import assert from 'node:assert/strict';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { githubPreview } from './github-preview-server.mjs';

const preview = process.env.MAP_QA_URL ? null : await githubPreview();
const base = (process.env.MAP_QA_URL ?? preview.url).replace(/\/$/, '');
const output = process.env.MAP_QA_OUTPUT ?? 'work/map-defaults-review';
const files = (await readdir('app/data/architectural-plans')).filter((file) => file.endsWith('.json'));
const entries = JSON.parse(await readFile('app/data/architectural-entry-floors.json', 'utf8'));
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const report = { base, pages: [], errors: [] };
await mkdir(output, { recursive: true });

async function checkDefault(page, plan) {
  const map = page.locator('.architectural-map');
  await map.locator('.architectural-map__viewport').waitFor();
  assert.equal(await map.getByRole('button', { name: '2D 俯视', exact: true }).getAttribute('aria-pressed'), 'true');
  assert.equal(await map.locator('canvas').count(), 0);
  const floors = [...plan.floors].sort((a, b) => b.order - a.order);
  const entry = entries[plan.slug];
  const initialFloor = floors.find((floor) => floor.id === (entry.floorId ?? entry.fallbackFloorId));
  const buttons = map.locator('.architectural-map__floors button');
  assert.deepEqual(await buttons.allTextContents(), floors.map((floor) => floor.label));
  assert.equal(await map.getByRole('button', { name: initialFloor.label, exact: true }).getAttribute('aria-pressed'), 'true', `${plan.slug}: reviewed entry floor is not selected`);
  assert.equal(await map.locator('.architectural-map__floors button[aria-pressed="true"]').count(), 1);
  assert.equal(await map.locator('.architectural-map__plane > svg').getAttribute('aria-label'), `${initialFloor.label}俯视图`);
  const ids = await map.locator('.architectural-map__2d-labels [data-place-id]').evaluateAll((nodes) => nodes.map((node) => node.dataset.placeId).sort());
  assert.deepEqual(ids, plan.places.filter((place) => place.floorId === initialFloor.id).map((place) => place.id).sort());
  assert.equal(await map.getAttribute('data-entry-status'), entry.status);
  if (entry.status === 'unmapped') {
    assert(await map.locator('[data-entry-notice]').isVisible());
    assert.equal(await map.locator('[data-entry-notice]').textContent(), entry.notice);
  } else assert.equal(await map.locator('[data-entry-notice]').count(), 0);
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  return { map, buttons, floors, initialFloor };
}

try {
  for (const width of [390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 950 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
    const page = await context.newPage();
    page.on('pageerror', (error) => report.errors.push({ url: page.url(), message: error.message }));
    for (const file of files) {
      const plan = JSON.parse(await readFile(join('app/data/architectural-plans', file), 'utf8'));
      await page.goto(`${base}/guides/${plan.slug}/#guide-spatial`, { waitUntil: 'networkidle' });
      const { map, buttons, floors, initialFloor } = await checkDefault(page, plan);
      await map.screenshot({ path: join(output, `${plan.slug}-${width}.png`), style: '.subnav,.guide-local-nav{visibility:hidden!important}' });
      const chosen = floors.find((floor) => floor.id !== initialFloor.id) ?? initialFloor;
      if (floors.length > 1) {
        const otherIndex = floors.findIndex((floor) => floor.id !== initialFloor.id);
        await buttons.nth(otherIndex).click();
        assert.equal(await buttons.nth(otherIndex).getAttribute('aria-pressed'), 'true');
        assert.equal(await map.locator('.architectural-map__plane > svg').getAttribute('aria-label'), `${floors[otherIndex].label}俯视图`);
        await map.getByRole('button', { name: '重置地图视角', exact: true }).click();
        assert.equal(await buttons.nth(otherIndex).getAttribute('aria-pressed'), 'true');
      }
      await map.getByRole('button', { name: '3D', exact: true }).click();
      const canvas = map.locator('canvas');
      await canvas.waitFor({ timeout: 45000 });
      const scene = map.locator('.architectural-map__scene');
      assert.equal(await scene.getAttribute('data-active-floor'), chosen.id);
      const pixels = await canvas.screenshot();
      assert((await sharp(pixels).stats()).channels.slice(0, 3).some((channel) => channel.stdev > 1), '3D canvas must contain geometry');
      await canvas.focus();
      await page.keyboard.press('ArrowRight');
      assert(!pixels.equals(await canvas.screenshot()), 'Keyboard rotation must redraw 3D');
      await map.getByRole('button', { name: '2D 俯视', exact: true }).click();
      assert.equal(await map.getByRole('button', { name: chosen.label, exact: true }).getAttribute('aria-pressed'), 'true');
      await page.reload({ waitUntil: 'networkidle' });
      await checkDefault(page, plan);
      if (['milan-duomo', 'cologne-cathedral', 'casa-batllo', 'uffizi', 'doges-palace', 'vatican-museums', 'notre-dame-towers'].includes(plan.slug)) {
        await map.screenshot({ path: join(output, `${plan.slug}-${width}.png`), style: '.subnav,.guide-local-nav{visibility:hidden!important}' });
      }
      assert.deepEqual(report.errors, []);
      report.pages.push({ slug: plan.slug, width, initialFloor: initialFloor.id, entryStatus: entries[plan.slug].status, floorCount: floors.length, reloadResetsToEntry: true, manual3d: true, nonblankCanvas: true, keyboardRotation: true, floorRoundTrip: true });
      await writeFile(join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
      console.log(plan.slug, width, 'pass');
    }
    await context.close();
  }
  report.passed = true;
} catch (error) {
  report.passed = false;
  report.failure = error.stack;
  process.exitCode = 1;
} finally {
  await browser.close();
  await preview?.close();
  await writeFile(join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
}
console.log(`${report.pages.length} page checks: ${report.passed ? 'pass' : report.failure}`);
