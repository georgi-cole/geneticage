import {insights, labs, profileBmi} from './model.mjs';
import {profileProgress} from './assessment-flow.mjs';
import {labDescriptions, reviewLabReference} from './lab-review.mjs';
import {clinicalForDisplay} from './lab-safety.mjs';
import {activityNeedsReview,markerGuidance,reportReading} from './report-marker-guidance.mjs';

const fitnessSources={
 FRIEND:['friend-2022'],
 HUNT:['hunt-nonexercise','hunt-reference'],
 Bradshaw:['bradshaw-fitness','friend-2022'],
 BLSA:['blsa-fitness','friend-2022'],
};

export function reportHighlights({answers={},labAge,clinical,heart,system,assessmentType,savedReport}={}) {
 clinical=clinicalForDisplay(clinical,{stored:!!savedReport});
 if(clinical){
  if(clinical.reason)return {title:'Start with the readings that need review',intro:'Some entries need a closer look before an age estimate can be shown. Use the notes below to check the values and the circumstances of your blood draw.'};
  return {
   title:'Your blood-based age, explained',
   intro:'Your nine blood results form a pattern. The study puts that pattern on an age scale. The two ages below let you see the estimate alongside your age when the blood was drawn.',
   stats:[['Blood-based age estimate',Math.round(clinical.value),'years'],['Your age at the blood draw',labAge,'years']],
  };
 }
 if(heart){
  const {result}=heart;
  const risk=result?.risk;
  return {
   title:'Your heart and blood vessel results',
   intro:result?.reason?'Some readings or health details need a closer look. The Summary and Measurements tabs explain which information is available to discuss.'
    :'This study compares your readings and health history with patterns observed in groups of people. Blood pressure, cholesterol and smoking history help put the result in context.',
   stats:Number.isFinite(risk)?[['Estimated risk over 10 years',risk<0.1?'<0.1':risk.toFixed(1),'%']]:[],
  };
 }
 if(system&&assessmentType==='fitness'){
  const {inputs,result,review}=system;
  const measured=result?.method==='FRIEND';
  const oxygen=measured?Number(inputs?.vo2peak?.value):review?.estimatedVo2;
  const band=result?.ageBand;
  return {
   title:'What your fitness result means',
   intro:result?.status!=='ready'?'Your answers and readings are available in this report. Open Summary to see what else the fitness comparison needs.'
    :measured?'Oxygen uptake tells you how much oxygen your body can use during exercise. Your test result is compared with people who took the same type of test in the study.'
     :'Oxygen uptake tells you how much oxygen your body can use during exercise. Your inputs help estimate it and show which age group in the study had the closest result.',
   stats:[...(band?[['Closest study age group',band.from+'–'+band.to,'years']]:[]),
    ...(Number.isFinite(oxygen)?[[measured?'Oxygen uptake from your test':'Estimated oxygen uptake',oxygen.toFixed(1),'mL/kg/min']]:[])],
  };
 }
 if(system&&assessmentType==='kidney'){
  const filtration=system.review?.egfr;
  return {
   title:'How to read your kidney results',
   intro:'Creatinine is a waste product measured in blood. It helps estimate how quickly your kidneys filter blood. A clinician can read that estimate alongside your urine results and earlier tests.',
   stats:Number.isFinite(filtration)?[['Estimated kidney filtration',filtration<60&&filtration>=59.95?'<60':filtration.toFixed(1),'mL/min/1.73 m²']]:[],
  };
 }
 if(system&&assessmentType==='metabolic'){
  const result=system.result;
  const ready=result?.status==='ready';
  return {
   title:'What your blood sugar assessment means',
   intro:ready?'This study looks at how factors such as waist size, family history and everyday habits relate to the chance of developing type 2 diabetes. A blood test adds a different kind of information.'
    :'Your readings and health history can help guide a conversation about blood sugar. Open Summary for the next step that fits the details you provided.',
   stats:ready&&!result.ageRange&&!result.ageBand&&Number.isFinite(result.age)?[['Study age comparison',result.age,'years']]:[],
  };
 }
 const {answered}=profileProgress(answers);
 const bmi=profileBmi(answers);
 return {
  title:'Your health habits, in focus',
  intro:'Your answers show which areas of everyday health are most relevant to you. Start with one step that fits your routine and bring the questions that matter to you to your next visit.',
  stats:[...(answered?[['Health profile answers',answered,'']]:[]),
   ...(Number.isFinite(bmi)?[['BMI from your height and weight',bmi.toFixed(1),'kg/m²']]:[])],
 };
}

