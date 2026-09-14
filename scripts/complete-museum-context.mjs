import {writeFile} from 'node:fs/promises';
import {readFootprints,selectedGeometry,bounds} from '../sources/exteriors/museums/footprints.mjs';
import {museums} from '../sources/exteriors/museums/catalog.mjs';
for(const slug of ['sforza','vatican-museums']){
 const source=readFootprints(slug),item=museums.find(m=>m.slug===slug),[x1,z1,x2,z2]=bounds(selectedGeometry(source,item.keys));
 const [lon,lat]=source.data.location.coordinates,scale=111320*Math.cos(lat*Math.PI/180);
 const url=`https://api.openstreetmap.org/api/0.6/map.json?bbox=${[lon+(x1-25)/scale,lat-(z2+25)/111320,lon+(x2+25)/scale,lat-(z1-25)/111320].join(',')}`;
 const response=await fetch(url,{signal:AbortSignal.timeout(45000)});if(!response.ok)throw Error(String(response.status));
 const result=await response.json(),map=source.lookup;for(const e of result.elements)map.set(e.type[0]+e.id,e);
 source.data.elements=[...map.values()];source.data.additionalSources.push({url,retrievedAt:new Date().toISOString()});
 await writeFile(new URL(`../sources/exteriors/museums/raw/${slug}.json`,import.meta.url),JSON.stringify(source.data,null,2)+'\n');
 console.log(slug,result.elements.length);
}
