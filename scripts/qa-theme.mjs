import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';
import sharp from 'sharp';

const base = (process.env.THEME_QA_URL ?? 'http://localhost:55838').replace(
  /\/$/,
  '',
);
const output = process.env.THEME_QA_OUTPUT ?? 'work/theme-review';
const widths = process.env.THEME_QA_WIDTHS?.split(',').map(Number) ?? [
  390, 768, 1440,
];
const screenshots = !process.argv.includes('--no-screenshots');
const report = {
  base,
  startedAt: new Date().toISOString(),
  pages: [],
  states: [],
  errors: [],
};
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });

async function audit(page, state) {
  const result = await page.evaluate(() => {
    const issues = [];
    const surfaces = {};
    let checkedText = 0;
    const parse = (value) => {
      const values = value.match(/[\d.]+/g)?.map(Number);
      return values?.length >= 3
        ? [...values.slice(0, 3), values[3] ?? 1]
        : [0, 0, 0, 0];
    };
    const blend = (front, back) =>
      front.slice(0, 3).map((v, i) => v * front[3] + back[i] * (1 - front[3]));
    const luminance = (rgb) =>
      rgb.slice(0, 3).reduce((sum, c, i) => {
        const v = c / 255;
        return (
          sum +
          (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4) *
            [0.2126, 0.7152, 0.0722][i]
        );
      }, 0);
    const background = (el) => {
      const chain = [];
      for (let node = el; node; node = node.parentElement) chain.unshift(node);
      return chain.reduce(
        (bg, node) => blend(parse(getComputedStyle(node).backgroundColor), bg),
        [5, 9, 13],
      );
    };
    const add = (el, reason, extra) =>
      issues.push({
        selector: el.className || el.tagName,
        text: el.textContent?.trim().slice(0, 70),
        reason,
        ...extra,
      });
    for (const el of document.querySelectorAll('body, body *')) {
      if (
        !(el instanceof HTMLElement) ||
        !el.checkVisibility() ||
        el.closest('svg,canvas,option,script,style')
      )
        continue;
      const style = getComputedStyle(el);
      const rgb = parse(style.backgroundColor);
      const box = el.getBoundingClientRect();
      if (
        rgb[3] > 0.05 &&
        box.width &&
        box.height &&
        !el.matches('.architectural-map__swatch')
      ) {
        surfaces[style.backgroundColor] =
          (surfaces[style.backgroundColor] ?? 0) + 1;
        const [r, g, b] = rgb;
        const navy = (b >= g && g >= r) || Math.max(r, g, b) <= 15;
        const gold = r > b + 30 && g > b + 25 && r >= g;
        if (!navy && !gold)
          add(el, 'surface outside navy/gold palette', {
            color: style.backgroundColor,
          });
        if (
          luminance(rgb) > 0.28 &&
          box.width * box.height > 90000 &&
          !el.matches('button')
        )
          add(el, 'large light-colored surface', {
            color: style.backgroundColor,
          });
      }
      // Artwork, maps and photographic heroes are evaluated visually, not as
      // flat CSS surfaces. Disabled controls intentionally use reduced contrast.
      if (
        el.closest(
          '.hero,.guide-hero,.city-chapter__media,.architectural-map__scene,.architectural-map__viewport,.europe-map,[disabled]',
        )
      )
        continue;
      if (
        ![...el.childNodes].some(
          (n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim(),
        ) &&
        !el.matches('input,select')
      )
        continue;
      if (Number(style.opacity) < 0.9) continue;
      const bg = background(el);
      const fg = blend(parse(style.color), bg);
      const l1 = luminance(fg),
        l2 = luminance(bg);
      const contrast = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      const large =
        parseFloat(style.fontSize) >= 24 ||
        (parseFloat(style.fontSize) >= 18.66 &&
          parseInt(style.fontWeight) >= 700);
      checkedText++;
      if (contrast < (large ? 3 : 4.5) - 0.05)
        add(el, 'text contrast', {
          foreground: style.color,
          background: bg,
          contrast: +contrast.toFixed(2),
          required: large ? 3 : 4.5,
        });
    }
    if (getComputedStyle(document.documentElement).colorScheme !== 'dark')
      issues.push({ reason: 'native controls are not dark themed' });
    return { issues, surfaces, checkedText };
  });
  const record = {
    route: new URL(page.url()).pathname,
    width: page.viewportSize().width,
    state,
    ...result,
    passed: result.issues.length === 0,
  };
  if (!record.passed)
    console.log(
      'FAIL',
      record.route,
      record.width,
      state,
      JSON.stringify(record.issues.slice(0, 12)),
    );
  return record;
}

async function screenshotSections(page, route, width) {
  if (!screenshots) return;
  const guide = route.startsWith('/guides/') && route !== '/guides/';
  const selectors = guide
    ? [
        '#guide-overview',
        '#guide-spatial',
        '#guide-highlights',
        '.highlight-browser__grid',
        '#guide-sequence',
        '#guide-practical',
      ]
    : route === '/'
      ? ['.hero', '.map-section', '.notices', '.journey-strip', '.site-footer']
      : route === '/itinerary/'
        ? ['.page-intro', '.day-route-map', '.timeline-item', '.alternatives']
        : route === '/cities/'
          ? ['.page-intro', '.city-chapter__copy']
          : route === '/bookings/'
            ? ['.page-intro', '.booking-group']
            : ['.page-intro', '.guide-index__row'];
  let top = 0;
  const composite = [];
  for (const selector of selectors) {
    const el = page.locator(selector).first();
    if (!(await el.count())) continue;
    await el.evaluate((node) =>
      window.scrollTo({
        top: node.getBoundingClientRect().top + scrollY - 150,
        behavior: 'instant',
      }),
    );
    await page.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    );
    await page.waitForFunction(() =>
      [...document.images]
        .filter((img) => {
          const box = img.getBoundingClientRect();
          return box.bottom > 0 && box.top < innerHeight && box.width > 0;
        })
        .every((img) => img.complete && img.naturalWidth > 0),
    );
    const input = await sharp(await page.screenshot({ animations: 'disabled' }))
      .resize({ width: 360 })
      .png()
      .toBuffer();
    const { height } = await sharp(input).metadata();
    composite.push({ input, left: 0, top });
    top += height + 8;
  }
  if (composite.length)
    await sharp({
      create: { width: 360, height: top, channels: 3, background: '#283b4c' },
    })
      .composite(composite)
      .png()
      .toFile(
        join(output, `${route.replaceAll('/', '_') || 'home'}-${width}.png`),
      );
}

