import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { libraryBayEdges, libraryCalibration, libraryHeight, libraryPiers, libraryPlanPoint, libraryScope, librarySpaces, libraryWalls, type LibraryPoint } from '../data/vatican-library';
import { disposeStPetersModel } from './st-peters-model';

export function buildVaticanLibraryModel() {
  const model = new THREE.Group();
  const batches = new Map<number, THREE.BufferGeometry[]>();
  function add(geometry: THREE.BufferGeometry, color: number) {
    const pieces = batches.get(color) ?? [];
    pieces.push(geometry.index ? geometry.toNonIndexed() : geometry);
    if (geometry.index) geometry.dispose();
    batches.set(color, pieces);
  }
  function slab(points: LibraryPoint[], bottom: number, top: number, color: number) {
    const shape = new THREE.Shape();
    points.forEach((point, i) => {
      const [x, z] = libraryPlanPoint(point);
      if (i === 0) shape.moveTo(x, -z); else shape.lineTo(x, -z);
    });
    shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: top - bottom, bevelEnabled: false });
    geometry.rotateX(-Math.PI / 2);
    geometry.translate(0, bottom, 0);
    add(geometry, color);
  }
  for (const space of librarySpaces) slab(space.polygon, -.18, 0, space.id === 'sistine-hall' ? 0x50717c : 0x344c5b);
  for (const [a, b, c, d] of libraryWalls) slab([[a, b], [c, b], [c, d], [a, d]], 0, 1.1, 0xe0d4b9);
  const spring = libraryHeight(libraryCalibration.sectionSpringY);
  const crown = libraryHeight(libraryCalibration.sectionCrownY);
  for (const [a, b, c, d] of libraryPiers) slab([[a, b], [c, b], [c, d], [a, d]], 0, spring, 0xe0d4b9);

  const linePositions: number[] = [];
  function polyline(points: THREE.Vector3[]) {
    for (let i = 1; i < points.length; i++) linePositions.push(...points[i - 1].toArray(), ...points[i].toArray());
  }
  // Two aisle profiles taken from the section. Open ribs leave the floor visible.
  // They express the measured spring/crown envelope, not carved/fresco geometry.
  for (const x of libraryBayEdges) {
    for (const [near, far] of [[3765, 3892], [3892, 4020]]) {
      polyline(Array.from({ length: 49 }, (_, i) => {
        const t = Math.PI * i / 48;
        const y = (near + far) / 2 - (far - near) / 2 * Math.cos(t);
        const [wx, wz] = libraryPlanPoint([x, y]);
        return new THREE.Vector3(wx, spring + (crown - spring) * Math.sin(t), wz);
      }));
    }
  }
  // Roof outline only. The restored roof is pitched; its current truss layout is unknown.
  const ridge = libraryHeight(libraryCalibration.sectionRidgeY);
  const eaves = libraryHeight(libraryCalibration.sectionEavesY);
  for (const x of [1208, 2558]) {
    polyline([[x, 3740, eaves], [x, 3892, ridge], [x, 4045, eaves]].map(([px, py, height]) => {
      const [wx, wz] = libraryPlanPoint([px, py]); return new THREE.Vector3(wx, height, wz);
    }));
  }
  for (const [py, height] of [[3740, eaves], [3892, ridge], [4045, eaves]]) {
    polyline([1208, 2558].map(px => { const [wx, wz] = libraryPlanPoint([px, py]); return new THREE.Vector3(wx, height, wz); }));
  }
  for (const [color, pieces] of batches) {
    const geometry = mergeGeometries(pieces, false);
    pieces.forEach(piece => piece.dispose());
    if (!geometry) throw new Error('Library geometry batching failed');
    model.add(new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color, roughness: .85 })));
  }
  const wire = new THREE.BufferGeometry();
  wire.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
  model.add(new THREE.LineSegments(wire, new THREE.LineBasicMaterial({ color: 0xe0c57e, transparent: true, opacity: .8, toneMapped: false })));
  model.userData = { ...libraryScope, piers: libraryPiers.length, baysPerAisle: libraryBayEdges.length - 1 };
  model.updateMatrixWorld(true);
  return { model, mesh: model, dispose: () => disposeStPetersModel(model) };
}
