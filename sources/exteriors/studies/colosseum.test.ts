import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { buildColosseumExterior, colosseumOutline } from './colosseum';

function dispose(model: THREE.Group) {
  model.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    object.geometry.dispose();
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) material.dispose();
  });
}

describe('unreleased Colosseum arcade study', () => {
  it('preserves equal-axis dimensions and closes its four-centre curve', () => {
    expect(colosseumOutline(0)).toEqual(colosseumOutline(1));
    expect(colosseumOutline(0)[0]).toBeCloseTo(94 * 0.075);
    expect(colosseumOutline(0.25)[1]).toBeCloseTo(78 * 0.075);
    for (let i = 0; i < 1600; i++) {
      const a = colosseumOutline(i / 1600), b = colosseumOutline((i + 1) / 1600);
      expect(Math.hypot(b[0] - a[0], b[1] - a[1])).toBeLessThan(0.04);
    }
  });
  it('batches finite geometry without replacing the missing southern facade', () => {
    const model = buildColosseumExterior(THREE, mergeGeometries);
    expect(model.userData.scope).toContain('pending');
    expect(model.children).toHaveLength(3);
    expect(model.userData.featureCounts).toMatchObject({ 'north-arcade-1': 39, 'north-arcade-2': 39, 'north-arcade-3': 39, 'north-attic': 39 });
    expect(model.userData.northBays.every((bay: number) => bay >= 40)).toBe(true);
    expect(model.userData.featureCounts['south-outer-arcade']).toBeUndefined();
    model.traverse(object => {
      if (object instanceof THREE.Mesh) expect([...object.geometry.getAttribute('position').array].every(Number.isFinite)).toBe(true);
    });
    const bounds = new THREE.Box3().setFromObject(model);
    expect(bounds.max.y).toBeLessThan(4);
    expect(bounds.min.y).toBeGreaterThanOrEqual(0.07);
    dispose(model);
  });
  it('has genuine north arch apertures and no arena lid', () => {
    const model = buildColosseumExterior(THREE, mergeGeometries);
    model.updateMatrixWorld(true);
    const t = (model.userData.bayStations[59] + model.userData.bayStations[60]) / 2;
    const [x, z] = colosseumOutline(t);
    const direction = new THREE.Vector3(-x, 0, -z).normalize();
    const ray = new THREE.Raycaster(new THREE.Vector3(x, 0.27, z).addScaledVector(direction, -0.4), direction, 0, 0.8);
    expect(ray.intersectObject(model, true)).toHaveLength(0);
    const overhead = new THREE.Raycaster(new THREE.Vector3(0, 5, 0), new THREE.Vector3(0, -1, 0));
    expect(overhead.intersectObject(model, true)).toHaveLength(0);
    dispose(model);
  });
});
