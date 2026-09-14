import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const origin = process.env.QA_ORIGIN ?? 'http://localhost:55910';
const output = process.env.QA_OUTPUT ?? 'work/experience/artwork-images';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const report = [];
try {
  for (const viewport of [
    { width: 1440, height: 960 },
    { width: 390, height: 844 },
    { width: 844, height: 390 },
  ]) {
    const page = await browser.newPage({
      viewport,
      hasTouch: viewport.width !== 1440,
      reducedMotion: 'reduce',
      serviceWorkers: 'block',
    });
    const result = { viewport, errors: [] };
    page.on('pageerror', (error) => result.errors.push(error.message));
    try {
      await page.goto(
        `${origin}/guides/vatican-museums#work-vatican-museums-highlight-1`,
        { waitUntil: 'networkidle' },
      );
      const detail = page.locator('.highlight-detail');
      await detail.locator('.highlight-detail__copy ol').scrollIntoViewIfNeeded();
      const toolbar = detail.locator('.highlight-detail__toolbar');
      const toolbarBounds = await toolbar.boundingBox();
      const detailBounds = await detail.boundingBox();
      assert.ok(toolbarBounds.width > detailBounds.width * 0.75, 'Scrolled close control needs a full-width opaque toolbar');
      assert.notEqual(await toolbar.evaluate(element => getComputedStyle(element).backgroundColor), 'rgba(0, 0, 0, 0)');
      assert.ok(await detail.getByRole('button', { name: '关闭作品详情', exact: true }).evaluate(element => {
        const rect = element.getBoundingClientRect();
        return element.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2));
      }));
      await detail.screenshot({ path: `${output}/reading-${viewport.width}.png` });
      await detail.evaluate(element => { element.scrollTop = 0; });
      const expand = detail.getByRole('button', { name: /放大查看/ });
      await expand.click();
      const viewer = page.locator('.artwork-viewer');
      await viewer
        .getByRole('button', { name: '放大图片', exact: true })
        .click();
      assert.ok(
        Number.parseInt(await viewer.getByLabel('图片缩放比例').textContent()) >
          100,
      );
      const stage = viewer.getByRole('application');
      const image = stage.locator('img');
      await image.evaluate((image) => image.decode());
      const beforePan = await stage
        .locator('.artwork-viewer__canvas')
        .getAttribute('style');
      await stage.focus();
      await page.keyboard.press('ArrowRight');
      assert.notEqual(
        await stage.locator('.artwork-viewer__canvas').getAttribute('style'),
        beforePan,
      );
      await viewer
        .getByRole('button', { name: '重置图片', exact: true })
        .click();
      assert.equal(
        await viewer.getByLabel('图片缩放比例').textContent(),
        '100%',
      );
      assert.equal(await stage.locator('.artwork-viewer__canvas').evaluate(element => getComputedStyle(element).transitionProperty), 'none');
      assert.equal(await stage.locator('.artwork-viewer__canvas').evaluate(element => new DOMMatrixReadOnly(getComputedStyle(element).transform).isIdentity), true);
      await viewer.screenshot({ path: `${output}/full-${viewport.width}.png` });
      if (viewport.width !== 1440) {
        const session = await page.context().newCDPSession(page);
        const bounds = await stage.boundingBox();
        const center = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
        const fingers = radius => [
          { id: 1, x: center.x - radius, y: center.y },
          { id: 2, x: center.x + radius, y: center.y },
        ];
        await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: fingers(24) });
        for (const radius of [32, 44, 58, 72]) {
          await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: fingers(radius) });
          await page.evaluate(() => new Promise(requestAnimationFrame));
        }
        await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        assert.ok(Number.parseInt(await viewer.getByLabel('图片缩放比例').textContent()) > 150, 'Two-finger pinch must zoom the actual viewer');
        const beforeTouchPan = await stage.locator('.artwork-viewer__canvas').getAttribute('style');
        await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ id: 1, ...center }] });
        for (const delta of [10, 20, 30, 40]) {
          await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ id: 1, x: center.x + delta, y: center.y + delta / 2 }] });
          await page.evaluate(() => new Promise(requestAnimationFrame));
        }
        await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        assert.notEqual(await stage.locator('.artwork-viewer__canvas').getAttribute('style'), beforeTouchPan, 'One-finger drag must pan a zoomed image');
        await viewer.screenshot({ path: `${output}/touch-${viewport.width}.png` });
        await viewer.getByRole('button', { name: '重置图片', exact: true }).click();
        assert.equal(await viewer.getByLabel('图片缩放比例').textContent(), '100%');
        result.emulatedTouchPinch = true;
        result.emulatedTouchPan = true;
        await session.detach();
      }
      await viewer
        .getByRole('button', { name: '下一张图片', exact: true })
        .click();
      await viewer
        .getByRole('img', {
          name: '《基督变容》上半部：基督、摩西与以利亚',
          exact: true,
        })
        .evaluate((image) => image.decode());
      assert.equal(await viewer.getByLabel('图片序号').textContent(), '2 / 2');
      assert.equal(
        await viewer.getByLabel('图片缩放比例').textContent(),
        '100%',
      );
      assert.equal(
        await viewer
          .getByRole('button', { name: '下一张图片', exact: true })
          .isDisabled(),
        true,
      );
      assert.equal(
        await page.evaluate(() => location.hash),
        '#work-vatican-museums-highlight-1',
      );
      await viewer
        .getByRole('button', { name: '放大图片', exact: true })
        .click();
      const box = await stage.boundingBox();
      const beforeDrag = await stage
        .locator('.artwork-viewer__canvas')
        .getAttribute('style');
      await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.6, {
        steps: 5,
      });
      await page.mouse.up();
      assert.notEqual(
        await stage.locator('.artwork-viewer__canvas').getAttribute('style'),
        beforeDrag,
      );
      await viewer.screenshot({
        path: `${output}/detail-${viewport.width}.png`,
      });
      assert.equal(
        await viewer.evaluate(
          (element) =>
            element.scrollWidth > innerWidth ||
            element.scrollHeight > innerHeight,
        ),
        false,
      );
      await page.keyboard.press('Escape');
      await viewer.waitFor({ state: 'detached' });
      assert.equal(await detail.isVisible(), true);
      assert.equal(
        await expand.evaluate((element) => element === document.activeElement),
        true,
      );
      await detail
        .getByRole('button', { name: '关闭作品详情', exact: true })
        .click();
      result.rapidReopens = 0;
      for (const { slug, works } of [
        { slug: 'vatican-museums', works: [
          { id: 'vatican-keys', title: '佩鲁吉诺《交钥匙》' },
          { id: 'vatican-disputation', title: '拉斐尔《圣体辩论》' },
        ] },
        { slug: 'st-peters-square', works: [
          { id: 'st-peters-square-highlight-1', title: '贝尼尼柱廊' },
          { id: 'st-peters-square-highlight-2', title: '梵蒂冈方尖碑' },
        ] },
      ]) {
        await page.goto(`${origin}/guides/${slug}#work-${works[0].id}`, { waitUntil: 'networkidle' });
        for (let index = 0; index < 12; index++) {
          await detail.waitFor({ state: 'visible' });
          if (index % 2) await page.keyboard.press('Escape');
          else await detail.getByRole('button', { name: '关闭作品详情', exact: true }).click();
          const next = works[(index + 1) % works.length];
          await page.evaluate(id => { location.hash = `work-${id}`; }, next.id);
          await page.waitForFunction(() => document.querySelector('.highlight-detail')?.open);
          await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
          assert.equal(await detail.isVisible(), true, `Rapid reopen dismissed ${next.id}`);
          assert.equal(await page.evaluate(() => location.hash), `#work-${next.id}`);
          assert.equal(await detail.locator('h3').textContent(), next.title);
          result.rapidReopens++;
        }
        await page.keyboard.press('Escape');
        await detail.waitFor({ state: 'hidden' });
      }
      await page.goto(`${origin}/guides/vatican-museums`, { waitUntil: 'networkidle' });
      await page
        .getByRole('button', { name: '开始现场导览', exact: true })
        .click();
      await page.getByRole('button', { name: '下一站', exact: true }).click();
      await page.getByRole('button', { name: '下一站', exact: true }).click();
      const onsite = page.locator('.onsite-guide');
      await onsite
        .getByRole('button', { name: '作品详情', exact: true })
        .first()
        .click();
      await detail.getByRole('button', { name: /放大查看/ }).click();
      await viewer.waitFor({ state: 'visible' });
      await page.keyboard.press('Escape');
      assert.equal(await detail.isVisible(), true);
      await page.keyboard.press('Escape');
      assert.equal(await onsite.isVisible(), true);
      await page.keyboard.press('Escape');
      assert.equal(await onsite.isVisible(), false);
      assert.deepEqual(result.errors, []);
      result.passed = true;
    } catch (error) {
      result.failure = error.message;
      await page.screenshot({
        path: `${output}/failure-${viewport.width}.png`,
      });
    }
    report.push(result);
    await page.close();
  }
} finally {
  await browser.close();
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
}
console.log(JSON.stringify(report, null, 2));
assert.ok(report.every((result) => result.passed));
