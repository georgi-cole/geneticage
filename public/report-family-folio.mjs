import {heartAgeReadout} from './heart-vascular.mjs';
import {FAMILY_FOLIO_VERSION} from './report-family-art.mjs';
import {CLINICAL_COPY as L} from './report-knowledge/clinical-copy.mjs';
import {EDITORIAL_COPY as C} from './report-knowledge/copy.mjs';
import {expandFamilyEducation,FAMILY_EDUCATION_VERSION} from './report-family-education.mjs';

const themes={
 'heart-vascular':'heart',metabolic:'metabolic',kidney:'kidney',fitness:'fitness','health-profile':'profile',
};
const boundaryLabels={above:'Above',below:'Below','at-least':'At least','up-to':'Up to'};
const measured=(label,value,unit='')=>({label,value,unit});

export function composeFamilyFolio(document,{state,chapters,record,metric,methods,critical,established,limited,sleepConcern,routineKnown,safeRoutine,knownDiabetes,specialContext},{phrase,paragraph,freezeText,source}){
 const {type,resultState}=document;
 const family=type==='heart-vascular'?state.heart:state.system;
 const inputs=family?.inputs||{};
 const result=family?.result||{};
 const review=family?.review||{};
 const profile=type==='health-profile';
 const answers=state.answers||{};
 const ready=resultState==='ready';
 const key=themes[type];
 const pages=[],agenda=[],coverReadings=[];
 const original=chapters.slice();
 const existing=id=>original.find(chapter=>chapter.id===id);
 const old=(id,blockId)=>existing(id)?.blocks.find(block=>block.id===blockId);
 const block=(id,copy,sources=[],kind='context',values)=>paragraph(id,phrase(copy,values),sources,kind);
 const reading=id=>record.find(row=>row.id===type+'.inputs.'+id);
 const readings=(...ids)=>ids.map(reading).filter(row=>row&&row.value!==C.notanswered).map(({label,value,unit})=>measured(label,value,unit));
 const valueReading=(label,value,unit)=>Number.isFinite(value)?[measured(freezeText(label),Number(value.toFixed(1)),unit)]:[];
 const pressure=()=>{
  const systolic=reading('systolic'),diastolic=reading('diastolic');
  return systolic&&diastolic?[measured(freezeText('Blood pressure'),systolic.value+'/'+diastolic.value,'mmHg')]:readings('systolic');
 };
 const add=(id,title,{lead=[],columns=[],aside=[],highlights=[],eyebrow='clinicalFeatures',literal=false}={})=>{
  const blocks=[...lead,...columns.flat(),...aside].filter(Boolean);
  const chapter={id,title:literal?freezeText(title):phrase(title),deck:'',kind:id==='perspective'?'intro':'feature',blocks};
  const index=chapters.findIndex(entry=>entry.id===id);
  if(index===-1)chapters.push(chapter);
  else chapters[index]=chapter;
  pages.push({
   id,title:chapter.title,eyebrow:phrase(eyebrow),chapters:[id],highlights,
   slots:{lead:lead.filter(Boolean).map(item=>item.id),columns:columns.map(column=>column.filter(Boolean).map(item=>item.id)),aside:aside.filter(Boolean).map(item=>item.id)},
  });
 };
 const opening=(title,lead,highlights=[],aside=[])=>add('perspective',title,{lead,highlights,aside,eyebrow:'clinicalPerspective'});
 const row=(when,reviewText,question,sources=[])=>{
  source(sources);
  agenda.push({when:phrase(when),review:phrase(reviewText),question:phrase(question),sources});
 };

 const age=type==='heart-vascular'&&ready?heartAgeReadout(result):{
  age:metric.age,direction:metric.ageRange,boundary:metric.boundary,
 };
 if(ready&&(age?.age!=null||age?.boundary!=null)){
  const value=age.direction&&boundaryLabels[age.direction]?
   freezeText(boundaryLabels[age.direction])+' '+age.boundary:age.age;
  if(typeof value==='string'&&age.direction)freezeText(value);
  coverReadings.push(measured(phrase('familyMeasureAge'),value,C.years));
 }
 if(ready&&type==='heart-vascular'&&['SCORE2','SCORE2-OP','SCORE2-Diabetes'].includes(result.method)&&Number.isFinite(result.risk)){
  coverReadings.push(measured(phrase('familyRiskLabel'),result.risk<.1?'<0.1':result.risk.toFixed(1),'%'));
 }
 if(ready&&type==='fitness'&&result.ageBand){
  coverReadings.push(measured(freezeText(C.comparisonBand),result.ageBand.from+'–'+result.ageBand.to,C.years));
 }
 if(ready&&type==='kidney')coverReadings.push(...valueReading('eGFR from creatinine',review.egfr,'mL/min/1.73 m²'));
 const bound=age?.direction?[block('bound','familyBoundNote',document.sourceIds,'aside')]:[];

 if(!profile&&!ready){
  const reviewBlocks=existing('perspective')?.blocks||[];
  const statusTitle=critical?'clinicalLeadSafety':resultState==='missing'?'familyReviewTitle':'clinicalLeadReview';
  opening(statusTitle,reviewBlocks.filter(item=>item.id!=='family-meaning-1'),[],reviewBlocks.filter(item=>item.id==='family-meaning-1'));
  if(!critical)row('familyWait','familyReviewNext','familyReviewQuestion');
 }else if(type==='heart-vascular'){
  const hasPressure=!!reading('systolic'),hasLipids=!!reading('total')||!!reading('hdl');
  const raised=!!review.pressureFollowUp;
  const smoker=['Yes','Every day','Some days','Current smoker','Smoke now'].includes(inputs.smoking);
  const meaning=result.method==='PDAY'?'heartPdayMeaning':result.method==='Framingham'?'heartFraminghamMeaning':'heartRiskMeaning';
  opening(raised?'heartPressureLead':smoker?'heartSmokingLead':'heartLead',[
   block('lead',raised?'heartPressureIntro':smoker?'heartSmokingIntro':'heartIntro',raised?['esc-blood-pressure']:smoker?['cessation']:[]),
   block('model-context',meaning,document.sourceIds),
  ],[...pressure(),...readings('total','hdl').slice(0,2)],bound);
  if(hasPressure)add('pressure','heartPressureFeature',{
   columns:[[block('check-pressure','heartPressureMeaning',['esc-blood-pressure'])],[paragraph('practice',phrase('heartReadingPracticeText'),['esc-blood-pressure'],'context',phrase('heartReadingPractice'))]],
   aside:raised?[paragraph('pressure-review',freezeText(review.pressureFollowUp),['esc-blood-pressure'],'aside')]:[],
  });
  if(hasLipids||reading('apob')||reading('lpa'))add('lipids','heartLipidFeature',{
   lead:[block('lipid-context','heartLipidMeaning',document.sourceIds)],
   columns:reading('apob')||reading('lpa')?[[block('specialist','heartAdvancedLipids',document.sourceIds)]]:[],
   highlights:readings('total','hdl','apob','lpa'),
  });
  if(hasPressure)row('familyWait','heartPressureAgenda','heartPressureQuestion',['esc-blood-pressure']);
  if(hasLipids)row('familyWait','heartLipidsAgenda','heartLipidsQuestion',document.sourceIds.slice(0,1));
  if(smoker)row('familyWait','heartTobaccoAgenda','heartTobaccoQuestion',['cessation']);
  methods.unshift(phrase(meaning));
 }else if(type==='metabolic'){
  const a1c=result.method==='GDRS with HbA1c';
  opening('metabolicLead',[
   block('lead',a1c?'metabolicLeadA1c':review.a1cOutside?'metabolicExcludedA1c':'metabolicLeadNoA1c',['gdrs','gdrs-coefficients']),
  ],[...readings('waist','activity'),...readings('hba1c','glucose').slice(0,1)],bound);
  add('metabolic','metabolicShape',{
   lead:[block('risk-inputs','metabolicShapeText',['gdrs','gdrs-coefficients'])],
   aside:[block('habit','metabolicRoutineText',['gdrs','activity','diet'],'aside')],
  });
  add('metabolic-labs','metabolicLabFeature',{
   columns:[[block('two-tests','metabolicTests',['a1c','glucose-followup'])],[paragraph('decision',phrase('metabolicPreventionText'),['a1c','glucose-followup'],'context',phrase('metabolicPreventionDecision'))]],
   highlights:readings('hba1c','glucose'),
  });
  row('familyWait','metabolicAgenda','metabolicQuestion',['a1c','glucose-followup']);
  methods.unshift(phrase('metabolicMethod'));
 }else if(type==='kidney'){
  const hasAcr=!!reading('acr');
  opening(hasAcr?'kidneyLeadBoth':'kidneyLead',[
   block('lead','kidneyIntro',['kdigo-ckd','kidney-context']),
  ],[...readings('creatinine'),...valueReading('eGFR from creatinine',review.egfr,'mL/min/1.73 m²'),...readings('acr')],bound);
  add('kidney','kidneyFilterFeature',{
   columns:[[block('filter','kidneyFilterText',['creatinine-explained','kidney-context'])],[paragraph('trend',phrase('kidneyTrendText'),['kdigo-ckd'],'context',phrase('kidneyTrendTitle'))]],
   aside:Number.isFinite(review.egfrCombined)?[block('combined','kidneyCystatinText',['ckd-epi-2021','kdigo-ckd'],'aside')]:[],
   highlights:valueReading('eGFR from creatinine and cystatin C',review.egfrCombined,'mL/min/1.73 m²'),
  });
  add('kidney-urine','kidneyUrineFeature',{
   lead:[block('urine',hasAcr?'kidneyUrineKnown':'kidneyUrineMissing',['kdigo-ckd'])],
  });
  row('familyWait','kidneyAgenda','kidneyQuestion',['kdigo-ckd','kidney-context']);
  methods.unshift(phrase('kidneyMethod'));
 }else if(type==='fitness'){
  const supervised=result.method==='FRIEND'&&!!reading('vo2peak');
  const contextLimited=inputs.fitnessContext!=='None of these';
  opening(supervised?'fitnessLeadMeasured':'fitnessLead',[
   block('lead',supervised?'fitnessMeasuredText':'fitnessEstimateText',document.sourceIds),
  ],supervised?readings('vo2peak','testType','rer'):[
   ...valueReading('Estimated VO₂peak',review.estimatedVo2,'mL/kg/min'),...readings('pulse','moderate'),
  ],bound);
  add('fitness','fitnessCapacityFeature',{
   columns:[[block('oxygen','fitnessCapacityText',document.sourceIds)],[paragraph('test-choice',phrase('fitnessMeasureText'),document.sourceIds,'context',phrase('fitnessMeasureChoice'))]],
   aside:review.testIncomplete?[paragraph('check-test',freezeText('For a measured comparison, check the test type and peak RER on your report.'),['friend-2022'],'aside')]:[],
  });
  add('movement','fitnessRoutineFeature',{
   lead:[block('routine',contextLimited?'fitnessLimitedText':established?'fitnessEstablishedText':'fitnessStarterText',['activity'])],
  });
  row('familyRoutineCheck','fitnessAgenda','fitnessQuestion',['activity']);
  methods.unshift(phrase('fitnessMethod'));
 }else{
  const smoker=['Every day','Some days'].includes(answers.smoking);
  const active=!!existing('movement');
  const diet=answers.diet&&answers.diet!=='Not sure';
  const selected=limited?['profileLimitLead','clinicalPlanLimit',['activity']]:smoker?['profileTobaccoLead','heartSmokingIntro',['cessation']]:
   sleepConcern?['profileSleepLead','clinicalLeadSleepText',['sleep']]:
   established?['profileMaintainLead','profileMaintainText',['activity']]:
   active?['profileActivityLead','fitnessStarterText',['activity']]:
   diet?['profileDietLead','profileDietText',['diet']]:['profileOpenLead','profileOpenText',[]];
  const glance=[];
  for(const [id,label,unit] of [['sleep','clinicalSleep','clinicalSleepUnit'],['moderate','clinicalActivity','clinicalActivityUnit']]){
   const entry=record.find(item=>item.id==='answers.'+id&&item.value!==C.notanswered);
   if(entry)glance.push(measured(phrase(label),entry.value,phrase(unit)));
  }
  opening(selected[0],[block('lead',selected[1],selected[2])],glance);
  if(sleepConcern)add('sleep','clinicalSleepFeature',{
   lead:[block('sleep-diary','clinicalSleepDiary',['sleep'])],
   aside:[block('sleep-support','clinicalSleepTreatment',['insomnia','apnea'],'aside')],
  });
  if(established&&!limited)add('movement','profileMaintainFeature',{lead:[block('protect','profileMaintainFeatureText',['activity'])]});
  if(active&&!limited&&!established&&old('starting-plan','baseline-step')){
   add('movement','fitnessRoutineFeature',{lead:[old('starting-plan','baseline-step')],aside:[block('week','profileHabitCheck',['activity'],'aside')]});
  }
  if(diet&&selected[0]!=='profileDietLead'&&answers.diet!=='5 or more'){
   add('nutrition','profileDietLead',{lead:[block('meal','clinicalMealText',['diet'],'context',{portions:answers.diet})]});
  }
  if(sleepConcern)row('clinicalTwoWeeks','clinicalAgendaSleep','clinicalQuestionSleep',['sleep']);
  else if(!limited&&selected[0]!=='profileOpenLead')row('familyRoutineCheck','profileHabitCheck','profileHabitQuestion');
  if(smoker)row('familyWait','heartTobaccoAgenda','heartTobaccoQuestion',['cessation']);
  if(limited||selected[0]==='profileOpenLead')row('familyWait','familyReviewNext','familyReviewQuestion');
  methods.unshift(phrase('familyProfileMethod'));
 }

 expandFamilyEducation(document,{inputs,answers,result,review,critical,established,limited,sleepConcern,routineKnown,safeRoutine,knownDiabetes,specialContext},
  {add,pages,existing,reading,readings,valueReading,block,paragraph});
 methods.push(phrase('educationEvidenceChecked'));
 if(agenda.length){
  add('follow-up','clinicalFollowup',{eyebrow:'clinicalFollowupLabel',lead:critical?[]:[
   block('review-agenda','educationClinicalReview',[], 'editorial'),
   block('review-purpose','educationReviewPurpose',[], 'editorial'),
  ]});
  pages.at(-1).agenda=agenda;
  pages.at(-1).lesson=!critical;
 }
 for(const template of Object.values(L))freezeText(template);
 const coverMessage=profile?phrase('familyProfileMark'):C.notcalculated;
 const overview=pages.slice(0,3).map(({id,title})=>({id,title}));
 return {
  version:FAMILY_FOLIO_VERSION,knowledgeVersion:FAMILY_EDUCATION_VERSION,footer:phrase('clinicalClinicianNote'),headline:phrase(key+'Cover'),deck:phrase(key+'Deck'),
  coverReadings,coverMessage,overview,pages,urgent:critical,
 };
}

export function familyPageContent(editorial,page){
 const byId=new Map(editorial.chapters.find(chapter=>chapter.id===page.id).blocks.map(block=>[block.id,block]));
 const blocks=ids=>ids.map(id=>byId.get(id)).filter(Boolean);
 return {
  lead:blocks(page.slots.lead),columns:page.slots.columns.map(blocks),aside:blocks(page.slots.aside),agenda:page.agenda,
 };
}
