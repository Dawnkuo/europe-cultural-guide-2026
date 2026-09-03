import availabilityData from '../data/floorplan-availability.json';
import type { StackedFloorPlan } from './floorplans/core';

export type FloorPlanAvailability = 'ready' | 'source-limited';

const availability = availabilityData as Record<string, FloorPlanAvailability>;
const planModules = import.meta.glob<{ default: StackedFloorPlan }>(
  '../data/floorplans/*.json',
);

export function getFloorPlanAvailability(slug: string) {
  return availability[slug];
}

export async function loadGuideFloorPlan(slug: string) {
  if (availability[slug] !== 'ready') return undefined;
  const load = planModules[`../data/floorplans/${slug}.json`];
  if (!load) throw new Error(`${slug}: missing floor-plan data module`);
  const loadedModule = await load();
  return loadedModule.default;
}
