import fs from 'node:fs/promises';
import * as THREE from 'three';
import { guideCatalog } from '../app/data/guides';
import { exteriorAuditModel, auditAnchor, mergedLandmarkGeometry, landmarkCollisionChecker } from './lib/exterior-model-audit';
import { registerContext, type ExteriorContextData } from '../app/lib/exterior-context';
import { disposeStPetersModel } from '../app/lib/st-peters-model';
import { union, subtract, intersect, offset, lineBuffer } from '../sources/exteriors/context/geometry.mjs';
import { area } from '../sources/exteriors/museums/footprints.mjs';

// This is a display-composition mask, not a replacement for the OSM source.
// Use the actual mesh silhouette, including concavities, never its bounding box.
function projectedEnvelope(geometry: THREE.BufferGeometry, inverse: THREE.Matrix4) {
  const p=geometry.attributes.position;
  const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3();
  const batches: number[][][][][]=[];
  const bounds=new THREE.Box3();
  let batch: number[][][][]=[];
  for(let i=0;i<p.count;i+=3){
    a.fromBufferAttribute(p,i).applyMatrix4(inverse);
    b.fromBufferAttribute(p,i+1).applyMatrix4(inverse);
    c.fromBufferAttribute(p,i+2).applyMatrix4(inverse);
    bounds.expandByPoint(a);bounds.expandByPoint(b);bounds.expandByPoint(c);
    if(Math.max(a.y,b.y,c.y)<1)continue;
    const projectedArea=Math.abs((b.x-a.x)*(c.z-a.z)-(c.x-a.x)*(b.z-a.z))/2;
    if(projectedArea<.0001){
      // Vertical window/recess meshes project to a line, but still occupy
      // space beside a party wall. Include their narrow projected envelope.
      const points=[[a.x,a.z],[b.x,b.z],[c.x,c.z]];
      batch.push(...lineBuffer(points,.04));
    }else batch.push([[[a.x,a.z],[b.x,b.z],[c.x,c.z],[a.x,a.z]]]);
    if(batch.length>=5000){batches.push(union(batch.map(p=>[p])));batch=[];}
  }
  if(batch.length)batches.push(union(batch.map(p=>[p])));
  const mask=offset(union(batches),.08);
  const size=bounds.getSize(new THREE.Vector3());
  if(area(mask)>(size.x+.2)*(size.z+.2))throw Error('Invalid model envelope exceeds mesh bounds');
  return mask;
}

export async function composeExteriorContext(slugs: string[]) {
  const report=[];
  for(const guide of guideCatalog.filter(g=>!slugs.length||slugs.includes(g.slug))){
    if(guide.slug==='gondola'){report.push({slug:guide.slug,mode:'no-fixed-location'});continue;}
    const file=`public/maps/exterior-context/${guide.slug}.json`;
    const data:ExteriorContextData=JSON.parse(await fs.readFile(file,'utf8'));
    delete data.composition;
    if(data.registration.locationPrecision==='area-representative'){
      data.composition={mode:'mapped-area-only',buildings:[],walls:[]};
      report.push({slug:guide.slug,mode:'mapped-area-only',neighbours:data.buildings.length});
    }else if(!data.registration.frame&&!data.registration.matrix){
      data.composition={mode:'separate-unregistered',buildings:[],walls:[]};
      report.push({slug:guide.slug,mode:'separate-unregistered',reason:'No source footprint for geographic registration'});
    }else{
      const root=await exteriorAuditModel(guide);
      const matrix=registerContext(data,auditAnchor(root,data));
      const geometry=mergedLandmarkGeometry(root);
      const collides=landmarkCollisionChecker(geometry,matrix);
      const conflictingBuildings=[...data.buildings.entries()].filter(([,b])=>collides(b));
      const conflictingWalls=[...data.walls.entries()].filter(([,w])=>collides({...w,minHeight:0}));
      const mask=conflictingBuildings.length||conflictingWalls.length?projectedEnvelope(geometry,matrix.clone().invert()):[];
      const overrides: NonNullable<ExteriorContextData['composition']>['buildings']=[];
      let removed=0;
      for(const [index,b] of conflictingBuildings){
        const overlap=area(intersect(b.geometry,mask));
        if(overlap<.001)continue;
        const clipped=subtract(b.geometry,mask);
        overrides.push({index,geometry:clipped});removed+=overlap;
      }
      const walls: NonNullable<ExteriorContextData['composition']>['walls']=[];
      for(const [index,w] of conflictingWalls){
        if(area(intersect(w.geometry,mask))<.001)continue;
        walls.push({index,geometry:subtract(w.geometry,mask)});
      }
      const sourceArea=area(data.registration.footprint);
      // Large conflicts indicate an unregistered compound/terrain, not a small
      // duplicate edge. Preserve both sources as separate views in that case.
      const unsafe=removed>sourceArea*.1;
      data.composition=unsafe?{mode:'separate-unregistered',buildings:[],walls:[]}
        :{mode:'mesh-priority',buildings:overrides,walls};
      report.push({slug:guide.slug,mode:data.composition.mode,neighbours:data.buildings.length,adjusted:unsafe?0:overrides.length,
        retained:overrides.filter(o=>o.geometry.length).length,maskArea:area(mask),removedArea:removed,
        sourceArea,reason:unsafe?'Compound or vertical datum requires independent registration':undefined});
      geometry.dispose();disposeStPetersModel(root);
    }
    await fs.writeFile(file,JSON.stringify(data));
    console.log(`compose ${guide.slug}: ${data.composition.buildings.length} local overrides`);
  }
  await fs.mkdir('work/exterior-overlap-qa',{recursive:true});
  const file='work/exterior-overlap-qa/composition.json';
  const previous=slugs.length?JSON.parse(await fs.readFile(file,'utf8').catch(()=>'[]')):[];
  const entries=new Map([...previous,...report].map(row=>[row.slug,row]));
  await fs.writeFile(file,JSON.stringify(guideCatalog.flatMap(g=>entries.has(g.slug)?[entries.get(g.slug)]:[]),null,2)+'\n');
}