function lifestyleGuidance(answers,{coversMovement,adaptActivity,focusProfile}) {
 return insights(answers).flatMap(item=>{
  const {key,tag,sources}=item;
  if(key==='weight-change')return [{...item,section:'clinician'}];
  if(key==='movement'&&tag==='Adapt activity to your health')return [{...item,section:'clinician'}];
  if(key==='movement'&&(coversMovement||adaptActivity)||key==='strength'&&adaptActivity)return [];
  if(key==='movement')return [{
   name:'Make room for a little more movement',section:'steps',sources,
   text:'Your weekly activity falls below the World Health Organization’s starting target for adults. The target is 150 minutes of moderate activity a week. More intense activity can count toward it.',
   measurements:[`Moderate activity · ${answers.moderate} min/week`,`Vigorous activity · ${answers.vigorous} min/week`],
   action:'If it suits your health, try one short walk or another activity that gets you breathing a little harder. Build up at a pace you can keep.',
   visit:focusProfile?['Which activity fits my routine and health history, and could we track my weekly minutes or how the same walk feels over time?']:null,
  }];
  if(key==='strength')return [{
   section:'steps',sources,name:'Make time to build strength',
   text:'Strength activities are part of the World Health Organization’s guidance for adults. The general target is at least two days a week.',
   measurements:[`Strength activity · ${answers.strength} days/week`],
   action:'Start with a strength activity you feel comfortable doing. Ask a healthcare professional how to adapt it if you have an injury or condition.',
  }];
  if(key==='diet')return [{
   section:'steps',sources,name:'Add fruit or vegetables to a familiar meal',
   text:'The World Health Organization suggests about five portions of fruit and vegetables a day for adults.',
   measurements:[`Fruit and vegetables · ${answers.diet} portions/day`],
   action:'Try adding one portion to a meal you already make. Choose food you enjoy and follow any dietary advice you’ve been given.',
   visit:focusProfile?['Which small food change would fit my usual meals and any dietary restrictions?']:null,
  }];
  if(key==='sleep'&&focusProfile)return [{...item,section:'steps'}];
  if(key==='alcohol')return [{
   ...item,section:'steps',name:'Take stock of your drinking',
   text:'You reported drinking alcohol. Writing down when and how much you drink can help you see your usual pattern.',
  }];
  return [];
 });
}

