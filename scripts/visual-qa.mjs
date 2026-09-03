import { mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright';
import sharp from 'sharp';

const baseUrl = process.argv[2] ?? 'http://localhost:55839';
const outputDirectory = resolve('/tmp/europe-cultural-guide-visual-qa');
await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  executablePath:
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-angle=swiftshader'],
});

async function assertCanvasPixels(canvas, name) {
  const imagePath = join(outputDirectory, `${name}-canvas.png`);
  await canvas.screenshot({ path: imagePath });
  const { channels } = await sharp(imagePath).stats();
  const spread = channels
    .slice(0, 3)
    .reduce((total, channel) => total + channel.stdev, 0);
  if (spread < 18) {
    throw new Error(`${name}: WebGL canvas appears blank (spread ${spread})`);
  }
  return { imagePath, spread: Number(spread.toFixed(2)) };
}

async function inspectGuide({ name, route, viewport }) {
  const page = await browser.newPage({ viewport });
  await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle' });
  const canvas = page.locator('.guide-spatial-3d__canvas');
  await canvas.scrollIntoViewIfNeeded();
  await page.waitForFunction(
    () =>
      document.querySelector('.guide-spatial-3d__canvas')?.dataset.rendered ===
      'true',
  );
  const pauseButton = page.getByRole('button', { name: '暂停自动旋转' });
  if (await pauseButton.isVisible()) await pauseButton.click();
  await page.getByRole('button', { name: '重置三维视角' }).click();
  await page.waitForTimeout(450);

  const canvasBox = await canvas.boundingBox();
  if (!canvasBox || canvasBox.width < 280 || canvasBox.height < 300) {
    throw new Error(`${name}: canvas is too small`);
  }

  const imageCount = await page.locator('.guide-highlight__media img').count();
  const loadedImages = await page
    .locator('.guide-highlight__media img')
    .evaluateAll(
      (images) =>
        images.filter(
          (image) =>
            image instanceof HTMLImageElement &&
            image.complete &&
            image.naturalWidth > 0,
        ).length,
    );
  if (imageCount < 3 || loadedImages !== imageCount) {
    throw new Error(`${name}: highlight images did not load`);
  }
  if ((await page.locator('.guide-highlight__media a').count()) !== 0) {
    throw new Error(`${name}: image source links are still visible`);
  }
  if ((await page.locator('a[href*="/sources/"]').count()) !== 0) {
    throw new Error(`${name}: source navigation is still visible`);
  }
  const visibleText = await page.locator('body').innerText();
  if (/来源与核验|图片许可|版权声明|官方来源/.test(visibleText)) {
    throw new Error(`${name}: source or copyright copy is still visible`);
  }

  const firstNode = page.locator('.guide-spatial-3d__nodes button').first();
  const canvasStats = await assertCanvasPixels(canvas, name);
  await firstNode.click();
  if ((await firstNode.getAttribute('data-active')) !== 'true') {
    throw new Error(`${name}: 3D node focus did not activate`);
  }

  const dimensions = await page.evaluate(() => ({
    bodyWidth: document.body.scrollWidth,
    viewportWidth: window.innerWidth,
  }));
  if (dimensions.bodyWidth > dimensions.viewportWidth + 1) {
    throw new Error(`${name}: horizontal overflow detected`);
  }

  const pagePath = join(outputDirectory, `${name}-page.png`);
  await page.screenshot({ fullPage: true, path: pagePath });
  await page.close();
  return {
    name,
    canvas: {
      width: Math.round(canvasBox.width),
      height: Math.round(canvasBox.height),
      spread: canvasStats.spread,
    },
    canvasPath: canvasStats.imagePath,
    images: loadedImages,
    pagePath,
  };
}

try {
  const desktopGuides = [
    ['pantheon', '/guides/pantheon/'],
    ['colosseum', '/guides/colosseum/'],
    ['grand-canal', '/guides/grand-canal/'],
    ['florence-duomo', '/guides/florence-duomo/'],
    ['leaning-tower', '/guides/leaning-tower/'],
    ['sagrada-familia', '/guides/sagrada-familia/'],
    ['park-guell', '/guides/park-guell/'],
    ['casa-batllo', '/guides/casa-batllo/'],
    ['hohenzollern', '/guides/hohenzollern/'],
    ['cologne-cathedral', '/guides/cologne-cathedral/'],
    ['notre-dame-towers', '/guides/notre-dame-towers/'],
    ['uffizi', '/guides/uffizi/'],
  ];
  const results = [];
  for (const [name, route] of desktopGuides) {
    results.push(
      await inspectGuide({
        name: `${name}-desktop`,
        route,
        viewport: { width: 1440, height: 1000 },
      }),
    );
  }
  results.push(
    await inspectGuide({
      name: 'pantheon-mobile',
      route: '/guides/pantheon/',
      viewport: { width: 390, height: 844 },
    }),
  );

  const vectors = [];
  for (const result of results.filter((item) =>
    item.name.endsWith('-desktop'),
  )) {
    const { data } = await sharp(result.canvasPath)
      .resize(48, 32, { fit: 'fill' })
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true });
    vectors.push({ name: result.name, data });
  }
  const closePairs = [];
  for (let left = 0; left < vectors.length; left += 1) {
    for (let right = left + 1; right < vectors.length; right += 1) {
      let total = 0;
      for (let index = 0; index < vectors[left].data.length; index += 1) {
        total += Math.abs(
          vectors[left].data[index] - vectors[right].data[index],
        );
      }
      const difference = total / vectors[left].data.length;
      if (difference < 5) {
        closePairs.push({
          difference: Number(difference.toFixed(2)),
          left: vectors[left].name,
          right: vectors[right].name,
        });
      }
    }
  }
  if (closePairs.length > 0) {
    throw new Error(
      `3D scenes are visually too similar: ${JSON.stringify(closePairs)}`,
    );
  }
  console.log(JSON.stringify({ closePairs, results }, null, 2));
} finally {
  await browser.close();
}
