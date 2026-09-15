import * as T from 'three';
import clipping from 'polygon-clipping';
import {workshop,palette} from '../churches/primitives.mjs';
import {readFootprints,selectedGeometry,bounds,center,area} from './footprints.mjs';
import {skeleton} from './roof-skeleton.mjs';
import {resolveCoplanarSurfaces,correrSurfacePriority} from './coplanar-surfaces.mjs';

palette.glass=0x60858e;palette.plasterPink=0xdba998;palette.zinc=0x899397;
const number=(s,f)=>Number.isFinite(parseFloat(s))?parseFloat(s):f;
const shape=poly=>{const s=new T.Shape(poly[0].slice(0,-1).map(([x,z])=>new T.Vector2(x,-z)));s.holes=poly.slice(1).map(r=>new T.Path(r.slice(0,-1).map(([x,z])=>new T.Vector2(x,-z))));return s;};
const rectangle=(x,z,w,d,angle=0)=>{const c=Math.cos(angle),s=Math.sin(angle);const p=[[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]].map(([u,v])=>[x+u*c-v*s,z+u*s+v*c]);return [[p.concat([p[0]])]];};

export function buildMuseum(item){
 const source=readFootprints(item.slug),campus=selectedGeometry(source,item.keys),w=workshop(item.slug),review=[];
 const usePartEnvelope=item.slug==='correr';
 const preservePartFootprint=usePartEnvelope||['sforza','doges-palace'].includes(item.slug);
 const whole=item.groundCourts?clipping.difference(campus,...item.groundCourts.map(k=>source.polygon(k))):campus;
 function solid(g,bottom,height,mat,name,topCap=true){
  if(height<=0)return;
  for(const poly of g){
   const geo=new T.ExtrudeGeometry(shape(poly),{depth:height,bevelEnabled:false,steps:1});geo.rotateX(-Math.PI/2);geo.translate(0,bottom,0);
   if(!topCap){
    const indices=[],normal=geo.attributes.normal;
    for(let i=0;i<normal.count;i+=3)if(normal.getY(i)<.5)indices.push(i,i+1,i+2);
    geo.setIndex(indices);
   }
   w.add(geo,name,mat);
  }
 }
 function surface(g,y,mat,name){
  for(const poly of g){const geo=new T.ShapeGeometry(shape(poly));geo.rotateX(-Math.PI/2);geo.translate(0,y,0);w.add(geo,name,mat);}
 }
 if(item.groundCourts){
  // Keep the base solid. Its top is a material partition, not overlapping decals.
  const groundHeight=.22;
  const groundFootprint=clipping.union(campus,...item.groundCourts.map(key=>source.polygon(key)));
  solid(groundFootprint,0,groundHeight,'sandstone','retained-campus-ground',false);
  let remaining=groundFootprint;
  for(const key of item.groundCourts){
   const court=clipping.intersection(remaining,source.polygon(key));
   surface(court,groundHeight,key==='w37703144'?'garden':'sandstone','courtyard-ground');
   remaining=clipping.difference(remaining,court);
  }
  surface(remaining,groundHeight,'sandstone','retained-campus-ground');
 }
 function roof(g,eave,rise,material,name,type='hipped',direction){
  if(type==='flat'||rise<=0){solid(g,eave,.3,material,name);return;}
  if(!g.length)return;
  if(type==='hipped'){
   const triangles=[];
   for(const poly of g){
    if(area([poly])<.05)continue;
    const {vertices,polygons}=skeleton(poly),pitch=Math.min(.6,rise/Math.max(...vertices.map(p=>p[2])));
    for(const face of polygons){const p=face.map(i=>vertices[i]);const indices=T.ShapeUtils.triangulateShape(p.map(v=>new T.Vector2(v[0],v[1])),[]);for(const triangle of indices)for(const i of triangle)triangles.push(p[i][0],eave+p[i][2]*pitch,p[i][1]);}
   }
   if(triangles.length){const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(triangles,3));geo.computeVertexNormals();w.add(geo,name,material);}return;
  }
  let length=0,angle=0;
  for(const poly of g)for(let i=1;i<poly[0].length;i++){const a=poly[0][i-1],p=poly[0][i],d=Math.hypot(p[0]-a[0],p[1]-a[1]);if(d>length){length=d;angle=Math.atan2(p[1]-a[1],p[0]-a[0]);}}
  const n=direction!==undefined?[Math.sin(direction*Math.PI/180),-Math.cos(direction*Math.PI/180)]:[-Math.sin(angle),Math.cos(angle)];
  const values=g.flat(2).map(p=>p[0]*n[0]+p[1]*n[1]),lo=Math.min(...values),hi=Math.max(...values),span=hi-lo||1;
  const edges=g.flatMap(poly=>poly.flatMap(r=>r.slice(1).map((p,i)=>[r[i],p])));
  const height=p=>{
   if(type==='skillion')return rise*(1-(p[0]*n[0]+p[1]*n[1]-lo)/span);
   if(type==='gabled'||type==='round')return rise*(1-Math.abs((p[0]*n[0]+p[1]*n[1]-(lo+hi)/2)/(span/2)));
   return 0;
  };
  const triangles=[];
  function subdivide(a,b,c,depth=0){
   const lengths=[Math.hypot(a[0]-b[0],a[1]-b[1]),Math.hypot(b[0]-c[0],b[1]-c[1]),Math.hypot(c[0]-a[0],c[1]-a[1])];
   const max=Math.max(...lengths),i=lengths.indexOf(max);
   if(max>3.5&&depth<13){const p=[a,b,c],u=p[i],v=p[(i+1)%3],q=p[(i+2)%3],m=[(u[0]+v[0])/2,(u[1]+v[1])/2];subdivide(u,m,q,depth+1);subdivide(m,v,q,depth+1);return;}
   for(const p of [a,b,c])triangles.push(p[0],eave+Math.max(0,height(p)),p[1]);
  }
  let slopes=g;
  if(usePartEnvelope&&type==='gabled'){
   // Split on the actual ridge so no triangle straddles two roof slopes.
   const mid=(lo+hi)/2,limit=10000,t=[-n[1],n[0]];
   const strip=(a,b)=>[[[a,-limit],[b,-limit],[b,limit],[a,limit],[a,-limit]].map(([u,v])=>[n[0]*u+t[0]*v,n[1]*u+t[1]*v])];
   slopes=[...clipping.intersection(g,[strip(lo-1,mid)]),...clipping.intersection(g,[strip(mid,hi+1)])];
  }
  for(const poly of slopes){const geo=new T.ShapeGeometry(shape(poly)),p=geo.attributes.position,idx=geo.index;for(let i=0;i<idx.count;i+=3){const ps=[0,1,2].map(j=>[p.getX(idx.getX(i+j)),-p.getY(idx.getX(i+j))]);if(usePartEnvelope){for(const point of ps)triangles.push(point[0],eave+height(point),point[1]);}else subdivide(...ps);}geo.dispose();}
  // Close the vertical gable ends using exactly the same profile as the roof surface.
  for(const [a,b] of edges){const count=Math.max(1,Math.ceil(Math.hypot(a[0]-b[0],a[1]-b[1])/2));for(let i=0;i<count;i++){const p=[a[0]+(b[0]-a[0])*i/count,a[1]+(b[1]-a[1])*i/count],q=[a[0]+(b[0]-a[0])*(i+1)/count,a[1]+(b[1]-a[1])*(i+1)/count];triangles.push(p[0],eave,p[1],q[0],eave,q[1],q[0],eave+height(q),q[1],p[0],eave,p[1],q[0],eave+height(q),q[1],p[0],eave+height(p),p[1]);}}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(triangles,3));geo.computeVertexNormals();w.add(geo,name,material);
 }
 function rhythm(g,bottom,height,name='window-rhythm'){
  for(const poly of g)for(const ring of poly)for(let i=1;i<ring.length;i++){
   const a=ring[i-1],b=ring[i],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);
   if(length<7)continue;
   const bays=Math.floor(length/5.8),levels=Math.max(1,Math.round(height/8));
   for(let j=0;j<bays;j++)for(let l=0;l<levels;l++){
    const t=(j+.5)/bays,x=a[0]+dx*t,z=a[1]+dz*t;
    w.box(name,x,bottom+2+l*(height/levels),z,Math.min(1.5,length/bays*.34),2.1,.14,'recess',-Math.atan2(dz,dx));
   }
  }
 }
 function band(g,y,name='cornice'){for(const poly of g)for(const r of poly)for(let i=1;i<r.length;i++){const a=r[i-1],b=r[i],d=Math.hypot(b[0]-a[0],b[1]-a[1]);if(d>.6)w.box(name,(a[0]+b[0])/2,y,(a[1]+b[1])/2,d,.35,.36,item.material,-Math.atan2(b[1]-a[1],b[0]-a[0]));}}
 const arcades=item.slug==='uffizi'?[18,19,22,23]:item.slug==='doges-palace'?[62,63,65]:[];
 const arcadeHeight=['doges-palace','brera'].includes(item.slug)?12:item.slug==='camposanto'?8:6;
 let arcadeStrip=[];
 const primary=source.polygon(item.keys[0]);
 const arcadeEdges=arcades.map(i=>[primary[0][0][i],primary[0][0][i+1]]);
 if(['brera','camposanto'].includes(item.slug)){
  const court=primary[0].slice(1).sort((a,b)=>area([[b]])-area([[a]]))[0];
  for(let i=1;i<court.length;i++)if(Math.hypot(court[i][0]-court[i-1][0],court[i][1]-court[i-1][1])>5)arcadeEdges.push([court[i-1],court[i]]);
 }
 for(const [a,b] of arcadeEdges){
  const dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz),angle=Math.atan2(dz,dx);
  const strip=rectangle((a[0]+b[0])/2,(a[1]+b[1])/2,length+1,5,angle);arcadeStrip=arcadeStrip.length?clipping.union(arcadeStrip,strip):strip;
  for(let tier=0;tier<(arcadeHeight===12?2:1);tier++){
   const bays=Math.round(length/(tier?3:5.5)),pitch=length/bays;
   for(let j=0;j<bays;j++){
    const t=(j+.5)/bays;w.arch('open-loggia',a[0]+dx*t,tier*6,a[1]+dz*t,pitch,item.slug==='camposanto'?8:6,.4,.9,'marble',['doges-palace','camposanto'].includes(item.slug),-angle);
   }
  }
 }
 function body(g,bottom,h,material,name){
  if(arcadeStrip.length&&bottom<arcadeHeight){const low=Math.min(h,arcadeHeight-bottom);solid(clipping.difference(g,arcadeStrip),bottom,low,material,name);solid(g,bottom+low,h-low,material,name);}else solid(g,bottom,h,material,name);
 }
 let parts=source.buildings.filter(p=>p.tags['building:part']&&area(p.geometry)>.3&&area(clipping.intersection(p.geometry,whole))>area(p.geometry)*.65);
 if(['brera','medici-chapels','gaudi-house','uffizi'].includes(item.slug))parts=[];
 const grounded=parts.filter(p=>number(p.tags.min_height,0)<1),covered=grounded.length?clipping.union(...grounded.map(p=>p.geometry)):[];
 let base=covered.length?clipping.difference(whole,covered):whole;
 if(usePartEnvelope){
  // OSM's detailed outline and roof/body parts differ slightly. Their residual
  // strips are not separate 22 m buildings; retain the outline at ground only.
  solid(clipping.union(whole,...parts.map(p=>p.geometry)),0,.22,item.material,'outline-foundation');
  base=[];
 }
 if(item.slug==='brera')base=clipping.difference(base,source.polygon('w725694902'));
 if(item.slug==='accademia-venice'){
  const church=source.polygon('w138842956');base=clipping.difference(base,church);
  body(church,0,18,'brick','former-church');roof(church,18,5,'tile','former-church-roof','gabled');
 }
 const lower=item.slug==='vasari-corridor'?7:0;
 let baseHeight=item.height;
 if(item.slug==='museum-ludwig')baseHeight=17;
 body(base,lower,baseHeight-lower,item.slug==='gaudi-house'?'plasterPink':item.material,'primary-envelope');
 if(!['medici-chapels','museum-ludwig'].includes(item.slug))roof(base,baseHeight,3,item.roof,'primary-roof',item.slug==='la-scala'?'flat':'hipped');
 rhythm(base,lower,baseHeight-lower);band(base,baseHeight-.5);
 for(const p of parts){
  // Reviewed tower crowns and wings extend beyond the parent ground outline.
  const t=p.tags,g=preservePartFootprint?p.geometry:clipping.intersection(p.geometry,whole),height=number(t.height,number(t['building:levels'],3)*4.2),bottom=number(t.min_height,0),roofType=t['roof:shape']||'flat';
  const rise=number(t['roof:height'],['gabled','hipped','pyramidal','dome'].includes(roofType)?3:0),eave=Math.max(bottom,height-rise);
  const mat=t['building:material']==='glass'?'glass':t['building:material']==='metal'?'zinc':t['building:material']==='marble'?'marble':item.material;
  body(g,bottom,eave-bottom,mat,'mapped-part');
  if(roofType==='dome'||roofType==='pyramidal'){
   const [x,z]=center(g),b=bounds(g);w.dome('mapped-roof',x,z,eave,(b[2]-b[0])/2,(b[3]-b[1])/2,rise||3,item.roof,roofType==='pyramidal'?4:24,roofType==='pyramidal'?1:.65);
  }else roof(g,eave,rise,t['roof:material']==='glass'?'glass':item.roof,'mapped-roof',roofType,number(t['roof:direction'],undefined));
  if(eave-bottom>5)rhythm(g,bottom,eave-bottom);band(g,eave);
  review.push({key:p.key,height,bottom,roofType,roofHeight:rise,heightEvidence:t.height?'OSM contributor height; respect source fixme, not a survey guarantee':t['building:levels']?'OSM levels x estimated 4.2m':'massing estimate',sourceFixme:t.fixme});
 }
 // Identifiable roof structures, positioned against reviewed footprints. Fine ornament is omitted.
 if(item.slug==='uffizi'){
  const p=source.polygon('w673458435'),[x,z]=center(p),b=bounds(p);body(p,24,3,'sandstone','tribuna-drum');w.dome('tribuna-dome',x,z,27,(b[2]-b[0])/2,(b[3]-b[1])/2,5,'tile',8);w.cylinder('tribuna-lantern',x,32,z,1.2,2,'limestone',8);
 }
 if(item.slug==='medici-chapels'){
  const dome=source.polygon('w673454449'),[x,z]=center(dome),b=bounds(dome);body(dome,19,13,'sandstone','princes-drum');w.pointedDome('princes-dome',x,z,32,(b[2]-b[0])/2,21,'tile',8);w.cylinder('princes-lantern',x,53,z,3.5,6,'limestone',8);
  for(const key of ['w599900772','w599900777']){const g=source.polygon(key),[x,z]=center(g);w.dome('sacristy-dome',x,z,19,6.3,6.3,7,'tile',24);w.cylinder('sacristy-lantern',x,26,z,1.2,2.5,'limestone',8);}
  const nave=source.polygon('w673454455');roof(nave,19,8,'tile','san-lorenzo-nave','gabled');
 }
 if(item.slug==='la-scala'){
  const g=clipping.intersection(whole,rectangle(1,-16,41,35,.76));body(g,21,17,'limestone','stage-tower');band(g,37,'stage-cornice');
  const ellipse=Array.from({length:49},(_,i)=>{const a=i/48*Math.PI*2,u=Math.cos(a)*11,v=Math.sin(a)*18;return [-26+u*.73-v*.68,4+u*.68+v*.73];});
  const e=clipping.intersection(whole,[[ellipse]]);body(e,21,12,'limestone','botta-ellipse');for(let h=22;h<=33;h+=1.2)band(e,h,'ellipse-bands');
 }
 if(item.slug==='gaudi-house'){
  const g=source.polygon('w672895612'),[x,z]=center(g);body(g,10,7,'plasterPink','house-tower');w.cylinder('house-spire',x,17,z,2.7,6,'greenMarble',6,0.1);
  for(let h=10;h<17;h+=2.6)w.recess('tower-window',x,h,z+2,1,1.7,0,false);
 }
 if(item.slug==='brera'){
  const g=source.polygon('w725694902'),[x,z]=center(g);body(g,0,1.2,'limestone','observatory-drum');w.dome('observatory-dome',x,z,1.2,3,3,1.8,'lead');
 }
 if(item.slug==='borghese'){
  const [x,z]=center(whole);for(const side of [-1,1]){const g=clipping.intersection(whole,rectangle(x+side*16*.78,z+side*16*.63-5,12,18,.68));body(g,20,5,'limestone','villa-raised-wing');roof(g,25,3.5,'tile','villa-roof','hipped');}
 }
 if(item.slug==='museum-ludwig'){
  const b=bounds(source.polygon('w10154135')),g=source.polygon('w10154135');
  // Repeated shed profile conveys the documented roof system, not surveyed bay counts.
  for(let x=b[0];x<b[2];x+=14){const part=clipping.intersection(g,rectangle(x+7,(b[1]+b[3])/2,14,b[3]-b[1]+2));if(!part.length)continue;roof(part,17,5,'zinc','shed-roof','skillion',90);}
  const back=source.polygon('w27567143');roof(back,17,2,'zinc','workshop-roof','gabled');
 }
 if(item.slug==='accademia-florence'){
  // Publisher plan, fig. 3A: tribuna inward from the Via Ricasoli entrance.
  // Approximate plan registration, not the unrelated OSM cafe named "Il David".
  const [x,z]=[59.3,18];w.cylinder('david-tribuna-drum',x,14,z,5,2.4,'limestone',32);w.dome('david-tribuna-skylight',x,z,16.4,5,5,3.2,'glass',32);
 }
 if(item.slug==='vatican-museums'){
  const g=source.polygon('w215289671');body(g,23,2,'limestone','sistine-envelope');roof(g,25,3.5,'tile','sistine-roof','gabled');
 }
 const root=w.finish();root.userData.id=`museum-massing:${item.slug}`;
 root.userData.sourceBuildingPartIds=parts.map(part=>part.key);
 if(item.slug==='correr')root.userData.surfaceCleanup=resolveCoplanarSurfaces(root,correrSurfacePriority);
 if(usePartEnvelope){
  root.userData.envelopeMethod='source-parts-with-ground-outline';
 }
 for(const mesh of root.children)if(['retained-campus-ground','courtyard-ground'].includes(mesh.name)){
  mesh.material=mesh.material.clone();mesh.material.side=T.FrontSide;
  mesh.userData.surfaceRole='ground';mesh.castShadow=false;
 }
 root.userData.scope='evidence-backed-exterior-massing';root.userData.sourceOutlineIds=item.keys;
 root.userData.heightPrecision='OSM tagged heights where present; otherwise documented approximate massing';
 const manifest={slug:item.slug,outlineIds:item.keys,retainedGroundCourts:item.groundCourts??[],source:source.data.source,additionalSources:source.data.additionalSources,parts:review,footprintArea:area(campus),courtyardHoles:campus.reduce((n,p)=>n+p.length-1,0),estimatedEnvelopeHeight:item.height,limitations:['Not a measured architectural survey.','Roof subdivisions, window rhythms and cornices are schematic, not exact counts.','No rooms, doors, stairs or indoor routes are inferred from this exterior.',item.scope].filter(Boolean)};
 if(preservePartFootprint)manifest.partBoundaryMethod='Retain owned part outlines, including overhangs outside the parent ground outline.';
 if(usePartEnvelope)manifest.envelopeConstruction={method:'source-parts-with-ground-outline',partCount:parts.length,outlineResidualArea:area(clipping.difference(whole,covered)),outlineRole:'Ground footprint only; no unsupported full-height residual strips.',roofRidges:'Gabled polygons split on their ridge before triangulation.'};
 return {root,manifest,footprint:campus};
}
