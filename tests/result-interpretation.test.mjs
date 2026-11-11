import assert from 'node:assert/strict';
import {test} from 'node:test';
import {assessHeartVascular} from '../public/heart-vascular.mjs';
import {assessSystem,systemSampleInputs} from '../public/system-assessments.mjs';
import {composeReportDocument} from '../public/report-composer.mjs';
import {boundedCategory,measurementBounds} from '../public/report-result-interpretation.mjs';
import {isFamilyFolio} from '../public/report-folio.mjs';
import {RESULT_COPY} from '../public/report-knowledge/result-copy.mjs';
import {REPORT_BG} from '../public/report-knowledge/bg.mjs';
import {sampleAnswers} from '../public/model.mjs';

const base={age:50,country:'Germany',sex:'Male',smoking:'No',conditions:'No',treatment:'No',systolic:{value:'128',unit:'mmHg'},diastolic:{value:'78',unit:'mmHg'},total:{value:'5.5',unit:'mmol/L'},hdl:{value:'1.3',unit:'mmol/L'}};
const compose=(type,assessment)=>composeReportDocument({state:{assessmentType:type,[type==='heart-vascular'?'heart':'system']:assessment}}).editorial;
const chapter=(e,id)=>e.chapters.find(ch=>ch.id==='case-'+id)?.blocks.map(b=>b.text).join(' ')||'';
const heart=(more={})=>compose('heart-vascular',assessHeartVascular({...base,...more}));

test('ApoB distinguishes an entered lab interval from a risk-dependent treatment threshold',()=>{
 const e=heart({apob:{value:'0.95',unit:'g/L',referenceHigh:'1.2'}});
 const text=chapter(e,'apob');
 assert.match(text,/0\.95 g\/L/);assert.match(text,/meets the recorded comparison of ≤1\.2 g\/L/);
 assert.match(text,/95 mg\/dL/);assert.match(text,/at or above 90 mg\/dL/);
 assert.match(text,/considering treatment intensification/);assert.match(text,/personal target requires/);
 assert.doesNotMatch(text,/your target is|your optimal|you are high risk/i);
 assert.match(text,/2–3 months/);assert.match(text,/8–12-week review.*discussion point/);
});

test('the story changes when low ApoB is accompanied by high Lp(a)',()=>{
 const low=heart({apob:{value:'80',unit:'mg/dL',referenceHigh:'120'},lpa:{value:'150',unit:'nmol/L'}});
 const text=chapter(low,'lpa');
 assert.match(text,/high category, at least 125 nmol\/L/);
 assert.match(text,/Your ApoB is below 90 mg\/dL, while Lp\(a\) is in the higher category/);
 assert.match(text,/whether a lower ApoB or LDL threshold is appropriate/);
 assert.doesNotMatch(text,/low Lp\(a\) category/);
 const high=heart({apob:{value:'0.95',unit:'g/L'},lpa:{value:'<12',unit:'mg/dL'}});
 assert.match(chapter(high,'lpa'),/<12 mg\/dL/);
 assert.match(chapter(high,'lpa'),/ApoB and wider lipid discussion a more useful optimisation focus/);
 assert.match(chapter(high,'lpa'),/repeat.*usually|usually.*repeat/i);
});

test('Lp(a) units and qualifier bounds control category without converting mass to particle units',()=>{
 for(const [value,unit,category] of [['29','mg/dL','low'],['30','mg/dL','middle'],['49.9','mg/dL','middle'],['50','mg/dL','high'],['74','nmol/L','low'],['75','nmol/L','middle'],['125','nmol/L','high'],['<30','mg/dL','low'],['≤30','mg/dL','unknown'],['<50','mg/dL','unknown'],['>125','nmol/L','high']]){
  const thresholds=unit==='mg/dL'?[30,50]:[75,125];
  assert.equal(boundedCategory(measurementBounds({value}),...thresholds),category,value+' '+unit);
 }
 const mass=chapter(heart({lpa:{value:'60',unit:'mg/dL'}}),'lpa');
 const particles=chapter(heart({lpa:{value:'60',unit:'nmol/L'}}),'lpa');
 assert.match(mass,/high category/);assert.match(particles,/low Lp\(a\) category/);
 const unknown=chapter(heart({lpa:{value:'<125',unit:'nmol/L'}}),'lpa');
 assert.match(unknown,/cannot support one Lp\(a\) category/);
});

test('pressure distinguishes the prevention category and the measurement setting',()=>{
 const elevated=chapter(heart(),'pressure');assert.match(elevated,/elevated office-pressure category/);
 assert.match(elevated,/not recorded the measurement setting/);
 assert.match(chapter(heart({systolic:{value:'140',unit:'mmHg'}}),'pressure'),/reaches the office-pressure follow-up threshold/);
 assert.match(chapter(heart({systolic:{value:'115',unit:'mmHg'},diastolic:{value:'65',unit:'mmHg'}}),'pressure'),/baseline to maintain/);
});

test('glucose interprets original units and separates prevention review from diagnostic confirmation',()=>{
 const run=entry=>compose('metabolic',assessSystem('metabolic',{...systemSampleInputs('metabolic'),hba1c:entry}));
 assert.match(chapter(run({value:'5.4',unit:'%'}),'glucose'),/below the ADA screening threshold/);
 const raised=chapter(run({value:'42',unit:'mmol/mol'}),'glucose');
 assert.match(raised,/screening range associated with prediabetes/);assert.match(raised,/3–6 months/);
 const diagnostic=chapter(run({value:'6.5',unit:'%'}),'glucose');
 assert.match(diagnostic,/diagnostic-range|diagnostic threshold/);assert.doesNotMatch(diagnostic,/3–6 months|8–12/);
});

