import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { planFloorGap, placesForStop, type ArchitecturalPlan } from './architectural-plan';

const plan: ArchitecturalPlan = JSON.parse(readFileSync('app/data/architectural-plans/casa-batllo.json', 'utf8'));
const levels = ['basement', 'ground', 'noble', 'upper-1', 'upper-2', 'upper-3', 'upper-4', 'attic', 'rooftop'];

describe('Casa Batllo complete published level inventory', () => {
  it('keeps every level in the 2021 plan set, including attic, roof and basement', () => {
    expect(plan.floors.map(f => f.id)).toEqual(levels);
    expect(plan.floors.map(f => f.order)).toEqual([-1, 0, 1, 2, 3, 4, 5, 6, 7]);
    expect(plan.floors.every(f => f.features.some(item => item.kind === 'wall'))).toBe(true);
    expect(plan.places).toHaveLength(52);
  });

  it('locates the retained attic and roof guide steps on the correct floors', () => {
    expect(placesForStop(plan, 3).map(p => p.floorId)).toEqual(['attic', 'attic']);
    expect(placesForStop(plan, 4).map(p => p.floorId)).toEqual(['rooftop', 'rooftop']);
    expect(placesForStop(plan, 5)).toEqual([]);
    expect(plan.unlocatedPlaces?.some(p => p.name.includes('Gaudí Dôme'))).toBe(true);
  });

  it('connects consecutive stair landings and the two documented roof spiral stairs', () => {
    const connections = plan.verticalLinks.map(link => [link.fromPlaceId, link.toPlaceId].map(id => plan.places.find(p => p.id === id)!.floorId));
    for (let i = 0; i < 7; i++) expect(connections).toContainEqual([levels[i], levels[i + 1]]);
    expect(connections.filter(([a, b]) => a === 'attic' && b === 'rooftop')).toHaveLength(2);
  });

  it('pins primary drawing bytes and does not claim 2026 exhibition-room accuracy', () => {
    const manifest = JSON.parse(readFileSync('sources/floorplans/casa-batllo-kkaa/source-manifest.json', 'utf8'));
    for (const [file, digest] of Object.entries(manifest.files)) {
      expect(createHash('sha256').update(readFileSync(`sources/floorplans/casa-batllo-kkaa/${file}`)).digest('hex')).toBe(digest);
    }
    expect(plan.limitations.join(' ')).toContain('2021');
    expect(plan.limitations.join(' ')).toContain('2026');
  });

  it('separates display spacing from source geometry with safe legacy defaults', () => {
    expect(planFloorGap(plan)).toBe(3.5);
    expect(planFloorGap({ ...plan, display: undefined })).toBe(7.5);
    for (const floorGap of [0, -1, NaN, Infinity, 100]) expect(planFloorGap({ ...plan, display: { floorGap } })).toBe(7.5);
  });
});
