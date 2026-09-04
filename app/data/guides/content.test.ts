import { describe, expect, it } from 'vitest';
import { guideCatalog } from '../guides';
import { guideContentBySlug } from './content';

describe('guide content packs', () => {
  it('provides curated field-guide content for every attraction', () => {
    const missing = guideCatalog
      .filter((guide) => !guideContentBySlug[guide.slug])
      .map((guide) => guide.slug);

    expect(missing).toEqual([]);
  });

  it('meets the full chapter content contract', () => {
    for (const guide of guideCatalog) {
      const content = guideContentBySlug[guide.slug];

      expect(content.overview.length, guide.slug).toBeGreaterThan(80);
      expect(content.orientation.length, guide.slug).toBeGreaterThanOrEqual(3);
      expect(content.spatial.stops.length, guide.slug).toBeGreaterThanOrEqual(
        3,
      );
      expect(content.highlights.length, guide.slug).toBeGreaterThanOrEqual(3);
      expect(content.sequence.length, guide.slug).toBeGreaterThanOrEqual(3);
      expect(content.practical.length, guide.slug).toBeGreaterThanOrEqual(2);
      expect(content.sources.length, guide.slug).toBeGreaterThanOrEqual(1);
    }
  });

  it('does not publish placeholder copy as curated content', () => {
    expect(JSON.stringify(guideContentBySlug)).not.toMatch(
      /TODO|TBD|稍后补充|示例文字|文化资料将在|详细文化背景.*正在|先建立判断框架/,
    );
  });

  it('provides a distinct authored overview heading for every attraction', () => {
    const titles = guideCatalog.map((guide) => {
      const content = guideContentBySlug[guide.slug];
      expect(content.overviewTitle.trim(), guide.slug).not.toBe('');
      expect(content.overviewTitle, guide.slug).not.toBe(`${guide.title}概览`);
      expect(guide.overviewTitle, guide.slug).toBe(content.overviewTitle);
      return content.overviewTitle;
    });
    expect(new Set(titles).size).toBe(guideCatalog.length);
    expect(new Set(guideCatalog.map((guide) => guide.overview)).size).toBe(
      guideCatalog.length,
    );
  });
});
