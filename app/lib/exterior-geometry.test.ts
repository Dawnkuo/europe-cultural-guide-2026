import * as THREE from "three";
import { describe, expect, it } from "vitest";
import {
  perspectiveBoxFitDistance,
  perspectiveFitDistance,
  specialExteriorGeometry,
} from "./exterior-geometry";

describe("exterior model geometry", () => {
  for (const kind of [
    "dragon-roof",
    "wavy-facade",
    "curved-facade",
    "gaudi-bell-tower",
    "dome",
  ]) {
    it(`${kind} uses a finite shaped surface, not an empty mesh`, () => {
      const geometry = specialExteriorGeometry(THREE, kind)!;
      expect(geometry.getAttribute("position").count).toBeGreaterThan(20);
      expect(
        [...geometry.getAttribute("position").array].every(Number.isFinite),
      ).toBe(true);
      geometry.computeBoundingBox();
      const size = geometry.boundingBox!.getSize(new THREE.Vector3());
      expect(size.x).toBeGreaterThan(0.5);
      expect(size.y).toBeCloseTo(1);
      expect(size.z).toBeGreaterThan(0.5);
      geometry.dispose();
    });
  }

  it("does not draw the dragon-back roof as a cone", () => {
    expect(specialExteriorGeometry(THREE, "dragon-roof")).toBeInstanceOf(
      THREE.ExtrudeGeometry,
    );
  });

  it("fits the whole bounding sphere in portrait and landscape views", () => {
    for (const aspect of [0.36, 0.6, 1, 1.8, 2.4]) {
      const distance = perspectiveFitDistance(10, aspect, 35);
      const camera = new THREE.PerspectiveCamera(35, aspect, 0.1, 1000);
      camera.position.z = distance;
      camera.updateMatrixWorld();
      for (const point of [
        new THREE.Vector3(10, 0, 0),
        new THREE.Vector3(0, 10, 0),
        new THREE.Vector3(-10, 0, 0),
      ]) {
        point.project(camera);
        expect(Math.abs(point.x)).toBeLessThan(0.9);
        expect(Math.abs(point.y)).toBeLessThan(0.9);
      }
    }
  });

  it("fits an elongated compound without clipping corners at any tested aspect", () => {
    const size: [number, number, number] = [12, 7, 22];
    for (const aspect of [0.36, 0.6, 1, 1.8, 2.4])
      for (const direction of [
        [3, 6, 15],
        [15, 8, 2],
        [0, 1, 0],
      ] as [number, number, number][]) {
        const distance = perspectiveBoxFitDistance(size, direction, aspect, 35);
        const camera = new THREE.PerspectiveCamera(35, aspect, 0.1, 1000);
        camera.position.copy(
          new THREE.Vector3(...direction).normalize().multiplyScalar(distance),
        );
        if (direction[0] === 0 && direction[2] === 0) camera.up.set(0, 0, -1);
        camera.lookAt(0, 0, 0);
        camera.updateMatrixWorld();
        for (const x of [-6, 6])
          for (const y of [-3.5, 3.5])
            for (const z of [-11, 11]) {
              const p = new THREE.Vector3(x, y, z).project(camera);
              expect(Math.abs(p.x)).toBeLessThanOrEqual(0.93);
              expect(Math.abs(p.y)).toBeLessThanOrEqual(0.93);
            }
      }
  });
});
