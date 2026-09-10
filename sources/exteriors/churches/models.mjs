import * as T from 'three';
import { workshop } from './primitives.mjs';

function apse(w,name,x,z,r,bottom,height,material='limestone',sides=10) {
  const points=[[x-r,z],[x+r,z]];
  for(let i=0;i<=sides;i++) {const a=i/sides*Math.PI;points.push([x+r*Math.cos(a),z-r*Math.sin(a)]);}
  w.polygon(name,points,bottom,height,material);
}

function bellStage(w,name,x,z,bottom,width,height,material='limestone') {
  const p=width*.14;
  for(const sx of [-1,1])for(const sz of [-1,1])w.box(`${name}-pier`,x+sx*(width-p)/2,bottom,z+sz*(width-p)/2,p,height,p,material);
  for(const angle of [0,Math.PI/2,Math.PI,Math.PI*1.5]) {
    const nx=Math.sin(angle),nz=Math.cos(angle);
    for(const offset of [-width*.22,width*.22]){
      w.arch(`${name}-opening`,x+nx*width/2+Math.cos(angle)*offset,bottom,z+nz*width/2-Math.sin(angle)*offset,width*.43,height,.55,p,material,true,angle);
    }
  }
  w.box(`${name}-cornice`,x,bottom+height-.7,z,width+1,1.2,width+1,material);
}

function gothicSides(w,{bays,outer=27,inner=8.8,low=22,high=43,stone='limestone',pinnacles=true}) {
  for(const z of bays)for(const side of [-1,1]) {
    w.box('outer-buttress',side*outer,0,z,2.1,low+3,2.5,stone);
    w.box('upper-pier',side*inner,low,z,1.3,high-low+1.8,1.7,stone);
    w.flying('flying-buttress',side*inner,high+1,side*outer,low+1,z,stone);
    if(pinnacles)w.pinnacle('buttress-pinnacle',side*outer,z,low+3,9,.75,stone);
  }
}

export function cologne() {
  const w=workshop('cologne-cathedral'),m='greyStone';
  w.box('five-aisle-body',0,0,19,55,22,86,m);
  apse(w,'ambulatory',0,-46,27.5,0,22,m);
  w.box('high-nave',0,22,14,18,22,99,m);
  apse(w,'high-choir',0,-47,9,22,22,m);
  w.roof('nave-roof',0,12,20,105,44,61,'lead');
  w.box('transept',0,0,-14,86.25,23,31,m);
  w.box('high-transept',0,23,-14,86.25,21,18,m);
  w.roof('transept-roof',0,-14,20,86.25,44,61,'lead',Math.PI/2);
  for(const side of [-1,1])w.roof('aisle-roof',side*18.5,19,19,86,22,26,'lead');
  gothicSides(w,{bays:[-39,-30,3,13,23,33,43,53],stone:m});
  for(let i=0;i<7;i++) {
    const a=(i+1)/8*Math.PI,x=24*Math.cos(a),z=-46-24*Math.sin(a);
    w.cylinder('radial-chapel',x,0,z,6,15,m,6);
    w.cylinder('chapel-roof',x,15,z,6.8,4,'lead',6,1);
    const ox=30*Math.cos(a),oz=-46-30*Math.sin(a);
    w.box('apse-buttress',ox,0,oz,2,23,2,m);
    w.beam('apse-flying-support',[9*Math.cos(a),43,-46-9*Math.sin(a)],[ox,23,oz],.8,m);
    w.pinnacle('apse-pinnacle',ox,oz,23,10,.8,m);
  }
  w.box('west-facade',0,0,61.5,61.54,44,4,m);
  for(const x of [-21,0,21]){
    w.recess('west-door-recess',x,.1,66,9,x===0?22:19);
    w.arch('west-portal',x,.1,66,12,x===0?24:21,1.4,2,'limestone',true);
  }
  for(const x of [-20.8,20.8]) {
    w.record('principal-tower');
    w.box('tower-base',x,0,55,20,54,21,m);
    for(const side of [-1,1])for(const offset of [-4.4,4.4]){
      w.recess('tower-lancet',x+offset,27,65.6,5.4,23);
      w.arch('tower-lancet-frame',x+offset,27,65.8,6,24,.4,.5,'limestone',true);
      w.box('tower-vertical-shaft',x+side*8.8,0,65.8,1.4,54,1.4,'limestone');
    }
    for(const y of [13,25,52])w.box('tower-string-course',x,y,55,20.7,.7,21.7,'limestone');
    for(const corner of [-1,1])w.box('tower-corner',x+corner*10,0,64,2.2,62,2.6,m);
    bellStage(w,'west-belfry',x,55,54,19,41,m);
    w.cylinder('octagonal-spire-base',x,95,55,9.5,8,m,8,8.6);
    w.cylinder('tower-spire',x,103,55,8.6,54.2,m,8,.08);
    for(let j=0;j<8;j++){
      const a=j/8*Math.PI*2;
      w.beam('spire-rib',[x+8.65*Math.sin(a),103,55+8.65*Math.cos(a)],[x,157.2,55],.32,'limestone');
      if(j%2===0)w.pinnacle('tower-corner-pinnacle',x+10*Math.sin(a),55+10*Math.cos(a),95,15,.8,m);
    }
  }
  w.cylinder('crossing-lantern',0,59,-14,3.2,20,'lead',8,2.8);
  w.cylinder('crossing-spire',0,79,-14,3.2,30.12,'lead',8,.06);
  for(const side of [-1,1]) {
    w.profile('transept-gable',[[-15.5,0],[-15.5,45],[0,69.95],[15.5,45],[15.5,0]],side*42.8,-14,2,m,Math.PI/2);
    w.disk('transept-rose',side*44,33,-14,5.3,'recess',side*Math.PI/2);
    for(const z of [2,12,22,32,42]){
      w.recess('clerestory-window',side*9.05,29,z,5.5,12,side*Math.PI/2);
      w.recess('aisle-window',side*27.55,5,z,5.5,14,side*Math.PI/2);
    }
  }
  return w.finish();
}

