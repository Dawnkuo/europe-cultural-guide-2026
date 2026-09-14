import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const directory = path.resolve('work/museum-exterior-qa');
const records = JSON.parse(await fs.readFile(path.join(directory, 'mobile-results.json'), 'utf8'));
const results = [], contact = [];
for (const record of records) {
  for (const view of ['desktop', 'top', 'front', 'side', 'mobile']) {
    const file = path.join(directory, `${record.slug}-${view}.jpg`);
    const metadata = await sharp(file).metadata();
    const mobile = view === 'mobile';
    const left = 8, top = mobile ? Math.ceil(record.rect.y) + 8 : 190;
    const width = metadata.width - 16;
    const height = mobile ? Math.min(metadata.height - top - 90, Math.floor(record.rect.height) - 55) : metadata.height - top - 125;
    const region = {left, top, width, height};
    const {data, info} = await sharp(file).extract(region).removeAlpha().raw().toBuffer({resolveWithObject:true});
    let count = 0, minX = width, maxX = 0, minY = height, maxY = 0;
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * info.channels;
      // Count lit model surfaces, excluding the near-black viewer background.
      if (data[offset] + data[offset+1] + data[offset+2] < 140) continue;
      count++; minX=Math.min(minX,x); maxX=Math.max(maxX,x); minY=Math.min(minY,y); maxY=Math.max(maxY,y);
    }
    results.push({slug:record.slug,view,width:metadata.width,height:metadata.height,litPixels:count,coverage:count/(width*height),bounds:{minX,maxX,minY,maxY},nonblank:count>300});
    if (mobile) {
      const input=await sharp(file).extract(region).resize(195,256,{fit:'contain',background:'#08121b'}).png().toBuffer();
      contact.push({input,left:(contact.length%7)*195,top:Math.floor(contact.length/7)*256});
    }
  }
}
await sharp({create:{width:1365,height:768,channels:3,background:'#08121b'}}).composite(contact).png().toFile(path.join(directory,'mobile-contact.png'));
await fs.writeFile(path.join(directory,'pixel-results.json'),JSON.stringify(results,null,2)+'\n');
const failed=results.filter(r=>!r.nonblank);
console.log(JSON.stringify({screenshots:results.length,nonblank:results.length-failed.length,failed},null,2));
if(failed.length) process.exitCode=1;
