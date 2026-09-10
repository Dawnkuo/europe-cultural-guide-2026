import type * as ThreeType from 'three';
import type { mergeGeometries as MergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { braccioPlanToWorld, braccioScope, buildBraccioFeatures, type PlanPoint } from '../data/braccio-nuovo';

export function buildBraccioNuovoModel(THREE: typeof ThreeType, mergeGeometries: typeof MergeGeometries) {
  const model = new THREE.Group();
  const batches = new Map<number, ThreeType.BufferGeometry[]>();
  const regions = new Map<string, ThreeType.Box3>();
  const features = buildBraccioFeatures();
  const counts: Record<string, number> = {};

  function add(geometry: ThreeType.BufferGeometry, color: number, region: string) {
    geometry.computeBoundingBox();
    if (!regions.has(region)) regions.set(region, new THREE.Box3());
    regions.get(region)!.union(geometry.boundingBox!);
    const batch = batches.get(color) ?? [];
    batch.push(geometry.index ? geometry.toNonIndexed() : geometry);
    if (geometry.index) geometry.dispose();
    batches.set(color, batch);
  }

  function polygonGeometry(points: PlanPoint[], bottom: number, top: number) {
    const shape = new THREE.Shape();
    points.forEach((point, index) => {
      const [x, z] = braccioPlanToWorld(point);
      // Extrude in +Y; the Shape's vertical axis is the opposite of world Z.
      if (index === 0) shape.moveTo(x, -z);
      else shape.lineTo(x, -z);
    });
    shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: top - bottom, bevelEnabled: false, curveSegments: 16 });
    geometry.rotateX(-Math.PI / 2);
    geometry.translate(0, bottom, 0);
    return geometry;
  }

  for (const feature of features) {
    counts[feature.kind] = (counts[feature.kind] ?? 0) + 1;
    const region = feature.id.includes('portico')
      ? 'portico' : feature.id.includes('hemicycle') ? 'hemicycle' : 'gallery';
    if (feature.kind === 'column') {
      const [x, z] = braccioPlanToWorld(feature.at!);
      const height = feature.top - feature.bottom;
      const radius = feature.radius!;
      // Base/capital envelopes express the column order without inventing carved ornament.
      const shaft = new THREE.CylinderGeometry(radius * 0.85, radius, height - 0.5, 20);
      shaft.translate(x, feature.bottom + 0.25 + (height - 0.5) / 2, z);
      add(shaft, 0xd3c5a7, region);
      for (const y of [feature.bottom + 0.12, feature.top - 0.12]) {
        const base = new THREE.CylinderGeometry(radius * 1.3, radius * 1.3, 0.24, 20);
        base.translate(x, y, z);
        add(base, 0xe6ddc5, region);
      }
    } else if (feature.polygon) {
      add(polygonGeometry(feature.polygon, feature.bottom, feature.top), feature.kind === 'wall' || feature.kind === 'entablature' ? 0xd4cfbf : feature.kind === 'stair' ? 0xded3b5 : 0x8c9b9d, region);
    }
  }
  for (const [color, pieces] of batches) {
    const geometry = mergeGeometries(pieces, false);
    pieces.forEach(piece => piece.dispose());
    if (!geometry) throw new Error('Braccio Nuovo geometry batching failed');
    const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color, roughness: 0.82, metalness: 0.02 }));
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    model.add(mesh);
  }
  // Normalization belongs to the viewer, not to the source plan or campus registration.
  const size = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());
  const scale = 20 / size.x;
  model.scale.setScalar(scale);
  model.updateMatrixWorld(true);
  model.userData = {
    ...braccioScope,
    featureCounts: counts,
    nicheCount: 28,
    porticoColumnCount: 8,
    featureIds: features.map(feature => feature.id),
    displayScale: scale,
    focusRegions: [...regions].map(([id, box]) => ({ id, min: box.min.clone().multiplyScalar(scale).toArray(), max: box.max.clone().multiplyScalar(scale).toArray() })),
  };
  return model;
}
