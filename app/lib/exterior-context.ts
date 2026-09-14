import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { withBasePath } from './paths';

type Point = [number, number];
type MultiPolygon = Point[][][];
export type ContextLayer = 'buildings' | 'roads' | 'walls' | 'land';
export interface ExteriorContextData {
  version: number;
  slug: string;
  origin: Point;
  radius: number;
  sourceIssues: number;
  registration: {
    mode: 'source-coordinate' | 'footprint-axis-fit' | 'approximate-anchor' | 'facade-anchor';
    matrix: number[] | null;
    scale: number | null;
    frame: { angle: number; length: number; width: number; center: Point } | null;
    frontDirection?: Point;
    footprint: MultiPolygon;
    locationPrecision: string;
  };
  buildings: { id: string; geometry: MultiPolygon; height: number; minHeight: number; heightSource: string; roof?: {shape:'dome';height:number} }[];
  walls: { id: string; kind: string; geometry: MultiPolygon; height: number }[];
  surfaces: Record<'roads' | 'paths' | 'green' | 'water', MultiPolygon>;
  counts: { buildings: number; roads: number; walls: number; taggedHeights: number; levelHeights: number; estimatedHeights: number };
  composition?: {
    mode: 'mesh-priority' | 'mapped-area-only' | 'separate-unregistered';
    buildings: {index:number;geometry:MultiPolygon}[];
    walls: {index:number;geometry:MultiPolygon}[];
  };
}

export function composedContextFeatures(data: ExteriorContextData) {
  const buildings=new Map(data.composition?.buildings.map(o=>[o.index,o.geometry]));
  const walls=new Map(data.composition?.walls.map(o=>[o.index,o.geometry]));
  return {
    buildings:data.buildings.flatMap((b,index)=>buildings.has(index)
      ? buildings.get(index)!.length ? [{...b,geometry:buildings.get(index)!,roof:undefined}] : [] : [b]),
    walls:data.walls.flatMap((w,index)=>walls.has(index)
      ? walls.get(index)!.length ? [{...w,geometry:walls.get(index)!}] : [] : [w]),
  };
}

export async function fetchExteriorContext(slug: string, signal: AbortSignal): Promise<ExteriorContextData | null> {
  if (slug === 'gondola') return null;
  const response = await fetch(withBasePath(`/maps/exterior-context/${slug}.json`), { signal });
  if (!response.ok) throw new Error(`Surroundings: HTTP ${response.status}`);
  const data = await response.json() as ExteriorContextData;
  if (data.version !== 1 || data.slug !== slug || !Array.isArray(data.buildings)) throw new Error('Invalid surroundings data');
  return data;
}

export function contextGeometry(polygons: MultiPolygon, bottom: number, height = 0) {
  const shapes = polygons.map(polygon => {
    const shape = new THREE.Shape(polygon[0].map(([x,z]) => new THREE.Vector2(x,-z)));
    shape.holes = polygon.slice(1).map(r => new THREE.Path(r.map(([x,z]) => new THREE.Vector2(x,-z))));
    return shape;
  });
  const geometry = height > 0
    ? new THREE.ExtrudeGeometry(shapes, { depth: height, bevelEnabled: false, curveSegments: 1, steps: 1 })
    : new THREE.ShapeGeometry(shapes);
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0,bottom,0);
  const unindexed = geometry.index ? geometry.toNonIndexed() : geometry;
  if (unindexed !== geometry) geometry.dispose();
  return unindexed;
}

export function landmarkAnchorBounds(root: THREE.Group) {
  const bounds = new THREE.Box3();
  root.updateWorldMatrix(true, true);
  for (const child of root.children) if (!child.userData.contextGround) bounds.union(new THREE.Box3().setFromObject(child));
  return bounds.isEmpty() ? new THREE.Box3().setFromObject(root) : bounds;
}

