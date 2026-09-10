import { writeFile, mkdir, copyFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import * as T from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { builders } from '../sources/exteriors/churches/models.mjs';
import { buildCathedral } from '../sources/exteriors/churches/milan/build-model.js';
import { setMarbleUV } from '../sources/exteriors/churches/milan/marble-material.js';
import { buildDetailedExterior } from '../app/lib/detailed-exteriors.ts';

globalThis.FileReader ??= class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.();}); }
};

const destinations = [
  ['milan-duomo','米兰大教堂','米兰'],['santa-maria-grazie','圣玛利亚感恩教堂','米兰'],
  ['st-mark-basilica','圣马可大教堂','威尼斯'],['florence-duomo','圣母百花大教堂','佛罗伦萨'],
  ['pisa-cathedral','比萨主教座堂','比萨'],['pisa-baptistery','比萨洗礼堂','比萨'],
  ['pantheon','万神殿','罗马'],['st-peters-basilica','圣彼得大教堂','梵蒂冈'],
  ['sagrada-familia','圣家堂','巴塞罗那'],['barcelona-cathedral','巴塞罗那主教堂','巴塞罗那'],
  ['santa-maria-mar','海洋圣母教堂','巴塞罗那'],['cologne-cathedral','科隆大教堂','科隆'],
  ['notre-dame-towers','巴黎圣母院','巴黎'],
];
const directory=new URL('../public/models/churches/',import.meta.url);
await mkdir(directory,{recursive:true});
const report=[];

function topView(root,slug) {
  const faces=[];
  root.updateMatrixWorld(true);
  const a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3(),normal=new T.Vector3();
  root.traverse(mesh=>{
    if(!mesh.isMesh)return;
    const g=mesh.geometry,p=g.attributes.position,index=g.index;
    const count=index?index.count:p.count;
    const color=`#${mesh.material.color.getHexString(T.SRGBColorSpace)}`;
    for(let i=0;i<count;i+=3){
      a.fromBufferAttribute(p,index?index.getX(i):i).applyMatrix4(mesh.matrixWorld);
      b.fromBufferAttribute(p,index?index.getX(i+1):i+1).applyMatrix4(mesh.matrixWorld);
      c.fromBufferAttribute(p,index?index.getX(i+2):i+2).applyMatrix4(mesh.matrixWorld);
      const area=Math.abs((b.x-a.x)*(c.z-a.z)-(b.z-a.z)*(c.x-a.x));
      normal.crossVectors(b.clone().sub(a),c.clone().sub(a));
      if(area<.00001||normal.y<0)continue;
      faces.push({height:(a.y+b.y+c.y)/3,color,points:[a,b,c].map(p=>`${p.x.toFixed(4)},${p.z.toFixed(4)}`).join(' ')});
    }
  });
  const bounds=new T.Box3().setFromObject(root),size=bounds.getSize(new T.Vector3());
  const pad=Math.max(size.x,size.z)*.05;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${bounds.min.x-pad} ${bounds.min.z-pad} ${size.x+pad*2} ${size.z+pad*2}" role="img" aria-label="${slug} exterior top view"><rect x="${bounds.min.x-pad}" y="${bounds.min.z-pad}" width="${size.x+pad*2}" height="${size.z+pad*2}" fill="#061019"/>${faces.sort((a,b)=>a.height-b.height).map(f=>`<polygon points="${f.points}" fill="${f.color}" stroke="${f.color}" stroke-width="0.004"/>`).join('')}</svg>`;
}

