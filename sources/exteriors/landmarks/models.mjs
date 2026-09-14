import fs from 'node:fs';
import * as T from 'three';
import {readFootprints,selectedGeometry,center,area} from '../museums/footprints.mjs';
import {containsPoint,offset,subtract,intersect,union,buildingHeight} from '../context/geometry.mjs';
import {builder,frame,rectangle,boundary} from './geometry.mjs';
import {buildSpanishSteps} from './spanish-steps.mjs';

export function buildLandmark(item) {
  const raw=item.keys.length?JSON.parse(fs.readFileSync(new URL(`../context/raw/${item.slug}.json`,import.meta.url))):null;
  const source=raw?readFootprints(item.slug,raw):null;
  const g=source?selectedGeometry(source,item.keys):[],w=builder(item.slug),notes=[];
  const polygon=key=>source.polygon(key),f=g.length?frame(g):null;
  const at=(key)=>center(polygon(key));
  function box(f,u,y,v,width,height,depth,mat,name){const p=f.point(u,v);w.box(name,p[0],y,p[1],width,height,depth,mat,-f.angle);}
  function tower(g,height,mat='brick',name='tower'){
    const f=frame(g),[x,z]=f.center,b=Math.min(f.length,f.width);
    w.solid(g,0,height*.68,mat,name);
    for(const side of [-1,1]){
      w.arcade(f,0,side*b*.42,b*.8,height*.68,height*.13,b*.12,'limestone',`${name}-belfry`,b/3);
      const q={...f,angle:f.angle+Math.PI/2,point:(u,v)=>f.point(-v,u)};
      w.arcade(q,0,side*b*.42,b*.8,height*.68,height*.13,b*.12,'limestone',`${name}-belfry`,b/3);
    }
    w.solid(g,height*.81,height*.055,'limestone',`${name}-attic`);
    w.add(new T.ConeGeometry(b*.69,height*.13,4),`${name}-pyramidal-spire`,'greenMarble',[x,height*.865+height*.065,z],[0,Math.PI/4-f.angle,0]);
    w.cylinder(`${name}-finial`,x,height*.995,z,b*.04,height*.005,'gold',8,0);
    for(let y=height*.18;y<height*.67;y+=height*.15)w.band(g,y,mat,`${name}-shaft-band`,.28);
  }
  function archMonument(g,height,three=false){
    const f=frame(g),wide=f.length,depth=f.width;
    if(three){w.arcade(f,0,0,wide,0,height*.72,depth,'limestone','triumphal-openings',wide/3);}
    else w.arcade(f,0,0,wide,0,height*.75,depth,'limestone','triumphal-opening',wide);
    w.solid(g,height*.75,height*.25,'limestone','triumphal-attic');
  }
  function fountain(g,obelisk=false){
    w.solid(g,.05,.6,'limestone','fountain-basin');
    w.solid(offset(g,-.5),.66,.04,'water','fountain-water');
    const p=center(g),r=Math.sqrt(area(g)/Math.PI);
    if(obelisk){w.cylinder('obelisk-base',p[0],.7,p[1],2.3,4,'limestone',8);w.cylinder('obelisk',p[0],4.7,p[1],1.1,16,'sandstone',4,.45);w.cylinder('obelisk-tip',p[0],20.7,p[1],.45,1,'sandstone',4,0);}
    else {w.cylinder('fountain-pedestal',p[0],.7,p[1],r*.16,1.4,'limestone',12);w.cylinder('fountain-bowl',p[0],2.1,p[1],r*.3,.4,'limestone',24);}
  }

  if(item.slug==='la-pedrera'){
    w.solid(g,0,26,'limestone','dual-courtyard-envelope');
    const samples=boundary(g,.65);
    for(const y of [4.2,8.5,12.7,16.8,20.8,25.8])for(let i=1;i<samples.length;i++){
      const a=samples[i-1],b=samples[i];
      if(Math.hypot(a.p[0]-b.p[0],a.p[1]-b.p[1])>1.5)continue;
      w.beam('undulating-stone-bands',[a.p[0]+a.normal[0]*.16,y+.16*Math.sin(i*.35),a.p[1]+a.normal[1]*.16],[b.p[0]+b.normal[0]*.16,y+.16*Math.sin((i+1)*.35),b.p[1]+b.normal[1]*.16],.18,'limestone',8);
    }
    const street=e=>!e.hole&&e.normal[1]>.02;
    w.windows(g,.6,24,{spacing:4.6,storey:4.2,width:1.65,windowHeight:2.35,arched:true,filter:street,balconies:true,balconyCount:32,name:'street-window-recesses'});
    w.windows(g,0,24,{spacing:4.6,storey:4.2,filter:e=>e.hole,name:'courtyard-windows'});
    w.shell(g,26,1,.35,'limestone','roof-parapet');
    // Counts/heights are documented; distribution is a conservative roof-fit,
    // not a surveyed claim about individual chimney positions.
    const safe=offset(g,-2),candidates=[];
    for(let x=-23;x<43;x+=2)for(let z=-26;z<27;z+=2)if(containsPoint(safe,[x,z]))candidates.push([x,z]);
    const chosen=[];
    function next(){let best,score=-1;for(const p of candidates){const dist=chosen.length?Math.min(...chosen.map(q=>Math.hypot(p[0]-q[0],p[1]-q[1]))):Math.hypot(...p);if(dist>score){score=dist;best=p;}}chosen.push(best);return best;}
    for(let i=0;i<6;i++){
      const [x,z]=next();
      const profile=[new T.Vector2(1.6,0),new T.Vector2(1.6,1),new T.Vector2(1.05,3.6),new T.Vector2(.75,5.1),new T.Vector2(1.1,5.7),new T.Vector2(.12,7)];
      w.add(new T.LatheGeometry(profile,12),'six-stairwell-exits',i<4?'trim':'limestone',[x,26,z]);
      w.recess('roof-door',x,26.1,z+1.62,.8,1.8,0,false);
    }
    for(let i=0;i<2;i++){const [x,z]=next();w.cylinder('two-ventilation-towers',x,26,z,1.35,4.1,'limestone',12,.8);w.add(new T.SphereGeometry(1.2,12,8),'ventilation-caps','limestone',[x,30.1,z],[0,0,0],[1,.75,1]);}
    for(let i=0;i<29;i++){
      const [x,z]=next();
      const profile=[new T.Vector2(.52,0),new T.Vector2(.4,2.4),new T.Vector2(.78,2.85),new T.Vector2(.65,3.45),new T.Vector2(.1,4)];
      w.add(new T.LatheGeometry(profile,10),'twenty-nine-chimneys','limestone',[x,26,z]);
      w.box('chimney-dark-vent',x,29,z+.68,.65,.25,.06,'recess');
    }
    notes.push('Roof counts: 6 stair exits, 2 ventilation towers, 29 chimneys. Placements and balcony rhythm are schematic; both OSM courtyard holes are preserved.');
  } else if(item.slug==='galleria-vittorio'){
    const cross=polygon('w166623705'),octagon=polygon('w176511666');
    w.shell(cross,0,21,1.3,'limestone','cross-gallery-walls');
    w.windows(cross,5,15,{arched:true,spacing:5,storey:5});
    for(const key of ['w291181788','w291181789','w291181790']){const gf=frame(polygon(key));w.barrel(gf,0,0,gf.length,gf.width,21,12);}
    // Fourth arm is the shorter east gallery, within the mapped cross.
    const c=center(octagon),east=intersect(cross,rectangle({point:(u,v)=>[u,v]},(c[0]+52)/2,c[1],52-c[0],15));
    if(east.length){const ef=frame(east);w.barrel(ef,0,0,ef.length,ef.width,21,12);}
    const of=frame(octagon);w.dome('octagonal-glass-dome',of.center[0],of.center[1],33,of.length/2,of.width/2,15,'glass',8,.65,8);
    const entrances=boundary(cross,6,false).filter(e=>Math.abs(e.p[1])>80);
    if(entrances.length){const e=entrances[0];w.arch('triumphal-entrance',e.p[0],0,e.p[1],16,24,2,3,'limestone',false,e.angle);}
  } else if(['ponte-vecchio','rialto'].includes(item.slug)){
    const n=item.slug==='rialto'?1:3,span=f.length*.8/n,width=f.width*.63;
    for(let i=0;i<n;i++){
      const u=(i-(n-1)/2)*span,p=f.point(u,0);
      w.arch('open-bridge-arches',p[0],0,p[1],span,item.slug==='rialto'?8:9,1.1,width,'limestone',false,-f.angle);
    }
    for(let i=0;i<32;i++){
      const u=(i+.5)/32*f.length-f.length/2,y=9+(item.slug==='rialto'?4:1.2)*(1-Math.abs(u)/(f.length/2));
      const strip=intersect(g,rectangle(f,u,0,f.length/32+.01,f.width));w.solid(strip,y,.45,'limestone','bridge-deck');
      for(const side of [-1,1])if(Math.abs(u)>f.length*.095){
        const part=intersect(g,rectangle(f,u,side*f.width*.32,f.length/32+.01,f.width*.22));w.solid(part,y+.45,3.1,i%4===0?'sandstone':'limestone','bridge-shops');w.roof(part,y+3.55,1.1,'tile','shop-roofs');
      }
    }
    if(item.slug==='ponte-vecchio'){
      const cg=intersect(g,rectangle(f,0,-f.width*.31,f.length,f.width*.19));w.solid(cg,14.8,3.3,'sandstone','vasari-elevated-corridor');w.windows(cg,14.8,3.3,{spacing:4,windowHeight:1.2});w.roof(cg,18.1,1.1);
    }else for(const side of [-1,1])w.arcade(f,0,side*f.width*.32,6,13.5,6,1,'marble','central-porticoes',6);
  } else if(item.slug==='st-mark-campanile')tower(g,98.6);
  else if(item.slug==='st-mark-square'){
    for(const key of item.keys.slice(0,3)){
      const p=polygon(key);w.solid(p,5,16,'limestone','procuratie-upper-storeys');w.windows(p,5,15,{arched:true,spacing:4.5});w.roof(p,21,3);
      for(const e of boundary(p,4.5,false))w.arch('procuratie-ground-arcades',e.p[0],0,e.p[1],e.pitch,5,.5,1,'limestone',false,e.angle);
    }
    tower(polygon('w252637693'),98.6);
  } else if(item.slug==='fenice'){
    const stage=polygon('w813451654');w.palace(subtract(g,stage),20);w.solid(stage,0,35.6,'limestone','raised-stage-house');w.roof(stage,35.6,2,'lead');
    const entry=polygon('w813451657'),ef=frame(entry);w.arcade(ef,0,ef.width/2,ef.length,0,6,1,'limestone','classical-entrance',ef.length/3);w.band(entry,6,'trim');
  } else if(item.slug==='mercato-centrale'){
    w.solid(g,0,4.5,'sandstone','market-masonry-base');w.shell(g,4.5,6.5,.3,'glass','market-glazed-hall');
    for(const e of boundary(g,5,false))w.beam('iron-uprights',[e.p[0],4.5,e.p[1]],[e.p[0],11,e.p[1]],.14,'iron');
    w.roof(g,11,4,'lead','iron-hall-roof');const lantern=intersect(g,rectangle(f,0,0,f.length*.83,f.width*.2));w.shell(lantern,14,2,.2,'glass','raised-glass-lantern');w.roof(lantern,16,1.2,'lead');
  } else if(item.slug==='signoria'){
    const palace=polygon('r1461712'),tg=polygon('w361442653'),lf=frame(polygon('w43284457'));
    w.palace(subtract(palace,tg),32,'sandstone','palazzo-vecchio');
    tower(tg,94,'sandstone','arnolfo-tower');
    for(const e of boundary(palace,3,false))w.box('palace-crenellations',e.p[0],32,e.p[1],1.5,1.4,1.1,'sandstone',e.angle);
    for(const side of [-1,1])w.arcade(lf,0,side*lf.width/2,lf.length,0,12,1.4,'sandstone','lanzi-open-loggia',lf.length/3);
    w.solid(polygon('w43284457'),12,2,'sandstone','lanzi-roof');
  } else if(item.slug==='giunti-odeon'){
    w.palace(polygon(item.keys[0]),18,'sandstone','strozzino-palace');
    const cinema=polygon(item.keys[1]);w.solid(cinema,0,18,'sandstone','cinema-envelope');w.windows(cinema,0,16,{arched:true});w.roof(cinema,18,2,'tile','cinema-roof');
  } else if(item.slug==='colosseum'){
    const parts=source.buildings.filter(p=>/^r(183482[5-9]|183483[01]|3371742|1966683[456])$/.test(p.key));
    for(const p of parts){
      const h=buildingHeight(p.tags).height;
      if(h<5){w.solid(p.geometry,0,h,'brick','mapped-low-remains');continue;}
      // Open bays are shallow facade cuts; source-part outlines and heights
      // control the surviving ruin, including the missing southern outer wall.
      const samples=boundary(p.geometry,6.5,false),openings=samples.map(e=>rectangle({point:(u,v)=>[e.p[0]+u*Math.cos(-e.angle)-v*Math.sin(-e.angle),e.p[1]+u*Math.sin(-e.angle)+v*Math.cos(-e.angle)]},0,0,3.2,5));
      const cuts=union(openings);
      let y=0;
      for(;y+10<h;y+=12){
        w.solid(subtract(p.geometry,cuts),y,6,'limestone','surviving-arcade-piers');
        for(let k=0;k<8;k++){
          const t=(k+.5)/8,half=1.6*Math.sqrt(1-t*t);
          const tops=union(samples.map(e=>rectangle({point:(u,v)=>[e.p[0]+u*Math.cos(-e.angle)-v*Math.sin(-e.angle),e.p[1]+u*Math.sin(-e.angle)+v*Math.cos(-e.angle)]},0,0,half*2,5)));
          w.solid(subtract(p.geometry,tops),y+6+k*.2,.2,'limestone','arcade-arch-heads');
        }
        w.solid(p.geometry,y+7.6,4.4,'limestone','arcade-entablatures');
      }
      w.solid(p.geometry,y,h-y,'limestone','surviving-upper-fabric');
    }
  } else if(item.slug==='roman-forum'){
    for(const key of item.keys){const p=polygon(key);
      if(key==='r1841079'){w.palace(p,25,'brick','standing-curia');}
      else if(key==='r1841089'){const q=center(p);w.solid(p,0,13,'brick','romulus-rotunda');w.dome('romulus-dome',q[0],q[1],13,8,8,8,'tile');}
      else if(key==='w49824161'||key==='w23913953')archMonument(p,key==='w23913953'?15.4:20,key==='w49824161');
      else if(key==='r1841090'){const pf=frame(p);for(let i=0;i<6;i++){const q=pf.point((i-2.5)*pf.length/6,0);w.cylinder('antoninus-standing-columns',q[0],0,q[1],.7,14,'limestone',12);}w.fittedBox(p,14,1,'limestone','antoninus-entablature');}
      else {w.solid(p,.03,.18,'sandstone','archaeological-extent');w.shell(p,.21,key==='r1841078'?15:1.6,1.3,'brick','mapped-ruin-perimeters');}
    }
    notes.push('Low perimeter sections describe mapped archaeological extents, not surveyed surviving wall-by-wall heights.');
  } else if(item.slug==='palatine'){
    for(const key of item.keys){const p=polygon(key);w.solid(p,.04,.15,'sandstone','named-palace-archaeological-extent');w.shell(p,.19,key==='r1860920'?5:1.2,1.2,'brick','palatine-remains');}
    notes.push('No invented complete palaces or artificial hillside. Model preserves six named archaeological extents and schematic low sections.');
  } else if(item.slug==='piazza-venezia'){
    // Mapped building parts determine the high rear structure; terraces are
    // stepped within the actual main envelope, never around an invented box.
    const vf=frame(g),parts=source.buildings.filter(p=>p.tags['building:part']&&area(intersect(p.geometry,g))>area(p.geometry)*.85);
    for(let i=0;i<6;i++){const terrace=intersect(g,rectangle(vf,0,vf.width*.33-i*vf.width*.1,vf.length, vf.width*(.35+i*.1)));w.solid(terrace,i*3,3,'marble','vittoriano-stepped-terraces');}
    const high=parts.filter(p=>buildingHeight(p.tags).height>50);
    for(const p of high)w.solid(p.geometry,30,buildingHeight(p.tags).height-30,'marble','mapped-high-propylaea');
    const rear=intersect(g,rectangle(vf,0,-vf.width*.29,vf.length*.85,vf.width*.2));
    if(rear.length){const rf=frame(rear);w.arcade(rf,0,0,rf.length,30,14,3,'marble','upper-open-portico',5);w.solid(rear,44,2,'marble','upper-portico-roof');}
  } else if(item.slug==='trevi'){
    w.palace(polygon('w131235596'),26,'limestone','palazzo-poli');fountain(polygon('r13448560'));
    const bg=polygon('w131235596'),front=boundary(bg,5,false).filter(e=>e.normal[1]>.8).sort((a,b)=>Math.abs(a.p[0])-Math.abs(b.p[0]))[0];
    if(front){w.arch('central-triumphal-fountain-niche',front.p[0],3,front.p[1]+.5,10,20,1.7,1,'limestone',false,front.angle);for(const dx of [-10,-6,6,10])w.cylinder('fountain-corinthian-columns',front.p[0]+dx,3,front.p[1]+1.2,.65,17,'limestone',16);}
    for(let i=0;i<9;i++){const p=frame(polygon('r13448560')).point((i-4)*3,-3);w.add(new T.DodecahedronGeometry(2.5),'fountain-rock-base','limestone',[p[0],1.5,p[1]],[0,i*.4,0],[1,.5,1]);}
  } else if(item.slug==='spanish-steps'){
    const site=buildSpanishSteps(w,source),base=site.churchLevel;
    w.solid(g,base,18,'limestone','trinita-church');w.roof(g,base+18,4);
    const cf=frame(g);for(const side of [-1,1]){const tg=intersect(g,rectangle(cf,-cf.length*.34,side*cf.width*.32,7,7));if(tg.length){w.solid(tg,base+18,8,'limestone','trinita-twin-bell-towers');w.roof(tg,base+26,3,'lead');}}
    fountain(polygon('w662008076'));
    notes.push('Full stair area w134400816 and landing polygons w1416143815, w54572036, w54572034 replace disconnected path strips. Every tread and landing has support to the common datum. Landing levels 6.5/12/16 m, upper street 22 m and church 24 m are display approximations, not terrain survey. OSM step_count tags are not treated as a consistent measured vertical profile.');
  } else if(item.slug==='piazza-navona'){
    w.solid(g,0,22,'limestone','sant-agnese-envelope');w.roof(g,22,3);
    const dome=at('w60575536');w.cylinder('sant-agnese-drum',dome[0],23,dome[1],8,8,'limestone',24);w.dome('sant-agnese-dome',dome[0],dome[1],31,8,8,10,'lead',32,.7,8);
    for(const key of ['w52332687','w262032514','r5150432'])fountain(polygon(key),key==='w52332687');
    for(const side of [-1,1]){const p=[-30,20+side*17];w.box('sant-agnese-bell-tower',p[0],22,p[1],6,13,6,'limestone');w.dome('sant-agnese-bell-cap',p[0],p[1],35,3,3,5,'lead');}
  } else if(item.slug==='vatican-post'){
    w.solid(g,0,4,'limestone','post-office-pavilion');w.windows(g,0,4,{spacing:3,width:1.8});w.band(g,4,'trim','flat-roof-cornice',.3);
  } else if(item.slug==='park-guell'){
    for(const key of ['w672895475','w672895651']){
      const p=polygon(key),pf=frame(p);w.solid(p,0,key==='w672895475'?10:7,'sandstone','entrance-pavilion');w.windows(p,0,8,{arched:true,spacing:3.5});
      w.dome('pavilion-organic-roof',pf.center[0],pf.center[1],key==='w672895475'?10:7,pf.length/2,pf.width/2,4,'tile',24,.4);
      w.pinnacle('pavilion-roof-tower',pf.center[0],pf.center[1],key==='w672895475'?14:11,key==='w672895475'?4:10,1.4,'trim');
    }
    const hall=polygon('r14718228'),hf=frame(hall);
    for(let x=-hf.length/2+2;x<hf.length/2;x+=4.6)for(let z=-hf.width/2+2;z<hf.width/2;z+=4.6){const p=hf.point(x,z);if(containsPoint(hall,p))w.cylinder('hypostyle-columns',p[0],8,p[1],.65,6,'limestone',12,.55);}
    const square=polygon('r14718230');w.solid(square,14,.45,'sandstone','nature-square');
    for(const e of boundary(square,1.5,false))if(e.normal[1]>.1){w.box('serpentine-bench',e.p[0],14.45,e.p[1],1.5,.7,.5,'trim',e.angle);}
    const stairs=source.data.elements.filter(e=>e.type==='way'&&e.tags?.highway==='steps').map(e=>e.nodes.map(n=>source.project(source.lookup.get('n'+n)))).filter(p=>p.every(q=>q[0]>10&&q[0]<65&&q[1]>40&&q[1]<90));
    for(const path of stairs)for(let i=1;i<path.length;i++)w.stair(path[i-1],path[i],Math.max(0,(90-path[i-1][1])*.18),Math.max(0,(90-path[i][1])*.18),4,'monumental-zone-stairs');
    notes.push('Column rhythm is approximate, not an asserted 86-position survey. No model of the entire park terrain.');
  } else if(item.slug==='turo-rovira'){
    w.solid(g,.03,.15,'greyStone','battery-platform');w.shell(g,.18,1,.5,'greyStone','surviving-battery-boundaries');
    const pavilion=polygon('w1167567030');w.palace(pavilion,3,'greyStone','officers-pavilion');
  } else if(item.slug==='palau-musica'){
    const main=polygon('w671830491'),annex=polygon('w671830480');w.solid(main,0,21,'brick','concert-hall-envelope');w.roof(main,21,4,'tile');w.windows(main,1,18,{spacing:3.4,storey:6,arched:true,width:1.8,windowHeight:3.3});
    for(const e of boundary(main,3.4,false)){const p=e.p.map((x,i)=>x+e.normal[i]*.45);w.cylinder('polychrome-balcony-columns',p[0],8,p[1],.25,5,'trim',12);w.box('balcony-base',p[0],7.7,p[1],3.4,.35,1,'sandstone',e.angle);}
    w.solid(annex,0,12,'glass','modern-petit-palau-annex');w.band(annex,12,'iron');
  } else if(item.slug==='hohenzollern'){
    const bridges=['w258521129','w268661322','w268663549'].filter(k=>source.lookup.has(k));
    for(const key of bridges){const gf=frame(polygon(key));box(gf,0,4,0,gf.length,1,gf.width,'greyStone','rail-deck');
      for(let j=0;j<3;j++)for(const side of [-1,1]){
        const length=gf.length/3,u=(j-1)*length;
        for(let i=0;i<24;i++){
          const t=i/24,q=(i+1)/24,a=gf.point(u-length/2+t*length,side*gf.width*.42),b=gf.point(u-length/2+q*length,side*gf.width*.42);
          const y=t=>5+23*Math.sin(Math.PI*t);
          w.beam('steel-arch-trusses',[a[0],y(t),a[1]],[b[0],y(q),b[1]],.6,'greenMarble');
          if(i%2===0)w.beam('vertical-hangers',[a[0],5,a[1]],[a[0],y(t),a[1]],.2,'greenMarble');
          if(i%3===0){const other=gf.point(u-length/2+t*length,-side*gf.width*.42);w.beam('cross-bracing',[a[0],y(t),a[1]],[other[0],y(t),other[1]],.2,'greenMarble');}
        }
      }
    }
  } else if(item.slug==='koln-triangle'){
    w.solid(g,0,103.2,'glass','rounded-triangle-tower');
    for(let y=3.4;y<102;y+=3.4)w.band(g,y,'iron','horizontal-glazing-bands',.15);
    for(const e of boundary(g,2.4,false))w.beam('vertical-glazing-mullions',[e.p[0]+e.normal[0]*.06,0,e.p[1]+e.normal[1]*.06],[e.p[0]+e.normal[0]*.06,103,e.p[1]+e.normal[1]*.06],.045,'iron');
    w.shell(g,103.2,1.2,.12,'glass','observation-terrace-railing');
  } else if(item.slug==='piazzale-michelangelo'){
    w.solid(g,.02,.3,'sandstone','mapped-belvedere');
    for(const e of boundary(g,2.8,false))if(e.normal[1]<0){w.box('belvedere-balustrade',e.p[0],.32,e.p[1],e.pitch,1,.25,'limestone',e.angle);}
    const p=source.project(source.lookup.get('n11514175156'));w.box('bronze-david-monument-plinth',p[0],.32,p[1],4,3,4,'limestone');
    // Neutral simplified figure; not a replica of sculptural anatomy.
    w.cylinder('bronze-monument-massing',p[0],3.32,p[1],.48,3.1,'greenMarble',10,.33);w.add(new T.SphereGeometry(.38,10,8),'bronze-monument-head','greenMarble',[p[0],6.8,p[1]]);
  } else if(item.slug==='gondola'){
    const outer=[],inner=[];
    for(let i=0;i<=60;i++){const t=i/60*Math.PI*2;outer.push([Math.cos(t)*5.4,Math.sin(t)*.72*(.88+.12*Math.cos(t))]);inner.push([Math.cos(t)*4.85,Math.sin(t)*.5]);}
    w.solid([[outer,inner]],0,.52,'recess','open-curved-gondola-hull');w.solid([[inner]],0,.08,'iron','hull-floor');
    for(const x of [-1.3,.8])w.box('passenger-seats',x,.25,0,.4,.2,1,'recess');
    for(const side of [-1,1])w.profile('raised-bow-stern',[[0,0],[1.1,.8],[1.1,1.35],[.5,.55]],side*4.3,0,.12,'recess',side<0?Math.PI:0);
    w.box('silver-ferro',5.15,.7,0,.09,.7,.1,'lead');for(let i=0;i<6;i++)w.box('ferro-teeth',5.3,.74+i*.1,0,.4,.055,.1,'lead');w.beam('single-oar',[-2,.5,.8],[-4,.1,3.2],.035,'sandstone');
  } else throw Error(`No dedicated landmark recipe: ${item.slug}`);

  const root=w.finish();root.userData={...root.userData,id:`landmark-massing:${item.slug}`,version:'2026-09-14',sourceOutlineIds:item.keys};
  root.traverse(o=>{if(o.isMesh&&/extent|platform|belvedere/.test(o.name))o.userData.surfaceRole='ground';});
  return {root,manifest:{slug:item.slug,method:'source-coordinate-exterior-massing',sourceOutlineIds:item.keys,coordinateOrigin:raw?.location.coordinates??null,osmLicense:'ODbL 1.0; OpenStreetMap contributors',sourceFile:raw?`sources/exteriors/context/raw/${item.slug}.json`:null,scope:item.scope??'Mapped footprint and identifiable structural massing. Unrecorded elevations, window rhythm and relief are schematic, not surveyed.',notes,architecturalSources:item.sources}};
}
