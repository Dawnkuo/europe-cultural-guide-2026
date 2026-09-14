import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const origin = process.env.QA_ORIGIN ?? 'http://localhost:55910';
const output = 'work/experience/browser';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const report = [];
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${origin}/guides/vatican-museums`, { waitUntil: 'networkidle' });
    await page.locator('.architectural-map').waitFor();
    assert.equal(await page.getByRole('button', { name: '2D 俯视', exact: true }).getAttribute('aria-pressed'), 'true');
    await page.getByRole('searchbox').fill('拉奥孔');
    await page.locator('.highlight-browser__grid button').first().click();
    const dialog = page.getByRole('dialog');
    await page.screenshot({ path: `${output}/vatican-work-${width}.png` });
    await dialog.getByRole('button', { name: /定位所在区域/ }).click();
    await page.waitForFunction(() => document.querySelector('[data-place-id="first-4-1"] button')?.getAttribute('aria-pressed') === 'true');
    assert.equal(await page.getByRole('dialog').count(), 0);
    const room = page.locator('.guide-room-works');
    assert.ok(await room.getByRole('button').count() >= 4);
    await room.getByRole('button', { name: /观景楼阿波罗/ }).click();
    await page.getByRole('dialog').getByRole('heading', { name: '观景楼阿波罗', exact: true }).waitFor();
    await page.getByRole('button', { name: '关闭作品详情' }).click();
    await page.getByRole('button', { name: '开始现场导览', exact: true }).click();
    await page.getByRole('button', { name: '下一站', exact: true }).click();
    await page.getByRole('button', { name: '下一站', exact: true }).click();
    const onsite = page.getByRole('dialog', { name: '梵蒂冈博物馆现场导览' });
    await onsite.locator('.guide-location-preview').waitFor();
    assert.ok(await onsite.locator('.onsite-guide__work img').count() > 0);
    await page.screenshot({ path: `${output}/vatican-onsite-${width}.png` });
    await onsite.getByRole('button', { name: '作品详情', exact: true }).first().click();
    assert.equal(await page.getByRole('dialog').count(), 2);
    await page.keyboard.press('Escape');
    await onsite.waitFor({ state: 'visible' });
    assert.equal(await page.getByRole('dialog').count(), 1, 'Escape only dismisses the upper work dialog');
    await onsite.getByRole('button', { name: '查看完整地图', exact: true }).click();
    assert.equal(await page.getByRole('dialog').count(), 0);
    await page.locator('.architectural-map').scrollIntoViewIfNeeded();
    await page.getByRole('button', { name: '3D', exact: true }).click();
    await page.locator('.architectural-map__scene canvas').waitFor();
    await page.waitForFunction(() => Number(document.querySelector('.architectural-map__scene')?.getAttribute('data-visible-samples')) > 20);
    await page.locator('.architectural-map__scene').screenshot({ path: `${output}/vatican-3d-${width}.png` });
    const canvas = page.locator('.architectural-map__scene canvas');
    await canvas.focus();
    await page.keyboard.press('ArrowRight');
    const floors = page.getByRole('group', { name: '楼层', exact: true });
    await floors.getByRole('button').first().click();
    assert.equal(await floors.getByRole('button').first().getAttribute('aria-pressed'), 'true');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
    assert.equal(overflow, false);
    assert.deepEqual(errors, []);
    report.push({ width, workToMap: true, roomToWork: true, onsiteImages: true, onsiteMap: true, nestedDialog: true, canvasPixels: true, floorAfterOrbit: true, overflow, errors });
    await page.close();
  }
} finally {
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
  await browser.close();
}
console.log(JSON.stringify(report, null, 2));
