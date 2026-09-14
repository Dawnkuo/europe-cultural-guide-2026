import fs from 'node:fs/promises';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
const directory=new URL('../work/exterior-context-qa/',import.meta.url);
const files=(await fs.readdir(directory)).filter(f=>f.startsWith('mobile-')&&f.endsWith('.png')).sort();
const records=[];
for(let start=0;start<files.length;start+=9){
  const composite=[];
  for(const [index,file] of files.slice(start,start+9).entries()){
    const buffer=await sharp(fileURLToPath(new URL(file,directory))).resize(260,563).png().toBuffer();
    composite.push({input:buffer,left:(index%3)*260,top:Math.floor(index/3)*587});
    const label=Buffer.from(`<svg width="260" height="24"><rect width="260" height="24" fill="#0b1d2b"/><text x="6" y="16" font-family="sans-serif" font-size="11" fill="#e6c977">${file.replace('mobile-','').replace('.png','')}</text></svg>`);
    composite.push({input:label,left:(index%3)*260,top:Math.floor(index/3)*587+563});
    const {data,info}=await sharp(fileURLToPath(new URL(file,directory))).removeAlpha().raw().toBuffer({resolveWithObject:true});
    let modelPixels=0;
    // Read the unobstructed upper-middle canvas area, excluding page text and controls.
    for(let y=230;y<Math.min(625,info.height);y++)for(let x=20;x<info.width-20;x++){
      const p=(y*info.width+x)*info.channels;
      if(data[p]>70&&data[p+1]>70&&data[p+2]>65)modelPixels++;
    }
    records.push({file,modelPixels});
  }
  await sharp({create:{width:780,height:1761,channels:3,background:'#061019'}}).composite(composite).png().toFile(fileURLToPath(new URL(`contact-${String(start/9+1).padStart(2,'0')}.png`,directory)));
}
await fs.writeFile(new URL('pixels.json',directory),JSON.stringify(records,null,2)+'\n');
console.log(JSON.stringify({screenshots:files.length,lowPixelCounts:records.filter(r=>r.modelPixels<500)},null,2));
