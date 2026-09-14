import * as T from 'three';
import {workshop, palette} from '../churches/primitives.mjs';
import {orientedFrame, containsPoint, offset, subtract, intersect} from '../context/geometry.mjs';

palette.glass=0x60858e;
palette.water=0x477f92;
palette.iron=0x35464a;

export function shape(poly) {
  const s=new T.Shape(poly[0].slice(0,-1).map(([x,z])=>new T.Vector2(x,-z)));
  s.holes=poly.slice(1).map(r=>new T.Path(r.slice(0,-1).map(([x,z])=>new T.Vector2(x,-z))));
  return s;
}

export function frame(g) {
  const f=orientedFrame(g),c=Math.cos(f.angle),s=Math.sin(f.angle);
  return {...f, point:(u,v)=>[f.center[0]+u*c-v*s,f.center[1]+u*s+v*c],
    local:p=>[(p[0]-f.center[0])*c+(p[1]-f.center[1])*s,-(p[0]-f.center[0])*s+(p[1]-f.center[1])*c]};
}

export function rectangle(f,u,v,w,d) {
  const r=[[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]].map(([x,z])=>f.point(u+x,v+z));
  return [[r.concat([r[0]])]];
}

// Uniform arc-length samples avoid losing windows on highly segmented OSM curves.
export function boundary(g, spacing=4, holes=true) {
  const result=[];
  for(const poly of g)for(const [ringIndex,ring] of (holes?poly:[poly[0]]).entries()){
    const edges=ring.slice(1).map((b,i)=>({a:ring[i],b,length:Math.hypot(b[0]-ring[i][0],b[1]-ring[i][1])}));
    const total=edges.reduce((s,e)=>s+e.length,0),n=Math.max(1,Math.floor(total/spacing));
    for(let j=0;j<n;j++){
      let distance=(j+.5)*total/n,edge=edges[0];
      for(const e of edges){edge=e;if(distance<=e.length)break;distance-=e.length;}
      const dx=(edge.b[0]-edge.a[0])/edge.length,dz=(edge.b[1]-edge.a[1])/edge.length;
      const p=[edge.a[0]+dx*distance,edge.a[1]+dz*distance];
      let normal=[dz,-dx];
      if(containsPoint(g,[p[0]+normal[0]*.35,p[1]+normal[1]*.35]))normal=normal.map(x=>-x);
      result.push({p,normal,angle:-Math.atan2(dz,dx),pitch:total/n,index:j,hole:ringIndex>0});
    }
  }
  return result;
}

