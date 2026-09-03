import {
  buildGuideExteriorSceneLayout,
  guideSceneAccent,
  type BuildGuideSceneLayoutInput,
  type GuideExteriorSceneLayout,
  type GuideSceneNode,
} from './guide-exterior-layout';
import {
  compileFloorPlanRoute,
  floorPlanPosition,
  getGuideFloorPlan,
  validateFloorPlan,
  type CompiledFloorPlanRoute,
  type FloorPlanFloor,
  type FloorPlanOpening,
  type FloorPlanSource,
  type FloorPlanVerticalLink,
} from './guide-floorplans';

export {
  buildGuideExteriorSceneLayout,
  type GuideExteriorSceneLayout,
  type GuideSceneNode,
} from './guide-exterior-layout';

export type GuideStackedSceneLayout = {
  mode: 'stacked-floorplan';
  modelBasis: 'documented-floorplan';
  floors: FloorPlanFloor[];
  openings: FloorPlanOpening[];
  sourceManifest: FloorPlanSource[];
  verticalLinks: FloorPlanVerticalLink[];
  nodes: Array<GuideSceneNode & { floorId: string; spaceId: string }>;
  paths: Array<[number, number]>;
  route: CompiledFloorPlanRoute;
  accent: number;
};

export type GuideSceneLayout =
  | GuideExteriorSceneLayout
  | GuideStackedSceneLayout;

export function buildGuideSceneLayout({
  slug,
  type,
  stops,
}: BuildGuideSceneLayoutInput): GuideSceneLayout {
  const floorPlan = getGuideFloorPlan(slug);

  if (floorPlan) {
    if (floorPlan.routeStops.length !== stops.length) {
      throw new Error(
        `${slug}: floor-plan route has ${floorPlan.routeStops.length} stops, expected ${stops.length}`,
      );
    }

    const issues = validateFloorPlan(floorPlan);
    if (issues.length > 0) {
      throw new Error(`${slug}: invalid floor plan\n${issues.join('\n')}`);
    }

    return {
      mode: floorPlan.mode,
      modelBasis: 'documented-floorplan',
      accent: guideSceneAccent(slug, type),
      floors: floorPlan.floors,
      openings: floorPlan.openings,
      sourceManifest: floorPlan.sourceManifest,
      verticalLinks: floorPlan.verticalLinks,
      nodes: stops.map((label, index) => {
        const routeStop = floorPlan.routeStops[index];
        return {
          floorId: routeStop.floorId,
          label,
          position: floorPlanPosition(floorPlan, routeStop),
          spaceId: routeStop.spaceId,
        };
      }),
      paths: stops.slice(1).map((_, index) => [index, index + 1]),
      route: compileFloorPlanRoute(floorPlan),
    };
  }

  return buildGuideExteriorSceneLayout({ slug, stops, type });
}
