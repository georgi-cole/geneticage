import assert from 'node:assert/strict';
import {test,after} from 'node:test';
import {JSDOM} from 'jsdom';
import {shell} from '../public/app-shell.mjs';

const dom=new JSDOM('<!doctype html><html lang="en" data-hosting="pages" data-theme="black-metal"><body>'+shell+'</body></html>',{url:'https://example.test/geneticage/?payment_order=not-a-real-order',pretendToBeVisual:true});
const {window}=dom;
window.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}});
for(const key of ['window','document','NodeFilter','MutationObserver','CustomEvent','localStorage','location','history'])Object.defineProperty(globalThis,key,{configurable:true,value:key==='window'?window:window[key]});
for(const key of ['requestAnimationFrame','cancelAnimationFrame','getComputedStyle'])globalThis[key]=window[key].bind(window);
let requests=0;globalThis.fetch=async()=>{requests++;throw Error('A static preview must not call the backend.');};
const $=selector=>document.querySelector(selector);
const flush=()=>new Promise(resolve=>setImmediate(resolve));
async function click(selector){assert.ok($(selector),selector);$(selector).click();await flush();}
after(()=>window.close());

test('Pages runs the actual app without a backend, fake account or stored health answers',async()=>{
 await import('../public/app.mjs');await flush();
 assert.match($('#main').textContent,/Your first assessment/);
 assert.equal($('#main [data-count-to]'),null);
 await click('.mobile-nav [data-route="history"]');
 assert.match($('#main').textContent,/Cloud history is available/);
 assert.equal($('#main [data-action="signup"]'),null);
 await click('#main [data-action="start"]');
 $('#consent').checked=true;await click('#main [data-action="consent-next"]');
 const age=$('[data-answer="age"]');assert.ok(age);age.value='52';age.dispatchEvent(new window.Event('input',{bubbles:true}));
 await click('#language-toggle');assert.equal(document.documentElement.lang,'bg');assert.equal(age.value,'52');assert.equal($('[data-answer="age"]'),age);
 await click('#language-toggle');
 await click('.mobile-nav [data-route="settings"]');
 assert.match($('#main').textContent,/On this device/);assert.equal($('#main [data-action="signup"]'),null);
 await click('#main [data-action="privacy"]');
 assert.match($('.modal').textContent,/Reloading or closing the page clears them/);await click('.modal [data-action="close"]');
 await click('.mobile-nav [data-route="reports"]');assert.equal($('#main [data-action="signup"]'),null);await click('#main [data-action="sample-report"]');
 assert.match($('#main').textContent,/Preview report/);assert.match($('#main').textContent,/No purchase is created/);
 const cloud=document.createElement('button');cloud.dataset.action='checkout';document.body.append(cloud);cloud.click();await flush();
 assert.match($('.modal').textContent,/Cloud features in the hosted app/);
 assert.equal($('.modal a').origin,'https://kolequant-age-prototype.quartzpaddock.chatgpt.site');
 assert.equal(requests,0);
 assert.ok(Object.keys(localStorage).every(key=>['kq-theme-v2','kq-language-v1'].includes(key)));
});
