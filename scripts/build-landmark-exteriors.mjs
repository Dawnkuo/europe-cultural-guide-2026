import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as T from 'three';
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';
import {mergeVertices} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {landmarks} from '../sources/exteriors/landmarks/catalog.mjs';
import {buildLandmark} from '../sources/exteriors/landmarks/models.mjs';

globalThis.FileReader??=class {readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.();});}};
const directory=new URL('../public/models/landmarks/',import.meta.url);
await mkdir(directory,{recursive:true});
const slugs=process.argv.slice(2);
if(slugs.some(slug=>!landmarks.some(item=>item.slug===slug)))throw Error('Unknown landmark slug');
const evidencePath=new URL('../sources/exteriors/landmarks/source-manifest.json',import.meta.url);
const catalog=slugs.length?JSON.parse(await readFile(new URL('catalog.json',directory),'utf8')).filter(i=>!slugs.includes(i.slug)):[];
const evidence=slugs.length?JSON.parse(await readFile(evidencePath,'utf8')).sites.filter(i=>!slugs.includes(i.slug)):[];
for(const item of landmarks.filter(i=>!slugs.length||slugs.includes(i.slug))){
  const {root,manifest}=buildLandmark(item),box=new T.Box3().setFromObject(root),size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3());
  if(![...size.toArray(),...center.toArray()].every(Number.isFinite)||Math.min(size.x,size.y,size.z)<=0)throw Error(`${item.slug}: invalid bounds`);
  const scale=16/Math.max(size.x,size.z),positioned=new T.Group();
  positioned.add(root);positioned.scale.setScalar(scale);positioned.position.set(-center.x*scale,-box.min.y*scale,-center.z*scale);positioned.userData={...root.userData,scaleToDisplay:scale};
  let triangles=0;const hash=createHash('sha256');
  root.traverse(o=>{
    if(!o.isMesh)return;
    for(const name of ['position','normal','uv'])if(!o.geometry.attributes[name]||!o.geometry.attributes[name].array.every(Number.isFinite))throw Error(`${item.slug}: invalid ${name}`);
    triangles+=o.geometry.attributes.position.count/3;hash.update(Buffer.from(o.geometry.attributes.position.array.buffer));
    const prev=o.geometry;o.geometry=mergeVertices(prev,1e-5);prev.dispose();
  });
  const binary=await new GLTFExporter().parseAsync(positioned,{binary:true});
  await writeFile(new URL(item.slug+'.glb',directory),Buffer.from(binary));
  // Orthographic fallback is projected from the same meshes, not a second map.
  positioned.updateMatrixWorld(true);
  const faces=[],p=new T.Vector3();
  root.traverse(o=>{if(!o.isMesh)return;const a=o.geometry.attributes.position,idx=o.geometry.index;
    for(let i=0;i<(idx?.count??a.count);i+=3){const ps=[0,1,2].map(j=>p.fromBufferAttribute(a,idx?idx.getX(i+j):i+j).applyMatrix4(o.matrixWorld).toArray());
      if(Math.abs((ps[1][0]-ps[0][0])*(ps[2][2]-ps[0][2])-(ps[2][0]-ps[0][0])*(ps[1][2]-ps[0][2]))<.000003)continue;
      faces.push({y:ps.reduce((s,p)=>s+p[1],0)/3,color:'#'+o.material.color.getHexString(T.SRGBColorSpace),points:ps.map(p=>`${p[0].toFixed(3)},${p[2].toFixed(3)}`).join(' ')});
    }
  });
  const b=new T.Box3().setFromObject(positioned),s=b.getSize(new T.Vector3());
  await writeFile(new URL(item.slug+'.svg',directory),`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${b.min.x-.7} ${b.min.z-.7} ${s.x+1.4} ${s.z+1.4}" role="img" aria-label="${item.slug} exterior"><rect x="-20" y="-20" width="40" height="40" fill="#08121c"/>${faces.sort((a,b)=>a.y-b.y).map(f=>`<polygon points="${f.points}" fill="${f.color}"/>`).join('')}</svg>`);
  catalog.push({slug:item.slug,asset:item.slug+'.glb',fallback:item.slug+'.svg',category:'landmark',method:manifest.method,features:item.features,featureCounts:root.userData.featureCounts,triangles,bytes:binary.byteLength,geometryHash:hash.digest('hex'),bounds:size.toArray(),sourceOutlineIds:item.keys});
  evidence.push(manifest);
  console.log(`${item.slug}: ${triangles} triangles, ${Math.round(binary.byteLength/1024)} KB`);
  const materials=new Set();root.traverse(o=>{if(o.isMesh){o.geometry.dispose();materials.add(o.material);}});materials.forEach(m=>m.dispose());
}
const order=new Map(landmarks.map((item,index)=>[item.slug,index]));
catalog.sort((a,b)=>order.get(a.slug)-order.get(b.slug));evidence.sort((a,b)=>order.get(a.slug)-order.get(b.slug));
await writeFile(new URL('catalog.json',directory),JSON.stringify(catalog,null,2)+'\n');
await writeFile(evidencePath,JSON.stringify({version:'2026-09-14',sites:evidence},null,2)+'\n');
