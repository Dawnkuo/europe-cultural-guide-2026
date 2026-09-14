// @vitest-environment node
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { campusMeshFocus, campusToScene, rawStPetersToCampus, vaticanRegistration } from '../data/vatican-registration';
import { registerCampusStPeters } from './vatican-campus-model';

describe('Vatican horizontal source registration', () => {
  it('matches the reproducible fit and independently withheld fountain positions', async () => {
    const fit = JSON.parse(await readFile('sources/exteriors/vatican-registration-fit.json', 'utf8'));
    const controls = JSON.parse(await readFile('sources/exteriors/vatican-registration-controls.json', 'utf8'));
    const campusVector = await readFile('public/maps/vatican-campus.svg');
    expect(createHash('sha256').update(campusVector).digest('hex')).toBe('1df82a74893da58be5338b78fdd30cc612dc2614554fb796d86d117cb6081908');
    for (const key of ['a', 'b', 'tx', 'ty'] as const) expect(vaticanRegistration[key]).toBe(fit.coefficients[key]);
    for (const point of controls.fit) {
      const mapped = rawStPetersToCampus(point.meshXZ);
      expect(mapped[0]).toBeCloseTo(point.imageXY[0], 8);
      expect(mapped[1]).toBeCloseTo(point.imageXY[1], 8);
    }
    for (const point of controls.holdout) {
      const mapped = rawStPetersToCampus(point.meshXZ);
      expect(Math.hypot(mapped[0] - point.imageXY[0], mapped[1] - point.imageXY[1])).toBeLessThan(point.tolerancePixels);
    }
  });

  it('rotates and translates the untouched source without changing lengths, heights or handedness', () => {
    const source = new THREE.Group();
    const model = registerCampusStPeters(source);
    expect(model.scale.toArray()).toEqual([1, 1, 1]);
    expect(model.matrixWorld.determinant()).toBeCloseTo(1, 10);
    for (const point of [[-37.3129, 132, .0216], [284.4213, 26, 1.0066], [-127, -27.59, 127]]) {
      const actual = new THREE.Vector3(...point).applyMatrix4(model.matrixWorld);
      const [x, z] = campusToScene(rawStPetersToCampus([point[0], point[2]]));
      expect(actual.x).toBeCloseTo(x, 8);
      expect(actual.z).toBeCloseTo(z, 8);
      expect(actual.y).toBe(point[1]);
    }
    expect(source.position.toArray()).toEqual([0, 0, 0]);
    expect(source.scale.toArray()).toEqual([1, 1, 1]);
  });

  it('centres the original planar view box and does not claim museum geometry or a common elevation', () => {
    const [left, top, width, height] = vaticanRegistration.campusViewBox;
    expect(campusToScene([left + width / 2, top + height / 2])).toEqual([0, 0]);
    expect(vaticanRegistration.completeCompound).toBe(false);
    expect(vaticanRegistration.braccioRegistration).toMatch(/pending/);
    expect(vaticanRegistration.displayPlaneY).toBeLessThan(-27.590237534454282);
  });

  it('frames the actual Sistine roof rather than its flat campus annotation', async () => {
    const source = await readFile('public/models/st-peters-exterior.glb');
    expect(createHash('sha256').update(source).digest('hex')).toBe('c674af8ffc340d7362ee044b5f3e00312abe91d0484989ed4cb12ea7294f6508');
    const focus = campusMeshFocus.sistine!;
    const bounds = new THREE.Box3(new THREE.Vector3(...focus.min), new THREE.Vector3(...focus.max));
    expect(bounds.containsPoint(new THREE.Vector3(50, 49.385, -85))).toBe(true);
    expect(focus.marker![1]).toBeGreaterThan(49.385);
    expect(focus.marker![1] - 49.385).toBeLessThan(2);
    expect(focus.direction![1]).toBeGreaterThan(Math.hypot(focus.direction![0], focus.direction![2]));
    const registration = registerCampusStPeters(new THREE.Group());
    const center = bounds.clone().applyMatrix4(registration.matrixWorld).getCenter(new THREE.Vector3());
    const [x, z] = campusToScene(rawStPetersToCampus([51, -83.5]));
    expect(center.x).toBeCloseTo(x, 8);
    expect(center.y).toBe(31);
    expect(center.z).toBeCloseTo(z, 8);
    expect(campusMeshFocus['new-wing']).toBeUndefined();
    expect(campusMeshFocus.palace).toBeUndefined();
  });
});
