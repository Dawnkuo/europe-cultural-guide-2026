import { describe, expect, it } from 'vitest';
import { guideCatalog } from '../data/guides';
import { buildGuideSceneLayout } from './guide-3d-layout';

const stops = ['入口', '主空间', '高处视点', '出口'];

describe('buildGuideSceneLayout', () => {
  it('builds every guide from attraction massing instead of route-node blocks', () => {
    const localGuides = guideCatalog.filter((guide) => !guide.embeddedGuide);

    expect(localGuides).toHaveLength(72);
    for (const guide of localGuides) {
      const scene = buildGuideSceneLayout({
        slug: guide.slug,
        type: guide.spatial.type,
        stops: guide.spatial.stops,
      });

      expect(scene.profile, guide.slug).not.toBe(guide.spatial.type);
      expect(scene.modelBasis, guide.slug).toMatch(
        /landmark-massing|documented-floorplan|urban-topography/,
      );
      expect(scene.parts.length, guide.slug).toBeGreaterThanOrEqual(5);
      expect(
        scene.nodes.map((node) => node.label),
        guide.slug,
      ).toEqual(guide.spatial.stops);
      expect(
        new Set(scene.nodes.map((node) => node.position.join(','))).size,
        guide.slug,
      ).toBe(guide.spatial.stops.length);
    }
  });

  it('gives every attraction a unique geometry fingerprint', () => {
    const fingerprints = guideCatalog
      .filter((guide) => !guide.embeddedGuide)
      .map((guide) => {
        const scene = buildGuideSceneLayout({
          slug: guide.slug,
          type: guide.spatial.type,
          stops: guide.spatial.stops,
        });
        const fingerprint = JSON.stringify({
          environment: scene.environment,
          camera: scene.camera,
          parts: scene.parts.map((part) => ({
            kind: part.kind,
            position: part.position,
            rotation: part.rotation,
            scale: part.scale,
          })),
        });
        return [guide.slug, fingerprint] as const;
      });

    const duplicateGroups = Object.entries(
      Object.groupBy(fingerprints, ([, fingerprint]) => fingerprint),
    )
      .map(([, entries]) => entries?.map(([slug]) => slug) ?? [])
      .filter((slugs) => slugs.length > 1);

    expect(duplicateGroups).toEqual([]);
  });

  it('uses documented floor-plan topology for every interior guide', () => {
    const interiorGuides = guideCatalog.filter(
      (guide) => !guide.embeddedGuide && guide.spatial.type === 'floorplan',
    );

    for (const guide of interiorGuides) {
      const scene = buildGuideSceneLayout({
        slug: guide.slug,
        type: guide.spatial.type,
        stops: guide.spatial.stops,
      });
      expect(scene.modelBasis, guide.slug).toBe('documented-floorplan');
    }
  });

  it('keeps the same attraction deterministic while changing another attraction', () => {
    const first = buildGuideSceneLayout({
      slug: 'pantheon',
      type: 'site',
      stops,
    });
    const repeat = buildGuideSceneLayout({
      slug: 'pantheon',
      type: 'site',
      stops,
    });
    const other = buildGuideSceneLayout({
      slug: 'colosseum',
      type: 'site',
      stops,
    });

    expect(repeat).toEqual(first);
    expect(other).not.toEqual(first);
  });

  it.each([
    ['pantheon', ['dome', 'column', 'portico']],
    ['colosseum', ['elliptical-ring', 'arena']],
    ['leaning-tower', ['leaning-drum', 'belfry']],
    ['grand-canal', ['water', 'palazzo']],
    ['hohenzollern', ['bridge-arch', 'rail-truss']],
    ['sagrada-familia', ['spire', 'nave']],
    ['cologne-cathedral', ['gothic-spire', 'buttress']],
  ])('includes recognizable real-world parts for %s', (slug, partKinds) => {
    const guide = guideCatalog.find((item) => item.slug === slug)!;
    const scene = buildGuideSceneLayout({
      slug: guide.slug,
      type: guide.spatial.type,
      stops: guide.spatial.stops,
    });

    for (const kind of partKinds) {
      expect(
        scene.parts.some((part) => part.kind === kind),
        `${slug} is missing ${kind}`,
      ).toBe(true);
    }
  });
});
