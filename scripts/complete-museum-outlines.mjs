import {readFile,writeFile} from 'node:fs/promises';
import {museums} from '../sources/exteriors/museums/catalog.mjs';
for(const item of museums){
 const path=new URL(`../sources/exteriors/museums/raw/${item.slug}.json`,import.meta.url);
 const data=JSON.parse(await readFile(path,'utf8')),map=new Map(data.elements.map(e=>[e.type[0]+e.id,e]));
 for(const key of item.keys){
  if(data.completed?.includes(key))continue;
  const url=`https://api.openstreetmap.org/api/0.6/${key[0]==='r'?'relation':'way'}/${key.slice(1)}/full.json`;
  const response=await fetch(url,{headers:{'User-Agent':'PersonalCulturalGuide/1.0 (architectural-massing-research)'},signal:AbortSignal.timeout(45000)});
  if(!response.ok)throw Error(`${key}: ${response.status}`);
  const result=await response.json();for(const e of result.elements)map.set(e.type[0]+e.id,e);
  (data.completed??=[]).push(key);(data.additionalSources??=[]).push({url,retrievedAt:new Date().toISOString()});
  console.log(item.slug,key,result.elements.length);
 }
 data.elements=[...map.values()];await writeFile(path,JSON.stringify(data,null,2)+'\n');
}
