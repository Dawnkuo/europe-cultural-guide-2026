import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const origin = process.env.QA_ORIGIN ?? 'http://localhost:55910';
const output = 'work/experience/vatican-additions';
await mkdir(output, { recursive: true });
const cases = [
  ['vatican-hermes', '观景楼的赫尔墨斯', 'first-4-1'],
  ['vatican-perseus', '卡诺瓦《珀尔修斯与美杜莎之首》', 'first-4-1'],
  ['vatican-stefaneschi', '乔托《斯特凡内斯基三联画》', 'first-19-1'],
  ['vatican-heliodorus', '《赫利奥多罗被逐出神殿》', 'second-10-1'],
  ['vatican-nile', '尼罗河神群像', 'first-3-1'],
  ['vatican-expulsion', '《原罪与逐出乐园》', 'first-西斯廷室内-1'],
  ['vatican-deluge', '《大洪水》', 'first-西斯廷室内-1'],
  ['vatican-libyan-sibyl', '利比亚女先知', 'first-西斯廷室内-1'],
  ['vatican-angelico-madonna', '安杰利科《圣母子与圣多米尼克、圣凯瑟琳》', 'first-19-1'],
  ['vatican-museums-highlight-5', '雅典学院', 'second-10-1'],
  ['vatican-museums-highlight-6', '创造亚当', 'first-西斯廷室内-1'],
  ['vatican-museums-highlight-7', '最后的审判', 'first-西斯廷室内-1'],
  ['vatican-borgia', '波吉亚寓所与《圣凯瑟琳辩论》', 'first-11-1'],
  ['vatican-momo', '莫莫双螺旋楼梯', 'first-螺旋坡道-1'],
  ['vatican-djedmut', '杰德穆特彩绘木棺', 'first-1-1'],
  ['vatican-lady-shroud', '“梵蒂冈女士”彩绘裹尸布', 'first-1-1'],
  ['vatican-hercules', '圆厅镀金青铜赫拉克勒斯', 'first-4-1'],
  ['vatican-candelabra', '烛台廊的六段陈列', 'second-6-1'],
  ['vatican-sphere', '阿纳尔多·波莫多罗《球中球》', 'first-松果庭院-1'],
  ['vatican-sistine-hall', '宗座图书馆西斯廷大厅', null],
  ['vatican-dogmatic', '“教义”双层叙事石棺', 'first-18-1'],
  ['peter-necropolis', '圣彼得大殿下的罗马墓地', null, 'st-peters-basilica'],
  ['vatican-museums-highlight-4', '地图廊拱顶', 'second-8-1'],
  ['vatican-augustus', '普里马波塔的奥古斯都', 'first-3-1'],
  ['vatican-round-basin', '圆厅斑岩大盆', 'first-4-1'],
  ['vatican-foligno', '拉斐尔《福利尼奥圣母》', 'first-19-1'],
  ['vatican-melozzo', '梅洛佐的奏乐天使', 'first-19-1'],
  ['vatican-disputation', '拉斐尔《圣体辩论》', 'second-10-1'],
  ['vatican-fire-borgo', '《博尔戈的火灾》', 'second-10-1'],
  ['vatican-keys', '佩鲁吉诺《交钥匙》', 'first-西斯廷室内-1'],
  ['vatican-tapestry', '挂毯廊', 'second-7-1'],
  ['vatican-pigna', '松果庭院与铜松果', 'first-松果庭院-1'],
  ['vatican-todi', '托迪的“战神”', 'second-5-1'],
  ['vatican-fibula', '雷戈利尼—加拉西墓金胸针', 'second-5-1'],
  ['st-peters-basilica-highlight-1', '圣殇', 'basilica-6-1', 'st-peters-basilica'],
  ['st-peters-basilica-highlight-2', '青铜华盖', 'basilica-52-1', 'st-peters-basilica'],
  ['st-peters-basilica-highlight-3', '圣彼得宝座', 'basilica-35-1', 'st-peters-basilica'],
  ['st-peters-basilica-highlight-5', '米开朗基罗穹顶', 'basilica-52-1', 'st-peters-basilica'],
  ['peter-bronze', '青铜坐姿圣彼得像', 'basilica-51-1', 'st-peters-basilica'],
  ['peter-alexander', '亚历山大七世纪念墓', 'basilica-42-1', 'st-peters-basilica'],
  ['st-peters-square-highlight-1', '贝尼尼柱廊', null, 'st-peters-square'],
  ['st-peters-square-highlight-2', '梵蒂冈方尖碑', null, 'st-peters-square'],
  ['vatican-apoxyomenos', '刮汗污的运动员', 'first-4-1'],
  ['vatican-braccio', '新翼的古典陈列轴线', 'first-3-1'],
  ['vatican-temptations', '波提切利《基督受试探》', 'first-西斯廷室内-1'],
  ['vatican-last-supper', '罗塞利《最后的晚餐》', 'first-西斯廷室内-1'],
  ['vatican-anubis', '阿努比斯像', 'first-1-1'],
  ['st-peters-basilica-highlight-4', '梵蒂冈墓穴层', 'grottoes-5-1', 'st-peters-basilica'],
  ['st-peters-basilica-highlight-6', '灯笼观景台', null, 'st-peters-basilica'],
  ['peter-longinus', '贝尼尼《圣朗基努斯》', 'basilica-50-1', 'st-peters-basilica'],
  ['peter-clement', '克莱孟十三世纪念墓', 'basilica-28-1', 'st-peters-basilica'],
  ['peter-gregory', '格列高利十三世纪念墓', 'basilica-15-1', 'st-peters-basilica'],
  ['peter-filarete', '菲拉雷特青铜门', 'basilica-3-1', 'st-peters-basilica'],
  ['peter-holy-door', '圣门', 'basilica-4-1', 'st-peters-basilica'],
  ['peter-narthex', '马德尔诺门廊', 'basilica-1-1', 'st-peters-basilica'],
];
const browser = await chromium.launch({ channel: 'chrome' });
const results = [];
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 960 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const [id, title, place, slug = 'vatican-museums'] of cases) {
      await page.goto(`${origin}/guides/${slug}#work-${id}`, { waitUntil: 'networkidle' });
      const detail = page.locator('.highlight-detail');
      await detail.getByRole('heading', { name: title, exact: true }).waitFor();
      await detail.locator('.highlight-detail__image img').first().evaluate(image => image.decode());
      assert.ok(await detail.evaluate(element => element.scrollTop <= 2), 'A fresh work must open at its beginning (2px native focus tolerance)');
      // Locator screenshots can scroll a tall native dialog while framing it.
      await page.screenshot({ path: `${output}/${id}-${width}-detail.png` });
      assert.ok(await detail.locator('ol li').count() >= 3, `${id}: distinct observations are required`);
      const listStyle = await detail.locator('ol').evaluate(list => ({
        style: getComputedStyle(list).listStyleType,
        lineHeight: Number.parseFloat(getComputedStyle(list).lineHeight),
        gap: Number.parseFloat(getComputedStyle(list).rowGap),
      }));
      assert.equal(listStyle.style, 'decimal');
      assert.ok(listStyle.lineHeight >= 28 && listStyle.gap >= 14, `${id}: observation spacing`);
      await detail.getByRole('button', { name: /放大查看/ }).click();
      const viewer = page.locator('.artwork-viewer');
      await viewer.locator('img').evaluate(image => image.decode());
      await viewer.getByRole('button', { name: '放大图片', exact: true }).click();
      if (id === 'vatican-stefaneschi') {
        await viewer.getByRole('button', { name: '下一张图片', exact: true }).click();
        await viewer.getByRole('img', { name: /基督面/ }).evaluate(image => image.decode());
        assert.equal(await viewer.getByLabel('图片序号').textContent(), '2 / 2');
        assert.equal(await viewer.getByLabel('图片缩放比例').textContent(), '100%');
      }
      const extraViews = { 'st-peters-basilica-highlight-5': 3, 'peter-alexander': 2, 'vatican-anubis': 2, 'peter-narthex': 2 }[id];
      if (extraViews) {
        for (let index = 2; index <= extraViews; index++) {
          await viewer.getByRole('button', { name: '下一张图片', exact: true }).click();
          await viewer.locator('img').evaluate(image => image.decode());
          assert.equal(await viewer.getByLabel('图片序号').textContent(), `${index} / ${extraViews}`);
          assert.equal(await viewer.getByLabel('图片缩放比例').textContent(), '100%');
          await viewer.screenshot({ path: `${output}/${id}-${width}-photo-${index}.png` });
        }
      }
      await viewer.screenshot({ path: `${output}/${id}-${width}.png` });
      await page.keyboard.press('Escape');
      if (place) {
        await detail.getByRole('button', { name: /在地图中定位|定位所在区域/ }).first().click();
        await page.waitForFunction(id => document.querySelector(`[data-place-id="${id}"] button`)?.getAttribute('aria-pressed') === 'true', place);
        await page.locator('.guide-room-works').getByRole('button', { name: new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) }).click();
        await detail.getByRole('heading', { name: title, exact: true }).waitFor();
      } else {
        assert.equal(await detail.getByRole('button', { name: /在地图中定位|定位所在区域/ }).count(), 0);
        if (slug !== 'st-peters-square') assert.match(await detail.locator('.highlight-detail__note').textContent(), /地图|平面/);
      }
      assert.equal(await page.locator('.artwork-viewer').count(), 0, 'Reopening a work must not resurrect its closed image viewer');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
      results.push({ id, width, deepLink: true, gallery: true, mapRoundTrip: Boolean(place), unlocatedScopeVerified: !place });
    }
    assert.deepEqual(errors, []);
    await page.close();
  }
} finally {
  await browser.close();
  await writeFile(`${output}/report.json`, `${JSON.stringify(results, null, 2)}\n`);
}
console.log(JSON.stringify(results));
