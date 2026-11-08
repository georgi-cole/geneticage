import assert from 'node:assert/strict';
import {test} from 'node:test';
import {JSDOM} from 'jsdom';
import {renderAssessmentReport} from '../public/report-ui.mjs';
import {freshAssessment} from '../public/assessment-flow.mjs';
import {sampleAnswers,sampleLabs,assessClinical} from '../public/model.mjs';
import {translateText} from '../public/language-system.mjs';

const state={...freshAssessment(),answers:structuredClone(sampleAnswers),lab:sampleLabs(),labAge:'45',labDate:'2026-11-01',labFasting:'Yes',labContext:true,labReferenceGroup:'male',labSubmitted:true,reportTab:'summary'};
state.lab.crp.assay='standard-crp';state.lab.albumin.referenceLow='35';state.lab.albumin.referenceHigh='50';
const clinical=assessClinical({age:45,lab:state.lab,contextConfirmed:true,fasting:'Yes'});
const render=(s=state,options={})=>new JSDOM(renderAssessmentReport({state:s,clinical,full:true,reviewing:true,pagesPreview:true,...options})).window.document;

test('report has four stable sections, a focal estimate, actual answers and distinct sourced comparisons',()=>{
 const doc=render();
 assert.deepEqual([...doc.querySelectorAll('.report-tabs button')].map(el=>el.textContent),['Summary','Findings','Blood results','Details']);
 assert.equal(doc.querySelector('#report-chapter'),null);assert.equal(doc.querySelectorAll('.report-panel:not([hidden])').length,1);
 assert.equal(doc.querySelector('.report-age-line strong').textContent,String(Math.round(clinical.value)));
 assert.equal(doc.querySelectorAll('.finding-card').length,5);
 const answers=[...doc.querySelectorAll('.answer-row')];
 assert.ok(answers.some(el=>el.querySelector('dt').textContent==='How old are you?'&&el.querySelector('dd').textContent==='45 years'));
 assert.ok(answers.some(el=>el.querySelector('dd').textContent==='Bulgaria'));
 assert.equal(doc.querySelectorAll('.blood-review-item').length,9);
 assert.equal(doc.querySelectorAll('[data-reference-source="lab"]').length,1);
 assert.equal(doc.querySelectorAll('[data-reference-source="published"]').length,8);
 assert.equal(doc.querySelector('.report-tools [data-action="save"]'),null,'A static preview cannot cloud-save.');
 assert.match(doc.querySelector('[data-report-panel="blood"]').textContent,/Your value in the reference unit:/);
 assert.match(doc.querySelector('[data-report-panel="blood"]').textContent,/111\.7 mg\/dL/);
 assert.ok(doc.querySelector('a[href$="#page=5"]'));
 assert.match(doc.querySelector('[data-report-panel="summary"]').textContent,/Lifestyle answers do not add or subtract years/);
});

test('a converted value near a guide boundary cannot round into an apparently contradictory flag',()=>{
 const boundary=structuredClone(state);boundary.lab.glucose.value=String(99.0001/18.0182);
 const doc=render(boundary),item=doc.querySelectorAll('.blood-review-item')[2];
 assert.equal(item.dataset.referenceStatus,'above');assert.equal(item.querySelector('.converted-value strong').textContent,'99.0001 mg/dL');
});

test('empty and earlier stored reports remain explicit instead of substituting new findings',()=>{
 const empty=render({...state,answers:{},lab:{},labSubmitted:false},{clinical:null});
 assert.equal(empty.querySelectorAll('.finding-card').length,0);assert.match(empty.querySelector('[data-report-panel="findings"]').textContent,/No questionnaire answers/);
 const saved=render({...state,savedReport:{priorities:[],version:'educational-report-v1'}});
 assert.equal(saved.querySelectorAll('.finding-card').length,0);assert.match(saved.body.textContent,/No findings were stored/);
 assert.match(saved.body.textContent,/stored result has not been recalculated/);
 const withheld=render(state,{clinical:{reason:'Fictional collection review reason'}});
 assert.equal(withheld.querySelector('.report-age-line'),null);assert.match(withheld.body.textContent,/Fictional collection review reason/);
});

test('free reports keep answers, safety checks, reference comparisons and basic printing available',()=>{
 const doc=render(state,{full:false,reviewing:false,pagesPreview:false});
 assert.equal(doc.querySelectorAll('.finding-card').length,1);
 assert.ok([...doc.querySelectorAll('.answer-row dt')].some(row=>row.textContent==='How old are you?'));
 assert.equal(doc.querySelectorAll('.blood-review-item').length,9);
 assert.ok(doc.querySelector('[data-action="print"]'));assert.ok(doc.querySelector('[data-action="save"]'));
 assert.equal(doc.querySelector('[data-action="checkout"]'),null);
});

test('the report translates its explanations and statuses without translating measurement units',()=>{
 const doc=render();
 const walker=doc.createTreeWalker(doc.body,4),sources=[];let node;
 while(node=walker.nextNode())if(!node.parentElement.closest('svg,[data-no-translate]'))sources.push(node.nodeValue.trim());
 for(const source of sources.filter(source=>/[A-Za-z]/.test(source))){
  const translated=translateText(source,'bg');
  assert.doesNotMatch(translated,/\b(?:Your|Published|Holding|reference|measurement|report|Outside|clinical|formula|guide|result|These|The|This|Collection|Illustrative|personal|assessment|Not)\b/,'Untranslated report copy: '+source);
 }
 assert.equal(translateText('mmol/L','bg'),'mmol/L');
});
