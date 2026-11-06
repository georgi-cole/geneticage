import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {labs,normalizeLab,sampleLabs,calculatePhenoAge,assessClinical} from '../public/model.mjs';
import {INPUT_COVERAGE,reviewLabSafety,isReportableAge,clinicalForDisplay,LAB_SAFETY_VERSION} from '../public/lab-safety.mjs';
import {feedbackState,labFeedbackMarkup} from '../public/lab-feedback.mjs';
import {REFERENCE_CATALOG_VERSION} from '../public/lab-reference-catalog.mjs';
import {validateSnapshot} from '../lib/account-api.mjs';
import {overviewPresentation,renderThemeHome} from '../public/theme-home.mjs';
import {renderAssessmentReport} from '../public/report-ui.mjs';
import {renderRecordLibrary} from '../public/ui-components.mjs';
import {translateText} from '../public/language-system.mjs';

const context={labAge:'45',labContext:true,labFasting:'Yes',labReferenceMode:'published',labReferenceGroup:'female',labReferenceVersion:REFERENCE_CATALOG_VERSION};
const assess=lab=>assessClinical({age:45,lab,contextConfirmed:true,fasting:'Yes'});

test('reference direction, input validity and critical alerts remain independent',()=>{
 const own={unit:'g/L',referenceLow:'35',referenceHigh:'50'};
 for(const [value,direction]of [['34','below'],['42','within'],['56','above']]){
  const result=feedbackState('albumin',{...own,value},context);
  assert.equal(result.direction,direction);assert.equal(result.check.status,'ok');assert.equal(result.check.warning,null);
 }
 const invalid=feedbackState('albumin',{...own,value:'-4'},context);
 assert.equal(invalid.direction,'unknown');assert.equal(invalid.check.status,'invalid');
 const outside=feedbackState('albumin',{...own,value:'400',referenceHigh:'500'},context);
 assert.equal(outside.direction,'within','An entered interval still describes reference direction.');
 assert.equal(outside.check.status,'review','A supplied interval cannot bypass the independent coverage check.');
 const critical=feedbackState('glucose',{value:'2',unit:'mmol/L'},context);
 assert.equal(critical.direction,'below');assert.ok(critical.check.warning);
 assert.match(labFeedbackMarkup('glucose',{value:'2',unit:'mmol/L'},context),/lab-critical-note/);
 const unassigned=feedbackState('creatinine',{value:'90',unit:'µmol/L'},{...context,labReferenceGroup:'unspecified'});
 assert.equal(unassigned.direction,'unknown');assert.equal(unassigned.check.warning,null);
});

test('source critical boundaries preserve units, inclusivity and the low/high distinction',()=>{
 for(const unit of ['mg/dL','mmol/L'])for(const [mg,flag]of [[49.99,true],[50,true],[50.01,false],[399.99,false],[400,true],[400.01,true]]){
  const value=unit==='mg/dL'?mg:mg/18.0182;
  assert.equal(!!reviewLabSafety('glucose',{value:String(value),unit}).warning,flag,`${mg} mg/dL in ${unit}`);
 }
 for(const unit of ['10⁹/L','10³/µL','cells/µL'])for(const [n,code]of [[1.99,'critical-wbc-low'],[2,null],[99.99,null],[100,'critical-wbc-high']]){
  const result=reviewLabSafety('wbc',{value:String(unit==='cells/µL'?n*1000:n),unit});
  assert.equal(result.warning?.code||null,code);if(code)assert.match(result.warning.url,/mayocliniclabs|crouse/);
 }
 assert.equal(reviewLabSafety('creatinine',{value:'6',unit:'mg/dL'}).warning,null,'Do not apply paediatric or baseline-dependent critical thresholds to all adults.');
});

test('all nine unit conversions and pinned cohort coverage are reproducible without normal-range claims',()=>{
 const sample=sampleLabs(),normalized=normalizeLab(sample),stats=JSON.parse(readFileSync(new URL('../design/research/lab-safety-cohort.json',import.meta.url)));
 assert.equal(stats.selected_rows,18127);assert.equal(stats.complete_case_filter,false);
 assert.deepEqual(stats.derived_coverage,INPUT_COVERAGE);
 for(const lab of labs){
  for(const unit of lab.units){const check=reviewLabSafety(lab.id,{value:String(normalized[lab.id]/lab.factor(unit)),unit});assert.equal(check.status,'ok');assert.equal(check.warning,null);}
  const [low,high]=INPUT_COVERAGE[lab.id],data=stats.statistics[lab.id];
  assert.ok(low<=data.minimum+1e-6&&high>=data.maximum-1e-6);
  assert.equal(reviewLabSafety(lab.id,{value:String((high+1)/lab.factor(lab.units[0])),unit:lab.units[0]}).status,'review');
 }
 assert.equal(reviewLabSafety('crp',{value:'.01',unit:'mg/L'}).status,'ok','The historical CRP detection floor is not a modern lower gate.');
 for(const entry of [{value:'NaN',unit:'mg/L'},{value:'0',unit:'mg/L'},{value:'2',unit:'unsupported'},{value:'<5',unit:'mg/L'}])assert.equal(reviewLabSafety('crp',entry).status,'invalid');
 assert.equal(reviewLabSafety('lymphocytes',{value:'101',unit:'%'}).status,'invalid');
 assert.equal(reviewLabSafety('rdw',{value:'42',unit:'fL'}).status,'invalid');
});

