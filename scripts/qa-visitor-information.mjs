import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { createServer } from 'vite';
import { githubPreview } from './github-preview-server.mjs';

const vite = await createServer({ configFile: false, cacheDir: 'node_modules/.vite-visitor-audit', server: { middlewareMode: true } });
let visitorInformation;
try { ({ visitorInformation } = await vite.ssrLoadModule('/app/data/visitor-information.ts')); }
finally { await vite.close(); }

const preview = process.env.QA_BUILD === '1' ? await githubPreview() : null;
const origin =
  preview?.url ?? process.env.QA_ORIGIN ?? 'http://localhost:55910';
const offline = process.env.QA_OFFLINE === '1';
const output = process.env.QA_OUTPUT ?? 'work/experience/visitor-information';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const report = { origin, offline, cases: [] };
try {
  for (const width of (
    process.env.QA_WIDTHS ?? (offline ? '390' : '1440,1094,390,320')
  )
    .split(',')
    .map(Number)) {
    const context = await browser.newContext({
      viewport: { width, height: 960 },
      reducedMotion: 'reduce',
      serviceWorkers: offline ? 'allow' : 'block',
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    if (offline) {
      const manifest = await fetch(`${origin}/guide-precache.json`).then(
        (response) => response.json(),
      );
      report.revision = manifest.revision;
      await page.goto(`${origin}/`, { waitUntil: 'domcontentloaded' });
      await page.evaluate(async () => {
        await navigator.serviceWorker.register(`${location.pathname}sw.js`);
        await navigator.serviceWorker.ready;
      });
      await page.waitForFunction(
        async (revision) => {
          const key = (await caches.keys()).find((key) =>
            key.endsWith(revision),
          );
          return (
            key &&
            Boolean(
              await (
                await caches.open(key)
              ).match(`${location.pathname}offline-ready`),
            )
          );
        },
        manifest.revision,
        { timeout: 240000 },
      );
      await context.setOffline(true);
    }
    for (const [slug, information] of Object.entries(visitorInformation)) {
      await page.goto(`${origin}/guides/${slug}/#guide-practical`, {
        waitUntil: 'networkidle',
      });
      const practical = page.locator('#guide-practical');
      await practical.scrollIntoViewIfNeeded();
      await practical.locator('.guide-visitor-information').waitFor();
      assert.equal(
        await practical
          .locator('.guide-visitor-information__topics article')
          .count(),
        information.topics.length,
      );
      for (const topic of information.topics) {
        const article = practical.locator(`#visitor-${topic.id}`);
        for (const paragraph of topic.paragraphs)
          assert.equal(
            await article.getByText(paragraph, { exact: true }).count(),
            1,
          );
        for (const link of topic.guides ?? []) {
          const href = await article
            .getByRole('link', { name: link.label, exact: true })
            .getAttribute('href');
          assert.ok(href.endsWith(`/guides/${link.slug}/#guide-practical`));
        }
      }
      await page.screenshot({
        path: `${output}/${slug}-${width}-overview.png`,
      });
      for (const question of information.questions) {
        const detail = practical.locator(`#visitor-question-${question.id}`);
        const summary = detail.locator('summary');
        await summary.focus();
        await page.keyboard.press('Enter');
        assert.equal(await detail.getAttribute('open'), '');
        for (const paragraph of question.paragraphs)
          assert.ok(
            await detail.getByText(paragraph, { exact: true }).isVisible(),
          );
      }
      await practical
        .locator('.guide-visitor-information__faq')
        .scrollIntoViewIfNeeded();
      await page.screenshot({ path: `${output}/${slug}-${width}-faq.png` });
      const layout = await practical
        .locator('.guide-visitor-information')
        .evaluate((root) => {
          const articles = [...root.querySelectorAll('article')].map((e) =>
            e.getBoundingClientRect(),
          );
          const controls = [...root.querySelectorAll('button, summary, a')].map(
            (e) => ({
              width: e.getBoundingClientRect().width,
              height: e.getBoundingClientRect().height,
            }),
          );
          return {
            stacked: articles
              .slice(1)
              .every((a, i) => a.top >= articles[i].bottom - 1),
            overflow: document.documentElement.scrollWidth > innerWidth + 1,
            controls,
          };
        });
      assert.equal(layout.overflow, false);
      if (width <= 960) assert.equal(layout.stacked, true);
      assert.ok(layout.controls.every((c) => c.height >= 44 && c.width > 0));
      const targets = information.topics.flatMap((topic) =>
        (topic.places ?? []).map((place) => ({ ...place, topicId: topic.id })),
      );
      let locations = 0;
      if (targets.length) {
        const plan = JSON.parse(
          await readFile(`app/data/architectural-plans/${slug}.json`, 'utf8'),
        );
        await page.locator('#guide-spatial').scrollIntoViewIfNeeded();
        await page.locator('.architectural-map__plane > svg').waitFor();
        assert.equal(
          await page
            .getByRole('button', { name: '2D 俯视', exact: true })
            .getAttribute('aria-pressed'),
          'true',
        );
        // Explicit service lookup must restore its hidden layer and select the right floor.
        await page
          .getByRole('button', { name: '地图图层', exact: true })
          .click();
        await page
          .getByRole('checkbox', { name: '服务设施', exact: true })
          .uncheck();
        await page
          .getByRole('button', { name: '地图图层', exact: true })
          .click();
        await page.getByRole('button', { name: '3D', exact: true }).click();
        await page.locator('.architectural-map__scene canvas').waitFor();
        for (const target of targets) {
          const button = practical
            .locator(`#visitor-${target.topicId}`)
            .getByRole('button', { name: target.label, exact: true });
          await button.scrollIntoViewIfNeeded();
          await button.click();
          await page.waitForFunction(
            (id) =>
              document
                .querySelector(`[data-place-id="${id}"] button`)
                ?.getAttribute('aria-pressed') === 'true',
            target.id,
          );
          const place = plan.places.find((place) => place.id === target.id);
          const floor = plan.floors.find((floor) => floor.id === place.floorId);
          assert.equal(
            await page
              .getByRole('button', { name: '2D 俯视', exact: true })
              .getAttribute('aria-pressed'),
            'true',
          );
          assert.equal(
            await page
              .locator('.architectural-map__floors')
              .getByRole('button', { name: floor.label, exact: true })
              .getAttribute('aria-pressed'),
            'true',
          );
          assert.equal(
            await page.evaluate(() =>
              document.activeElement?.classList.contains(
                'architectural-map__viewport',
              ),
            ),
            true,
          );
          const marker = page.locator(`[data-place-id="${target.id}"] button`);
          const visible = await marker.evaluate((element) => {
            const rect = element.getBoundingClientRect();
            const host = element
              .closest('.architectural-map__viewport')
              .getBoundingClientRect();
            return (
              rect.right > host.left &&
              rect.left < host.right &&
              rect.bottom > host.top &&
              rect.top < host.bottom
            );
          });
          assert.equal(visible, true);
          const anchorVisible = await page
            .locator('.architectural-map__viewport')
            .evaluate((host, at) => {
              const p = new DOMPoint(...at).matrixTransform(
                host.querySelector('svg').getScreenCTM(),
              );
              const r = host.getBoundingClientRect();
              return (
                p.x >= r.left &&
                p.x <= r.right &&
                p.y >= r.top &&
                p.y <= r.bottom
              );
            }, place.at);
          assert.equal(anchorVisible, true);
          locations++;
        }
        await page.screenshot({
          path: `${output}/${slug}-${width}-map-link.png`,
        });
      }
      // A long section must remain readable when the user enlarges browser text.
      await page.evaluate(
        () => (document.documentElement.style.fontSize = '200%'),
      );
      await practical.scrollIntoViewIfNeeded();
      const textOverflow = await practical
        .locator('.guide-visitor-information')
        .evaluate((root) =>
          [...root.querySelectorAll('p,h3,summary,a,button')].some(
            (element) => element.scrollWidth > element.clientWidth + 1,
          ),
        );
      assert.equal(textOverflow, false);
      await page.screenshot({
        path: `${output}/${slug}-${width}-large-text.png`,
      });
      await page.evaluate(() =>
        document.documentElement.style.removeProperty('font-size'),
      );
      const checks = practical.getByRole('checkbox');
      await checks.first().check();
      await page.reload({ waitUntil: 'networkidle' });
      await practical.scrollIntoViewIfNeeded();
      assert.equal(await checks.first().isChecked(), true);
      await practical
        .getByRole('button', { name: '清除已读标记', exact: true })
        .click();
      assert.deepEqual(errors, []);
      const result = {
        slug,
        width,
        topics: information.topics.length,
        questions: information.questions.length,
        locations,
        offlineRefresh: offline,
        passed: true,
      };
      report.cases.push(result);
      await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
      console.log(JSON.stringify(result));
    }
    // Changes to this shared section cannot inject Vatican copy into other chapters.
    await page.goto(`${origin}/guides/uffizi/#guide-practical`, {
      waitUntil: 'networkidle',
    });
    assert.equal(await page.locator('.guide-visitor-information').count(), 0);
    await context.close();
  }
} finally {
  await browser.close();
  await preview?.close();
}
