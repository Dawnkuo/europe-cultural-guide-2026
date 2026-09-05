import { chromium } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const output = 'work/map-review/performance';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--enable-webgl', '--ignore-gpu-blocklist'] });
const percentile = (values, fraction) => [...values].sort((a, b) => a - b)[Math.floor((values.length - 1) * fraction)];
try {
  for (const slug of process.argv.slice(2)) {
    const model = JSON.parse(await readFile(`app/data/architectural-plans/${slug}.json`, 'utf8'));
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', isMobile: true, hasTouch: true });
    await context.addInitScript(() => {
      const observed = new WeakSet();
      const counters = { created: 0, lost: 0, live: 0 };
      window.__mapContexts = counters;
      // oxlint-disable-next-line typescript/unbound-method -- Delegated with the original canvas receiver below.
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...args) {
        const result = original.call(this, type, ...args);
        if (result && type.startsWith('webgl') && !observed.has(this)) {
          observed.add(this); counters.created++; counters.live++;
          this.addEventListener('webglcontextlost', () => { counters.lost++; counters.live--; }, { once: true });
        }
        return result;
      };
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`http://localhost:55838/guides/${slug}/#guide-spatial`, { waitUntil: 'domcontentloaded' });
    const map = page.locator('.architectural-map');
    await map.scrollIntoViewIfNeeded();
    await map.locator('canvas').waitFor({ timeout: 60000 });
    for (let cycle = 0; cycle < 6; cycle++) {
      await map.getByRole('button', { name: '2D 俯视', exact: true }).click();
      await page.waitForFunction(() => window.__mapContexts.live === 0);
      await map.getByRole('button', { name: '3D', exact: true }).click();
      await map.locator('canvas').waitFor({ timeout: 60000 });
      await page.waitForFunction(() => window.__mapContexts.live === 1);
    }
    // This is reproducible desktop Chromium CPU emulation, not a physical-phone FPS claim.
    const session = await context.newCDPSession(page);
    await session.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    const samples = await page.evaluate(async () => {
      const frames = [], renders = [];
      const canvas = document.querySelector('.architectural-map canvas');
      let previous;
      for (let index = 0; index < 150; index++) {
        const now = await new Promise(requestAnimationFrame);
        canvas.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
        if (previous && index > 15) frames.push(now - previous);
        previous = now;
        renders.push(Number(document.querySelector('.architectural-map__scene').dataset.renderMs));
      }
      return { frames, renders, contexts: window.__mapContexts };
    });
    await session.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    const report = {
      slug, modelDigest: createHash('sha256').update(JSON.stringify(model)).digest('hex'),
      environment: '390x844 Chromium, desktop CPU throttled 4x; not a physical mobile device',
      frames: samples.frames.length,
      frameP50Ms: percentile(samples.frames, .5), frameP95Ms: percentile(samples.frames, .95),
      renderP95Ms: percentile(samples.renders, .95), contexts: samples.contexts, errors,
    };
    report.emulated30Fps = report.frameP95Ms <= 34;
    await writeFile(`${output}/${slug}.json`, JSON.stringify(report, null, 2) + '\n');
    if (errors.length || samples.contexts.live !== 1 || !report.emulated30Fps) throw new Error(`${slug}: ${JSON.stringify(report)}`);
    console.log(slug, `frame p95 ${report.frameP95Ms.toFixed(1)}ms`, `live contexts ${report.contexts.live}`);
    await context.close();
  }
} finally { await browser.close(); }
