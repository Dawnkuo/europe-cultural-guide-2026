import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import sharp from "sharp";

const origin = process.env.QA_ORIGIN ?? "http://localhost:55910";
const output =
  process.env.QA_OUTPUT ?? "work/experience/st-peters-source/interaction";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });
const report = [];
try {
  for (const width of [1440, 820, 390, 320]) {
    const page = await browser.newPage({
      viewport: { width, height: 960 },
      reducedMotion: "reduce",
      serviceWorkers: "block",
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    for (const slug of ["st-peters-basilica", "st-peters-square"]) {
      const result = { slug, width, views: [] };
      await page.goto(`${origin}/guides/${slug}`, { waitUntil: "networkidle" });
      if (slug === "st-peters-basilica") {
        assert.equal(
          await page
            .getByRole("button", { name: "2D 俯视", exact: true })
            .getAttribute("aria-pressed"),
          "true",
        );
        await page.getByRole("button", { name: "外观", exact: true }).click();
      }
      const canvas = page.locator(".guide-spatial-3d__canvas");
      const regions = page.getByRole("group", { name: "外观范围" });
      await page.waitForFunction(
        () =>
          document.querySelector(".guide-spatial-3d__canvas")?.dataset
            .rendered === "true",
      );
      const expectedDefault =
        slug === "st-peters-square" ? "圣彼得广场" : "圣彼得大教堂";
      assert.equal(
        await regions
          .getByRole("button", { name: expectedDefault, exact: true })
          .getAttribute("aria-pressed"),
        "true",
      );
      for (const name of [
        expectedDefault,
        "全景",
        expectedDefault === "圣彼得广场" ? "圣彼得大教堂" : "圣彼得广场",
      ]) {
        await regions.getByRole("button", { name, exact: true }).click();
        await page.evaluate(() => {
          const canvas = document.querySelector(".guide-spatial-3d__canvas");
          window.scrollBy(0, canvas.getBoundingClientRect().top - 170);
        });
        await page.evaluate(
          () =>
            new Promise((resolve) =>
              requestAnimationFrame(() => requestAnimationFrame(resolve)),
            ),
        );
        const shot = await canvas.screenshot({
          path: `${output}/${slug}-${width}-${name}.png`,
        });
        const { data } = await sharp(shot)
          .resize(100, 100)
          .removeAlpha()
          .raw()
          .toBuffer({ resolveWithObject: true });
        let pixels = 0;
        for (let index = 0; index < data.length; index += 3)
          if (data[index] > 65 && data[index + 1] > 65 && data[index + 2] > 65)
            pixels++;
        assert.ok(pixels > 450, `${slug} ${width} ${name}: undersized model`);
        result.views.push({
          name,
          pixels,
          camera: await canvas.getAttribute("data-camera"),
        });
      }
      await canvas.focus();
      const before = await canvas.getAttribute("data-camera");
      await page.keyboard.press("ArrowRight");
      await page.waitForFunction(
        (previous) =>
          document.querySelector(".guide-spatial-3d__canvas").dataset.camera !==
          previous,
        before,
      );
      const rect = await canvas.boundingBox();
      await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
      await page.mouse.down();
      await page.mouse.move(
        rect.x + rect.width / 2 + 60,
        rect.y + rect.height / 2 + 30,
        { steps: 8 },
      );
      await page.mouse.up();
      await regions.getByRole("button", { name: "全景", exact: true }).click();
      assert.equal(
        await regions
          .getByRole("button", { name: "全景", exact: true })
          .getAttribute("aria-pressed"),
        "true",
      );
      await page.getByRole("button", { name: "放大外观", exact: true }).click();
      await canvas.focus();
      await page.keyboard.press("Home");
      assert.equal(
        await regions
          .getByRole("button", { name: "全景", exact: true })
          .getAttribute("aria-pressed"),
        "true",
      );
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth + 1,
        ),
        false,
      );
      await page.evaluate(() => scrollTo(0, 0));
      await page.waitForFunction(() => document.querySelector('.guide-spatial-3d__canvas')?.dataset.suspended === 'true');
      await canvas.scrollIntoViewIfNeeded();
      await page.waitForFunction(() => document.querySelector('.guide-spatial-3d__canvas')?.dataset.suspended === 'false');
      result.visibilitySuspension = true;
      if (slug === "st-peters-basilica") {
        await page.getByRole("button", { name: "内部", exact: true }).click();
        assert.equal(
          await page
            .getByRole("button", { name: "2D 俯视", exact: true })
            .getAttribute("aria-pressed"),
          "true",
        );
      }
      result.errors = [...errors];
      assert.deepEqual(errors, []);
      report.push(result);
      console.log(JSON.stringify({ slug, width, passed: true }));
    }
    await page.close();
  }

  const page = await browser.newPage({
    reducedMotion: "reduce",
    serviceWorkers: "block",
  });
  await page.goto(`${origin}/guides/st-peters-basilica`, {
    waitUntil: "networkidle",
  });
  let release;
  const hold = new Promise((resolve) => {
    release = resolve;
  });
  let requested;
  const started = new Promise((resolve) => {
    requested = resolve;
  });
  await page.route("**/models/st-peters-exterior.glb", async (route) => {
    requested();
    await hold;
    await route.abort();
  });
  await page.getByRole("button", { name: "外观", exact: true }).click();
  await started;
  await page.getByRole("button", { name: "内部", exact: true }).click();
  release();
  await page.unrouteAll({ behavior: "wait" });
  assert.equal(await page.locator(".guide-spatial-3d__canvas").count(), 0);
  await page.getByRole("button", { name: "外观", exact: true }).click();
  await page.waitForFunction(
    () =>
      document.querySelector(".guide-spatial-3d__canvas")?.dataset.rendered ===
      "true",
  );
  await page.getByRole("button", { name: "内部", exact: true }).click();
  await page.route("**/models/st-peters-exterior.glb", (route) =>
    route.fulfill({ status: 503, body: "unavailable" }),
  );
  await page.getByRole("button", { name: "外观", exact: true }).click();
  await page
    .getByText("外观模型暂时无法显示，导览内容仍可阅读。", { exact: true })
    .waitFor();
  assert.equal(
    await page
      .getByAltText("圣彼得大教堂与广场的静态建筑模型")
      .evaluate(async (img) => {
        await img.decode();
        return img.naturalWidth;
      }),
    1440,
  );
  await page.unrouteAll();
  await page.getByRole("button", { name: "重新加载外观", exact: true }).click();
  await page.waitForFunction(
    () =>
      document.querySelector(".guide-spatial-3d__canvas")?.dataset.rendered ===
      "true",
  );
  await page.getByRole("button", { name: "内部", exact: true }).click();
  assert.equal(
    await page
      .getByRole("button", { name: "2D 俯视", exact: true })
      .getAttribute("aria-pressed"),
    "true",
  );
  report.push({
    interruptionRecovery: true,
    failedFetchRetains2d: true,
    staticFallbackAndRetry: true,
  });
  await page.close();
} finally {
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
  await browser.close();
}
