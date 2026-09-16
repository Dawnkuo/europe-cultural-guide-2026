import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { githubPreview } from './github-preview-server.mjs';
import { createServer } from 'vite';

const dataServer = await createServer({
  configFile: false,
  cacheDir: 'node_modules/.vite-photo-qa',
  server: { middlewareMode: true },
});
let spots;
let schedule;
let orderedIds;
try {
  spots = (await dataServer.ssrLoadModule('/app/data/photo-spots.ts'))
    .photoSpots;
  const { guideCatalog } = await dataServer.ssrLoadModule('/app/data/guides.ts');
  const { tripDays } = await dataServer.ssrLoadModule('/app/data/trip.ts');
  const { buildPhotoSchedule, sortPhotoSpots } = await dataServer.ssrLoadModule('/app/lib/photo-schedule.ts');
  schedule = buildPhotoSchedule(spots, guideCatalog, tripDays);
  orderedIds = sortPhotoSpots(spots, schedule).map(spot => spot.id);
} finally {
  await dataServer.close();
}
const indoorCount = spots.filter(
  (spot) => spot.kind === 'indoor' || spot.id === 'milan-galleria',
).length;
const countFor = (key, value) =>
  spots.filter((spot) =>
    key === 'city' ? spot.city === value : spot.guideSlugs.includes(value),
  ).length;
async function expectCount(page, count) {
  await page.locator('.photo-directory[data-ready="true"]').waitFor();
  await page.waitForFunction(
    (count) => document.querySelectorAll('.photo-spot').length === count,
    count,
  );
  const cards = await page.locator('.photo-spot').evaluateAll(cards => cards.map(card => ({ id: card.dataset.spot, dates: [...card.querySelectorAll('.photo-spot__visits time')].map(time => time.dateTime) })));
  const ids = cards.map(card => card.id);
  check(JSON.stringify(ids) === JSON.stringify(orderedIds.filter(id => ids.includes(id))), 'Itinerary order changed under filtering/reload');
  for (const card of cards) check(JSON.stringify(card.dates) === JSON.stringify(schedule[card.id].map(visit => visit.date)), `Missing or incorrect itinerary dates: ${card.id}`);
}

