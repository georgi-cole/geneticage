import {insights, labs, profileBmi} from './model.mjs';
import {profileProgress} from './assessment-flow.mjs';
import {labDescriptions, reviewLabReference} from './lab-review.mjs';
import {clinicalForDisplay} from './lab-safety.mjs';

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

function lifestyleGuidance(answers) {
 return insights(answers).flatMap(item=>{
  const {key,tag,sources}=item;
  if(key==='weight-change')return [{...item,section:'clinician'}];
  if(key==='movement'&&tag==='Adapt activity to your health')return [{...item,section:'clinician'}];
  if(key==='movement')return [{
   name:'Make room for a little more movement',section:'steps',sources,
   text:'Your weekly activity falls below the World Health Organization’s starting target for adults. The target is 150 minutes of moderate activity a week. More intense activity can count toward it.',
   measurements:[`Moderate activity · ${answers.moderate} min/week`,`Vigorous activity · ${answers.vigorous} min/week`],
   action:'If it suits your health, try one short walk or another activity that gets you breathing a little harder. Build up at a pace you can keep.',
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
  }];
  if(key==='alcohol')return [{
   ...item,section:'steps',name:'Take stock of your drinking',
   text:'You reported drinking alcohol. Writing down when and how much you drink can help you see your usual pattern.',
  }];
  return [];
 });
}

// Discussion points use recorded answers and the original result. No model is run here.
export function reportGuidance(assessment) {
 const answers=assessment.answers||{};
 const guidance=lifestyleGuidance(answers);
 const add=(section,name,text,action,sources,measurements)=>guidance.push({section,name,text,action,sources,measurements});
 const smoking=assessment.heart?.inputs?.smoking??answers.smoking;
 if(['Yes','Every day','Some days','Smoke now'].includes(smoking)){
  add('clinician','Support to stop smoking','You reported smoking cigarettes. The World Health Organization recommends offering support to adults who use tobacco.',
   'What support is available to help me stop smoking?',['who-cessation']);
 }

 if(assessment.labSubmitted){
  const comparisons=labs.map(lab=>({lab,...reviewLabReference(lab.id,assessment.lab?.[lab.id],assessment)}));
  const outside=comparisons.filter(item=>item.sourceKind&&!item.threshold&&['above','below'].includes(item.status));
  const critical=assessment.clinical?.withheld==='critical-values';
  if(outside.length){
   add('context','Readings to look at more closely',
    'These readings fall outside the comparison range shown in the Blood results tab. A range helps you spot readings worth a closer look. Your lab report and the circumstances of the blood draw help explain them.',
    'Bring the original report to a healthcare professional and ask which readings need follow-up.',['lab-intervals'],outside.map(({lab,label})=>{
     const reading=assessment.lab[lab.id];
     return {title:`${lab.name} · ${reading.value} ${reading.unit||lab.units[0]} · ${label}`,description:labDescriptions[lab.id]};
    }));
  }
  if(!critical&&outside.some(item=>item.lab.id==='glucose'&&item.status==='above')&&assessment.labFasting==='Yes'){
   add('clinician','Your blood sugar over time','Fasting glucose shows your blood sugar at the time of the blood draw. HbA1c gives a picture of your average blood sugar over the previous few months.',
    'Would a repeat fasting blood sugar test or an HbA1c help put this result in context?',['diabetes-diagnosis']);
  }
  if(!critical&&outside.some(item=>item.lab.id==='creatinine'&&item.status==='above')){
   add('clinician','A closer look at kidney filtration','Creatinine helps estimate how well your kidneys filter blood. A urine test for albumin, a type of protein, adds a different piece of information.',
    'Would a kidney filtration estimate or a urine test for albumin help explain this reading?',['kdigo-ckd']);
  }
  if(Number.isFinite(assessment.clinical?.value)&&!assessment.clinical.reason){
   add('context','When two blood tests tell a clearer story','Recent illness, fasting and differences between laboratories can all affect the numbers.',
    'When you compare results from two dates, check whether the tests were taken under similar conditions.',['phenoage','validation','lab-intervals']);
  }
 }

 const system=assessment.system;
 if(assessment.assessmentType==='kidney'&&system?.inputs?.creatinine){
  const {inputs,result}=system;
  if(result.issue==='kidney-collection'||result.issue==='kidney-treatment'){
   add('clinician','The circumstances of your test','Your reported collection or treatment context affects how a creatinine result can be interpreted.',
    'How might the timing of this blood draw or the care I’m receiving affect the result?',['kdigo-ckd']);
  }else{
   add('clinician','Two measures of kidney health',
    inputs.acr?'Filtration and urine albumin describe different aspects of kidney health. Prior readings help a clinician assess persistence.'
     :'The filtration estimate uses creatinine. A urine albumin-to-creatinine ratio can add information about kidney damage.',
    inputs.acr?'How do these readings compare with my previous results?'
     :'Would a urine test for albumin or another blood test give us a clearer picture?',['kdigo-ckd','ckd-epi-2021']);
  }
 }
 if(assessment.assessmentType==='metabolic'&&['ready','review'].includes(system?.result?.status)){
  const {inputs,result}=system;
  if(!['metabolic-pregnancy','diabetes-known','glucose-critical','glucose-review'].includes(result.issue)){
   add('clinician','Blood sugar in context',
    inputs.hba1c?'HbA1c and fasting glucose cover different periods. Recent blood loss and some blood conditions can affect HbA1c.'
     :'The questionnaire estimates risk from the answers entered. A laboratory blood sugar result can add separate information.',
    'Would an average blood sugar test (HbA1c) or a fasting blood sugar test be helpful for me?',['gdrs','diabetes-diagnosis']);
  }
 }
 if(assessment.assessmentType==='fitness'&&system?.result?.status==='ready'){
  const measured=system.result.method==='FRIEND';
  const sources=fitnessSources[system.result.method]||[];
  add('context','Make the next result easier to compare',
   measured?'Your result reflects the type of exercise test, the way it was set up and the effort you reached.'
    :'The estimate comes from the measurements and answers you entered. Changes in those inputs can move the result.',
   'Compare results from the same method. If the method changes, discuss the two results separately.',sources);
  if(system.inputs?.fitnessContext==='None of these'){
   add('steps','Choose movement you can keep doing',
    'Aerobic activity gets you breathing faster. Walking, cycling and swimming are examples.',
    'If it suits your health, pick a form of movement you enjoy and build up at a pace you can keep.',['activity']);
  }
  add('clinician','When an exercise test adds context',
   measured?'The person who supervised your test can help explain how the setup and effort affected it.'
    :'A supervised test measures how much oxygen you use during exercise.',
   measured?'How might the test setup and my effort have influenced this result?'
    :'Would a measured exercise test add useful information for my health or fitness goals?',sources);
 }
 if(assessment.heart?.inputs?.systolic&&!assessment.heart?.review?.pressureWarning){
  add('clinician','Making sense of your blood pressure','Blood pressure varies with measurement conditions. A reading in this report can be discussed alongside your usual readings.',
   'When and how should I check my blood pressure again?',['who-blood-pressure']);
 }
 if(!guidance.length){
  add('clinician','Prepare for a conversation about your results','The information entered here supports the measurements and comparisons shown in the report.',
   'Bring the report and any previous results to a healthcare professional who knows your history. Ask which entries are relevant to your concerns.',[]);
 }
 return guidance;
}
