import {insights, labs} from './model.mjs';
import {labDescriptions, reviewLabReference} from './lab-review.mjs';
import {clinicalForDisplay} from './lab-safety.mjs';
import {activityNeedsReview,markerGuidance,reportReading} from './report-marker-guidance.mjs';

const fitnessSources={
 FRIEND:['friend-2022'],
 HUNT:['hunt-nonexercise','hunt-reference'],
 Bradshaw:['bradshaw-fitness','friend-2022'],
 BLSA:['blsa-fitness','friend-2022'],
};

const valueWithUnit=({value,unit})=>unit?value+' '+unit:String(value);
const filtrationValue=value=>value<60&&value>=59.95?'just under 60':value.toFixed(1);

export function reportHighlights({labAge,labSubmitted,clinical,heart,system,assessmentType,savedReport}={}) {
 clinical=clinicalForDisplay(clinical,{stored:!!savedReport});
 if(clinical||labSubmitted){
  if(!Number.isFinite(clinical?.value)||clinical.reason)return {
   title:'Start with the readings that need review',
   opening:['The most useful part of this report is the blood work you entered and the circumstances around the blood draw. The collection and safety notes explain which readings deserve a closer look and what information to bring to that conversation.'],
  };
  return {
   title:'Your blood-based age, explained',
   opening:[
    (labAge?`You were ${labAge} years old when this blood sample was taken. `:'')+`Your blood-based age estimate was about ${Math.round(clinical.value)} years. The formula uses your age and nine blood measurements to produce that estimate.`,
    'To understand what may matter for you, it helps to look at the individual readings. If one falls outside its comparison range, the timing of the blood draw or a recent change in health can be useful context.',
   ],
  };
 }
 if(heart){
  const {result}=heart;
  const risk=result?.risk;
  return {
   title:'Your heart and blood vessel results',
   opening:Number.isFinite(risk)?[
    `At the time of this assessment, your estimated ten-year risk was ${risk<0.1?'below 0.1%':risk.toFixed(1)+'%'}. The percentage describes how often a heart attack, stroke or other event counted by the study might happen among people with a similar set of readings and health history.`,
    'For your next conversation, the blood pressure and cholesterol behind the estimate are more useful than the percentage alone. They help you and your clinician decide what is worth measuring again or following over time.',
   ]:result?.reason?['Some readings or health details need a closer look before making the study comparison. The numbers you recorded can still help your clinician decide which measurements to review together.']
    :['Your blood pressure, cholesterol and health history each tell a different part of the story. Start with the measurements that went into your result, and use the questions below to decide what would help put them in context.'],
  };
 }
 if(system&&assessmentType==='fitness'){
  const {inputs,result,review}=system;
  const measured=result?.method==='FRIEND';
  const oxygen=measured?Number(inputs?.vo2peak?.value):review?.estimatedVo2;
  const band=result?.ageBand;
  return {
   title:'What your fitness result means',
   opening:result?.status!=='ready'?['Your current entries give a starting point for a conversation about fitness. The Summary shows which details still need review before making an age comparison.']:[
    Number.isFinite(oxygen)?`${measured?'Your exercise test measured peak oxygen uptake at':'Your assessment estimated peak oxygen uptake at'} ${oxygen.toFixed(1)} mL/kg/min. This describes how much oxygen your body can use during hard exercise, adjusted for body weight.`
     :'Peak oxygen uptake describes how much oxygen your body can use during hard exercise, adjusted for body weight.',
    (band?`Your result was closest to the study’s ${band.from}–${band.to} age group. `:'')+(measured
     ?'The comparison uses people who took the same type of exercise test. If you repeat it, the same setup makes it easier to judge what has changed.'
     :'The estimate comes from the answers and measurements you entered. Repeating the same method gives you a more useful comparison over time.'),
   ],
  };
 }
 if(system&&assessmentType==='kidney'){
  const filtration=system.review?.egfr;
  const creatinine=system.inputs?.creatinine;
  return {
   title:'How to read your kidney results',
   opening:[
    (creatinine?`Your blood creatinine was ${valueWithUnit(creatinine)}. `:'')+'Creatinine is a waste product that your kidneys clear from your blood. The amount in the blood helps estimate how quickly your kidneys are filtering.',
    Number.isFinite(filtration)?`Your estimated filtration was ${filtrationValue(filtration)} mL/min/1.73 m². You may see this called eGFR, short for estimated glomerular filtration rate. The unit adjusts for a standard body size so readings can be compared. The next question is how this result fits with your earlier tests and what a urine result could add.`
     :'Your clinician can use the circumstances of the blood draw and any earlier results to decide what this reading can tell you.',
   ],
  };
 }
 if(system&&assessmentType==='metabolic'){
  const {inputs,result}=system;
  return {
   title:'What your blood sugar assessment means',
   opening:result?.status==='ready'?[
    (inputs?.waist?`You recorded a waist measurement of ${valueWithUnit(inputs.waist)}. `:'')+'Waist size is one piece of the picture. The study considers it alongside your family history and habits to estimate the chance of developing type 2 diabetes over time.',
    'A blood test answers a different question about your blood sugar now or over the last few months. The next section explains which of those views your results offer and what might help fill a gap.',
   ]:['Your health history and any lab results you entered give your clinician a starting point for talking about blood sugar. The reason for testing and the type of blood test matter when deciding what the result means for you.'],
  };
 }
 return {
  title:'Your health habits, in focus',
  opening:['Your answers give a picture of what a usual week looks like for you. They help identify where a small change might be realistic and where a health concern or a limit you’ve described deserves more attention.',
   'Choose the part of the report that feels most relevant to you. At your next visit, it can help to describe what you are already doing and ask how you would tell whether a change is helping.'],
 };
}

