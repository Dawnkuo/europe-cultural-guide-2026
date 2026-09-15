// @vitest-environment node
import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { readFootprints } from '../../sources/exteriors/museums/footprints.mjs';
import { subtract } from '../../sources/exteriors/context/geometry.mjs';
import { composedContextFeatures, registerContext, type ExteriorContextData } from './exterior-context';
import { disposeStPetersModel } from './st-peters-model';

const fixtures = [
  { slug: 'sforza', parts: ['r18022563', 'r18022565'], parents: ['r18022564', 'r18022567'], minTop: 30 },
  { slug: 'doges-palace', parts: ['w810476261'], parents: [], minTop: 15 },
];

describe('museum parts that extend beyond the parent outline', () => {
  for (const { slug, parts, parents, minTop } of fixtures) it(slug, async () => {
    const data: ExteriorContextData = JSON.parse(fs.readFileSync(`public/maps/exterior-context/${slug}.json`, 'utf8'));
    const source = readFootprints(slug);
    const bytes = fs.readFileSync(`public/models/museums/${slug}.glb`);
    const root = (await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')).scene;
    try {
      const owned = root.children[0].userData.sourceBuildingPartIds ?? [];
      const neighbours = new Set(composedContextFeatures(data).buildings.map(b => b.id));
      for (const id of [...parts, ...parents]) expect(neighbours.has(id), `${slug}: duplicate ${id}`).toBe(false);
      expect(data.buildings.length).toBeGreaterThan(100);
      const matrix = registerContext(data, new THREE.Box3().setFromObject(root));
      root.updateMatrixWorld(true);
      for (const id of parts) {
        expect(owned).toContain(id);
        // Test a real overhang, not only an intersection inside the old outline.
        const outside = subtract(source.polygon(id), data.registration.footprint);
        const samples: { area: number; point: THREE.Vector2 }[] = [];
        for (const polygon of outside) {
          const contour = polygon[0].slice(0, -1).map(([x, z]: number[]) => new THREE.Vector2(x, z));
          const holes = polygon.slice(1).map((ring: number[][]) => ring.slice(0, -1).map(([x, z]) => new THREE.Vector2(x, z)));
          const vertices = [...contour, ...holes.flat()];
          for (const face of THREE.ShapeUtils.triangulateShape(contour, holes)) {
            const [a, b, c] = face.map(i => vertices[i]);
            samples.push({ area: Math.abs(b.clone().sub(a).cross(c.clone().sub(a))), point: a.clone().add(b).add(c).divideScalar(3) });
          }
        }
        samples.sort((a, b) => b.area - a.area);
        expect(samples[0]?.area).toBeGreaterThan(.1);
        const p = samples[0].point;
        const origin = new THREE.Vector3(p.x, 80, p.y).applyMatrix4(matrix);
        const hits = new THREE.Raycaster(origin, new THREE.Vector3(0, -1, 0)).intersectObject(root, true);
        expect(hits.length, `${slug}: missing overhang ${id}`).toBeGreaterThan(0);
        expect(hits[0].point.clone().applyMatrix4(matrix.clone().invert()).y).toBeGreaterThan(minTop);
      }
    } finally { disposeStPetersModel(root); }
  });
});
