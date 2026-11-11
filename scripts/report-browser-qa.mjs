import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {access,mkdtemp,mkdir,readFile,writeFile,readdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createPagesServer} from './serve-pages.mjs';
import {sampleAnswers} from '../public/model.mjs';
import {systemSampleInputs} from '../public/system-assessments.mjs';

// Real Chromium, the actual built app and synthetic samples only. No production
// identity, access token, account, network API or health record is used.
const root=fileURLToPath(new URL('../',import.meta.url));
const out=path.resolve(process.env.REPORT_BROWSER_OUTPUT||path.join(root,'report-qa-output','browser'));
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
let socket,send,serial=0;const pending=new Map(),exceptions=[],downloads=[];
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
  if(data.method==='Browser.downloadProgress'&&data.params.state==='canceled')console.error('Browser download cancelled:',JSON.stringify(data.params));
  if(data.method==='Log.entryAdded'&&data.params.entry.level==='error')console.error('Browser log:',data.params.entry.text);
 });
 send=(method,params={},sessionId)=>new Promise((resolve,reject)=>{
  const id=++serial,timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout: '+method));},60000);
  pending.set(id,{resolve,reject,timer});socket.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}));
 });
 const {targetId}=await send('Target.createTarget',{url:'about:blank'});
 const {sessionId}=await send('Target.attachToTarget',{targetId,flatten:true});
 const page=(method,params)=>send(method,params,sessionId);
 await page('Page.enable');await page('Runtime.enable');await page('Log.enable');
 await send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:out,eventsEnabled:true});
 const evaluate=async(expression,userGesture=false)=>{
  const r=await page('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture});
  if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);
  return r.result.value;
 };
 const until=async(expression,label,timeout=20000)=>{
  const end=Date.now()+timeout;while(Date.now()<end){if(await evaluate(expression))return;await pause(100);}throw Error('Browser check timed out: '+label);
 };
 const click=async selector=>{
  await until(`!!document.querySelector(${JSON.stringify(selector)})`,selector);
  await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`,true);await pause(150);
 };
 const fill=async(selector,value)=>{
  await until(`!!document.querySelector(${JSON.stringify(selector)})`,selector);
  await evaluate(`(()=>{const input=document.querySelector(${JSON.stringify(selector)});input.value=${JSON.stringify(value)};input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));})()`);
 };
 async function download(scope){
  const before=downloads.length;
  const selector=`[data-action="print"][data-export="${scope}"]`;
  const point=await evaluate(`(()=>{const button=document.querySelector(${JSON.stringify(selector)});button.scrollIntoView({block:'center'});const r=button.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);
  await page('Input.dispatchMouseEvent',{type:'mousePressed',...point,button:'left',clickCount:1});
  await page('Input.dispatchMouseEvent',{type:'mouseReleased',...point,button:'left',clickCount:1});
  const end=Date.now()+60000;
  while(downloads.length===before&&Date.now()<end){
   const failed=await evaluate("document.querySelector('.kq-pdf-status')?.hasAttribute('data-error')");
   assert.ok(!failed,'The real PDF export reported an error.');await pause(150);
  }
  if(downloads.length!==before+1)console.error('PDF delivery state:',await evaluate("({status:document.querySelector('.kq-pdf-status')?.outerHTML,title:document.title,lang:document.documentElement.lang})"));
  assert.equal(downloads.length,before+1,'A finished PDF must actually reach the download directory.');
 }
 await page('Page.navigate',{url});
 await until("document.querySelector('[data-route=reports]') && document.documentElement.dataset.launch !== 'pending'",'App launch');
 await pause(4500);
 await click('.sidebar-nav [data-route="reports"]');
 await click('[data-action="sample-report"]');
 await until("!!document.querySelector('.kq-editorial')",'Editorial sample');
 const checks=[];
 for(const width of process.env.REPORT_BROWSER_QUICK?[390]:[320,390,1280]){
  await page('Emulation.setDeviceMetricsOverride',{width,height:width<600?844:1000,deviceScaleFactor:1,mobile:width<600});
  for(const language of ['en','bg']){
   if(await evaluate('document.documentElement.lang')!==language)await click('#language-toggle');
   for(const theme of process.env.REPORT_BROWSER_QUICK?['bionic']:['black-metal','blood-moon','bionic']){
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
 console.log('Clinical layouts checked; downloading the actual app PDFs.');
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
 const families={};
 const openAssessments=()=>click('.sidebar-nav [data-route="history"]');
 async function familyExports(type,edition=type){
  const selector=`[data-report-family="${type}"]`;
  await until(`!!document.querySelector(${JSON.stringify(selector)})`,type+' report');
  const teaching={
   'heart-vascular':/Systolic pressure is the upper number/,
   metabolic:/With insulin resistance, cells respond less effectively/,
   kidney:/kidney tubules then return/,
   fitness:/millilitres of oxygen per kilogram/,
   'health-profile':/Time in bed, time asleep and feeling restored/,
  };
  const lessonText=await evaluate(`document.querySelector(${JSON.stringify(selector)}).innerText`);
  assert.match(lessonText,teaching[type],type+' must include its educational chapters');
  const interpretation={
   'heart-vascular':/Your ApoB result and the question of a personal target/,
   metabolic:/What your glucose results suggest now/,
   kidney:/What your urine result adds to filtration/,
   fitness:/What your capacity and activity suggest doing next/,
   'health-profile':/How your recorded routine shapes the priorities/,
  };
  assert.match(lessonText,interpretation[type],type+' must interpret the actual recorded results');
  if(edition==='heart-vascular')assert.match(lessonText,/ApoB and wider lipid discussion a more useful optimisation focus/);
  if(edition==='heart-inherited-risk')assert.match(lessonText,/Your ApoB is below 90 mg\/dL, while Lp\(a\) is in the higher category/);
  const folder=path.join(out,edition);
  await mkdir(folder,{recursive:true});
  await send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:folder,eventsEnabled:true});
  for(const scope of ['report','technical'])await download(scope);
  const exported=(await readdir(folder)).filter(file=>file.endsWith('.pdf'));
  assert.equal(exported.length,2,type);
  for(const file of exported){
   const bytes=await readFile(path.join(folder,file));
   assert.equal(bytes.subarray(0,4).toString(),'%PDF',file);
   assert.ok(bytes.length>2000,file);
  }
  for(const width of [390,1280]){
   await page('Emulation.setDeviceMetricsOverride',{width,height:width===390?844:1000,deviceScaleFactor:1,mobile:width===390});
   for(const language of ['en','bg']){
    if(await evaluate('document.documentElement.lang')!==language)await click('#language-toggle');
    const layout=await evaluate(`(()=>{const report=document.querySelector(${JSON.stringify(selector)});return {client:report.clientWidth,scroll:report.scrollWidth,art:!!report.querySelector('.kq-folio-art svg'),body:report.innerText};})()`);
    assert.ok(layout.scroll<=layout.client+2,type+' at '+width+' '+language);
    assert.ok(layout.art,type+' artwork');
    assert.match(layout.body,language==='bg'?/не поставя диагноза/:/This report is not a diagnosis/);
    if(language==='en'){
     const shot=await page('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
     await writeFile(path.join(folder,`report-${width}.png`),Buffer.from(shot.data,'base64'));
    }
   }
  }
  await click('#language-toggle');
  families[edition]=exported;
 }

 // A fictional cardiovascular assessment, entered through the normal forms.
 await openAssessments();
 await click('[data-action="start-heart"]');
 await click('#consent');await click('[data-action="consent-next"]');
 const heartInputs={age:'50',country:'Germany',sex:'Male',smoking:'Some days',smokingDays30:'8',cigarettes:'3',smokingYears:'12',
  conditions:'No',treatment:'No',systolic:'140',diastolic:'85',total:'5.5',hdl:'1.3',apob:'0.95',lpa:'<12'};
 for(let i=0;i<24&&!await evaluate("!!document.querySelector('[data-report-family=heart-vascular]')");i++){
  await until("!!document.querySelector('#heart-form')",'heart intake');
  for(const [key,value] of Object.entries(heartInputs)){
   const input='#heart-'+key;
   const option=`#heart-form input[name="${key}"][value="${value}"]`;
   if(await evaluate(`!!document.querySelector(${JSON.stringify(input)})`))await fill(input,value);
   else if(await evaluate(`!!document.querySelector(${JSON.stringify(option)})`))await click(option);
  }
  if(await evaluate("!!document.querySelector('[name=lpaUnit]')"))await fill('[name=lpaUnit]','mg/dL');
  await click('#heart-form [type=submit]');
 }
 await familyExports('heart-vascular');

 // Keep the cardiovascular inputs unchanged and contrast a new lipid pattern.
 await click('[data-action="report-tab"][data-tab="measurements"]');
 await click('[data-action="heart-edit"][data-part="specialist"]');
 await fill('#heart-apob','0.8');
 await fill('[name=apobreferenceHigh]','1.2');
 await fill('[name=lpaUnit]','nmol/L');
 await fill('#heart-lpa','150');
 await click('#heart-form [type=submit]');
 await click('[data-action="report-tab"][data-tab="summary"]');
 await familyExports('heart-vascular','heart-inherited-risk');

 for(const type of ['metabolic','kidney','fitness']){
  await openAssessments();
  await click(`[data-action="start-system"][data-type="${type}"]`);
  if(await evaluate("!!document.querySelector('#consent')")){
   await click('#consent');await click('[data-action="consent-next"]');
  }
  const entries=systemSampleInputs(type);
  for(let i=0;i<24&&!await evaluate(`!!document.querySelector('[data-report-family="${type}"]')`);i++){
   await until("!!document.querySelector('#system-form')",type+' intake');
   for(const [id,entry] of Object.entries(entries)){
    const selector='#system-'+id,value=typeof entry==='object'?entry.value:entry;
    const option=`#system-form input[name="${id}"][value="${value}"]`;
    if(await evaluate(`!!document.querySelector(${JSON.stringify(selector)})`))await fill(selector,value);
    else if(await evaluate(`!!document.querySelector(${JSON.stringify(option)})`))await click(option);
   }
   await click('#system-form [type=submit]');
  }
  if(type==='metabolic'){
   await click('[data-action="system-extra"][data-part="metabolic-labs"]');
   await fill('#system-hba1c','6.0');await fill('#system-glucose','6.1');
   await click('#system-form [type=submit]');
  }
  if(type==='kidney'){
   await click('[data-action="system-extra"][data-part="kidney-urine"]');
   await fill('#system-acr','12');
   await click('#system-form [type=submit]');
   await click('[data-action="system-extra"][data-part="kidney-cystatin"]');
   await fill('#system-cystatin','0.9');
   await click('#system-form [type=submit]');
  }
  await familyExports(type);
 }

 // A fictional lifestyle profile with unrestorative sleep, entered without labs.
 await openAssessments();
 await click('.assessment-routes [data-action="start"]');
 if(await evaluate("!!document.querySelector('#consent')")){
  await click('#consent');await click('[data-action="consent-next"]');
 }
 const profile={...sampleAnswers,moderate:'70',sleep:'6',rested:'Sometimes',alcohol:'No, I have never drunk alcohol regularly'};
 for(let i=0;i<40&&!await evaluate("!!document.querySelector('.review-screen')");i++){
  await until("!!document.querySelector('#questions')",'profile intake');
  const field=await evaluate(`(()=>{const input=document.querySelector('#questions [data-answer]');return input?{id:input.dataset.answer,type:input.type}:null;})()`);
  const value=field?profile[field.id]:undefined;
  if(value===undefined){
   await click('#questions [data-action="skip"]');
   continue;
  }
  if(['checkbox','radio'].includes(field.type)){
   for(const option of Array.isArray(value)?value:[value]){
    await click(`#questions input[data-answer="${field.id}"][value="${option}"]`);
   }
  }else await fill(`#questions input[data-answer="${field.id}"]`,value);
  await click('#questions [type=submit]');
 }
 await click('.review-screen [data-action="results"]');
 await click('#main [data-action="report"]');
 await familyExports('health-profile');

 assert.deepEqual(exceptions,[],'The browser must have no uncaught application errors.');
 const summary={browser:(await send('Browser.getVersion')).product,checks,pdfs:files,comparisonCase:secondFiles,families,uncaughtExceptions:exceptions};
 await writeFile(path.join(out,'checks.json'),JSON.stringify(summary,null,2));
 console.log('Real-browser report review passed: English/Bulgarian layouts and 18 downloads across six assessments, including contrasting lipid cases.');
}catch(error){
 console.error(error);throw error;
}finally{
 if(socket?.readyState===1)await send('Browser.close').catch(()=>{});
 for(const p of pending.values()){clearTimeout(p.timer);p.reject(Error('Browser review closed.'));}
 socket?.close();chrome.kill();server.close();
 await pause(1000);
 if(!path.resolve(profile).startsWith(path.resolve(tmpdir())+path.sep+'kq-report-chrome-'))throw Error('Unexpected browser review directory.');
 await rm(profile,{recursive:true,force:true,maxRetries:10,retryDelay:150}).catch(error=>console.warn('Temporary browser profile cleanup: '+error.code));
}
