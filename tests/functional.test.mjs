import test from 'node:test';
import assert from 'node:assert/strict';
import {assessSystem,systemSampleInputs,systemSteps,systemPrefill} from '../public/system-assessments.mjs';
import {composeReportDocument} from '../public/report-composer.mjs';
import {renderSystemReport} from '../public/system-assessment-ui.mjs';
import {renderSystemForm,readSystemForm} from '../public/system-assessment-ui.mjs';
import {birthYearAge,currentProfileAge} from '../public/profile-age.mjs';
import {JSDOM} from 'jsdom';
const sample=()=>systemSampleInputs('functional');
test('published equation is reproduced and all five metrics contribute',()=>{
 const base=assessSystem('functional',sample());
 assert.deepEqual(base.errors,{});assert.equal(base.result.status,'ready');
 assert.ok(Math.abs(base.review.unroundedAge-(79.807-0.017*90-0.203*35-0.031*14-0.052*3+0.985*9-3.468))<1e-10);
 assert.equal(base.review.contributions.length,5);
 for(const [id,increment,coefficient]of [['march',10,-0.017],['grip',5,-0.203],['chair30',5,-0.031],['reach',5,-0.052],['tug',-1,0.985]]){
  const raw=sample();raw[id].value=String(Number(raw[id].value)+increment);
  const changed=assessSystem('functional',raw);
  assert.ok(Math.abs(changed.review.unroundedAge-base.review.unroundedAge-increment*coefficient)<1e-10,id);
 }
 const system=base;
 const doc=composeReportDocument({state:{assessmentType:'functional',system}});
 assert.doesNotMatch(JSON.stringify(doc.sections),/Published coefficient|Equation term|Recorded metric/);
 assert.ok(doc.citations.some(s=>s.id==='functional-yoon'));
 assert.match(renderSystemReport({type:'functional',system,sourceLinks:()=>''}),/Your data/);
});
test('all incomplete and adapted measurements withhold rather than dropping terms',()=>{
 for(const id of ['march','grip','chair30','reach','tug']){
  const raw=sample();raw[id+'Status']='Not attempted';
  const checked=assessSystem('functional',raw);
  assert.equal(checked.result.status,'review');assert.equal(checked.inputs[id],undefined);
 }
 for(const patch of [{pain:'Yes'},{protocol:'No'},{aids:'Usual walking aid'}])assert.equal(assessSystem('functional',{...sample(),...patch}).result.status,'review');
 const raw=sample();delete raw.grip;
 assert.equal(assessSystem('functional',raw).result.status,'review');
});
test('young adults are not extrapolated and safety routing removes hidden values',()=>{
 for(const age of [18,95])assert.equal(assessSystem('functional',{...sample(),age:{value:String(age),unit:'years'}}).result.issue,'functional-coverage');
 const raw={...sample(),readiness:'Symptoms, recent illness or exercise restrictions'};
 const checked=assessSystem('functional',raw);
 assert.equal(checked.result.status,'review');assert.equal(checked.inputs.grip,undefined);
 assert.equal(systemSteps('functional',raw).length,2);
});
test('negative reach is preserved, wrong units and fractional counts are rejected',()=>{
 const raw=sample();raw.reach.value='-4';assert.equal(assessSystem('functional',raw).inputs.reach.value,'-4');
 raw.grip.unit='oz';assert.ok(assessSystem('functional',raw).errors.grip);
 raw.chair30.value='3.5';assert.ok(assessSystem('functional',raw).errors.chair30);
});

