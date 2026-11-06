import assert from 'node:assert/strict';
import {test} from 'node:test';
import vm from 'node:vm';
import {JSDOM} from 'jsdom';
import {CODONS,complement,initializeLaunch,launchBootstrap,launchFrame,launchMarkup,LAUNCH_DURATION} from '../public/launch-screen.mjs';

function fixture({pending=true,reduced=false,hidden=false,language='en'}={}){
 const dom=new JSDOM(`<html lang="${language}" ${pending?'data-launch="pending"':''}><body>${launchMarkup}<a class="skip" href="#main">Skip to content</a><div class="app-frame"><main id="main" tabindex="-1"><input id="answer" value="52"></main></div></body></html>`,{pretendToBeVisual:true});
 const {window}=dom;let nextId=0;const frames=new Map(),timers=new Map(),preferences=[];
 window.requestAnimationFrame=callback=>{const id=++nextId;frames.set(id,callback);return id;};window.cancelAnimationFrame=id=>frames.delete(id);
 window.setTimeout=callback=>{const id=++nextId;timers.set(id,callback);return id;};window.clearTimeout=id=>timers.delete(id);
 const media={matches:reduced,addEventListener:(_type,callback)=>preferences.push(callback)};
 window.matchMedia=()=>media;
 let starts=0,settled=0;window.addEventListener('kq:launch-start',()=>starts++);window.addEventListener('kq:launch-settled',()=>settled++);
 const document=window.document;Object.defineProperty(document,'hidden',{value:hidden,configurable:true});
 const controller=initializeLaunch({root:document,host:window});
 const advance=time=>{const callbacks=[...frames.values()];frames.clear();callbacks.forEach(callback=>callback(time));};
 return {dom,window,document,controller,frames,timers,advance,preferences,media,get starts(){return starts;},get settled(){return settled;}};
}

test('every opening requests the brand intro and triplets have complementary DNA bases',()=>{
 const document={documentElement:{dataset:{}}};vm.runInNewContext(launchBootstrap,{document});
 assert.equal(document.documentElement.dataset.launch,'pending');
 assert.equal(complement('ATG CAG GGC'),'TAC GTC CCG');assert.ok(CODONS.every(codon=>/^[ATGC]{3}$/.test(codon)));
 const first=launchFrame(0),last=launchFrame(LAUNCH_DURATION);
 assert.equal(first.markOpacity,1);assert.equal(first.ringOpacity,0);assert.equal(last.markOpacity,0);assert.equal(last.exit,1);
 assert.equal(last.codons.length,12);assert.ok(last.codons.every(codon=>Math.abs(Math.hypot(codon.x,codon.y)-104)<.01));
});

test('launch has no skip/replay, then releases the existing workspace and answers',()=>{
 const f=fixture();
 try{
  const {document,advance}=f,workspace=document.querySelector('.app-frame'),input=document.querySelector('#answer'),intro=document.querySelector('#launch-screen');
  assert.equal(workspace.inert,true);assert.equal(f.starts,1);assert.equal(intro.hidden,false);
  assert.equal(document.querySelector('a.skip').inert,true);assert.equal(intro.querySelector('button,a'),null);
  intro.dispatchEvent(new f.window.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));assert.equal(intro.hidden,false);
  advance(0);advance(1000);assert.equal(intro.dataset.launchPhase,'code');
  advance(LAUNCH_DURATION);assert.equal(intro.hidden,true);assert.equal(workspace.inert,false);assert.equal(f.settled,1);assert.equal(f.frames.size,0);assert.equal(f.timers.size,0);
  assert.equal(input.value,'52');assert.equal(input,document.querySelector('#answer'));assert.equal(document.documentElement.dataset.launch,undefined);
  assert.equal(document.querySelector('a.skip').inert,false);assert.equal(f.controller.play,undefined);
 }finally{f.dom.window.close();}
});

test('static reduced-motion branding, backgrounding, printing and stalled frames release safely',()=>{
 for(const method of ['hidden','timer','motion','print']){
  const f=fixture({language:'bg'});
  try{
   assert.equal(f.document.querySelector('[data-launch-caption]').textContent,'Биология във времето.');
   if(method==='hidden'){Object.defineProperty(f.document,'hidden',{value:true,configurable:true});f.document.dispatchEvent(new f.window.Event('visibilitychange'));}
   if(method==='timer')[...f.timers.values()][0]();
   if(method==='motion'){
    f.media.matches=true;f.preferences.forEach(callback=>callback({matches:true}));
    assert.equal(f.frames.size,0);assert.equal(f.document.querySelector('#launch-screen').hidden,false);[...f.timers.values()][0]();
   }
   if(method==='print'){f.window.dispatchEvent(new f.window.Event('beforeprint'));assert.equal(f.settled,0,'printing must not restart a settled result counter');}
   assert.equal(f.document.querySelector('#launch-screen').hidden,true);assert.equal(f.document.querySelector('.app-frame').inert,false);assert.equal(f.frames.size,0);
  }finally{f.dom.window.close();}
 }
 const f=fixture({reduced:true});
 try{
  assert.equal(f.document.querySelector('#launch-screen').hidden,false);assert.equal(f.starts,1);assert.equal(f.frames.size,0);
  assert.equal(f.document.querySelector('[data-launch-mark]').getAttribute('opacity'),'1');[...f.timers.values()][0]();assert.equal(f.document.querySelector('#launch-screen').hidden,true);
 }finally{f.dom.window.close();}
 const background=fixture({hidden:true});
 try{
  assert.equal(background.starts,0);Object.defineProperty(background.document,'hidden',{value:false,configurable:true});background.document.dispatchEvent(new background.window.Event('visibilitychange'));assert.equal(background.starts,1);background.controller.finish();
 }finally{background.dom.window.close();}
});