export function notreDame() {
  const w=workshop('notre-dame-towers');
  w.box('five-aisle-body',0,0,17,38,19,95,'limestone');
  apse(w,'double-ambulatory',0,-30,21,0,18);
  w.box('central-nave',0,19,11,14,15,91,'limestone');
  apse(w,'high-choir',0,-32,7,19,15);
  w.roof('lead-nave-roof',0,9,15.5,93,34,45,'lead');
  w.box('transept',0,0,-10,48,34,14,'limestone');
  w.roof('lead-transept-roof',0,-10,15.5,48,34,45,'lead',Math.PI/2);
  for(const side of [-1,1])w.roof('gallery-roof',side*13,17,13,95,19,22,'lead');
  gothicSides(w,{bays:[-24,2,12,22,32,42,52],outer:23,inner:7.7,low:19,high:33,pinnacles:false});
  for(let i=0;i<9;i++) {
    const a=(i+1)/10*Math.PI;
    const x=23*Math.cos(a),z=-30-23*Math.sin(a);
    w.cylinder('apsidal-chapel',x*.8,0,-30+(z+30)*.8,5,10,'limestone',6);
    w.cylinder('chapel-roof',x*.8,10,-30+(z+30)*.8,5.5,4,'lead',6,.1);
    w.box('apse-support',x,0,z,1.5,19,2,'limestone');
    w.beam('radial-flying-buttress',[7.8*Math.cos(a),33,-30-7.8*Math.sin(a)],[x,20,z],.7,'limestone');
  }
  w.box('west-facade',0,0,64,43.5,45,3,'limestone');
  for(const x of [-14,0,14]){w.recess('portal-recess',x,.1,65.65,8.5,17.5);w.arch('portal',x,.1,66,11,19,1.4,2,'trim',true);}
  w.disk('west-rose',0,29,65.6,4.8);
  for(const y of [20,35,44])w.box('facade-gallery',0,y,65,44.2,1,2.8,'trim');
  for(const x of [-14,14]) {
    w.record('principal-tower');
    w.box('tower-lower',x,0,57,14.5,45,16,'limestone');
    bellStage(w,'open-belfry',x,57,45,14.5,23,'limestone');
    w.box('flat-tower-roof',x,68,57,15.2,1,16.5,'lead');
  }
  w.cylinder('crossing-spire-base',0,44,-10,3.2,14,'lead',8,2.3);
  w.cylinder('restored-crossing-spire',0,58,-10,2.3,38,'lead',8,.03);
  for(const s of [-1,1]){
    w.profile('transept-gable',[[-7.5,0],[-7.5,34],[0,48],[7.5,34],[7.5,0]],s*24,-10,1.4,'limestone',Math.PI/2);
    w.disk('transept-rose',s*24.8,26,-10,6.5,'recess',s*Math.PI/2);
    for(const z of [3,13,23,33,43]){
      w.recess('clerestory-window',s*7.06,24,z,5.3,8,s*Math.PI/2);
      w.recess('gallery-window',s*19.05,6,z,5.6,10,s*Math.PI/2);
    }
  }
  return w.finish();
}

