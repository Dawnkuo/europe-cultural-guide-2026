import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { githubPreview } from './github-preview-server.mjs';

const output = 'work/navigation-review';
const preview = await githubPreview('dist/client');
const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const results = [];
const check = (condition, message) => { if (!condition) throw new Error(message); };
await mkdir(output, { recursive: true });
try {
  for (const width of [320, 390, 768, 900, 901, 1094, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 }, serviceWorkers: 'block', reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const result = { width };
    results.push(result);
    try {
      await page.goto(`${preview.url}/`);
      const nav = page.getByRole('navigation', { name: '主导航' });
      const positions = await nav.evaluate((node) => {
        const bounds = node.getBoundingClientRect();
        return [...node.querySelectorAll('a')].map((a) => {
          const rect = a.getBoundingClientRect();
          return { text: a.textContent, visible: rect.width > 0 && rect.left >= bounds.left - 1 && rect.right <= bounds.right + 1, hit: a.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2)) };
        });
      });
      check(positions.every((p) => p.visible && p.hit), `Hidden/clipped home navigation: ${JSON.stringify(positions)}`);
      await page.screenshot({ path: `${output}/home-${width}.png` });
      await nav.getByRole('link', { name: '景点导览', exact: true }).click();
      await page.getByRole('heading', { name: '景点导览', exact: true }).waitFor();
      const total = await page.locator('.guide-index__row').count();
      check(total === 74, `Missing guide chapters: ${total}`);
      await page.getByRole('button', { name: '巴塞罗那', exact: true }).click();
      check((await page.locator('.guide-index__copy > p').allTextContents()).every((s) => s.includes('巴塞罗那')), 'City filter did not apply');
      await page.getByRole('button', { name: '博物馆与收藏', exact: true }).click();
      check((await page.locator('.guide-index__copy > p').allTextContents()).every((s) => s.includes('博物馆与收藏')), 'Type filter did not apply');
      for (const button of await page.getByRole('button', { name: '全部', exact: true }).all()) await button.click();
      check(await page.locator('.guide-index__row').count() === total, 'Reset filters lost chapters');
      await page.getByRole('button', { name: '巴塞罗那', exact: true }).click();
      await page.screenshot({ path: `${output}/directory-${width}.png` });
      await page.locator('.guide-index__row[href$="/guides/casa-batllo/"]').click();
      await page.getByRole('heading', { level: 1, name: /巴特罗之家/ }).waitFor();
      await page.locator('#guide-spatial').scrollIntoViewIfNeeded();
      await page.getByRole('button', { name: '3D', exact: true }).click();
      const canvas = page.locator('.architectural-map canvas');
      await canvas.waitFor({ timeout: 45000 });
      const stats = await sharp(await canvas.screenshot()).stats();
      check(stats.channels.slice(0, 3).reduce((n, c) => n + c.stdev, 0) > 3, 'Map did not render after navigating from the list');
      const header = await page.locator('.subnav').boundingBox();
      const local = await page.locator('.guide-local-nav').boundingBox();
      check(local.y >= header.y + header.height - 1, 'Guide navigation overlaps the main header');
      await page.screenshot({ path: `${output}/guide-${width}.png` });
      await page.getByRole('navigation', { name: '主导航' }).getByRole('link', { name: '景点导览', exact: true }).click();
      await page.getByRole('heading', { name: '景点导览', exact: true }).waitFor();
      check(await page.locator('.guide-index__row').count() === total, 'Return to guide list failed');
      await page.getByRole('navigation', { name: '主导航' }).getByRole('link', { name: '逐日行程', exact: true }).click();
      await page.locator('.day-section').first().scrollIntoViewIfNeeded();
      const itineraryHeader = await page.locator('.subnav').boundingBox();
      const filters = await page.locator('.filter-bar').boundingBox();
      check(filters.y >= itineraryHeader.y + itineraryHeader.height - 1, 'Itinerary filters overlap the main header');
      check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Page horizontal overflow');
      check(!errors.length, errors.join('; '));
      result.passed = true;
    } catch (error) {
      result.passed = false;
      result.failure = error.message;
      await page.screenshot({ path: `${output}/failure-${width}.png` });
      process.exitCode = 1;
    } finally { await page.close(); }
    console.log(width, result.passed ? 'navigation pass' : result.failure);
  }
  await writeFile(`${output}/report.json`, JSON.stringify(results, null, 2) + '\n');
} finally {
  await browser.close();
  await preview.close();
}
