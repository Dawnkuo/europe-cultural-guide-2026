import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import sharp from 'sharp';

const directory='work/st-mark-context-qa';
await mkdir(directory,{recursive:true});
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const modelHash=hash(await readFile('public/models/churches/st-mark-basilica.glb'));
const contextHash=hash(await readFile('public/maps/exterior-context/st-mark-basilica.json'));
const catalog=JSON.parse(await readFile('public/models/churches/catalog.json','utf8'));
assert.equal(catalog.find(s=>s.slug==='st-mark-basilica').geometryHash,'cffea942aa9c61d192ca1b40b9a89c3563e0936ced469c9f30e3bc1466a27c62');
const browser=await chromium.launch({channel:'chrome',headless:true}),report=[];
try {
  for(const width of [1440,390]) {
    const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:'reduce',isMobile:width<500,hasTouch:width<500});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    try {
      const modelResponse=page.waitForResponse(r=>r.url().endsWith('/models/churches/st-mark-basilica.glb'));
      const contextResponse=page.waitForResponse(r=>r.url().endsWith('/maps/exterior-context/st-mark-basilica.json'));
      await page.goto('http://localhost:55910/guides/st-mark-basilica#guide-spatial',{waitUntil:'networkidle'});
      await page.getByRole('button',{name:'外观',exact:true}).click();
      const canvas=page.locator('.guide-spatial-3d__canvas');
      await canvas.scrollIntoViewIfNeeded();
      await page.waitForFunction(()=>document.querySelector('.guide-spatial-3d__canvas')?.dataset.rendered==='true',null,{timeout:60000});
      await canvas.evaluate(el=>el.scrollIntoView({block:'center'}));
      assert.equal(hash(await (await modelResponse).body()),modelHash);
      assert.equal(hash(await (await contextResponse).body()),contextHash);
      assert.equal(await canvas.getAttribute('data-framing'),'complete');
      assert.equal(await page.getByRole('checkbox',{name:'周边建筑',exact:true}).isChecked(),true);
      const initial=await canvas.screenshot({path:`${directory}/${width}-overview.png`});
      const pixels=await sharp(initial).removeAlpha().raw().toBuffer();
      let visible=0;for(let i=0;i<pixels.length;i+=3)if(pixels[i]+pixels[i+1]+pixels[i+2]>200)visible++;
      assert.ok(visible>1000,'Blank model');
      for(let i=0;i<3;i++)await page.getByRole('button',{name:'放大外观',exact:true}).click();
      await canvas.focus();
      for(let i=0;i<6;i++)await canvas.press('ArrowLeft');
      await canvas.press('ArrowDown');
      for(let view=0;view<8;view++) {
        const before=await canvas.getAttribute('data-camera');
        if(view) {
          for(let i=0;i<8;i++)await canvas.press('ArrowRight');
          await page.waitForFunction(value=>document.querySelector('.guide-spatial-3d__canvas')?.dataset.camera!==value,before);
        }
        await canvas.screenshot({path:`${directory}/${width}-view-${view}.png`});
      }
      const before=await canvas.getAttribute('data-camera'),box=await canvas.boundingBox();
      await page.mouse.move(box.x+box.width*.4,box.y+box.height*.5);await page.mouse.down();
      await page.mouse.move(box.x+box.width*.6,box.y+box.height*.5,{steps:12});await page.mouse.up();
      await page.waitForFunction(value=>document.querySelector('.guide-spatial-3d__canvas')?.dataset.camera!==value,before);
      await page.getByRole('button',{name:'重置三维视角',exact:true}).click();
      assert.equal(await canvas.getAttribute('data-framing'),'complete');
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
      assert.deepEqual(errors,[]);
      report.push({width,passed:true,visiblePixels:visible,views:8,modelHash,contextHash,contextEnabled:true,drag:true,zoom:true,reset:true,pageErrors:errors});
      console.log(`${width}: PASS`);
    } finally { await page.close(); }
  }
} finally { await browser.close();await writeFile(`${directory}/report.json`,JSON.stringify(report,null,2)+'\n'); }
