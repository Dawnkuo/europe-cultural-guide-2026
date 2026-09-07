import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import entries from '../data/architectural-entry-floors.json';
import { resolveArchitecturalEntry } from './architectural-entry';
import type { ArchitecturalPlan } from './architectural-plan';

const plans = readdirSync('app/data/architectural-plans').filter((file) => file.endsWith('.json'))
  .map((file) => JSON.parse(readFileSync(`app/data/architectural-plans/${file}`, 'utf8')) as ArchitecturalPlan);

describe('venue entrance floor defaults', () => {
  it('requires a reviewed entrance or an explicit missing-entry state for every plan', () => {
    expect(Object.keys(entries).sort()).toEqual(plans.map((plan) => plan.slug).sort());
    for (const plan of plans) {
      expect(existsSync(`sources/floorplans/evidence/${plan.slug}.json`)).toBe(true);
      const before = JSON.stringify(plan);
      const entry = resolveArchitecturalEntry(plan);
      expect(plan.floors).toContain(entry.floor);
      expect(entry.floor.features.length).toBeGreaterThan(0);
      expect(JSON.stringify(plan)).toBe(before);
      if (entry.status === 'unmapped') expect(entry.notice).toMatch(/入口/);
      else expect(entry.notice).toBeUndefined();
    }
  });

  it.each([
    ['doges-palace', 'L0'], ['uffizi', 'L0'], ['casa-batllo', 'ground'],
    ['cologne-cathedral', 'nave'], ['milan-duomo', 'cathedral'],
    ['vatican-museums', 'first'], ['sagrada-familia', 'main'],
    ['borghese', 'B1'], ['correr', 'L1'], ['museum-ludwig', 'ground'],
    ['leaning-tower', 'entry-first'], ['brera', 'gallery'],
  ])('%s opens on %s regardless of input order, elevation or art stops', (slug, floorId) => {
    const plan = plans.find((item) => item.slug === slug)!;
    expect(resolveArchitecturalEntry(plan).floor.id).toBe(floorId);
    const reordered = {
      ...plan,
      floors: [...plan.floors].reverse().map((floor, index) => ({ ...floor, order: 100 - index })),
      stopBindings: [...plan.stopBindings].reverse(),
    };
    expect(resolveArchitecturalEntry(reordered).floor.id).toBe(floorId);
  });

  it.each(['colosseum', 'notre-dame-towers', 'koln-triangle', 'la-scala', 'palau-musica', 'pitti'])('does not present %s reference geometry as a verified entrance', (slug) => {
    const entry = resolveArchitecturalEntry(plans.find((plan) => plan.slug === slug)!);
    expect(entry.status).toBe('unmapped');
    expect(entry.notice).toContain('暂显示');
  });

  it('rejects unreviewed additions, removed floors, misplaced markers and missing evidence', () => {
    const plan = plans.find((item) => item.slug === 'uffizi')!;
    expect(() => resolveArchitecturalEntry({ ...plan, slug: 'new-venue' })).toThrow('Missing entrance-floor review');
    expect(() => resolveArchitecturalEntry({ ...plan, floors: plan.floors.filter((floor) => floor.id !== 'L0') })).toThrow('Unknown entrance/reference floor');
    expect(() => resolveArchitecturalEntry(plan, { status: 'mapped', floorId: 'L1', placeId: 'L0-1-1', basis: 'test' })).toThrow('Entrance marker is not on its declared floor');
    expect(() => resolveArchitecturalEntry(plan, { status: 'mapped', floorId: 'L0', basis: '' })).toThrow('Missing entrance-floor evidence');
    expect(() => resolveArchitecturalEntry(plan, { status: 'unmapped', fallbackFloorId: 'L0', basis: 'test', notice: '' })).toThrow('Missing entrance limitation');
  });
});
