import { describe, expect, it } from 'vitest';
import { tripDays } from './trip';

const allItems = () => tripDays.flatMap((day) => day.items);
const findVisit = (title: string) =>
  allItems().find((item) => item.title === title);

describe('trip source of truth', () => {
  it('preserves the source date order', () => {
    expect(tripDays.map((day) => day.date)).toEqual([
      '2026-09-24',
      '2026-09-25',
      '2026-09-26',
      '2026-09-27',
      '2026-09-28',
      '2026-09-29',
      '2026-09-30',
      '2026-10-01',
      '2026-10-02',
      '2026-10-03',
      '2026-10-04',
      '2026-10-05',
      '2026-10-06',
    ]);
  });

  it("uses the final QR times for Saint Peter's Basilica and dome", () => {
    expect(findVisit('圣彼得大教堂')?.time).toContain('15:30');
    expect(findVisit('圣彼得大教堂穹顶（电梯）')?.time).toBe('14:30入场');
    const ids = tripDays
      .find((day) => day.date === '2026-10-01')!
      .items.map((item) => item.id);
    expect(ids.indexOf('st-peters-dome')).toBeLessThan(
      ids.indexOf('st-peters-basilica'),
    );
    expect(findVisit('圣彼得大教堂穹顶（电梯）')?.conflict).toBeUndefined();
  });

  it('keeps ticket semantics for Park Guell and Cologne Cathedral', () => {
    expect(findVisit('高迪故居博物馆')?.note).toContain(
      '16:00 是高迪故居博物馆预约时间',
    );
    expect(findVisit('科隆大教堂内部')?.time).toBe('10:00–11:00');
    expect(findVisit('科隆大教堂内部')?.note).toContain('10:00–17:45');
    expect(findVisit('科隆大教堂南塔登顶')?.time).toBe('11:00–12:00');
    expect(findVisit('科隆大教堂珍宝馆')?.time).toBe('12:00–13:00');
    expect(findVisit('科隆大教堂珍宝馆')?.note).toContain('10:00–16:00');
  });

  it("restores the direct sheet's October detail without inventing the departure flight", () => {
    expect(tripDays.filter((day) => day.detailPending)).toEqual([]);
    expect(findVisit('路德维希博物馆')?.time).toBe('14:00–16:00');
    expect(findVisit('巧克力博物馆')?.time).toBe('15:00–16:45');
    expect(findVisit('巴黎圣母院双塔')).toMatchObject({
      time: '09:30入场',
      status: '已订',
    });
    expect(findVisit('巴黎 → 离境')?.status).toBe('待确认');
    expect(findVisit('Gaffel am Dom（科隆传统啤酒馆）')).toMatchObject({
      status: '备选',
      routePoint: false,
    });
  });

  it('flags opening conflicts without moving the original appointments', () => {
    expect(findVisit('比萨主教座堂')).toMatchObject({
      time: '09:35–10:00',
      status: '已订',
    });
    expect(findVisit('比萨主教座堂')?.conflict).toContain('10:00');
    expect(findVisit('圣玛利亚海洋教堂')).toMatchObject({
      time: '17:10–17:40',
      status: '未订',
    });
    expect(findVisit('焦糖山（Turó de la Rovira）')?.conflict).toContain(
      '17:30关闭',
    );
  });

  it('does not expose prices or private booking identifiers', () => {
    expect(JSON.stringify(tripDays)).not.toMatch(
      /€|EUR|CNY|TONGYI|BO YUAN|YAN LIANG|VWVTZQZR|B67MUA|K9K45R|TIE-\d+|DOM-\d+/,
    );
  });
});
