import { describe, expect, it } from 'vitest';
import { guideCatalog } from '../guides';
import { guideContentBySlug } from './content';

describe('guide content packs', () => {
  it('provides curated field-guide content for every non-embedded attraction', () => {
    const missing = guideCatalog
      .filter((guide) => !guide.embeddedGuide)
      .filter((guide) => !guideContentBySlug[guide.slug])
      .map((guide) => guide.slug);

    expect(missing).toEqual([]);
  });

  it('meets the full chapter content contract', () => {
    for (const guide of guideCatalog) {
      if (guide.embeddedGuide) continue;
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
      /TODO|TBD|稍后补充|示例文字|文化资料将在|详细文化背景.*正在/,
    );
  });
});
