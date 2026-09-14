import {
  guidePlaceGroups,
  guideSequenceBindings,
  guideWorkLocations,
} from '../data/guide-experience';
import type { GuideHighlight, GuideRecord } from '../data/types';
import { placesForStop, type ArchitecturalPlan } from './architectural-plan';

export const workId = (slug: string, item: GuideHighlight, index: number) =>
  item.id ?? `${slug}-highlight-${index + 1}`;

export function locationForWork(
  slug: string,
  id: string,
  plan?: ArchitecturalPlan,
) {
  const binding = guideWorkLocations[slug]?.[id];
  if (!binding || !plan || plan.slug !== slug) return undefined;
  const places = binding.placeIds.flatMap((id) => {
    const place = plan.places.find((p) => p.id === id);
    return place ? [place] : [];
  });
  if (places.length !== binding.placeIds.length) return undefined;
  return { ...binding, places };
}

export function worksAtPlace(guide: GuideRecord, placeId: string) {
  const places = guidePlaceGroups[guide.slug]?.find((group) =>
    group.includes(placeId),
  ) ?? [placeId];
  return guide.highlights.filter((work, index) =>
    guideWorkLocations[guide.slug]?.[
      workId(guide.slug, work, index)
    ]?.placeIds.some((id) => places.includes(id)),
  );
}

export function locationForSequence(
  guide: GuideRecord,
  index: number,
  plan?: ArchitecturalPlan,
) {
  const binding = guideSequenceBindings[guide.slug]?.[index];
  const places =
    plan && binding
      ? [
          ...new Map(
            binding.stopIndices
              .flatMap((index) => placesForStop(plan, index))
              .map((place) => [place.id, place]),
          ).values(),
        ]
      : [];
  const workIds = new Set([
    ...(binding?.workIds ?? []),
    ...(guide.sequence[index]?.highlightIds ?? []),
    ...places.flatMap((place) =>
      worksAtPlace(guide, place.id).map((work) =>
        workId(guide.slug, work, guide.highlights.indexOf(work)),
      ),
    ),
  ]);
  return {
    binding,
    places,
    works: guide.highlights.filter((work, i) =>
      workIds.has(workId(guide.slug, work, i)),
    ),
  };
}
