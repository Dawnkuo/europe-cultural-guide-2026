import { tripDays } from '../data/trip';
import type { TripDay } from '../data/types';

export function cityVisitOrder(days: TripDay[]) {
  const visits: string[] = [];
  for (const day of days) {
    for (const item of day.items) {
      if (!item.routePoint) continue;
      const city = item.city === '梵蒂冈' ? '罗马' : item.city;
      if (visits.at(-1) !== city) visits.push(city);
    }
  }
  return visits;
}

export const journeyCityOrder = cityVisitOrder(tripDays);
export const formatJourneyStep = (index: number) => String(index + 1).padStart(2, '0');
