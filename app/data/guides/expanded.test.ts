import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { guideCatalog } from '../guides';
import { collectionExpansion } from './expanded';
import metadata from './collection-metadata.generated.json';
import { guideContentBySlug } from './content';

describe('venue-scale collection coverage', () => {
  it('does not truncate large institutions to a fixed three-item template', () => {
    const minimums = {
      uffizi: 21,
      'vatican-museums': 26,
      borghese: 18,
      brera: 11,
      pitti: 9,
      'doges-palace': 9,
      'accademia-venice': 10,
      'st-peters-basilica': 14,
      'casa-batllo': 8,
      'st-mark-basilica': 8,
      'cologne-cathedral': 8,
    };
    for (const [slug, minimum] of Object.entries(minimums)) {
      expect(
        guideCatalog.find((g) => g.slug === slug)!.highlights.length,
        slug,
      ).toBeGreaterThanOrEqual(minimum);
    }
    expect(Object.keys(collectionExpansion).length).toBeGreaterThanOrEqual(30);
    expect(Object.values(collectionExpansion).flat()).toHaveLength(168);
  });

  it('renders every authored addition with unique identity, factual evidence and three substantive reading layers', () => {
    const ids = new Set<string>();
    for (const [slug, additions] of Object.entries(collectionExpansion)) {
      const guide = guideCatalog.find((g) => g.slug === slug)!;
      expect(guide, slug).toBeDefined();
      for (const item of additions) {
        expect(ids.has(item.id), item.id).toBe(false);
        ids.add(item.id);
        const output = guide.highlights.find((h) => h.id === item.id)!;
        expect(output, item.id).toBeDefined();
        expect(output.summary.length, item.id).toBeGreaterThan(35);
        expect(output.whyItMatters!.length, item.id).toBeGreaterThan(30);
        expect(output.lookFor.length, item.id).toBeGreaterThan(30);
        expect(output.originalTitle, item.id).toBeTruthy();
        expect(output.sourceIds?.length, item.id).toBeGreaterThan(0);
        for (const url of output.sourceIds!)
          expect(url).toMatch(/^https?:\/\//);
      }
    }
  });

  it('does not change chapter routes, timings or spatial data when expanding the collection', () => {
    for (const guide of guideCatalog) {
      expect(guide.sequence).toEqual(guideContentBySlug[guide.slug].sequence);
      expect(guide.spatial).toEqual(guideContentBySlug[guide.slug].spatial);
    }
  });

  it('splits composite works and preserves real location / display distinctions', () => {
    const borghese = guideCatalog.find((g) => g.slug === 'borghese')!;
    expect(borghese.highlights.some((h) => h.title === '卡拉瓦乔作品群')).toBe(
      false,
    );
    expect(
      borghese.highlights.filter((h) => h.category === '卡拉瓦乔'),
    ).toHaveLength(6);
    const uffizi = guideCatalog.find((g) => g.slug === 'uffizi')!;
    expect(uffizi.highlights.filter((h) => h.title === '《春》')).toHaveLength(
      1,
    );
    expect(
      uffizi.highlights.filter((h) => h.title === '《维纳斯的诞生》'),
    ).toHaveLength(1);
    const brera = guideCatalog.find((g) => g.slug === 'brera')!;
    expect(
      brera.highlights.find((h) => h.id === 'brera-riot')!.displayNote,
    ).toContain('Palazzo Citterio');
    expect(
      borghese.highlights.find((h) => h.id === 'borghese-melissa')!.displayNote,
    ).toContain('库藏');
    const picasso = guideCatalog.find((g) => g.slug === 'picasso-barcelona')!;
    expect(
      picasso.highlights.filter((h) => /等待|玛戈/.test(h.title)),
    ).toHaveLength(1);
    expect(
      guideCatalog
        .find((g) => g.slug === 'accademia-venice')!
        .highlights.find((h) => h.id === 'venice-vitruvian')!.displayNote,
    ).toContain('通常不作常设展出');
  });

  it('ships inspected, bounded local derivatives and never uses a rejected monochrome substitute', () => {
    const installed: {
      id: keyof typeof metadata;
      image: string;
      sha256: string;
      width: number;
      height: number;
    }[] = JSON.parse(
      readFileSync('sources/collections/installed.json', 'utf8'),
    );
    expect(installed).toHaveLength(166);
    for (const item of installed) {
      expect(
        createHash('sha256')
          .update(readFileSync(`public${item.image}`))
          .digest('hex'),
      ).toBe(item.sha256);
      expect(Math.max(item.width, item.height)).toBeGreaterThanOrEqual(800);
      expect(Math.max(item.width, item.height)).toBeLessThanOrEqual(1800);
    }
    expect(metadata['pitti-sleeping-cupid']).not.toHaveProperty('image');
  });
});