const output = 'work/photo-spots-review';
const manifest = JSON.parse(
  await readFile('dist/client/guide-precache.json', 'utf8'),
);
const media = JSON.parse(
  await readFile('app/data/photo-spot-media.generated.json', 'utf8'),
);
const preview = await githubPreview();
const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const report = { revision: manifest.revision, viewports: [], offline: null, itineraryOrder: true };
const check = (condition, message) => {
  if (!condition) throw new Error(message);
};
await mkdir(output, { recursive: true });
async function imageCheck(page) {
  const failures = await page
    .locator('.photo-spot__image img')
    .evaluateAll(async (images) => {
      const errors = [];
      for (const image of images) {
        image.loading = 'eager';
        try {
          await image.decode();
        } catch {
          errors.push(image.src);
        }
        if (!image.naturalWidth) errors.push(image.src);
        if (getComputedStyle(image).objectFit !== 'contain')
          errors.push(`Cropped: ${image.src}`);
      }
      return errors;
    });
  check(!failures.length, failures.join('; '));
}
async function viewerCheck(page) {
  const opener = page.getByRole('button', { name: /查看完整成片/ }).first();
  await opener.click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: '放大图片', exact: true }).waitFor();
  await dialog.locator('img').evaluate((image) => image.decode());
  await dialog.getByRole('button', { name: '放大图片', exact: true }).click();
  check(
    (await dialog.getByLabel('图片缩放比例').textContent()) !== '100%',
    'Photo zoom did not change',
  );
  await page.keyboard.press('Escape');
  check(
    (await page.getByRole('dialog').count()) === 0,
    'Escape did not close photo viewer',
  );
  check(
    await opener.evaluate((node) => document.activeElement === node),
    'Photo opener lost keyboard focus',
  );
}
try {
  const noScripts = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await noScripts.newPage();
    await page.goto(`${preview.url}/photo-spots/`);
    check(
      await page.getByLabel('城市', { exact: true }).isDisabled(),
      'Unhydrated select can silently lose input',
    );
    check(
      await page
        .getByRole('button', { name: /查看完整成片/ })
        .first()
        .isDisabled(),
      'Unhydrated viewer button is enabled',
    );
    check(
      (await page.getByRole('article').count()) === spots.length,
      'Static photos missing without scripts',
    );
    report.preHydrationGuard = true;
  } finally {
    await noScripts.close();
  }
  check(
    manifest.routes.includes('/photo-spots/'),
    'Photo page missing from offline routes',
  );
  for (const item of Object.values(media))
    check(
      manifest.assets.includes(item.src) &&
        manifest.integrity[item.src] === item.sha256,
      `Photo missing/inconsistent: ${item.src}`,
    );
  for (const width of [320, 390, 768, 1094, 1440]) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      serviceWorkers: 'block',
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    try {
      await page.goto(`${preview.url}/photo-spots/`);
      await page.getByRole('heading', { level: 1, name: '机位' }).waitFor();
      await expectCount(page, spots.length);
      await imageCheck(page);
      await page.screenshot({ path: `${output}/directory-${width}.png` });
      check(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        'Horizontal overflow',
      );
      const navFits = await page
        .getByRole('navigation', { name: '主导航' })
        .evaluate((nav) =>
          [...nav.querySelectorAll('a')].every((a) => {
            const r = a.getBoundingClientRect();
            return (
              r.left >= 0 &&
              r.right <= innerWidth &&
              r.height >= 44 &&
              r.width >= 28
            );
          }),
        );
      check(navFits, 'Main navigation clipped');
      const cities = await page
        .getByLabel('城市', { exact: true })
        .locator('option')
        .evaluateAll((options) =>
          options.map((option) => option.value).filter(Boolean),
        );
      check(cities.length === 8, 'City inventory mismatch');
      if (width === 390) {
        const guides = await page.getByLabel('景点', { exact: true }).locator('option').evaluateAll(options => options.map(option => option.value).filter(Boolean));
        check(guides.length === 74, 'Guide catalog incomplete');
        for (const slug of guides) {
          await page.getByLabel('城市', { exact: true }).selectOption('');
          await page.getByLabel('景点', { exact: true }).selectOption(slug);
          await expectCount(page, countFor('guide', slug));
          check(await page.locator('.photo-spot__guides').getByRole('link').count() > 0, `Guide link missing ${slug}`);
        }
        report.allGuideFilters = guides.length;
        await page.getByRole('button', { name: '清除筛选' }).click();
      }
      for (const city of cities) {
        await page.getByLabel('城市', { exact: true }).selectOption(city);
        await expectCount(page, countFor('city', city));
        check(
          (
            await page
              .locator('.photo-spot__meta > span:first-child')
              .allTextContents()
          ).every((text) => text === city),
          `Wrong city results: ${city}`,
        );
      }
      await page.getByLabel('城市', { exact: true }).selectOption('科隆');
      await page
        .getByLabel('景点', { exact: true })
        .selectOption('koln-triangle');
      await page.waitForFunction(
        () => document.querySelectorAll('.photo-spot').length === 1,
      );
      await imageCheck(page);
      await page.reload();
      await page.waitForFunction(
        () => document.querySelectorAll('.photo-spot').length === 1,
      );
      check(
        (await page.getByLabel('景点', { exact: true }).inputValue()) ===
          'koln-triangle',
        'Guide filter not restored',
      );
      await page.screenshot({ path: `${output}/filtered-${width}.png` });
      await viewerCheck(page);
      await page.getByLabel('搜索', { exact: true }).fill('不存在');
      await page.getByRole('heading', { name: '没有匹配的机位' }).waitFor();
      await page.getByRole('button', { name: '清除筛选' }).click();
      await expectCount(page, spots.length);
      await page.goBack();
      await page.getByRole('heading', { name: '没有匹配的机位' }).waitFor();
      await page.goto(`${preview.url}/photo-spots/#guide=uffizi`);
      await expectCount(page, countFor('guide', 'uffizi'));
      check(
        (
          await page
            .locator('.photo-spot')
            .evaluateAll((cards) => cards.map((card) => card.dataset.kind))
        ).every((kind) => kind === 'indoor'),
        'Uffizi photos not indoor',
      );
      await page.getByRole('button', { name: '清除筛选' }).click();
      await page.getByRole('radio', { name: /^室内/ }).check();
      await expectCount(page, indoorCount);
      await page.reload();
      await expectCount(page, indoorCount);
      await imageCheck(page);
      await page.screenshot({ path: `${output}/indoor-${width}.png` });
      check(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        'Indoor horizontal overflow',
      );
      await page
        .getByLabel('景点', { exact: true })
        .selectOption('vatican-museums');
      await expectCount(page, 3);
      await page.getByRole('radio', { name: /^屋顶与观景台/ }).check();
      await page.getByRole('heading', { name: '没有匹配的机位' }).waitFor();
      await page.goto(`${preview.url}/cities/`);
      await page
        .getByRole('link', { name: '查看巴黎机位', exact: true })
        .click();
      await expectCount(page, countFor('city', '巴黎'));
      check(
        (await page.getByLabel('城市', { exact: true }).inputValue()) ===
          '巴黎',
        'City link filter missing',
      );
      await page.goto(`${preview.url}/guides/milan-duomo/`);
      await page.getByRole('link', { name: '拍摄机位与实拍参考' }).click();
      await expectCount(page, countFor('guide', 'milan-duomo'));
      await page
        .locator('.photo-spot__guides')
        .getByRole('link')
        .first()
        .click();
      check(
        new URL(page.url()).pathname.endsWith('/guides/milan-duomo/'),
        'Photo to guide link failed',
      );
      check(!errors.length, errors.join('; '));
      report.viewports.push({
        width,
        cities: cities.length,
        images: spots.length,
        indoor: indoorCount,
        passed: true,
      });
      console.log(width, 'photo directory passed');
    } finally {
      await context.close();
    }
  }
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: 'reduce',
    serviceWorkers: 'allow',
  });
  try {
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`${preview.url}/`);
    await page.evaluate(async () => {
      await navigator.serviceWorker.register(`${location.pathname}sw.js`);
      await navigator.serviceWorker.ready;
    });
    await page.waitForFunction(
      async (revision) => {
        const key = (await caches.keys()).find((key) => key.endsWith(revision));
        return (
          key &&
          Boolean(
            await (
              await caches.open(key)
            ).match(`${location.pathname}offline-ready`),
          )
        );
      },
      manifest.revision,
      { timeout: 240000 },
    );
    await context.setOffline(true);
    await page.goto(`${preview.url}/photo-spots/#guide=milan-duomo`);
    await page.reload();
    await expectCount(page, countFor('guide', 'milan-duomo'));
    await viewerCheck(page);
    await page.getByRole('button', { name: '清除筛选' }).click();
    await imageCheck(page);
    await expectCount(page, spots.length);
    await page.getByRole('radio', { name: /^室内/ }).check();
    await expectCount(page, indoorCount);
    await page.reload();
    await expectCount(page, indoorCount);
    await imageCheck(page);
    await page.screenshot({ path: `${output}/offline-390.png` });
    check(!errors.length, errors.join('; '));
    report.offline = {
      passed: true,
      firstVisitOffline: true,
      hashDeepLinkReload: true,
      allPhotos: spots.length,
      indoor: indoorCount,
      firstZoomModuleLoadOffline: true,
    };
    console.log('Offline photo page, all images and first-open zoom passed');
  } finally {
    await context.close();
  }
} catch (error) {
  report.failure = error.stack;
  process.exitCode = 1;
  console.error(error);
} finally {
  await writeFile(
    `${output}/report.json`,
    `${JSON.stringify(report, null, 2)}\n`,
  );
  await browser.close();
  await preview.close();
}
