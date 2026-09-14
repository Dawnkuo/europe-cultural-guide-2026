import fs from 'node:fs';
import * as THREE from 'three';
import { MeshBVH } from 'three-mesh-bvh';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { GuideRecord } from '../../app/data/types';
import { buildGuideExteriorSceneLayout } from '../../app/lib/guide-exterior-layout';
import { exteriorPartGeometry } from '../../app/components/GuideExteriorScene';
import { hasChurchExterior } from '../../app/lib/church-exterior-registry';
import { hasMuseumExterior } from '../../app/lib/museum-exterior-registry';
import { hasLandmarkExterior } from '../../app/lib/landmark-exterior-registry';
import { prepareStPetersModel } from '../../app/lib/st-peters-model';
import { buildDetailedExterior } from '../../app/lib/detailed-exteriors';
import { buildPisaExterior } from '../../app/lib/pisa-exterior-model';
import { buildSighsExterior } from '../../app/lib/sighs-exterior-model';
import { landmarkAnchorBounds, contextGeometry, type ExteriorContextData } from '../../app/lib/exterior-context';
import { offset } from '../../sources/exteriors/context/geometry.mjs';

async function loadAsset(path: string) {
  const bytes = fs.readFileSync(path);
  return (await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length), '')).scene;
}

export async function exteriorAuditModel(guide: GuideRecord) {
  const slug = guide.slug;
  if (hasMuseumExterior(slug)) return loadAsset(`public/models/museums/${slug}.glb`);
  if (hasLandmarkExterior(slug)) return loadAsset(`public/models/landmarks/${slug}.glb`);
  if (hasChurchExterior(slug)) return loadAsset(`public/models/churches/${slug}.glb`);
  if (slug.startsWith('st-peters-')) return prepareStPetersModel(await loadAsset('public/models/st-peters-exterior.glb'));
  if (slug === 'leaning-tower') return buildPisaExterior(THREE, mergeGeometries);
  if (slug === 'bridge-of-sighs') return buildSighsExterior(THREE, mergeGeometries);
  if (slug === 'casa-batllo') return buildDetailedExterior(THREE, mergeGeometries, slug)!;
  const root = new THREE.Group();
  for (const part of buildGuideExteriorSceneLayout({slug, type:guide.spatial.type, stops:[]}).parts) {
    const mesh = new THREE.Mesh(exteriorPartGeometry(THREE, part));
    mesh.position.set(...part.position);
    mesh.rotation.set(...part.rotation);
    mesh.scale.set(...part.scale);
    mesh.userData.contextGround = ['water','garden','route'].includes(part.material);
    root.add(mesh);
  }
  return root;
}

export function auditAnchor(root: THREE.Group, data: ExteriorContextData) {
  if (!data.slug.startsWith('st-peters-')) return landmarkAnchorBounds(root);
  const region = root.userData.focusRegions.find((r: {id: string}) => r.id === 'basilica');
  data.registration.scale = root.scale.x;
  return new THREE.Box3(new THREE.Vector3(...region.min), new THREE.Vector3(...region.max));
}

export function mergedLandmarkGeometry(root: THREE.Group) {
  const parts: THREE.BufferGeometry[] = [];
  root.updateMatrixWorld(true);
  root.traverse(object => {
    if (!(object instanceof THREE.Mesh) || object.userData.contextGround) return;
    const source = object.geometry;
    const geometry = source.index ? source.toNonIndexed() : source.clone();
    for (const key of Object.keys(geometry.attributes)) if (key !== 'position') geometry.deleteAttribute(key);
    // GLBs may use normalized integer positions. Bake transforms into float
    // coordinates, not back into quantized storage (which wraps/clamps them).
    const positions=geometry.attributes.position;
    const decoded=new Float32Array(positions.count*3);
    for(let i=0;i<positions.count;i++)decoded.set([positions.getX(i),positions.getY(i),positions.getZ(i)],i*3);
    geometry.setAttribute('position',new THREE.BufferAttribute(decoded,3));
    geometry.applyMatrix4(object.matrixWorld);
    parts.push(geometry);
  });
  const result = mergeGeometries(parts)!;
  parts.forEach(g => g.dispose());
  return result;
}

export function landmarkCollisionChecker(geometry: THREE.BufferGeometry, matrix: THREE.Matrix4) {
  geometry.computeBoundingBox();
  const bvh=new MeshBVH(geometry);
  return (feature: {geometry:ExteriorContextData['registration']['footprint'];minHeight:number;height:number})=>{
    const points=feature.geometry.flatMap(p=>p[0]);
    const box=new THREE.Box3().setFromPoints(points.flatMap(([x,z])=>[new THREE.Vector3(x,feature.minHeight,z),new THREE.Vector3(x,feature.height,z)])).applyMatrix4(matrix);
    if(!box.intersectsBox(geometry.boundingBox!))return false;
    const footprint=offset(feature.geometry,-.05),bottom=Math.max(feature.minHeight+.05,1);
    if(!footprint.length||feature.height-.05<=bottom)return false;
    const other=contextGeometry(footprint,bottom,feature.height-.05-bottom);
    other.applyMatrix4(matrix);
    const collision=bvh.intersectsGeometry(other,new THREE.Matrix4());
    other.dispose();
    return collision;
  };
}
