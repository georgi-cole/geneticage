import test from 'node:test';
import assert from 'node:assert/strict';
import {assessSystem,systemSteps,systemSampleInputs} from '../public/system-assessments.mjs';
import {composeReportDocument} from '../public/report-composer.mjs';
import {renderSystemReport,renderSystemForm} from '../public/system-assessment-ui.mjs';
import {fitnessContext} from '../public/fitness-assessment.mjs';
import {historyMeasurement} from '../public/assessment-history.mjs';
import {validateSnapshot} from '../lib/account-api.mjs';

const young=()=>({...systemSampleInputs('fitness'),reachStatus:'Completed as instructed',reach:{value:'10',unit:'cm'},situpsStatus:'Completed as instructed',situps:{value:'30',unit:'repetitions'}});
const older=()=>({...systemSampleInputs('functional'),physicalTests:'Include physical tests',fitnessContext:'None of these',waist:{value:'90',unit:'cm'},pulse:{value:'70',unit:'beats/min'},moderate:{value:'150',unit:'min / week'},vigorous:{value:'0',unit:'min / week'}});

test('one Fitness result selects a complete original battery and retains aerobic context',()=>{
 for(const raw of [young(),older()]){
  const system=assessSystem('fitness',raw);
  assert.deepEqual(system.errors,{});
  assert.equal(system.result.status,'ready');
  assert.equal(system.review.integrated.primary,'physical');
  assert.deepEqual(system.result,system.review.integrated.physical.result);
  assert.equal(system.review.integrated.aerobic.result.status,'ready');
  const legacy=assessSystem('functional',raw);
  assert.equal(system.result.age,legacy.result.age);
  assert.equal(system.review.integrated.physical.review.unroundedAge,legacy.review.unroundedAge);
  const steps=systemSteps('fitness',raw);
  const fields=steps.flatMap(s=>s.fields);
  assert.equal(new Set(fields).size,fields.length,'No repeated age, height or weight questions.');
  const doc=composeReportDocument({state:{assessmentType:'fitness',system}});
  assert.ok(doc.editorial.folio);
  assert.ok(doc.editorial.chapters.some(c=>c.id==='fitness-pattern'));
  assert.match(renderSystemReport({type:'fitness',system,sourceLinks:()=>''}),/How your results fit together/);
 }
});

test('skipping a task keeps the unchanged aerobic age, never scores the missing task',()=>{
 const raw=young();raw.jumpStatus='Not attempted';
 const partial=assessSystem('fitness',raw);
 const baseline=assessSystem('fitness',{...raw,physicalTests:'Continue without physical tests'});
 assert.equal(partial.review.integrated.primary,'aerobic');
 assert.deepEqual(partial.result,baseline.result);
 assert.equal(partial.inputs.jump,undefined);
 assert.equal(partial.review.integrated.physical.review.domains.find(d=>d.id==='jump').value,null);
 assert.equal(baseline.review.integrated.physical,null);
 assert.equal(baseline.inputs.pacer,undefined,'Declined tests cannot leak stale values into the report.');
 const context=JSON.stringify(fitnessContext(partial.inputs,partial.review.integrated));
 assert.match(context,/different demands|different training/);
 assert.match(context,/not failures or scores of zero/);
});

test('a physical battery can supply the age without a complete routine estimate',()=>{
 const raw=young();delete raw.pulse;
 const system=assessSystem('fitness',raw);
 assert.equal(system.result.status,'ready');
 assert.equal(system.review.integrated.primary,'physical');
 assert.equal(system.review.integrated.aerobic.result.status,'missing');
 assert.equal(historyMeasurement({assessmentType:'fitness',system},'2026-11-14'),null);
});

test('health, coverage and protocol gates still apply after the merge',()=>{
 const raw=young();raw.fitnessContext='Heart or lung condition';
 const system=assessSystem('fitness',raw);
 assert.equal(system.result.status,'review');
 assert.equal(system.inputs.jump,undefined);
 assert.equal(system.review.integrated.physical,null);
 const pain=assessSystem('fitness',{...young(),pain:'Yes'});
 assert.equal(pain.review.integrated.primary,'aerobic');
 assert.match(JSON.stringify(fitnessContext(pain.inputs,pain.review.integrated)),/Review pain/);
 const youngAge=assessSystem('fitness',{...young(),age:{value:'18',unit:'years'}});
 assert.equal(youngAge.inputs.pacer,undefined);
 assert.equal(youngAge.review.integrated.physical,null);
});

test('trends retain the aerobic model identity when the headline switches model',()=>{
 const raw=young(),system=assessSystem('fitness',raw);
 const baseline=assessSystem('fitness',{...raw,physicalTests:'Continue without physical tests'});
 assert.deepEqual(historyMeasurement({assessmentType:'fitness',system},'2026-11-14'),historyMeasurement({assessmentType:'fitness',system:baseline},'2026-11-14'));
});

test('relationship copy handles agreement and disagreement without averaging ages',()=>{
 const system=assessSystem('fitness',young());
 const integrated=structuredClone(system.review.integrated);
 integrated.physical.result={status:'ready',age:40};integrated.aerobic.result={status:'ready',age:41};
 assert.match(JSON.stringify(fitnessContext(system.inputs,integrated)),/same direction/);
 integrated.aerobic.result.age=25;
 assert.match(JSON.stringify(fitnessContext(system.inputs,integrated)),/different directions/);
 assert.match(JSON.stringify(fitnessContext(system.inputs,integrated)),/not averaged/);
});

test('server recomputes the integrated snapshot and the form keeps direct test skipping',()=>{
 const raw=young();
 const snapshot=validateSnapshot({assessmentType:'fitness',system:{...raw,result:{status:'ready',age:1}}});
 assert.notEqual(snapshot.system.result.age,1);
 assert.equal(snapshot.system.review.integrated.primary,'physical');
 const step=systemSteps('fitness',raw).find(s=>s.id==='jump');
 const html=renderSystemForm({type:'fitness',inputs:raw,step,errors:{},touched:{}});
 assert.match(html,/data-action="system-skip-test"/);
 assert.doesNotMatch(html,/Unable without assistance|type="radio"/);
});
