import type { PlanPoint } from './braccio-nuovo';

// Two fitted axes and two independent fountain checks. No non-uniform stretching.
// Derivation and source hashes live in sources/exteriors/vatican-registration-*.json.
export const vaticanRegistration = {
  a: 0.037694703625716953,
  b: 2.160052845571907,
  tx: 639.453170280671,
  ty: 1673.5970633468105,
  pixelsPerMeshUnit: 2.160381722368694,
  campusOrigin: [1100, 1890] as PlanPoint,
  campusViewBox: [385, 1270, 1430, 1240] as const,
  // A display underlay below the entire source mesh, not a surveyed common site datum.
  displayPlaneY: -28,
  scope: 'registered-basilica-square-and-sistine-with-flat-campus-context',
  completeCompound: false,
  braccioRegistration: 'pending-historical-and-current-alignment',
} as const;

type MeshPoint = [number, number, number];
type CampusMeshFocus = {
  min: MeshPoint;
  max: MeshPoint;
  direction?: MeshPoint;
  marker?: MeshPoint;
};

// Viewing bounds in the unchanged source mesh, not surveyed building boundaries.
// Sistine roof identification/ray samples: sources/exteriors/sistine-mesh-review.md.
export const campusMeshFocus: Partial<Record<string, CampusMeshFocus>> = {
  basilica: { min: [-128, -28, -110], max: [106, 134, 110] },
  square: { min: [98, -28, -134], max: [382, 28, 128] },
  sistine: {
    min: [27, 11, -96], max: [75, 51, -71],
    direction: [.35, 1.8, -.8],
    // Selection annotation above the sampled ridge (Y=49.385), not an entrance.
    marker: [50, 50.9, -85],
  },
};

export function rawStPetersToCampus([x, z]: PlanPoint): PlanPoint {
  const { a, b, tx, ty } = vaticanRegistration;
  return [a * x - b * z + tx, b * x + a * z + ty];
}

export function campusToScene([x, y]: PlanPoint): PlanPoint {
  const { campusOrigin, pixelsPerMeshUnit } = vaticanRegistration;
  return [(x - campusOrigin[0]) / pixelsPerMeshUnit, (y - campusOrigin[1]) / pixelsPerMeshUnit];
}
