import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { exteriorReferences } from '../app/data/exterior-references.ts';

const directory='work/exterior-reference-qa';
await mkdir(directory,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true}),report=[];
try {
  for(const width of [1440,390]) {
    const page=await browser.newPage({viewport:{width,height:1050},isMobile:width<500,hasTouch:width<500,reducedMotion:'reduce'});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    try {
      await page.goto('http://localhost:55910/models/',{waitUntil:'domcontentloaded'});
      await page.getByRole('combobox',{name:'景点'}).waitFor();
      for(const [index,model] of exteriorReferences.entries()) {
        try {
          await page.getByRole('combobox',{name:'景点'}).selectOption(String(index));
          const viewport=page.locator(`[data-model-id="${model.modelId}"]`);
          await viewport.scrollIntoViewIfNeeded();
          await page.waitForFunction(id=>document.querySelector(`[data-model-id="${id}"]`)?.getAttribute('data-state')==='ready',model.modelId,{timeout:70000});
          await page.waitForTimeout(5000);
          assert.equal(await page.locator('iframe').count(),1);
          const bytes=await viewport.screenshot({path:`${directory}/${width}-${model.id}.png`});
          const {width:w,height:h}=await sharp(bytes).metadata();
          const region={left:Math.floor(w*.15),top:Math.floor(h*.15),width:Math.floor(w*.7),height:Math.floor(h*.7)};
          const stats=await sharp(bytes).extract(region).stats();
          assert.ok(stats.channels.slice(0,3).some(c=>c.stdev>8),'Blank or uniformly coloured scene');
          const frame=viewport.locator('iframe'),before=await frame.getAttribute('data-camera');
          assert.ok(before,'Missing camera readiness');
          const box=await frame.boundingBox();
          await page.mouse.move(box.x+box.width*.42,box.y+box.height*.48);await page.mouse.down();
          await page.mouse.move(box.x+box.width*.64,box.y+box.height*.53,{steps:20});await page.mouse.up();
          await page.waitForFunction(initial=>document.querySelector('.reference-exterior iframe')?.getAttribute('data-camera')!==initial,before,{timeout:15000});
          await viewport.screenshot({path:`${directory}/${width}-${model.id}-rotated.png`});
          await page.getByRole('button',{name:'重置模型视角',exact:true}).click();
          await page.waitForFunction(initial=>{
            const current=document.querySelector('.reference-exterior iframe')?.getAttribute('data-camera');
            if(!current)return false;
            const a=JSON.parse(current),b=JSON.parse(initial);
            return [...a.position,...a.target].every((value,i)=>Math.abs(value-[...b.position,...b.target][i])<.01);
          },before,{timeout:15000});
          assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
          report.push({width,id:model.id,ready:true,drag:true,reset:true,screenshot:`${width}-${model.id}.png`,errors:[...errors]});
          console.log(`${width} ${model.id}: PASS`);
        } catch(error) {
          await page.screenshot({path:`${directory}/${width}-${model.id}-failure.png`});
          report.push({width,id:model.id,ready:false,error:String(error),errors:[...errors]});
          console.log(`${width} ${model.id}: ${String(error)}`);
        }
      }
      await page.context().setOffline(true);
      await page.getByText('当前离线，在线模型不可用。',{exact:true}).waitFor();
      assert.equal(await page.locator('iframe').count(),0);
      await page.screenshot({path:`${directory}/${width}-offline.png`});
      await page.context().setOffline(false);
    } finally { await page.close(); }
  }
} finally { await browser.close();await writeFile(`${directory}/report.json`,JSON.stringify(report,null,2)+'\n'); }
assert.ok(report.every(item=>item.ready),'Some remote previews failed; see report');
