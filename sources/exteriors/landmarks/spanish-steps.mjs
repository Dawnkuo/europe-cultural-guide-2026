import {Delaunay} from 'd3-delaunay';
import {bounds} from '../museums/footprints.mjs';
import {containsPoint,intersect,lineBuffer,offset,subtract,union} from '../context/geometry.mjs';

export function spanishStepsLayout(source){
  const footprint=source.polygon('w134400816');
  const landings=[['w1416143815',6.5],['w54572036',12],['w54572034',16]].map(([id,height])=>({id,height,geometry:intersect(footprint,source.polygon(id))}));
  const path=id=>source.lookup.get('w'+id).nodes.map(id=>source.project(source.lookup.get('n'+id)));
  const inside=offset(footprint,.7);
  const flights=source.data.elements.filter(e=>e.type==='way'&&e.tags?.highway==='steps'&&e.nodes.every(id=>containsPoint(inside,source.project(source.lookup.get('n'+id)))));
  const landingBuffers=landings.map(l=>offset(l.geometry,.7));
  const bottom=new Set([32631113,261263911,687088561]);
  const summit=new Set([261263823,11476803431]);
  const samples=[],connections=[];
  for(const flight of flights){
    const points=path(flight.id),distances=[0];
    for(let i=1;i<points.length;i++)distances.push(distances[i-1]+Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]));
    const anchors=points.flatMap((point,i)=>{
      const landing=landingBuffers.findIndex(g=>containsPoint(g,point));
      const height=bottom.has(flight.nodes[i])?0:summit.has(flight.nodes[i])?22:landing>=0?landings[landing].height:null;
      return height===null?[]:[{distance:distances[i],height}];
    });
    if(anchors[0]?.distance!==0||anchors.at(-1)?.distance!==distances.at(-1))throw Error(`Unconnected Spanish Steps flight ${flight.id}`);
    connections.push({id:flight.id,start:anchors[0].height,end:anchors.at(-1).height});
    for(let i=1;i<anchors.length;i++){
      const a=anchors[i-1],b=anchors[i],length=b.distance-a.distance;
      if(length<.001)continue;
      const n=Math.max(1,Math.ceil(Math.abs(b.height-a.height)/.18),Math.ceil(length/.5));
      for(let j=0;j<n;j++){
        const d=a.distance+(j+.5)/n*length;
        let k=1;while(k<distances.length-1&&distances[k]<d)k++;
        const t=(d-distances[k-1])/(distances[k]-distances[k-1]);
        const point=points[k-1].map((p,axis)=>p+(points[k][axis]-p)*t);
        samples.push({point,height:Math.max(.08,a.height+(b.height-a.height)*(j+1)/n),flight:flight.id});
      }
    }
  }
  // Voronoi cells extend each tread to the mapped stair boundary. Shared cell
  // edges tile the whole footprint, unlike disconnected fixed-width path strips.
  const delaunay=Delaunay.from(samples.map(s=>s.point)),voronoi=delaunay.voronoi(bounds(footprint));
  const free=subtract(footprint,union(landings.map(l=>l.geometry)));
  const treads=samples.flatMap((s,i)=>{
    const cell=voronoi.cellPolygon(i);
    if(!cell)return [];
    const geometry=intersect(free,[[cell]]);
    return geometry.length?[{...s,geometry}]:[];
  });
  const church=source.polygon('w54044477');
  const terrace=subtract(union([lineBuffer(path(202110422),8),lineBuffer(path(27679610),4),lineBuffer(path(109931142),4)]),union([footprint,church]));
  const approachIds=[202110425,202110426];
  const approach=approachIds.map(id=>({id,path:path(id),start:id===202110425?22:24,end:id===202110425?24:22}));
  const entrance=lineBuffer(path(202110424),4);
  return {footprint,landings,treads,connections,terrace,church,approach,entrance,churchLevel:24,summitLevel:22};
}

export function buildSpanishSteps(w,source){
  const layout=spanishStepsLayout(source);
  const supported=(geometry,height,name,material='sandstone')=>{
    const cap=Math.min(.04,height);
    w.solid(geometry,0,height-cap,material,`${name}-support`);
    w.solid(geometry,height-cap,cap,'limestone',name);
  };
  for(const tread of layout.treads){
    supported(tread.geometry,tread.height,'continuous-stair-treads');
    for(const polygon of tread.geometry)for(const ring of polygon)for(let i=1;i<ring.length;i++){
      const a=ring[i-1],b=ring[i];
      w.beam('tread-joints',[a[0],tread.height+.018,a[1]],[b[0],tread.height+.018,b[1]],.015,'greyStone',4);
    }
  }
  for(const landing of layout.landings)supported(landing.geometry,landing.height,`landing-${landing.id}`);
  supported(layout.terrace,layout.summitLevel,'upper-street-terrace');
  supported(layout.church,layout.churchLevel,'church-ground-cutaway','greyStone');
  supported(layout.entrance,layout.churchLevel,'church-entrance-landing');
  for(const flight of layout.approach){
    const [a,b]=flight.path,angle=Math.atan2(b[1]-a[1],b[0]-a[0]),length=Math.hypot(b[0]-a[0],b[1]-a[1]);
    const n=Math.ceil(length/.45),whole=lineBuffer(flight.path,4);
    for(let i=0;i<n;i++){
      const center=a.map((v,j)=>v+(b[j]-v)*(i+.5)/n),dx=Math.cos(angle)*length/n/2,dz=Math.sin(angle)*length/n/2;
      const strip=lineBuffer([[center[0]-dx,center[1]-dz],[center[0]+dx,center[1]+dz]],4);
      supported(subtract(intersect(whole,strip),union([layout.church,layout.entrance])),flight.start+(flight.end-flight.start)*(i+1)/n,'church-approach-treads');
    }
  }
  return layout;
}