export function florence() {
  const w=workshop('florence-duomo');
  w.box('three-nave-body',0,0,36,43,22,79);
  w.box('high-nave',0,22,35,19,15,80);
  w.roof('central-tiled-roof',0,35,20,81,37,44);
  for(const s of [-1,1])w.roof('aisle-tiled-roof',s*15.5,36,13,80,22,27);
  w.cylinder('crossing-octagon',0,0,-29,27.5,54,'marble',8);
  for(const [x,z] of [[-25,-29],[25,-29],[0,-54]]) {
    w.record('major-tribune');
    w.cylinder('octagonal-tribune',x,0,z,20,27,'marble',8);
    w.cylinder('tribune-roof',x,27,z,20.8,13,'tile',8,3);
    for(let i=0;i<5;i++) {
      const a=(i-2)*Math.PI/4+(x<0?-Math.PI/2:x>0?Math.PI/2:Math.PI);
      const cx=x+Math.sin(a)*17,cz=z+Math.cos(a)*17;
      if((x<0&&cx<-24)||(x>0&&cx>24)||(z<-50&&cz<-54)){
        w.cylinder('tribune-chapel',cx,0,cz,6,18,'marble',8);
        w.cylinder('chapel-roof',cx,18,cz,6.5,4,'tile',8,1);
      }
    }
  }
  w.cylinder('octagonal-drum-band',0,43,-29,27.8,1.6,'greenMarble',8);
  w.cylinder('octagonal-drum-cornice',0,53,-29,28,1.2,'trim',8);
  w.pointedDome('brunelleschi-dome',0,-29,54,27.5,36,'tile',8);
  w.cylinder('lantern-base',0,90,-29,4.3,2,'trim',8);
  for(let i=0;i<8;i++){
    const a=i/8*Math.PI*2;
    w.cylinder('lantern-column',3.3*Math.sin(a),92,-29+3.3*Math.cos(a),.48,11,'trim',8);
  }
  w.cylinder('lantern-roof',0,103,-29,4.2,8,'trim',8,.6);
  w.cylinder('orb-support',0,111,-29,.55,2,'trim',12);
  w.add(new T.SphereGeometry(1.2,16,12),'orb','gold',[0,114.2,-29]);
  w.beam('cross',[0,115,-29],[0,117,-29],.12,'gold');
  w.beam('cross-arm',[-.7,116.3,-29],[.7,116.3,-29],.12,'gold');
  w.profile('west-facade',[[-23,0],[-23,28],[-11,35],[0,47],[11,35],[23,28],[23,0]],0,76,2.6,'marble');
  for(const x of [-14,0,14]){w.recess('front-door-recess',x,0,77.4,6.3,x===0?20:15.4);w.arch('front-portal',x,0,77.6,8,x===0?22:17,1,1,'greenMarble',true);}
  w.disk('rose-window',0,33,77.5,4);
  for(const x of [-22,-11,11,22])w.box('facade-divider',x,0,77.2,.8,30,1,'greenMarble');
  for(const y of [3,12,22])w.box('facade-band',0,y,77,45,.55,1.3,'greenMarble');
  for(const side of [-1,1])for(let z=4;z<=72;z+=17){
    w.box('nave-bay-divider',side*21.7,0,z,1,23,1.3,'greenMarble');
    w.arch('side-window',side*21.65,7,z-7,5.5,13,.55,.35,'greenMarble',true,side*Math.PI/2);
    w.recess('side-window-recess',side*21.71,7.3,z-7,4.2,11.8,side*Math.PI/2);
  }
  // Giotto's Campanile is detached on the south-west side, not on the nave roof.
  w.box('giotto-campanile',35,0,66,14.5,59,14.5);
  bellStage(w,'campanile-belfry',35,66,59,14.5,24);
  w.box('campanile-roof',35,83,66,16,1.7,16,'trim');
  for(const y of [4,15,27,39,51,58])w.box('campanile-marble-band',35,y,66,14.8,1.1,14.8,'greenMarble');
  for(const sx of [-1,1])for(const sz of [-1,1])w.box('campanile-corner',35+sx*6.8,0,66+sz*6.8,1.1,83,1.1,'greenMarble');
  return w.finish();
}

