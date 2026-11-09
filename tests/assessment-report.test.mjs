import assert from 'node:assert/strict';
import {test} from 'node:test';
import {JSDOM} from 'jsdom';
import {renderAssessmentReport} from '../public/report-ui.mjs';
import {freshAssessment} from '../public/assessment-flow.mjs';
import {sampleAnswers,sampleLabs,assessClinical} from '../public/model.mjs';
import {translateText} from '../public/language-system.mjs';
import {reportDocument} from '../public/report-export.mjs';
import {reportGuidance} from '../public/report-guidance.mjs';
import {reportOffer} from '../public/report-controls.mjs';
import {reportReadiness} from '../public/report-readiness.mjs';
import {assessHeartVascular} from '../public/heart-vascular.mjs';
import {assessSystem,systemSampleInputs} from '../public/system-assessments.mjs';

const state={...freshAssessment(),answers:structuredClone(sampleAnswers),lab:sampleLabs(),labAge:'45',labDate:'2026-11-01',labFasting:'Yes',labContext:true,labReferenceGroup:'male',labSubmitted:true,reportTab:'summary'};
state.lab.crp.assay='standard-crp';state.lab.albumin.referenceLow='35';state.lab.albumin.referenceHigh='50';
const clinical=assessClinical({age:45,lab:state.lab,contextConfirmed:true,fasting:'Yes'});
const render=(s=state,options={})=>new JSDOM(renderAssessmentReport({state:s,clinical,full:true,pagesPreview:true,...options})).window.document;

