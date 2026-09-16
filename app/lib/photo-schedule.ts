import type { PhotoSpot } from '../data/photo-spots';
import type { GuideRecord, TripDay } from '../data/types';

export type PhotoVisit = {
  date: string;
  dateLabel: string;
  time: string;
  itemId: string;
  order: number;
  alternative: boolean;
};
export type PhotoSchedule = Record<string, PhotoVisit[]>;

// Bind to the place from which the photo is taken, not every landmark in view.
const visitBindings: Partial<Record<PhotoSpot['id'], string[]>> = {
  'scala-auditorium': ['la-scala-museum'],
  'sighs-bridge': ['doges-palace'],
  'florence-nave': ['brunelleschi-dome'],
  'vasari-new': ['ponte-vecchio-night-27', 'ponte-vecchio-night-28'],
  'peter-nave-wide': ['st-peters-basilica'],
  'rome-vatican': ['st-peters-square'],
  'sagrada-glass': ['sagrada-basilica'],
  'sagrada-nave-official': ['sagrada-basilica'],
  'cologne-aisle-wide': ['cologne-interior'],
  'cologne-river': ['hohenzollern'],
  'paris-seine': ['seine'],
};

function compareVisits(left?: PhotoVisit, right?: PhotoVisit) {
  if (!left || !right) return left ? -1 : right ? 1 : 0;
  return (
    left.date.localeCompare(right.date) ||
    Number(left.alternative) - Number(right.alternative) ||
    left.order - right.order
  );
}

export function buildPhotoSchedule(
  spots: PhotoSpot[],
  guides: Pick<GuideRecord, 'slug' | 'itemIds'>[],
  days: TripDay[],
): PhotoSchedule {
  const visits = days.flatMap((day) =>
    day.items.map((item, order) => ({
      date: day.date,
      dateLabel: day.label,
      time: item.time,
      itemId: item.id,
      order,
      alternative: item.routePoint === false || item.status === '备选',
    })),
  );
  const guideItems = new Map(
    guides.map((guide) => [guide.slug, guide.itemIds]),
  );
  return Object.fromEntries(
    spots.map((spot) => {
      const ids =
        visitBindings[spot.id] ?? guideItems.get(spot.guideSlugs[0]) ?? [];
      return [
        spot.id,
        visits
          .filter((visit) => ids.includes(visit.itemId))
          .sort(compareVisits),
      ];
    }),
  );
}

export function sortPhotoSpots(spots: PhotoSpot[], schedule: PhotoSchedule) {
  return [...spots].sort((left, right) =>
    compareVisits(schedule[left.id]?.[0], schedule[right.id]?.[0]),
  );
}