export function sanMarco() {
  const w=workshop('st-mark-basilica');
  w.box('longitudinal-arm',0,0,0,25,19,66,'brick');
  w.box('transverse-arm',0,0,-3,60,19,25,'brick');
  for(const [x,z,r,h] of [[0,-3,10,14],[0,19,9,12],[0,-25,9,12],[-21,-3,9,12],[21,-3,9,12]]) {
    w.record('principal-dome');w.cylinder('dome-drum',x,19,z,r,5,'limestone',40);
    w.dome('raised-lead-dome',x,z,24,r+.7,r+.7,h,'lead',48,.42);
    w.cylinder('dome-lantern',x,24+h,z,1.1,3,'lead',12,.65);
    w.beam('dome-cross',[x,27+h,z],[x,29+h,z],.13,'gold');
    w.beam('dome-cross-arm',[x-.6,28.3+h,z],[x+.6,28.3+h,z],.13,'gold');
  }
  for(const x of [-8,0,8])apse(w,'east-apse',x,-31,x===0?6:4,0,16,'brick');
  w.box('west-vestibule',0,0,34,57,14,10,'marble');
  w.box('north-vestibule',-28.5,0,17,8,14,25,'marble');
  const xs=[-23,-12,0,12,23],ws=[9,10,12,10,9];
  xs.forEach((x,i)=>{
    const width=ws[i],height=i===2?16:13;
    w.arch('lower-facade-arch',x,0,39.4,width,height,1.15,2,'trim');
    w.profile('lunette-backing',[[-width/2,0],[-width/2,8],[0,height-1],[width/2,8],[width/2,0]],x,38.6,.3,'recess');
    w.arch('upper-facade-arch',x,14,37.4,width,height*.65,.7,1.5,'trim');
    if(i!==2)w.box('upper-panel',x,14,36.9,width,7,.5,'limestone');
  });
  w.box('quadriga-terrace',0,13.2,38.8,58,1,4,'trim');
  for(const x of [-28,-17,-6.5,6.5,17,28]){w.box('facade-crowning-support',x,13,38,1.4,9,1.4,'trim');w.pinnacle('facade-crowning',x,38,22,7,.75,'trim');}
  xs.forEach((x,i)=>w.recess('lower-facade-recess',x,.3,39.1,ws[i]-2.5,i===2?14.5:11.5,0,false));
  w.box('south-treasury',26,0,19,10,17,22,'marble');
  return w.finish();
}

