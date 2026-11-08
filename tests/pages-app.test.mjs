import assert from 'node:assert/strict';
import {test,after} from 'node:test';
import {JSDOM} from 'jsdom';
import {shell} from '../public/app-shell.mjs';
import {sampleLabs} from '../public/model.mjs';

const dom=new JSDOM('<!doctype html><html lang="en" data-hosting="pages" data-theme="black-metal"><body>'+shell+'</body></html>',{url:'https://example.test/geneticage/?payment_order=not-a-real-order',pretendToBeVisual:true});
const {window}=dom;
window.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}});
for(const key of ['window','document','NodeFilter','MutationObserver','CustomEvent','localStorage','location','history'])Object.defineProperty(globalThis,key,{configurable:true,value:key==='window'?window:window[key]});
for(const key of ['requestAnimationFrame','cancelAnimationFrame','getComputedStyle'])globalThis[key]=window[key].bind(window);
let requests=0;globalThis.fetch=async()=>{requests++;throw Error('A static preview must not call the backend.');};
const $=selector=>document.querySelector(selector);
const flush=()=>new Promise(resolve=>setImmediate(resolve));
async function click(selector){assert.ok($(selector),selector);$(selector).click();await flush();}
async function enter(selector,value,event='input'){const input=$(selector);assert.ok(input,selector);input.value=value;input.dispatchEvent(new window.Event(event,{bubbles:true}));await flush();}
async function submit(selector){$(selector).dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));await flush();}

after(()=>window.close());

