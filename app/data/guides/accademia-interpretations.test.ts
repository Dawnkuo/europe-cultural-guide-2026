import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { guideCatalog } from '../guides';
import { guideContentBySlug } from './content';
import { accademiaAdditions } from './accademia-interpretations';
import { guideWorkLocations } from '../guide-experience';
import { visitorInformation } from '../visitor-information';
import { locationForWork, worksAtPlace } from '../../lib/guide-experience';
import { loadArchitecturalPlan } from '../../lib/architectural-plan-loader';
import dimensions from '../media-dimensions.generated.json';
import media from '../../../sources/collections/galleries/accademia-additions.json';
import evidence from '../../../sources/collections/accademia-catalog-review.json';

const guide = guideCatalog.find(guide => guide.slug === 'accademia-florence')!;
const works = new Map(guide.highlights.map(work => [work.id, work]));

describe('Accademia authored interpretation and collection breadth', () => {
  it('retains the seven previous identities, sequence, map and booked visit', () => {
    expect(guide.highlights.slice(0, 7).map(work => work.id)).toEqual(['accademia-florence-highlight-1', 'accademia-florence-highlight-2', 'accademia-florence-highlight-3', 'accademia-matthew', 'accademia-sabines', 'accademia-perugino', 'accademia-viola']);
    expect(guide.highlights.slice(7).map(work => work.id)).toEqual(accademiaAdditions.map(work => work.id));
    expect(guide.highlights.length).toBeGreaterThanOrEqual(13);
    expect(new Set(guide.highlights.map(work => work.id)).size).toBe(guide.highlights.length);
    expect(guide.sequence).toEqual(guideContentBySlug['accademia-florence'].sequence);
    expect(guide.spatial).toEqual(guideContentBySlug['accademia-florence'].spatial);
    expect(guide.scheduledVisits.map(visit => [visit.date, visit.time])).toEqual([['2026-09-29', '08:15–09:25']]);
    for (const category of ['金地绘画', '历史乐器', '文艺复兴绘画', '米开朗琪罗雕塑', '石膏模型与艺术教育']) expect(guide.highlights.some(work => work.category === category)).toBe(true);
  });
  it.each(guide.highlights)('$id has a distinct interpretation and local media', work => {
    expect(work.background!.length).toBeGreaterThan(80);
    expect(work.observations?.length).toBeGreaterThanOrEqual(3);
    expect(new Set(work.observations).size).toBe(work.observations!.length);
    for (const observation of work.observations!) expect(observation.length).toBeGreaterThan(25);
    for (const text of [work.creator, work.material, work.location]) expect(text).toMatch(/[\u3400-\u9fff]/);
    expect(work.sourceIds?.some(url => url.includes('galleriaaccademiafirenze.it'))).toBe(true);
    for (const path of [work.image!, ...(work.gallery ?? []).map(photo => photo.src)]) {
      expect(readFileSync(`public${path}`).length).toBeGreaterThan(1000);
      const size = (dimensions as Record<string, { width: number; height: number }>)[path];
      expect(size).toBeDefined();
      // The retained official viola photograph is800px; never enlarge it to fake resolution.
      expect(Math.max(size.width, size.height)).toBeGreaterThanOrEqual(work.id === 'accademia-viola' ? 800 : 1000);
    }
  });
  it('keeps four Prisoners together but gives each its own identified photograph', () => {
    const group = works.get('accademia-florence-highlight-2')!;
    expect(group.gallery?.map(photo => photo.src)).toEqual(['young', 'atlas', 'awakening', 'bearded'].map(id => `/images/details/accademia-${id}.webp`));
    expect(group.period).toContain('1530');
    expect(works.get('accademia-matthew')?.background).toContain('不是朱利奥二世陵墓的囚徒之一');
    expect(works.get('accademia-matthew')?.gallery?.[1].caption).toContain('局部');
  });
  it('corrects material, subject and object identity rather than carrying captions forward', () => {
    expect(works.get('accademia-sabines')?.material).toBe('未烧制泥塑');
    expect(works.get('accademia-perugino')?.summary).toContain('不是围绕空墓的十二使徒');
    expect(works.get('accademia-cassone')?.background).toContain('挂墙');
    expect(works.get('accademia-monaco')?.background).toContain('缺失');
    expect(works.get('accademia-spinet')?.summary).toContain('不是以琴槌击弦的钢琴');
    expect(works.get('accademia-pontormo')?.creator).toContain('根据');
  });
  it('binds only supported rooms, retaining unmapped works without made-up coordinates', async () => {
    const plan = await loadArchitecturalPlan('accademia-florence');
    expect(plan?.sourceDigest).toBe('f01a1af6dfc684436e47e4aa48479a0c7d52573d66169ba11fed42e41dced2d9');
    for (const id of ['accademia-tree', 'accademia-monaco', 'accademia-cassone', 'accademia-pontormo']) {
      expect(locationForWork(guide.slug, id, plan)).toBeUndefined();
      expect(works.get(id)?.displayNote).toMatch(/定位|地图坐标/);
    }
    for (const [id, binding] of Object.entries(guideWorkLocations[guide.slug])) {
      const location = locationForWork(guide.slug, id, plan)!;
      expect(location.places.map(place => place.id)).toEqual(binding.placeIds);
      for (const place of location.places) expect(worksAtPlace(guide, place.id).some(work => work.id === id)).toBe(true);
    }
  });
  it('preserves the acquired media hashes and does not crop or upscale sources', () => {
    for (const record of media) {
      expect(createHash('sha256').update(readFileSync(`public${record.path}`)).digest('hex')).toBe(record.outputSha256);
      expect(record.sourceSha256).toMatch(/^[a-f0-9]{64}$/);
      expect(record.transformation).toContain('without enlargement');
      expect(Math.max(record.width, record.height)).toBeGreaterThanOrEqual(1000);
      expect(record.visualReview).toContain('Accepted');
    }
  });
  it('retains specific catalogue inventories and source hashes independent of authored prose', () => {
    const records = new Map(evidence.map(record => [record.id, record]));
    expect(new Set(evidence.map(record => record.id)).size).toBe(evidence.length);
    for (const record of evidence) expect(record.sourceSha256).toMatch(/^[a-f0-9]{64}$/);
    for (const [catalogId, workId] of [['david', 'accademia-florence-highlight-1'], ['matthew', 'accademia-matthew'], ['sabines', 'accademia-sabines'], ['viola', 'accademia-viola'], ...accademiaAdditions.map(work => [work.id!.replace('accademia-', ''), work.id!])]) {
      expect(works.get(workId)?.inventoryNumber).toBe(records.get(catalogId)?.fields.Inventario);
    }
  });
  it('separates off-gallery baggage services and conflicting toilet descriptions', () => {
    const text = JSON.stringify(visitorInformation[guide.slug]);
    expect(text).toContain('MyAccademia');
    expect(text).toContain('馆内没有衣帽寄存处');
    expect(text).toContain('写法并不一致');
    expect(text).not.toContain('40×30×18');
    expect(guide.practical.join(' ')).toContain('MyAccademia');
  });
});
