export type PlanPoint = [number, number];
export type BraccioFeature = {
  id: string;
  kind: 'floor' | 'wall' | 'column' | 'stair' | 'entablature';
  polygon?: PlanPoint[];
  at?: PlanPoint;
  radius?: number;
  bottom: number;
  top: number;
  evidence: 'plan' | 'plan-and-section' | 'plan-derived-step-display';
};

// Coordinates refer to the 5760 x 4000 rotated plate, not to the campus map.
// Keep the two graphic scales independent: the section is drawn at twice the plan scale.
export const braccioCalibration = {
  origin: [2790, 2650] as PlanPoint,
  planBar: { from: [1427, 2084] as PlanPoint, to: [2289, 2084] as PlanPoint, metres: 24 },
  sectionBar: { from: [3304, 2092] as PlanPoint, to: [4164, 2092] as PlanPoint, metres: 12 },
  sectionFloorY: 1705,
  sectionCorniceY: 1110,
  sectionPorchFloorY: 1520,
  sectionPorchCapitalY: 900,
  sectionPorchEntablatureY: 740,
};

export const braccioPlanPixelsPerMetre = 862 / 24;
export const braccioSectionPixelsPerMetre = 860 / 12;
export const braccioPlanToWorld = ([x, y]: PlanPoint): PlanPoint => [
  (x - braccioCalibration.origin[0]) / braccioPlanPixelsPerMetre,
  -(y - braccioCalibration.origin[1]) / braccioPlanPixelsPerMetre,
];
export const braccioSectionHeight = (y: number) =>
  (braccioCalibration.sectionFloorY - y) / braccioSectionPixelsPerMetre;

