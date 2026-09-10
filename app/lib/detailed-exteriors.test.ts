import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { buildDetailedExterior } from './detailed-exteriors';

describe('source-reviewed exterior silhouettes', () => {
  it.each(['sagrada-familia', 'casa-batllo', 'pantheon'])(
    'builds finite, bounded and batched geometry for %s',
    (slug) => {
      const model = buildDetailedExterior(THREE, mergeGeometries, slug)!;
      expect(model.children.length).toBeLessThan(16);
      const box = new THREE.Box3().setFromObject(model);
      expect(box.min.y).toBeGreaterThan(-0.5);
      expect(box.max.y).toBeLessThan(16);
      expect(box.max.y).toBeGreaterThan(8);
      model.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          const positions = object.geometry.getAttribute('position');
          expect([...positions.array].every(Number.isFinite)).toBe(true);
          object.geometry.dispose();
          for (const material of Array.isArray(object.material)
            ? object.material
            : [object.material])
            material.dispose();
        }
      });
    },
  );
  it('keeps the 2026 tower groups distinct instead of drawing four unbuilt Glory towers', () => {
    const model = buildDetailedExterior(
      THREE,
      mergeGeometries,
      'sagrada-familia',
    )!;
    expect(model.userData.featureCounts).toMatchObject({
      'nativity-tower': 4,
      'passion-tower': 4,
      'evangelist-tower': 4,
      'mary-tower': 1,
      'jesus-tower': 1,
    });
    expect(model.userData.featureCounts['glory-tower']).toBeUndefined();
  });
  it('retains the eight mask balconies and separate upper tulip shown by the elevation', () => {
    const model = buildDetailedExterior(THREE, mergeGeometries, 'casa-batllo')!;
    expect(model.userData.featureCounts).toMatchObject({
      'mask-balcony': 8,
      'tulip-balcony': 1,
      'dragon-roof': 1,
      'cross-turret': 1,
    });
  });
  it('does not silently substitute this facade for another venue', () => {
    expect(
      buildDetailedExterior(THREE, mergeGeometries, 'uffizi'),
    ).toBeUndefined();
  });
  it('opens the Pantheon porch with all sixteen plan-derived columns and a real oculus', () => {
    const model = buildDetailedExterior(THREE, mergeGeometries, 'pantheon')!;
    expect(model.userData.featureCounts).toMatchObject({
      'front-granite-column': 8,
      'rear-granite-column': 8,
      'front-pediment': 1,
      'stepped-dome-with-open-oculus': 1,
    });
    expect(model.userData.porticoColumnCenters).toHaveLength(16);
    expect(model.userData.featureCounts['portico']).toBeUndefined();
    model.updateMatrixWorld(true);
    // A ray through the dome crown must pass through empty sky, not a cap.
    const ray = new THREE.Raycaster(new THREE.Vector3(0, 15, 0), new THREE.Vector3(0, -1, 0), 0, 6.7);
    expect(ray.intersectObject(model, true)).toHaveLength(0);
  });
});