test('report has four stable sections, a focal estimate, actual answers and distinct sourced comparisons',()=>{
 const doc=render();
 assert.deepEqual([...doc.querySelectorAll('.report-tabs button')].map(el=>el.textContent),['Insights','Summary','Blood results','Details']);
 assert.equal(doc.querySelector('#report-chapter'),null);assert.equal(doc.querySelectorAll('.report-panel:not([hidden])').length,1);
 assert.equal(doc.querySelector('.report-age-line strong').textContent,String(Math.round(clinical.value)));
 assert.ok(doc.querySelectorAll('.premium-report-card').length>=3);
 assert.match(doc.querySelector('.premium-report-cover').textContent,/Your blood-based age, explained/);
 assert.deepEqual([...doc.querySelectorAll('.premium-report-chapter h2')].map(el=>el.textContent),['Steps linked to your readings','What stands out','Small steps to consider','Questions for your next visit']);
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

test('fasting glucose guidance uses the actual result, known context and the reported activity',()=>{
 const assessment={...state,clinical};
 const match=draft=>reportGuidance(draft).find(item=>item.section==='matched');
 assert.deepEqual(match(assessment).measurements,['Fasting blood sugar · 6.2 mmol/L','Moderate activity · 90 min/week','Vigorous activity · 0 min/week']);
 assert.match(match(assessment).action,/activity you already do/);
 assert.equal(match(assessment).study.duration,'6 months');
 assert.deepEqual(match(assessment).study.outcomes.map(([,value])=>value),['−0.32 mmol/L','−0.34 mmol/L']);
 assert.match(match(assessment).study.contrast,/0\.18 litres more oxygen.*fasting blood sugar showed no clear change/);
 assert.match(match({...assessment,answers:{...state.answers,moderate:'180'}}).action,/already reach/);
 assert.equal(match({...assessment,answers:{...state.answers,limitations:'Often'}}),undefined);
 assert.equal(match({...assessment,labFasting:'No'}),undefined);
 assert.equal(match({...assessment,answers:{...state.answers,conditions:[]}}),undefined);
 assert.equal(match({...assessment,answers:{...state.answers,conditions:['Diabetes']}}),undefined);
 assert.equal(match({...assessment,lab:{...state.lab,glucose:{value:'126',unit:'mg/dL'}}}),undefined);
 assert.equal(match({...assessment,clinical:{withheld:'critical-values',reason:'Review needed'}}),undefined);
 assert.equal(match({...assessment,lab:{...state.lab,glucose:{value:'112',unit:'mg/dL'}}}).measurements[0],'Fasting blood sugar · 112 mg/dL');
 const {content}=reportDocument(render().querySelector('.report-workspace'));
 const pdfText=JSON.stringify(content);
 assert.match(pdfText,/What the study tested/);
 assert.match(pdfText,/Bring to your clinician/);
 assert.match(pdfText,/What about vigorous exercise\?/);
 assert.match(pdfText,/−0\.32 mmol\/L/);
 assert.match(pdfText,/Fasting blood sugar · 6.2 mmol\/L/);
 assert.match(pdfText,/The count behind the percentage/);
});

test('report readiness distinguishes missing fields from useful optional measurements in all six assessments',()=>{
 const profile={answers:{...sampleAnswers,moderate:'0',vigorous:'0'},source:'saved',saved:'2026-11-05T10:00:00Z',id:'profile-id'};
 const emptyProfile=reportReadiness({answers:{age:'45',smoking:'Prefer not to say'}});
 assert.deepEqual(emptyProfile.measurements,[]);
 assert.ok(emptyProfile.profileFields.includes('Height'));
 assert.ok(emptyProfile.profileFields.includes('Cigarette smoking history'));
 const blood=reportReadiness({...state,labFasting:'Not sure',lab:{...state.lab,glucose:{}}},profile);
 assert.deepEqual(blood.measurements,['Glucose','Whether you fasted for the blood draw']);
 assert.deepEqual(blood.profileFields,[],'Zero activity is a valid answer.');
 const heart=reportReadiness({assessmentType:'heart-vascular',heart:{inputs:{systolic:{value:120}}}},profile);
 assert.ok(heart.measurements.includes('Both blood pressure numbers'));
 assert.ok(heart.measurements.includes('Total and HDL cholesterol'));
 for(const [type,expected] of [['metabolic',['Fasting glucose or HbA1c']],['kidney',['Urine albumin result','Cystatin C result']],['fitness',['Supervised exercise test result']]]){
  const readiness=reportReadiness({assessmentType:type,system:{inputs:{}}},profile);
  assert.deepEqual(readiness.helpful,expected);
  assert.equal(readiness.limited,true);
  const document=new JSDOM(reportOffer({assessment:type,review:true,readiness,recordId:'assessment-id'})).window.document;
  assert.match(document.body.textContent,/Uses your saved health profile · 2026-11-05/);
  assert.match(document.body.textContent,/Missing details may limit/);
  assert.equal(document.querySelector('[data-action="report-review-profile"]'),null);
  assert.equal(document.querySelector('[data-action="edit-existing-assessment"]').dataset.id,'assessment-id');
  assert.match(document.querySelector('[data-action="open-full-report"]').textContent,/Continue with available data/);
 }
 assert.equal(reportReadiness({answers:profile.answers}).limited,false);
 const unavailable=reportReadiness({assessmentType:'kidney'},{source:'unavailable'});
 const document=new JSDOM(reportOffer({assessment:'Kidney',review:true,readiness:unavailable})).window.document;
 assert.match(document.body.textContent,/could not load your saved health profile/);
 assert.ok(document.querySelector('[data-action="report-review-profile"]'));
});

test('separate health profile changes report guidance without changing the recorded assessment',()=>{
 const profile={answers:{...sampleAnswers,moderate:'0',vigorous:'0'},source:'saved',saved:'2026-11-05T10:00:00Z'};
 const blood={...state,answers:{},clinical};
 const guidance=reportGuidance(blood,profile);
 assert.deepEqual(guidance.find(item=>item.name==='Health profile used for this report').measurements,['Saved health profile · 2026-11-05']);
 assert.match(guidance.find(item=>item.study).study.fit,/BMI comes from a separate health profile/);
 assert.equal(blood.clinical,clinical);
 assert.deepEqual(blood.answers,{});
 assert.equal(reportGuidance(blood,{...profile,answers:{...profile.answers,conditions:['Diabetes']}}).some(item=>item.section==='matched'),false);
 const fitness={assessmentType:'fitness',system:assessSystem('fitness',{...systemSampleInputs('fitness'),moderate:{value:'20',unit:'min / week'},vigorous:{value:'0',unit:'min / week'}})};
 assert.match(reportGuidance(fitness,profile).find(item=>item.section==='matched').study.outcomes[0][1],/9%/);
 const limited=reportGuidance(fitness,{...profile,answers:{...profile.answers,limitations:'Often'}});
 assert.equal(limited.some(item=>item.section==='matched'||item.name==='Choose movement you can keep doing'),false);
 assert.ok(limited.some(item=>item.tag==='Adapt activity to your health'));
 const kidney={assessmentType:'kidney',system:assessSystem('kidney',{
  age:{value:'55',unit:'years'},sex:'Female',kidneyHistory:'No known kidney disease',kidneyContext:'Stable health',creatinine:{value:'0.9',unit:'mg/dL'},
 })};
 const kidneyGuidance=reportGuidance(kidney,profile);
 assert.ok(kidneyGuidance.some(item=>item.study?.duration==='1–2 hours after eating'));
 assert.match(kidneyGuidance.find(item=>item.name==='Two measures of kidney health').visit[0],/urine albumin/);
 const metabolic={assessmentType:'metabolic',system:assessSystem('metabolic',systemSampleInputs('metabolic'))};
 assert.ok(reportGuidance(metabolic,profile).some(item=>item.name==='Blood sugar in context'));
 assert.ok(reportGuidance({answers:{...sampleAnswers}},profile).some(item=>item.name==='Make room for a little more movement'&&item.visit?.length));
});

test('heart guidance matches measured pressure and total cholesterol within the studied contexts',()=>{
 const inputs={age:50,country:'Germany',sex:'Male',smoking:'Yes',conditions:'No',treatment:'No',
  systolic:{value:'140',unit:'mmHg'},diastolic:{value:'85',unit:'mmHg'},
  total:{value:'5.5',unit:'mmol/L'},hdl:{value:'1.3',unit:'mmol/L'}};
 const matches=changes=>reportGuidance({heart:assessHeartVascular({...inputs,...changes})}).filter(item=>item.section==='matched');
 assert.deepEqual(matches({}).map(item=>item.measurements[0]),['Systolic blood pressure · 140 mmHg','Total cholesterol · 5.5 mmol/L']);
 assert.deepEqual(matches({systolic:{value:'185',unit:'mmHg'}}),[]);
 assert.deepEqual(matches({total:{value:'4.5',unit:'mmol/L'}}).map(item=>item.measurements[0]),['Systolic blood pressure · 140 mmHg']);
});

test('empty and earlier stored reports preserve the recorded result and use available inputs for discussion points',()=>{
 const empty=render({...state,answers:{},lab:{},labSubmitted:false},{clinical:null});
 assert.equal(empty.querySelectorAll('.premium-report-card').length,1);assert.match(empty.querySelector('[data-report-panel="findings"]').textContent,/Prepare for a conversation/);
 const saved=render({...state,savedReport:{priorities:[],version:'educational-report-v1'}});
 assert.equal(saved.querySelector('.report-age-line strong').textContent,String(Math.round(clinical.value)));
 assert.match(saved.body.textContent,/stored result has not been recalculated/);
 const withheld=render(state,{clinical:{reason:'Fictional collection review reason'}});
 assert.equal(withheld.querySelector('.report-age-line'),null);assert.match(withheld.body.textContent,/Fictional collection review reason/);
});

test('basic reports and PDFs include the submitted data and safety checks while insights require access',()=>{
 const locked={...state,saved:'2026-11-02',savedReport:{guidance:[{name:'Full-only marker'}]}};
 const doc=render(locked,{full:false,pagesPreview:false});
 assert.equal(doc.querySelectorAll('.premium-report-card').length,0);
 assert.ok(doc.querySelectorAll('.answer-row dt').length>4);
 assert.equal(doc.querySelectorAll('.blood-review-item').length,9);
 assert.ok(doc.querySelector('[data-action="print"]'));
 assert.ok(doc.querySelector('.report-saved[disabled]'));
 assert.ok(doc.querySelector('[data-action="checkout"]'));
 const documentBody=doc=>JSON.stringify(reportDocument(doc.querySelector('.report-workspace')).content);
 const basic=documentBody(doc);
 assert.match(basic,/Clinical study based/);
 assert.match(basic,/Age at blood draw/);
 assert.match(basic,/Glucose/);
 assert.doesNotMatch(basic,/Full-only marker|Insights from your assessment|Save PDF/);
 const full=documentBody(render(locked));
 assert.match(full,/Full-only marker/);
 assert.ok(full.indexOf('Your blood-based age, explained')<full.indexOf('Full-only marker'));
 assert.ok(full.indexOf('Full-only marker')<full.indexOf('Glucose'));
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
