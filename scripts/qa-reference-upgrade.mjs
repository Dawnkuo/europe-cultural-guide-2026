import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { githubPreview } from './github-preview-server.mjs';

const preview = process.env.QA_BUILD ? await githubPreview() : null;
const origin = preview?.url ?? process.env.QA_ORIGIN ?? 'http://localhost:55910';
const revision = preview ? await (await fetch(`${origin}/guide-precache.json`)).json() : null;
const selected = process.env.QA_SLUGS?.split(',');
const inventory = JSON.parse(await readFile('work/experience/inventory.json', 'utf8')).filter(guide => !selected || selected.includes(guide.slug));
const output = process.env.QA_OUTPUT ?? 'work/experience/site-review';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const report = [];
try {
  for (const width of (process.env.QA_WIDTHS ?? '1440,390').split(',').map(Number)) {
    const page = await browser.newPage({ viewport: { width, height: 960 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
    for (const guide of inventory) {
      const result = { slug: guide.slug, width, revision: revision?.revision, errors: [] };
      const errorHandler = error => result.errors.push(error.message);
      page.on('pageerror', errorHandler);
      try {
        await page.goto(`${origin}/guides/${guide.slug}`, { waitUntil: 'networkidle' });
        await page.getByRole('heading', { name: guide.title, exact: true }).first().waitFor();
        const map = page.locator('#guide-spatial');
        await map.scrollIntoViewIfNeeded();
        if (guide.floors?.length) {
          await page.locator('.architectural-map__plane > svg').waitFor();
          assert.equal(await page.getByRole('button', { name: '2D 俯视', exact: true }).getAttribute('aria-pressed'), 'true');
          assert.equal(await page.locator('.architectural-map__floors button').count(), guide.floors.length);
          await page.getByRole('button', { name: '地图图层', exact: true }).click();
          await page.getByRole('checkbox', { name: '服务设施', exact: true }).uncheck();
          assert.equal(await page.locator('.architectural-map__viewport [data-place-kind="service"]').count(), 0);
          await page.getByRole('checkbox', { name: '服务设施', exact: true }).check();
          await page.getByRole('button', { name: '地图图层', exact: true }).click();
          result.default2d = true;
          await map.screenshot({ path: `${output}/${guide.slug}-${width}-map.png` });
          await page.getByRole('button', { name: '外观', exact: true }).click();
        }
        const canvas = page.locator('.guide-spatial-3d__canvas');
        await canvas.evaluate(element => element.scrollIntoView({ block: 'center' }));
        await page.waitForFunction(() => document.querySelector('.guide-spatial-3d__canvas')?.getAttribute('data-rendered') === 'true');
        const before = await canvas.getAttribute('data-camera');
        await canvas.focus();
        await page.keyboard.press('ArrowRight');
        await page.waitForFunction(previous => document.querySelector('.guide-spatial-3d__canvas')?.getAttribute('data-camera') !== previous, before);
        await page.getByRole('button', { name: '放大外观', exact: true }).click();
        await page.getByRole('button', { name: '重置三维视角', exact: true }).click();
        const shot = await canvas.screenshot({ path: `${output}/${guide.slug}-${width}-exterior.png` });
        const { data } = await sharp(shot).resize(96,96).removeAlpha().raw().toBuffer({ resolveWithObject: true });
        let visible = 0;
        for (let i = 0; i < data.length; i += 3) if (data[i] > 45 || data[i+1] > 65 || data[i+2] > 80) visible++;
        assert.ok(visible > 30, `${guide.slug}: blank or nearly invisible canvas`);
        result.exteriorPixels = visible;
        result.exteriorKeyboard = true;
        const highlights = page.locator('#guide-highlights');
        await highlights.scrollIntoViewIfNeeded();
        assert.equal(await highlights.locator('.highlight-browser__grid article').count(), guide.highlights.length);
        await highlights.locator('img').evaluateAll(images => images.forEach(image => image.loading = 'eager'));
        result.images = await highlights.locator('img').evaluateAll(async images => {
          await Promise.all(images.map(image => image.decode().catch(() => undefined)));
          return images.map(image => ({ src: image.getAttribute('src'), width: image.naturalWidth, height: image.naturalHeight }));
        });
        assert.ok(result.images.every(image => image.width > 0), `${guide.slug}: broken collection image`);
        await highlights.locator('.highlight-browser__grid button').first().click();
        await page.getByRole('dialog', { name: guide.highlights[0].title, exact: true }).waitFor();
        await page.getByRole('button', { name: '关闭作品详情', exact: true }).click();
        await page.getByRole('button', { name: '开始现场导览', exact: true }).click();
        await page.getByRole('dialog', { name: `${guide.title}现场导览`, exact: true }).waitFor();
        await page.keyboard.press('Escape');
        const sequence = page.locator('#guide-sequence');
        await sequence.scrollIntoViewIfNeeded();
        const linkedWork = sequence.locator('.guide-sequence__work').first();
        if (await linkedWork.count()) {
          await linkedWork.click();
          await page.getByRole('button', { name: '关闭作品详情', exact: true }).click();
          assert.equal(await linkedWork.evaluate(element => element === document.activeElement), true);
          result.sequenceToWork = true;
        }
        const practical = page.locator('#guide-practical');
        await practical.scrollIntoViewIfNeeded();
        const notes = practical.getByRole('checkbox');
        assert.ok(await notes.count() > 0);
        await notes.first().check();
        assert.equal(await notes.first().isChecked(), true);
        await practical.getByRole('button', { name: '清除已读标记', exact: true }).click();
        assert.equal(await notes.first().isChecked(), false);
        result.practicalChecklist = true;
        await practical.screenshot({ path: `${output}/${guide.slug}-${width}-practical.png` });
        result.overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
        assert.equal(result.overflow, false, `${guide.slug}: page overflows`);
        assert.deepEqual(result.errors, []);
        result.passed = true;
      } catch (error) {
        result.failure = error.message;
        await page.screenshot({ path: `${output}/${guide.slug}-${width}-failure.png` });
      }
      page.off('pageerror', errorHandler);
      report.push(result);
      await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
      console.log(JSON.stringify({ slug: result.slug, width, passed: result.passed ?? false, failure: result.failure }));
    }
    await page.close();
  }
} finally { await browser.close(); await preview?.close(); }
assert.ok(report.every(result => result.passed), 'One or more guide pages failed the browser review');
