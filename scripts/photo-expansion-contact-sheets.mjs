import { readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
const root = 'work/photo-expansion';
const queryFile=process.argv[2] ?? 'sources/photography/expansion-queries.json';
const queries = JSON.parse(await readFile(queryFile, 'utf8'));
const ids = Object.keys(queries);
for(let start=0;start<ids.length;start+=8) {
  const composite=[];
  const group=ids.slice(start,start+8);
  for(const [r,id] of group.entries()) {
    for(let i=0;i<3;i++) {
      try {
        const b=await sharp(`${root}/candidates/${id}-${i}.jpg`).resize(290,180,{fit:'inside'}).toBuffer();
        composite.push({input:b,left:i*310,top:r*215+25});
      } catch {}
      composite.push({input:Buffer.from(`<svg width="310" height="25"><text x="3" y="19" font-size="13" fill="white">${id} ${i}</text></svg>`),left:i*310,top:r*215});
    }
  }
  const b=await sharp({create:{width:930,height:group.length*215,channels:3,background:'#172028'}}).composite(composite).png().toBuffer();
  await writeFile(`${root}/${process.argv[3] ?? 'sheet'}-${start/8}.png`,b);
}
