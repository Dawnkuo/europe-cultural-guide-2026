// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import * as THREE from 'three';
import { buildExteriorContext, fetchExteriorContext, registerContext, landmarkAnchorBounds, type ExteriorContextData } from './exterior-context';
import { buildingHeight, metres, lineBuffer, subtract, union, containsPoint, orientedFrame } from '../../sources/exteriors/context/geometry.mjs';
import { area, readFootprints } from '../../sources/exteriors/museums/footprints.mjs';
import { guideCatalog } from '../data/guides';

const directory=path.resolve('public/maps/exterior-context');
const read=(slug:string):ExteriorContextData=>JSON.parse(fs.readFileSync(path.join(directory,`${slug}.json`),'utf8'));
describe('OSM context geometry',()=>{
  it('preserves a reviewed architectural axis even when the compound is wider',()=>{
    const footprint=[[[[0,0],[100,0],[100,20],[0,20],[0,0]]]];
    expect(orientedFrame(footprint,Math.PI/2)).toMatchObject({angle:Math.PI/2});
    expect(orientedFrame(footprint,Math.PI/2).length).toBeCloseTo(20);
    expect(orientedFrame(footprint,Math.PI/2).width).toBeCloseTo(100);
    expect(orientedFrame(footprint).length).toBeCloseTo(100);
    expect(()=>orientedFrame(footprint,NaN)).toThrow('Invalid reviewed footprint axis');
  });
  it('does not use a decorative plaza as the landmark building footprint',()=>{
    const root=new THREE.Group();
    const tower=new THREE.Mesh(new THREE.BoxGeometry(3,6,3));
    const plaza=new THREE.Mesh(new THREE.BoxGeometry(12,.1,12));
    plaza.userData.contextGround=true;root.add(tower,plaza);
    expect(landmarkAnchorBounds(root).getSize(new THREE.Vector3()).toArray()).toEqual([3,6,3]);
    tower.geometry.dispose();plaza.geometry.dispose();
  });
  it('parses metric and imperial heights without accepting ambiguous values',()=>{
    expect(metres('18.5 m')).toBe(18.5);
    expect(metres('30 ft')).toBeCloseTo(9.144);
    expect(metres('6\' 2"')).toBeCloseTo(1.8796);
    expect(metres('10;12')).toBeNull();
    expect(metres('-4')).toBeNull();
  });
  it('keeps tagged, floor-derived and unknown heights distinct',()=>{
    expect(buildingHeight({height:'20','building:levels':'3'})).toMatchObject({height:20,heightSource:'tagged'});
    expect(buildingHeight({'building:levels':'4','roof:height':'2','building:min_level':'1'})).toEqual({height:14,minHeight:3,heightSource:'levels'});
    expect(buildingHeight({building:'yes'})).toMatchObject({height:9,heightSource:'estimated'});
    expect(buildingHeight({building:'shed'}).height).toBe(3);
  });
  it('unions touching road strips without overlapping triangles or float failures',()=>{
    const a=lineBuffer([[0,0],[100,0]],4),b=lineBuffer([[50,-20],[50,20]],4);
    expect(area(union([a,b]))).toBeCloseTo(400+160-16,2);
    expect(area(subtract(a,b))).toBeCloseTo(384,2);
  });
  it('leaves holes inside polygons after clipping',()=>{
    const outer=[[[[0,0],[20,0],[20,20],[0,20],[0,0]]]];
    const inner=[[[[5,5],[15,5],[15,15],[5,15],[5,5]]]];
    const court=subtract(outer,inner);
    expect(area(court)).toBeCloseTo(300);
    expect(court[0]).toHaveLength(2);
  });
});

