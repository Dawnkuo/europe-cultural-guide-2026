// @vitest-environment node
import fs from 'node:fs';
import {describe,it,expect} from 'vitest';
import * as T from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {spanishStepsLayout} from '../../sources/exteriors/landmarks/spanish-steps.mjs';
import {readFootprints,area} from '../../sources/exteriors/museums/footprints.mjs';
import {union,subtract} from '../../sources/exteriors/context/geometry.mjs';
import {disposeStPetersModel} from './st-peters-model';

const source=readFootprints('spanish-steps',JSON.parse(fs.readFileSync('sources/exteriors/context/raw/spanish-steps.json','utf8')));
const layout=spanishStepsLayout(source);

describe('Spanish Steps continuous supported exterior',()=>{
  it('tiles the actual stair area and all three source landings, not just path strips',()=>{
    expect(layout.landings.map(l=>l.id)).toEqual(['w1416143815','w54572036','w54572034']);
    const tiled=union([...layout.treads.map(t=>t.geometry),...layout.landings.map(l=>l.geometry)]);
    // Polygon clipping rounds to millimetres. No navigable-size surface is missing.
    expect(area(subtract(layout.footprint,tiled))).toBeLessThan(.05);
    expect(area(subtract(tiled,layout.footprint))).toBeLessThan(.05);
    expect(area(tiled)/area(layout.footprint)).toBeGreaterThan(.9999);
  });
  it('connects the bottom, flat landings and summit with monotonically rising flights',()=>{
    expect(layout.connections).toHaveLength(9);
    for(const flight of layout.connections){
      expect([0,6.5,12,16]).toContain(flight.start);
      expect([6.5,12,16,22]).toContain(flight.end);
      expect(flight.end).toBeGreaterThan(flight.start);
    }
    expect(layout.connections.filter(f=>f.start===0)).toHaveLength(3);
    expect(layout.connections.filter(f=>f.end===22)).toHaveLength(2);
    expect(layout.approach.map(f=>[f.start,f.end])).toEqual([[22,24],[24,22]]);
  });
  it('exports ground-touching supports and a church seated directly on its base',async()=>{
    const bytes=fs.readFileSync('public/models/landmarks/spanish-steps.glb');
    const root=(await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.length),'')).scene;
    root.updateMatrixWorld(true);
    try{
      let supports=0;
      root.traverse(object=>{
        if(!(object instanceof T.Mesh)||!object.name.endsWith('-support'))return;
        supports++;
        expect(new T.Box3().setFromObject(object).min.y,object.name).toBeCloseTo(0,5);
      });
      expect(supports).toBeGreaterThanOrEqual(8);
      const church=root.getObjectByName('trinita-church')!,ground=root.getObjectByName('church-ground-cutaway')!;
      expect(church).toBeDefined();expect(ground).toBeDefined();
      expect(new T.Box3().setFromObject(church).min.y).toBeCloseTo(new T.Box3().setFromObject(ground).max.y,5);
      expect(root.getObjectByName('stair-flight')).toBeUndefined();
    }finally{disposeStPetersModel(root);}
  });
});