export function grazie() {
  const w=workshop('santa-maria-grazie');
  w.box('solari-naves',0,0,17,26,13,52,'brick');
  w.box('central-nave',0,13,17,12,8,52,'brick');
  w.roof('central-roof',0,17,13,54,21,26);
  for(const s of [-1,1])w.roof('aisle-roof',s*10,17,8,53,13,16);
  w.box('bramante-tribune',0,0,-22,25,22,25,'brick');
  for(const [x,z] of [[-12.5,-22],[12.5,-22],[0,-34.5]]) {
    w.cylinder('tribune-rounded-apse',x,0,z,7.5,14,'brick',32);
    w.dome('apse-cap',x,z,14,8,8,5,'tile');
  }
  w.cylinder('sixteen-sided-tiburio',0,22,-22,14,9,'brick',16);
  w.cylinder('tiburio-gallery-band',0,29.5,-22,14.4,1.1,'trim',16);
  w.cylinder('tiburio-roof',0,31,-22,14.8,7,'tile',16,3);
  w.cylinder('tiburio-lantern',0,38,-22,2.5,5,'brick',8);
  w.cylinder('lantern-cap',0,43,-22,3,3,'tile',8,.1);
  for(let i=0;i<16;i++){
    const a=i/16*Math.PI*2;
    w.arch('tiburio-gallery',14.1*Math.sin(a),24,-22+14.1*Math.cos(a),3.3,4,.45,.4,'trim',false,a);
  }
  w.profile('gabled-front',[[-14,0],[-14,15],[0,27],[14,15],[14,0]],0,44,1.5,'brick');
  w.arch('marble-portal',0,0,45.1,6,10,.75,1.1,'trim');
  w.recess('door-recess',0,0,44.85,4.5,8.8,0,false);
  w.disk('front-rose',0,17,44.85,3.3);
  for(const s of [-1,1])for(let z=-6;z<44;z+=10)w.box('side-buttress',s*13.1,0,z,1.2,14,1.4,'brick');
  w.box('bell-tower',15,0,-33,5,30,5,'brick');
  bellStage(w,'bell-chamber',15,-33,30,5,5,'brick');
  w.cylinder('bell-roof',15,35,-33,4,3,'tile',4,.05);
  return w.finish();
}

export function pisaCathedral() {
  const w=workshop('pisa-cathedral');
  w.box('five-aisle-body',0,0,15,33,15,66);
  w.box('high-nave',0,15,12,14,12,71);
  w.roof('nave-roof',0,12,15.5,72,27,32);
  for(const s of [-1,1])w.roof('aisle-roof',s*12,15,10,67,15,18);
  w.box('three-aisle-transept',0,0,-22,67,17,24);
  w.box('high-transept',0,17,-22,67,10,12);
  w.roof('transept-roof',0,-22,13,68,27,32,'tile',Math.PI/2);
  w.box('choir',0,0,-37,25,24,20);
  apse(w,'eastern-apse',0,-47,9,0,24,'marble');
  w.roof('choir-roof',0,-37,19.6,20,24,29);
  w.add(new T.SphereGeometry(1,32,12,Math.PI,Math.PI,0,Math.PI/2),'apse-half-roof','tile',[0,24,-47],[0,0,0],[9.8,5,9.8]);
  w.add(new T.CylinderGeometry(9.5,9.5,7,48),'elliptical-drum','marble',[0,30.5,-22],[0,0,0],[1,1,12.9/9.5]);
  // The crossing dome is elliptical, not an interchangeable round hemisphere.
  w.dome('elliptical-crossing-dome',0,-22,34,9.6,13,13,'lead',48,.8,0);
  w.cylinder('dome-lantern',0,47,-22,1.6,3,'marble',12);
  w.cylinder('lantern-roof',0,50,-22,2,2,'lead',12,.1);
  for(const s of [-1,1]) {
    w.cylinder('transept-apse',s*32,0,-22,6,19,'marble',32);
    w.dome('transept-apse-cap',s*32,-22,19,6.5,6.5,4,'tile');
  }
  w.profile('rainaldo-facade',[[-17.5,0],[-17.5,20],[-9,25],[0,35],[9,25],[17.5,20],[17.5,0]],0,49,2,'marble');
  for(const x of [-11,0,11]){w.recess('door-recess',x,0,50.15,4.8,9.7,0,false);w.arch('main-door',x,0,50.2,6.5,11,.8,.8,'greyStone');}
  for(const [y,width,count] of [[12,34,15],[18,34,15],[24,19,9],[29,10,5]]) {
    w.box('facade-gallery-floor',0,y,50,width+1,.6,2,'trim');
    for(let i=0;i<count;i++)w.arch('open-facade-loggia',(i-(count-1)/2)*width/count,y+.6,50.4,width/count,4.5,.25,.75,'trim');
  }
  for(const y of [2,6,10,14])for(const s of [-1,1])w.box('pisan-dark-band',s*16.6,y,15,.15,.28,66,'greyStone');
  for(let z=-11;z<47;z+=7)for(const s of [-1,1])w.arch('side-blind-arcade',s*16.7,.2,z,6.3,10,.38,.2,'greyStone',false,s*Math.PI/2);
  return w.finish();
}

