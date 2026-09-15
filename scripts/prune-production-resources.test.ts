import { mkdtemp, mkdir, readFile, writeFile, access, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { pruneProductionResources } from './prune-production-resources.mjs';
import { generateGuidePrecache } from './generate-guide-precache.mjs';

const temporary: string[] = [];
afterEach(async () => { for (const directory of temporary.splice(0)) await rm(directory, { recursive: true, force: true }); });
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'guide-production-'));
  temporary.push(root);
  async function put(path: string, value = 'asset') {
    await mkdir(dirname(join(root, path)), { recursive: true });
    await writeFile(join(root, path), value);
  }
  await put('app/data.ts', `export const gallery = [{ src: '/images/used.jpg' }];`);
  await put('app/lazy.ts', 'export const image = (id: string) => `/images/dynamic-${id}.webp`;');
  await put('app/prefix.ts', `export const directory = '/images/other/';`);
  await put('app/example.test.ts', `const obsolete = '/images/old.jpg';`);
  await put('app/data/media-dimensions.generated.json', '{"/images/old.jpg":{"width":20,"height":10}}');
  await put('app/style.css', '@font-face { src: url(/vatican-guide/assets/fonts/active.woff2) }');
  for (const path of ['images/used.jpg', 'images/old.jpg', 'images/dynamic-one.webp', 'images/other/two.jpg', 'images/rendered.jpg', 'vatican-guide/assets/fonts/active.woff2', 'vatican-guide/assets/fonts/old.woff2', 'models/churches/florence-duomo.glb', 'models/churches/florence-duomo.svg', 'textures/pale-marble-albedo.png', 'maps/interior.svg', 'models/license.json', 'map-data/context.json']) await put(`output/${path}`);
  await put('output/guides/index.html', '<img src="/images/rendered.jpg">');
  await put('output/sw.js', `const CORE = ['/images/worker-only.jpg'];`);
  await put('output/images/worker-only.jpg');
  await put('output/manifest.webmanifest', '{"icons":[{"src":"/images/icon.png"}]}');
  await put('output/images/icon.png');
  await put('output/_next/static/client.js', 'same bytes');
  await put('output/guide/_next/static/client.js', 'same bytes');
  const options = { output: join(root, 'output'), appRoot: join(root, 'app'), nestedExportDirectory: 'guide' };
  return { root, put, options };
}

describe('production resource cleanup', () => {
  it('prunes only unreferenced media and identical export copies, then excludes them from offline caching', async () => {
    const { root, options } = await fixture();
    const result = await pruneProductionResources(options);
    expect(result.removed.map(item => item.path).sort()).toEqual(['guide/_next/static/client.js', 'images/old.jpg', 'vatican-guide/assets/fonts/old.woff2']);
    await expect(access(join(root, 'app/data/media-dimensions.generated.json'))).resolves.toBeUndefined();
    await generateGuidePrecache({ output: options.output, slugs: [] });
    const manifest = JSON.parse(await readFile(join(options.output, 'guide-precache.json'), 'utf8'));
    for (const path of result.removed.map(item => item.path)) expect(manifest.assets).not.toContain(`/${path}`);
    for (const path of ['images/used.jpg', 'images/dynamic-one.webp', 'images/other/two.jpg', 'images/rendered.jpg', 'images/worker-only.jpg', 'images/icon.png', 'vatican-guide/assets/fonts/active.woff2', 'models/churches/florence-duomo.glb', 'models/churches/florence-duomo.svg', 'textures/pale-marble-albedo.png', 'maps/interior.svg', 'models/license.json', 'map-data/context.json', '_next/static/client.js']) expect(manifest.assets).toContain(`/${path}`);
  });

  it('refuses to remove a conflicting build copy, without partially deleting media', async () => {
    const { put, options } = await fixture();
    await put('output/_next/static/client.js', 'different');
    await expect(pruneProductionResources(options)).rejects.toThrow('differs from canonical');
    await expect(access(join(options.output, 'images/old.jpg'))).resolves.toBeUndefined();
  });

  it.each(['models.html', 'models.rsc', 'models/index.html', '_next/ReferenceExterior-123.js'])('rejects leaked trial output: %s', async path => {
    const { put, options } = await fixture();
    await put(`output/${path}`);
    await expect(pruneProductionResources(options)).rejects.toThrow('trial');
  });
});
