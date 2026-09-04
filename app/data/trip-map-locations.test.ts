import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { tripDays } from './trip';
import {
  isMapEligibleTripItem,
  mapLocationForTripItem,
  unlocatedMapItems,
} from './trip-map-locations';

const expectedCityBounds = {
  milan: [9.16, 45.45, 9.2, 45.48],
  venice: [12.32, 45.42, 12.35, 45.45],
  florence: [11.24, 43.75, 11.28, 43.79],
  pisa: [10.38, 43.71, 10.41, 43.74],
  'rome-vatican': [12.44, 41.88, 12.51, 41.93],
  barcelona: [2.14, 41.37, 2.21, 41.43],
  cologne: [6.94, 50.91, 6.99, 50.96],
  paris: [2.32, 48.84, 2.37, 48.87],
} as const;

describe('trip map locations', () => {
  const mapItems = tripDays.flatMap((day) =>
    day.items.filter(isMapEligibleTripItem),
  );

  it('locates every fixed itinerary place or records why it cannot be mapped', () => {
    const missing = mapItems
      .filter(
        (item) => !mapLocationForTripItem(item) && !unlocatedMapItems[item.id],
      )
      .map((item) => item.id);

    expect(missing).toEqual([]);
  });

  it('locates every place on a main daily route', () => {
    const missingMainRoute = mapItems
      .filter((item) => item.routePoint !== false)
      .filter((item) => !mapLocationForTripItem(item))
      .map((item) => item.id);

    expect(missingMainRoute).toEqual([]);
  });

  it('keeps every coordinate inside the expected destination area', () => {
    for (const item of mapItems) {
      const location = mapLocationForTripItem(item);
      if (!location) continue;
      const [longitude, latitude] = location.coordinates;
      const [west, south, east, north] = expectedCityBounds[location.cityMapId];

      expect(Number.isFinite(longitude), item.id).toBe(true);
      expect(Number.isFinite(latitude), item.id).toBe(true);
      expect(longitude, item.id).toBeGreaterThanOrEqual(west);
      expect(longitude, item.id).toBeLessThanOrEqual(east);
      expect(latitude, item.id).toBeGreaterThanOrEqual(south);
      expect(latitude, item.id).toBeLessThanOrEqual(north);
    }
  });

  it('reuses one venue coordinate for repeated or combined visits', () => {
    expect(
      mapLocationForTripItem({ id: 'sagrada-basilica' })?.coordinates,
    ).toEqual(
      mapLocationForTripItem({ id: 'sagrada-passion-tower' })?.coordinates,
    );
    expect(
      mapLocationForTripItem({ id: 'cologne-interior' })?.coordinates,
    ).toEqual(
      mapLocationForTripItem({ id: 'cologne-tower-treasury' })?.coordinates,
    );
  });

  it('ships a valid offline linework file for every mapped city', () => {
    for (const cityMapId of Object.keys(expectedCityBounds)) {
      const payload = JSON.parse(
        readFileSync(`public/map-data/${cityMapId}.json`, 'utf8'),
      ) as {
        source: string;
        map: {
          bounds: number[];
          layers: Record<string, unknown[]>;
        };
      };

      expect(payload.source, cityMapId).toContain('OpenStreetMap');
      expect(payload.map.bounds, cityMapId).toHaveLength(4);
      for (const layer of [
        'water',
        'rail',
        'majorRoad',
        'road',
        'pedestrian',
      ]) {
        expect(
          Array.isArray(payload.map.layers[layer]),
          `${cityMapId}:${layer}`,
        ).toBe(true);
      }
    }
  });
});
