import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import sharp from 'sharp';

const output = 'work/experience/colosseum-source-study';
const venueClay = process.argv.includes('--venue-clay');
const prefix = venueClay ? 'venue-mesh' : 'mesh';
const browser = await chromium.launch({ channel: 'chrome' });
const results = [];
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, serviceWorkers: 'block' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://localhost:55910/', { waitUntil: 'networkidle' });
    await page.evaluate(async venueClay => {
      const { mountMeshStudy } = await import('/sources/exteriors/studies/preview-colosseum-mesh.ts');
      window.meshStudy = await mountMeshStudy(venueClay);
    }, venueClay);
    const canvas = page.getByLabel('Colosseum candidate mesh study');
    /** @type {[string, [number, number, number]][]} */
    const views = [
      ['southeast', [10, 9, 10]], ['northwest', [-10, 9, -10]],
      ['northeast', [10, 4, -10]], ['southwest', [-10, 4, 10]],
      ['top', [0, 20, 0.001]],
    ];
    for (const [name, direction] of views) {
      for (const clay of [false, true]) {
        await page.evaluate(({ direction, clay }) => window.meshStudy.view(direction, clay), { direction, clay });
        const bytes = await canvas.screenshot({ path: `${output}/${prefix}-${name}-${clay ? 'clay' : 'material'}-${width}.png` });
        const { data } = await sharp(bytes).resize(120, 90).removeAlpha().raw().toBuffer({ resolveWithObject: true });
        let visible = 0;
        for (let i = 0; i < data.length; i += 3) if (data[i] > 75 && data[i + 1] > 65) visible++;
        assert.ok(visible > 300, `Blank/small mesh: ${name}/${width}`);
        results.push({ width, view: name, clay, visiblePixels: visible, triangles: Number(await canvas.getAttribute('data-triangles')) });
      }
    }
    const before = await canvas.getAttribute('data-camera');
    await page.mouse.move(width * 0.45, 460);
    await page.mouse.down(); await page.mouse.move(width * 0.65, 490, { steps: 8 }); await page.mouse.up();
    assert.notEqual(await canvas.getAttribute('data-camera'), before);
    if (venueClay && width === 1440) {
      await page.evaluate(() => window.meshStudy.view([0, 0.05, -1], true, { min: [-2, 0.1, -3.8], max: [2, 1.8, -2.5] }));
      await canvas.screenshot({ path: `${output}/venue-mesh-north-arcade-detail.png` });
    }
    assert.deepEqual(errors, []);
    await page.evaluate(() => window.meshStudy.dispose());
    await page.close();
  }
} finally { await browser.close(); }
await writeFile(`${output}/${prefix}-browser.json`, JSON.stringify({ status: 'candidate-review-not-release-acceptance', results }, null, 2));
console.log(JSON.stringify(results));
