import { chromium } from 'playwright';
import sharp from 'sharp';

const baseUrl = process.argv[2] ?? 'http://localhost:3000';
const browser = await chromium.launch({
  headless: true,
  executablePath:
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-angle=swiftshader'],
});

async function inspectGuide(context, route) {
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`${baseUrl}${route}?qaGeometry=1`, {
    waitUntil: 'domcontentloaded',
    timeout: 30_000,
  });
  const canvas = page.locator('.guide-spatial-3d__canvas');
  await canvas.scrollIntoViewIfNeeded();
  await page.waitForFunction(
    () =>
      document.querySelector('.guide-spatial-3d__canvas')?.dataset.rendered ===
      'true',
    undefined,
    { timeout: 20_000 },
  );
  const pauseButton = page.getByRole('button', { name: '暂停自动旋转' });
  if (await pauseButton.isVisible()) await pauseButton.click();
  await page.waitForTimeout(120);

  const screenshot = await canvas.screenshot();
  const { channels } = await sharp(screenshot).stats();
  const spread = channels
    .slice(0, 3)
    .reduce((total, channel) => total + channel.stdev, 0);
  if (spread < 18) throw new Error(`${route}: blank canvas (${spread})`);
  const { data: visualVector } = await sharp(screenshot)
    .resize(48, 32, { fit: 'fill' })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const buttons = page.locator('.guide-spatial-3d__nodes button');
  const buttonCount = await buttons.count();
  if (buttonCount === 0) throw new Error(`${route}: no route nodes`);
  await buttons.nth(buttonCount - 1).click();
  if (
    (await buttons.nth(buttonCount - 1).getAttribute('data-active')) !== 'true'
  ) {
    throw new Error(`${route}: route focus did not activate`);
  }
  if (errors.length > 0) throw new Error(`${route}: ${errors.join('; ')}`);
  await page.close();
  return { route, spread: Number(spread.toFixed(2)), visualVector };
}

try {
  const indexPage = await browser.newPage();
  await indexPage.goto(`${baseUrl}/guides/`, { waitUntil: 'networkidle' });
  const basePath = new URL(baseUrl).pathname.replace(/\/$/, '');
  const routes = await indexPage.locator('a[href*="/guides/"]').evaluateAll(
    (anchors, deployedBasePath) =>
      [
        ...new Set(
          anchors.map((anchor) => {
            const path = new URL(anchor.href).pathname;
            return deployedBasePath && path.startsWith(deployedBasePath)
              ? path.slice(deployedBasePath.length)
              : path;
          }),
        ),
      ]
        .filter((path) => /^\/guides\/[^/]+\/$/.test(path))
        .sort((left, right) => left.localeCompare(right)),
    basePath,
  );
  await indexPage.close();
  if (routes.length !== 74) {
    throw new Error(`Expected 74 native guide routes, found ${routes.length}`);
  }

  const context = await browser.newContext({
    viewport: { width: 1200, height: 820 },
  });
  const results = [];
  for (let index = 0; index < routes.length; index += 4) {
    const batch = routes.slice(index, index + 4);
    results.push(
      ...(await Promise.all(
        batch.map((route) => inspectGuide(context, route)),
      )),
    );
  }
  const closePairs = [];
  for (let left = 0; left < results.length; left += 1) {
    for (let right = left + 1; right < results.length; right += 1) {
      let total = 0;
      for (
        let pixel = 0;
        pixel < results[left].visualVector.length;
        pixel += 1
      ) {
        total += Math.abs(
          results[left].visualVector[pixel] -
            results[right].visualVector[pixel],
        );
      }
      const difference = total / results[left].visualVector.length;
      if (difference < 2.25) {
        closePairs.push({
          difference: Number(difference.toFixed(2)),
          left: results[left].route,
          right: results[right].route,
        });
      }
    }
  }
  if (closePairs.length > 0) {
    throw new Error(
      `Geometry-only scenes are too similar: ${JSON.stringify(closePairs)}`,
    );
  }
  await context.close();
  console.log(
    JSON.stringify({
      checked: results.length,
      closePairs: closePairs.length,
      minimumSpread: Math.min(...results.map((result) => result.spread)),
    }),
  );
} finally {
  await browser.close();
}
