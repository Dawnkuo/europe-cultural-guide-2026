import { describe, expect, it } from 'vitest';
import { guideCatalog } from '../data/guides';
import {
  compileFloorPlanRoute,
  guideFloorPlanInventory,
  guideFloorPlans,
  getGuideFloorPlan,
  normalizeFloorPlanPoint,
  splitWallAtOpenings,
  validateFloorPlan,
  type StackedFloorPlan,
} from './guide-floorplans';

const pilotSlugs = [
  'uffizi',
  'doges-palace',
  'casa-batllo',
  'sagrada-familia',
  'cologne-cathedral',
];

describe('documented stacked floor plans', () => {
  it.each(pilotSlugs)('validates %s geometry and route bindings', (slug) => {
    const floorPlan = getGuideFloorPlan(slug);

    expect(floorPlan).toBeDefined();
    expect(validateFloorPlan(floorPlan!), slug).toEqual([]);
    expect(
      new Set(floorPlan!.floors.map((floor) => floor.stackOrder)).size,
    ).toBe(floorPlan!.floors.length);
  });

  it.each(['vatican-museums', 'st-peters-basilica'])(
    'uses an authoritative native stacked plan for %s',
    (slug) => {
      const floorPlan = getGuideFloorPlan(slug);

      expect(floorPlan).toBeDefined();
      expect(validateFloorPlan(floorPlan!), slug).toEqual([]);
      expect(floorPlan!.floors.length).toBeGreaterThanOrEqual(3);
      expect(
        new Set(floorPlan!.sourceManifest.flatMap((source) => source.scope)),
      ).toEqual(new Set(['footprint', 'levels', 'route', 'spaces']));
    },
  );

  it('validates every registered plan and preserves every existing route stop', () => {
    const validationIssues = Object.entries(guideFloorPlans).flatMap(
      ([slug, floorPlan]) =>
        validateFloorPlan(floorPlan).map((issue) => `${slug}: ${issue}`),
    );
    expect(validationIssues).toEqual([]);

    for (const [slug, floorPlan] of Object.entries(guideFloorPlans)) {
      const guide = guideCatalog.find((item) => item.slug === slug);

      expect(guide, slug).toBeDefined();
      expect(floorPlan.routeStops, slug).toHaveLength(
        guide!.spatial.stops.length,
      );
      expect(() => compileFloorPlanRoute(floorPlan), slug).not.toThrow();
      expect(guideFloorPlanInventory[slug]?.status, slug).toBe('ready');
    }
  });

  it('keeps ready and source-limited inventory states explicit and consistent', () => {
    for (const [slug, entry] of Object.entries(guideFloorPlanInventory)) {
      expect(entry.sources.length, slug).toBeGreaterThan(0);
      if (entry.status === 'ready') {
        expect(guideFloorPlans[slug], slug).toBeDefined();
      } else {
        expect(guideFloorPlans[slug], slug).toBeUndefined();
      }
    }
  });

  it('classifies every local floorplan guide instead of using a generic interior', () => {
    const unclassified = guideCatalog
      .filter((guide) => guide.spatial.type === 'floorplan')
      .filter((guide) => !guideFloorPlanInventory[guide.slug])
      .map((guide) => guide.slug);

    expect(unclassified).toEqual([]);
  });

  it('reports open, self-intersecting, and disconnected plan data', () => {
    const invalidPlan: StackedFloorPlan = {
      mode: 'stacked-floorplan',
      floors: [
        {
          id: 'ground',
          label: 'Ground',
          elevation: 0,
          stackOrder: 0,
          outline: [
            [0, 0],
            [2, 2],
            [0, 2],
            [2, 0],
          ],
          spaces: [
            {
              id: 'room',
              label: 'Room',
              polygon: [
                [0, 0],
                [1, 0],
                [1, 1],
                [0, 1],
              ],
            },
          ],
        },
      ],
      openings: [
        {
          floorId: 'missing',
          kind: 'door',
          position: [0, 0],
          connects: ['room'],
        },
      ],
      routeStops: [
        {
          floorId: 'ground',
          spaceId: 'missing-room',
          position: [3, 3],
        },
      ],
      sourceManifest: [],
      verticalLinks: [
        {
          id: 'bad-link',
          kind: 'stairs',
          label: 'Bad link',
          landings: [
            { floorId: 'ground', position: [0, 0] },
            { floorId: 'missing', position: [0, 0] },
          ],
        },
      ],
    };

    expect(validateFloorPlan(invalidPlan)).toEqual(
      expect.arrayContaining([
        'sourceManifest must contain an authoritative source',
        'floor ground outline must be closed',
        'floor ground outline must not self-intersect',
        'floor ground space room polygon must be closed',
        'opening references unknown floor missing',
        'route stop 0 references unknown space ground:missing-room',
        'vertical link bad-link references unknown floor missing',
      ]),
    );
  });

  it('routes floor changes through documented connector landings', () => {
    const floorPlan = getGuideFloorPlan('sagrada-familia')!;
    const route = compileFloorPlanRoute(floorPlan);
    const towerLeg = route.legs[2];

    expect(towerLeg.sections).toEqual([
      {
        floorId: 'basilica',
        kind: 'floor',
        points: [
          [0, -1],
          [-6.3, -1.6],
        ],
      },
      {
        connectorId: 'passion-lift',
        fromFloorId: 'basilica',
        kind: 'transition',
        toFloorId: 'tower',
      },
      {
        floorId: 'tower',
        kind: 'floor',
        points: [
          [-6.3, -1.6],
          [-5.5, -0.2],
        ],
      },
    ]);
  });

  it('cuts documented door openings into wall segments', () => {
    expect(splitWallAtOpenings([0, 0], [10, 0], [[5, 0]], 1)).toEqual([
      [
        [0, 0],
        [4.5, 0],
      ],
      [
        [5.5, 0],
        [10, 0],
      ],
    ]);
  });

  it('normalizes large authoritative plans into the shared camera frame', () => {
    const floorPlan = getGuideFloorPlan('vatican-museums')!;
    const normalized = floorPlan.floors.flatMap((floor) =>
      floor.outline.map((point) =>
        normalizeFloorPlanPoint(floorPlan.floors, point),
      ),
    );

    expect(
      Math.max(...normalized.flatMap(([x, z]) => [Math.abs(x), Math.abs(z)])),
    ).toBeLessThanOrEqual(6.01);
    expect(
      new Set(normalized.map((point) => point.join(','))).size,
    ).toBeGreaterThan(12);
  });

  it('rejects degenerate geometry and spaces outside their floor footprint', () => {
    const malformed: StackedFloorPlan = {
      mode: 'stacked-floorplan',
      floors: [
        {
          id: 'ground',
          label: 'Ground',
          elevation: 0,
          stackOrder: 0,
          outline: [
            [0, 0],
            [4, 0],
            [4, 4],
            [0, 4],
            [0, 0],
          ],
          spaces: [
            {
              id: 'flat',
              label: 'Flat',
              polygon: [
                [1, 1],
                [2, 1],
                [3, 1],
                [1, 1],
              ],
            },
            {
              id: 'outside',
              label: 'Outside',
              polygon: [
                [5, 5],
                [6, 5],
                [6, 6],
                [5, 6],
                [5, 5],
              ],
            },
          ],
        },
      ],
      openings: [],
      routeStops: [],
      sourceManifest: [
        {
          authority: 'official',
          scope: ['footprint'],
          title: 'Plan',
          url: 'https://example.com/plan.pdf',
          verifiedAt: '2026-09-03',
        },
      ],
      verticalLinks: [],
    };

    expect(validateFloorPlan(malformed)).toEqual(
      expect.arrayContaining([
        'floor ground space flat polygon must have nonzero area',
        'floor ground space outside must be inside the floor outline',
      ]),
    );
  });

  it('never substitutes elevation zero for an unknown route floor', () => {
    const floorPlan = getGuideFloorPlan('uffizi')!;
    const brokenPlan: StackedFloorPlan = {
      ...floorPlan,
      routeStops: [
        ...floorPlan.routeStops.slice(0, -1),
        {
          floorId: 'missing',
          spaceId: 'd19',
          position: [5.8, -2.8],
        },
      ],
    };

    expect(() => compileFloorPlanRoute(brokenPlan)).toThrow(
      'route references unknown floor missing',
    );
  });
});
