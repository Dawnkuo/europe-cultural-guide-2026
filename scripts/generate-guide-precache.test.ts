import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { generateGuidePrecache } from './generate-guide-precache.mjs';

describe('generateGuidePrecache', () => {
  it('requires and hashes extra native pages for offline filter deep links', async () => {
    const output = await mkdtemp(join(tmpdir(), 'photo-precache-'));
    await mkdir(join(output, 'guides'), { recursive: true });
    await writeFile(join(output, 'guides/index.html'), 'guides');
    await expect(generateGuidePrecache({ output, slugs: [], extraRoutes: ['/photo-spots/'] })).rejects.toThrow();
    await mkdir(join(output, 'photo-spots'));
    await writeFile(join(output, 'photo-spots/index.html'), 'photo spots');
    await generateGuidePrecache({ output, slugs: [], extraRoutes: ['/photo-spots/'] });
    const manifest = JSON.parse(await readFile(join(output, 'guide-precache.json'), 'utf8'));
    expect(manifest.routes).toContain('/photo-spots/');
    expect(manifest.integrity['/photo-spots/']).toBe(createHash('sha256').update('photo spots').digest('hex'));
    await expect(generateGuidePrecache({ output, slugs: [], extraRoutes: ['/../'] })).rejects.toThrow('Invalid offline route');
  });
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
    await mkdir(join(output, 'assets'));
    await writeFile(join(output, 'assets', 'uffizi-plan-hash.js'), 'map data');
    await writeFile(join(output, 'assets', 'ArchitecturalScene-hash.js'), 'lazy renderer');
    await writeFile(join(output, 'assets', 'guide.css'), 'styles');
    await writeFile(join(output, 'assets', 'st-peters.glb'), 'geometry');
    await writeFile(join(output, 'guides', 'pantheon.rsc'), 'static route payload');
    await mkdir(join(output, 'europe-cultural-guide-2026', '_next'), { recursive: true });
    await writeFile(join(output, 'europe-cultural-guide-2026', '_next', 'duplicate.js'), 'nested exporter copy');

    const routes = await generateGuidePrecache({
      output,
      slugs: ['pantheon', 'st-peters-basilica'],
      nestedExportDirectory: 'europe-cultural-guide-2026',
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
    expect(manifest.version).toBe(2);
    expect(manifest.assets).toEqual([
      '/assets/ArchitecturalScene-hash.js',
      '/assets/guide.css',
      '/assets/st-peters.glb',
      '/assets/uffizi-plan-hash.js',
      '/guides/pantheon.rsc',
    ]);
    expect(manifest.revision).toMatch(/^[a-f0-9]{20}$/);
    expect(manifest.integrity['/guides/pantheon/']).toBe(createHash('sha256').update('pantheon').digest('hex'));
    expect(manifest.integrity['/assets/st-peters.glb']).toBe(createHash('sha256').update('geometry').digest('hex'));
    expect(Object.keys(manifest.integrity).some(path => path.includes('/europe-cultural-guide-2026/'))).toBe(false);
  });

  it('fails when a requested guide was not exported', async () => {
    const output = await mkdtemp(join(tmpdir(), 'guide-precache-'));
    await mkdir(join(output, 'guides'), { recursive: true });
    await writeFile(join(output, 'guides', 'index.html'), 'guide index');

    await expect(
      generateGuidePrecache({ output, slugs: ['missing-guide'] }),
    ).rejects.toThrow(/missing-guide/);
  });

  it('changes the worker when same-named map assets change, but not on an identical rebuild', async () => {
    const output = await mkdtemp(join(tmpdir(), 'guide-precache-version-'));
    await mkdir(join(output,'guides'),{recursive:true});
    await writeFile(join(output,'guides/index.html'),'guide index');
    await writeFile(join(output,'model.glb'),'first model');
    const options = { output, slugs: [], serviceWorkerTemplate: "const CACHE = 'europe-cultural-guide-v9';\n" };
    await generateGuidePrecache(options);
    const first = await readFile(join(output,'sw.js'),'utf8');
    await generateGuidePrecache(options);
    expect(await readFile(join(output,'sw.js'),'utf8')).toBe(first);
    await writeFile(join(output,'model.glb'),'corrected model');
    await generateGuidePrecache(options);
    expect(await readFile(join(output,'sw.js'),'utf8')).not.toBe(first);
    expect(await readFile(join(output,'sw.js'),'utf8')).toMatch(/europe-cultural-guide-v9-[a-f0-9]{20}/);
  });
});
