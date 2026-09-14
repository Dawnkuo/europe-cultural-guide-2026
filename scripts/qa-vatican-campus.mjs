import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import sharp from 'sharp';

const origin = process.env.QA_ORIGIN ?? 'http://localhost:55910';
const output = process.env.QA_OUTPUT ?? 'work/experience/vatican-campus-qa';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const report = [];
async function assertPinInside(campus, context) {
  const clipped = await campus.evaluate(element => {
    const frame = element.querySelector('.vatican-campus__stage').getBoundingClientRect();
    const pin = element.querySelector('.vatican-campus__pin').getBoundingClientRect();
    return pin.left < frame.left || pin.right > frame.right || pin.top < frame.top || pin.bottom > frame.bottom;
  });
  if (clipped) throw new Error(`Campus marker clipped: ${context}`);
}
try {
  for (const width of [320, 390, 820, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 }, reducedMotion: 'reduce', hasTouch: width <= 390 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${origin}/guides/vatican-museums/`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: '馆区总览', exact: true }).click();
    const tabs = await page.getByRole('group', { name: '内外视图', exact: true }).getByRole('button').evaluateAll(buttons => buttons.map(button => ({
      y: button.getBoundingClientRect().top,
      active: button.getAttribute('aria-pressed') === 'true',
      background: getComputedStyle(button).backgroundColor,
    })));
    if (tabs.length !== 3 || Math.max(...tabs.map(tab => tab.y)) - Math.min(...tabs.map(tab => tab.y)) > 1) throw new Error('Map view tabs must share one row');
    if (tabs.filter(tab => tab.active).length !== 1 || tabs.find(tab => tab.active).background === tabs.find(tab => !tab.active).background) throw new Error('Map view tab selection is not visible');
    const campus = page.getByRole('region', { name: '梵蒂冈馆区总览', exact: true });
    await campus.locator('img').evaluate(image => image.decode());
    await assertPinInside(campus, `entrance at ${width}`);
    await page.evaluate(() => window.scrollTo(0, document.querySelector('.vatican-campus').getBoundingClientRect().top + scrollY - 180));
    await page.screenshot({ path: `${output}/viewport-${width}.png` });
    await campus.screenshot({ path: `${output}/overview-${width}.png` });
    const mapPng = await campus.locator('.vatican-campus__canvas').screenshot();
    const pixels = await sharp(mapPng).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    let gold = 0;
    for (let i = 0; i < pixels.data.length; i += pixels.info.channels) {
      const [r, g, b] = pixels.data.subarray(i, i + 3);
      if (r > 150 && g > 130 && b < g && r > g) gold++;
    }
    if (gold < 5000) throw new Error(`Blank campus at ${width}`);
    const list = campus.getByLabel('馆区列表');
    const regionCount = await list.getByRole('button').count();
    if (regionCount !== 14) throw new Error(`Missing campus regions: ${regionCount}`);
    for (const button of await list.getByRole('button').all()) {
      const name = await button.innerText();
      await button.click();
      if (await button.getAttribute('aria-pressed') !== 'true') throw new Error(`Selection failed: ${name}`);
      if (!(await campus.locator('.vatican-campus__detail h3').innerText()).includes(name)) throw new Error(`Wrong detail: ${name}`);
      await assertPinInside(campus, `${name} at ${width}`);
    }
    await list.getByRole('button', { name: '西侧长廊', exact: true }).click();
    await campus.getByRole('button', { name: '显示完整馆区' }).click();
    if ((await campus.getByLabel('馆区缩放比例').innerText()) !== '100%') throw new Error('Reset failed');
    const stage = campus.getByRole('application');
    await stage.focus();
    await page.keyboard.press('+');
    await page.waitForFunction(() => document.querySelector('[aria-label="馆区缩放比例"]').textContent !== '100%');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Home');
    let emulatedTouch = false;
    if (width <= 390) {
      await stage.scrollIntoViewIfNeeded();
      const bounds = await stage.boundingBox();
      const client = await page.context().newCDPSession(page);
      const points = distance => [-1, 1].map((direction, id) => ({
        x: bounds.x + bounds.width / 2 + direction * distance,
        y: bounds.y + bounds.height / 2,
        id,
      }));
      try {
        await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: points(25) });
        for (let distance = 30; distance <= 60; distance += 5) await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: points(distance) });
        await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await page.waitForFunction(() => parseInt(document.querySelector('[aria-label="馆区缩放比例"]').textContent) > 100);
        emulatedTouch = true;
        await list.getByRole('button', { name: '西侧长廊', exact: true }).click();
      } finally { await client.detach(); }
    }
    await campus.getByRole('button', { name: '地图廊', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('[data-place-id="second-8-1"] button')?.getAttribute('aria-pressed') === 'true');
    if (await page.getByRole('button', { name: '2D 俯视', exact: true }).getAttribute('aria-pressed') !== 'true') throw new Error('Lost default 2D');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
    if (overflow || errors.length) throw new Error(JSON.stringify({ width, overflow, errors }));
    report.push({ width, regions: regionCount, goldPixels: gold, viewTabs: true, keyboard: true, emulatedTouch, roomSelection: 'second-8-1', overflow, errors });
    await page.close();
  }
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
} finally { await browser.close(); }