export function registerContext(data: ExteriorContextData, landmarkBounds: THREE.Box3) {
  if (data.registration.matrix) return new THREE.Matrix4().fromArray(data.registration.matrix);
  if (data.registration.locationPrecision==='area-representative'||data.composition?.mode==='separate-unregistered') return new THREE.Matrix4().makeScale(16/(data.radius*2),16/(data.radius*2),16/(data.radius*2));
  const frame = data.registration.frame;
  const size = landmarkBounds.getSize(new THREE.Vector3()), center = landmarkBounds.getCenter(new THREE.Vector3());
  // Church exports mix metre-based and recipe units; their GLB normalization
  // scale alone cannot convert OSM metres into display coordinates.
  const longOnX = size.x > size.z && data.registration.mode !== 'footprint-axis-fit';
  const fittedScale = frame ? Math.max(
    (longOnX ? size.x : size.z) / frame.length,
    (longOnX ? size.z : size.x) / frame.width,
  ) : 16/(data.radius*2);
  const scale = data.registration.mode === 'footprint-axis-fit' ? fittedScale : data.registration.scale ?? fittedScale;
  let angle = frame?.angle ?? Math.PI/2;
  // Both directions fit an outline. Existing church models put their principal front at +Z.
  const front = data.registration.frontDirection ?? (data.slug.startsWith('st-peters-') ? [1,0] : data.slug === 'barcelona-cathedral' ? [-1,-1] : data.slug === 'santa-maria-mar' ? [-1,1] : [-1,0]);
  if (Math.cos(angle)*front[0]+Math.sin(angle)*front[1]<0) angle+=Math.PI;
  const yaw = data.registration.mode === 'footprint-axis-fit' || frame
    ? Math.atan2(-Math.cos(angle),Math.sin(angle)) + (size.x>size.z&&data.registration.mode!=='footprint-axis-fit'?Math.PI/2:0)
    : 0;
  const rotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),yaw);
  const origin = new THREE.Vector3(frame?.center[0]??0,0,frame?.center[1]??0).applyQuaternion(rotation).multiplyScalar(scale);
  return new THREE.Matrix4().compose(new THREE.Vector3(center.x-origin.x,landmarkBounds.min.y,center.z-origin.z),rotation,new THREE.Vector3(scale,scale,scale));
}

export function buildExteriorContext(data: ExteriorContextData, landmarkBounds: THREE.Box3) {
  const root = new THREE.Group();
  root.name = 'osm-surroundings';
  root.applyMatrix4(registerContext(data,landmarkBounds));
  const composed=composedContextFeatures(data);
  const layers = Object.fromEntries((['buildings','roads','walls','land'] as const).map(id => {
    const group=new THREE.Group();group.name=`context-${id}`;root.add(group);return [id,group];
  })) as Record<ContextLayer,THREE.Group>;
  function batch(layer: ContextLayer, name: string, entries: { geometry: MultiPolygon; bottom?: number; height?: number; roof?: {shape:'dome';height:number} }[], color: number) {
    const geometries = entries.filter(e=>e.geometry.length).flatMap(e=>{
      const bottom=e.bottom??0,height=e.height??0;
      if(!e.roof)return [contextGeometry(e.geometry,bottom,height)];
      const points=e.geometry.flatMap(p=>p[0]),xs=points.map(p=>p[0]),zs=points.map(p=>p[1]);
      const minX=Math.min(...xs),maxX=Math.max(...xs),minZ=Math.min(...zs),maxZ=Math.max(...zs);
      const cap=new THREE.SphereGeometry(1,24,10,0,Math.PI*2,0,Math.PI/2);
      cap.scale((maxX-minX)/2,e.roof.height,(maxZ-minZ)/2);
      cap.translate((minX+maxX)/2,bottom+height-e.roof.height,(minZ+maxZ)/2);
      const mesh=cap.toNonIndexed();cap.dispose();
      return height>e.roof.height ? [contextGeometry(e.geometry,bottom,height-e.roof.height),mesh] : [mesh];
    });
    if(!geometries.length)return;
    const combined=mergeGeometries(geometries,false);
    geometries.forEach(g=>g.dispose());
    if(!combined)throw new Error(`Cannot merge ${name}`);
    const material=new THREE.MeshStandardMaterial({ color,roughness:1,metalness:0 });
    const mesh=new THREE.Mesh(combined,material);mesh.name=name;
    mesh.receiveShadow=false;mesh.castShadow=false;
    layers[layer].add(mesh);
  }
  // Muted neighbouring blocks keep the individually modelled landmark legible.
  for(const [source,color] of [['tagged',0x8199a3],['levels',0x758a92],['estimated',0x5b707a]] as const) {
    batch('buildings',`neighbours-${source}`,composed.buildings.filter(b=>b.heightSource===source).map(b=>({geometry:b.geometry,bottom:b.minHeight,height:b.height-b.minHeight,roof:b.roof})),color);
  }
  batch('walls','mapped-walls',composed.walls.map(w=>({geometry:w.geometry,height:w.height})),0xa4a18d);
  batch('roads','streets',[{geometry:data.surfaces.roads,bottom:-.06}],0x526270);
  batch('roads','walkways',[{geometry:data.surfaces.paths,bottom:-.06}],0x8d9285);
  batch('land','mapped-water',[{geometry:data.surfaces.water,bottom:-.1}],0x285c71);
  batch('land','mapped-green',[{geometry:data.surfaces.green,bottom:-.08}],0x395d52);
  root.userData.counts=data.counts;
  return { root,layers };
}
