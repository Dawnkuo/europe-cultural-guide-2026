import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { tripDays } from '../data/trip';
import { DayRouteMap, groupMapItemsForDay } from './DayRouteMap';

const day = (date: string) => {
  const match = tripDays.find((entry) => entry.date === date);
  if (!match) throw new Error(`Missing trip day ${date}`);
  return match;
};

describe('DayRouteMap', () => {
  it("keeps each city's main route in itinerary order", () => {
    const { groups } = groupMapItemsForDay(day('2026-09-28'));

    expect(groups.map((group) => group.cityMapId)).toEqual([
      'pisa',
      'florence',
    ]);
    expect(groups[0].scheduled.map(({ item }) => item.id)).toEqual([
      'leaning-tower',
      'pisa-cathedral',
      'pisa-baptistery',
      'camposanto',
      'sinopie',
      'opera-pisa',
    ]);
    expect(groups[1].scheduled.map(({ item }) => item.id)).toEqual([
      'florence-duomo-exterior',
      'brunelleschi-dome',
      'piazzale-michelangelo',
      'ponte-vecchio-night-28',
    ]);
  });

  it('keeps alternatives visible but outside the connected route', () => {
    const { groups } = groupMapItemsForDay(day('2026-09-30'));
    expect(groups).toHaveLength(1);
    expect(groups[0].scheduled).toHaveLength(9);
    expect(groups[0].alternatives.map(({ item }) => item.id)).toEqual([
      'tazza-doro',
    ]);

    const html = renderToString(<DayRouteMap day={day('2026-09-30')} />);
    expect(html.match(/data-route-kind="scheduled"/g)).toHaveLength(9);
    expect(html.match(/data-route-kind="alternative"/g)).toHaveLength(1);
    expect(html).toContain('href="#2026-09-30-pantheon"');
  });

  it('does not invent a fixed point for a flexible gondola boarding place', () => {
    const { unlocated } = groupMapItemsForDay(day('2026-09-27'));
    expect(unlocated.map(({ item }) => item.id)).toEqual(['gondola']);

    const html = renderToString(<DayRouteMap day={day('2026-09-27')} />);
    expect(html).toContain('无固定地图点');
    expect(html).toContain('不伪造固定位置');
  });

  it('omits the map when a day only contains transport', () => {
    expect(renderToString(<DayRouteMap day={day('2026-09-24')} />)).toBe('');
  });
});
