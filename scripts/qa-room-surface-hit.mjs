import { chromium } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { spaceForPlace } from '../app/lib/architectural-plan.ts';

const plan = JSON.parse(await readFile('app/data/architectural-plans/picasso-barcelona.json', 'utf8'));
const output = 'work/map-review/room-surface-hit';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const results = [];
try {
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('http://localhost:55838/guides/picasso-barcelona/#guide-spatial');
    const map = page.locator('.architectural-map');
    await map.scrollIntoViewIfNeeded();
    await map.locator('.architectural-map__viewport').waitFor();
    await map.getByRole('button', { name: plan.floors.find((f) => f.id === 'L1').label, exact: true }).click();
    const place = plan.places.find((p) => p.id === 'L1-3-1');
    const expected = spaceForPlace(plan, place.id).placeId;
    // Hide marker buttons only while testing the actual floor surface hit.
    const markerStyle = await page.addStyleTag({ content: '.architectural-map [data-place-id]{visibility:hidden!important}' });
    const at = await map.locator('svg[aria-label$="完整俯视图"]').evaluate((svg, at) => {
      const p = new DOMPoint(...at).matrixTransform(svg.getScreenCTM());
      return { x: p.x, y: p.y };
    }, place.at);
    await page.mouse.click(at.x, at.y);
    if (await map.getByRole('combobox', { name: '定位地点', exact: true }).inputValue() !== expected) throw new Error('2D room surface selected the enclosing collection');
    await map.getByRole('combobox', { name: '定位地点', exact: true }).selectOption('L1-1-1');
    await map.getByRole('button', { name: '3D', exact: true }).click();
    await map.locator('canvas').waitFor();
    await map.locator('canvas').scrollIntoViewIfNeeded();
    const marker = map.locator(`.architectural-map__scene [data-place-id="${place.id}"]`);
    await page.waitForFunction((id) => Number(document.querySelector(`.architectural-map__scene [data-place-id="${id}"]`)?.dataset.anchorX) > 0, place.id);
    const scene = await map.locator('.architectural-map__scene').boundingBox();
    await page.mouse.click(scene.x + Number(await marker.getAttribute('data-anchor-x')), scene.y + Number(await marker.getAttribute('data-anchor-y')));
    if (await map.getByRole('combobox', { name: '定位地点', exact: true }).inputValue() !== expected) throw new Error('3D room surface selected the enclosing collection');
    await markerStyle.evaluate((node) => node.remove());
    await map.screenshot({ path: `${output}/${viewport.width}.png`, style: '.subnav,.guide-local-nav{visibility:hidden!important}' });
    if (errors.length) throw new Error(errors.join('; '));
    results.push({ viewport, selected: expected, twoD: true, threeD: true, errors });
    await context.close();
  }
  await writeFile(`${output}/report.json`, JSON.stringify(results, null, 2));
  console.log(results);
} finally { await browser.close(); }
