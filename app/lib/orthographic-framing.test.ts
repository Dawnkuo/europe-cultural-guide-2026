import { describe, expect, it } from 'vitest';
import { Box3, Euler, Quaternion, Vector3 } from 'three';
import { projectedHalfHeight } from './orthographic-framing';

describe('whole-model orthographic scale', () => {
  const complete = new Box3(new Vector3(-300, -28, -280), new Vector3(300, 135, 280));
  it('does not redefine 100% for a focused or translated region', () => {
    const q = new Quaternion().setFromEuler(new Euler(-.9, -.4, 0));
    for (const aspect of [.32, .39, .82, 1.44]) {
      const full = projectedHalfHeight(complete, q, aspect);
      const focused = new Box3(new Vector3(10, 0, 0), new Vector3(140, 0, 130));
      expect(full / projectedHalfHeight(focused, q, aspect)).toBeGreaterThan(3);
      expect(projectedHalfHeight(complete.clone().translate(new Vector3(1000, 250, -500)), q, aspect)).toBeCloseTo(full, 9);
    }
  });
  it('frames every full-model corner for changed orientation and portrait aspect', () => {
    for (const angle of [0, .3, 1, 2]) {
      const q = new Quaternion().setFromEuler(new Euler(-.8, angle, 0));
      const h = projectedHalfHeight(complete, q, .39);
      const center = complete.getCenter(new Vector3());
      for (const x of [complete.min.x, complete.max.x]) for (const y of [complete.min.y, complete.max.y]) for (const z of [complete.min.z, complete.max.z]) {
        const p = new Vector3(x, y, z).sub(center).applyQuaternion(q.clone().invert());
        expect(Math.abs(p.y)).toBeLessThan(h);
        expect(Math.abs(p.x)).toBeLessThan(h * .39);
      }
    }
  });
});
