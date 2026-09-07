import entryFloors from '../data/architectural-entry-floors.json';
import type { ArchitecturalPlan } from './architectural-plan';

type EntryEvidence = { basis: string; reference?: string };
export type ArchitecturalEntry = EntryEvidence & (
  | { status: 'mapped'; floorId: string; placeId?: string }
  | { status: 'unmapped'; fallbackFloorId: string; notice: string }
);

const entries = entryFloors as Record<string, ArchitecturalEntry>;

// Defaults are venue evidence, independent of tab order, elevation or art routes.
export function resolveArchitecturalEntry(plan: ArchitecturalPlan, entry = entries[plan.slug]) {
  if (!entry) throw new Error(`Missing entrance-floor review: ${plan.slug}`);
  const floorId = entry.status === 'mapped' ? entry.floorId : entry.fallbackFloorId;
  const floor = plan.floors.find((item) => item.id === floorId);
  if (!floor) throw new Error(`Unknown entrance/reference floor: ${plan.slug}/${floorId}`);
  if (!entry.basis.trim()) throw new Error(`Missing entrance-floor evidence: ${plan.slug}`);
  if (entry.status === 'mapped' && entry.placeId && !plan.places.some((place) => place.id === entry.placeId && place.floorId === floorId)) {
    throw new Error(`Entrance marker is not on its declared floor: ${plan.slug}/${entry.placeId}`);
  }
  if (entry.status === 'unmapped' && !entry.notice.trim()) throw new Error(`Missing entrance limitation: ${plan.slug}`);
  return { floor, status: entry.status, notice: entry.status === 'unmapped' ? entry.notice : undefined };
}
