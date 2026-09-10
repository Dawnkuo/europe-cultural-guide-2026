// ISPRS 2003, printed p.19/Fig.6: dimensions from the May 2001 survey.
// Full claim/evidence boundaries are in sources/exteriors/pisa-review.md.
export const pisaExterior = {
  id: 'pisa-arcaded-tower',
  displayScale: 0.18,
  sourceState: '2001-survey-derived-exterior',
  referenceHeight: 46.98,
  base: { innerRadius: 3.75, outerRadius: 7.83, arches: 15 },
  loggias: [
    { id: 'loggia-1', drop: 35.36, innerDiameter: 7.50, wall: 2.69, gallery: 1.95, tilt: [4, 59, 35] },
    { id: 'loggia-2', drop: 29.51, innerDiameter: 7.53, wall: 2.60, gallery: 1.96, tilt: [5, 5, 36] },
    { id: 'loggia-3', drop: 23.56, innerDiameter: 7.57, wall: 2.49, gallery: 1.98, tilt: [5, 14, 29] },
    { id: 'loggia-4', drop: 17.72, innerDiameter: 7.59, wall: 2.51, gallery: 1.90, tilt: [4, 57, 48] },
    { id: 'loggia-5', drop: 11.96, innerDiameter: 7.62, wall: 2.49, gallery: 1.86, tilt: [4, 43, 40] },
    { id: 'loggia-6', drop: 6.30, innerDiameter: 7.65, wall: 2.51, gallery: 1.93, tilt: [4, 13, 31] },
  ],
  columnsPerLoggia: 30,
  belfry: {
    base: 48.22,
    top: 55.52,
    outerRadius: 5.95,
    innerRadius: 4.45,
    bigOpenings: 6,
    highOpenings: 6,
    tilt: [3, 10, 0],
  },
  // Unlabelled moulding, capital and opening profiles are controlled visual
  // simplifications of the surveyed/historical elevations, not measured sizes.
  detail: {
    shaftRadius: 0.23,
    capitalWidth: 0.77,
    floorThickness: 0.23,
    archBand: 0.19,
    balconyProjection: 0.14,
    entranceWidth: 1.8,
    entranceHeight: 6.1,
    belfrySill: 3.35,
  },
} as const;

export function pisaRadians(dms: readonly number[]) {
  return (dms[0] + dms[1] / 60 + dms[2] / 3600) * Math.PI / 180;
}

export function pisaLevels() {
  return pisaExterior.loggias.map((record, index, rows) => ({
    ...record,
    bottom: pisaExterior.referenceHeight - record.drop,
    top: index + 1 < rows.length ? pisaExterior.referenceHeight - rows[index + 1].drop : pisaExterior.referenceHeight,
    innerRadius: record.innerDiameter / 2,
    coreRadius: record.innerDiameter / 2 + record.wall,
    outerRadius: record.innerDiameter / 2 + record.wall + record.gallery,
    angle: pisaRadians(record.tilt),
  }));
}

// Integrate the surveyed segment slopes, not an arbitrary horizontal shift
// applied independently to each floor. This keeps adjoining rings continuous.
function pisaSpine() {
  const levels = pisaLevels();
  return [
    { y: 0, slope: Math.tan(levels[0].angle) },
    ...levels.map(level => ({ y: level.bottom, slope: Math.tan(level.angle) })),
    { y: pisaExterior.referenceHeight, slope: Math.tan(levels.at(-1)!.angle) },
    { y: pisaExterior.belfry.base, slope: Math.tan(pisaRadians(pisaExterior.belfry.tilt)) },
    { y: pisaExterior.belfry.top + 1, slope: Math.tan(pisaRadians(pisaExterior.belfry.tilt)) },
  ];
}

export function pisaAxisX(height: number) {
  const knots = pisaSpine();
  return knots.slice(0, -1).reduce((offset, start, index) => {
    const end = knots[index + 1], span = end.y - start.y;
    const dy = Math.max(0, Math.min(height - start.y, span));
    return offset + start.slope * dy + (end.slope - start.slope) * dy * dy / (2 * span);
  }, 0);
}

export function pisaSectionAngle(height: number) {
  const knots = pisaSpine();
  const index = knots.findIndex(point => point.y >= height);
  if (index <= 0) return Math.atan((index === 0 ? knots[0] : knots.at(-1)!).slope);
  const start = knots[index - 1], end = knots[index];
  return Math.atan(start.slope + (end.slope - start.slope) * (height - start.y) / (end.y - start.y));
}
