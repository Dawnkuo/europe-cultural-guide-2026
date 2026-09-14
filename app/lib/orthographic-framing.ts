import { Box3, Quaternion, Vector3 } from 'three';

// Project around the box's centre, so a focused target cannot redefine 100%.
export function projectedHalfHeight(box: Box3, orientation: Quaternion, aspect: number, padding = 1.1) {
  if (box.isEmpty() || !(aspect > 0)) throw new Error('Invalid orthographic bounds');
  const center = box.getCenter(new Vector3());
  const inverse = orientation.clone().invert();
  let halfX = 0;
  let halfY = 0;
  for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
    const p = new Vector3(x, y, z).sub(center).applyQuaternion(inverse);
    halfX = Math.max(halfX, Math.abs(p.x));
    halfY = Math.max(halfY, Math.abs(p.y));
  }
  return Math.max(halfY, halfX / aspect, .01) * padding;
}
