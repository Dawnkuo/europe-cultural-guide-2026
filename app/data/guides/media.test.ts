import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { guideCatalog } from '../guides';
import { guideMediaBySlug } from '../guide-media.generated';
import dimensions from '../media-dimensions.generated.json';

describe('guide highlight media', () => {
  it('keeps dedicated hero photographs identical to their reviewed originals', () => {
    const records: { path: string; sha256: string }[] = JSON.parse(
      readFileSync('sources/media/hero-selections.json', 'utf8'),
    );
    for (const record of records) {
      expect(createHash('sha256').update(readFileSync(`public${record.path}`)).digest('hex')).toBe(record.sha256);
    }
  });

  it('uses a wide Sagrada Familia cover without changing its detail images or other covers', () => {
    const sagrada = guideCatalog.find((g) => g.slug === 'sagrada-familia')!;
    expect(sagrada.hero.src).toBe('/images/heroes/sagrada-familia-nave.jpg');
    expect(sagrada.hero.alt).toContain('中殿全景');
    expect(sagrada.highlights[0].image).toBe('/images/guides/sagrada-familia-01.jpg');
    for (const guide of guideCatalog.filter((g) => g.slug !== 'sagrada-familia')) {
      const media = guideMediaBySlug[guide.slug];
      if (media) expect(guide.hero.src, guide.slug).toBe(media[0].image);
    }
  });

  it('has decoded dimensions for every guide hero and highlight', () => {
    const sizes: Record<string, { width: number; height: number }> = dimensions;
    for (const guide of guideCatalog) {
      for (const src of [
        guide.hero.src,
        ...guide.highlights.flatMap((h) => (h.image ? [h.image] : [])),
      ]) {
        expect(sizes[src], `${guide.slug}: ${src}`).toBeDefined();
        expect(sizes[src].width).toBeGreaterThan(0);
        expect(sizes[src].height).toBeGreaterThan(0);
        expect(
          Math.max(sizes[src].width, sizes[src].height),
          `${guide.slug}: thumbnail used for primary media: ${src}`,
        ).toBeGreaterThanOrEqual(640);
      }
    }
  });

  it('keeps Scala museum images in the same order as the merged highlights', () => {
    const guide = guideCatalog.find((g) => g.slug === 'la-scala')!;
    expect(guide.highlights).toHaveLength(6);
    expect(guide.highlights[0].image).toContain('la-scala-museum-01');
    expect(guide.highlights[1].image).toContain('la-scala-museum-02');
    expect(guide.highlights[2].image).toContain('la-scala-museum-03');
    expect(guide.highlights[2].title).toBe('《纳布科》演出海报');
    expect(guide.highlights[2].summary).toContain('并非3月9日的首演单');
    expect(guide.highlights[3].image).toContain('la-scala-evening-01');
    expect(guide.highlights[4].image).toContain('la-scala-evening-02');
    expect(guide.highlights[5].image).toContain('la-scala-evening-03');
  });

  it('does not reintroduce rejected lightwell, shrine, facade or Vatican thumbnails', () => {
    const used = guideCatalog.flatMap((g) => [
      g.hero.src,
      ...g.highlights.map((h) => h.image),
    ]);
    for (const src of [
      '/images/guides/casa-batllo-02.jpg',
      '/images/guides/casa-batllo-03.jpg',
      '/images/guides/cologne-cathedral-01.jpg',
      '/images/guides/pisa-cathedral-01.jpg',
    ])
      expect(used).not.toContain(src);
    const sizes: Record<string, { width: number; height: number }> = dimensions;
    for (const guide of guideCatalog.filter((g) =>
      ['st-peters-basilica', 'vatican-museums'].includes(g.slug),
    )) {
      for (const h of guide.highlights) {
        const size = sizes[h.image!];
        expect(
          Math.max(size.width, size.height),
          h.title,
        ).toBeGreaterThanOrEqual(600);
      }
    }
  });

  it('keeps reviewed files identical to their inspected acquisition records', () => {
    const records: { path: string; sha256: string; page: string }[] =
      JSON.parse(
        readFileSync('sources/media/replacements-applied.json', 'utf8'),
      );
    expect(records.length).toBeGreaterThanOrEqual(50);
    for (const record of records) {
      expect(record.page).toMatch(/^https:\/\//);
      expect(
        createHash('sha256')
          .update(readFileSync(`public${record.path}`))
          .digest('hex'),
      ).toBe(record.sha256);
    }
  });

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

    expect(missing).toEqual([
      'milan-duomo: 特里武尔齐奥烛台',
      'pitti: 《沉睡的丘比特》',
    ]);
    expect(
      guideCatalog
        .find((g) => g.slug === 'pitti')!
        .highlights.find((h) => h.id === 'pitti-sleeping-cupid')!.displayNote,
    ).toContain('暂缺符合清晰度要求的已核验配图');
  });

  it('uses attraction-specific media instead of a generic city hero', () => {
    const guide = guideCatalog.find(
      (item) => item.slug === 'picasso-barcelona',
    )!;

    expect(guide.hero.src).toBe('/images/guides/picasso-barcelona-01.jpg');
    expect(guide.hero.alt).toContain('初领圣体');
  });
});
