import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { embedLocalGuide } from './embed-local-guide.mjs';

describe('embedLocalGuide', () => {
  it('copies a complete local guide directly into every chapter route', async () => {
    const root = await mkdtemp(join(tmpdir(), 'embedded-guide-'));
    const source = join(root, 'vatican-guide');
    const guides = join(root, 'guides');

    await mkdir(join(source, 'assets'), { recursive: true });
    await writeFile(
      join(source, 'index.html'),
      '<!doctype html><title>完整梵蒂冈导览</title><script src="./assets/app.js"></script>',
    );
    await writeFile(join(source, 'assets', 'app.js'), 'window.guideReady=true');
    await writeFile(
      join(source, 'sw.js'),
      'self.addEventListener("install",()=>{})',
    );

    await embedLocalGuide({
      source,
      guideOutput: guides,
      slugs: ['vatican-museums', 'st-peters-basilica'],
    });

    for (const slug of ['vatican-museums', 'st-peters-basilica']) {
      const destination = join(guides, slug);
      expect(await readFile(join(destination, 'index.html'), 'utf8')).toContain(
        '完整梵蒂冈导览',
      );
      expect(
        await readFile(join(destination, 'assets', 'app.js'), 'utf8'),
      ).toBe('window.guideReady=true');
      expect(await readFile(join(destination, 'sw.js'), 'utf8')).toContain(
        'install',
      );
    }

    await rm(root, { recursive: true, force: true });
  });
});
