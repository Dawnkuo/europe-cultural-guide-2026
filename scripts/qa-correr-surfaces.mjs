import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
import sharp from 'sharp';

const directory='work/correr-roof-qa';
await mkdir(directory,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true}),report=[];
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const expectedHash=hash(await readFile('public/models/museums/correr.glb'));
const expectedContextHash=hash(await readFile('public/maps/exterior-context/correr.json'));
try{
 for(const width of [1440,390]){
  const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:'reduce',isMobile:width<500,hasTouch:width<500});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{
   const servedModel=page.waitForResponse(r=>r.url().endsWith('/models/museums/correr.glb'));
   const servedContext=page.waitForResponse(r=>r.url().endsWith('/maps/exterior-context/correr.json'));
   await page.goto('http://localhost:55910/guides/correr#guide-spatial',{waitUntil:'networkidle'});
   await page.getByRole('button',{name:'外观',exact:true}).click();
   const canvas=page.locator('.guide-spatial-3d__canvas');await canvas.scrollIntoViewIfNeeded();
   await page.waitForFunction(()=>document.querySelector('.guide-spatial-3d__canvas')?.dataset.rendered==='true',null,{timeout:60000});
   await canvas.evaluate(el=>el.scrollIntoView({block:'center'}));
   assert.equal(await canvas.getAttribute('data-model'),'museum-massing:correr');
   assert.equal(hash(await (await servedModel).body()),expectedHash,'Browser loaded an outdated model');
   assert.equal(hash(await (await servedContext).body()),expectedContextHash,'Browser loaded outdated surrounding buildings');
   assert.equal(await canvas.getAttribute('data-framing'),'complete');
   const initial=await canvas.screenshot({path:`${directory}/${width}-context.png`});
   const {width:w,height:h}=await sharp(initial).metadata();
   const pixels=await sharp(initial).extract({left:Math.floor(w*.2),top:Math.floor(h*.2),width:Math.floor(w*.6),height:Math.floor(h*.6)}).removeAlpha().raw().toBuffer();
   let visible=0;for(let i=0;i<pixels.length;i+=3)if(pixels[i]+pixels[i+1]+pixels[i+2]>200)visible++;
   assert.ok(visible>100,'Blank scene');
   // Inspect the facade in its actual street context, at low angles as well as
   // the overview. A nonblank canvas alone cannot verify a flicker repair.
   for(let i=0;i<4;i++)await page.getByRole('button',{name:'放大外观',exact:true}).click();
   await canvas.focus();
   for(let angle=0;angle<8;angle++){
    if(angle)for(let i=0;i<8;i++)await canvas.press('ArrowRight');
    await canvas.screenshot({path:`${directory}/${width}-context-close-${angle}.png`});
   }
   for(const name of ['周边建筑','道路','围墙','绿地与水域']){
    const c=page.getByRole('checkbox',{name,exact:true});if(await c.count()&&await c.isEnabled())await c.uncheck();
   }
   await page.getByRole('button',{name:'重置三维视角',exact:true}).click();
   for(let i=0;i<4;i++)await page.getByRole('button',{name:'放大外观',exact:true}).click();
   await canvas.evaluate(el=>el.scrollIntoView({block:'center'}));await canvas.focus();
   for(let angle=0;angle<8;angle++){
    const before=await canvas.getAttribute('data-camera');
    if(angle)for(let i=0;i<8;i++)await canvas.press('ArrowRight');
    if(angle)await page.waitForFunction(value=>document.querySelector('.guide-spatial-3d__canvas')?.dataset.camera!==value,before);
    await canvas.screenshot({path:`${directory}/${width}-close-${angle}.png`});
   }
   for(let i=0;i<2;i++)await canvas.press('ArrowDown');
   for(let i=0;i<12;i++){
    await canvas.press('ArrowRight');
    await canvas.screenshot({path:`${directory}/${width}-facade-motion-${i}.png`});
   }
   const before=await canvas.getAttribute('data-camera'),box=await canvas.boundingBox();
   await page.mouse.move(box.x+box.width*.4,box.y+box.height*.5);await page.mouse.down();
   await page.mouse.move(box.x+box.width*.6,box.y+box.height*.5,{steps:12});await page.mouse.up();
   await page.waitForFunction(value=>document.querySelector('.guide-spatial-3d__canvas')?.dataset.camera!==value,before);
   await page.getByRole('button',{name:'重置三维视角',exact:true}).click();
   assert.equal(await canvas.getAttribute('data-framing'),'complete');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
   assert.deepEqual(errors,[]);
   report.push({width,passed:true,visiblePixels:visible,rotationViews:16,lowAngleFrames:12,modelSha256:expectedHash,contextSha256:expectedContextHash,drag:true,zoom:true,reset:true,pageErrors:errors});
   console.log(`${width}: PASS`);
  }finally{await page.close();}
 }
}finally{await browser.close();await writeFile(`${directory}/report.json`,JSON.stringify(report,null,2)+'\n');}
