// @vitest-environment node
import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { readFootprints, area } from '../../sources/exteriors/museums/footprints.mjs';
import { intersect } from '../../sources/exteriors/context/geometry.mjs';
import { buildExteriorContext, composedContextFeatures, type ExteriorContextData } from './exterior-context';
import { disposeStPetersModel } from './st-peters-model';

const partIds = ['w431003581', 'w431003619', 'w431003685'];
const read = (path: string) => JSON.parse(fs.readFileSync(path, 'utf8'));
const data: ExteriorContextData = read('public/maps/exterior-context/st-mark-basilica.json');

async function loadModel() {
  const bytes = fs.readFileSync('public/models/churches/st-mark-basilica.glb');
  return (await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')).scene;
}

describe('St Mark facade and surrounding buildings', () => {
  it('owns the elevated facade parts even where they overhang the ground outline', async () => {
    const source = readFootprints('st-mark-basilica', read('sources/exteriors/context/raw/st-mark-basilica.json'));
    const footprint = source.polygon('w138800932');
    for (const id of partIds) {
      const geometry = source.polygon(id), inside = area(intersect(geometry, footprint));
      expect(source.lookup.get(id).tags['building:part']).toBe('yes');
      expect(inside / area(geometry)).toBeGreaterThan(.65);
      expect(area(geometry) - inside).toBeGreaterThan(4);
    }
    const root = await loadModel();
    try {
      expect(root.children[0].userData.sourceBuildingPartIds).toEqual(partIds);
      const neighbours = new Set(data.buildings.map(b => b.id));
      for (const id of partIds) expect(neighbours.has(id), id).toBe(false);
      expect(neighbours.has('w252637693'), 'Keep the detached campanile').toBe(true);
      expect(neighbours.has('w138803915'), 'Keep the neighbouring Doges Palace').toBe(true);
      expect(data.buildings.length).toBeGreaterThan(900);
    } finally { disposeStPetersModel(root); }
  });

  it('leaves the central facade unobstructed in the composed street scene', async () => {
    const root = await loadModel();
    const context = buildExteriorContext(data, new THREE.Box3().setFromObject(root));
    try {
      context.root.updateMatrixWorld(true);
      // The old blocks sat just outside z=8, so mesh-intersection tests missed them.
      for (const x of [-.4, 0, .4]) for (const y of [3, 4, 5.5]) {
        const ray = new THREE.Raycaster(new THREE.Vector3(x, y, 12), new THREE.Vector3(0, 0, -1), 0, 4);
        expect(ray.intersectObject(context.layers.buildings, true)).toHaveLength(0);
      }
      expect(composedContextFeatures(data).buildings.length).toBeGreaterThan(900);
    } finally { disposeStPetersModel(root); disposeStPetersModel(context.root); }
  });
});