test('Pages runs the actual app without a backend, fake account or stored health answers',async()=>{
 await import('../public/app.mjs');await flush();
 assert.match($('#main').textContent,/Start here/);
 assert.equal($('#main [data-count-to]'),null);
 await click('.mobile-nav [data-route="history"]');
 assert.match($('#main').textContent,/Cloud history is available/);
 assert.equal($('#main [data-action="signup"]'),null);
 await click('#main [data-action="start"]');
 $('#consent').checked=true;await click('#main [data-action="consent-next"]');
 const age=$('[data-answer="age"]');assert.ok(age);age.value='52';age.dispatchEvent(new window.Event('input',{bubbles:true}));
 await click('#language-toggle');assert.equal(document.documentElement.lang,'bg');assert.equal(age.value,'52');assert.equal($('[data-answer="age"]'),age);
 await click('#language-toggle');
 await submit('#questions');
 await enter('[data-answer="country"]','Fictional test country');await submit('#questions');
 await enter('[data-answer="height"]','176');await submit('#questions');
 await enter('[data-answer="weight"]','77');await submit('#questions');
 await enter('[data-answer="weightYearAgo"]','77');await submit('#questions');
 const health=$('[data-answer="health"][value="Good"]'),form=$('#questions');health.focus();health.click();await flush();
 assert.equal($('#questions'),form);assert.equal(document.activeElement,health);assert.equal(health.checked,true);
 await submit('#questions');await click('[data-answer="smokingEver100"][value="No"]');await submit('#questions');
 await click('[data-answer="smoking"][value="Not at all"]');await submit('#questions');
 assert.match($('#main').textContent,/Answer separately from cigarettes/);assert.equal(document.querySelectorAll('[data-answer="nicotine"]').length,8);
 await click('[data-answer="nicotine"][value="Vape or e-cigarette"]');await click('[data-answer="nicotine"][value="None"]');
 assert.equal($('[data-answer="nicotine"][value="Vape or e-cigarette"]').checked,false);assert.equal($('[data-answer="nicotine"][value="None"]').checked,true);
 await click('.mobile-nav [data-route="history"]');await click('[data-action="start-labs"]');
 assert.ok($('#lab-age'),'Switching routes does not start a new consent flow.');assert.equal($('#lab-age').value,'52');
 await enter('#lab-date','2026-11-01');await click('[name="lab-fasting"][value="Yes"]');await click('#lab-context');
 await enter('#lab-reference-group','female','change');await submit('#labs-form');
 const measurement=$('[data-lab="albumin"]'),measurementForm=$('#labs-form');
 assert.equal(measurement.getAttribute('aria-describedby'),'albumin-lab-feedback');
 assert.equal($('#albumin-lab-feedback').textContent,'','An untouched field has no verdict.');
 await enter('[data-lab-reference="albumin"][data-reference-key="referenceLow"]','35');await enter('[data-lab-reference="albumin"][data-reference-key="referenceHigh"]','50');
 for(const [value,status]of [['34','below'],['42','within'],['56','above']]){
  measurement.focus();await enter('[data-lab="albumin"]',value);
  assert.equal(measurement.closest('fieldset').dataset.referenceStatus,'editing');assert.equal($('#albumin-lab-feedback').textContent,'','No stale verdict while editing.');
  $('[data-lab-unit="albumin"]').focus();await flush();
  assert.equal(measurement.closest('fieldset').dataset.referenceStatus,status);assert.equal(measurement.getAttribute('aria-invalid'),'false');
  assert.equal($('#labs-form'),measurementForm);assert.equal($('[data-lab="albumin"]'),measurement);
 }
 measurement.focus();await enter('[data-lab="albumin"]','-4');$('[data-lab-unit="albumin"]').focus();await flush();
 assert.equal(measurement.closest('fieldset').dataset.entryCheck,'invalid');assert.equal(measurement.closest('fieldset').dataset.referenceStatus,'unknown');assert.ok($('#albumin-lab-feedback .lab-check-symbol'));assert.equal(measurement.getAttribute('aria-invalid'),'true');
 const glucose=$('[data-lab="glucose"]');glucose.focus();await enter('[data-lab="glucose"]','2');$('[data-lab-unit="glucose"]').focus();await flush();
 assert.equal(glucose.closest('fieldset').dataset.referenceStatus,'below');assert.ok($('#glucose-lab-feedback .lab-critical-note'));
 await click('#language-toggle');assert.match($('#glucose-lab-feedback').textContent,/критична/);assert.equal(glucose.value,'2');assert.equal($('[data-lab="glucose"]'),glucose);await click('#language-toggle');
 const fictional=sampleLabs();
 for(let step=1;step<=3;step++){
  for(const input of document.querySelectorAll('input[data-lab]'))await enter(`[data-lab="${input.dataset.lab}"]`,fictional[input.dataset.lab].value);
  if(step===1){await enter('[data-lab-reference="albumin"][data-reference-key="referenceLow"]','35');await enter('[data-lab-reference="albumin"][data-reference-key="referenceHigh"]','50');}
  if(step===2)await enter('#crp-assay','standard-crp','change');
  await submit('#labs-form');
 }
 $('#lab-valid').checked=true;$('#lab-context').checked=true;await submit('#labs-form');
 assert.ok($('.result-instrument'));await click('[data-action="report"]');
 assert.equal(document.querySelectorAll('.report-tabs button').length,4);assert.equal(document.querySelector('#report-chapter'),null);
 await click('[data-action="report-tab"][data-tab="details"]');
 assert.match($('[data-report-panel="details"]').textContent,/Fictional test country/);assert.match($('[data-report-panel="details"]').textContent,/52 years/);
 await click('[data-action="report-tab"][data-tab="blood"]');
 assert.equal(document.querySelectorAll('[data-reference-source="lab"]').length,1);assert.equal(document.querySelectorAll('[data-reference-source="published"]').length,8);
 let printed=0;const details=[...document.querySelectorAll('.report-paper details')],previous=details.map(el=>el.open);
 window.print=()=>{printed++;assert.ok(details.every(el=>el.open),'Print includes every disclosure in all four report sections.');};
 await click('[data-action="print"]');assert.equal(printed,1);window.dispatchEvent(new window.Event('afterprint'));assert.deepEqual(details.map(el=>el.open),previous);
 await click('#language-toggle');assert.match($('[data-report-panel="blood"]').textContent,/Публикуван/);await click('#language-toggle');
 // The existing sample entry is an isolated detour and can restore the real draft.
 await click('[data-action="labs"]');await click('[data-action="sample-labs"]');
 await click('.mobile-nav [data-route="reports"]');await click('[data-action="report"]');assert.match($('#main').textContent,/Illustrative sample data/);
 await click('[data-action="restore-draft"]');assert.equal($('#lab-age').value,'52');
 await click('.mobile-nav [data-route="settings"]');
 assert.match($('#main').textContent,/On this device/);assert.equal($('#main [data-action="signup"]'),null);
 await click('#main [data-action="privacy"]');
 assert.match($('.modal').textContent,/Reloading or closing the page clears them/);await click('.modal [data-action="close"]');
 await click('.mobile-nav [data-route="reports"]');assert.equal($('#main [data-action="signup"]'),null);await click('#main [data-action="report"]');
 assert.match($('#main').textContent,/Unsaved assessment/);assert.match($('#main').textContent,/Fictional test country/);assert.equal($('#main [data-action="save"]'),null);
 const cloud=document.createElement('button');cloud.dataset.action='checkout';document.body.append(cloud);cloud.click();await flush();
 assert.match($('.modal').textContent,/Cloud features in the hosted app/);
 assert.equal($('.modal a').origin,'https://kolequant-age-prototype.quartzpaddock.chatgpt.site');
 await click('.modal [data-action="close"]');
 await click('.mobile-nav [data-route="history"]');await click('[data-action="start-heart"]');
 $('#consent').checked=true;await click('[data-action="consent-next"]');
 assert.equal($('#heart-age'),null,'Only the current question is shown.');
 await submit('#heart-form');assert.equal(document.activeElement.id,'heart-country');
 await enter('#heart-country','Germany','change');
 await click('#language-toggle');assert.equal($('#heart-country').value,'Germany');assert.match($('#heart-country').selectedOptions[0].textContent,/Германия/);
 await click('#language-toggle');await submit('#heart-form');
 await enter('#heart-age','50');await click('[data-action="heart-back"]');assert.equal($('#heart-country').value,'Germany');
 await submit('#heart-form');assert.equal($('#heart-age').value,'50');await submit('#heart-form');
 for(const [name,value] of [['sex','Male'],['smoking','Some days']]){
  await click(`#heart-form [name="${name}"][value="${value}"]`);await submit('#heart-form');
 }
 await enter('#heart-smokingDays30','8');await enter('#heart-cigarettes','3');await enter('#heart-smokingYears','12');
 await submit('#heart-form');
 for(const [name,value] of [['conditions','No'],['treatment','No']]){
  await click(`#heart-form [name="${name}"][value="${value}"]`);await submit('#heart-form');
 }
 assert.match($('#heart-bp-hint').textContent,/150\/90/);
 await enter('#heart-systolic','140');await enter('#heart-diastolic','90');await enter('#heart-total','5.5');await enter('#heart-hdl','1.3');
 assert.equal($('.heart-specialist').open,false);await click('.heart-specialist summary');
 await enter('#heart-apob','0.95');await enter('#heart-lpa','<12');
 await submit('#heart-form');
 assert.match($('.heart-estimate').textContent,/7\.6%/);assert.match($('.heart-estimate').textContent,/Germany.*Moderate-risk region/s);
 assert.equal($('[data-report-panel="measurements"]').hidden,true);
 await click('[data-action="report-tab"][data-tab="measurements"]');assert.equal($('[data-report-panel="summary"]').hidden,true);
 assert.match($('[data-report-panel="measurements"]').textContent,/140\/90 mmHg/);
 assert.match($('[data-report-panel="measurements"]').textContent,/0\.95 g\/L/);assert.match($('[data-report-panel="measurements"]').textContent,/<12 nmol\/L/);assert.equal($('#main [data-action="save"]'),null);
 await click('[data-action="heart-edit"][data-part="specialist"]');assert.equal($('.heart-specialist').open,true);assert.equal(document.activeElement.id,'heart-apob');
 await submit('#heart-form');assert.equal($('[data-report-panel="measurements"]').hidden,false);
 await click('.mobile-nav [data-route="history"]');await click('[data-action="start-labs"]');assert.equal($('#lab-age').value,'52');
 await click('.mobile-nav [data-route="history"]');await click('[data-action="start-heart"]');assert.equal($('#heart-systolic').value,'140');
 for(let i=0;i<7;i++)await click('[data-action="heart-back"]');assert.equal($('#heart-country').value,'Germany');
 await enter('#heart-country','Bulgaria','change');for(let i=0;i<7;i++)await submit('#heart-form');
 await enter('#heart-apob','');await enter('#heart-lpa','');await submit('#heart-form');
 assert.match($('.heart-estimate').textContent,/14\.0%/);
 await click('[data-action="report-tab"][data-tab="measurements"]');assert.match($('[data-report-panel="measurements"]').textContent,/Add optional results/);
 await click('[data-action="report-tab"][data-tab="methods"]');
 assert.match($('[data-report-panel="methods"]').textContent,/Days you smoked in the past 30 days\s*8/);
 await click('[data-action="heart-edit"][data-part="answers"]');
 await submit('#heart-form');await enter('#heart-age','33');await submit('#heart-form');
 assert.match($('.heart-scope-note').textContent,/Your age\s*33\s*years.*start at age 40/s);
 assert.equal($('#heart-systolic').value,'140');
 await submit('#heart-form');
 assert.match($('.heart-estimate').textContent,/Estimate unavailable.*Your age\s*33\s*years/s);
 assert.match($('[data-report-panel="summary"]').textContent,/What you can do next/);
 await click('[data-report-panel="summary"] [data-tab="measurements"]');
 assert.match($('[data-report-panel="measurements"]').textContent,/140\/90 mmHg/);
 assert.equal(requests,0);
 assert.ok(Object.keys(localStorage).every(key=>['kq-theme-v2','kq-language-v1'].includes(key)));
});
