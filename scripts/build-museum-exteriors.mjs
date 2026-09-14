import {mkdir,writeFile,copyFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as T from 'three';
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';
import {mergeVertices} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {museums} from '../sources/exteriors/museums/catalog.mjs';
import {buildMuseum} from '../sources/exteriors/museums/models.mjs';
globalThis.FileReader??=class{readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.();});}};
const directory=new URL('../public/models/museums/',import.meta.url),preview=new URL('../../outputs/milan-cathedral-massing/museum-models/',import.meta.url);
await mkdir(directory,{recursive:true});await mkdir(preview,{recursive:true});
const slugs=process.argv.slice(2);
if(slugs.some(slug=>!museums.some(item=>item.slug===slug)))throw Error('Unknown museum slug');
const evidencePath=new URL('../sources/exteriors/museums/source-manifest.json',import.meta.url);
const catalog=slugs.length?JSON.parse(await readFile(new URL('catalog.json',directory),'utf8')).filter(i=>!slugs.includes(i.slug)):[];
const evidence=slugs.length?JSON.parse(await readFile(evidencePath,'utf8')).sites.filter(i=>!slugs.includes(i.slug)):[];
function fallback(root,slug){
 const faces=[],a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3();root.updateMatrixWorld(true);
 root.traverse(mesh=>{if(!mesh.isMesh)return;const p=mesh.geometry.attributes.position,idx=mesh.geometry.index;
  for(let i=0;i<(idx?.count??p.count);i+=3){
   [a,b,c].forEach((v,j)=>v.fromBufferAttribute(p,idx?idx.getX(i+j):i+j).applyMatrix4(mesh.matrixWorld));
   if(Math.abs((b.x-a.x)*(c.z-a.z)-(b.z-a.z)*(c.x-a.x))<.000002)continue;
   faces.push({y:(a.y+b.y+c.y)/3,color:'#'+mesh.material.color.getHexString(T.SRGBColorSpace),p:[a,b,c].map(v=>v.x.toFixed(3)+','+v.z.toFixed(3)).join(' ')});
  }
 });
 const bnd=new T.Box3().setFromObject(root),s=bnd.getSize(new T.Vector3());
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${bnd.min.x-.7} ${bnd.min.z-.7} ${s.x+1.4} ${s.z+1.4}" role="img" aria-label="${slug} exterior"><rect x="-20" y="-20" width="40" height="40" fill="#08121c"/>${faces.sort((a,b)=>a.y-b.y).map(f=>`<polygon points="${f.p}" fill="${f.color}" stroke="${f.color}" stroke-width=".003"/>`).join('')}</svg>`;
}
for(const item of museums.filter(i=>!slugs.length||slugs.includes(i.slug))){
 const {root,manifest}=buildMuseum(item),box=new T.Box3().setFromObject(root),size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3()),scale=16/Math.max(size.x,size.z);
 const positioned=new T.Group();positioned.add(root);positioned.scale.setScalar(scale);positioned.position.set(-center.x*scale,-box.min.y*scale,-center.z*scale);positioned.userData={...root.userData,scaleToDisplay:scale};
 let triangles=0;const hash=createHash('sha256');
 root.traverse(o=>{if(!o.isMesh)return;for(const name of ['position','normal','uv']){const a=o.geometry.attributes[name];if(!a||![...a.array].every(Number.isFinite))throw Error(`${item.slug}: invalid ${name}`);}triangles+=o.geometry.attributes.position.count/3;hash.update(Buffer.from(o.geometry.attributes.position.array.buffer));const prev=o.geometry;o.geometry=mergeVertices(prev,1e-5);prev.dispose();});
 const binary=await new GLTFExporter().parseAsync(positioned,{binary:true});
 await writeFile(new URL(item.slug+'.glb',directory),Buffer.from(binary));await writeFile(new URL(item.slug+'.svg',directory),fallback(positioned,item.slug));
 const entry={slug:item.slug,title:item.title,city:item.city,asset:item.slug+'.glb',fallback:item.slug+'.svg',category:'museum',method:'footprint-backed-massing',triangles,bytes:binary.byteLength,geometryHash:hash.digest('hex'),bounds:size.toArray(),featureCounts:root.userData.featureCounts,features:item.features};catalog.push(entry);evidence.push({...manifest,architecturalSources:item.sources,...(root.userData.surfaceCleanup?{surfaceCleanup:root.userData.surfaceCleanup}:{})});
 for(const ext of ['glb','svg'])await copyFile(new URL(item.slug+'.'+ext,directory),new URL(item.slug+'.'+ext,preview));
 console.log(`${item.slug}: ${triangles} triangles, ${Math.round(binary.byteLength/1024)} KB`);
 const mats=new Set();root.traverse(o=>{if(o.isMesh){o.geometry.dispose();mats.add(o.material);}});mats.forEach(m=>m.dispose());
}
const order=new Map(museums.map((item,index)=>[item.slug,index]));
catalog.sort((a,b)=>order.get(a.slug)-order.get(b.slug));evidence.sort((a,b)=>order.get(a.slug)-order.get(b.slug));
for(const d of [directory,preview])await writeFile(new URL('catalog.json',d),JSON.stringify(catalog,null,2)+'\n');
await writeFile(new URL('../sources/exteriors/museums/source-manifest.json',import.meta.url),JSON.stringify({version:'2026-09-11',scope:'museum-exterior-massing',sites:evidence},null,2)+'\n');
