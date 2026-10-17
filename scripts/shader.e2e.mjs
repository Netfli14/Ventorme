import {spawn} from "node:child_process";
import {mkdir, writeFile} from "node:fs/promises";
import assert from "node:assert/strict";
import {chromium} from "playwright";

const base="http://127.0.0.1:3200", report=[], errors=[];
const server=spawn(process.execPath,["node_modules/next/dist/bin/next","start","--hostname","127.0.0.1","--port","3200"],{
  cwd:process.cwd(),detached:true,env:{...process.env,NEXT_TELEMETRY_DISABLED:"1"},stdio:["ignore","pipe","pipe"],
});
let logs="",browser,page;
server.stdout.on("data",d=>logs+=d);server.stderr.on("data",d=>logs+=d);
const ok=m=>{report.push(m);console.log("PASS",m)};
try {
  for(let i=0;i<80&&!logs.includes("Ready");i++) await new Promise(r=>setTimeout(r,250));
  if(!logs.includes("Ready"))throw Error(logs);
  browser=await chromium.launch({executablePath:process.env.VENTORME_BROWSER_PATH||undefined,headless:true,args:[
    "--no-sandbox","--no-zygote","--disable-dev-shm-usage","--disable-gpu-sandbox",
    "--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist",
  ],env:{...process.env}});
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  context.setDefaultTimeout(60000);
  page=await context.newPage();
  page.on("pageerror",e=>errors.push(e.message));
  page.on("console",m=>{if(m.type()==="error")errors.push(m.text())});
  await page.addInitScript(()=>{
    window.__shaderDraws=0;window.__shaderPixel=0;
    if(!window.WebGL2RenderingContext)return;
    for(const name of ["drawElements","drawArrays"]) {
      const original=WebGL2RenderingContext.prototype[name];
      WebGL2RenderingContext.prototype[name]=function(...args) {
        const result=Reflect.apply(original,this,args);
        window.__shaderDraws++;
        if(!window.__shaderPixel) {
          const pixels=new Uint8Array(16*16*4);
          this.readPixels(Math.max(0,Math.floor(this.drawingBufferWidth/2)-8),Math.max(0,Math.floor(this.drawingBufferHeight/2)-8),16,16,this.RGBA,this.UNSIGNED_BYTE,pixels);
          window.__shaderPixel=Math.max(...pixels);
        }
        return result;
      };
    }
  });
  await page.goto(base+"/ru/",{waitUntil:"networkidle"});
  await page.getByRole("button",{name:"Только необходимые",exact:true}).click();
  assert.equal(await page.locator("[data-shader-state]").getAttribute("data-shader-state"),"idle");
  ok("shader stays unloaded behind the original video intro");
  await page.getByRole("link",{name:"Пропустить интро",exact:false}).click();
  await page.waitForFunction(()=>document.querySelector("[data-shader-state]")?.dataset.shaderState==="active");
  await page.waitForFunction(()=>window.__shaderDraws>=2&&window.__shaderPixel>0);
  const host=page.locator("[data-shader-background]"), canvas=host.locator("canvas");
  const dimensions=await canvas.evaluate(c=>({w:c.width,h:c.height}));
  assert.ok(dimensions.w*dimensions.h<502000);
  const style=await host.evaluate(el=>({opacity:Number(getComputedStyle(el).opacity),events:getComputedStyle(el).pointerEvents}));
  assert.ok(style.opacity>=0.1&&style.opacity<=0.22);assert.equal(style.events,"none");
  await mkdir(".test-results",{recursive:true});
  await page.waitForTimeout(1300);
  await page.screenshot({path:".test-results/shader-light.png"});
  ok("real WebGL2 shader compiles and draws non-empty pixels at low intensity");
  await page.getByRole("button",{name:"Пауза фона",exact:true}).click();
  await page.waitForFunction(()=>document.querySelector("[data-shader-state]").dataset.shaderState==="paused");
  const pausedCount=await page.evaluate(()=>window.__shaderDraws);
  await page.waitForTimeout(400);
  assert.equal(await page.evaluate(()=>window.__shaderDraws),pausedCount);
  assert.equal(await canvas.count(),1);
  await page.getByRole("button",{name:"Включить фон",exact:true}).click();
  await page.waitForFunction(n=>window.__shaderDraws>n,pausedCount);
  ok("pause stops actual GPU draws and resume keeps one canvas");
  await page.getByRole("button",{name:"Включить тёмную тему",exact:true}).click();
  await page.screenshot({path:".test-results/shader-dark.png"});
  await page.setViewportSize({width:390,height:844});
  await page.waitForTimeout(400);
  const mobile=await canvas.evaluate(c=>({w:c.width,h:c.height}));
  assert.ok(mobile.w*mobile.h<181000&&mobile.h<=640);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),390);
  await page.locator("#content-start").scrollIntoViewIfNeeded();
  await page.screenshot({path:".test-results/shader-mobile.png"});
  ok("both themes and mobile size stay readable with a reduced pixel budget");
  await page.evaluate(()=>document.querySelector("[data-shader-background] canvas").getContext("webgl2").getExtension("WEBGL_lose_context").loseContext());
  await page.waitForFunction(()=>document.querySelector("[data-shader-state]").dataset.shaderState==="fallback");
  ok("context loss degrades to the static backdrop");
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.waitForFunction(()=>document.querySelector("[data-shader-state]").dataset.shaderState==="reduced");
  assert.equal(await canvas.count(),0);
  assert.equal(await page.getByRole("button",{name:"Пауза фона",exact:true}).count(),0);
  assert.deepEqual(errors,[]);
  ok("live reduced motion releases WebGL resources; no console or page errors");
  await writeFile(".test-results/shader-verification.json",JSON.stringify({report,errors},null,2));
}catch(e){console.error(e);console.error('Browser errors',errors);if(page)console.error(await page.locator('[data-shader-state]').evaluate(el=>({state:el.dataset.shaderState,rect:el.getBoundingClientRect().toJSON(),scrollY})).catch(()=>null));console.error(logs.slice(-1200));process.exitCode=1;}
finally{await browser?.close();try{process.kill(-server.pid,"SIGTERM")}catch{}}
