import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { buildVaticanLibraryModel } from './vatican-library-model';
import { libraryBayEdges, libraryCalibration, libraryHeight, libraryPiers, libraryPlanPPM, librarySectionPPM, libraryScope, librarySpaces, libraryWalls } from '../data/vatican-library';

describe('Sistine library source cutaway', () => {
  it('keeps the sixfold difference between independent printed scales', () => {
    expect(librarySectionPPM / libraryPlanPPM).toBeCloseTo(6, 1);
    expect(libraryHeight(libraryCalibration.sectionFloorY)).toBe(0);
    expect(libraryHeight(libraryCalibration.sectionCrownY)).toBeGreaterThan(8);
    expect(libraryHeight(libraryCalibration.sectionCrownY)).toBeLessThan(10);
  });
  it('preserves six observed piers, seven bays and both vestibules', () => {
    expect(libraryPiers).toHaveLength(6);
    expect(libraryBayEdges).toHaveLength(8);
    expect(librarySpaces.map(s => s.id)).toEqual(['west-vestibule', 'sistine-hall', 'east-vestibule']);
    expect(new Set(libraryBayEdges.slice(1).map((p, i) => p - libraryBayEdges[i])).size).toBeGreaterThan(4);
    for (const [a, b, c, d] of [...libraryWalls, ...libraryPiers]) { expect(c).toBeGreaterThan(a); expect(d).toBeGreaterThan(b); }
    for (const { label: [x, y] } of librarySpaces) {
      expect([...libraryWalls, ...libraryPiers].some(([a, b, c, d]) => x >= a && x <= c && y >= b && y <= d)).toBe(false);
    }
  });
  it('has finite geometry, open interior and no invented lower floors', () => {
    const { model, dispose } = buildVaticanLibraryModel();
    try {
      expect(model.userData).toMatchObject({ ...libraryScope, piers: 6, baysPerAisle: 7 });
      const bounds = new THREE.Box3().setFromObject(model);
      expect(bounds.getSize(new THREE.Vector3()).x).toBeGreaterThan(70);
      expect(bounds.getSize(new THREE.Vector3()).x).toBeLessThan(90);
      expect(model.children.length).toBeLessThanOrEqual(4);
      model.traverse(object => {
        if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments) {
          expect(Array.from(object.geometry.attributes.position.array).every(Number.isFinite)).toBe(true);
        }
      });
      const meshOnly = model.children.filter(o => o instanceof THREE.Mesh);
      const ray = new THREE.Raycaster(new THREE.Vector3(0, 30, 4), new THREE.Vector3(0, -1, 0));
      const hits = ray.intersectObjects(meshOnly, true);
      expect(hits.length).toBeGreaterThan(0);
      expect(hits[0].point.y).toBeCloseTo(0, 5);
    } finally { dispose(); }
  });
});
