import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { guideCatalog } from '../guides';

describe('guide highlight media', () => {
  it('gives every locally rendered key artifact or scene a real local image', () => {
    const missing = guideCatalog.flatMap((guide) =>
      guide.highlights.flatMap((highlight) => {
        const imagePath = highlight.image
          ? resolve(process.cwd(), 'public', highlight.image.replace(/^\//, ''))
          : '';
        return highlight.image && existsSync(imagePath)
          ? []
          : [`${guide.slug}: ${highlight.title}`];
      }),
    );

    expect(missing).toEqual([]);
  });

  it('uses attraction-specific media instead of a generic city hero', () => {
    const guide = guideCatalog.find(
      (item) => item.slug === 'picasso-barcelona',
    )!;

    expect(guide.hero.src).toBe('/images/guides/picasso-barcelona-01.jpg');
    expect(guide.hero.alt).toContain('初领圣体');
  });
});
