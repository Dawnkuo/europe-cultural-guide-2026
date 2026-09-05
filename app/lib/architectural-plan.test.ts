import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { containsPoint, independentFloorScale, placeRoomLabels, placeSceneLabels, placesForStop, planViewBounds, polygonPath, serviceMarkerKind, spaceAtPoint, spaceForFeature, spaceForPlace, validateArchitecturalPlan, type ArchitecturalPlan } from './architectural-plan';

const plans = readdirSync('app/data/architectural-plans').filter((name) => name.endsWith('.json'))
  .map((name) => JSON.parse(readFileSync(`app/data/architectural-plans/${name}`, 'utf8')) as ArchitecturalPlan);
const configs = [...JSON.parse(readFileSync('sources/floorplans/extraction.json', 'utf8')),
  ...readdirSync('sources/floorplans/venues').filter((name) => name.endsWith('.json')).map((name) => JSON.parse(readFileSync(`sources/floorplans/venues/${name}`, 'utf8')))];

describe('source-derived architectural plans', () => {
  it('keeps scene labels near their anchors without turning a dense plan into a label grid', () => {
    const source = plans.find((p) => p.slug === 'st-peters-basilica')!.places.filter((p) => p.floorId === 'basilica');
    const points = source.map((p) => ({ ...p, at: [130 + p.at[0] * .15, 150 + p.at[1] * .15] as [number, number] }));
    const before = JSON.stringify(points);
    const labels = placeSceneLabels(points, [350, 460], 'basilica-52-1');
    expect(labels[0].id).toBe('basilica-52-1');
    expect(labels.length).toBeLessThan(points.length);
    expect(JSON.stringify(points)).toBe(before);
    for (const label of labels) expect(Math.hypot(label.displayAt[0]-label.at[0], label.displayAt[1]-label.at[1])).toBeLessThanOrEqual(28.00001);
    expect(placeRoomLabels(points, 1, [350, 460])).toHaveLength(source.length);
  });

  it('selects source-only room faces ahead of overlapping collection groups', () => {
    const plan = plans.find((p) => p.slug === 'picasso-barcelona')!;
    for (const label of ['1', '3', '8', '12', '16']) {
      const place = plan.places.find((p) => p.id === `L1-${label}-1`)!;
      const room = spaceAtPoint(plan, 'L1', place.at);
      expect(room?.scope).toBe('room');
      expect(room).toBe(spaceForPlace(plan, place.id));
    }
    expect(spaceAtPoint(plan, 'L1', [-100, -100])).toBeUndefined();
  });
  it('rejects unnamed, unknown and duplicate cross-floor connections', () => {
    const plan = plans.find((p) => p.verticalLinks.length)!;
    const link = plan.verticalLinks[0];
    expect(validateArchitecturalPlan({ ...plan, verticalLinks: [{ ...link, label: '' }] })).toContain(`Invalid vertical link type/label: ${link.id}`);
    expect(validateArchitecturalPlan({ ...plan, verticalLinks: [{ ...link, kind: 'stair' as 'stairs' }] })).toContain(`Invalid vertical link type/label: ${link.id}`);
    expect(validateArchitecturalPlan({ ...plan, verticalLinks: [link, link] })).toContain(`Duplicate vertical link: ${link.id}`);
  });
  it('does not treat PDF print units as cross-floor measurements', () => {
    const floor = plans[0].floors[0];
    const resized = { ...floor, bounds: floor.bounds.map((n) => n * 3) as typeof floor.bounds };
    expect(independentFloorScale(resized)).toBeCloseTo(independentFloorScale(floor) / 3);
    const width = floor.bounds[2] - floor.bounds[0];
    const height = floor.bounds[3] - floor.bounds[1];
    expect(width * independentFloorScale(floor) / (height * independentFloorScale(floor))).toBeCloseTo(width / height);
  });
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
      const sourceHashes: Record<string, string> = { primary: sourceHash, ...Object.fromEntries((config.sourceFiles ?? []).map((s: { id: string; sha256: string }) => [s.id, s.sha256])) };
      for (const source of config.sourceFiles ?? []) {
        const path = `sources/floorplans/${source.file}`;
        if (existsSync(path)) expect(createHash('sha256').update(readFileSync(path)).digest('hex')).toBe(source.sha256);
        expect(plan.sourceDigests?.[source.id]).toBe(source.sha256);
        expect(evidence.sources.find((s: { id: string }) => s.id === source.id)?.sha256).toBe(source.sha256);
      }
      for (const floor of plan.floors) {
        const expectedSource = sourceHashes[floor.sourceId ?? 'primary'];
        for (const item of [...floor.features, ...plan.places.filter((p) => p.floorId === floor.id), ...(plan.spaces ?? []).filter((p) => p.floorId === floor.id), ...(plan.openings ?? []).filter((p) => p.floorId === floor.id)]) expect(claims.get(item.id)).toBe(expectedSource);
      }
      for (const link of plan.verticalLinks) expect(claims.get(link.id)).toBe(sourceHash);
      expect(plan.floors.map((f) => f.id)).toEqual(config.floors.map((f: { id: string }) => f.id));
      for (const floor of config.floors) {
        const aliases: Record<string, string> = Object.fromEntries([...(floor.places ?? []), ...(floor.servicePlaces ?? [])].filter((p) => p.displayLabel).map((p) => [p.label, p.displayLabel]));
        const expected = [...(floor.expectedLabels ?? floor.places.map((place: { label: string }) => place.label)), ...(floor.servicePlaces ?? []).map((p: { label: string }) => p.label)].map((label) => aliases[label] ?? label);
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

  it('rejects unrecognized service kinds rather than silently misclassifying labels', () => {
    const plan = structuredClone(plans[0]);
    Object.assign(plan.places[0], { kind: 'entrance' });
    expect(validateArchitecturalPlan(plan)).toContain(`Invalid place kind: ${plan.places[0].id}`);
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

  it('locates Ludwig floor themes on the published grey areas, not page whitespace', () => {
    const plan = plans.find((p) => p.slug === 'museum-ludwig')!;
    expect(plan.spaces).toHaveLength(3);
    for (const id of ['basement-地下层当代艺术展区-1', 'first-一层藏品主题区-1', 'second-二层藏品主题区-1']) {
      expect(spaceForPlace(plan, id)?.scope).toBe('collection');
      expect(spaceForPlace(plan, id)?.featureIds).toEqual([]);
    }
    expect(spaceForPlace(plan, 'first-一层藏品主题区-1')!.polygons.some((p) => containsPoint(p, [696-595, 272-110]))).toBe(false);
    expect(spaceForPlace(plan, 'second-二层藏品主题区-1')!.polygons.some((p) => containsPoint(p, [918-830, 260-125]))).toBe(false);
  });

  it('keeps St Peter source repeats and unlocated entries without guessed map coordinates', () => {
    const plan = plans.find((p) => p.slug === 'st-peters-basilica')!;
    expect(plan.places).toHaveLength(156);
    expect(plan.places.filter((p) => p.floorId === 'basilica' && p.label === '79')).toHaveLength(4);
    expect(plan.places.some((p) => p.id === 'basilica-82-1')).toBe(false);
    expect(plan.unlocatedPlaces?.map((p) => p.label)).toEqual(['82']);
    expect(plan.spaces).toHaveLength(28);
    for (const id of ['basilica-1-1', 'basilica-5-1', 'basilica-6-1', 'basilica-23-1', 'basilica-35-1', 'basilica-52-1', 'grottoes-5-1', 'grottoes-12-1']) {
      expect(spaceForPlace(plan, id)?.placeId, id).toBe(id);
    }
    const nave = spaceForPlace(plan, 'basilica-5-1')!;
    expect(nave.polygons.some((p) => containsPoint(p, [410, 173]))).toBe(false);
    const broken = structuredClone(plan);
    Object.assign(broken.unlocatedPlaces![0], { at: [217, 249] });
    expect(validateArchitecturalPlan(broken)).toContain('Unlocated place contains a spatial guess: basilica-82-1');
  });

  it('focuses Uffizi itinerary rooms individually without altering source geometry or identifiers', () => {
    const plan = plans.find((p) => p.slug === 'uffizi')!;
    for (const id of ['L2-A4-1', 'L2-A9-1', 'L2-A35-1', 'L2-A38-1', 'L1-D19-1']) {
      const room = spaceForPlace(plan, id)!;
      expect(room).toBeDefined();
      expect(room.placeId).toBe(id);
      expect(room.featureIds).toEqual([]);
      expect(room.scope).toBe('room');
    }
    const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
    expect(hash(plan.floors)).toBe('b4e18ccedc43caebb12a0edb054271b0d9abb0c107e72afa0deb188f240d2d83');
    expect(hash(plan.places)).toBe('0305de87755ac36e627a86ad37f8c142f37be144dbe41f97515692426e2f78bb');
    expect(hash(plan.stopBindings)).toBe('28805fd4f1c29e334c77973327bea15f0fa6735df6c3028d03c167182cf13ba2');
    for (const place of plan.places.filter((p) => p.kind === 'room' && p.floorId !== 'L0')) {
      expect(spaceForPlace(plan, place.id), place.id).toBeDefined();
    }
    expect(spaceForPlace(plan, 'L2-A11-1')).toBe(spaceForPlace(plan, 'L2-A12-1'));
    expect(spaceForPlace(plan, 'L1-B2-1')).toBe(spaceForPlace(plan, 'L1-B4-1'));
  });

  it('keeps all thirteen Grazie source numbers and the source-derived curved tribune selectors', () => {
    const plan = plans.find((p) => p.slug === 'santa-maria-grazie')!;
    expect(plan.spaces).toHaveLength(16);
    for (let key = 1; key <= 13; key++) expect(plan.places.find((p) => p.id === `church-${key}-1`)).toBeDefined();
    expect(spaceForPlace(plan, 'church-2-1')?.id).toBe('church-solari-central-nave');
    expect(spaceForPlace(plan, 'church-3-1')?.id).toBe('church-tribune-core');
    expect(spaceForPlace(plan, 'church-Tribune后殿-1')?.id).toBe('church-tribune-apse');
    expect(spaceForPlace(plan, 'church-13-1')?.id).toBe('church-refectory');
    expect(plan.verticalLinks).toEqual([]);
  });

  it('retains a whole-floor footprint without treating it as every selected room', () => {
    const plan = structuredClone(plans.find((p) => p.slug === 'accademia-venice')!);
    plan.spaces = plan.spaces!.filter((space) => space.scope === 'floor');
    expect(plan.spaces).toHaveLength(2);
    for (const space of plan.spaces!) {
      expect(space.scope).toBe('floor');
      expect(spaceForPlace(plan, space.placeId)).toBeUndefined();
      expect(spaceForFeature(plan, space.featureIds![0])).toBe(space);
    }
    const invalid = structuredClone(plan);
    Object.assign(invalid.spaces![0], { scope: 'anything' });
    expect(validateArchitecturalPlan(invalid)).toContain(`Invalid space scope: ${invalid.spaces![0].id}`);
  });

  it('selects all 39 Accademia Venice galleries and retains patterned XXIII geometry', () => {
    const plan = plans.find((p) => p.slug === 'accademia-venice')!;
    const rooms = plan.places.filter((p) => p.kind === 'room');
    expect(rooms).toHaveLength(39);
    for (const place of rooms) {
      const space = spaceForPlace(plan, place.id)!;
      expect(space, place.id).toBeDefined();
      expect(space.scope).toBe('room');
      expect(space.placeId).toBe(place.id);
      expect(space.polygons.some((p) => containsPoint(p, place.at))).toBe(true);
    }
    expect(spaceForPlace(plan, 'first-XV-1')).not.toBe(spaceForPlace(plan, 'first-XVIII-1'));
    const floor = plan.floors.find((f) => f.id === 'first')!;
    for (const nativeId of [1161, 1162]) {
      expect(floor.features.some((f) => f.id === `first-path-${nativeId}-wall`)).toBe(true);
    }
    const source = floor.features.find((f) => f.id === 'first-source-XXIII-footprint-floor')!;
    expect(source.kind).toBe('surface');
    expect(source.polygons[0].outer.length).toBeGreaterThan(20);
    expect(source.polygons.some((p) => containsPoint(p, plan.places.find((place) => place.id === 'first-XXIII-1')!.at))).toBe(true);
  });

  it('preserves several evidenced spaces in a single itinerary stop', () => {
    const plan = structuredClone(plans.find((p) => p.slug === 'last-supper')!);
    plan.stopBindings = [{ stopIndex: 0, placeId: 'L0-晚餐-1' }, { stopIndex: 0, placeId: 'L0-受难-1' }];
    expect(placesForStop(plan, 0).map((p) => p.id)).toEqual(['L0-晚餐-1', 'L0-受难-1']);
    expect(placesForStop(plan, 1)).toEqual([]);
    expect(validateArchitecturalPlan(plan)).toEqual([]);
    plan.stopBindings.push(plan.stopBindings[0]);
    expect(validateArchitecturalPlan(plan)).toContain('Duplicate stop target: 0:L0-晚餐-1');
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

  it('keeps Palau seat selection out of its central void and stage out of backstage', () => {
    const plan = plans.find((p) => p.slug === 'palau-musica')!;
    expect(plan.spaces).toHaveLength(21);
    expect(plan.places).toHaveLength(23);
    const seats = spaceForPlace(plan, 'plan-IV-历史上层座席区-1')!;
    const anchor = plan.places.find((p) => p.id === 'plan-IV-历史上层座席区-1')!;
    expect(anchor.at).toEqual([130, 520]);
    expect(seats.polygons.some((p) => containsPoint(p, anchor.at))).toBe(true);
    expect(seats.polygons.some((p) => containsPoint(p, [370, 500]))).toBe(false);
    const stage = spaceForPlace(plan, 'plan-II-历史舞台端-1')!;
    expect(stage).toBe(spaceForPlace(plan, 'plan-II-10-1'));
    expect(stage.polygons.some((p) => containsPoint(p, [510, 80]))).toBe(false);
    expect(spaceForPlace(plan, 'plan-II-历史音乐厅-1')).toBe(spaceForPlace(plan, 'plan-II-9-1'));
    expect(plan.floors.find((f) => f.id === 'plan-III')!.features.filter((f) => f.kind === 'surface').some((f) => f.polygons.some((p) => containsPoint(p, [390, 200])))).toBe(false);
  });

  it('does not turn the Picasso upper-floor courtyard context into floor slabs', () => {
    const plan = plans.find((p) => p.slug === 'picasso-barcelona')!;
    const upper = plan.floors.find((f)=>f.id==='L1')!;
    expect(upper.features.some((f)=>['L1-path-37-surface','L1-path-38-surface'].includes(f.id))).toBe(false);
    expect(plan.places.filter((p)=>p.floorId==='L1' && p.kind === 'room')).toHaveLength(18);
    expect(plan.verticalLinks.find((link) => link.id === 'meca-stairs')?.toPlaceId).toBe('L1-Meca楼梯-1');
    expect(plan.spaces!.find((s) => s.id === 'L1-room-12')?.featureIds).toEqual(['L1-path-119-surface']);
    expect(spaceForPlace(plan,'L1-12-1')?.featureIds).toEqual([]);
  });

  it('keeps Picasso room selections source-bounded and its lift core hollow', () => {
    const plan = plans.find((p) => p.slug === 'picasso-barcelona')!;
    const roomIds = plan.places.filter((p) => p.floorId === 'L1' && p.kind === 'room').map((p) => p.id);
    expect(new Set(roomIds.map((id) => spaceForPlace(plan, id)?.id)).size).toBe(17);
    expect(spaceForPlace(plan, 'L1-4-1')).toBe(spaceForPlace(plan, 'L1-5-1'));
    for (const id of roomIds) expect(spaceForPlace(plan, id)?.scope).toBe('room');
    expect(spaceForPlace(plan, 'L0-Meca楼梯-1')?.featureIds).toEqual(['L0-path-47-surface', 'L0-path-67-surface']);
    expect(spaceForPlace(plan, 'L0-Meca宫院-1')).toBeUndefined();
    const core = plan.floors.find((f) => f.id === 'L1')!.features.find((f) => f.id === 'L1-path-39-wall')!;
    const lift = plan.places.find((p) => p.id === 'L1-藏品区电梯-1')!;
    expect(core.polygons.some((p) => containsPoint(p, lift.at))).toBe(false);
    expect(core.polygons.some((p) => (p.holes?.length ?? 0) > 0)).toBe(true);
  });

  it('retains all Pedrera service symbols without highlighting the whole entrance floor as a courtyard', () => {
    const plan = plans.find((p) => p.slug === 'la-pedrera')!;
    expect(plan.places.filter((p) => p.kind === 'service')).toHaveLength(27);
    expect(plan.places.find((p) => p.id === 'historic-visitor-ground-花卉庭院-1')?.at).toEqual([330, 260]);
    for (const label of ['花卉庭院', '蝴蝶庭院']) expect(spaceForPlace(plan, `historic-visitor-ground-${label}-1`)).toBeUndefined();
    for (const p of plan.places.filter((p) => p.kind === 'service')) expect(serviceMarkerKind(p)).not.toBeNull();
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

  it('reflows dense projected Vatican markers without dropping identifiers or moving anchors', () => {
    const plan = plans.find((p) => p.slug === 'vatican-museums')!;
    for (const width of [240, 284, 300, 340, 390]) for (const at of [[4, 4], [width / 2, 230], [width - 4, 456]]) {
      const places = plan.places.filter((p) => p.floorId === 'first').map((p) => ({ ...p, at: [...at] as [number, number] }));
      const labels = placeRoomLabels(places, 1, [width, 460]);
      expect(labels.map((p) => p.id).sort()).toEqual(places.map((p) => p.id).sort());
      for (const a of labels) {
        expect(a.at).toEqual(at);
        expect(a.displayAt[0] - a.width / 2).toBeGreaterThanOrEqual(0);
        expect(a.displayAt[0] + a.width / 2).toBeLessThanOrEqual(width);
        expect(a.displayAt[1] - a.height / 2).toBeGreaterThanOrEqual(0);
        expect(a.displayAt[1] + a.height / 2).toBeLessThanOrEqual(460);
        for (const b of labels) if (a.id !== b.id) expect(Math.abs(a.displayAt[0] - b.displayAt[0]) >= (a.width + b.width) / 2 || Math.abs(a.displayAt[1] - b.displayAt[1]) >= (a.height + b.height) / 2).toBe(true);
      }
    }
  });

  it('uses compact service symbols but never replaces printed numbered identifiers', () => {
    const place = { id: 'service', floorId: 'first', kind: 'service' as const, at: [10, 10] as [number, number], label: '无障碍洗手间', name: '无障碍洗手间' };
    expect(serviceMarkerKind(place)).toBe('accessible');
    expect(placeRoomLabels([place], 1)[0].width).toBe(26);
    expect(serviceMarkerKind({ ...place, label: '22' })).toBeNull();
    expect(serviceMarkerKind({ ...place, kind: 'room', label: '礼拜堂' })).toBeNull();
  });
});