export function builder(slug) {
  const w=workshop(slug);
  function solid(g,bottom,height,mat,name) {
    if(height<=0)return;
    for(const poly of g){const geo=new T.ExtrudeGeometry(shape(poly),{depth:height,bevelEnabled:false,curveSegments:10});geo.rotateX(-Math.PI/2);geo.translate(0,bottom,0);w.add(geo,name,mat);}
  }
  function shell(g,y,height,thickness,mat,name){solid(subtract(g,offset(g,-thickness)),y,height,mat,name);}
  function band(g,y,mat,name='cornice',height=.35){solid(subtract(offset(g,.12),offset(g,-.22)),y,height,mat,name);}
  function windows(g,bottom,height,options={}) {
    const {spacing=4.8,storey=4.1,width=1.5,windowHeight=2.1,filter=()=>true,arched=false,name='facade-windows',balconies=false,balconyCount}=options;
    const levels=Math.max(1,Math.floor(height/storey));
    const edges=boundary(g,spacing).filter(filter),slots=edges.length*Math.max(0,levels-1);
    const balconySlots=balconyCount===undefined?null:new Set(Array.from({length:Math.min(slots,balconyCount)},(_,i)=>Math.floor((i+.5)*slots/Math.min(slots,balconyCount))));
    for(const [edgeIndex,e] of edges.entries()){
      const [x,z]=e.p.map((v,i)=>v+e.normal[i]*.09);
      for(let l=0;l<levels;l++){
        const y=bottom+1+l*storey;
        if(arched)w.recess(name,x,y,z,width,windowHeight,e.angle,false);
        else w.box(name,x,y,z,width,windowHeight,.1,'recess',e.angle);
        if(balconies&&(!balconySlots||l>0&&balconySlots.has(edgeIndex*(levels-1)+l-1))){
          const bx=x+e.normal[0]*.38,bz=z+e.normal[1]*.38;
          w.box('balcony-slab',bx,y-.22,bz,width+1,.18,.8,'limestone',e.angle);
          const tangent=[Math.cos(e.angle),-Math.sin(e.angle)];
          for(let j=0;j<9;j++){
            const u=(j/8-.5)*(width+1),depth=.65+.2*Math.cos(u*2);
            w.beam('iron-balcony-bars',[x+tangent[0]*u+e.normal[0]*depth,y,z+tangent[1]*u+e.normal[1]*depth],[x+tangent[0]*u+e.normal[0]*depth+.08*Math.sin(j),y+.85,z+tangent[1]*u+e.normal[1]*depth],.035,'iron',5);
          }
          w.box('iron-balcony-rail',x+e.normal[0]*.7,y+.85,z+e.normal[1]*.7,width+1,.065,.08,'iron',e.angle);
        }
      }
    }
  }
  function roof(g,y,rise,mat='tile',name='roof') {
    const f=frame(g),vertices=[];
    const height=p=>y+rise*(1-Math.min(1,Math.abs(f.local(p)[1])/(f.width/2)));
    function tri(a,b,c,depth=0){
      const ps=[a,b,c],lens=ps.map((p,i)=>Math.hypot(p[0]-ps[(i+1)%3][0],p[1]-ps[(i+1)%3][1]));
      const i=lens.indexOf(Math.max(...lens));
      if(lens[i]>2.5&&depth<14){const u=ps[i],v=ps[(i+1)%3],q=ps[(i+2)%3],m=u.map((n,j)=>(n+v[j])/2);tri(u,m,q,depth+1);tri(m,v,q,depth+1);return;}
      for(const p of ps)vertices.push(p[0],height(p),p[1]);
    }
    for(const poly of g){
      const geo=new T.ShapeGeometry(shape(poly)),p=geo.attributes.position,idx=geo.index;
      for(let i=0;i<idx.count;i+=3)tri(...[0,1,2].map(j=>[p.getX(idx.getX(i+j)),-p.getY(idx.getX(i+j))]));
      geo.dispose();
      for(const ring of poly)for(let i=1;i<ring.length;i++){const a=ring[i-1],b=ring[i];vertices.push(a[0],y,a[1],b[0],y,b[1],b[0],height(b),b[1],a[0],y,a[1],b[0],height(b),b[1],a[0],height(a),a[1]);}
    }
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.computeVertexNormals();w.add(geo,name,mat);
  }
  function palace(g,height,mat='limestone',name='palace'){
    solid(g,0,height,mat,name);windows(g,0,height-2,{arched:true});
    for(let y=4;y<height;y+=4.5)band(g,y,mat,'storey-bands');
    roof(g,height,Math.min(4,height*.18));
  }
  function arcade(f,u,v,length,bottom,height,depth,mat='limestone',name='open-arcade',pitch=5) {
    const n=Math.max(1,Math.round(length/pitch));
    for(let i=0;i<n;i++){const p=f.point(u+(i+.5)*length/n-length/2,v);w.arch(name,p[0],bottom,p[1],length/n,height,.45,depth,mat,false,-f.angle);}
  }
  function barrel(f,u,v,length,width,y,rise,mat='glass',name='barrel-vault') {
    const ps=[];
    for(let i=0;i<=24;i++){const t=i/24*Math.PI;ps.push([-width/2*Math.cos(t),y+rise*Math.sin(t)]);}
    for(let i=24;i>=0;i--){const t=i/24*Math.PI;ps.push([-(width/2-.2)*Math.cos(t),y-.2+(rise-.2)*Math.sin(t)]);}
    const p=f.point(u,v);
    w.profile(name,ps,p[0],p[1],length,mat,-f.angle+Math.PI/2);
    for(let j=0;j<=Math.ceil(length/6);j++){
      const a=u-length/2+j*length/Math.ceil(length/6);
      for(let i=0;i<24;i++){const t=i/24*Math.PI,q=(i+1)/24*Math.PI,p1=f.point(a,-width/2*Math.cos(t)+v),p2=f.point(a,-width/2*Math.cos(q)+v);w.beam('vault-iron-ribs',[p1[0],y+rise*Math.sin(t)+.05,p1[1]],[p2[0],y+rise*Math.sin(q)+.05,p2[1]],.085,'iron');}
    }
  }
  function fittedBox(g,y,h,mat,name,inset=0){const f=frame(g);const p=f.center;w.box(name,p[0],y,p[1],Math.max(1,f.length-inset),h,Math.max(1,f.width-inset),mat,-f.angle);}
  function stair(a,b,y1,y2,width,name='stair-flight'){
    const len=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.max(1,Math.ceil(Math.max(Math.abs(y2-y1)/.22,len/.6))),angle=-Math.atan2(b[1]-a[1],b[0]-a[0]);
    for(let i=0;i<n;i++){const t=(i+.5)/n,y=y1+(y2-y1)*(i+1)/n;w.box(name,a[0]+(b[0]-a[0])*t,Math.min(y1,y2),a[1]+(b[1]-a[1])*t,len/n,Math.max(.2,y-Math.min(y1,y2)),width,'limestone',angle);}
  }
  const beam=(name,a,b,...args)=>{if(Math.hypot(...a.map((v,i)=>v-b[i]))>.001)w.beam(name,a,b,...args);};
  return {...w,beam,solid,shell,band,windows,roof,palace,arcade,barrel,fittedBox,stair,intersect};
}
