import { readFile, writeFile } from 'node:fs/promises';

const controls = JSON.parse(await readFile('sources/exteriors/vatican-registration-controls.json', 'utf8'));
const [p, q] = controls.fit;
const dx = q.meshXZ[0] - p.meshXZ[0];
const dz = q.meshXZ[1] - p.meshXZ[1];
const du = q.imageXY[0] - p.imageXY[0];
const dv = q.imageXY[1] - p.imageXY[1];
const denominator = dx * dx + dz * dz;
const a = (dx * du + dz * dv) / denominator;
const b = (dx * dv - dz * du) / denominator;
const tx = p.imageXY[0] - a * p.meshXZ[0] + b * p.meshXZ[1];
const ty = p.imageXY[1] - b * p.meshXZ[0] - a * p.meshXZ[1];
const project = ([x, z]) => [a * x - b * z + tx, b * x + a * z + ty];
const holdout = controls.holdout.map(point => {
  const predicted = project(point.meshXZ);
  const residualPixels = Math.hypot(predicted[0] - point.imageXY[0], predicted[1] - point.imageXY[1]);
  return { id: point.id, predicted, observed: point.imageXY, residualPixels, accepted: residualPixels <= point.tolerancePixels };
});
if (holdout.some(point => !point.accepted)) throw new Error('Vatican horizontal registration failed independent fountain checks');
const result = {
  id: 'vatican-horizontal-registration-v1',
  coefficients: { a, b, tx, ty },
  formula: ['u=a*x-b*z+tx', 'v=b*x+a*z+ty'],
  pixelsPerMeshUnit: Math.hypot(a, b),
  holdout,
  completeCompound: false,
  verticalRegistration: 'unknown-outside-official-mesh',
};
await writeFile('sources/exteriors/vatican-registration-fit.json', JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
