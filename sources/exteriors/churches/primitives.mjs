import * as T from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export const palette = {
  marble: 0xf2efe8, trim: 0xfff8e9, sandstone: 0xc5b598,
  limestone: 0xdbd3be, greyStone: 0x96968a, greenMarble: 0x466964,
  brick: 0xa76851, tile: 0xa65d42, lead: 0x798b8d, recess: 0x27363d,
  gold: 0xc5a558, garden: 0x4c6655,
};

// All construction coordinates use one scale. Small members are schematic;
// they never define indoor spaces, visitor routes or surveyed ornament counts.
export function workshop(slug) {
  const batches = new Map();
  const counts = {};
  const root = new T.Group();
  root.name = slug;
  const record = (name) => { counts[name] = (counts[name] || 0) + 1; };
  function add(geometry, name, material = 'marble', position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1]) {
    geometry.applyMatrix4(new T.Matrix4().compose(new T.Vector3(...position), new T.Quaternion().setFromEuler(new T.Euler(...rotation)), new T.Vector3(...scale)));
    const g = geometry.index ? geometry.toNonIndexed() : geometry;
    if (g !== geometry) geometry.dispose();
    const p = g.attributes.position;
    const uv = new Float32Array(p.count * 2);
    const a = new T.Vector3(), b = new T.Vector3(), c = new T.Vector3(), n = new T.Vector3();
    for (let i = 0; i < p.count; i += 3) {
      a.fromBufferAttribute(p, i); b.fromBufferAttribute(p, i + 1); c.fromBufferAttribute(p, i + 2);
      n.crossVectors(b.sub(a), c.sub(a));
      const axis = Math.abs(n.y) >= Math.max(Math.abs(n.x), Math.abs(n.z)) ? 1 : Math.abs(n.x) > Math.abs(n.z) ? 0 : 2;
      for (let j = i; j < i + 3; j++) {
        uv[j * 2] = (axis === 0 ? p.getZ(j) : p.getX(j)) / 8;
        uv[j * 2 + 1] = (axis === 1 ? p.getZ(j) : p.getY(j)) / 8;
      }
    }
    g.setAttribute('uv', new T.BufferAttribute(uv, 2));
    const key = `${name}|${material}`;
    if (!batches.has(key)) batches.set(key, []);
    batches.get(key).push(g); record(name);
  }
  const box = (name, x, bottom, z, w, h, d, material = 'marble', ry = 0) => add(new T.BoxGeometry(w, h, d), name, material, [x, bottom + h / 2, z], [0, ry, 0]);
  const cylinder = (name, x, bottom, z, radius, h, material = 'marble', sides = 32, topRadius = radius) => add(new T.CylinderGeometry(topRadius, radius, h, sides), name, material, [x, bottom + h / 2, z]);
  const polygon = (name, points, bottom, h, material = 'marble') => {
    const s = new T.Shape(points.map(([x,z]) => new T.Vector2(x,-z)));
    const g = new T.ExtrudeGeometry(s, { depth: h, bevelEnabled: false });
    g.rotateX(-Math.PI/2); g.translate(0,bottom,0); add(g,name,material);
  };
  function profile(name, points, x, z, depth, material, ry=0) {
    const g = new T.ExtrudeGeometry(new T.Shape(points.map(p=>new T.Vector2(...p))), {depth,bevelEnabled:false,curveSegments:16});
    g.translate(0,0,-depth/2); add(g,name,material,[x,0,z],[0,ry,0]);
  }
  function roof(name, x, z, w, d, eave, crest, material='tile', ry=0) {
    profile(name,[[-w/2,eave],[0,crest],[w/2,eave],[w/2,eave-.35],[-w/2,eave-.35]],x,z,d,material,ry);
  }
  function beam(name,a,b,r,material='trim',sides=6) {
    const v=new T.Vector3(...b).sub(new T.Vector3(...a));
    const g=new T.CylinderGeometry(r,r,v.length(),sides);
    g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),v.normalize()));
    g.translate(...new T.Vector3(...a).add(new T.Vector3(...b)).multiplyScalar(.5).toArray());add(g,name,material);
  }
  function arch(name,x,bottom,z,w,h,thickness,depth,material='trim',pointed=false,ry=0) {
    const s=new T.Shape();
    const trace=(s,w,h)=>{
      s.moveTo(-w/2,0);s.lineTo(-w/2,h-w/2);
      if(pointed){s.quadraticCurveTo(-w/2,h-w*.12,0,h);s.quadraticCurveTo(w/2,h-w*.12,w/2,h-w/2);}
      else s.absarc(0,h-w/2,w/2,Math.PI,0,true);
      s.lineTo(w/2,0);s.closePath();
    };
    trace(s,w,h);const hole=new T.Path();trace(hole,w-thickness*2,h-thickness);s.holes.push(hole);
    const g=new T.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:12});g.translate(0,bottom,-depth/2);add(g,name,material,[x,0,z],[0,ry,0]);
  }
  function disk(name,x,y,z,r,material='recess',ry=0) {
    add(new T.CircleGeometry(r,48),name,material,[x,y,z],[0,ry,0]);
  }
  function recess(name,x,bottom,z,width,height,ry=0,pointed=true) {
    const s=new T.Shape();s.moveTo(-width/2,0);s.lineTo(-width/2,height-width/2);
    if(pointed){s.quadraticCurveTo(-width/2,height-width*.1,0,height);s.quadraticCurveTo(width/2,height-width*.1,width/2,height-width/2);}
    else s.absarc(0,height-width/2,width/2,Math.PI,0,true);
    s.lineTo(width/2,0);s.closePath();
    add(new T.ShapeGeometry(s,12),name,'recess',[x,bottom,z],[0,ry,0]);
  }
  function dome(name,x,z,bottom,rx,rz,h,material='lead',sides=48,power=.65,ribs=0) {
    const profile=Array.from({length:25},(_,i)=>{const t=i/24;return new T.Vector2(rx*Math.pow(Math.cos(t*Math.PI/2),power),h*Math.sin(t*Math.PI/2));});
    const g=new T.LatheGeometry(profile,sides);add(g,name,material,[x,bottom,z],[0,0,0],[1,1,rz/rx]);
    for(let i=0;i<ribs;i++) {
      const a=i/ribs*Math.PI*2;
      for(let j=0;j<24;j++) {
        const p=profile[j],q=profile[j+1];
        beam(`${name}-rib`,[x+p.x*Math.sin(a),bottom+p.y,z+p.x*rz/rx*Math.cos(a)],[x+q.x*Math.sin(a),bottom+q.y,z+q.x*rz/rx*Math.cos(a)],.32,'trim');
      }
    }
  }
  function pointedDome(name,x,z,bottom,r,h,material='tile',sides=8) {
    const profile=Array.from({length:25},(_,i)=>{const t=i/24;return new T.Vector2(r*(1-.87*Math.pow(t,1.6)),h*t);});
    add(new T.LatheGeometry(profile,sides),name,material,[x,bottom,z]);
    for(let i=0;i<sides;i++){
      const a=i/sides*Math.PI*2;
      for(let j=0;j<24;j++) {const p=profile[j],q=profile[j+1];beam(`${name}-rib`,[x+p.x*Math.sin(a),bottom+p.y,z+p.x*Math.cos(a)],[x+q.x*Math.sin(a),bottom+q.y,z+q.x*Math.cos(a)],.45,'trim');}
    }
  }
  function pinnacle(name,x,z,bottom,h,r,material='limestone') {
    cylinder(name,x,bottom,z,r,h*.43,material,8,r*.88);
    cylinder(name,x,bottom+h*.43,z,r*1.15,h*.05,material,8,r*1.15);
    cylinder(name,x,bottom+h*.48,z,r,h*.52,material,8,.035);
  }
  function flying(name,x1,y1,x2,y2,z,material='limestone') {
    const s=new T.Shape();const span=x2-x1;
    s.moveTo(x1,y1);s.quadraticCurveTo(x1+span*.55,y2,x2,y2);s.lineTo(x2,y2-1.2);s.quadraticCurveTo(x1+span*.55,y2-1.5,x1,y1-1.5);s.closePath();
    const g=new T.ExtrudeGeometry(s,{depth:1,bevelEnabled:false,curveSegments:12});g.translate(0,0,z-.5);add(g,name,material);
  }
  function finish() {
    const materials = {};
    for(const [key,gs] of batches) {
      const [name,material]=key.split('|');
      materials[material] ??= new T.MeshStandardMaterial({name:material,color:palette[material],roughness:material==='lead'?.7:.86,metalness:material==='lead'?.12:0,side:T.DoubleSide});
      const mesh=new T.Mesh(mergeGeometries(gs),materials[material]);mesh.name=name;mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);gs.forEach(g=>g.dispose());
    }
    root.userData={id:`church-massing:${slug}`,featureCounts:counts,scope:'evidence-backed-exterior-massing',version:'2026-09-10'};
    return root;
  }
  return {root,counts,record,add,box,cylinder,polygon,profile,roof,beam,arch,disk,recess,dome,pointedDome,pinnacle,flying,finish};
}