for(const [slug,title,city] of destinations) {
  if(slug==='st-peters-basilica') {
    report.push({slug,title,city,asset:'../st-peters-exterior.glb',fallback:'../st-peters-exterior.webp',method:'retained-official-exterior',triangles:501503});
    continue;
  }
  let root;
  if(slug==='milan-duomo'){
    root=buildCathedral().root;
    root.traverse(o=>{if(o.isMesh)o.material.name=o.name.endsWith(':recess')?'recess':'marble';});
    const lines=[];root.traverse(o=>{if(o.isLine)lines.push(o);});lines.forEach(o=>{o.removeFromParent();o.geometry.dispose();o.material.dispose();});
  }else if(builders[slug])root=builders[slug]();
  else {
    root=buildDetailedExterior(T,mergeGeometries,slug);
    root.traverse(o=>{
      if(!o.isMesh)return;
      setMarbleUV(o.geometry,.8);
      const hex=o.material.color.getHex();
      o.material.name=hex===0xeadfc5?'marble':hex===0xc9b89a?'sandstone':'source-material';
    });
  }
  root.userData.id=`church-massing:${slug}`;
  root.userData.scope='evidence-backed-exterior-massing';
  const originalBounds=new T.Box3().setFromObject(root),size=originalBounds.getSize(new T.Vector3()),center=originalBounds.getCenter(new T.Vector3());
  const scale=16/Math.max(size.x,size.z);
  const positioned=new T.Group();positioned.add(root);
  positioned.scale.setScalar(scale);positioned.position.set(-center.x*scale,-originalBounds.min.y*scale,-center.z*scale);
  positioned.userData={...root.userData,scaleToDisplay:scale};
  let triangles=0,vertices=0;
  const hash=createHash('sha256');
  root.traverse(o=>{
    if(!o.isMesh)return;
    const p=o.geometry.attributes.position,uv=o.geometry.attributes.uv;
    if(!uv||uv.count!==p.count)throw new Error(`${slug}: missing UV`);
    for(const n of p.array)if(!Number.isFinite(n))throw new Error(`${slug}: nonfinite geometry`);
    for(const n of uv.array)if(!Number.isFinite(n))throw new Error(`${slug}: nonfinite UV`);
    vertices+=p.count;triangles+=(o.geometry.index?.count??p.count)/3;
    hash.update(Buffer.from(p.array.buffer,p.array.byteOffset,p.array.byteLength));
  });
  await writeFile(new URL(`${slug}.svg`,directory),topView(positioned,slug));
  root.traverse(o=>{if(o.isMesh){const previous=o.geometry;o.geometry=mergeVertices(previous,1e-6);previous.dispose();}});
  const binary=await new GLTFExporter().parseAsync(positioned,{binary:true});
  await writeFile(new URL(`${slug}.glb`,directory),Buffer.from(binary));
  const entry={slug,title,city,asset:`${slug}.glb`,fallback:`${slug}.svg`,method:slug==='milan-duomo'?'approved-milan':builders[slug]?'new-massing':'retained-reviewed-massing',triangles,vertices,bytes:binary.byteLength,geometryHash:hash.digest('hex'),bounds:originalBounds.getSize(new T.Vector3()).toArray(),featureCounts:root.userData.featureCounts??{}};
  report.push(entry);console.log(`${slug}: ${triangles} triangles, ${Math.round(binary.byteLength/1024)} KB`);
  const materials=new Set();root.traverse(o=>{if(o.isMesh){o.geometry.dispose();materials.add(o.material);}});materials.forEach(m=>m.dispose());
}
await writeFile(new URL('catalog.json',directory),JSON.stringify(report,null,2)+'\n');
await writeFile(new URL('../sources/exteriors/churches/build-report.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
// The approved standalone preview and the main guide consume identical bytes.
const preview=new URL('../../outputs/milan-cathedral-massing/church-models/',import.meta.url);
await mkdir(preview,{recursive:true});
for(const item of report){
  const source=new URL(item.asset,directory),target=new URL(`${item.slug}.glb`,preview);
  await copyFile(source,target);
  await copyFile(new URL(item.fallback,directory),new URL(`${item.slug}.${item.slug==='st-peters-basilica'?'webp':'svg'}`,preview));
}
await writeFile(new URL('catalog.json',preview),JSON.stringify(report.map(x=>({...x,asset:`${x.slug}.glb`,fallback:`${x.slug}.${x.slug==='st-peters-basilica'?'webp':'svg'}`})),null,2)+'\n');