export function pisaBaptistery() {
  const w=workshop('pisa-baptistery');
  w.cylinder('circular-lower-body',0,0,0,17.5,13,'marble',72);
  w.cylinder('upper-gallery-body',0,13,0,16.9,13,'marble',72);
  for(const [y,r,h,n] of [[0,17.7,12,20],[13,17.4,9,40]])for(let i=0;i<n;i++) {
    const a=i/n*Math.PI*2;
    w.arch('circumferential-arcade',r*Math.sin(a),y,r*Math.cos(a),2*Math.PI*r/n*.91,h,.35,.55,'trim',y>0,a);
  }
  for(let i=0;i<20;i++){
    const a=i/20*Math.PI*2;
    w.pinnacle('gothic-crown',17.4*Math.sin(a),17.4*Math.cos(a),22,8,.5,'trim');
  }
  w.cylinder('roof-cornice',0,25,0,17.8,1.5,'trim',72);
  // The two covering materials share one outer shell; the inner cone is not a visitor map.
  const profile=Array.from({length:25},(_,i)=>{const t=i/24;return new T.Vector2(17*Math.cos(t*Math.PI/2),22*Math.sin(t*Math.PI/2));});
  for(const [start,mat] of [[0,'lead'],[Math.PI,'tile']])w.add(new T.LatheGeometry(profile,48,start,Math.PI),'double-material-dome',mat,[0,26,0]);
  w.cylinder('crown-lantern',0,47,0,2.3,5,'trim',12);
  w.cylinder('crown-cap',0,52,0,2.5,2,'lead',12,.2);
  return w.finish();
}

