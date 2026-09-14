import {mkdir,writeFile} from 'node:fs/promises';
import {museums} from '../sources/exteriors/museums/catalog.mjs';
import {readFootprints,selectedGeometry,path,bounds,center,area} from '../sources/exteriors/museums/footprints.mjs';
import clipping from 'polygon-clipping';
const directory=new URL('../work/museum-footprints/',import.meta.url);await mkdir(directory,{recursive:true});
for(const item of museums){
 const s=readFootprints(item.slug),g=selectedGeometry(s,item.keys,item.voids),b=bounds(g),pad=15;
 const parts=s.buildings.filter(p=>p.tags['building:part']&&area(clipping.intersection(p.geometry,g))>area(p.geometry)*.6);
 const records=[...item.keys.map(k=>({key:k,geometry:s.polygon(k),tags:s.lookup.get(k).tags})),...parts];
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="800" viewBox="${b[0]-pad} ${b[1]-pad} ${b[2]-b[0]+pad*2} ${b[3]-b[1]+pad*2}"><rect x="${b[0]-pad}" y="${b[1]-pad}" width="${b[2]-b[0]+pad*2}" height="${b[3]-b[1]+pad*2}" fill="white"/>${records.map((p,i)=>`<path d="${path(p.geometry)}" fill="${i<item.keys.length?'#d4d8ce':'#e4b893'}" fill-opacity=".6" fill-rule="evenodd" stroke="#253a46" stroke-width=".25"/><text x="${center(p.geometry)[0]}" y="${center(p.geometry)[1]}" font-size="3" text-anchor="middle">${i}</text>`).join('')}</svg>`;
 await writeFile(new URL(item.slug+'.svg',directory),svg);
 await writeFile(new URL(item.slug+'.json',directory),JSON.stringify(records.map((p,i)=>({i,key:p.key,tags:p.tags,center:center(p.geometry),bounds:bounds(p.geometry),area:area(p.geometry)})),null,2));
 console.log(item.slug,item.keys.length,'outlines',parts.length,'parts',b.map(Math.round).join(','));
}
