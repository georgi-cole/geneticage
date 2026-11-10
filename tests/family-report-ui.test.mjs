import assert from 'node:assert/strict';
import {test} from 'node:test';
import {JSDOM} from 'jsdom';
import {assessHeartVascular} from '../public/heart-vascular.mjs';
import {renderHeartReport} from '../public/heart-vascular-ui.mjs';
import {assessSystem,systemSampleInputs} from '../public/system-assessments.mjs';
import {composeReportDocument} from '../public/report-composer.mjs';
import {renderSystemReport} from '../public/system-assessment-ui.mjs';

const sourceLinks=()=>'';
const heart=()=>assessHeartVascular({age:50,country:'Germany',sex:'Male',smoking:'Yes',conditions:'No',treatment:'No',systolic:{value:'140',unit:'mmHg'},total:{value:'5.5',unit:'mmol/L'},hdl:{value:'1.3',unit:'mmol/L'}});
const cases=[
 {type:'heart-vascular',state:heart,render:(state,options)=>renderHeartReport({heart:state,sourceLinks,...options})},
 ...['metabolic','kidney','fitness'].map(type=>({type,state:()=>assessSystem(type,systemSampleInputs(type)),render:(state,options)=>renderSystemReport({type,system:state,sourceLinks,...options})})),
];

test('all independent report families compose from existing results and separate narrative from the record',()=>{
 for(const {type,state,render}of cases){
  const assessment=state(),before=structuredClone(assessment);
  assert.deepEqual(assessment.errors,{},type);
  const dom=new JSDOM(render(assessment,{pagesPreview:true})),document=dom.window.document;
  assert.deepEqual([...document.querySelectorAll('.report-tabs button')].map(button=>button.textContent),['Your report','Your data','Method & evidence'],type);
  assert.ok(document.querySelector('[data-report-panel="summary"] .personal-report-document'),type);
  assert.equal(document.querySelector('[data-report-panel="summary"]').dataset.exportScope,'report');
  for(const panel of ['measurements','methods']){
   assert.equal(document.querySelector(`[data-report-panel="${panel}"]`).dataset.exportScope,'technical');
   assert.equal(document.querySelector(`[data-report-panel="${panel}"] .personal-report-document`),null);
  }
  assert.ok(document.querySelector('[data-action="print"][data-export="report"]'));
  assert.ok(document.querySelector('[data-action="print"][data-export="technical"]'));
  assert.match(document.querySelector('[data-report-panel="measurements"]').textContent,/Recorded result/);
  assert.match(document.querySelector('.kq-brand-footer').textContent,/This report is not a diagnosis/);
  assert.deepEqual(assessment,before,'Composing and rendering must not alter the scientific result or original inputs.');
  dom.window.close();
 }
});

test('saved family narratives remain authoritative while earlier reports are not backfilled',()=>{
 const savedDocument={version:'personal-report-v1',sections:[{id:'saved-intro',kind:'intro',title:'Saved interpretation',paragraphs:['This exact explanation belongs to the saved edition.'],sources:[],factIds:[]}],facts:[]};
 for(const {type,state,render}of cases){
  const stored=new JSDOM(render(state(),{saved:true,savedReport:{document:savedDocument}}));
  assert.equal(stored.window.document.querySelectorAll('.report-narrative-section').length,1,type);
  assert.equal(stored.window.document.querySelector('.report-narrative-prose').textContent,'This exact explanation belongs to the saved edition.',type);
  stored.window.close();
  const legacy=new JSDOM(render(state(),{saved:true,savedReport:{}}));
  assert.equal(legacy.window.document.querySelector('.personal-report-document'),null,type);
  assert.match(legacy.window.document.querySelector('[data-report-panel="summary"]').textContent,/What this tells you/,type);
  legacy.window.close();
 }
});

test('withheld system and cardiovascular results preserve their review reason without a numerical age',()=>{
 const kidney=assessSystem('kidney',{...systemSampleInputs('kidney'),kidneyContext:'Acute illness or kidney injury'});
 const vascular=assessHeartVascular({...heart().inputs,systolic:{value:'180',unit:'mmHg'},diastolic:{value:'110',unit:'mmHg'}});
 for(const html of [renderSystemReport({type:'kidney',system:kidney,sourceLinks}),renderHeartReport({heart:vascular,sourceLinks})]){
  const dom=new JSDOM(html),document=dom.window.document;
  assert.equal(document.querySelector('[data-report-panel="summary"] .report-age-line'),null);
  assert.ok(document.querySelector('[data-report-panel="summary"] .personal-report-document'));
  assert.match(document.querySelector('[data-report-panel="measurements"] .report-record-summary').textContent,/Estimate withheld/);
  dom.window.close();
 }
});

test('the family folios change their lead and content when the available evidence changes',()=>{
 const compose=(type,family)=>composeReportDocument({state:{assessmentType:type,[type==='heart-vascular'?'heart':'system']:family}}).editorial;
 const text=e=>e.chapters.flatMap(chapter=>chapter.blocks.map(block=>block.text)).join(' ');
 const heartBase=compose('heart-vascular',heart());
 const heartQuiet=compose('heart-vascular',assessHeartVascular({...heart().inputs,smoking:'No',systolic:{value:'118',unit:'mmHg'}}));
 assert.notEqual(heartBase.folio.pages[0].title,heartQuiet.folio.pages[0].title);
 const metabolic=compose('metabolic',assessSystem('metabolic',{...systemSampleInputs('metabolic'),hba1c:{value:'5.4',unit:'%'}}));
 assert.match(text(metabolic),/an HbA1c that this estimate can use/);
 const kidney=compose('kidney',assessSystem('kidney',{...systemSampleInputs('kidney'),acr:{value:'8',unit:'mg/g'}}));
 assert.match(kidney.folio.pages[0].title,/urine albumin together/);
 const fitness=compose('fitness',assessSystem('fitness',{...systemSampleInputs('fitness'),testType:'Treadmill test',vo2peak:{value:'44',unit:'mL/kg/min'},rer:{value:'1.12',unit:'ratio'}}));
 assert.match(fitness.folio.pages[0].title,/test you took/);
 const profile=composeReportDocument({state:{answers:{age:'45',sleep:'6',rested:'Sometimes'}}}).editorial;
 assert.match(profile.folio.pages[0].title,/how you feel after sleep/);
});
