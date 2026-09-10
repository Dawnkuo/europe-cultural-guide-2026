import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { pisaAxisX, pisaExterior, pisaLevels, pisaRadians, pisaSectionAngle } from '../data/pisa-exterior';
import { buildPisaExterior } from './pisa-exterior-model';

function point(x: number, y: number, z: number) {
  const angle = pisaSectionAngle(y);
  return new THREE.Vector3(pisaAxisX(y) + x * Math.cos(angle), y - x * Math.sin(angle), z).multiplyScalar(pisaExterior.displayScale);
}

describe('Pisa surveyed exterior', () => {
  it('retains all six measured loggia sections, without inventing indoor floors', () => {
    const levels = pisaLevels();
    expect(levels.map(level => Number(level.bottom.toFixed(2)))).toEqual([11.62, 17.47, 23.42, 29.26, 35.02, 40.68]);
    expect(levels.at(-1)!.top).toBe(46.98);
    expect(pisaExterior.belfry.base - levels.at(-1)!.top).toBeCloseTo(1.24, 8);
    expect(pisaExterior.belfry.top + 2.9).toBeCloseTo(58.42, 8);
    expect(levels.map(level => level.innerRadius * 2)).toEqual([7.50, 7.53, 7.57, 7.59, 7.62, 7.65]);
  });
  it('keeps the measured nonuniform lean continuous across every floor', () => {
    for (const level of pisaLevels()) {
      expect(pisaSectionAngle(level.bottom)).toBeCloseTo(pisaRadians(level.tilt), 9);
      expect(pisaAxisX(level.bottom + 0.00001) - pisaAxisX(level.bottom - 0.00001)).toBeLessThan(0.00001);
      expect(Math.abs(pisaSectionAngle(level.bottom + 0.00001) - pisaSectionAngle(level.bottom - 0.00001))).toBeLessThan(0.00001);
    }
    expect(pisaSectionAngle(55)).toBeLessThan(pisaSectionAngle(25));
    expect(pisaAxisX(55)).toBeGreaterThan(4);
    expect(pisaAxisX(55)).toBeLessThan(5);
    expect(point(-7, 17.47, 0).y).toBeGreaterThan(point(7, 17.47, 0).y);
  });
  it('builds 15 base arches, 180 loggia columns and distinct high/low belfry openings', () => {
    const model = buildPisaExterior(THREE, mergeGeometries);
    const counts = model.userData.featureCounts;
    expect(counts['base-blind-arch']).toBe(15);
    expect(counts['base-engaged-column']).toBe(15);
    expect(counts['loggia-column']).toBe(180);
    expect(counts['loggia-open-arch']).toBe(180);
    expect(counts['loggia-floor']).toBe(6);
    expect(counts['upper-core-opening']).toBe(6);
    expect(counts['belfry-large-opening']).toBe(6);
    expect(counts['belfry-high-opening']).toBe(6);
    expect(counts['belfry-column']).toBe(12);
    expect(counts['base-door']).toBe(1);
    expect(counts['invented-interior-stairs']).toBeUndefined();
    expect(model.children).toHaveLength(4);
    const bounds = new THREE.Box3().setFromObject(model);
    expect(bounds.getSize(new THREE.Vector3()).y).toBeGreaterThan(10);
    for (const range of model.userData.focusRegions) {
      expect(bounds.clone().expandByScalar(0.00001).containsBox(new THREE.Box3(new THREE.Vector3(...range.min), new THREE.Vector3(...range.max)))).toBe(true);
    }
    expect(model.userData.focusRegions.map((range: {id: string}) => range.id)).toEqual(['base', 'loggias', 'belfry']);
    model.traverse(object => { if (object instanceof THREE.Mesh) {
      expect([...object.geometry.getAttribute('position').array].every(Number.isFinite)).toBe(true);
      object.geometry.dispose();
      (object.material as THREE.Material).dispose();
    }});
  });
  it('leaves every outer loggia passage open and keeps the central shaft hollow', () => {
    const model = buildPisaExterior(THREE, mergeGeometries);
    model.updateMatrixWorld(true);
    function between(a: THREE.Vector3, b: THREE.Vector3) {
      return new THREE.Raycaster(a, b.clone().sub(a).normalize(), 0, a.distanceTo(b)).intersectObject(model, true);
    }
    for (const level of pisaLevels()) {
      const y = level.bottom + 1.8;
      expect(between(point(0, y, level.outerRadius + 0.5), point(0, y, level.coreRadius + 0.15))).toHaveLength(0);
    }
    expect(between(point(0, 30, 0), point(0, 26, 0))).toHaveLength(0);
    expect(between(point(0, 3, 9), point(0, 3, 3))).toHaveLength(0);
    // Large bell opening reaches the floor; alternating high opening has a sill.
    expect(between(point(0, 50, 7), point(0, 50, 3.5))).toHaveLength(0);
    const a = Math.PI / 6;
    expect(between(point(Math.sin(a) * 7, 50, Math.cos(a) * 7), point(Math.sin(a) * 3.5, 50, Math.cos(a) * 3.5)).length).toBeGreaterThan(0);
    expect(between(point(Math.sin(a) * 7, 52, Math.cos(a) * 7), point(Math.sin(a) * 3.5, 52, Math.cos(a) * 3.5))).toHaveLength(0);
    model.traverse(object => { if (object instanceof THREE.Mesh) { object.geometry.dispose(); (object.material as THREE.Material).dispose(); } });
  });
});
