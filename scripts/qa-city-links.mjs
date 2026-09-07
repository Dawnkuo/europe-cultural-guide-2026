import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const base = (process.env.CITY_LINKS_QA_URL ?? 'http://localhost:55838').replace(/\/$/, '');
const output = 'work/city-links-review';
const report = [];
const errors = [];
const browser = await chromium.launch({ channel: 'chrome', headless: true });
await mkdir(output, { recursive: true });

try {
  for (const width of [320, 390, 768, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, serviceWorkers: 'block' });
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('response', (response) => {
      if (response.url().startsWith(base) && response.status() >= 400
        && ['document', 'script', 'fetch'].includes(response.request().resourceType())) {
        errors.push(`${response.status()} ${response.url()}`);
      }
    });
    await page.goto(`${base}/cities/`);
    await page.locator('.city-chapter__stops a').first().waitFor();
    const chapters = await page.locator('.city-chapter').evaluateAll((nodes) => nodes.map((chapter) => ({
      city: chapter.id,
      links: [...chapter.querySelectorAll('.city-chapter__stops a')].map((a) => ({
        href: a.getAttribute('href'), text: a.textContent,
        width: a.getBoundingClientRect().width, height: a.getBoundingClientRect().height,
        left: a.getBoundingClientRect().left, right: a.getBoundingClientRect().right,
      })),
    })));
    assert(chapters.length > 0 && chapters.every((chapter) => chapter.links.length > 0));
    for (const chapter of chapters) for (const link of chapter.links) {
      assert(link.href.includes('/guides/') || link.href.includes('/itinerary/#'), `No destination for ${link.text}`);
      assert(link.height >= 44 && link.width >= 44, `Small target: ${link.text}`);
      assert(link.left >= 0 && link.right <= width + 1, `Clipped link: ${link.text}`);
    }
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Horizontal overflow');
    const first = page.locator('.city-chapter__stops a').first();
    await first.focus();
    assert.equal(await first.evaluate((a) => getComputedStyle(a).outlineStyle), 'solid');
    await page.locator('.city-chapter__stops').first().screenshot({ path: `${output}/links-${width}.png` });

    // Follow real links in every city at both phone and desktop sizes.
    const clicked = [];
    if (width === 390 || width === 1440) {
      for (const chapter of chapters) {
        const sample = [
          chapter.links.find((link) => link.href.includes('/guides/')),
          chapter.links.find((link) => link.href.includes('/itinerary/#')),
        ].filter(Boolean);
        for (const link of sample) {
          await page.goto(`${base}/cities/`);
          const target = page.locator('.city-chapter__stops a').filter({ hasText: link.text }).first();
          await target.focus();
          if (clicked.length === 0) await page.keyboard.press('Enter');
          else await target.click();
          const expected = new URL(link.href, base);
          await page.waitForURL((url) =>
            url.origin === expected.origin
            && url.pathname.replace(/\/$/, '') === expected.pathname.replace(/\/$/, '')
            && url.hash === expected.hash);
          await page.locator('h1').waitFor();
          if (expected.hash) {
            const item = page.locator(`[id="${decodeURIComponent(expected.hash.slice(1))}"]`);
            await item.waitFor();
            assert((await item.textContent()).includes(link.text), 'Wrong itinerary anchor');
            await page.waitForFunction((id) => {
              const rect = document.getElementById(id)?.getBoundingClientRect();
              return rect && rect.top < innerHeight && rect.bottom > 0;
            }, decodeURIComponent(expected.hash.slice(1)));
          } else {
            assert(await page.locator('#guide-highlights').count() > 0, 'Guide content missing');
          }
          clicked.push({ city: chapter.city, text: link.text, href: link.href });
        }
      }
    }
    report.push({ width, linkCount: chapters.reduce((sum, c) => sum + c.links.length, 0), clicked });
    console.log(`${width}px: ${report.at(-1).linkCount} links checked; ${clicked.length} navigation checks`);
    await page.close();
  }
  assert.deepEqual(errors, [], 'Runtime or resource errors');
  await writeFile(`${output}/report.json`, JSON.stringify({ report, errors }, null, 2));
} finally {
  await browser.close();
}