const young=()=>({age:{value:'38',unit:'years'},sex:'Male',readiness:'No symptoms or exercise restrictions',setup:'Yes',vigorousReady:'Yes',daily:'No limitation',height:{value:'180',unit:'cm'},weight:{value:'81',unit:'kg'},pain:'No',protocol:'Yes',...Object.fromEntries(Object.entries({pacer:[30,'completed shuttles'],jump:[40,'cm'],reach:[10,'cm'],situps:[30,'repetitions']}).flatMap(([id,[v,unit]])=>[[id+'Status','Completed as instructed'],[id,{value:String(v),unit}]]))});
test('younger model uses all five published terms and keeps age/sex branches distinct',()=>{
 const raw=young(),base=assessSystem('functional',raw);
 assert.deepEqual(base.errors,{});assert.equal(base.result.status,'ready');
 assert.ok(Math.abs(base.review.unroundedAge-(45.054+0.324*25-0.089*30-0.142*40-0.153*10-0.228*30))<1e-10);
 assert.equal(base.review.contributions.length,5);
 for(const id of ['pacer','jump','reach','situps','weight','height']){
  const change=young();change[id].value=String(Number(change[id].value)+1);
  assert.notEqual(assessSystem('functional',change).review.unroundedAge,base.review.unroundedAge,id);
 }
 for(const sex of ['Male','Female'])for(const age of [20,39,40,64]){
  const checked=assessSystem('functional',{...young(),sex,age:{value:String(age),unit:'years'}});
  assert.equal(checked.result.status,'ready');assert.match(checked.result.version,age<40?/under40/:/40plus/);
 }
 assert.equal(assessSystem('functional',{...young(),vigorousReady:'No'}).result.issue,'functional-vigorous');
 const skipped=young();skipped.pacerStatus='Not attempted';assert.equal(assessSystem('functional',skipped).result.status,'review');
 const doc=composeReportDocument({state:{assessmentType:'functional',system:base}});
 assert.doesNotMatch(JSON.stringify(doc.sections),/Published coefficient|Equation term|Recorded metric/);
 assert.match(renderSystemReport({type:'functional',system:base,sourceLinks:()=>''}),/Oak 2012/);
});

test('imperial entries produce the same age and optional composition adds context only',()=>{
 const metric=young(),imperial=young();
 for(const [id,factor,unit]of [['height',2.54,'in'],['weight',0.45359237,'lb'],['jump',2.54,'in'],['reach',2.54,'in']])imperial[id]={value:String(Number(metric[id].value)/factor),unit};
 const a=assessSystem('functional',metric),b=assessSystem('functional',imperial);
 assert.deepEqual(b.errors,{});
 assert.ok(Math.abs(a.review.unroundedAge-b.review.unroundedAge)<1e-10);
 const composition=assessSystem('functional',{...metric,compositionMethod:'DXA scan',bodyFat:{value:'18.2',unit:'%'},skeletalMuscle:{value:'40.1',unit:'%'}});
 assert.equal(composition.review.unroundedAge,a.review.unroundedAge);
 const doc=composeReportDocument({state:{assessmentType:'functional',system:composition}});
 assert.match(JSON.stringify(doc.sections),/Your BMI is 25\./);
 assert.match(JSON.stringify(doc.sections),/18.2%/);
 assert.doesNotMatch(JSON.stringify(doc.sections),/Published coefficient|Equation term/);
 const html=renderSystemReport({type:'functional',system:composition,sourceLinks:()=>'',tab:'methods'});
 assert.match(html,/Calculation details/);
});

test('profile age and body measurements prefill, with birth-year suggestions for new years',()=>{
 const date=new Date(2030,5,1);
 assert.equal(birthYearAge('1990',date),'40');
 assert.equal(birthYearAge('bad',date),null);
 assert.equal(currentProfileAge({birthYear:'1990',age:'39',ageRecordedYear:'2030'},date),'39');
 assert.equal(currentProfileAge({birthYear:'1990',age:'38',ageRecordedYear:'2029'},date),'40');
 const fields=systemPrefill('functional',{age:'38',sex:'Male',height:'72',heightUnit:'in',weight:'180',weightUnit:'lb'});
 assert.equal(fields.age.value,'38');assert.equal(fields.height.unit,'in');assert.equal(fields.weight.unit,'lb');
 assert.equal(systemPrefill('kidney',{age:'38'}, {}, {labSubmitted:true,labAge:'32'}).age.value,'32');
});

test('a test has one result screen, with skipping inferred from a blank entry',()=>{
 const inputs=young(),step=systemSteps('functional',inputs).find(s=>s.id==='jump');
 assert.ok(step.testId);
 const html=renderSystemForm({type:'functional',inputs,step,errors:{},touched:{}});
 assert.doesNotMatch(html,/type="radio"|Unable without assistance/);
 assert.match(html,/data-action="system-skip-test"/);
 const {window}=new JSDOM(html);
 const form=window.document.querySelector('form');
 form.querySelector('[name="jump"]').value='';
 const skipped=readSystemForm('functional',form,inputs);
 assert.equal(skipped.jumpStatus,'Not attempted');
 assert.equal(assessSystem('functional',skipped).result.status,'review');
 form.querySelector('[name="jump"]').value='0';
 assert.equal(readSystemForm('functional',form,inputs).jumpStatus,'Completed as instructed');
 window.close();
});