test('urine units and limit signs retain kidney category uncertainty',()=>{
 const run=acr=>chapter(compose('kidney',assessSystem('kidney',{...systemSampleInputs('kidney'),acr})),'urine');
 assert.match(run({value:'2.5',unit:'mg/mmol'}),/lower albuminuria category/);
 assert.match(run({value:'30',unit:'mg/g'}),/moderately increased/);
 assert.match(run({value:'300',unit:'mg/g'}),/moderately increased/);
 assert.match(run({value:'>300',unit:'mg/g'}),/severely increased/);
 assert.match(run({value:'<300',unit:'mg/g'}),/spans more than one/);
});

test('new low filtration explains prompt assessment without an automatic three-month wait',()=>{
 const e=compose('kidney',assessSystem('kidney',{...systemSampleInputs('kidney'),creatinine:{value:'160',unit:'µmol/L'}}));
 assert.match(chapter(e,'kidney'),/below 60/);assert.match(chapter(e,'kidney'),/not an instruction to wait three months/);
 assert.ok(!e.folio.pages.some(page=>page.id==='learn-habit-plan'));
});

test('an unstable kidney context cannot acquire a reassuring filtration interpretation or optimisation plan',()=>{
 const e=compose('kidney',assessSystem('kidney',{...systemSampleInputs('kidney'),kidneyContext:'Acute illness or kidney injury'}));
 const text=chapter(e,'kidney');
 assert.match(text,/can be unreliable when kidney function is changing/);
 assert.doesNotMatch(text,/This is reassuring about estimated filtration|Focus on protecting function/);
});

test('derived non-HDL preserves original units, provenance and the saved result',()=>{
 const assessment=assessHeartVascular({...base,total:{value:'212.685',unit:'mg/dL'},hdl:{value:'1.3',unit:'mmol/L'}});
 const before=structuredClone(assessment);const e=compose('heart-vascular',assessment);
 assert.deepEqual(assessment,before);
 const fact=e.derivedFacts.find(item=>item.id==='derived.non-hdl');
 assert.equal(fact.value,4.2);assert.deepEqual(fact.inputIds,['heart-vascular.inputs.total','heart-vascular.inputs.hdl']);
 assert.match(e.translations[fact.formula],/общ холестерол/);
 assert.equal(e.record.find(row=>row.id==='heart-vascular.inputs.total').value,'212.685');
 const combined=e.chapters.find(ch=>ch.id==='case-lipids').blocks[0].text;
 assert.match(e.translations[combined],/212\.685/);assert.doesNotMatch(e.translations[combined],/Your recorded|recorded comparison/);
});

test('different comparison units show the equivalent value beside the original measurement',()=>{
 const e=heart();
 assert.match(chapter(e,'lipids'),/5\.5 mmol\/L\. In the comparison unit, this is 212\.685 mg\/dL/);
 const kidney=compose('kidney',assessSystem('kidney',systemSampleInputs('kidney')));
 assert.match(chapter(kidney,'kidney'),/88\.4 µmol\/L\. In the comparison unit, this is 1 mg\/dL/);
});

test('known diabetes retains its existing care context and avoids a prevention retest schedule',()=>{
 const e=compose('metabolic',assessSystem('metabolic',{...systemSampleInputs('metabolic'),diabetes:'Yes',hba1c:{value:'6.0',unit:'%'}}));
 assert.match(chapter(e,'glucose'),/existing care plan/);
 assert.match(chapter(e,'glucose'),/diabetes or maternity care team/);
 assert.doesNotMatch(chapter(e,'glucose'),/3–6 months|screening range associated with prediabetes/);
});

test('concordant glucose tests connect their findings without repeating the same explanation',()=>{
 const e=compose('metabolic',assessSystem('metabolic',{...systemSampleInputs('metabolic'),glucose:{value:'6.1',unit:'mmol/L'},hba1c:{value:'6.0',unit:'%'}}));
 const text=chapter(e,'glucose');
 assert.equal((text.match(/screening range associated with prediabetes/g)||[]).length,1);
 assert.match(text,/second result supports the same screening category/);
 assert.match(text,/5\.7 and 6\.5 %/);
});

test('critical findings suppress optimisation and missing markers do not acquire invented interpretations',()=>{
 const e=heart({systolic:{value:'180',unit:'mmHg'},diastolic:{value:'110',unit:'mmHg'},apob:{value:'0.95',unit:'g/L'}});
 assert.equal(e.folio.pages.some(page=>page.interpretation),false);
 const absent=heart();assert.equal(chapter(absent,'apob'),'');assert.equal(chapter(absent,'lpa'),'');
});

test('profile priorities change with the actual routine and new bilingual templates have curated translations',()=>{
 const run=answers=>composeReportDocument({state:{answers,assessmentType:'health-profile'}}).editorial;
 const low=run({...sampleAnswers,moderate:'70',vigorous:'0',sleep:'6',rested:'Sometimes',diet:'1–2'});
 const good=run({...sampleAnswers,moderate:'180',vigorous:'0',sleep:'8',rested:'Usually',diet:'5 or more'});
 assert.match(chapter(low,'activity'),/below the general adult minimum/);assert.match(chapter(good,'activity'),/reaches the general adult minimum/);
 assert.match(chapter(low,'habits'),/duration is below/);assert.match(chapter(good,'habits'),/maintaining the pattern/);
 for(const [key,text] of Object.entries(RESULT_COPY)){
  if(key.startsWith('resultRange'))continue;
  assert.ok(REPORT_BG[text]&&REPORT_BG[text]!==text,text);
 }
 for(const version of ['assessment-folio-v1','assessment-folio-v2','assessment-folio-v3'])assert.equal(isFamilyFolio({folio:{version}}),true);
});