const rect = (x0: number, y0: number, x1: number, y1: number): PlanPoint[] =>
  [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

function arc(cx: number, cy: number, radius: number, from: number, to: number, segments = 32): PlanPoint[] {
  return Array.from({ length: segments + 1 }, (_, index) => {
    const angle = from + (to - from) * index / segments;
    return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
  });
}

// Each recess is traced on the wall's inner edge. Plinths, mosaics, text and print hatching are excluded.
function nicheWall(x0: number, x1: number, inner: number, outer: number, centers: number[]): PlanPoint[] {
  const sign = Math.sign(outer - inner);
  const edge: PlanPoint[] = [[x0, inner]];
  for (const x of centers) edge.push(...arc(x, inner, 45, Math.PI, sign > 0 ? 0 : Math.PI * 2, 16));
  edge.push([x1, inner], [x1, outer], [x0, outer]);
  return edge;
}

export const braccioNicheRows = [
  { id: 'west-south', x0: 1500, x1: 2465, inner: 2504, outer: 2428, centers: [1610, 1743, 1877, 2011, 2146, 2280, 2412] },
  { id: 'west-north', x0: 1500, x1: 2465, inner: 2786, outer: 2872, centers: [1610, 1743, 1877, 2011, 2146, 2280, 2412] },
  { id: 'east-south', x0: 3100, x1: 3996, inner: 2512, outer: 2433, centers: [3160, 3284, 3407, 3531, 3654, 3778, 3902] },
  { id: 'east-north', x0: 3100, x1: 3996, inner: 2796, outer: 2876, centers: [3160, 3284, 3407, 3531, 3654, 3778, 3902] },
];

export const braccioPorchColumns: PlanPoint[] = [
  [2480, 3077], [2567, 3077], [2654, 3077], [2743, 3077],
  [2830, 3077], [2917, 3077], [3006, 3077], [3093, 3077],
];

export function buildBraccioFeatures(): BraccioFeature[] {
  const cornice = braccioSectionHeight(braccioCalibration.sectionCorniceY);
  const porchFloor = braccioSectionHeight(braccioCalibration.sectionPorchFloorY);
  const features: BraccioFeature[] = [];
  const surface = (id: string, polygon: PlanPoint[], top = 0) => features.push({ id, kind: 'floor', polygon, bottom: top - 0.16, top, evidence: 'plan-and-section' });
  const wall = (id: string, polygon: PlanPoint[]) => features.push({ id, kind: 'wall', polygon, bottom: 0, top: cornice, evidence: 'plan-and-section' });
  surface('west-gallery-floor', rect(1500, 2504, 2610, 2786));
  surface('east-gallery-floor', rect(2970, 2512, 3996, 2796));
  surface('central-hall-floor', rect(2610, 2380, 2970, 2815));
  surface('entrance-bay-floor', rect(2610, 2815, 2970, 2918));
  surface('hemicycle-floor', [[2610, 2350], ...arc(2790, 2350, 180, Math.PI, Math.PI * 2), [2970, 2380], [2610, 2380]]);
  surface('north-portico-floor', rect(2456, 3003, 3118, 3158), porchFloor);
  for (const row of braccioNicheRows) {
    row.centers.forEach((x, index) => surface(`${row.id}-niche-floor-${index + 1}`, arc(x, row.inner, 45, Math.PI, row.outer > row.inner ? 0 : Math.PI * 2, 16)));
    wall(row.id, nicheWall(row.x0, row.x1, row.inner, row.outer, row.centers));
  }
  wall('hemicycle-wall', [
    ...arc(2790, 2350, 244, Math.PI, Math.PI * 2, 48),
    ...arc(2790, 2350, 180, Math.PI * 2, Math.PI, 48),
  ]);
  // Central piers preserve the cross-axis passages and do not fill the central hall.
  wall('central-south-west-pier', [[2465, 2428], [2520, 2428], [2520, 2360], [2610, 2360], [2610, 2475], [2584, 2475], [2584, 2504], [2465, 2504]]);
  wall('central-south-east-pier', [[2970, 2360], [3060, 2360], [3060, 2433], [3100, 2433], [3100, 2512], [2997, 2512], [2997, 2475], [2970, 2475]]);
  wall('central-north-west-pier', [[2465, 2786], [2584, 2786], [2584, 2815], [2610, 2815], [2610, 2918], [2718, 2918], [2718, 3003], [2456, 3003], [2456, 2872]]);
  wall('central-north-east-pier', [[2970, 2815], [2997, 2815], [2997, 2796], [3100, 2796], [3100, 2876], [3118, 2876], [3118, 3003], [2835, 3003], [2835, 2918], [2970, 2918]]);

  const columns = (id: string, points: PlanPoint[], radius: number, bottom: number, top: number) => {
    points.forEach((at, index) => features.push({ id: `${id}-${index + 1}`, kind: 'column', at, radius, bottom, top, evidence: 'plan-and-section' }));
  };
  columns('portico-column', braccioPorchColumns, 14 / braccioPlanPixelsPerMetre, porchFloor, braccioSectionHeight(braccioCalibration.sectionPorchCapitalY));
  features.push({ id: 'portico-entablature', kind: 'entablature', polygon: rect(2456, 3054, 3118, 3100), bottom: braccioSectionHeight(braccioCalibration.sectionPorchCapitalY), top: braccioSectionHeight(braccioCalibration.sectionPorchEntablatureY), evidence: 'plan-and-section' });
  const west = [1538, 1672, 1805, 1938, 2072, 2206, 2340, 2478];
  const east = [3097, 3224, 3348, 3472, 3597, 3720, 3845, 3970];
  columns('west-gallery-column', west.flatMap(x => [[x, 2520], [x, 2770]] as PlanPoint[]), 12 / braccioPlanPixelsPerMetre, 0, cornice - 0.35);
  columns('east-gallery-column', east.flatMap(x => [[x, 2528], [x, 2780]] as PlanPoint[]), 12 / braccioPlanPixelsPerMetre, 0, cornice - 0.35);
  columns('central-column', [[2635, 2490], [2945, 2490], [2635, 2806], [2945, 2806]], 14 / braccioPlanPixelsPerMetre, 0, cornice - 0.35);
  columns('hemicycle-column', [[2672, 2364], [2908, 2364], [2649, 2280], [2690, 2214], [2755, 2180], [2833, 2180], [2900, 2214], [2943, 2280]], 12 / braccioPlanPixelsPerMetre, 0, cornice - 0.35);
  // Two plan-visible flights. Their intermediate landing height is a display interpolation,
  // not a measured riser schedule; they are deliberately not route/navigation connections.
  for (let index = 0; index < 10; index++) {
    features.push({ id: `inner-stair-${index + 1}`, kind: 'stair', polygon: rect(2635 + index * 11, 2856, 2646 + index * 11, 2918), bottom: 0, top: porchFloor / 2 * (index + 1) / 10, evidence: 'plan-derived-step-display' });
  }
  features.push({ id: 'stair-turning-landing', kind: 'stair', polygon: rect(2745, 2856, 2834, 2918), bottom: 0, top: porchFloor / 2, evidence: 'plan-derived-step-display' });
  for (let index = 0; index < 8; index++) {
    features.push({ id: `portico-stair-${index + 1}`, kind: 'stair', polygon: rect(2720, 2918 + index * 10.625, 2834, 2928.625 + index * 10.625), bottom: 0, top: porchFloor / 2 + porchFloor / 2 * (index + 1) / 8, evidence: 'plan-derived-step-display' });
  }
  return features;
}

export const braccioScope = {
  id: 'braccio-nuovo-plan-cutaway-v1',
  completeCompound: false,
  roof: 'omitted-pending-current-geometry',
  stairRisers: 'interpolated-display-not-measured',
  capitals: 'unornamented-envelope',
  sourceDate: 1882,
  calibration: 'printed-graphic-scales-not-a-current-building-survey',
  campusRegistration: 'not-yet-registered',
} as const;