test('unsafe or unsupported inputs withhold an age on client and server without changing the formula',()=>{
 const normal=sampleLabs(),expected=calculatePhenoAge(45,normalizeLab(normal));
 assert.equal(assess(normal).value,expected);
 for(const [id,entry,reason]of [
  ['glucose',{value:'2',unit:'mmol/L',referenceLow:'0',referenceHigh:'100'},'critical-values'],
  ['wbc',{value:'100',unit:'10⁹/L'},'critical-values'],
  ['albumin',{value:'1000',unit:'g/L',referenceLow:'1',referenceHigh:'2000'},'input-coverage'],
  ['rdw',{value:'40',unit:'% (RDW-CV)'},'input-coverage']
 ]){
  const lab={...normal,[id]:entry},client=assess(lab);
  assert.equal(client.value,undefined);assert.equal(client.gap,undefined);assert.equal(client.withheld,reason);assert.equal(client.safetyVersion,LAB_SAFETY_VERSION);
  const stored=validateSnapshot({answers:{age:'45'},lab,labAge:'45',labDate:'2026-11-01',labSubmitted:true,labContext:true,labFasting:'Yes',value:25,clinical:{value:25},unlocked:true});
  assert.equal(stored.value,null);assert.equal(stored.clinical.withheld,reason);assert.equal(stored.unlocked,false);
  if(id==='glucose'){
   const preview=new JSDOM(renderAssessmentReport({state:{answers:{},lab,labAge:'45'},clinical:client,full:false}));
   assert.match(preview.window.document.querySelector('.clinical-check-summary').textContent,/Glucose.*Potentially critical result/);
   assert.ok(preview.window.document.querySelector('.clinical-check-summary a[href*="mayocliniclabs"]'),'Safety evidence cannot be hidden behind full-report access.');preview.window.close();
  }
 }
 const extremes=Object.fromEntries(labs.map(lab=>[lab.id,{value:String((['albumin','lymphocytes'].includes(lab.id)?INPUT_COVERAGE[lab.id][0]:INPUT_COVERAGE[lab.id][1])/lab.factor(lab.units[0])),unit:lab.units[0]}]));
 const raw=calculatePhenoAge(84,normalizeLab(extremes));assert.ok(raw>100);
 const guarded=assessClinical({age:84,lab:extremes,contextConfirmed:true,fasting:'Yes'});
 assert.equal(guarded.value,undefined);assert.equal(guarded.withheld,'reporting-range');
 assert.equal(assessClinical({age:18,lab:{glucose:{value:'2',unit:'mmol/L'}},contextConfirmed:false}).withheld,'critical-values','A collection or completeness gate cannot hide an already detected critical value.');
});

test('rounded ages never cross the display limit or reappear in counters, reports or history',()=>{
 for(const [value,allowed]of [[0.49,false],[0.5,true],[1,true],[17,true],[18,true],[99.49,true],[99.5,false],[100,false],[200,false],[NaN,false],[Infinity,false],[null,false]])assert.equal(isReportableAge(value),allowed);
 const saved=Object.freeze({value:200,gap:155}),record={clinical:saved,labAge:'45',overviewSaved:true};
 assert.equal(clinicalForDisplay(saved,{stored:true}).earlierValueHidden,true);assert.equal(saved.value,200);
 assert.equal(overviewPresentation(record).value,null);
 const home=renderThemeHome(overviewPresentation(record));assert.ok(!home.includes('data-count-to'));assert.match(home,/unmeasured-mark/);
 const state={answers:{age:'45'},lab:sampleLabs(),labAge:'45',savedReport:{clinical:saved,priorities:[]}};
 const dom=new JSDOM(renderAssessmentReport({state,clinical:saved,full:true}));
 assert.equal(dom.window.document.querySelector('.report-age-line'),null);assert.match(dom.window.document.body.textContent,/original record has not been changed/);dom.window.close();
 assert.match(renderRecordLibrary({history:[{id:'old',value:200,labSubmitted:true,saved:'2026-11-01'}]}),/Needs review/);
 assert.ok(!renderRecordLibrary({history:[{id:'old',value:200,labSubmitted:true,saved:'2026-11-01'}]}).includes('200<small>'));
});

test('new safety messages and source captions have complete natural Bulgarian copy',()=>{
 for(const id of ['albumin','glucose','wbc']){
  const html=labFeedbackMarkup(id,{value:id==='albumin'?'1000':id==='glucose'?'2':'100',unit:id==='albumin'?'g/L':id==='glucose'?'mmol/L':'10⁹/L'},context),dom=new JSDOM(html);
  for(const node of dom.window.document.querySelectorAll('strong,p>span,a'))if(!node.closest('[aria-hidden=true]'))assert.notEqual(translateText(node.textContent,'bg'),node.textContent,`Untranslated safety copy: ${node.textContent}`);
  dom.window.close();
 }
});
