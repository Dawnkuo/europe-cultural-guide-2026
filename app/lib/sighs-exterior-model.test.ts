import { afterAll, describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { sighsExterior } from '../data/sighs-exterior';
import { buildSighsExterior } from './sighs-exterior-model';

const model = buildSighsExterior(THREE, mergeGeometries);
model.updateMatrixWorld(true);
function ray(start: number[], end: number[]) {
  const a = new THREE.Vector3(...start), b = new THREE.Vector3(...end);
  return new THREE.Raycaster(a, b.clone().sub(a).normalize(), 0, a.distanceTo(b)).intersectObject(model, true);
}
afterAll(() => model.traverse(object => {
  if (object instanceof THREE.Mesh) {
    object.geometry.dispose(); (object.material as THREE.Material).dispose();
  }
}));
describe('Bridge of Sighs exterior', () => {
  it('has independently articulated fronts and four open windows', () => {
    expect(model.userData.id).toBe('sighs-double-passage');
    expect(model.userData.featureCounts['windowed-face']).toBe(2);
    expect(model.userData.featureCounts['open-window-frame']).toBe(4);
    expect(model.userData.featureCounts['north-shield-envelope']).toBe(1);
    expect(model.userData.featureCounts['south-shield-envelope']).toBe(1);
    expect(model.userData.featureCounts['passage-divider']).toBe(1);
    expect(model.userData.sourceState).not.toMatch(/survey/);
  });
  it('keeps the canal arch actually open through the full bridge depth', () => {
    for (const x of [-4, -2, 0, 2, 4]) {
      expect(ray([x, 0.45, 4], [x, 0.45, -4])).toHaveLength(0);
    }
    expect(ray([0, 3.1, 4], [0, 3.1, -4]).length).toBeGreaterThan(0);
  });
  it('has two distinct empty passages, separated by the plan-supported wall', () => {
    for (const z of [-1.5, 1.5]) expect(ray([-6.5, 4.5, z], [6.5, 4.5, z])).toHaveLength(0);
    expect(ray([-6.5, 4.5, 0], [6.5, 4.5, 0]).length).toBeGreaterThan(0);
    expect(ray([0, 4.5, 1.5], [0, 4.5, -1.5]).length).toBeGreaterThan(0);
  });
  it('leaves real interstices in each stone grille, not a dark texture', () => {
    const { width, height, sill } = sighsExterior.window;
    for (const center of sighsExterior.windowCenters) for (const side of [-1, 1]) {
      // Between radial bars, in the centre cell.
      const x = center + width / 3 * 0.30, y = sill + height / 2 + 0.054;
      expect(ray([x, y, side * 3.4], [x, y, side * 2.1])).toHaveLength(0);
      expect(ray([center, sill + height / 2, side * 3.4], [center, sill + height / 2, side * 2.1]).length).toBeGreaterThan(0);
    }
  });
  it('batches all geometry in four materials with finite normalized data', () => {
    expect(model.children).toHaveLength(4);
    let triangles = 0;
    for (const child of model.children as THREE.Mesh[]) {
      const position = child.geometry.getAttribute('position');
      expect([...position.array].every(Number.isFinite)).toBe(true);
      triangles += position.count / 3;
    }
    expect(triangles).toBeLessThan(110000);
    expect(new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3()).x).toBeCloseTo(2 * Math.max(...sighsExterior.pilasters) + 0.57, 5);
    expect(sighsExterior.focusRegions.map(region => region.id)).toEqual(['south', 'north', 'arch']);
    expect(sighsExterior.focusRegions.find(region => region.id === 'north')!.direction[2]).toBeLessThan(0);
  });
});
