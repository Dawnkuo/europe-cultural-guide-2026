import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { githubPreview } from './github-preview-server.mjs';

const preview = process.env.JOURNEY_QA_URL ? null : await githubPreview();
const base = (process.env.JOURNEY_QA_URL ?? preview.url).replace(/\/$/, '');
const output = process.env.JOURNEY_QA_OUTPUT ?? 'work/journey-order-review';
const order = ['巴黎', '米兰', '威尼斯', '佛罗伦萨', '比萨', '佛罗伦萨', '罗马', '巴塞罗那', '科隆', '巴黎'];
const steps = order.map((_, index) => String(index + 1).padStart(2, '0'));
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
const page = await context.newPage();
const report = { base, pages: [], errors: [] };
page.on('pageerror', (error) => report.errors.push(error.message));
await mkdir(output, { recursive: true });

async function checkMap(page) {
  const map = page.locator('.europe-map');
  await map.scrollIntoViewIfNeeded();
  await page.waitForFunction(() => {
    const map = document.querySelector('.europe-map');
    return Math.abs(map.querySelector('svg').viewBox.baseVal.width - map.getBoundingClientRect().width) < 1;
  });
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  assert.deepEqual(await map.locator('.europe-map__steps b').allTextContents().then((items) => items.sort()), steps);
  assert.deepEqual(await page.locator('.journey-strip strong').allTextContents(), order);
  const legs = await map.locator('[data-route-leg]').evaluateAll((nodes) => nodes.map((node) => ({
    from: node.dataset.routeFrom, to: node.dataset.routeTo,
    arrow: node.querySelector('[marker-end]')?.getAttribute('marker-end'),
  })));
  assert.deepEqual(legs.map(({ from, to }) => [from, to]), order.slice(1).map((to, index) => [order[index], to]));
  assert(legs.every((leg) => leg.arrow?.startsWith('url(#journey-direction-')));
  const palette = await map.evaluate((root) => [...root.querySelectorAll('[data-city]')].map((label) => {
    const city = label.dataset.city;
    return {
      city,
      border: getComputedStyle(label).borderTopColor,
      badges: [...label.querySelectorAll('b')].map((badge) => getComputedStyle(badge).backgroundColor),
      point: getComputedStyle(root.querySelector(`[data-city-anchor="${city}"] circle:last-child`)).fill,
      leader: getComputedStyle(root.querySelector(`[data-city-leader="${city}"]`)).stroke,
    };
  }));
  assert.equal(new Set(palette.map((city) => city.border)).size, 8, 'Every city needs its own color');
  for (const city of palette) assert([city.point, city.leader, ...city.badges].every((color) => color === city.border), 'Inconsistent city color: ' + city.city);
  // Read every rectangle in one frame so scrolling cannot skew comparisons.
  const { bounds, labels, anchors } = await map.evaluate((map) => ({
    bounds: map.getBoundingClientRect().toJSON(),
    labels: [...map.querySelectorAll('.europe-map__marker')].map((node) => {
      const r = node.getBoundingClientRect();
      return { city: node.dataset.city, x: r.x, y: r.y, w: r.width, h: r.height, scrollWidth: node.scrollWidth, clientWidth: node.clientWidth };
    }),
    anchors: [...map.querySelectorAll('[data-city-anchor]')].map((node) => {
      const r = node.getBoundingClientRect();
      return { city: node.dataset.cityAnchor, x: r.x + r.width / 2, y: r.y + r.height / 2 };
    }),
  }));
  for (const [index, label] of labels.entries()) {
    assert(label.x >= bounds.x && label.y >= bounds.y && label.x + label.w <= bounds.x + bounds.width + 1 && label.y + label.h <= bounds.y + bounds.height + 1, 'Label outside map: ' + label.city);
    assert(label.h >= 44 && label.scrollWidth <= label.clientWidth, 'Clipped or undersized label: ' + label.city);
    for (const other of labels.slice(index + 1)) {
      assert(label.x + label.w <= other.x || other.x + other.w <= label.x || label.y + label.h <= other.y || other.y + other.h <= label.y, 'Overlapping labels: ' + label.city + '/' + other.city);
    }
  }
  for (const label of labels) for (const anchor of anchors) {
    assert(anchor.x + 6 <= label.x || anchor.x - 6 >= label.x + label.w || anchor.y + 6 <= label.y || anchor.y - 6 >= label.y + label.h, 'Label covers city point: ' + JSON.stringify({ bounds, label, anchor }));
  }
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Page overflow');
  return map;
}

try {
  await page.goto(base + '/#journey-map', { waitUntil: 'networkidle' });
  for (const width of [320, 375, 390, 558, 700, 768, 1094, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    const map = await checkMap(page);
    for (const city of new Set(order)) {
      const button = map.getByRole('button', { name: '查看' + city + '行程' });
      await button.click();
      assert.equal(await button.getAttribute('aria-pressed'), 'true');
      assert.equal(await page.locator('.map-caption h3').textContent(), city);
      const target = new URL(await page.locator('.map-caption a').getAttribute('href'), base);
      assert.equal(target.searchParams.get('city'), city);
    }
    const first = map.getByRole('button', { name: '查看巴黎行程' });
    await first.focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('.map-caption h3').textContent(), '巴黎');
    await map.getByRole('button', { name: '查看罗马行程' }).click();
    await page.mouse.move(1, 1);
    const pixels = await map.screenshot({ path: output + '/map-' + width + '.png', style: '.site-header{visibility:hidden!important}' });
    assert((await sharp(pixels).stats()).channels.some((channel) => channel.stdev > 4), 'Blank map');
    if ([390, 558, 1440].includes(width)) await page.screenshot({ path: output + '/page-' + width + '.png', fullPage: true });
    report.pages.push({ width, visits: 10, cities: 8, directedLegs: 9, overlap: false, keyboard: true, citySelection: true });
    console.log(width, 'journey order passed');
  }
  assert.deepEqual(report.errors, []);
  await context.close();
  const offlineContext = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'allow' });
  try {
    const offlinePage = await offlineContext.newPage();
    await offlinePage.goto(base + '/', { waitUntil: 'domcontentloaded' });
    await offlinePage.getByText('已缓存', { exact: true }).first().waitFor({ state: 'attached', timeout: 240000 });
    await offlineContext.setOffline(true);
    const offlineResponse = await offlinePage.reload({ waitUntil: 'domcontentloaded' });
    assert(offlineResponse.fromServiceWorker(), 'Offline reload bypassed the service worker');
    // Chromium can reset navigator.onLine during a service-worker navigation.
    await offlineContext.setOffline(false);
    await offlineContext.setOffline(true);
    await checkMap(offlinePage);
    await offlinePage.getByRole('button', { name: '查看巴黎行程' }).click();
    assert.equal(await offlinePage.locator('.map-caption h3').textContent(), '巴黎');
    assert(await offlinePage.evaluate(() => !navigator.onLine && Boolean(navigator.serviceWorker.controller)));
    await offlinePage.getByText('离线可读', { exact: true }).first().waitFor({ state: 'attached' });
    report.offline = { passed: true, visits: 10, directedLegs: 9, serviceWorkerReload: true };
  } finally {
    await offlineContext.close();
  }
  report.passed = true;
} catch (error) {
  report.passed = false;
  report.failure = error.stack;
  console.error(error);
  process.exitCode = 1;
} finally {
  await browser.close();
  await preview?.close();
  await writeFile(output + '/report.json', JSON.stringify(report, null, 2) + '\n');
}