try {
  const page = await browser.newPage({
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  });
  page.on('pageerror', (error) =>
    report.errors.push({ route: page.url(), error: error.message }),
  );
  await page.goto(`${base}/guides/`);
  await page.locator('.guide-index__row').first().waitFor();
  const guides = await page
    .locator('.guide-index__row')
    .evaluateAll((rows) => rows.map((row) => row.getAttribute('href')));
  const basePath = new URL(base).pathname.replace(/\/$/, '');
  const guideRoutes = guides.map((href) => basePath && href.startsWith(`${basePath}/`) ? href.slice(basePath.length) : href);
  assert.equal(guides.length, 74);
  const routes = [
    '/',
    '/itinerary/',
    '/cities/',
    '/bookings/',
    '/guides/',
    '/vatican-guide/',
    ...guideRoutes,
  ];
  for (const width of widths) {
    await page.setViewportSize({ width, height: width < 700 ? 844 : 1000 });
    for (const route of routes) {
      await page.goto(`${base}${route}`, { waitUntil: 'domcontentloaded' });
      await page.locator('h1').waitFor();
      await page.evaluate(() => document.fonts.ready);
      report.pages.push(await audit(page, 'page'));
      await screenshotSections(page, route, width);
    }
    console.log(`${width}px: ${routes.length} theme pages checked`);
    await page.goto(`${base}${process.env.THEME_QA_NOT_FOUND ?? '/__theme-missing__/'}`, { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: '没有找到这个页面' }).waitFor();
    report.states.push(await audit(page, 'not-found'));
    if (screenshots)
      await page.screenshot({ path: join(output, `not-found-${width}.png`) });
    for (const slug of [
      'cologne-cathedral',
      'uffizi',
      'casa-batllo',
      'st-peters-basilica',
    ]) {
      await page.goto(`${base}/guides/${slug}/`, { waitUntil: 'networkidle' });
      const map = page.locator('.architectural-map');
      if (await map.count()) {
        await map.scrollIntoViewIfNeeded();
        await map.getByRole('button', { name: '2D 俯视', exact: true }).click();
        await map.locator('.architectural-map__viewport').waitFor();
        report.states.push(await audit(page, 'map-2d'));
        if (screenshots)
          await page.screenshot({
            path: join(output, `${slug}-map-${width}.png`),
          });
      }
      const first = page
        .locator('.highlight-browser__grid article > button')
        .first();
      await first.click();
      await page.locator('.highlight-detail[open]').waitFor();
      report.states.push(await audit(page, 'artwork-dialog'));
      if (screenshots)
        await page.screenshot({
          path: join(output, `${slug}-detail-${width}.png`),
        });
      await page.keyboard.press('Escape');
      const input = page.getByRole('searchbox', {
        name: '搜索作品、作者或位置',
      });
      await input.fill('No matching artwork 000000');
      await page.locator('.highlight-browser__empty').waitFor();
      report.states.push(await audit(page, 'search-empty-focused'));
      await input.fill('');
      await page
        .getByRole('button', { name: '开始现场导览', exact: true })
        .click();
      await page.locator('.onsite-guide').waitFor();
      report.states.push(await audit(page, 'onsite-dialog'));
      if (screenshots)
        await page.screenshot({
          path: join(output, `${slug}-onsite-${width}.png`),
        });
      await page
        .getByRole('button', { name: '关闭现场导览', exact: true })
        .click();
    }
    await page.goto(`${base}/itinerary/`, { waitUntil: 'networkidle' });
    for (const button of await page.locator('.filter-bar button').all()) {
      await button.click();
      await button.hover();
      report.states.push(
        await audit(page, `itinerary-filter-${await button.textContent()}`),
      );
    }
    await page.goto(`${base}/guides/`, { waitUntil: 'networkidle' });
    const filters = page.locator('.guide-filters button');
    for (const button of await filters.all()) {
      await button.click();
      await button.hover();
      report.states.push(
        await audit(page, `filter-${await button.textContent()}`),
      );
    }
  }
  report.passed =
    !report.errors.length &&
    [...report.pages, ...report.states].every((r) => r.passed);
} catch (error) {
  report.passed = false;
  report.failure = error.stack;
} finally {
  report.finishedAt = new Date().toISOString();
  await writeFile(
    join(output, 'report.json'),
    JSON.stringify(report, null, 2) + '\n',
  );
  await browser.close();
}
console.log(
  JSON.stringify(
    {
      passed: report.passed,
      pages: report.pages.length,
      states: report.states.length,
      failed: [...report.pages, ...report.states].filter((r) => !r.passed)
        .length,
      errors: report.errors,
      failure: report.failure,
    },
    null,
    2,
  ),
);
if (!report.passed) process.exitCode = 1;
