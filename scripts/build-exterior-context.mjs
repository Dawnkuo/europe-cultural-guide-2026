import fs from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { Matrix4, Quaternion, Vector3 } from 'three';
import { readFootprints, area, bounds } from '../sources/exteriors/museums/footprints.mjs';
import { buildingHeight, metres, containsPoint, lineBuffer, orientedFrame, union, subtract, intersect, rounded } from '../sources/exteriors/context/geometry.mjs';

const sourceDir = new URL('../sources/exteriors/context/', import.meta.url);
const publicDir = new URL('../public/maps/exterior-context/', import.meta.url);
await fs.mkdir(publicDir, { recursive: true });
const sites = JSON.parse(await fs.readFile(new URL('sites.json', sourceDir)));
const reviewedAxes = JSON.parse(await fs.readFile(new URL('reviewed-axes.json', sourceDir)));
const reviewedFacades = JSON.parse(await fs.readFile(new URL('reviewed-facades.json', sourceDir)));
const report = [];
const filter = process.argv.slice(2);
function glbInfo(bytes) {
  const json = JSON.parse(bytes.toString('utf8', 20, 20 + bytes.readUInt32LE(12)));
  return json.nodes.find(n => n.extras?.scaleToDisplay);
}
for (const site of sites.filter(s => !filter.length || filter.includes(s.slug))) {
  if (!site.location) { report.push({ slug: site.slug, status: 'no-fixed-location' }); continue; }
  const raw = JSON.parse(await fs.readFile(new URL(`raw/${site.slug}.json`, sourceDir)));
  const source = readFootprints(site.slug, raw), issues = [];
  const parsedIds=new Set(source.buildings.map(b=>b.key));
  for(const e of raw.elements)if(e.type!=='node'&&(e.tags?.building||e.tags?.['building:part'])&&!parsedIds.has(e.type[0]+e.id))issues.push({id:e.type[0]+e.id,issue:'incomplete-or-invalid-building-outline'});
  const radius=raw.radius, extent=[[[[-radius,-radius],[radius,-radius],[radius,radius],[-radius,radius],[-radius,-radius]]]];
  const polygon = key => { try { return source.polygon(key); } catch (e) { issues.push({ id: key, issue: e.message }); return []; } };
  let asset, family;
  for (const candidate of ['museums','churches','landmarks']) {
    try { asset=glbInfo(await fs.readFile(new URL(`../public/models/${candidate}/${site.slug}.glb`,import.meta.url))); family=candidate; break; } catch {}
  }
  let selectedIds=asset?.extras.sourceOutlineIds ?? [site.location.osm.type[0]+site.location.osm.id];
  const representedPartIds=asset?.extras.sourceBuildingPartIds ?? [];
  if(site.slug==='santa-maria-grazie')selectedIds=['r19382652'];
  if(site.slug==='koln-triangle')selectedIds=['w21113435'];
  if(site.slug==='colosseum')selectedIds=['r1834818'];
  if(site.slug==='rialto')selectedIds=['r2289364'];
  const stPeters=site.slug==='st-peters-basilica'||site.slug==='st-peters-square';
  if(stPeters)selectedIds=['w244159210','r12043628','r10044166','r7012828'];
  let landmark=union(selectedIds.filter(id=>!id.startsWith('n')).map(polygon).filter(g=>g.length));
  if (!landmark.length && site.location.precision==='venue') {
    const container=source.buildings.filter(b=>containsPoint(b.geometry,[0,0])).sort((a,b)=>area(a.geometry)-area(b.geometry))[0];
    if (container) { selectedIds=[container.key]; landmark=container.geometry; }
  }
  // Only suppress an actual mapped footprint. A POI coordinate is not an invented parcel.
  const exclusion=site.location.precision==='area-representative'?[]:representedPartIds.length?union([
    landmark.map(poly=>[poly[0]]),...representedPartIds.map(polygon),
  ]):landmark.map(poly=>[poly[0]]);
  const axisReview=reviewedAxes[site.slug];
  let axisAngle, frontDirection;
  if(axisReview){
    const wall=source.lookup.get(axisReview.wallWayId);
    const nodes=axisReview.axisNodeIds.map(id=>source.lookup.get('n'+id));
    if(!selectedIds.includes(axisReview.footprintId)||nodes.length!==2||nodes.some(n=>!n)||!wall||!axisReview.axisNodeIds.every(id=>wall.nodes.includes(id)))throw Error(`${site.slug}: reviewed axis source changed`);
    const [a,b]=nodes.map(source.project);
    frontDirection=[b[0]-a[0],b[1]-a[1]];
    if(Math.hypot(...frontDirection)<2)throw Error(`${site.slug}: degenerate reviewed axis`);
    axisAngle=Math.atan2(frontDirection[1],frontDirection[0]);
  }
  const frame=landmark.length?orientedFrame(stPeters?polygon('w244159210'):landmark,axisAngle):null;
  const sourceCoordinates=family==='museums'||family==='landmarks';
  const registration={ mode:sourceCoordinates?'source-coordinate':family==='churches'?'footprint-axis-fit':'approximate-anchor',
    matrix:sourceCoordinates?asset.matrix:null, scale:asset?.extras.scaleToDisplay??null,
    frame, frontDirection, selectedIds, footprint:rounded(landmark), locationPrecision:site.location.precision };
  const facadeReview=reviewedFacades[site.slug];
  if(facadeReview){
    const wall=source.lookup.get(facadeReview.wallWayId);
    const nodes=facadeReview.facadeNodeIds.map(id=>source.lookup.get('n'+id));
    if(!selectedIds.includes(facadeReview.footprintId)||nodes.length!==2||nodes.some(n=>!n)||!facadeReview.facadeNodeIds.every(id=>wall?.nodes.includes(id)))throw Error(`${site.slug}: reviewed facade source changed`);
    const [a,b]=nodes.map(source.project),[p,q]=facadeReview.modelPoints;
    const scale=Math.hypot(q[0]-p[0],q[1]-p[1])/Math.hypot(b[0]-a[0],b[1]-a[1]);
    const yaw=Math.atan2(b[1]-a[1],b[0]-a[0])-Math.atan2(q[1]-p[1],q[0]-p[0]);
    const rotation=new Quaternion().setFromAxisAngle(new Vector3(0,1,0),yaw);
    const origin=new Vector3(a[0],0,a[1]).applyQuaternion(rotation).multiplyScalar(scale);
    registration.mode='facade-anchor';
    registration.scale=scale;
    registration.matrix=new Matrix4().compose(new Vector3(p[0]-origin.x,0,p[1]-origin.z),rotation,new Vector3(scale,scale,scale)).toArray();
    if(site.slug==='casa-batllo'){
      const matrix=new Matrix4().fromArray(registration.matrix);
      const geometry=landmark.map(polygon=>polygon.map(ring=>ring.map(([x,z])=>{
        const point=new Vector3(x,0,z).applyMatrix4(matrix);return [point.x,point.z];
      })));
      await fs.writeFile(new URL('../app/data/casa-batllo-footprint.json',import.meta.url),JSON.stringify({sourceId:facadeReview.footprintId,geometry:rounded(geometry)})+'\n');
    }
  }
  // Suppress entire represented parts, not just their intersection with the
  // parent outline: tiny source-boundary differences otherwise become tall fins.
  const candidates=source.buildings.filter(b=>!selectedIds.includes(b.key)&&!representedPartIds.includes(b.key))
    .sort((a,b)=>(b.tags['building:part']?1:0)-(a.tags['building:part']?1:0)||(b.key[0]==='r'?1:0)-(a.key[0]==='r'?1:0));
  const covered=exclusion.map(poly=>({geometry:[poly],box:bounds([poly]),bottom:-Infinity,top:Infinity}));
  const buildings=[];
  for (const b of candidates) {
    if (b.tags.building==='no'||b.tags.location==='underground'||Number(b.tags.layer)<0) continue;
    const height=buildingHeight(b.tags);
    if (height.height<=height.minHeight||height.height>1000) { issues.push({id:b.key,issue:'invalid-height'}); continue; }
    const clipped=intersect(b.geometry,extent);
    if(!clipped.length)continue;
    const box=bounds(clipped);
    const neighbours=covered.filter(c=>c.box[0]<box[2]&&c.box[2]>box[0]&&c.box[1]<box[3]&&c.box[3]>box[1]&&c.bottom<height.height&&c.top>height.minHeight)
      .filter(c=>area(intersect(c.geometry,clipped))>.001);
    const levels=[...new Set([height.minHeight,height.height,...neighbours.flatMap(n=>[n.bottom,n.top]).filter(y=>y>height.minHeight&&y<height.height)])].sort((a,b)=>a-b);
    const additions=[];
    let previous;
    for(let i=1;i<levels.length;i++){
      const bottom=levels[i-1],top=levels[i],mid=(bottom+top)/2;
      const geometry=subtract(clipped,union(neighbours.filter(n=>n.bottom<mid&&n.top>mid).map(c=>c.geometry)));
      if(area(geometry)<1)continue;
      const roofHeight=metres(b.tags['roof:height'])??(b.tags['building:part']?height.height-height.minHeight:0);
      const roof=b.tags['roof:shape']==='dome'&&roofHeight>0&&top===height.height&&area(geometry)/area(clipped)>.98
        ? {shape:'dome',height:Math.min(roofHeight,top-bottom)} : undefined;
      const signature=JSON.stringify(geometry);
      if(previous?.signature===signature&&previous.entry.height===bottom){
        previous.entry.height=top;previous.entry.roof=roof;previous.cover.top=top;
      }else{
        const entry={id:b.key,geometry:rounded(geometry),...height,height:top,minHeight:bottom,originalHeight:height.height,roof};
        const cover={geometry,box,bottom,top};
        buildings.push(entry);additions.push(cover);previous={signature,entry,cover};
      }
    }
    covered.push(...additions);
  }
  const occupied=union(covered.map(c=>c.geometry));
  const lines={ roads:[], paths:[], walls:[] }, areas={water:[],green:[],paving:[]};
  const roadFeatures=[],wallFeatures=[];
  for (const e of raw.elements) {
    const tags=e.tags;if (!tags||e.type==='node') continue;
    const id=e.type[0]+e.id;
    if (tags.indoor==='yes'||tags.location==='underground'||tags.tunnel==='yes'||Number(tags.layer)<0) continue;
    const water=tags.natural==='water'||tags.waterway==='riverbank';
    const green=['grass','forest','meadow','recreation_ground'].includes(tags.landuse)||tags.natural==='wood'||tags.leisure==='park'||tags.leisure==='garden';
    const paving=(tags.highway==='pedestrian'&&(tags.area==='yes'||tags.type==='multipolygon'))||['pedestrian','footway'].includes(tags['area:highway'])||tags.place==='square';
    if (water||green||paving) {
      const geometry=intersect(polygon(id),extent);
      if (geometry.length) areas[water?'water':green?'green':'paving'].push(geometry);
    }
    if (e.type!=='way') continue;
    const nodes=e.nodes.map(n=>source.lookup.get('n'+n));
    if (nodes.some(n=>!n)) { if(tags.highway||tags.barrier)issues.push({id,issue:'incomplete-line'}); continue; }
    const points=nodes.map(source.project);
    if (tags.highway&&!paving&&!['construction','proposed','platform','corridor','elevator'].includes(tags.highway)) {
      const foot=['footway','pedestrian','path','steps','cycleway','bridleway'].includes(tags.highway);
      const taggedWidth=metres(tags.width), lanes=Number(tags.lanes);
      const width=taggedWidth??(foot?2:lanes>0?lanes*3:tags.highway==='service'?3.5:6);
      if(width<=0||width>80)continue;
      const geometry=intersect(lineBuffer(points,width),extent);
      if(geometry.length){lines[foot?'paths':'roads'].push(geometry);roadFeatures.push({id,kind:tags.highway,width,widthSource:taggedWidth?'tagged':lanes>0&&!foot?'lanes':'estimated',bridge:tags.bridge==='yes'});}
    }
    if (['wall','city_wall','retaining_wall','fence','hedge'].includes(tags.barrier)) {
      const height=metres(tags.height)??(tags.barrier==='fence'||tags.barrier==='hedge'?1.5:2.4);
      const width=metres(tags.width)??(tags.barrier==='city_wall'?1.2:.4);
      if(height<=0||width<=0)continue;
      // Source gate nodes interrupt the wall; leave a two-metre opening around them.
      const segments=[];
      for(let i=1;i<points.length;i++){
        const a=[...points[i-1]],b=[...points[i]],length=Math.hypot(b[0]-a[0],b[1]-a[1]);
        if(length<.01)continue;
        const dx=(b[0]-a[0])/length,dz=(b[1]-a[1])/length;
        const gate=n=>['gate','lift_gate','swing_gate','entrance'].includes(n.tags?.barrier)||n.tags?.entrance;
        const da=gate(nodes[i-1])?Math.min(1,length/2):0,db=gate(nodes[i])?Math.min(1,length/2):0;
        a[0]+=dx*da;a[1]+=dz*da;b[0]-=dx*db;b[1]-=dz*db;
        segments.push(lineBuffer([a,b],width));
      }
      const geometry=subtract(intersect(union(segments),extent),occupied);
      if(geometry.length){lines.walls.push({id,kind:tags.barrier,geometry:rounded(geometry),height});wallFeatures.push({id,height,heightSource:metres(tags.height)!=null?'tagged':'estimated',width});}
    }
  }
  const road=subtract(union(lines.roads),exclusion),path=subtract(union([...lines.paths,...areas.paving]),union([exclusion,road]));
  const water=subtract(union(areas.water),union([exclusion,road,path]));
  const green=subtract(union(areas.green),union([occupied,road,path,water]));
  const counts={buildings:buildings.length,roads:roadFeatures.length,walls:wallFeatures.length,
    taggedHeights:buildings.filter(b=>b.heightSource==='tagged').length,levelHeights:buildings.filter(b=>b.heightSource==='levels').length,estimatedHeights:buildings.filter(b=>b.heightSource==='estimated').length};
  const output={version:1,slug:site.slug,origin:raw.location.coordinates,radius,registration,sourceIssues:issues.length,
    buildings,walls:lines.walls,surfaces:{roads:rounded(road),paths:rounded(path),water:rounded(water),green:rounded(green)},counts};
  await fs.writeFile(new URL(`${site.slug}.json`,publicDir),JSON.stringify(output));
  const entry={slug:site.slug,status:'available',source:raw.source,fetchedAt:raw.fetchedAt,bbox:raw.bbox,registration:registration.mode,axisReview,facadeReview,counts,issues,roadFeatures,wallFeatures};
  await fs.writeFile(new URL(`${site.slug}.audit.json`,sourceDir),JSON.stringify(entry,null,2)+'\n');
  report.push({slug:site.slug,status:'available',registration:registration.mode,counts,issues:issues.length});
  console.log(`${site.slug}: ${JSON.stringify(counts)}; ${issues.length} source omissions`);
}
let coverage=report;
if(filter.length){
  let previous=[];try{previous=JSON.parse(await fs.readFile(new URL('coverage.json',sourceDir)));}catch{}
  const index=new Map([...previous,...report].map(entry=>[entry.slug,entry]));
  coverage=sites.map(site=>index.get(site.slug)??{slug:site.slug,status:'not-generated'});
}
await fs.writeFile(new URL('coverage.json',sourceDir),JSON.stringify(coverage,null,2)+'\n');
execFileSync(process.execPath,[fileURLToPath(new URL('./compose-exterior-context.mjs',import.meta.url)),...filter],{stdio:'inherit'});
