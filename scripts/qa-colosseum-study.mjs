import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import sharp from 'sharp';

const output = 'work/experience/colosseum-source-study';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const results = [];
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, serviceWorkers: 'block' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://localhost:55910/', { waitUntil: 'networkidle' });
    await page.evaluate(async () => {
      const { mountStudy } = await import('/sources/exteriors/studies/preview-colosseum.ts');
      window.disposeStudy = mountStudy();
    });
    const canvas = page.getByLabel('Colosseum unreviewed exterior study');
    const before = await canvas.getAttribute('data-camera');
    await canvas.screenshot({ path: `${output}/arcades-${width}.png` });
    await page.mouse.move(width * 0.5, 440);
    await page.mouse.down();
    await page.mouse.move(width * 0.7, 460, { steps: 8 });
    await page.mouse.up();
    assert.notEqual(await canvas.getAttribute('data-camera'), before);
    const bytes = await canvas.screenshot({ path: `${output}/arcades-${width}-rotated.png` });
    const { data } = await sharp(bytes).resize(120, 90).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    let visible = 0;
    for (let i = 0; i < data.length; i += 3) if (data[i] > 80 && data[i + 1] > 75) visible++;
    assert.ok(visible > 100, 'Model is blank or too small');
    assert.deepEqual(errors, []);
    await page.evaluate(() => window.disposeStudy());
    results.push({ width, visiblePixels: visible, mouseOrbit: true, errors, status: 'geometry-study-not-release-acceptance' });
    await page.close();
  }
} finally { await browser.close(); }
await writeFile(`${output}/browser.json`, JSON.stringify(results, null, 2));
console.log(JSON.stringify(results));
