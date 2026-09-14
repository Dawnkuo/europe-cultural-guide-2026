import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { guideCatalog } from '../guides';
import { expandedPaintings } from './expanded-paintings';
import { expandedUffizi } from './expanded-uffizi';
import { guideContentBySlug } from './content';
import { guideWorkLocations } from '../guide-experience';
import { loadArchitecturalPlan } from '../../lib/architectural-plan-loader';
import { locationForWork, worksAtPlace } from '../../lib/guide-experience';
import dimensions from '../media-dimensions.generated.json';
import evidence from '../../../sources/collections/uffizi-catalog-review.json';
import media from '../../../sources/collections/galleries/uffizi-additions.json';
import roomReview from '../../../sources/collections/uffizi-room-review.json';

const guide = guideCatalog.find(guide => guide.slug === 'uffizi')!;
const works = new Map(guide.highlights.map(work => [work.id, work]));

describe('Uffizi interpretation and evidenced collection breadth', () => {
  it('retains every previous identity and order, without changing the itinerary or map', () => {
    expect(guide.highlights.slice(0, 21).map(work => work.id)).toEqual(['uffizi-highlight-1', 'uffizi-highlight-2', 'uffizi-highlight-3', ...expandedPaintings.uffizi.map(work => work.id)]);
    expect(guide.highlights.slice(21, 32).map(work => work.id)).toEqual(expandedUffizi.map(work => work.id));
    expect(guide.sequence).toEqual(guideContentBySlug.uffizi.sequence);
    expect(guide.spatial).toEqual(guideContentBySlug.uffizi.spatial);
    expect(guide.highlights.length).toBeGreaterThanOrEqual(32);
    expect(new Set(guide.highlights.map(work => work.id)).size).toBe(guide.highlights.length);
    for (const category of ['北方文艺复兴', '古代雕塑', '艺术家自画像', '版画与纸上作品']) expect(guide.highlights.some(work => work.category === category)).toBe(true);
  });
  it.each(guide.highlights)('$id has individual interpretation, a localized archive and an inspectable local image', work => {
    expect(work.background!.length).toBeGreaterThan(80);
    expect(new Set(work.observations).size).toBeGreaterThanOrEqual(3);
    for (const observation of work.observations!) expect(observation.length).toBeGreaterThan(25);
    expect(work.creator).toMatch(/[\u3400-\u9fff]/);
    expect(work.material).toMatch(/[\u3400-\u9fff]/);
    expect(work.location).toBeTruthy();
    expect(work.sourceIds!.some(url => url.startsWith('https://www.uffizi.it/'))).toBe(true);
    for (const path of [work.image!, ...(work.gallery ?? []).map(photo => photo.src)]) {
      const size = (dimensions as Record<string, { width: number; height: number }>)[path];
      expect(size, path).toBeDefined();
      expect(Math.max(size.width, size.height)).toBeGreaterThanOrEqual(1000);
      expect(readFileSync(`public${path}`).length).toBeGreaterThan(1000);
    }
  });
  it('keeps catalogue identity separate from translations and unknown inventory numbers', () => {
    expect(evidence).toHaveLength(31);
    expect(new Set(evidence.map(record => record.catalogId)).size).toBe(31);
    for (const record of evidence) {
      expect(record.sourceSha256).toMatch(/^[a-f0-9]{64}$/);
      if (record.inventory) expect(works.get(record.id)?.inventoryNumber).toBe(record.inventory.trim());
    }
    expect(works.get('uffizi-rucellai')?.inventoryNumber).toBeUndefined();
    expect(works.get('uffizi-medusa')?.inventoryNumber).toBe('1890 n. 1351');
  });
  it('does not invent map positions or imply fixed display for the paper collection', async () => {
    const plan = await loadArchitecturalPlan('uffizi');
    for (const { id } of roomReview.unmapped) {
      expect(locationForWork('uffizi', id, plan)).toBeUndefined();
      expect(works.get(id)?.displayNote).toMatch(/地图|定位/);
    }
    expect(works.get('uffizi-three-trees')?.displayNote).toContain('当期展出');
    expect(Object.keys(guideWorkLocations.uffizi)).toHaveLength(29);
    expect(plan?.sourceDigest).toBe(roomReview.plan.sha256);
    for (const { id, placeId } of [...roomReview.overrides, ...roomReview.qualifiedReferences]) {
      expect(guideWorkLocations.uffizi[id].placeIds).toEqual([placeId]);
    }
    for (const { id } of roomReview.qualifiedReferences) expect(works.get(id)?.displayNote).toContain('展区参考');
    for (const [id, binding] of Object.entries(guideWorkLocations.uffizi)) {
      const location = locationForWork('uffizi', id, plan)!;
      expect(location.precision).toBe('room');
      for (const place of location.places) {
        expect(works.get(id)?.location).toContain(place.label);
        expect(worksAtPlace(guide, place.id).map(work => work.id)).toContain(id);
      }
      expect(location.places.map(place => place.id)).toEqual(binding.placeIds);
    }
  });
  it('preserves contested dates, restored parts, fragments and the different triptych faces', () => {
    expect(works.get('uffizi-wrestlers')?.period).toContain('两种记载');
    expect(works.get('uffizi-niobe')?.background).toContain('双臂经过修复');
    expect(works.get('uffizi-medici-venus')?.background).toContain('原属另一尊');
    expect(works.get('uffizi-musical-angel')?.material).toContain('残片');
    expect(works.get('uffizi-gentile-magi')?.displayNote).toContain('复制品');
    expect(works.get('uffizi-portinari')?.gallery?.map(photo => photo.caption)).toEqual(['展开 · 三联完整画面', '合拢后的背面 · 天使报喜', '局部 · 右翼圣徒与远景']);
    expect(works.get('uffizi-urbino-diptych')?.gallery?.map(photo => photo.caption)).toEqual(['正面 · 双联肖像', '背面 · 公爵凯旋', '背面 · 公爵夫人凯旋']);
  });
  it('retains the acquisition hashes and all new images at their reviewed resolutions', () => {
    for (const record of media) {
      expect(createHash('sha256').update(readFileSync(`public${record.path}`)).digest('hex')).toBe(record.outputSha256);
      expect(Math.max(record.width, record.height)).toBeGreaterThanOrEqual(1000);
      expect(record.transformation).toContain('Uncropped');
      expect(record.sourcePage).toMatch(/^https:\/\/www.uffizi.it\//);
    }
    expect(media.find(photo => photo.workId === 'uffizi-wrestlers')?.mediaPage).toContain('niobids-in-the-mirror');
  });
});