export function barcelona() {
  const w=workshop('barcelona-cathedral');
  w.box('chapel-lined-naves',0,0,9,40,21,67,'sandstone');
  apse(w,'ambulatory-and-apse',0,-24.5,20,0,21,'sandstone');
  w.box('high-central-nave',0,21,6,13,7,70,'sandstone');
  apse(w,'high-choir',0,-27,6.5,21,7,'sandstone');
  w.box('nave-roof',0,28,6,14,1,70,'lead');
  for(const side of [-1,1])w.box('aisle-terrace',side*13.5,21,9,13.5,.65,68,'lead');
  for(const z of [-19,-5,9,23,37])for(const side of [-1,1])w.box('chapel-buttress',side*20,0,z,1.5,24,2,'sandstone');
  for(const side of [-1,1]){
    w.record('presbytery-bell-tower');
    w.cylinder('octagonal-bell-tower',side*16,21,-16,5.5,27,'sandstone',8);
    w.cylinder('bell-tower-cornice',side*16,47,-16,5.8,1,'trim',8);
    for(let i=0;i<8;i++){
      const a=i/8*Math.PI*2;
      w.arch('bell-window',side*16+5.1*Math.sin(a),40,-16+5.1*Math.cos(a),3.1,7,.4,.5,'greyStone',true,a);
    }
    w.cylinder('bell-tower-roof',side*16,48,-16,5.5,6,'sandstone',8,4.5);
  }
  // The tall cimbori stands over the entrance bay, not above the crossing.
  w.cylinder('entrance-cimbori',0,28,32,6.8,20,'sandstone',8);
  w.cylinder('cimbori-spire',0,48,32,6.9,22,'sandstone',8,.08);
  for(let i=0;i<8;i++){
    const a=i/8*Math.PI*2;
    w.beam('cimbori-rib',[6.9*Math.sin(a),48,32+6.9*Math.cos(a)],[0,70,32],.3,'trim');
    w.pinnacle('cimbori-corner',7*Math.sin(a),32+7*Math.cos(a),43,9,.5,'trim');
  }
  w.profile('neo-gothic-facade',[[-21,0],[-21,26],[-13,29],[0,42],[13,29],[21,26],[21,0]],0,44.5,2,'sandstone');
  w.arch('west-portal',0,0,45.7,9,22,1.2,1,'trim',true);
  w.recess('west-door-recess',0,0,45.6,6.6,20);
  for(const x of [-15,15])w.arch('facade-lancet',x,9,45.7,6,18,.55,.6,'trim',true);
  for(const x of [-21,-10.5,10.5,21]){
    w.box('facade-pinnacle-support',x,24,45,1.5,4,1.5,'sandstone');
    w.pinnacle('facade-pinnacle',x,45,28,12,.75,'sandstone');
  }
  // Cloister outline and empty courtyard remain visibly distinct from the church body.
  w.box('cloister-outer-west',39,0,38,37,9,6,'sandstone');
  w.box('cloister-outer-east',39,0,7,37,9,6,'sandstone');
  w.box('cloister-outer-south',54.5,0,22.5,6,9,25,'sandstone');
  w.box('cloister-garden',39,.03,22.5,23,.1,23,'garden');
  for(const z of [10,35])for(let x=26;x<54;x+=5)w.arch('cloister-arcade',x,0,z,4.5,7,.4,.7,'sandstone',true);
  return w.finish();
}

export function santaMariaMar() {
  const w=workshop('santa-maria-mar');
  w.box('hall-church-body',0,0,10,33,26,66,'sandstone');
  apse(w,'polygonal-ambulatory',0,-23,16.5,0,26,'sandstone',8);
  w.box('central-high-nave',0,26,5,13,7,68,'sandstone');
  apse(w,'high-apse',0,-29,6.5,26,7,'sandstone',8);
  w.box('flat-central-roof',0,33,5,14,.7,68,'lead');
  for(const side of [-1,1])w.box('side-roof-terrace',side*11.5,26,10,10,.7,66,'lead');
  for(const z of [-17,0,17,34])for(const side of [-1,1])w.box('external-solid-buttress',side*16.8,0,z,2,28,2.5,'sandstone');
  w.box('plain-west-facade',0,0,43.5,34,30,2,'sandstone');
  w.arch('west-portal',0,0,44.7,10,17,1.1,1,'trim',true);
  w.recess('west-door-recess',0,0,44.65,7.6,15.5);
  w.disk('west-rose',0,23,44.65,4.4);
  for(const side of [-1,1]) {
    w.record('principal-tower');
    w.cylinder('slender-octagonal-tower',side*16,0,41,3.7,31,'sandstone',8);
    w.cylinder('belfry',side*16,31,41,3.7,9,'sandstone',8);
    for(let i=0;i<8;i++){
      const a=i/8*Math.PI*2;
      w.arch('belfry-opening',side*16+3.5*Math.sin(a),33,41+3.5*Math.cos(a),2,6,.3,.2,'greyStone',true,a);
    }
    w.cylinder('flat-tower-cornice',side*16,40,41,4,1,'trim',8);
  }
  return w.finish();
}

export const builders = {
  'santa-maria-grazie':grazie,'st-mark-basilica':sanMarco,
  'florence-duomo':florence,'pisa-cathedral':pisaCathedral,'pisa-baptistery':pisaBaptistery,
  'barcelona-cathedral':barcelona,'santa-maria-mar':santaMariaMar,
  'cologne-cathedral':cologne,'notre-dame-towers':notreDame,
};
