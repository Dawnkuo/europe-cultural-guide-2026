import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { generateGuidePrecache } from './generate-guide-precache.mjs';

describe('generateGuidePrecache', () => {
  it('writes every verified static guide route to the offline manifest', async () => {
    const output = await mkdtemp(join(tmpdir(), 'guide-precache-'));
    await mkdir(join(output, 'guides', 'pantheon'), { recursive: true });
    await mkdir(join(output, 'guides', 'st-peters-basilica'), {
      recursive: true,
    });
    await writeFile(join(output, 'guides', 'index.html'), 'guide index');
    await writeFile(
      join(output, 'guides', 'pantheon', 'index.html'),
      'pantheon',
    );
    await writeFile(
      join(output, 'guides', 'st-peters-basilica', 'index.html'),
      'saint peter',
    );

    const routes = await generateGuidePrecache({
      output,
      slugs: ['pantheon', 'st-peters-basilica'],
    });
    const manifest = JSON.parse(
      await readFile(join(output, 'guide-precache.json'), 'utf8'),
    );

    expect(routes).toEqual([
      '/guides/',
      '/guides/pantheon/',
      '/guides/st-peters-basilica/',
    ]);
    expect(manifest.routes).toEqual(routes);
  });

  it('fails when a requested guide was not exported', async () => {
    const output = await mkdtemp(join(tmpdir(), 'guide-precache-'));
    await mkdir(join(output, 'guides'), { recursive: true });
    await writeFile(join(output, 'guides', 'index.html'), 'guide index');

    await expect(
      generateGuidePrecache({ output, slugs: ['missing-guide'] }),
    ).rejects.toThrow(/missing-guide/);
  });
});
