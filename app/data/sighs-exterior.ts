// Exterior proportions only, not metres or a replacement visitor floor plan.
// The plan/photo correspondence and uncertainty are recorded in the review.
export const sighsExterior = {
  id: 'sighs-double-passage',
  sourceState: 'plan-and-photo-derived-exterior',
  halfSpan: 6,
  halfDepth: 2.72,
  wall: 0.40,
  divider: 0.68,
  floor: 3.50,
  cornice: 6.40,
  windowCenters: [-2.36, 2.36],
  window: { sill: 4.73, width: 1.22, height: 1.24 },
  pilasters: [-5.91, -3.54, -1.18, 1.18, 3.54, 5.91],
  // Sampled contour of MUVE's south photograph, mapped by one uniform scale.
  // Non-coplanar carving is reduced to its envelope; it is not a relief scan.
  crest: [
    [-6, 6.64], [-5.92, 7.30], [-5.63, 7.92], [-5.35, 8.18],
    [-4.96, 8.36], [-4.43, 8.44], [-4.20, 8.67], [-4.20, 9.24],
    [-3.78, 9.24], [-3.78, 8.84], [-3.40, 8.63], [-2.87, 8.70],
    [-2.34, 8.88], [-2.01, 9.14], [-1.72, 9.69], [-1.33, 9.94],
    [-0.80, 10.10], [-0.28, 9.94], [-0.28, 10.14], [0.28, 10.14],
    [0.28, 9.94], [0.78, 10.10], [1.30, 9.97], [1.75, 9.64],
    [2.06, 9.11], [2.46, 8.83], [3.05, 8.68], [3.40, 8.62],
    [3.74, 8.87], [3.74, 9.21], [4.21, 9.21], [4.21, 8.74],
    [4.65, 8.54], [5.08, 8.46], [5.49, 8.22], [5.79, 7.87],
    [5.98, 7.20], [6, 6.64],
  ],
  focusRegions: [
    { id: 'south', min: [-6.12, 0, 2.30], max: [6.12, 10.20, 3.05], direction: [0, 1.4, 16] },
    { id: 'north', min: [-6.12, 0, -3.05], max: [6.12, 10.20, -2.30], direction: [0, 1.4, -16] },
    { id: 'arch', min: [-3.8, 1.5, -2.9], max: [3.8, 3.65, 2.9], direction: [1.3, -0.9, 16] },
  ],
} as const;
