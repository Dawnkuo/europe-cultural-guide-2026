import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { buildStPetersExterior } from "./st-peters-massing";
import { stPetersPlan, stPetersWorld } from "./st-peters-plan";

function dispose(model: THREE.Group) {
  model.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.geometry.dispose();
      for (const m of Array.isArray(o.material) ? o.material : [o.material])
        m.dispose();
    }
  });
}

describe("superseded St Peter silhouette study (not site acceptance)", () => {
  it("uses equal-scale reviewed overhead coordinates, not the indoor floor diagram", () => {
    const a = stPetersWorld([500, 670]),
      x = stPetersWorld([600, 670]),
      z = stPetersWorld([500, 770]);
    expect(a).toEqual([0, 0]);
    expect(x[0]).toEqual(z[1]);
    for (const outline of [
      stPetersPlan.basilica,
      stPetersPlan.sacristy,
      stPetersPlan.northArm,
      stPetersPlan.southArm,
    ]) {
      expect(outline[0]).toEqual(outline.at(-1));
      expect(outline.flat().every(Number.isFinite)).toBe(true);
    }
  });
  it("builds finite batched current-roof features without the historic extra high domes", () => {
    const model = buildStPetersExterior(THREE, mergeGeometries);
    try {
      expect(model.children.length).toBeLessThanOrEqual(9);
      expect(model.userData.featureCounts).toMatchObject({
        "ogival-dome-shell": 1,
        "drum-paired-column": 32,
        "lantern-column": 16,
        "built-chapel-dome": 2,
        "rear-low-roof": 2,
        "oval-rooflight": 6,
        "facade-giant-column": 8,
        "facade-statue-envelope": 13,
        "clock-face": 2,
        "colonnade-column": 284,
        "colonnade-statue-envelope": 140,
        "fountain-pool": 2,
      });
      const bounds = new THREE.Box3().setFromObject(model);
      expect(bounds.max.y).toBeGreaterThan(6);
      expect(bounds.max.y).toBeLessThan(8);
      expect(bounds.min.y).toBeGreaterThan(-0.1);
      let triangles = 0;
      model.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          const a = o.geometry.getAttribute("position");
          expect([...a.array].every(Number.isFinite)).toBe(true);
          triangles += a.count / 3;
        }
      });
      expect(triangles).toBeLessThan(150000);
    } finally {
      dispose(model);
    }
  });
  it("leaves the seven facade openings and lantern bays physically open", () => {
    const model = buildStPetersExterior(THREE, mergeGeometries);
    model.updateMatrixWorld(true);
    try {
      for (const p of model.userData.entryOpenings as {
        x: number;
        y: number;
        z: number;
      }[]) {
        const ray = new THREE.Raycaster(
          new THREE.Vector3(p.x, p.y, p.z + 0.2),
          new THREE.Vector3(0, 0, -1),
          0,
          0.95,
        );
        expect(
          ray.intersectObject(model, true),
          `Facade opening at ${p.x}`,
        ).toHaveLength(0);
      }
      const [x, z] = model.userData.domeCenter as [number, number];
      const a = Math.PI / 16;
      const ray = new THREE.Raycaster(
        new THREE.Vector3(x + Math.sin(a) * 0.55, 5.8, z + Math.cos(a) * 0.55),
        new THREE.Vector3(-Math.sin(a), 0, -Math.cos(a)),
        0,
        1.1,
      );
      expect(ray.intersectObject(model, true)).toHaveLength(0);
    } finally {
      dispose(model);
    }
  });
});
