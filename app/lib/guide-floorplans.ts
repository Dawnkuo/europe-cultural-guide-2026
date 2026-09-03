import {
  barcelonaCologneParisFloorPlans,
  barcelonaCologneParisInventory,
} from './floorplans/barcelona-cologne-paris';
import {
  pilotFloorPlans,
  type FloorPlanInventoryEntry,
  type StackedFloorPlan,
} from './floorplans/core';
import {
  milanVeniceFloorPlans,
  milanVeniceInventory,
} from './floorplans/milan-venice';
import {
  tuscanyRomeFloorPlans,
  tuscanyRomeInventory,
} from './floorplans/tuscany-rome';
import { vaticanFloorPlans, vaticanInventory } from './floorplans/vatican';

export * from './floorplans/core';

export const guideFloorPlans: Record<string, StackedFloorPlan> = {
  ...barcelonaCologneParisFloorPlans,
  ...milanVeniceFloorPlans,
  ...pilotFloorPlans,
  ...tuscanyRomeFloorPlans,
  ...vaticanFloorPlans,
};

const pilotInventory = Object.fromEntries(
  Object.entries(pilotFloorPlans).map(([slug, floorPlan]) => [
    slug,
    {
      note: '已根据官网或权威导览资料建立分层平面与跨层路线。',
      sources: floorPlan.sourceManifest,
      status: 'ready' as const,
    },
  ]),
);

export const guideFloorPlanInventory: Record<string, FloorPlanInventoryEntry> =
  {
    ...barcelonaCologneParisInventory,
    ...milanVeniceInventory,
    ...pilotInventory,
    ...tuscanyRomeInventory,
    ...vaticanInventory,
  };

export function getGuideFloorPlan(slug: string) {
  return guideFloorPlans[slug];
}

export function getGuideFloorPlanInventory(slug: string) {
  return guideFloorPlanInventory[slug];
}
