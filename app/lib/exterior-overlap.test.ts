// @vitest-environment node
import fs from 'node:fs';
import { afterAll, describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { MeshBVH } from 'three-mesh-bvh';
import { guideCatalog } from '../data/guides';
import { disposeStPetersModel } from './st-peters-model';
import { exteriorAuditModel, auditAnchor, mergedLandmarkGeometry } from '../../scripts/lib/exterior-model-audit';
import { registerContext, contextGeometry, composedContextFeatures, type ExteriorContextData } from './exterior-context';
import { offset, intersect } from '../../sources/exteriors/context/geometry.mjs';
import { area, bounds, readFootprints } from '../../sources/exteriors/museums/footprints.mjs';

const read=(slug:string):ExteriorContextData=>JSON.parse(fs.readFileSync(`public/maps/exterior-context/${slug}.json`,'utf8'));
const museumSources: { sites: { slug: string; parts: { key: string }[] }[] } = JSON.parse(fs.readFileSync('sources/exteriors/museums/source-manifest.json', 'utf8'));

describe('landmark and mapped-neighbour overlap audit', () => {
  const report: object[] = [];
  afterAll(()=>{
    fs.mkdirSync('work/exterior-overlap-qa',{recursive:true});
    fs.writeFileSync('work/exterior-overlap-qa/audit.json',JSON.stringify(report,null,2)+'\n');
  });
  for (const guide of guideCatalog.filter(g => g.slug !== 'gondola')) it(guide.slug, async () => {
    const data=read(guide.slug);
    expect(data.composition,'composition must be regenerated with context or model changes').toBeDefined();
    if (data.registration.locationPrecision === 'area-representative'||data.composition?.mode==='separate-unregistered') {
      report.push({slug:guide.slug,mode:data.composition!.mode,neighbours:data.buildings.length,collisions:[]});
      return;
    }
    const root=await exteriorAuditModel(guide);
    const matrix=registerContext(data,auditAnchor(root,data));
    const geometry=mergedLandmarkGeometry(root);
    geometry.computeBoundingBox();
    const bvh=new MeshBVH(geometry);
    const collisions:string[]=[];
    const features=composedContextFeatures(data);
    const represented = new Set(museumSources.sites.find(site => site.slug === guide.slug)?.parts.map(part => part.key) ?? []);
    root.traverse(object => {
      for (const id of object.userData.sourceBuildingPartIds ?? []) represented.add(id);
    });
    // Surface intersections miss a duplicate shell that surrounds the subject.
    const duplicateSources = features.buildings.filter(part => represented.has(part.id)).map(part => part.id);
    for(const b of [...features.buildings,...features.walls.map(w=>({...w,minHeight:0}))]){
      const points=b.geometry.flatMap(p=>p[0]);
      const box=new THREE.Box3().setFromPoints(points.flatMap(([x,z])=>[new THREE.Vector3(x,b.minHeight,z),new THREE.Vector3(x,b.height,z)])).applyMatrix4(matrix);
      if(!box.intersectsBox(geometry.boundingBox!))continue;
      // Exclude contact-only party walls (5 cm) and ground/plinth contact (<1 m).
      const footprint=offset(b.geometry,-.05);
      if(!footprint.length)continue;
      const bottom=Math.max(b.minHeight+.05,1);
      if(b.height-.05<=bottom)continue;
      const other=contextGeometry(footprint,bottom,b.height-.05-bottom);
      other.applyMatrix4(matrix);
      if(bvh.intersectsGeometry(other,new THREE.Matrix4()))collisions.push(b.id);
      other.dispose();
    }
    report.push({slug:guide.slug,mode:data.registration.mode,neighbours:data.buildings.length,rendered:features.buildings.length,
      adjusted:data.composition!.buildings.length,collisions:[...new Set(collisions)],duplicateSources});
    geometry.dispose();disposeStPetersModel(root);
    expect([...new Set(collisions)]).toEqual([]);
    expect(duplicateSources, 'A represented part cannot also be a neighbouring building').toEqual([]);
    expect(matrix.elements.every(Number.isFinite)).toBe(true);
  },30000);

  it('matches the Casa facade endpoints and keeps Passeig de Gracia in front',()=>{
    const data=read('casa-batllo');
    const source=readFootprints(data.slug,JSON.parse(fs.readFileSync('sources/exteriors/context/raw/casa-batllo.json','utf8')));
    const matrix=registerContext(data,new THREE.Box3());
    expect(data.registration.mode).toBe('facade-anchor');
    for(const [id,x] of [[6357891348,-3.125],[6357891279,3.125]]){
      const [east,south]=source.project(source.lookup.get('n'+id));
      const point=new THREE.Vector3(east,0,south).applyMatrix4(matrix);
      expect(point.x).toBeCloseTo(x,5);
      expect(point.z).toBeCloseTo(0,5);
    }
    const street=source.lookup.get('w294085180');
    const [east,south]=source.project(source.lookup.get('n'+street.nodes[3]));
    expect(new THREE.Vector3(east,0,south).applyMatrix4(matrix).z).toBeGreaterThan(5);
    expect(new THREE.Vector3().setFromMatrixScale(matrix).x).toBeCloseTo(.426455,4);
    expect(composedContextFeatures(data).buildings.length).toBe(data.buildings.length);
  });

  it('decodes normalized GLB positions before baking the display transform',()=>{
    const root=new THREE.Group();
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.BufferAttribute(new Int16Array([-32767,0,0,32767,0,0,0,32767,0]),3,true));
    const mesh=new THREE.Mesh(geometry);mesh.position.set(30,40,50);mesh.scale.setScalar(5);root.add(mesh);
    const merged=mergedLandmarkGeometry(root);
    merged.computeBoundingBox();
    expect(merged.attributes.position.array).toBeInstanceOf(Float32Array);
    expect(merged.boundingBox!.min.toArray()).toEqual([25,40,50]);
    expect(merged.boundingBox!.max.toArray()).toEqual([35,45,50]);
    merged.dispose();disposeStPetersModel(root);
  });

  it('registers the Rialto structure and Colosseum building rather than walking paths',()=>{
    for(const slug of ['rialto','colosseum']){
      const data=read(slug);
      expect(data.registration.frame).not.toBeNull();
      expect(area(data.registration.footprint)).toBeGreaterThan(500);
      expect(data.composition?.mode).toBe('mesh-priority');
    }
  });

  it('preserves OSM provenance and only trims intersecting neighbouring portions',()=>{
    for(const guide of guideCatalog.filter(g=>g.slug!=='gondola')){
      const data=read(guide.slug);
      for(const replacement of data.composition?.buildings??[]){
        const original=data.buildings[replacement.index];
        expect(original,guide.slug).toBeDefined();
        expect(area(replacement.geometry)).toBeLessThanOrEqual(area(original.geometry)+.02);
        expect(area(intersect(replacement.geometry,original.geometry))).toBeCloseTo(area(replacement.geometry),1);
      }
    }
  });

  it('checks neighbouring OSM blocks against each other at overlapping elevations',()=>{
    const conflicts:object[]=[];
    for(const guide of guideCatalog.filter(g=>g.slug!=='gondola')){
      const data=read(guide.slug),boxes=data.buildings.map(b=>bounds(b.geometry));
      const grid=new Map<string,number[]>();
      for(const [index,b] of data.buildings.entries()){
        const box=boxes[index],cells:string[]=[],candidates=new Set<number>();
        for(let x=Math.floor(box[0]/40);x<=Math.floor(box[2]/40);x++)for(let z=Math.floor(box[1]/40);z<=Math.floor(box[3]/40);z++){
          const key=`${x},${z}`;cells.push(key);
          for(const other of grid.get(key)??[])candidates.add(other);
        }
        for(const i of candidates){
          const other=data.buildings[i],a=boxes[i];
          if(Math.min(b.height,other.height)-Math.max(b.minHeight,other.minHeight)<.01)continue;
          if(a[0]>=box[2]||a[2]<=box[0]||a[1]>=box[3]||a[3]<=box[1])continue;
          const overlap=area(intersect(b.geometry,other.geometry));
          if(overlap>.05)conflicts.push({slug:guide.slug,a:b.id,b:other.id,area:overlap});
        }
        for(const key of cells){const list=grid.get(key)??[];list.push(index);grid.set(key,list);}
      }
    }
    fs.mkdirSync('work/exterior-overlap-qa',{recursive:true});
    fs.writeFileSync('work/exterior-overlap-qa/context-block-overlaps.json',JSON.stringify(conflicts,null,2)+'\n');
    expect(conflicts).toEqual([]);
  },30000);
});
