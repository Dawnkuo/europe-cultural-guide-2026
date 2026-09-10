import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { braccioCalibration, braccioNicheRows, braccioPlanToWorld, braccioPorchColumns, braccioScope, braccioSectionHeight, buildBraccioFeatures } from '../data/braccio-nuovo';
import { buildBraccioNuovoModel } from './braccio-nuovo-model';

function release(model: THREE.Group) {
  model.traverse(object => {
    if (object instanceof THREE.Mesh) {
      object.geometry.dispose();
      (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => material.dispose());
    }
  });
}

describe('Braccio Nuovo source-plan cutaway', () => {
  it('calibrates plan and section independently', () => {
    const [start] = braccioPlanToWorld(braccioCalibration.planBar.from);
    const [end] = braccioPlanToWorld(braccioCalibration.planBar.to);
    expect(end - start).toBeCloseTo(24, 10);
    expect(braccioSectionHeight(1705 - 860)).toBeCloseTo(12, 10);
    expect(braccioSectionHeight(braccioCalibration.sectionCorniceY)).toBeGreaterThan(8);
    expect(braccioSectionHeight(braccioCalibration.sectionCorniceY)).toBeLessThan(9);
    // Independent printed 18.42m porch dimension, not used to set the scale.
    expect(Math.abs((3118 - 2456) / (862 / 24) - 18.42)).toBeLessThan(0.04);
  });
  it('keeps all 28 niches, eight portico columns and stable semantic IDs', () => {
    expect(braccioNicheRows.map(row => row.centers.length)).toEqual([7, 7, 7, 7]);
    expect(braccioPorchColumns).toHaveLength(8);
    const features = buildBraccioFeatures();
    expect(new Set(features.map(feature => feature.id)).size).toBe(features.length);
    expect(features.filter(feature => feature.id.startsWith('portico-column-'))).toHaveLength(8);
    expect(features.filter(feature => feature.kind === 'column')).toHaveLength(52);
    expect(features.filter(feature => feature.id.includes('-niche-floor-'))).toHaveLength(28);
    expect(features.every(feature => feature.top > feature.bottom && feature.evidence)).toBe(true);
  });
  it('does not claim complete campus geometry, a surveyed riser schedule or current roofs', () => {
    expect(braccioScope.completeCompound).toBe(false);
    expect(braccioScope.campusRegistration).toBe('not-yet-registered');
    expect(braccioScope.roof).toBe('omitted-pending-current-geometry');
    expect(buildBraccioFeatures().filter(feature => feature.kind === 'stair').every(feature => feature.evidence === 'plan-derived-step-display')).toBe(true);
  });
  it('builds a bounded, batched model with useful focus regions', () => {
    const model = buildBraccioNuovoModel(THREE, mergeGeometries);
    expect(model.children.length).toBeLessThanOrEqual(6);
    const box = new THREE.Box3().setFromObject(model);
    expect(box.getSize(new THREE.Vector3()).x).toBeCloseTo(20, 5);
    expect(model.userData.focusRegions.map((region: { id: string }) => region.id).sort()).toEqual(['gallery', 'hemicycle', 'portico']);
    for (const region of model.userData.focusRegions) {
      const regionBox = new THREE.Box3(new THREE.Vector3(...region.min), new THREE.Vector3(...region.max));
      expect(box.clone().expandByScalar(0.001).containsBox(regionBox)).toBe(true);
    }
    model.traverse(object => {
      if (object instanceof THREE.Mesh) expect([...object.geometry.getAttribute('position').array].every(Number.isFinite)).toBe(true);
    });
    release(model);
  });
  it('leaves the gallery and porch intercolumniations open', () => {
    const model = buildBraccioNuovoModel(THREE, mergeGeometries);
    model.updateMatrixWorld(true);
    const scale = model.userData.displayScale;
    const [x, z] = braccioPlanToWorld([1900, 2640]);
    const down = new THREE.Raycaster(new THREE.Vector3(x * scale, 25 * scale, z * scale), new THREE.Vector3(0, -1, 0), 0, 24 * scale);
    expect(down.intersectObject(model, true)).toHaveLength(0);
    const [px, pz] = braccioPlanToWorld([2524, 3077]);
    const across = new THREE.Raycaster(new THREE.Vector3(px * scale, 6 * scale, pz * scale - 2 * scale), new THREE.Vector3(0, 0, 1), 0, 3 * scale);
    expect(across.intersectObject(model, true)).toHaveLength(0);
    const [nx, nz] = braccioPlanToWorld([1610, 2478]);
    const nicheFloor = new THREE.Raycaster(new THREE.Vector3(nx * scale, 0.2 * scale, nz * scale), new THREE.Vector3(0, -1, 0), 0, 0.4 * scale);
    expect(nicheFloor.intersectObject(model, true).length).toBeGreaterThan(0);
    release(model);
  });
});
