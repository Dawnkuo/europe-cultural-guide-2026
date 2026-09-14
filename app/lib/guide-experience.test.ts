import { describe, expect, it } from 'vitest';
import { guideCatalog } from '../data/guides';
import {
  guidePlaceGroups,
  guideSequenceBindings,
  guideWorkLocations,
} from '../data/guide-experience';
import { loadArchitecturalPlan } from './architectural-plan-loader';
import {
  locationForSequence,
  locationForWork,
  workId,
  worksAtPlace,
} from './guide-experience';

describe('reviewed guide experience links', () => {
  it('reviews every existing indoor plan without inventing missing object positions', () => {
    const files = Object.keys(
      import.meta.glob('../data/architectural-plans/*.json'),
    );
    for (const file of files) {
      const slug = file.split('/').at(-1)!.replace('.json', '');
      expect(guideWorkLocations, slug).toHaveProperty(slug);
      expect(guideSequenceBindings, slug).toHaveProperty(slug);
    }
    expect(guideWorkLocations['picasso-barcelona']).toEqual({});
    expect(guideWorkLocations['koln-triangle']).toEqual({});
  });
  for (const [slug, locations] of Object.entries(guideWorkLocations)) {
    it(`${slug}: every authored work link resolves to existing evidenced places`, async () => {
      const guide = guideCatalog.find((g) => g.slug === slug)!;
      const plan = await loadArchitecturalPlan(slug);
      const ids = guide.highlights.map((work, index) =>
        workId(slug, work, index),
      );
      for (const [id, location] of Object.entries(locations)) {
        expect(ids).toContain(id);
        expect(location.placeIds.length).toBeGreaterThan(0);
        expect(
          locationForWork(slug, id, plan)?.places.map((p) => p.id),
        ).toEqual(location.placeIds);
      }
      for (const group of guidePlaceGroups[slug] ?? [])
        for (const id of group)
          expect(plan.places.some((p) => p.id === id)).toBe(true);
    });
  }

  for (const [slug, sequence] of Object.entries(guideSequenceBindings)) {
    it(`${slug}: all sequence references preserve existing stops and works`, () => {
      const guide = guideCatalog.find((g) => g.slug === slug)!;
      expect(guide).toBeDefined();
      const ids = guide.highlights.map((work, index) =>
        workId(slug, work, index),
      );
      expect(sequence).toHaveLength(guide.sequence.length);
      for (const step of sequence) {
        for (const index of step.stopIndices)
          expect(guide.spatial.stops[index]).toBeDefined();
        for (const id of step.workIds ?? []) expect(ids).toContain(id);
      }
    });
  }

  it('does not turn a department anchor into an exact sculpture position', async () => {
    const plan = await loadArchitecturalPlan('vatican-museums');
    const location = locationForWork(
      'vatican-museums',
      'vatican-museums-highlight-2',
      plan,
    );
    expect(location?.precision).toBe('area');
    expect(location?.places[0].id).toBe('first-4-1');
  });

  it('keeps the unlocated dome viewing platform unlocated', async () => {
    const plan = await loadArchitecturalPlan('st-peters-basilica');
    expect(
      locationForWork(plan.slug, 'st-peters-basilica-highlight-6', plan),
    ).toBeUndefined();
    const guide = guideCatalog.find((g) => g.slug === plan.slug)!;
    const step = locationForSequence(guide, 2, plan);
    expect(step.places).toEqual([]);
    expect(step.works.map((w) => w.title)).toContain('灯笼观景台');
  });

  it('binds Alexander VII to the existing source legend42, not a new coordinate', async () => {
    const plan = await loadArchitecturalPlan('st-peters-basilica');
    const location = locationForWork(plan.slug, 'peter-alexander', plan);
    expect(location?.precision).toBe('feature');
    expect(location?.places.map(place => place.id)).toEqual(['basilica-42-1']);
    expect(location?.places[0].label).toBe('42');
    const guide = guideCatalog.find(guide => guide.slug === plan.slug)!;
    expect(worksAtPlace(guide, 'basilica-42-1').map(work => work.id)).toContain('peter-alexander');
  });

  it('places the Nile in Braccio Nuovo, not the reference site tapestry hall', async () => {
    const plan = await loadArchitecturalPlan('vatican-museums');
    const location = locationForWork('vatican-museums', 'vatican-nile', plan);
    expect(location?.precision).toBe('room');
    expect(location?.places.map(place => place.id)).toEqual(['first-3-1']);
    const guide = guideCatalog.find(guide => guide.slug === plan.slug)!;
    expect(worksAtPlace(guide, 'first-3-1').map(work => work.id)).toContain('vatican-nile');
    expect(locationForWork(plan.slug, 'vatican-stefaneschi', plan)?.precision).toBe('area');
  });

  it('joins the Sistine overview and interior anchors without losing its works', async () => {
    const guide = guideCatalog.find((g) => g.slug === 'vatican-museums')!;
    const plan = await loadArchitecturalPlan(guide.slug);
    const works = worksAtPlace(guide, 'first-12-1');
    expect(works.map((w) => w.title)).toContain('创造亚当');
    for (const id of ['vatican-expulsion', 'vatican-deluge', 'vatican-libyan-sibyl']) {
      expect(works.map(work => work.id)).toContain(id);
      const location = locationForWork(guide.slug, id, plan);
      expect(location?.precision).toBe('room');
      expect(location?.places.map(place => place.id)).toContain('first-西斯廷室内-1');
    }
    expect(works.map(work => work.id)).not.toContain('vatican-borgia');
    // The existing sequence explicitly passes through Borgia before the chapel.
    expect(locationForSequence(guide, 4, plan).works).toEqual([...works, guide.highlights.find(work => work.id === 'vatican-borgia')]);
  });

  it('rejects mismatched plans instead of placing a work in an arbitrary room', async () => {
    const plan = await loadArchitecturalPlan('uffizi');
    expect(
      locationForWork('vatican-museums', 'vatican-museums-highlight-2', plan),
    ).toBeUndefined();
    expect(locationForWork('uffizi', 'missing-work', plan)).toBeUndefined();
  });
  it('keeps the newly interpreted departments separate from misleading reference hall aliases', async () => {
    const plan = await loadArchitecturalPlan('vatican-museums');
    expect(locationForWork(plan.slug, 'vatican-borgia', plan)?.places.map(p => p.id)).toEqual(['first-11-1', 'first-11-2', 'first-11-3']);
    expect(locationForWork(plan.slug, 'vatican-dogmatic', plan)?.places.map(p => p.id)).toEqual(['first-18-1']);
    expect(locationForWork(plan.slug, 'vatican-candelabra', plan)?.places.map(p => p.id)).toEqual(['second-6-1']);
    expect(locationForWork(plan.slug, 'vatican-djedmut', plan)?.precision).toBe('area');
    expect(locationForWork(plan.slug, 'vatican-sphere', plan)?.precision).toBe('area');
    expect(locationForWork(plan.slug, 'vatican-sistine-hall', plan)).toBeUndefined();
    const peter = await loadArchitecturalPlan('st-peters-basilica');
    expect(locationForWork(peter.slug, 'peter-necropolis', peter)).toBeUndefined();
    expect(locationForWork(peter.slug, 'st-peters-basilica-highlight-4', peter)?.places.every(p => p.floorId === 'grottoes')).toBe(true);
  });
});
