import * as T from 'three';
import clipping from 'polygon-clipping';
import {union,subtract} from '../context/geometry.mjs';
import {area} from './footprints.mjs';

export function surfacePlanes(root,names){
 const planes=[];
 for(const name of names){
  const mesh=root.getObjectByName(name);
  if(!mesh?.isMesh)continue;
  const p=mesh.geometry.attributes.position,idx=mesh.geometry.index;
  for(let i=0;i<(idx?.count??p.count);i+=3){
   const points=[0,1,2].map(j=>new T.Vector3().fromBufferAttribute(p,idx?idx.getX(i+j):i+j));
   const normal=points[1].clone().sub(points[0]).cross(points[2].clone().sub(points[0]));
   if(normal.length()<1e-7)continue;
   normal.normalize();
   const axis=normal.toArray().map(Math.abs).indexOf(Math.max(...normal.toArray().map(Math.abs)));
   const canonical=normal.clone();if(canonical.getComponent(axis)<0)canonical.negate();
   let plane=planes.find(g=>g.axis===axis&&g.normal.dot(canonical)>1-1e-6&&points.every(p=>Math.abs(g.normal.dot(p)-g.distance)<.002));
   if(!plane){plane={axis,normal:canonical,distance:canonical.dot(points[0]),faces:[]};planes.push(plane);}
   const ring=points.map(p=>p.toArray().filter((_,j)=>j!==axis).map(v=>Math.round(v*1000)/1000));
   ring.push(ring[0]);
   const polygon=[[ring]];
   if(area(polygon)<.000001)continue;
   plane.faces.push({mesh,points,normal,polygon});
  }
 }
 return planes.filter(p=>p.faces.length);
}

// Keep one material owner per plane region. This clips overlapping wall/roof
// caps without depth offsets, moving buildings, or disabling depth testing.
export function resolveCoplanarSurfaces(root,names){
 const planes=surfacePlanes(root,names),buffers=new Map();
 let removedProjectedArea=0,resolvedPlanes=0;
 const append=(mesh,points,normal)=>{
  if(!buffers.has(mesh))buffers.set(mesh,{position:[],normal:[],uv:[]});
  const out=buffers.get(mesh);
  const axis=Math.abs(normal.y)>=Math.max(Math.abs(normal.x),Math.abs(normal.z))?1:Math.abs(normal.x)>Math.abs(normal.z)?0:2;
  for(const p of points){out.position.push(...p.toArray());out.normal.push(...normal.toArray());out.uv.push((axis===0?p.z:p.x)/8,(axis===1?p.z:p.y)/8);}
 };
 for(const plane of planes){
  const whole=union(plane.faces.map(f=>f.polygon));
  const overlap=plane.faces.reduce((sum,f)=>sum+area(f.polygon),0)-area(whole);
  if(overlap<.002){for(const face of plane.faces)append(face.mesh,face.points,face.normal);continue;}
  resolvedPlanes++;removedProjectedArea+=overlap;
  let occupied=[];
  for(const name of names){
   const faces=plane.faces.filter(f=>f.mesh.name===name);if(!faces.length)continue;
   const geometry=union(faces.map(f=>f.polygon)),visible=subtract(geometry,occupied);
   occupied=union([occupied,geometry]);
   const lift=point=>{
    const xyz=[];let j=0;
    for(let axis=0;axis<3;axis++)xyz[axis]=axis===plane.axis?0:point[j++];
    xyz[plane.axis]=(plane.distance-plane.normal.dot(new T.Vector3(...xyz)))/plane.normal.getComponent(plane.axis);
    return new T.Vector3(...xyz);
   };
   // Integer clipping can leave a hole touching its outer ring. Normalize that
   // junction into separate simple polygons before Earcut, or it fills the gap.
   for(const polygon of visible.length?clipping.union(visible):[]){
    const rings=polygon.map(r=>r.slice(0,-1).map(p=>new T.Vector2(...p)));
    const points=rings.flat(),triangles=T.ShapeUtils.triangulateShape(rings[0],rings.slice(1));
    for(const triangle of triangles){
     const vertices=triangle.map(i=>lift(points[i].toArray()));
     if(vertices[1].clone().sub(vertices[0]).cross(vertices[2].clone().sub(vertices[0])).dot(faces[0].normal)<0)vertices.reverse();
     append(faces[0].mesh,vertices,faces[0].normal);
    }
   }
  }
 }
 for(const name of names){
  const mesh=root.getObjectByName(name);if(!mesh?.isMesh)continue;
  const data=buffers.get(mesh);mesh.geometry.dispose();
  if(!data){mesh.removeFromParent();continue;}
  const geometry=new T.BufferGeometry();
  geometry.setAttribute('position',new T.Float32BufferAttribute(data.position,3));
  geometry.setAttribute('normal',new T.Float32BufferAttribute(data.normal,3));
  geometry.setAttribute('uv',new T.Float32BufferAttribute(data.uv,2));
  mesh.geometry=geometry;
 }
 return {resolvedPlanes,removedProjectedArea,toleranceMetres:.002};
}

export const correrSurfacePriority=['mapped-roof','primary-roof','cornice','window-rhythm','mapped-part','primary-envelope'];
