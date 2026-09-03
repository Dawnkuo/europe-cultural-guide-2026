import { describe, expect, it } from 'vitest';
import { validateFloorPlan } from './floorplans/core';
import { guideFloorPlanInventory, guideFloorPlans } from './guide-floorplans';
import {
  getFloorPlanAvailability,
  loadGuideFloorPlan,
} from './guide-floorplan-loader';

describe('guide floor-plan loader', () => {
  it('loads only a ready attraction plan through its own data module', async () => {
    expect(getFloorPlanAvailability('uffizi')).toBe('ready');

    const floorPlan = await loadGuideFloorPlan('uffizi');

    expect(floorPlan).toBeDefined();
    expect(validateFloorPlan(floorPlan!)).toEqual([]);
  });

  it('does not invent a plan for source-limited or unknown attractions', async () => {
    expect(getFloorPlanAvailability('fenice')).toBe('source-limited');
    await expect(loadGuideFloorPlan('fenice')).resolves.toBeUndefined();
    await expect(loadGuideFloorPlan('unknown')).resolves.toBeUndefined();
  });

  it('keeps every generated lazy module identical to the reviewed source model', async () => {
    for (const [slug, expected] of Object.entries(guideFloorPlans)) {
      expect(getFloorPlanAvailability(slug), slug).toBe('ready');
      await expect(loadGuideFloorPlan(slug), slug).resolves.toEqual(expected);
    }

    for (const [slug, entry] of Object.entries(guideFloorPlanInventory)) {
      expect(getFloorPlanAvailability(slug), slug).toBe(entry.status);
    }
  });
});