describe('all destination surroundings',()=>{
  for(const guide of guideCatalog.filter(g=>g.slug!=='gondola'))it(`${guide.slug}: packaged, finite, source tracked`,()=>{
    const data=read(guide.slug);
    expect(data.slug).toBe(guide.slug);
    expect(data.version).toBe(1);
    expect(data.counts.buildings).toBe(data.buildings.length);
    expect(data.counts.taggedHeights+data.counts.levelHeights+data.counts.estimatedHeights).toBe(data.buildings.length);
    const root=buildExteriorContext(data,new THREE.Box3(new THREE.Vector3(-8,0,-8),new THREE.Vector3(8,12,8))).root;
    let meshes=0;
    root.traverse(object=>{
      if(!(object instanceof THREE.Mesh))return;
      meshes++;
      expect(Array.from(object.geometry.attributes.position.array).every(Number.isFinite)).toBe(true);
      object.geometry.dispose();
      (object.material as THREE.Material).dispose();
    });
    expect(meshes).toBeGreaterThan(0);
    expect(meshes).toBeLessThanOrEqual(9);
  },15000);
  it('retains the exact source-to-display registration for the Vatican model',()=>{
    const data=read('vatican-museums');
    const bytes=fs.readFileSync('public/models/museums/vatican-museums.glb');
    const json=JSON.parse(bytes.toString('utf8',20,20+bytes.readUInt32LE(12)));
    const matrix=json.nodes.find((n:{extras?:{scaleToDisplay?:number}})=>n.extras?.scaleToDisplay).matrix;
    expect(data.registration.matrix).toEqual(matrix);
    expect(registerContext(data,new THREE.Box3()).elements).toEqual(matrix);
  });
  it('fits church metres to the displayed footprint instead of recipe normalization units',()=>{
    const data=read('sagrada-familia');
    const bounds=new THREE.Box3(new THREE.Vector3(-4,0,-5),new THREE.Vector3(4,16,5));
    const expected=10/data.registration.frame!.length;
    const scale=new THREE.Vector3().setFromMatrixScale(registerContext(data,bounds));
    expect(scale.x).toBeCloseTo(expected);
    expect(scale.y).toBeCloseTo(expected);
    expect(scale.z).toBeCloseTo(expected);
  });
  it('aligns the Sagrada nave with its mapped wall and flanking streets',()=>{
    const data=read('sagrada-familia');
    const raw=JSON.parse(fs.readFileSync('sources/exteriors/context/raw/sagrada-familia.json','utf8'));
    const source=readFootprints(data.slug,raw);
    const matrix=registerContext(data,new THREE.Box3(new THREE.Vector3(-4,0,-5),new THREE.Vector3(4,16,5)));
    for(const id of ['w1207779386','w68506235','w293858822']){
      const way=source.lookup.get(id);
      const points=[way.nodes[0],way.nodes.at(-1)].map(n=>source.project(source.lookup.get('n'+n)));
      const direction=new THREE.Vector3(points[1][0]-points[0][0],0,points[1][1]-points[0][1]).transformDirection(matrix);
      expect(Math.abs(direction.x),id).toBeLessThan(Math.sin(Math.PI/180));
    }
  });
  it('places all four Sagrada facades on the officially named street sides',()=>{
    const data=read('sagrada-familia');
    const raw=JSON.parse(fs.readFileSync('sources/exteriors/context/raw/sagrada-familia.json','utf8'));
    const source=readFootprints(data.slug,raw);
    const matrix=registerContext(data,new THREE.Box3(new THREE.Vector3(-4,0,-5),new THREE.Vector3(4,16,5)));
    const streets=[
      ['w294798014','z',1], // Glory: Mallorca, model front +Z.
      ['w551482520','z',-1], // Apse: Provenca, model rear -Z.
      ['w293858822','x',1], // Nativity: Marina, model +X.
      ['w68506235','x',-1], // Passion: Sardenya, model -X.
    ] as const;
    for(const [id,axis,sign] of streets){
      const way=source.lookup.get(id);
      const endpoints=[way.nodes[0],way.nodes.at(-1)].map(n=>source.project(source.lookup.get('n'+n)));
      const point=new THREE.Vector3((endpoints[0][0]+endpoints[1][0])/2,0,(endpoints[0][1]+endpoints[1][1])/2).applyMatrix4(matrix);
      expect(point[axis]*sign,id).toBeGreaterThan(4);
    }
  });
  it('keeps the OSM dome shape and the building beneath a raised part',()=>{
    const data=read('vatican-museums');
    const dome=data.buildings.find(b=>b.id==='w117968816')!;
    expect(dome.roof).toEqual({shape:'dome',height:33});
    expect(dome.minHeight).toBe(60);
    const ring=dome.geometry[0][0],xs=ring.map(p=>p[0]),zs=ring.map(p=>p[1]);
    const center=[(Math.min(...xs)+Math.max(...xs))/2,(Math.min(...zs)+Math.max(...zs))/2];
    expect(data.buildings.some(b=>b.minHeight<50&&b.height>=50&&containsPoint(b.geometry,center))).toBe(true);
  });
  it('uses geographic context instead of magnifying unregistered district placeholders',()=>{
    const data=read('grand-canal');
    const a=registerContext(data,new THREE.Box3(new THREE.Vector3(-1,0,-1),new THREE.Vector3(1,2,1)));
    const b=registerContext(data,new THREE.Box3(new THREE.Vector3(-50,0,-50),new THREE.Vector3(50,100,50)));
    expect(a.elements).toEqual(b.elements);
    expect(a.elements[0]).toBeCloseTo(16/(2*data.radius));
  });
  it('anchors Cologne Triangle to the named building, not its rooftop viewpoint',()=>{
    const data=read('koln-triangle');
    expect(data.registration.footprint.length).toBeGreaterThan(0);
    expect(data.buildings.some(b=>b.id==='w21113435')).toBe(false);
  });
  it('does not make a false fixed location for gondola',async()=>{
    const request=vi.spyOn(globalThis,'fetch');
    expect(await fetchExteriorContext('gondola',new AbortController().signal)).toBeNull();
    expect(request).not.toHaveBeenCalled();request.mockRestore();
  });
  it('rejects missing surroundings separately from the landmark loader',async()=>{
    const request=vi.spyOn(globalThis,'fetch').mockResolvedValue(new Response('',{status:404}));
    await expect(fetchExteriorContext('uffizi',new AbortController().signal)).rejects.toThrow('HTTP 404');
    request.mockRestore();
  });
});
