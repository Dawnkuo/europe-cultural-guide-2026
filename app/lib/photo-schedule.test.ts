import { describe, expect, it } from 'vitest';
import { photoSpots } from '../data/photo-spots';
import { guideCatalog } from '../data/guides';
import { tripDays } from '../data/trip';
import { buildPhotoSchedule, sortPhotoSpots } from './photo-schedule';

const schedule = buildPhotoSchedule(photoSpots, guideCatalog, tripDays);
describe('photography itinerary order', () => {
  it('derives every date and time from itinerary items, not photos or city order', () => {
    const items = tripDays.flatMap((day) =>
      day.items.map((item, order) => ({
        date: day.date,
        dateLabel: day.label,
        itemId: item.id,
        time: item.time,
        order,
        alternative: item.routePoint === false || item.status === '备选',
      })),
    );
    for (const spot of photoSpots) {
      expect(schedule[spot.id].length, spot.id).toBeGreaterThan(0);
      for (const visit of schedule[spot.id])
        expect(items).toContainEqual(visit);
    }
    const sorted = sortPhotoSpots(photoSpots, schedule);
    expect(sorted[0].id).toBe('milan-galleria');
    expect(sorted.at(-1)?.city).toBe('巴黎');
    const dates = sorted.map((spot) => schedule[spot.id][0].date);
    expect(dates).toEqual([...dates].sort());
    expect(new Set(sorted.map((spot) => spot.id)).size).toBe(photoSpots.length);
  });
  it('preserves source sequence for unspecified times and keeps alternatives at the end of their day', () => {
    const sorted = sortPhotoSpots(photoSpots, schedule);
    const index = (id: string) => sorted.findIndex((spot) => spot.id === id);
    expect(index('supper-room')).toBeLessThan(index('grazie-nave-new'));
    expect(index('grazie-nave-new')).toBeLessThan(index('sforza-courtyard'));
    expect(index('sforza-courtyard')).toBeLessThan(index('brera-gallery'));
    expect(index('brera-gallery')).toBeLessThan(index('scala-auditorium'));
    for (const date of new Set(tripDays.map((day) => day.date))) {
      const day = sorted
        .map((spot) => schedule[spot.id][0])
        .filter((visit) => visit.date === date);
      const alternatives = day.map((visit) => visit.alternative);
      expect(alternatives).toEqual(
        [...alternatives].sort((a, b) => Number(a) - Number(b)),
      );
      for (const alternative of [false, true]) {
        const positions = day
          .filter((visit) => visit.alternative === alternative)
          .map((visit) => visit.order);
        expect(positions).toEqual([...positions].sort((a, b) => a - b));
      }
    }
  });
  it('uses the shooting location and visit type, retaining repeated visits without duplicating photos', () => {
    expect(schedule['scala-auditorium'].map((v) => v.itemId)).toEqual([
      'la-scala-museum',
    ]);
    expect(schedule['sighs-bridge'][0].itemId).toBe('doges-palace');
    expect(schedule['florence-panorama'][0].itemId).toBe(
      'piazzale-michelangelo',
    );
    expect(schedule['cologne-river'][0].date).toBe('2026-10-04');
    expect(schedule['cologne-aisle-wide'][0].date).toBe('2026-10-05');
    expect(schedule['peter-nave-wide'].map((v) => v.itemId)).toEqual([
      'st-peters-basilica',
    ]);
    expect(schedule['rome-vatican'][0].itemId).toBe('st-peters-square');
    expect(schedule['florence-bridge'].map((v) => v.date)).toEqual([
      '2026-09-27',
      '2026-09-28',
    ]);
    expect(schedule['vasari-new'].map((v) => v.date)).toEqual([
      '2026-09-27',
      '2026-09-28',
    ]);
  });
  it('does not mutate the catalog and places undated references last with stable ties', () => {
    const original = [...photoSpots];
    const onlyFirst = { [photoSpots[1].id]: schedule[photoSpots[1].id] };
    const sorted = sortPhotoSpots(photoSpots, onlyFirst);
    expect(sorted[0]).toBe(photoSpots[1]);
    expect(sorted.slice(1)).toEqual(photoSpots.filter((_, i) => i !== 1));
    expect(photoSpots).toEqual(original);
    expect(buildPhotoSchedule([photoSpots[0]], [], [])).toEqual({
      [photoSpots[0].id]: [],
    });
  });
});
