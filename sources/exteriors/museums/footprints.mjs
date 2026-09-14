import fs from 'node:fs';
import clipping from 'polygon-clipping';

export function readFootprints(slug, input) {
  const data=input??JSON.parse(fs.readFileSync(new URL(`./raw/${slug}.json`,import.meta.url)));
  const ways=new Map(data.elements.filter(e=>e.type==='way').map(e=>[e.id,e]));
  const [lon,lat]=data.location.coordinates;
  const project=p=>[(p.lon-lon)*111320*Math.cos(lat*Math.PI/180),-(p.lat-lat)*111320];
  const lookup=new Map(data.elements.map(e=>[e.type[0]+e.id,e]));
  function ring(ids) {
    const points=ids.map(id=>{const node=lookup.get('n'+id);if(!node)throw Error(`${slug}: missing node ${id}`);return project(node);});
    if(ids[0]!==ids.at(-1))throw Error(`${slug}: open ring`);
    return points;
  }
  function assemble(members) {
    const segments=members.map(m=>{const w=ways.get(m.ref);if(!w)throw Error(`${slug}: missing way ${m.ref}`);return [...w.nodes];});
    const rings=[];
    while(segments.length){
      const chain=segments.shift();
      while(chain[0]!==chain.at(-1)){
        const i=segments.findIndex(s=>s[0]===chain.at(-1)||s.at(-1)===chain.at(-1));
        if(i<0)throw Error(`${slug}: disconnected relation`);
        const next=segments.splice(i,1)[0];if(next[0]!==chain.at(-1))next.reverse();chain.push(...next.slice(1));
      }
      rings.push(ring(chain));
    }
    return rings;
  }
  function polygon(key){
    const e=lookup.get(key);if(!e)throw Error(`${slug}: unknown ${key}`);
    if(e.type==='way')return [[ring(e.nodes)]];
    const outer=assemble(e.members.filter(m=>m.type==='way'&&(m.role==='outer'||e.tags?.type==='building'&&m.role==='outline')));
    const inner=assemble(e.members.filter(m=>m.type==='way'&&m.role==='inner'));
    if(!outer.length)throw Error(`${slug}: no outer rings ${key}`);
    const union=clipping.union(...outer.map(r=>[r]));
    return inner.length?clipping.difference(union,...inner.map(r=>[r])):union;
  }
  const buildings=[];
  for(const e of data.elements){
    if(e.type==='node'||(!e.tags?.building&&!e.tags?.['building:part']))continue;
    const key=e.type[0]+e.id;
    try{const geometry=polygon(key);buildings.push({key,tags:e.tags,geometry});}catch{}
  }
  return {data,lookup,polygon,buildings,project};
}

export function area(geometry){return geometry.reduce((sum,poly)=>sum+poly.reduce((s,r,i)=>s+(i?-1:1)*Math.abs(r.slice(1).reduce((a,p,j)=>a+r[j][0]*p[1]-p[0]*r[j][1],0)/2),0),0);}
export function bounds(geometry){const p=geometry.flat(2);return [Math.min(...p.map(p=>p[0])),Math.min(...p.map(p=>p[1])),Math.max(...p.map(p=>p[0])),Math.max(...p.map(p=>p[1]))];}
export function center(geometry){const b=bounds(geometry);return [(b[0]+b[2])/2,(b[1]+b[3])/2];}
export function path(geometry){return geometry.map(poly=>poly.map(r=>'M'+r.map(p=>p.join(',')).join('L')+'Z').join('')).join('');}
export function selectedGeometry(source,keys,voids=[]){const g=clipping.union(...keys.map(k=>source.polygon(k)));return voids.length?clipping.difference(g,...voids.map(k=>source.polygon(k))):g;}
