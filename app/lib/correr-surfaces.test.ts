// @vitest-environment node
import {readFile} from 'node:fs/promises';
import {describe,it,expect} from 'vitest';
import * as T from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {resolveCoplanarSurfaces,correrSurfacePriority} from '../../sources/exteriors/museums/coplanar-surfaces.mjs';
import {readFootprints} from '../../sources/exteriors/museums/footprints.mjs';

function panel(name:string,x:number,width:number,height:number){
 const geometry=new T.PlaneGeometry(width,2);geometry.rotateX(-Math.PI/2);geometry.translate(x,height,0);
 const mesh=new T.Mesh(geometry,new T.MeshStandardMaterial({side:T.DoubleSide}));mesh.name=name;
 return mesh;
}
function dispose(root:T.Object3D){
 root.traverse(mesh=>{if(mesh instanceof T.Mesh){mesh.geometry.dispose();(Array.isArray(mesh.material)?mesh.material:[mesh.material]).forEach(m=>m.dispose());}});
}
async function loadCorrer(){
 const bytes=await readFile(new URL('../../public/models/museums/correr.glb',import.meta.url));
 const root=(await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.length),'')).scene;
 root.updateMatrixWorld(true);
 return root;
}

describe('Correr coincident building surfaces',()=>{
 it('partitions partially overlapping caps with roof material priority and no missing surface',()=>{
  const root=new T.Group();root.add(panel('wall',0,4,2),panel('roof',1,4,2));
  const before=new T.Box3().setFromObject(root);
  const result=resolveCoplanarSurfaces(root,['roof','wall']);
  root.updateMatrixWorld(true);
  const ray=new T.Raycaster(new T.Vector3(),new T.Vector3(0,-1,0));
  for(const [x,name] of [[-1.5,'wall'],[.3,'roof'],[2.5,'roof']] as const){
   ray.ray.origin.set(x,3,.27);const hits=ray.intersectObject(root);
   expect(hits).toHaveLength(1);expect(hits[0].object.name).toBe(name);expect(hits[0].point.y).toBeCloseTo(2,6);
  }
  expect(result.removedProjectedArea).toBeCloseTo(6,4);
  expect(new T.Box3().setFromObject(root)).toEqual(before);
  dispose(root);
 });

 it('keeps distinct parallel surfaces instead of using a visual depth offset',()=>{
  const root=new T.Group();root.add(panel('roof',0,4,2),panel('wall',0,4,2.01));
  expect(resolveCoplanarSurfaces(root,['roof','wall']).resolvedPlanes).toBe(0);
  expect(new T.Box3().setFromObject(root).getSize(new T.Vector3()).y).toBeCloseTo(.01,5);
  dispose(root);
 });

 it('exports one surface at sampled coincident roof and wall locations',async()=>{
  const root=await loadCorrer();
  const meshes=correrSurfacePriority.map(name=>root.getObjectByName(name) as T.Mesh).filter(Boolean);
  const scale=meshes[0].getWorldScale(new T.Vector3()).x;
  const ray=new T.Raycaster();ray.far=.1*scale;
  let samples=0;
  for(const mesh of meshes){
   const p=mesh.geometry.attributes.position,index=mesh.geometry.index!;
   for(let i=0;i<index.count;i+=3){
    const points=[0,1,2].map(j=>new T.Vector3().fromBufferAttribute(p,index.getX(i+j)).applyMatrix4(mesh.matrixWorld));
    const normal=points[1].clone().sub(points[0]).cross(points[2].clone().sub(points[0]));
    if(normal.length()<.005*scale*scale)continue;
    normal.normalize();
    const center=points[0].multiplyScalar(.23).addScaledVector(points[1],.31).addScaledVector(points[2],.46);
    ray.set(center.clone().addScaledVector(normal,.05*scale),normal.clone().negate());
    const hits=ray.intersectObjects(meshes).filter(hit=>{
     if(Math.abs(hit.distance-.05*scale)>=.002*scale||Math.abs(hit.face!.normal.dot(normal))<=1-1e-8)return false;
     const other=hit.object as T.Mesh,position=other.geometry.attributes.position;
     // Crossing roof slopes can be close at a seam without being duplicate faces.
     return [hit.face!.a,hit.face!.b,hit.face!.c].every(i=>Math.abs(new T.Vector3().fromBufferAttribute(position,i).applyMatrix4(other.matrixWorld).sub(center).dot(normal))<.002*scale);
    });
    expect(hits.length,`${mesh.name} triangle ${i/3}: coincident surfaces`).toBeLessThanOrEqual(1);
    samples++;
   }
  }
  expect(samples).toBeGreaterThan(1000);
  expect(root.getObjectByName('correr')!.userData.surfaceCleanup.resolvedPlanes).toBeGreaterThan(0);
  dispose(root);
 },30000);

 it('retains all height-tagged parts without extruding outline residuals into tall facade fins',async()=>{
  const root=await loadCorrer(),model=root.getObjectByName('correr')!;
  expect(model.userData.envelopeMethod).toBe('source-parts-with-ground-outline');
  expect(model.userData.featureCounts['mapped-part']).toBe(17);
  expect(model.userData.sourceBuildingPartIds).toHaveLength(17);
  expect(root.getObjectByName('primary-envelope')).toBeUndefined();
  expect(root.getObjectByName('primary-roof')).toBeUndefined();
  const foundation=root.getObjectByName('outline-foundation') as T.Mesh;
  foundation.geometry.computeBoundingBox();
  expect(foundation.geometry.boundingBox!.min.y).toBeCloseTo(0,8);
  expect(foundation.geometry.boundingBox!.max.y).toBeCloseTo(.22,5);
  dispose(root);
 });

 it('does not regenerate represented museum parts as thin grey context buildings',async()=>{
  const root=await loadCorrer(),parts=root.getObjectByName('correr')!.userData.sourceBuildingPartIds as string[];
  const context=JSON.parse(await readFile(new URL('../../public/maps/exterior-context/correr.json',import.meta.url),'utf8'));
  expect(context.buildings.filter((b:{id:string})=>parts.includes(b.id))).toEqual([]);
  expect(context.registration.selectedIds).toEqual(['w410344936','w138803888']);
  expect(context.buildings.length).toBeGreaterThan(500);
  dispose(root);
 });

 it('keeps all three window rows visible along the square-facing long wing',async()=>{
  const root=await loadCorrer(),model=root.getObjectByName('correr')!;
  const ring=readFootprints('correr').polygon('w430896950')[0][0];
  const [a,b]=ring,dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz),bays=Math.floor(length/5.8);
  const outward=new T.Vector3(dz/length,0,-dx/length);
  const scale=model.getWorldScale(new T.Vector3()).x;
  const ray=new T.Raycaster();ray.far=3*scale;
  const windows=root.getObjectByName('window-rhythm') as T.Mesh;
  expect(bays).toBe(22);
  for(let j=1;j<bays-1;j++)for(let level=0;level<3;level++){
   const t=(j+.5)/bays;
   const center=new T.Vector3(a[0]+dx*t,3+level*22/3,a[1]+dz*t);
   const world=center.clone().applyMatrix4(model.matrixWorld);
   ray.set(world.clone().addScaledVector(outward,2*scale),outward.clone().negate());
   const hits=ray.intersectObject(root);
   expect(hits[0]?.object,`bay ${j}, level ${level}: window occluded`).toBe(windows);
   expect(hits[0].point.distanceTo(world)/scale).toBeCloseTo(.07,2);
  }
  dispose(root);
 });
});