function lifestyleGuidance(answers,{coversMovement,adaptActivity,focusProfile}) {
 return insights(answers).flatMap(item=>{
  const {key,tag,sources}=item;
  if(key==='weight-change')return [{...item,section:'clinician'}];
  if(key==='movement'&&tag==='Adapt activity to your health')return [{...item,section:'clinician',name:'Finding activity that fits your health',
   paragraphs:[(answers.limitations==='Often'?'You said your health often limits how much activity you can do. '
    :answers.limitations==='Sometimes'?'You said your health sometimes limits how much activity you can do. '
     :'You described a health or recovery detail that can affect activity. ')
    +'That matters when choosing where to start. A useful goal takes your recovery or day-to-day limits into account.'],
   action:'Describe what you can do on a typical day and what makes it harder. Your clinician can help you decide what kind of movement is manageable and how you would tell if it’s getting easier.',
  }];
  if(key==='movement'&&(coversMovement||adaptActivity)||key==='strength'&&adaptActivity)return [];
  if(key==='movement')return [{
   name:'Make room for a little more movement',section:'steps',sources,
   text:'Your weekly activity falls below the World Health Organization’s starting target for adults. The target is 150 minutes of moderate activity a week. More intense activity can count toward it.',
   paragraphs:[
    `In a typical week, you reported ${answers.moderate} minutes of moderate activity and ${answers.vigorous} minutes of vigorous activity. The World Health Organization uses 150 minutes of moderate activity a week, or an equivalent mix, as a general starting target for adults. Your usual week tells you where you’re starting today.`,
    'If you want to add some movement, pick a time that already fits your routine. A short walk after a meal or during a break is one example if walking is comfortable for you. Over time, you could notice whether the same route feels easier or whether you’re able to move for a little longer.',
   ],
   measurements:[`Moderate activity · ${answers.moderate} min/week`,`Vigorous activity · ${answers.vigorous} min/week`],
   visit:focusProfile?['Which activity fits my routine and health history, and could we track my weekly minutes or how the same walk feels over time?']:null,
  }];
  if(key==='strength')return [{
   section:'steps',sources,name:'Make time to build strength',
   text:'Strength activities are part of the World Health Organization’s guidance for adults. The general target is at least two days a week.',
   paragraphs:[
    `You recorded ${answers.strength} ${Number(answers.strength)===1?'day':'days'} of strength activity in a usual week. The World Health Organization’s general target for adults is at least two days. Building strength can support everyday tasks such as carrying groceries or getting up from a chair.`,
    'It can be easier to start with a familiar movement you can repeat comfortably. If pain, injury or a health condition affects what you can do, ask a healthcare professional what kind of activity would be appropriate.',
   ],
   measurements:[`Strength activity · ${answers.strength} days/week`],
  }];
  if(key==='diet')return [{
   section:'steps',sources,name:'Add fruit or vegetables to a familiar meal',
   text:'The World Health Organization suggests about five portions of fruit and vegetables a day for adults.',
   paragraphs:[`You estimated that you usually eat ${answers.diet} portions of fruit and vegetables a day. The World Health Organization’s guidance is about five portions for adults. This answer gives you one part of your eating pattern to look at more closely.`,
    'If you want to build on that, think of a meal you already eat most days. Adding a serving of a vegetable or fruit you enjoy can be an easier place to start than changing the whole meal. Choose something that fits any dietary advice you’ve been given.'],
   measurements:[`Fruit and vegetables · ${answers.diet} portions/day`],
   visit:focusProfile?['Which small food change would fit my usual meals and any dietary restrictions?']:null,
  }];
  if(key==='sleep'&&focusProfile)return [{...item,section:'steps',name:'What your sleep answers tell you',
   paragraphs:[(Number(answers.sleep)>0?`You recorded about ${answers.sleep} hours of sleep a night. `:'')
    +(answers.rested==='Rarely'?'You also said you rarely wake feeling rested. ':'')
    +'The length of a night’s sleep and how you feel the next day tell you different things. If your sleep or daytime energy is bothering you, it can help to bring a few examples of your usual bedtimes, wake times and how rested you felt.'],
   action:'You can discuss those patterns with a clinician if tiredness or trouble sleeping persists.',
  }];
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
 const add=(section,name,copy,action,sources,measurements,visit)=>guidance.push({section,name,
  ...(Array.isArray(copy)?{text:copy.join(' '),paragraphs:copy}:{text:copy}),action,sources,measurements,visit});
 if(profile?.answers){
  const source=profile.source==='saved'
   ?'Saved health profile'+(typeof profile.saved==='string'?' · '+profile.saved.slice(0,10):'')
   :'Health profile from this session';
  add('context','Health profile used for this report',
   [profile.source==='saved'&&typeof profile.saved==='string'?`This discussion also draws on the health profile you saved on ${profile.saved.slice(0,10)}.`
    :'This discussion also draws on the health profile you filled in during this session.',
    'Your answers about habits and health history help put the measurements from this assessment in context. They can help you decide which questions are most relevant to bring to your next visit.'],null,[],[source]);
 }
 guidance.push(...lifestyleGuidance(answers,{adaptActivity,focusProfile,coversMovement:matches.some(item=>item.coversMovement)}));
 const smoking=assessment.heart?.inputs?.smoking??answers.smoking;
 if(['Yes','Every day','Some days','Smoke now'].includes(smoking)){
  add('clinician','Support to stop smoking','You mentioned smoking cigarettes. If stopping is something you’re considering, a useful starting point is to talk about when you usually smoke, what you’ve already tried and which situations make it hardest. Your clinician can discuss what support would fit your circumstances.',
   null,['who-cessation'],null,['What support is available to help me stop smoking?']);
 }

 if(assessment.labSubmitted){
  const critical=assessment.clinical?.withheld==='critical-values';
  const lymphocytes=outside.find(item=>item.lab.id==='lymphocytes');
  const otherReadings=outside.filter(({lab})=>lab.id!=='glucose'||!matches.length);
  if(otherReadings.length){
   const copy=otherReadings.map(({lab,status})=>{
    const entry=assessment.lab[lab.id];
    const comparison=status==='above'?'That is above the comparison range used here.':'That is below the comparison range used here.';
    if(lab.id==='lymphocytes')return `Lymphocytes made up ${entry.value}% of the white blood cells in your sample. ${comparison} Lymphocytes help your body respond to infection. A percentage describes their share of all white blood cells. The absolute count on your lab report, if available, shows how many lymphocytes were actually measured in a volume of blood.`;
    return `${lab.name} was recorded at ${entry.value} ${entry.unit||lab.units[0]}. ${comparison} ${labDescriptions[lab.id]||''}`;
   });
   add('context','A closer look at individual readings',copy,
    'Bring the original lab report to the conversation. Your clinician can look at the lab’s own ranges, earlier results and how you were feeling around the time of the blood draw.',
    ['lab-intervals',...(lymphocytes?['blood-differential']:[])],null,
    !critical&&lymphocytes?['Is the absolute count on my original blood report, and would it help explain this percentage?']:null);
  }
  if(!critical&&aboveFastingGuide&&!matches.length){
   add('clinician','Your blood sugar over time','Fasting glucose shows what your blood sugar was at the time of the draw. An HbA1c test gives a longer view because it reflects your average blood sugar over the past few months. The two tests can help you and your clinician decide whether this result is part of a pattern.',
    null,['diabetes-diagnosis'],null,['Would a repeat fasting blood sugar test or an HbA1c help put this result in context?']);
  }
  if(!critical&&outside.some(item=>item.lab.id==='creatinine'&&item.status==='above')){
   add('clinician','A closer look at kidney filtration','Creatinine helps estimate how well your kidneys filter blood. A urine test for albumin, a type of protein, adds a different piece of information.',
    'Would a kidney filtration estimate or a urine test for albumin help explain this reading?',['kdigo-ckd']);
  }
  if(Number.isFinite(assessment.clinical?.value)&&!assessment.clinical.reason){
   add('clinician','When two blood tests tell a clearer story',
    'If you have an earlier lab report, put it beside this one. Compare the same measurement and check whether the samples were taken under similar conditions. Recent illness, fasting and differences between labs can all shift a reading. Sharing both reports can help your clinician decide which changes are worth following.',
    null,['phenoage','validation','lab-intervals']);
  }
 }

 if(assessmentType==='kidney'&&system?.inputs?.creatinine){
  const {inputs,result}=system;
  const measurements=[reportReading('Blood creatinine',inputs.creatinine)];
  if(inputs.acr)measurements.push(reportReading('Urine albumin-to-creatinine ratio (ACR)',inputs.acr));
  if(inputs.cystatin)measurements.push(reportReading('Cystatin C',inputs.cystatin));
  if(result.issue==='kidney-collection'||result.issue==='kidney-treatment'){
   add('clinician','The circumstances of your test',
    'What was happening around the blood draw matters here. Your clinician can review this result in light of the health or treatment information you reported and decide whether a different test or another time point would give a clearer picture.',
    null,['kdigo-ckd'],measurements,['How might the timing of this blood draw or the care I’m receiving affect the result?']);
  }else{
   add('clinician','What a urine result can add',[
    (inputs.acr?`Your urine albumin-to-creatinine ratio was ${valueWithUnit(inputs.acr)}. `:'A urine result can answer a different question from the blood test. ')
     +'Albumin is a protein that usually stays in the blood. A urine albumin test looks for how much of it is passing into the urine. The urine albumin-to-creatinine ratio, sometimes called uACR, accounts for how concentrated the urine sample is. This gives your clinician a different piece of information alongside the filtration estimate.',
    (inputs.cystatin?`Your cystatin C was ${valueWithUnit(inputs.cystatin)}. `:'A second blood marker called cystatin C may also be useful. ')
     +'It gives your clinician another way to estimate filtration. Looking at earlier results can help show whether a difference is temporary or part of a pattern.',
    ],
    null,['kdigo-ckd','ckd-epi-2021'],measurements,[
     inputs.acr?'How do these readings compare with my previous results?':'Would urine albumin help explain this result?',
     inputs.cystatin?'What does the second filtration marker add, and when would you repeat the tests?':'Would cystatin C or a repeat creatinine test add useful information?',
    ]);
   if(Number.isFinite(system.review?.egfr)&&!answers.context?.includes('Receiving dialysis')){
    guidance.push({section:'context',name:'Why the timing of a kidney test matters',
     text:'Creatinine can shift after a meal. Tell your clinician when you last ate before the blood draw, especially if this result differs from an earlier one.',
     paragraphs:['If this blood result differs from an earlier one, think about what was happening on each test day. Even the timing of a meal can affect how much creatinine shows up in the blood for a few hours.'],
     measurements:[measurements[0]],sources:['creatinine-meal','kdigo-ckd'],
     study:{duration:'1–2 hours after eating',protocol:'In one study, researchers compared blood samples taken before and after a cooked-meat meal with samples taken around a meal without meat.',
      paragraphs:['One to two hours after the cooked-meat meal, the middle creatinine reading in the group rose from 80.5 to 101.0 µmol/L using one common laboratory method. A shift like that can also move the filtration estimate. If you and your clinician are comparing two reports, the timing of your last meal is one useful detail to mention.'],
      outcomes:[['Median creatinine','80.5 → 101.0 µmol/L','The median rose temporarily after the cooked-meat meal.']],
     },
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
   if(!matches.length||inputs.hba1c){
    add('clinician','Blood sugar in context',[
     inputs.hba1c?`Your HbA1c was ${valueWithUnit(inputs.hba1c)}. This test reflects your average blood sugar over the past few months. Recent blood loss and some conditions that affect red blood cells can change how a clinician interprets it.`:'',
     inputs.glucose&&!matches.length?`Your fasting blood sugar was ${valueWithUnit(inputs.glucose)}. That number describes how much sugar was in your blood at the time of the test.`:'',
     measurements.length?'A useful next question is which measurement gives you the clearest starting point and whether earlier results help explain it.'
      :'Your questionnaire looks at patterns linked to blood sugar over time. A fasting blood sugar test gives a reading from one point in time. An HbA1c test gives a view over the last few months. Your clinician can help decide which, if either, adds useful information in your case.',
     ],null,['gdrs','diabetes-diagnosis'],measurements,[
      inputs.hba1c?'Which result gives the clearest starting point for me, and when would you check it again?'
       :'Would an average blood sugar test (HbA1c) or a fasting blood sugar test be helpful for me?',
     ]);
   }
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
   measured?['The test setup and the effort you reached are part of what this number describes. If you have results from a different type of exercise test, bring both reports so your clinician can explain how the methods differ.']
    :[(inputs.pulse?`You recorded a resting pulse of ${valueWithUnit(inputs.pulse)}. `:'')+'The inputs that go into an estimate can change from day to day. If you take another resting measurement, using the same conditions and the same method makes it easier to see whether a difference reflects more than the way you took the reading.'],
   null,sources,measurements);
  if(!adaptActivity&&inputs.fitnessContext==='None of these'&&!matches.some(item=>item.coversMovement)){
   add('steps','Choose movement you can keep doing',
    'Aerobic activity gets you breathing faster. Walking, cycling and swimming are examples.',
    'If it suits your health, pick a form of movement you enjoy and build up at a pace you can keep.',['activity']);
  }
  add('clinician','When an exercise test adds context',
   measured?'The team that supervised your test can explain how you reached the final effort and how the result fits what you want to be able to do. That gives you a more useful comparison for a future test.'
    :'A supervised test measures how much oxygen you actually use during exercise. Whether that adds useful information depends on what you want to learn and how the result would guide a decision about your health or activity.',
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
   [matches.length?'The studies above help explain individual readings. At your visit, put them alongside earlier blood pressure and cholesterol results, any usual readings you’ve taken at home and any medicines you take. That gives your clinician a better picture of what is usual for you.'
    :(diastolic?`You recorded a blood pressure of ${systolic.value}/${diastolic.value} ${systolic.unit}. `:`You recorded a top blood pressure number of ${valueWithUnit(systolic)}. `)
     +'Blood pressure can vary with how and when it is measured. Your cholesterol results and health history help your clinician decide which readings to follow together.'],null,['who-blood-pressure'],
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
  add('clinician','Prepare for a conversation about your results',
   'Start with the reason you took this assessment. If there’s a result you want to understand, bring it and any earlier results to your next visit. Talking through what changed in your health or routine can help you and your clinician decide what to look at next.',null,[]);
 }
 return guidance;
}
