import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { containsPoint, placeRoomLabels, planViewBounds, polygonPath, spaceForFeature, spaceForPlace, validateArchitecturalPlan, type ArchitecturalPlan } from './architectural-plan';

const plans = readdirSync('app/data/architectural-plans').filter((name) => name.endsWith('.json'))
  .map((name) => JSON.parse(readFileSync(`app/data/architectural-plans/${name}`, 'utf8')) as ArchitecturalPlan);
const configs = [...JSON.parse(readFileSync('sources/floorplans/extraction.json', 'utf8')),
  ...readdirSync('sources/floorplans/venues').filter((name) => name.endsWith('.json')).map((name) => JSON.parse(readFileSync(`sources/floorplans/venues/${name}`, 'utf8')))];

describe('source-derived architectural plans', () => {
  for (const plan of plans) {
    it(`${plan.slug}: validates every ring and binds every feature to a pinned source`, () => {
      expect(validateArchitecturalPlan(plan)).toEqual([]);
      const config = configs.find((item) => item.slug === plan.slug);
      const sourceHash = config.sha256;
      const sourcePath = `sources/floorplans/${config.file}`;
      // Raw source PDFs are kept locally, never required by the public build.
      if (existsSync(sourcePath)) expect(createHash('sha256').update(readFileSync(sourcePath)).digest('hex')).toBe(sourceHash);
      expect(sourceHash).toBe(plan.sourceDigest);
      const evidence = JSON.parse(readFileSync(`sources/floorplans/evidence/${plan.slug}.json`, 'utf8'));
      const claims = new Map(evidence.claims.map((claim: { featureId: string; sourceHash: string }) => [claim.featureId, claim.sourceHash]));
      for (const item of [...plan.floors.flatMap((f) => f.features), ...plan.places, ...plan.verticalLinks, ...(plan.spaces ?? []), ...(plan.openings ?? [])]) expect(claims.get(item.id)).toBe(sourceHash);
      expect(plan.floors.map((f) => f.id)).toEqual(config.floors.map((f: { id: string }) => f.id));
      for (const floor of config.floors) {
        const expected = [...(floor.expectedLabels ?? floor.places.map((place: { label: string }) => place.label)), ...(floor.servicePlaces ?? []).map((p: { label: string }) => p.label)];
        expect(plan.places.filter((p) => p.floorId === floor.id).map((p) => p.label).sort((a, b) => a.localeCompare(b))).toEqual([...expected].sort((a, b) => a.localeCompare(b)));
      }
    });

    it(`${plan.slug}: keeps all exact IDs, holes and collision-free labels at desktop/mobile scales`, () => {
      for (const floor of plan.floors) for (const width of [340, 980]) {
        const places = plan.places.filter((p) => p.floorId === floor.id);
        const before = JSON.stringify(places);
        const scale = width / Math.max(floor.bounds[2] - floor.bounds[0], floor.bounds[3] - floor.bounds[1]);
        const labels = placeRoomLabels(places, scale);
        expect(labels.map((p) => p.id).sort()).toEqual(places.map((p) => p.id).sort());
        expect(JSON.stringify(places)).toBe(before);
        const bounds = planViewBounds(floor, labels);
        for (const a of labels) {
          expect(a.displayAt[0] - a.width / 2).toBeGreaterThanOrEqual(bounds[0]);
          expect(a.displayAt[1] - a.height / 2).toBeGreaterThanOrEqual(bounds[1]);
          expect(a.displayAt[0] + a.width / 2).toBeLessThanOrEqual(bounds[2]);
          expect(a.displayAt[1] + a.height / 2).toBeLessThanOrEqual(bounds[3]);
          for (const b of labels) if (a.id !== b.id) {
            expect(Math.abs(a.displayAt[0] - b.displayAt[0]) >= (a.width + b.width) / 2 ||
              Math.abs(a.displayAt[1] - b.displayAt[1]) >= (a.height + b.height) / 2).toBe(true);
          }
        }
        for (const polygon of floor.features.flatMap((f) => f.polygons)) {
          expect(polygonPath(polygon).match(/M/g)?.length).toBe(polygon.holes.length + 1);
        }
      }
    });
  }

  it('rejects stale projections, broken rings and unknown stop bindings', () => {
    const plan = structuredClone(plans[0]);
    plan.floors[0].features[0].polygons[0].outer.pop();
    plan.stopBindings.push({ stopIndex: 0, placeId: 'invented-room' });
    expect(validateArchitecturalPlan(plan)).toEqual(expect.arrayContaining([
      expect.stringContaining('Open ring'), expect.stringContaining('Unknown stop target'),
    ]));
  });

  it('binds artworks and whole-room selection to the same documented space', () => {
    const plan = plans.find((p) => p.slug === 'last-supper')!;
    expect(spaceForPlace(plan,'L0-晚餐-1')?.id).toBe('L0-refectory');
    expect(spaceForPlace(plan,'L0-受难-1')?.id).toBe('L0-refectory');
    expect(spaceForPlace(plan,'L0-食堂-1')?.id).toBe('L0-refectory');
    expect(plan.openings).toHaveLength(4);
    const invalid = structuredClone(plan);
    invalid.spaces![0].placeId = 'L0-教学室-1';
    expect(validateArchitecturalPlan(invalid)).toContain('Invalid space binding: L0-refectory');
  });

  it('does not select a courtyard void as the surrounding room', () => {
    const polygon = { outer:[[0,0],[10,0],[10,10],[0,10],[0,0]], holes:[[[3,3],[7,3],[7,7],[3,7],[3,3]]] } as import('./architectural-plan').MapPolygon;
    expect(containsPoint(polygon,[1,1])).toBe(true);
    expect(containsPoint(polygon,[5,5])).toBe(false);
  });

  it('keeps connected Accademia galleries and multipart spaces without inventing room dividers', () => {
    const plan = plans.find((p) => p.slug === 'accademia-florence')!;
    expect(spaceForPlace(plan,'L0-3-1')?.id).toBe('L0-prisoners-david');
    expect(spaceForPlace(plan,'L0-4-1')?.id).toBe('L0-prisoners-david');
    expect(spaceForPlace(plan,'L1-10-1')?.id).toBe('L1-gothic-galleries');
    expect(spaceForPlace(plan,'L1-12-1')?.id).toBe('L1-gothic-galleries');
    const space = spaceForFeature(plan, 'L0-path-526-surface')!;
    expect(space.featureIds).toEqual(['L0-path-526-surface','L0-path-527-surface']);
    expect(space.polygons).toHaveLength(2);
    for (const space of plan.spaces!) expect(space.polygons).toEqual(plan.floors.find((f)=>f.id===space.floorId)!.features.filter((f)=>space.featureIds?.includes(f.id)).flatMap((f)=>f.polygons));
  });

  it('does not turn the Picasso upper-floor courtyard context into floor slabs', () => {
    const plan = plans.find((p) => p.slug === 'picasso-barcelona')!;
    const upper = plan.floors.find((f)=>f.id==='L1')!;
    expect(upper.features.some((f)=>['L1-path-37-surface','L1-path-38-surface'].includes(f.id))).toBe(false);
    expect(plan.places.filter((p)=>p.floorId==='L1')).toHaveLength(18);
    expect(spaceForPlace(plan,'L1-12-1')?.featureIds).toEqual(['L1-path-119-surface']);
  });

  it('keeps every room label inside the actual portrait viewport without overlaps', () => {
    for (const plan of plans) for (const floor of plan.floors) {
      const width = 340, height = 460;
      const scale = Math.min((width-50)/(floor.bounds[2]-floor.bounds[0]),(height-50)/(floor.bounds[3]-floor.bounds[1]));
      const origin = [(floor.bounds[0]+floor.bounds[2])/2-width/scale/2,(floor.bounds[1]+floor.bounds[3])/2-height/scale/2];
      const places = plan.places.filter((p) => p.floorId === floor.id).map((p) => ({...p,at:[(p.at[0]-origin[0])*scale,(p.at[1]-origin[1])*scale] as import('./architectural-plan').MapPoint}));
      const labels = placeRoomLabels(places,1,[width,height]);
      expect(labels.map((p)=>p.id).sort()).toEqual(places.map((p)=>p.id).sort());
      for (const a of labels) {
        expect(a.displayAt[0]-a.width/2).toBeGreaterThanOrEqual(0);
        expect(a.displayAt[1]-a.height/2).toBeGreaterThanOrEqual(0);
        expect(a.displayAt[0]+a.width/2).toBeLessThanOrEqual(width);
        expect(a.displayAt[1]+a.height/2).toBeLessThanOrEqual(height);
        for (const b of labels) if(a.id!==b.id) expect(Math.abs(a.displayAt[0]-b.displayAt[0]) >= (a.width+b.width)/2 || Math.abs(a.displayAt[1]-b.displayAt[1]) >= (a.height+b.height)/2).toBe(true);
      }
    }
  });
});
