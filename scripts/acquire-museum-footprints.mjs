import { mkdir, readFile, writeFile } from 'node:fs/promises';
import ts from 'typescript';

const directory = new URL('../sources/exteriors/museums/raw/', import.meta.url);
await mkdir(directory, {recursive:true});
const source = await readFile(new URL('../app/data/trip-map-locations.ts', import.meta.url), 'utf8');
const compiled = ts.transpile(source, {module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022});
const {mapLocationForTripItem} = await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));
const slugs = ['last-supper','sforza','brera','la-scala-evening','doges-palace','correr','accademia-venice','camposanto','sinopie','opera-pisa','accademia-florence','medici-chapels','uffizi','vasari-corridor','pitti','borghese','vatican-museums','gaudi-house','picasso-barcelona','museum-ludwig','chocolate-museum'];
for (const id of slugs) {
  const slug=id==='la-scala-evening'?'la-scala':id;
  const target=new URL(`${slug}.json`,directory);
  try {await readFile(target);console.log('cached '+slug);continue;} catch {}
  const location=mapLocationForTripItem({id}),[lon,lat]=location.coordinates;
  const radius=slug==='vatican-museums'?480:slug==='vasari-corridor'?450:slug==='sforza'?230:150;
  const query=`[out:json][timeout:45];(way(around:${radius},${lat},${lon})[building];way(around:${radius},${lat},${lon})["building:part"];relation(around:${radius},${lat},${lon})[building];);out body geom;`;
  let result;
  const dx=radius/(111320*Math.cos(lat*Math.PI/180)),dy=radius/111320;
  const endpoint=`https://api.openstreetmap.org/api/0.6/map.json?bbox=${[lon-dx,lat-dy,lon+dx,lat+dy].join(',')}`;
  for(const attempt of [1,2,3]) {
    try {
      const response=await fetch(endpoint,{signal:AbortSignal.timeout(65000)});
      if(!response.ok)throw Error(String(response.status));
      const data=await response.json();if(!data.elements?.length||data.remark)throw Error(data.remark??'empty');
      const nodes=new Map(data.elements.filter(e=>e.type==='node').map(n=>[n.id,{lat:n.lat,lon:n.lon}]));
      for(const e of data.elements)if(e.type==='way')e.geometry=e.nodes.map(id=>nodes.get(id));
      result={retrievedAt:new Date().toISOString(),source:endpoint,query,location,...data};break;
    } catch(error){console.log(slug+': '+attempt+' '+error.message);}
  }
  if(!result)throw Error('Cannot acquire '+slug);
  await writeFile(target,JSON.stringify(result,null,2)+'\n');
  console.log(slug+': '+result.elements.length+' building records');
}
