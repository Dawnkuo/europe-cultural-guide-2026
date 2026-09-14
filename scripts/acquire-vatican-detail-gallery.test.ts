// @vitest-environment node
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import sharpLibrary from 'sharp';
import { expect, it } from 'vitest';

const script = new URL('./acquire-vatican-detail-gallery.mjs', import.meta.url).href;
// Vinext declares the optional Sharp import as unknown in the app's type environment.
interface FixtureImage {
  png(): FixtureImage;
  rotate(): FixtureImage;
  resize(options: { width: number; height: number; fit: 'inside'; withoutEnlargement: boolean }): FixtureImage;
  webp(options: { quality: number }): FixtureImage;
  toBuffer(): Promise<Buffer>;
}
const sharp = sharpLibrary as (input: Buffer | { create: { width: number; height: number; channels: 3; background: string } }) => FixtureImage;

it.each([true, false])('preserves manifest records across a full-run interruption (unchanged image: %s)', async unchanged => {
  const root = await mkdtemp(join(tmpdir(), 'vatican-acquire-'));
  try {
    await mkdir(join(root, 'sources/collections/galleries'), { recursive: true });
    await mkdir(join(root, 'app/data'), { recursive: true });
    const original = await sharp({ create: { width: 1200, height: 800, channels: 3, background: '#c4a253' } }).png().toBuffer();
    const output = await sharp(original).rotate().resize({ width: 1800, height: 1800, fit: 'inside', withoutEnlargement: true }).webp({ quality: 90 }).toBuffer();
    const hash = createHash('sha256').update(output).digest('hex');
    const untouched = { id: 'existing-work', outputSha256: 'preserved', visualReview: 'accepted-existing' };
    const manifestPath = join(root, 'sources/collections/galleries/vatican-reference-additions.json');
    await writeFile(manifestPath, JSON.stringify([untouched, { id: 'peter-narthex-overall', outputSha256: unchanged ? hash : 'older-image', visualReview: 'accepted-reviewed' }]));
    await writeFile(join(root, 'app/data/media-dimensions.generated.json'), '{}');
    const result = spawnSync(process.execPath, ['--input-type=module', '-e', `
      let count = 0;
      globalThis.fetch = async () => {
        count++;
        if (count === 1) return { ok: true, text: async () => '<div class="fullImageLink"><a href="https://upload.wikimedia.org/wikipedia/commons/test.jpg">original</a></div>' };
        if (count === 2) return { ok: true, arrayBuffer: async () => Buffer.from('${original.toString('base64')}', 'base64') };
        throw new Error('intentional later source failure');
      };
      await import(${JSON.stringify(script)});
    `], { cwd: root, encoding: 'utf8', timeout: 10000 });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('intentional later source failure');
    const records = JSON.parse(await readFile(manifestPath, 'utf8'));
    expect(records).toHaveLength(2);
    expect(records.find((record: { id: string }) => record.id === untouched.id)).toEqual(untouched);
    const updated = records.find((record: { id: string }) => record.id === 'peter-narthex-overall');
    expect(updated.outputSha256).toBe(hash);
    expect(updated.visualReview).toBe(unchanged ? 'accepted-reviewed' : 'pending');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
