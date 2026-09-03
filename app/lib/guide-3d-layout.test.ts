import { describe, expect, it } from 'vitest';
import { guideCatalog } from '../data/guides';
import {
  buildGuideExteriorSceneLayout,
  buildGuideSceneLayout,
} from './guide-3d-layout';

const stops = ['入口', '主空间', '高处视点', '出口'];

type StackedFloorPlanScene = ReturnType<typeof buildGuideSceneLayout> & {
  mode: 'stacked-floorplan';
  floors: Array<{
    id: string;
    outline: Array<[number, number]>;
    spaces: Array<{
      id: string;
      polygon: Array<[number, number]>;
    }>;
  }>;
  nodes: Array<{
    floorId: string;
    label: string;
    position: [number, number, number];
    spaceId: string;
  }>;
  sourceManifest: Array<{
    authority: 'official' | 'authoritative';
    title: string;
    url: string;
  }>;
  verticalLinks: Array<{
    kind: 'stairs' | 'lift' | 'ramp';
    landings: Array<{ floorId: string }>;
  }>;
};

describe('buildGuideSceneLayout', () => {
  it('builds every guide from attraction massing instead of route-node blocks', () => {
    const localGuides = guideCatalog;

    expect(localGuides).toHaveLength(74);
    for (const guide of localGuides) {
      const scene = buildGuideExteriorSceneLayout({
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
    const fingerprints = guideCatalog.map((guide) => {
      const scene = buildGuideExteriorSceneLayout({
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
      (guide) => guide.spatial.type === 'floorplan',
    );

    for (const guide of interiorGuides) {
      const scene = buildGuideExteriorSceneLayout({
        slug: guide.slug,
        type: guide.spatial.type,
        stops: guide.spatial.stops,
      });
      expect(scene.modelBasis, guide.slug).toBe('documented-floorplan');
    }
  });

  it('keeps the same attraction deterministic while changing another attraction', () => {
    const first = buildGuideExteriorSceneLayout({
      slug: 'pantheon',
      type: 'site',
      stops,
    });
    const repeat = buildGuideExteriorSceneLayout({
      slug: 'pantheon',
      type: 'site',
      stops,
    });
    const other = buildGuideExteriorSceneLayout({
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
    const scene = buildGuideExteriorSceneLayout({
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

  it.each([
    ['uffizi', 2],
    ['doges-palace', 3],
    ['casa-batllo', 5],
    ['sagrada-familia', 3],
    ['cologne-cathedral', 3],
  ])(
    'builds a documented stacked interior for %s',
    (slug, minimumFloorCount) => {
      const guide = guideCatalog.find((item) => item.slug === slug)!;
      const scene = buildGuideSceneLayout({
        slug: guide.slug,
        type: guide.spatial.type,
        stops: guide.spatial.stops,
      }) as StackedFloorPlanScene;

      expect(scene.mode, slug).toBe('stacked-floorplan');
      expect(scene.floors.length, slug).toBeGreaterThanOrEqual(
        minimumFloorCount,
      );
      expect(scene.sourceManifest.length, slug).toBeGreaterThan(0);
      expect(
        scene.sourceManifest.every(
          (source) =>
            source.url.startsWith('https://') &&
            ['official', 'authoritative'].includes(source.authority),
        ),
        slug,
      ).toBe(true);
      expect(scene.verticalLinks.length, slug).toBeGreaterThan(0);

      const floorIds = new Set(scene.floors.map((floor) => floor.id));
      const spaceIds = new Set(
        scene.floors.flatMap((floor) =>
          floor.spaces.map((space) => `${floor.id}:${space.id}`),
        ),
      );
      expect(
        scene.floors.every(
          (floor) =>
            floor.outline.length >= 4 &&
            floor.spaces.length > 0 &&
            floor.spaces.every((space) => space.polygon.length >= 4),
        ),
        slug,
      ).toBe(true);
      expect(
        scene.nodes.every(
          (node) =>
            floorIds.has(node.floorId) &&
            spaceIds.has(`${node.floorId}:${node.spaceId}`),
        ),
        slug,
      ).toBe(true);
      expect(
        scene.verticalLinks.every((link) =>
          link.landings.every((landing) => floorIds.has(landing.floorId)),
        ),
        slug,
      ).toBe(true);
    },
  );

  it('keeps interior and exterior scene contracts separate', () => {
    const guide = guideCatalog.find((item) => item.slug === 'casa-batllo')!;
    const interior = buildGuideSceneLayout({
      slug: guide.slug,
      type: guide.spatial.type,
      stops: guide.spatial.stops,
    });
    const exterior = buildGuideExteriorSceneLayout({
      slug: guide.slug,
      type: guide.spatial.type,
      stops: guide.spatial.stops,
    });

    expect(interior.mode).toBe('stacked-floorplan');
    expect('parts' in interior).toBe(false);
    expect(exterior.mode).toBe('exterior3d');
    expect('floors' in exterior).toBe(false);
  });
});
