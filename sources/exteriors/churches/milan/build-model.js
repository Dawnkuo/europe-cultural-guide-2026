import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { evidence, toWorld, crossing, outline, upperCross, naveBays, choirBays, transeptBays, components } from './model-data.js';
import { setMarbleUV, marbleSettings } from './marble-material.js';

export function buildCathedral({ marbleMap = null } = {}) {
  const root = new THREE.Group();
  const buckets = new Map();
  const stats = { pinnacles: 0, arches: 0, majorBodies: 0 };
  const palette = { body: '#f4f1ec', roofs: '#dfddd6', buttresses: '#eee9e2', spires: '#f6f3ee', recess: '#34434a', trim: '#fffaf4' };
  const materials = Object.fromEntries(Object.entries(palette).map(([key, color]) => [key, new THREE.MeshStandardMaterial({ color, map: key === 'recess' ? null : marbleMap, roughness: marbleSettings.roughness, metalness: 0, side: THREE.DoubleSide })]));
  const rootGroups = Object.fromEntries(components.map(c => { const group = new THREE.Group(); group.name = c.id; group.userData.claims = c.claims; root.add(group); return [c.id, group]; }));
  const put = (geometry, category, material = category, matrix) => {
    if (matrix) geometry.applyMatrix4(matrix);
    const flat = geometry.index ? geometry.toNonIndexed() : geometry;
    setMarbleUV(flat);
    const key = category + ':' + material;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(flat);
    if (flat !== geometry) geometry.dispose();
  };
  const transform = (x, y, z, ry = 0) => new THREE.Matrix4().compose(new THREE.Vector3(x,y,z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),ry), new THREE.Vector3(1,1,1));
  const box = (x,y,z,w,h,d,cat,mat=cat,rotation=0) => put(new THREE.BoxGeometry(w,h,d),cat,mat,transform(x,y+h/2,z,rotation));
  const polygon = (points, bottom, top, category, material = category) => {
    const shape = new THREE.Shape(points.map(([x,z]) => new THREE.Vector2(x,-z)));
    const g = new THREE.ExtrudeGeometry(shape,{depth:top-bottom,bevelEnabled:false,steps:1});
    g.rotateX(-Math.PI/2); g.translate(0,bottom,0); put(g,category,material); stats.majorBodies++;
  };
  const rect = (u1,v1,u2,v2,bottom,top,cat,mat=cat) => polygon([[u1,v1],[u2,v1],[u2,v2],[u1,v2]].map(toWorld),bottom,top,cat,mat);
  const cylinder = (x,z,bottom,top,r1,r2,cat,mat=cat,n=8) => put(new THREE.CylinderGeometry(r2,r1,top-bottom,n,1),cat,mat,transform(x,(bottom+top)/2,z,Math.PI/8));
  const beam = (a,b,r,cat,mat=cat) => {
    const from=new THREE.Vector3(...a), to=new THREE.Vector3(...b), d=to.clone().sub(from);
    const g=new THREE.CylinderGeometry(r,r,d.length(),6);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize()));
    g.translate(...from.add(to).multiplyScalar(.5).toArray()); put(g,cat,mat);
  };
  function ridge(u1,v1,u2,v2,eave,crest,axis='long') {
    const [x1,z1]=toWorld([u1,v1]), [x2,z2]=toWorld([u2,v2]);
    const y=axis==='long' ? [[x1,eave],[((x1+x2)/2),crest],[x2,eave],[x2,eave-.3],[x1,eave-.3]] : [[z1,eave],[((z1+z2)/2),crest],[z2,eave],[z2,eave-.3],[z1,eave-.3]];
    const shape=new THREE.Shape(y.map(([a,b])=>new THREE.Vector2(a,b)));
    const g=new THREE.ExtrudeGeometry(shape,{depth:axis==='long'?z2-z1:x2-x1,bevelEnabled:false});
    if (axis==='long') g.translate(0,0,z1); else {g.rotateY(-Math.PI/2);g.translate(x2,0,0);}
    put(g,'roofs');
  }
  const monoRoof = (u1,v1,u2,v2,y1,y2) => {
    const [x1,z1]=toWorld([u1,v1]), [x2,z2]=toWorld([u2,v2]);
    const s=new THREE.Shape([new THREE.Vector2(x1,y1),new THREE.Vector2(x2,y2),new THREE.Vector2(x2,y2-.4),new THREE.Vector2(x1,y1-.4)]);
    const g=new THREE.ExtrudeGeometry(s,{depth:z2-z1,bevelEnabled:false});g.translate(0,0,z1);put(g,'roofs');
  };

  // The base and higher crossing are traced semantic footprints, not a PDF relief.
  polygon(outline.map(toWorld),0,30.8,'body');
  for (const [a,b] of [[315,379],[515,581]]) rect(a,225,b,1157,30.8,36.0,'body');
  rect(180,350,714,419,30.8,36,'body');
  rect(180,555,714,620,30.8,36,'body');
  polygon(upperCross.map(toWorld),30.8,45,'body');
  polygon(outline.map(toWorld),30.8,31.1,'roofs');

  for (const [u1,u2,h1,h2] of [[239,315,31,34.2],[315,379,36,38.0],[515,581,38.0,36],[581,654,34.2,31]]) {
    monoRoof(u1,620,u2,1157,h1,h2);
    monoRoof(u1,225,u2,350,h1,h2);
  }
  ridge(379,225,515,1157,45.1,47.5);
  ridge(180,419,714,555,45.1,47.5,'cross');
  ridge(180,350,714,419,36.1,37,'cross');
  ridge(180,555,714,620,36.1,37,'cross');

  // Polygonal east termination and radial roof ribs follow the inspected roof plan.
  const apseRim = [[379,282],[379,225],[420,185],[473,185],[515,225],[515,282]].map(toWorld);
  const apseCenter=toWorld([447,265]);
  const positions=[];
  for(let i=0;i<apseRim.length-1;i++) positions.push(apseCenter[0],47.5,apseCenter[1],apseRim[i][0],45.1,apseRim[i][1],apseRim[i+1][0],45.1,apseRim[i+1][1]);
  const apseRoof=new THREE.BufferGeometry();apseRoof.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));apseRoof.computeVertexNormals();put(apseRoof,'roofs');
  for(const p of apseRim) beam([p[0],45.4,p[1]],[apseCenter[0],47.9,apseCenter[1]],.22,'roofs','trim');
  for(const [x,v] of [[239,210],[654,210]]) { const [wx,wz]=toWorld([x,v]); box(wx,0,wz,3.2,34,3.2,'body'); }

  function pinnacle(u,v,base,height=15,width=.8) {
    const [x,z]=toWorld([u,v]);
    box(x,base,z,width*1.8,.7,width*1.8,'spires');
    cylinder(x,z,base+.7,base+height*.57,width*.67,width*.56,'spires');
    cylinder(x,z,base+height*.57,base+height*.65,width*.85,width*.7,'spires','trim');
    cylinder(x,z,base+height*.65,base+height,width*.66,.015,'spires');
    stats.pinnacles++;
  }
  function flying(from,to,side=1,axis='x') {
    const span=to[0]-from[0], rise=to[1]-from[1];
    const s=new THREE.Shape();
    s.moveTo(0,from[1]);s.quadraticCurveTo(span*.5,from[1]+rise*.85,span,to[1]);
    s.lineTo(span,to[1]-1.25);s.quadraticCurveTo(span*.5,from[1]+rise*.85-1.8,0,from[1]-1.25);s.closePath();
    const g=new THREE.ExtrudeGeometry(s,{depth:.95,bevelEnabled:false,curveSegments:14});
    if(axis==='x') { g.scale(side,1,1);g.translate(from[0]*side,0,from[2]-.475); }
    else { g.rotateY(-Math.PI/2);g.scale(1,1,side);g.translate(from[2]+.475,0,from[0]*side); }
    put(g,'buttresses'); stats.arches++;
  }
  function sideBay(v,short=false) {
    const z=toWorld([447,v])[1];
    for (const side of [-1,1]) {
      const inner=9.75, middle=19.3, outer=29.8;
      box(side*outer,0,z,2.2,33,2.0,'buttresses');
      box(side*outer,27,z,1.65,12,1.5,'buttresses');
      box(side*middle,34,z,1.35,9,1.25,'buttresses');
      box(side*inner,44,z,1.15,7,1.1,'buttresses');
      flying([inner,49.6,z],[middle,40.2,z],side);
      flying([middle,40.2,z],[outer,33.2,z],side);
      if(!short) {
        pinnacle(447+side*208,v,39,12,1);
        pinnacle(447+side*134,v,42.7,12,.75);
        pinnacle(447+side*68,v,50.5,10.5,.65);
      }
    }
  }
  naveBays.slice(1).forEach(v=>sideBay(v));
  choirBays.forEach(v=>sideBay(v));
  for(const u of transeptBays.filter(u=>u<379||u>515)) {
    const x=toWorld([u,488])[0];
    for(const v of [350,620]) {
      const z=toWorld([u,v])[1];
      box(x,0,z,1.8,38,2.1,'buttresses');pinnacle(u,v,38,14,.85);
      const side=v<488?-1:1, rel=crossing[1]*side;
      flying([9.7+rel,49,x],[19.8+rel,37,x],side,'z');
    }
  }
  // East ambulatory supports are radial; their endpoints come from the roof diagram.
  for(const [a,b] of [ [[379,225],[303,188]],[[420,185],[388,110]],[[473,185],[504,110]],[[515,225],[591,188]] ]) {
    const aa=toWorld(a), bb=toWorld(b);
    beam([aa[0],47.8,aa[1]],[bb[0],34,bb[1]],.85,'buttresses');
    box(bb[0],0,bb[1],2.2,35,2.2,'buttresses');pinnacle(...b,35,17,.95);pinnacle(...a,48,11,.7);
  }

  // Simplified current facade silhouette; intermediate heights are explicitly approximate.
  const frontZ=toWorld([447,1160])[1];
  const facadeProfile=[[-32.3,0],[-32.3,36.5],[-19.2,42],[-9.75,48.5],[0,56.5],[9.75,48.5],[19.2,42],[32.3,36.5],[32.3,0]];
  const facadeShape=new THREE.Shape(facadeProfile.map(p=>new THREE.Vector2(...p)));
  const portalCenters=[-25,-14.5,0,14.5,25];
  for(const x of portalCenters) {
    const w=x===0?5.3:3.3, h=x===0?10.6:8.0;
    const hole=new THREE.Path();hole.moveTo(x-w/2,.05);hole.lineTo(x+w/2,.05);hole.lineTo(x+w/2,h);hole.lineTo(x-w/2,h);hole.closePath();facadeShape.holes.push(hole);
    box(x,.1,frontZ-.25,w,h,0.08,'body','recess');
  }
  const fg=new THREE.ExtrudeGeometry(facadeShape,{depth:1.2,bevelEnabled:false});fg.translate(0,0,frontZ);put(fg,'body');
  for (const [x,h] of [[-31.3,37],[-19.2,43.3],[-9.75,49.5],[9.75,49.5],[19.2,43.3],[31.3,37]]) {
    box(x,0,frontZ+.45,1.65,h,1.8,'buttresses');
    const u=447+x/evidence.plan.scale;pinnacle(u,1165,h,9,.78);
  }
  // Main crossing tower: a low octagonal drum, sloping cap and open spire support.
  const [cx,cz]=crossing;
  cylinder(cx,cz,45,59,13.6,13.6,'spires');
  cylinder(cx,cz,59,60,14.1,14.1,'spires','trim');
  cylinder(cx,cz,60,67.5,13.5,6.3,'spires');
  cylinder(cx,cz,67.5,68.3,6.8,6.8,'spires','trim');
  for(let i=0;i<8;i++) {
    const a=Math.PI/8+i*Math.PI/4;
    beam([cx+13.3*Math.cos(a),45,cz+13.3*Math.sin(a)],[cx+13.3*Math.cos(a),59,cz+13.3*Math.sin(a)],.42,'spires','trim');
    beam([cx+13.3*Math.cos(a),60,cz+13.3*Math.sin(a)],[cx+6*Math.cos(a),68,cz+6*Math.sin(a)],.35,'spires','trim');
    beam([cx+5.4*Math.cos(a),68,cz+5.4*Math.sin(a)],[cx+3.5*Math.cos(a),80,cz+3.5*Math.sin(a)],.45,'spires');
    beam([cx+5.4*Math.cos(a),74,cz+5.4*Math.sin(a)],[cx+2*Math.cos(a),84,cz+2*Math.sin(a)],.3,'spires');
  }
  cylinder(cx,cz,79.7,80.5,4.2,4.2,'spires','trim');
  cylinder(cx,cz,80.5,88,2.2,1.5,'spires');
  cylinder(cx,cz,87.6,88.2,2.1,2.1,'spires','trim');
  cylinder(cx,cz,88.2,evidence.spire.overallWithStatue-evidence.spire.statue,1.5,.08,'spires');
  for(const [u,v] of [[379,419],[515,419],[379,555],[515,555]]) {
    const [x,z]=toWorld([u,v]);
    cylinder(x,z,45,61,2.35,2.35,'spires');cylinder(x,z,59.8,61,2.7,2.7,'spires','trim');
    for(let i=0;i<8;i++) {const a=Math.PI/8+i*Math.PI/4;beam([x+2*Math.cos(a),61,z+2*Math.sin(a)],[x+1.6*Math.cos(a),66,z+1.6*Math.sin(a)],.2,'spires');}
    cylinder(x,z,66,66.7,2.2,2.2,'spires','trim');cylinder(x,z,66.7,72,1.7,.01,'spires');
  }
  for(const [key,gs] of buckets) {
    const [cat,mat]=key.split(':');const merged=mergeGeometries(gs);
    const mesh=new THREE.Mesh(merged,materials[mat]);mesh.name=key;mesh.castShadow=true;mesh.receiveShadow=true;rootGroups[cat].add(mesh);
    gs.forEach(g=>g.dispose());
    if(cat==='body'||cat==='roofs') {
      const edges=new THREE.LineSegments(new THREE.EdgesGeometry(merged,35),new THREE.LineBasicMaterial({color:'#697b81',transparent:true,opacity:.27}));rootGroups[cat].add(edges);
    }
  }
  root.updateMatrixWorld(true);
  return {root,groups:rootGroups,stats,bounds:new THREE.Box3().setFromObject(root)};
}
