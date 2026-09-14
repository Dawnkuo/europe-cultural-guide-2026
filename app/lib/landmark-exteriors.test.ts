// @vitest-environment node
import fs from 'node:fs';
import {describe,it,expect} from 'vitest';
import * as T from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {guideCatalog} from '../data/guides';
import {LANDMARK_EXTERIOR_SLUGS,hasLandmarkExterior} from './landmark-exterior-registry';
import {churchExteriorSlugs} from './church-exterior-registry';
import {museumExteriorSlugs} from './museum-exterior-registry';
import {disposeStPetersModel} from './st-peters-model';
import {landmarks} from '../../sources/exteriors/landmarks/catalog.mjs';
import {readFootprints,center} from '../../sources/exteriors/museums/footprints.mjs';
import cameras from '../data/landmark-exterior-cameras.json';

const read=(path:string)=>JSON.parse(fs.readFileSync(path,'utf8'));
const catalog=read('public/models/landmarks/catalog.json');
const evidence=read('sources/exteriors/landmarks/source-manifest.json');
async function model(slug:string){const bytes=fs.readFileSync(`public/models/landmarks/${slug}.glb`);return (await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.length),'')).scene;}

describe('remaining destination exterior coverage',()=>{
  it('accounts for all 74 guides, with no unclassified generic building fallback',()=>{
    const mappedAreas=['grand-canal','vatican-surroundings','tiber','trastevere','el-born','barceloneta','gothic-quarter','la-rambla','cologne-old-town','rheinauhafen','seine'];
    const retained=['st-peters-basilica','st-peters-square','leaning-tower','bridge-of-sighs','casa-batllo'];
    const covered=[...churchExteriorSlugs,...museumExteriorSlugs,...LANDMARK_EXTERIOR_SLUGS,...mappedAreas,...retained];
    expect(covered).toHaveLength(74);
    expect(new Set(covered).size).toBe(74);
    expect(covered.sort()).toEqual(guideCatalog.map(g=>g.slug).sort());
    for(const slug of mappedAreas)expect(read(`public/maps/exterior-context/${slug}.json`).composition.mode).toBe('mapped-area-only');
    expect(hasLandmarkExterior('../la-pedrera')).toBe(false);
  });
  it('keeps build recipes, exported assets, evidence and runtime registration in agreement',()=>{
    const expected=[...LANDMARK_EXTERIOR_SLUGS].sort();
    expect(landmarks.map(i=>i.slug).sort()).toEqual(expected);
    expect(catalog.map((i:{slug:string})=>i.slug).sort()).toEqual(expected);
    expect(evidence.sites.map((i:{slug:string})=>i.slug).sort()).toEqual(expected);
    expect(new Set(catalog.map((i:{geometryHash:string})=>i.geometryHash)).size).toBe(expected.length);
    expect(Object.keys(cameras).sort()).toEqual(expected);
    for(const direction of Object.values(cameras)){
      expect(direction.every(Number.isFinite)).toBe(true);
      expect(new T.Vector3(...direction).length()).toBeCloseTo(1,5);
      expect(direction[1]).toBeGreaterThan(.5);
    }
  });
  it.each(LANDMARK_EXTERIOR_SLUGS)('%s loads finite, bounded source-coordinate geometry and fallback',async slug=>{
    const root=await model(slug),bounds=new T.Box3().setFromObject(root),size=bounds.getSize(new T.Vector3());
    expect(Math.max(size.x,size.z)).toBeCloseTo(16,3);
    expect(bounds.min.y).toBeCloseTo(0,3);
    let triangles=0;
    root.traverse(o=>{if(!(o instanceof T.Mesh))return;
      for(const name of ['position','normal','uv'])expect(o.geometry.attributes[name].array.every(Number.isFinite),`${slug}: ${name}`).toBe(true);
      triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;
    });
    const entry=catalog.find((i:{slug:string})=>i.slug===slug);
    expect(triangles).toBe(entry.triangles);
    expect(triangles).toBeGreaterThan(100);
    expect(triangles).toBeLessThan(350000);
    const svg=fs.readFileSync(`public/models/landmarks/${slug}.svg`,'utf8');
    expect(svg).toContain('<polygon');expect(svg).not.toMatch(/NaN|undefined/);
    const manifest=evidence.sites.find((i:{slug:string})=>i.slug===slug);
    expect(manifest.architecturalSources.length).toBeGreaterThan(0);
    if(slug!=='gondola'){
      const data=read(`public/maps/exterior-context/${slug}.json`),parent=root.children[0];
      expect(data.registration.mode).toBe('source-coordinate');
      expect(data.registration.selectedIds).toEqual(manifest.sourceOutlineIds);
      parent.updateMatrix();
      data.registration.matrix.forEach((value:number,index:number)=>expect(value).toBeCloseTo(parent.matrix.elements[index],5));
    }
    disposeStPetersModel(root);
  });
  it('retains both Mila courtyard voids and the institution-documented roof counts',async()=>{
    const root=await model('la-pedrera');root.updateMatrixWorld(true);
    const source=readFootprints('la-pedrera',read('sources/exteriors/context/raw/la-pedrera.json'));
    const courts=source.polygon('r8974896')[0].slice(1);
    expect(courts).toHaveLength(2);
    const body=root.getObjectByName('dual-courtyard-envelope')!;
    for(const ring of courts){
      const c=center([[ring]]),point=new T.Vector3(c[0],100,c[1]).applyMatrix4(body.matrixWorld);
      expect(new T.Raycaster(point,new T.Vector3(0,-1,0)).intersectObject(body)).toHaveLength(0);
    }
    const counts=root.getObjectByName('la-pedrera')!.userData.featureCounts;
    expect(counts['six-stairwell-exits']).toBe(6);
    expect(counts['two-ventilation-towers']).toBe(2);
    expect(counts['twenty-nine-chimneys']).toBe(29);
    expect(counts['iron-balcony-rail']).toBe(32);
    expect(counts['courtyard-windows']).toBeGreaterThan(0);
    disposeStPetersModel(root);
  });
  it('uses the two Guell entrance pavilions, not the adjacent school',()=>{
    const keys=landmarks.find(i=>i.slug==='park-guell')!.keys;
    expect(keys).toContain('w672895651');expect(keys).not.toContain('w672896040');
    expect(keys).toContain('r14718228');expect(keys).toContain('r14718230');
  });
});
