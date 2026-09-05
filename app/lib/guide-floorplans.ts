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

const legacyFloorPlans: Record<string, StackedFloorPlan> = {
  ...barcelonaCologneParisFloorPlans,
  ...milanVeniceFloorPlans,
  ...pilotFloorPlans,
  ...tuscanyRomeFloorPlans,
  ...vaticanFloorPlans,
};

const rejectedInteriorNotes: Record<string, string> = {
  'vasari-corridor': '现有图源仅给出乌菲兹集合点与城市尺度路径，未提供走廊内部平面；航拍存在遮挡和高度视差，不能替代内部结构。',
  'st-mark-campanile': '倒塌前史料不能证明1912年重建后的当前内部结构；旧泛化室内图缺少对应平面依据，未核实前只保留外观。',
  'vatican-post': '资料仅支持邮局外形、柜台数量与活动隔断，不能据此推造柜台坐标或室内平面。',
};

export const guideFloorPlans = Object.fromEntries(
  Object.entries(legacyFloorPlans).filter(([slug]) => !rejectedInteriorNotes[slug]),
);

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
    ...Object.fromEntries(Object.entries(rejectedInteriorNotes).map(([slug, note]) => [slug, {
      status: 'source-limited' as const,
      note,
      sources: legacyFloorPlans[slug].sourceManifest,
    }])),
  };

export function getGuideFloorPlan(slug: string) {
  return guideFloorPlans[slug];
}

export function getGuideFloorPlanInventory(slug: string) {
  return guideFloorPlanInventory[slug];
}