// Current profile answers inform the discussion. Model results and collection details come from the assessment.
export function reportGuidance(assessment,profile) {
 const {system,heart,assessmentType}=assessment;
 const recorded=assessment.answers||{};
 const answers=profile?.answers||recorded;
 const focusProfile=!assessmentType&&!assessment.labSubmitted;
 const adaptActivity=activityNeedsReview(answers)||activityNeedsReview(recorded)
  ||assessment.clinical?.withheld==='critical-values'||!!heart?.review?.pressureWarning
  ||system?.result?.status==='review';
 const comparisons=assessment.labSubmitted?labs.map(lab=>({lab,...reviewLabReference(lab.id,assessment.lab?.[lab.id],assessment)})):[];
 const outside=comparisons.filter(item=>item.sourceKind&&!item.threshold&&['above','below'].includes(item.status));
 const aboveFastingGuide=outside.some(item=>item.lab.id==='glucose'&&item.status==='above')&&assessment.labFasting==='Yes';
 const matches=markerGuidance(assessment,aboveFastingGuide,profile?.answers);
 const guidance=[...matches];
 const add=(section,name,text,action,sources,measurements,visit)=>guidance.push({section,name,text,action,sources,measurements,visit});
 if(profile?.answers){
  const source=profile.source==='saved'
   ?'Saved health profile'+(typeof profile.saved==='string'?' · '+profile.saved.slice(0,10):'')
   :'Health profile from this session';
  add('context','Health profile used for this report',
   'Answers from your separate health profile help shape the discussion below. The measurements and study results come from this assessment.',null,[],[source]);
 }
 guidance.push(...lifestyleGuidance(answers,{adaptActivity,focusProfile,coversMovement:matches.some(item=>item.coversMovement)}));
 const smoking=assessment.heart?.inputs?.smoking??answers.smoking;
 if(['Yes','Every day','Some days','Smoke now'].includes(smoking)){
  add('clinician','Support to stop smoking','You reported smoking cigarettes. The World Health Organization recommends offering support to adults who use tobacco.',
   'What support is available to help me stop smoking?',['who-cessation']);
 }

 if(assessment.labSubmitted){
  const critical=assessment.clinical?.withheld==='critical-values';
  const lymphocytes=outside.find(item=>item.lab.id==='lymphocytes');
  if(outside.length){
   add('context','Readings to look at more closely',
    'These readings fall outside the comparison ranges shown under Blood results. Your lab report and the circumstances of the blood draw help put them in context.',
    'Bring the original report to a healthcare professional and ask which readings need follow-up.',['lab-intervals',...(lymphocytes?['blood-differential']:[])],outside.map(({lab,label})=>{
     const reading=assessment.lab[lab.id];
     const description=lab.id==='lymphocytes'?'Lymphocytes are white blood cells that help your body respond to infection. This percentage shows their share of all your white blood cells.':labDescriptions[lab.id];
     return {title:`${lab.name} · ${reading.value} ${reading.unit||lab.units[0]} · ${label}`,description};
    }));
  }
  if(!critical&&aboveFastingGuide){
   add('clinician','Your blood sugar over time','Fasting glucose shows your blood sugar at the time of the blood draw. HbA1c gives a picture of your average blood sugar over the previous few months.',
    'Would a repeat fasting blood sugar test or an HbA1c help put this result in context?',['diabetes-diagnosis']);
  }
  if(!critical&&outside.some(item=>item.lab.id==='creatinine'&&item.status==='above')){
   add('clinician','A closer look at kidney filtration','Creatinine helps estimate how well your kidneys filter blood. A urine test for albumin, a type of protein, adds a different piece of information.',
    'Would a kidney filtration estimate or a urine test for albumin help explain this reading?',['kdigo-ckd']);
  }
  if(!critical&&lymphocytes){
   add('clinician','The count behind the percentage','The lab may also report an absolute lymphocyte count. That number tells you how many lymphocytes were measured in a volume of blood.',
    'Is the absolute count on my original blood report, and would it help explain this percentage?',['blood-differential']);
  }
  if(Number.isFinite(assessment.clinical?.value)&&!assessment.clinical.reason){
   add('context','When two blood tests tell a clearer story','Recent illness, fasting and differences between laboratories can all affect the numbers.',
    'When you compare results from two dates, check whether the tests were taken under similar conditions.',['phenoage','validation','lab-intervals']);
  }
 }

 if(assessmentType==='kidney'&&system?.inputs?.creatinine){
  const {inputs,result}=system;
  const measurements=[reportReading('Blood creatinine',inputs.creatinine)];
  if(inputs.acr)measurements.push(reportReading('Urine albumin-to-creatinine ratio (ACR)',inputs.acr));
  if(inputs.cystatin)measurements.push(reportReading('Cystatin C',inputs.cystatin));
  if(result.issue==='kidney-collection'||result.issue==='kidney-treatment'){
   add('clinician','The circumstances of your test','Your reported collection or treatment context affects how a creatinine result can be interpreted.',
    'How might the timing of this blood draw or the care I’m receiving affect the result?',['kdigo-ckd'],measurements);
  }else{
   add('clinician','Two measures of kidney health',
    inputs.acr?'Filtration and urine albumin describe different aspects of kidney health. Prior readings help a clinician assess persistence.'
     :'The filtration estimate uses creatinine. A urine albumin-to-creatinine ratio can add information about kidney damage.',
    null,['kdigo-ckd','ckd-epi-2021'],measurements,[
     inputs.acr?'How do these readings compare with my previous results?':'Would urine albumin help explain this result?',
     inputs.cystatin?'What does the second filtration marker add, and when would you repeat the tests?':'Would cystatin C or a repeat creatinine test add useful information?',
    ]);
   if(Number.isFinite(system.review?.egfr)&&!answers.context?.includes('Receiving dialysis')){
    guidance.push({section:'context',name:'Why the timing of a kidney test matters',
     text:'Creatinine can shift after a meal. Tell your clinician when you last ate before the blood draw, especially if this result differs from an earlier one.',
     measurements:[measurements[0]],sources:['creatinine-meal','kdigo-ckd'],
     study:{duration:'1–2 hours after eating',protocol:'Researchers took blood before and after a cooked-meat meal and compared it with readings around a meat-free meal.',
      outcomes:[['Median creatinine','80.5 → 101.0 µmol/L','The median rose temporarily after the cooked-meat meal.']],
     fit:'A meal-related shift can change a filtration estimate. Your clinician can use the timing of your blood draw to judge whether this is relevant.'},
     visit:['If I repeat the test, what preparation and timing would make the results easier to compare?'],
    });
   }
  }
 }
 if(assessmentType==='metabolic'&&system?.result){
  const {inputs,result}=system;
  const measurements=[];
  if(inputs.glucose)measurements.push(reportReading('Fasting blood sugar',inputs.glucose));
  if(inputs.hba1c)measurements.push(reportReading('HbA1c',inputs.hba1c));
  if(!['metabolic-pregnancy','diabetes-known','glucose-critical','glucose-review'].includes(result.issue)
   &&!answers.conditions?.includes('Diabetes')&&!answers.context?.includes('Pregnant')){
   add('clinician','Blood sugar in context',
    inputs.hba1c?'HbA1c and fasting glucose cover different periods. Recent blood loss and some blood conditions can affect HbA1c.'
     :inputs.glucose?'Your fasting blood sugar is a snapshot from the time of the test. HbA1c adds a view of your average over the past few months.'
     :'Waist size and family history help estimate long-term risk. A blood test can show how your blood sugar is behaving now.',
    null,['gdrs','diabetes-diagnosis'],measurements,[
     inputs.hba1c?'Which result gives the clearest starting point for me, and when would you check it again?'
      :'Would an average blood sugar test (HbA1c) or a fasting blood sugar test be helpful for me?',
    ]);
  }else if(result.issue!=='glucose-critical'){
   add('clinician','Choose the right blood sugar follow-up',
    'Health history and the reason a test was ordered help determine how to interpret it and what to check next.',
    'Which blood sugar test and follow-up would you use given my history and these results?',['diabetes-diagnosis'],measurements);
  }
 }
 if(assessmentType==='fitness'&&system?.result?.status==='ready'){
  const {inputs,result,review}=system;
  const measured=result.method==='FRIEND';
  const sources=fitnessSources[result.method]||[];
  const measurements=measured?(inputs?.vo2peak?[reportReading('Measured VO₂peak',inputs.vo2peak),inputs.testType].filter(Boolean):[])
   :[...(Number.isFinite(review?.estimatedVo2)?[`Estimated oxygen uptake · ${review.estimatedVo2.toFixed(1)} mL/kg/min`]:[]),
    ...(inputs.pulse?[reportReading('Resting pulse',inputs.pulse)]:[])];
  add('context','Make the next result easier to compare',
   measured?'Your result reflects the type of exercise test, the way it was set up and the effort you reached.'
    :'The estimate comes from the measurements and answers you entered. Changes in those inputs can move the result.',
   'Compare results from the same method. If the method changes, discuss the two results separately.',sources,measurements);
  if(!adaptActivity&&inputs.fitnessContext==='None of these'&&!matches.some(item=>item.coversMovement)){
   add('steps','Choose movement you can keep doing',
    'Aerobic activity gets you breathing faster. Walking, cycling and swimming are examples.',
    'If it suits your health, pick a form of movement you enjoy and build up at a pace you can keep.',['activity']);
  }
  add('clinician','When an exercise test adds context',
   measured?'The person who supervised your test can help explain how the setup and effort affected it.'
    :'A supervised test measures how much oxygen you use during exercise.',
   null,sources,null,[
    measured?'How might the test setup and my effort have influenced this result?'
     :'Would a measured exercise test add useful information for my health or fitness goals?',
    'What kind of activity suits my current health, and what would we measure to see whether my fitness changes?',
   ]);
 }else if(assessmentType==='fitness'){
  add('clinician','Find a useful fitness starting point',
   'The kind of exercise test that is useful depends on your health and the information already available.',
   'Given my health history and any activity limits, which starting measurement would be useful and safe to repeat?',['friend-2022','activity']);
 }
 if(heart?.inputs?.systolic&&!heart.review?.pressureWarning){
  const {systolic,diastolic,total,hdl}=heart.inputs;
  add('clinician','Bring your blood pressure and cholesterol together',
   'Blood pressure varies with measurement conditions. The cholesterol results and your health history give your clinician more context for interpreting it.',null,['who-blood-pressure'],
   [reportReading('Systolic blood pressure',systolic),...(diastolic?[reportReading('Diastolic blood pressure',diastolic)]:[]),
    ...(total?[reportReading('Total cholesterol',total)]:[]),...(hdl?[reportReading('HDL cholesterol',hdl)]:[])],[
     'When and how should I check my blood pressure again?',
     total?'Would other cholesterol results help explain my total?':'Which cholesterol results would help you put my blood pressure in context?',
    ]);
 }else if(heart&&!heart.review?.pressureWarning){
  add('clinician','Round out your heart health picture',
   'Blood pressure and cholesterol describe different parts of your heart and blood vessel health.',
   'Which missing readings would help you interpret my result, and how should I get them measured?',['who-blood-pressure']);
 }
 if(!guidance.length){
  add('clinician','Prepare for a conversation about your results','The information entered here supports the measurements and comparisons shown in the report.',
   'Bring the report and any previous results to a healthcare professional who knows your history. Ask which entries are relevant to your concerns.',[]);
 }
 return guidance;
}
