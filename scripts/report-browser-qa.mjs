import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {access,mkdtemp,mkdir,readFile,writeFile,readdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createPagesServer} from './serve-pages.mjs';

// Real Chromium, the actual built app and synthetic samples only. No production
// identity, access token, account, network API or health record is used.
const root=fileURLToPath(new URL('../',import.meta.url));
const out=process.env.REPORT_BROWSER_OUTPUT||path.join(root,'report-qa-output','browser');
await mkdir(out,{recursive:true});
let binary;
for(const candidate of [process.env.CHROME_BIN,'/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].filter(Boolean)){
 try{await access(candidate);binary=candidate;break;}catch{/* Try the next installed binary. */}
}
if(!binary)throw Error('Chromium is required for the real-browser report check.');
const profile=await mkdtemp(path.join(tmpdir(),'kq-report-chrome-'));
const server=await createPagesServer();
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url=`http://127.0.0.1:${server.address().port}/geneticage/`;
const chrome=spawn(binary,['--headless=new','--no-sandbox','--disable-dev-shm-usage','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:['ignore','ignore','pipe']});
let socket,serial=0;const pending=new Map(),exceptions=[],downloads=[];
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
try{
 const endpoint=await new Promise((resolve,reject)=>{
  let text='';const timer=setTimeout(()=>reject(Error('Chromium startup timeout.')),20000);
  chrome.stderr.on('data',data=>{text+=data;const match=text.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(match){clearTimeout(timer);resolve(match[1]);}});
  chrome.once('error',reject);chrome.once('exit',code=>{clearTimeout(timer);reject(Error('Chromium exited during startup: '+code));});
 });
 socket=new WebSocket(endpoint);
 await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});
 socket.addEventListener('message',event=>{
  const data=JSON.parse(event.data);
  if(data.id){const p=pending.get(data.id);if(p){pending.delete(data.id);clearTimeout(p.timer);if(data.error)p.reject(Error(JSON.stringify(data.error)));else p.resolve(data.result);}}
  if(data.method==='Runtime.exceptionThrown')exceptions.push(data.params.exceptionDetails.exception?.description||data.params.exceptionDetails.text);
  if(data.method==='Browser.downloadProgress'&&data.params.state==='completed')downloads.push(data.params.guid);
 });
 const send=(method,params={},sessionId)=>new Promise((resolve,reject)=>{
  const id=++serial,timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout: '+method));},60000);
  pending.set(id,{resolve,reject,timer});socket.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}));
 });
 const {targetId}=await send('Target.createTarget',{url:'about:blank'});
 const {sessionId}=await send('Target.attachToTarget',{targetId,flatten:true});
 const page=(method,params)=>send(method,params,sessionId);
 await page('Page.enable');await page('Runtime.enable');
 await send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:out,eventsEnabled:true});
 const evaluate=async expression=>{
  const r=await page('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
  if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);
  return r.result.value;
 };
 const until=async(expression,label,timeout=20000)=>{
  const end=Date.now()+timeout;while(Date.now()<end){if(await evaluate(expression))return;await pause(100);}throw Error('Browser check timed out: '+label);
 };
 const click=async selector=>{
  await until(`!!document.querySelector(${JSON.stringify(selector)})`,selector);
  await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);await pause(150);
 };
 const fill=async(selector,value)=>{
  await until(`!!document.querySelector(${JSON.stringify(selector)})`,selector);
  await evaluate(`(()=>{const input=document.querySelector(${JSON.stringify(selector)});input.value=${JSON.stringify(value)};input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));})()`);
 };
 async function download(scope){
  const before=downloads.length;
  await click(`[data-action="print"][data-export="${scope}"]`);
  const end=Date.now()+60000;
  while(downloads.length===before&&Date.now()<end){
   const failed=await evaluate("document.querySelector('.kq-pdf-status')?.hasAttribute('data-error')");
   assert.ok(!failed,'The real PDF export reported an error.');await pause(150);
  }
  assert.equal(downloads.length,before+1,'A finished PDF must actually reach the download directory.');
 }
 await page('Page.navigate',{url});
 await until("document.querySelector('[data-route=reports]') && document.documentElement.dataset.launch !== 'pending'",'App launch');
 await pause(4500);
 await click('.sidebar-nav [data-route="reports"]');
 await click('[data-action="sample-report"]');
 await until("!!document.querySelector('.kq-editorial')",'Editorial sample');
 const checks=[];
 for(const width of [320,390,1280]){
  await page('Emulation.setDeviceMetricsOverride',{width,height:width<600?844:1000,deviceScaleFactor:1,mobile:width<600});
  for(const language of ['en','bg']){
   if(await evaluate('document.documentElement.lang')!==language)await click('#language-toggle');
   for(const theme of ['black-metal','blood-moon','bionic']){
    await click(`[data-theme-preference="${theme}"]`);await pause(1200);
    const measurements=await evaluate(`(()=>{const e=document.querySelector('.kq-editorial'),r=e.getBoundingClientRect();return {width:r.width,scroll:e.scrollWidth,client:e.clientWidth,lang:document.documentElement.lang,text:e.innerText,theme:document.documentElement.dataset.theme};})()`);
    assert.ok(measurements.scroll<=measurements.client+2,`Report overflow at ${width} / ${language} / ${theme}`);
    assert.equal(measurements.lang,language);
    assert.match(measurements.text,language==='bg'?/глюкоз/i:/glucose/i);
    checks.push({width,language,theme,reportWidth:measurements.width});
    if(theme==='bionic'&&(width===390||width===1280)){
     const shot=await page('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
     await writeFile(path.join(out,`report-${width}-${language}.png`),Buffer.from(shot.data,'base64'));
    }
   }
  }
 }
 for(const language of ['en','bg']){
  if(await evaluate('document.documentElement.lang')!==language)await click('#language-toggle');
  for(const scope of ['report','technical'])await download(scope);
 }
 const files=(await readdir(out)).filter(name=>name.endsWith('.pdf'));
 assert.equal(files.length,4);
 for(const file of files){const bytes=await readFile(path.join(out,file));assert.equal(bytes.subarray(0,4).toString(),'%PDF');assert.ok(bytes.length>2000);}
 for(const tab of ['data','details','summary']){
  await click(`[data-action="report-tab"][data-tab="${tab}"]`);
  assert.equal(await evaluate(`document.querySelector('.report-panel:not([hidden])').dataset.reportPanel`),tab);
 }
 // Edit the fictional sample through the same forms a reader uses.
 if(await evaluate('document.documentElement.lang')!=='en')await click('#language-toggle');
 await click('[data-action="report-tab"][data-tab="data"]');
 await click('.kq-clinical-support [data-action="review"]');
 await click('[data-action="edit-section"][data-index="3"]');
 await fill('#moderate','180');await click('#questions [type=submit]');
 await until("!!document.querySelector('#vigorous')",'vigorous activity');await click('#questions [type=submit]');
 await click('[data-answer="strength"][value="2"]');await click('#questions [type=submit]');
 await until("!!document.querySelector('[data-answer=limitations]')",'activity limits');await click('#questions [type=submit]');
 await click('[data-action="edit-section"][data-index="4"]');
 await fill('#sleep','8');await click('#questions [type=submit]');
 await click('[data-answer="rested"][value="Usually"]');await click('#questions [type=submit]');
 await until("!!document.querySelector('[data-answer=disrupted]')",'sleep disruption');await click('#questions [type=submit]');
 await until("!!document.querySelector('[data-answer=stress]')",'stress');await click('#questions [type=submit]');
 await until("!!document.querySelector('.review-screen')",'return to questionnaire review');
 await click('[data-action="back-screen"]');
 await click('[data-action="report-tab"][data-tab="data"]');
 await click('.kq-clinical-support [data-action="labs"]');
 await click('#labs-form [type=submit]');
 await fill('[data-lab="glucose"]','4.9');
 for(const marker of ['glucose','crp','wbc']){
  await until(`!!document.querySelector('[data-lab="${marker}"]')`,marker);
  await click('#labs-form [type=submit]');
 }
 await until("!!document.querySelector('#lab-valid')",'collection confirmation');
 await click('#labs-form [type=submit]');
 await click('[data-action="report-tab"][data-tab="summary"]');
 const changed=await evaluate("document.querySelector('.kq-clinical-folio').innerText");
 assert.match(changed,/Build on the routine you already have/);
 assert.match(changed,/4\.9/);
 assert.match(changed,/Moderate activity\s+180\s+minutes \/ week/);
 assert.doesNotMatch(changed,/Diabetes Prevention Program|Weeks 1–2/);
 const second=path.join(out,'established-routine');
 await mkdir(second,{recursive:true});
 await send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:second,eventsEnabled:true});
 for(const scope of ['report','technical'])await download(scope);
 const secondFiles=(await readdir(second)).filter(name=>name.endsWith('.pdf'));
 assert.equal(secondFiles.length,2);
 assert.deepEqual(exceptions,[],'The browser must have no uncaught application errors.');
 const summary={browser:(await send('Browser.getVersion')).product,checks,pdfs:files,comparisonCase:secondFiles,uncaughtExceptions:exceptions};
 await writeFile(path.join(out,'checks.json'),JSON.stringify(summary,null,2));
 console.log('Real-browser report review passed: 18 layouts and six downloads across two fictional cases.');
}finally{
 for(const p of pending.values()){clearTimeout(p.timer);p.reject(Error('Browser review closed.'));}
 socket?.close();chrome.kill();server.close();
 await pause(300);await rm(profile,{recursive:true,force:true,maxRetries:3});
}
