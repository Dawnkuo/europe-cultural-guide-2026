import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import sharp from 'sharp';
import {landmarks} from '../sources/exteriors/landmarks/catalog.mjs';

const output='work/landmark-exterior-qa';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const report=[];
try{
  const slugs=process.argv.slice(2);
  for(const width of (process.env.QA_WIDTHS??'1440,390').split(',').map(Number))for(const item of landmarks.filter(i=>!slugs.length||slugs.includes(i.slug))){
    const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:'reduce',hasTouch:width<500,isMobile:width<500});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    try{
      await page.goto(`http://localhost:55910/guides/${item.slug}#guide-spatial`,{waitUntil:'domcontentloaded'});
      await page.locator('#guide-spatial .architectural-map, #guide-spatial canvas').first().waitFor({state:'attached'});
      const exterior=page.getByRole('button',{name:'外观',exact:true});
      if(await exterior.count())await exterior.click();
      const canvas=page.locator('.guide-spatial-3d__canvas');
      await canvas.scrollIntoViewIfNeeded();
      await page.waitForFunction(()=>document.querySelector('.guide-spatial-3d__canvas')?.dataset.rendered==='true',null,{timeout:30000});
      await canvas.evaluate(el=>el.scrollIntoView({block:'center'}));
      await canvas.screenshot({path:`${output}/${width}-${item.slug}-context.png`});
      for(const name of ['周边建筑','道路','围墙','绿地与水域']){
        const checkbox=page.getByRole('checkbox',{name,exact:true});
        if(await checkbox.count()&&await checkbox.isEnabled())await checkbox.uncheck();
      }
      await page.getByRole('button',{name:'重置三维视角',exact:true}).click();
      await canvas.evaluate(el=>el.scrollIntoView({block:'center'}));
      const data=await canvas.evaluate(el=>Object.fromEntries(Object.entries(el.dataset)));
      assert.equal(data.model,`landmark-massing:${item.slug}`);
      assert.equal(data.framing,'complete');
      const image=await canvas.screenshot({path:`${output}/${width}-${item.slug}.png`,style:'.guide-spatial-3d__toolbar, .guide-spatial-3d__hint { visibility: hidden; }'});
      // Fractional CSS canvas bounds can include one row of the adjacent gold divider.
      const size=await sharp(image).metadata();
      const {data:pixels,info}=await sharp(image).extract({left:1,top:1,width:size.width-2,height:size.height-2}).removeAlpha().raw().toBuffer({resolveWithObject:true});
      let count=0,minX=info.width,minY=info.height,maxX=0,maxY=0;
      for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){
        const i=(y*info.width+x)*info.channels;
        if(pixels[i]+pixels[i+1]+pixels[i+2]<185)continue;
        count++;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
      }
      assert.ok(count>100,`${item.slug}: blank canvas`);
      assert.ok(minX>2&&minY>2&&maxX<info.width-3&&maxY<info.height-3,`${item.slug}: model clipped (${minX},${minY},${maxX},${maxY})`);
      const home=await canvas.getAttribute('data-camera'),rect=await canvas.boundingBox();
      await page.mouse.move(rect.x+rect.width*.45,rect.y+rect.height*.5);await page.mouse.down();
      await page.mouse.move(rect.x+rect.width*.65,rect.y+rect.height*.55,{steps:8});await page.mouse.up();
      await page.waitForFunction(before=>document.querySelector('.guide-spatial-3d__canvas')?.dataset.camera!==before,home);
      await canvas.screenshot({path:`${output}/${width}-${item.slug}-rotated.png`});
      await page.getByRole('button',{name:'重置三维视角',exact:true}).click();
      await page.getByRole('button',{name:'放大外观',exact:true}).click();
      await page.getByRole('button',{name:'缩小外观',exact:true}).click();
      await canvas.focus();
      const keyboardBefore=await canvas.getAttribute('data-camera');
      await canvas.press('ArrowRight');
      await page.waitForFunction(before=>document.querySelector('.guide-spatial-3d__canvas')?.dataset.camera!==before,keyboardBefore);
      await canvas.press('Home');
      if(width<500){
        await canvas.evaluate(el=>el.scrollIntoView({block:'center'}));
        const touch=await page.context().newCDPSession(page),box=await canvas.boundingBox();
        const x=box.x+box.width/2,y=box.y+box.height/2;
        const before=await canvas.getAttribute('data-camera');
        await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x-35,y,id:1},{x:x+35,y,id:2}]});
        for(let gap=40;gap<=75;gap+=5)await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-gap,y,id:1},{x:x+gap,y,id:2}]});
        await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
        await page.waitForFunction(value=>document.querySelector('.guide-spatial-3d__canvas')?.dataset.camera!==value,before);
        await touch.detach();
      }
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
      assert.deepEqual(errors,[]);
      report.push({slug:item.slug,width,passed:true,visiblePixels:count,pixelBounds:[minX,minY,maxX,maxY],model:data.model,triangles:Number(data.triangles),drawCalls:Number(data.drawCalls),drag:true,zoom:true,keyboard:true,touchPinch:width<500});
      console.log(`${width} ${item.slug}: PASS ${count} pixels`);
    }catch(error){report.push({slug:item.slug,width,passed:false,error:String(error),pageErrors:errors});console.error(`${width} ${item.slug}: ${String(error)}`);}
    finally{await page.close();}
  }
}finally{await browser.close();await writeFile(`${output}/${process.env.QA_WIDTHS?'touch-report':'report'}.json`,JSON.stringify(report,null,2)+'\n');}
assert.ok(report.every(r=>r.passed),'Some exterior views did not pass. See report.json.');
