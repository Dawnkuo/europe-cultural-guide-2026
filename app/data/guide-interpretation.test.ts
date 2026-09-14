import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { guideCatalog } from './guides';
import { guideInterpretations } from './guide-interpretation';
import { workId } from '../lib/guide-experience';
import rawDimensions from './media-dimensions.generated.json';
import vaticanMedia from '../../sources/collections/galleries/vatican-reference-additions.json';

describe('reviewed interpretation enrichment', () => {
  const works = new Map(guideCatalog.flatMap(guide => guide.highlights.map((work, index) => [workId(guide.slug, work, index), work])));
  it.each(Object.entries(guideInterpretations))('%s enriches a real catalog object with distinct observations', (id, enrichment) => {
    const work = works.get(id);
    expect(work).toBeDefined();
    expect(work?.background).toBe(enrichment.background);
    expect(new Set(work?.observations).size).toBeGreaterThanOrEqual(3);
    const dimensions: Record<string, { width: number; height: number }> = rawDimensions;
    for (const photo of work?.gallery ?? []) {
      expect(existsSync(`public${photo.src}`), photo.src).toBe(true);
      expect(dimensions[photo.src]?.width, photo.src).toBeGreaterThan(0);
      expect(dimensions[photo.src]?.height, photo.src).toBeGreaterThan(0);
    }
  });
  it('preserves debated dating and material provenance in the visible archive', () => {
    expect(works.get('uffizi-highlight-3')?.period).toContain('1507');
    expect(works.get('borghese-david')?.material).toContain('尚有疑问');
    expect(works.get('vatican-museums-highlight-3')?.background).toContain('解释');
    expect(works.get('vatican-museums-highlight-1')?.material).toBe('木板油性蛋彩');
    expect(works.get('vatican-apollo')?.displayNote).toContain('修复状态');
  });
  it('does not reuse rejected reference gallery associations or watermarked torso photos', () => {
    const rejected = new Set(['a91f379bff0a72c228.webp', 'd1875b814c7f84bf37.webp', '2a88c00fb056997178-d90bdbfff1.webp', 'd9b91e949742dae685.webp', '2103b99fd4e9061a62.webp', 'ed77a9601c29576a00.webp', '0ffc4f84cc10560be3.webp', 'ba45b1d349e5e0669e.webp', 'cd4eb9da77b0a92c7e.webp', 'aa5237788a0059988f.webp', 'f6bcb085448f289cc0.webp', '00a24ca9de664354fc.webp', 'dc20456128e96d783a.webp', '4276f17f5aa6cca1dd.webp']);
    for (const work of works.values()) {
      for (const src of [work.image, ...(work.gallery?.map(photo => photo.src) ?? [])].filter(Boolean)) {
        expect(rejected.has(src!.split('/').at(-1)!)).toBe(false);
      }
    }
  });
  it('keeps the two triptych faces distinct and preserves their missing panels', () => {
    const triptych = works.get('vatican-stefaneschi')!;
    expect(triptych.creator).toBe('乔托与工作室');
    expect(triptych.period).toBe('1315—1320年');
    expect(triptych.gallery?.map(photo => photo.caption)).toEqual(['圣彼得面 · 面向信众', '基督面 · 面向神职人员']);
    expect(triptych.observations?.join(' ')).toContain('空缺');
    expect(triptych.gallery?.map(photo => photo.src)).toEqual(['/images/details/vatican-stefaneschi-peter.webp', '/images/details/vatican-stefaneschi-christ.webp']);
  });
  it('appends distinct reference additions without changing existing work identities', () => {
    const guide = guideCatalog.find(guide => guide.slug === 'vatican-museums')!;
    expect(guide.highlights.slice(26).map(work => work.id)).toEqual(['vatican-hermes', 'vatican-perseus', 'vatican-stefaneschi', 'vatican-heliodorus', 'vatican-nile', 'vatican-expulsion', 'vatican-deluge', 'vatican-libyan-sibyl', 'vatican-angelico-madonna', 'vatican-borgia', 'vatican-momo', 'vatican-djedmut', 'vatican-lady-shroud', 'vatican-hercules', 'vatican-candelabra', 'vatican-sphere', 'vatican-sistine-hall', 'vatican-dogmatic']);
    expect(works.get('vatican-perseus')?.background).toContain('两位拳击手');
    expect(works.get('vatican-nile')?.location).toContain('Braccio Nuovo');
  });
  it('preserves uncertainty and historic condition instead of copying reference overclaims', () => {
    expect(works.get('vatican-angelico-madonna')?.background).toContain('尚不清楚');
    expect(works.get('vatican-libyan-sibyl')?.background).toContain('并非只有一种');
    expect(works.get('vatican-deluge')?.displayNote).toContain('缺损');
    expect(works.get('vatican-museums-highlight-6')?.background).toContain('不能');
    expect(works.get('vatican-museums-highlight-7')?.background).toContain('1564');
    expect(works.get('vatican-museums-highlight-6')?.gallery?.[1].caption).toContain('局部');
  });
  it('does not equate the grottoes with the deeper necropolis or substitute unrelated Angelico photos', () => {
    expect(works.get('st-peters-basilica-highlight-4')?.title).toBe('梵蒂冈墓穴层');
    expect(works.get('st-peters-basilica-highlight-4')?.displayNote).toContain('不同于');
    const madonna = works.get('vatican-angelico-madonna')!;
    expect(madonna.image).toBe('/images/details/vatican-angelico-madonna-complete.webp');
    expect(madonna.gallery).toBeUndefined();
  });
  it('keeps funerary objects, absent parts and interpretive uncertainty distinct', () => {
    expect(works.get('vatican-djedmut')?.originalTitle).toContain('25008');
    expect(works.get('vatican-djedmut')?.material).toContain('木材');
    expect(works.get('vatican-djedmut')?.gallery?.map(photo => photo.caption)).toEqual(['外棺 · 棺盖', '同一外棺 · 棺箱内侧']);
    expect(works.get('vatican-lady-shroud')?.originalTitle).toContain('17953');
    expect(works.get('vatican-lady-shroud')?.displayNote).toContain('非木乃伊遗体');
    expect(works.get('vatican-hercules')?.period).toContain('争议');
    expect(works.get('vatican-hercules')?.material).toContain('石膏');
    expect(works.get('vatican-sistine-hall')?.displayNote).toContain('非西斯廷礼拜堂');
    expect(works.get('peter-necropolis')?.displayNote).toContain('不增加既定行程');
  });
  it('never uses the rejected new-topic thumbnails, watermarks or wrong gallery photos', () => {
    const rejected = ['ef7ee545ae77c4793f', 'b54c94d4c68d106e45', 'f2a0f9095a36680110', '6ed3c5d742c6a04da3', 'f0ee5cf9b286b929ee', '3ea67399b4ecb753a1', '2d0e784e80462991c2'];
    for (const id of ['vatican-borgia', 'vatican-momo', 'vatican-hercules', 'vatican-candelabra', 'vatican-sistine-hall']) {
      const work = works.get(id)!;
      for (const path of [work.image, ...(work.gallery?.map(photo => photo.src) ?? [])]) {
        expect(existsSync(`public${path}`)).toBe(true);
        expect(rejected.some(name => path?.includes(name))).toBe(false);
      }
    }
  });
  it('distinguishes relics, later materials and uncertain ancient identities', () => {
    expect(works.get('st-peters-basilica-highlight-3')?.background).toContain('不能据此宣称');
    expect(works.get('vatican-foligno')?.material).toContain('转');
    expect(works.get('vatican-round-basin')?.displayNote).toContain('未经证实');
    expect(works.get('vatican-todi')?.background).toContain('翁布里亚');
    expect(works.get('peter-alexander')?.background).toContain('涂成白色');
    expect(works.get('st-peters-square-highlight-2')?.dimensions).toContain('不含');
    expect(works.get('st-peters-square-highlight-1')?.lookFor).toContain('不应');
  });
  it('preserves full monument views and labels dome details as details', () => {
    expect(works.get('st-peters-basilica-highlight-2')?.image).toBe('/images/details/peter-baldachin-complete.webp');
    expect(works.get('st-peters-basilica-highlight-3')?.image).toBe('/images/details/peter-chair-complete.webp');
    const dome = works.get('st-peters-basilica-highlight-5')!;
    expect(dome.image).not.toContain('7c8ef6daf2c79cae8b');
    expect(dome.gallery?.map(photo => photo.caption)).toEqual(['仰视 · 肋与马赛克分带', '局部 · 鼓座与下部马赛克', '局部 · 灯笼与圣父图像']);
    expect(works.get('peter-alexander')?.gallery?.[0].alt).toContain('门洞');
    expect(works.get('peter-alexander')?.gallery?.[1].caption).toContain('局部');
  });
  it('uses visually reviewed detail photos at their recorded hashes', () => {
    const records = new Map(vaticanMedia.map(record => [record.path, record]));
    const checked = new Set<string>();
    for (const work of works.values()) {
      for (const path of [work.image, ...(work.gallery?.map(photo => photo.src) ?? [])]) {
        if (!path || checked.has(path) || !records.has(path)) continue;
        checked.add(path);
        const record = records.get(path)!;
        expect(record.visualReview, path).toMatch(/^accepted-/);
        expect(createHash('sha256').update(readFileSync(`public${path}`)).digest('hex'), path).toBe(record.outputSha256);
      }
    }
    expect(checked.has('/images/details/peter-dome-complete.webp')).toBe(true);
  });
  it('enriches every existing Vatican and St Peter subject, not just the reference matches', () => {
    for (const slug of ['vatican-museums', 'st-peters-basilica']) {
      const guide = guideCatalog.find(guide => guide.slug === slug)!;
      for (const work of guide.highlights) {
        expect(work.background, `${slug}: ${work.title}`).toBeTruthy();
        expect(new Set(work.observations).size, work.title).toBeGreaterThanOrEqual(3);
      }
    }
  });
  it('preserves different spaces, historical dates and contested identifications', () => {
    expect(works.get('vatican-apoxyomenos')?.background).toContain('摹制');
    expect(works.get('vatican-temptations')?.background).toContain('不应');
    expect(works.get('vatican-last-supper')?.observations?.join(' ')).toContain('之后');
    expect(works.get('peter-gregory')?.displayNote).toContain('不同出版物');
    expect(works.get('peter-filarete')?.period).toContain('1445');
    expect(works.get('peter-holy-door')?.period).toContain('1949');
    expect(works.get('peter-holy-door')?.displayNote).toContain('不代表');
    expect(works.get('st-peters-basilica-highlight-6')?.displayNote).toContain('尚无');
  });
  it('replaces watermarked and cut-off photos while labeling partial views honestly', () => {
    for (const [id, image] of Object.entries({
      'peter-clement': '/images/details/peter-clement-complete.webp',
      'peter-gregory': '/images/details/peter-gregory-complete.webp',
      'peter-narthex': '/images/details/peter-narthex-overall.webp',
      'peter-holy-door': '/images/details/peter-holy-door-complete.webp',
    })) expect(works.get(id)?.image).toBe(image);
    expect(works.get('peter-narthex')?.gallery?.map(photo => photo.caption)).toEqual(['空间总览 · 沿门廊长轴', '拱顶局部 · 保禄五世纹章']);
    expect(works.get('peter-narthex')?.displayNote).toContain('2019');
    expect(works.get('vatican-anubis')?.gallery?.map(photo => photo.caption)).toEqual(['局部 · 头部与神祇属性', '整体 · 全身与陈列环境']);
  });
});
