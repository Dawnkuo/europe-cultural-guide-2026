import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { guideCatalog } from './guides';
import { photoPolicies } from './photo-policies';
import {
  photoCities,
  photoSpotMapUrl,
  photoSpotMedia,
  photoSpots,
} from './photo-spots';

describe('photographic viewpoints', () => {
  it('covers eight itinerary cities without duplicate or dangling guide records', () => {
    expect(photoCities).toHaveLength(8);
    expect(photoSpots.length).toBeGreaterThanOrEqual(95);
    for (const guide of guideCatalog)
      expect(
        photoSpots.some((spot) => spot.guideSlugs.includes(guide.slug)),
        `Missing ${guide.slug}`,
      ).toBe(true);
    expect(new Set(photoSpots.map((spot) => spot.id)).size).toBe(
      photoSpots.length,
    );
    for (const spot of photoSpots) {
      for (const slug of spot.guideSlugs) {
        const guide = guideCatalog.find((guide) => guide.slug === slug);
        expect(guide, `${spot.id}: ${slug}`).toBeDefined();
        expect(
          ['罗马', '梵蒂冈'].includes(guide!.city)
            ? '罗马与梵蒂冈'
            : guide!.city,
        ).toBe(spot.city);
      }
      expect(spot.shotDate).toMatch(/^(\d{4}-\d{2}-\d{2}|日期未注明)$/);
      for (const field of [
        'position',
        'direction',
        'composition',
        'advice',
        'access',
        'referenceNote',
        'alt',
      ] as const)
        expect(spot[field].trim()).not.toBe('');
    }
  });
  it('keeps every attributed reference photo local, intact and linked to its source metadata', () => {
    for (const spot of photoSpots) {
      const photo = photoSpotMedia[spot.id];
      const bytes = readFileSync(`public${photo.src}`);
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(
        photo.sha256,
      );
      expect(Math.max(photo.width, photo.height)).toBeGreaterThanOrEqual(1000);
      expect(Math.min(photo.width, photo.height)).toBeGreaterThan(250);
      expect(photo.author.length).toBeGreaterThan(2);
      expect(photo.sourceUrl).toMatch(
        /^https:\/\/commons.wikimedia.org\/wiki\/File:/,
      );
      expect(photo.licenseUrl).toMatch(/^https?:\/\/creativecommons.org\//);
      expect(
        JSON.parse(
          readFileSync(
            existsSync(`sources/photography/expanded/${spot.id}.json`)
              ? `sources/photography/expanded/${spot.id}.json`
              : `sources/photography/${spot.id}.json`,
            'utf8',
          ),
        ).page.imageinfo[0].descriptionurl,
      ).toBe(photo.sourceUrl);
    }
  });
  it('uses source camera coordinates only when present, otherwise searches for a named area', () => {
    for (const spot of photoSpots) {
      const photo = photoSpotMedia[spot.id];
      const url = new URL(photoSpotMapUrl(spot));
      expect(url.searchParams.get('query')).toBe(
        spot.kind !== 'indoor' &&
          spot.id !== 'milan-galleria' &&
          photo.latitude !== null &&
          photo.longitude !== null
          ? `${photo.latitude},${photo.longitude}`
          : spot.mapQuery,
      );
    }
  });
  it('keeps indoor room, permission and source coverage explicit', () => {
    const indoor = photoSpots.filter((spot) => spot.kind === 'indoor');
    expect(indoor.length).toBeGreaterThanOrEqual(40);
    for (const spot of indoor) {
      expect(spot.room?.length).toBeGreaterThan(2);
      expect(new URL(photoSpotMapUrl(spot)).searchParams.get('query')).toBe(
        spot.mapQuery,
      );
    }
    for (const spot of photoSpots)
      if (spot.policyKey) expect(photoPolicies[spot.policyKey]).toBeDefined();
    expect(photoSpots.some((spot) => /西斯廷/.test(spot.title))).toBe(false);
    expect(
      photoSpots.find((spot) => spot.id === 'picasso-gallery-new')?.kind,
    ).toBe('outdoor');
    expect(photoSpots.find((spot) => spot.id === 'vasari-new')?.kind).toBe(
      'outdoor',
    );
    expect(new Set(photoSpots.map((spot) => spot.id)).size).toBe(
      Object.keys(photoSpotMedia).length,
    );
  });
});
