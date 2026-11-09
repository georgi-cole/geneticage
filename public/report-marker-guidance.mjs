import {profileBmi} from './model.mjs';

const onlyNone=answers=>answers?.length===1&&answers[0]==='None';
const includesAny=(values,choices)=>choices.some(value=>values?.includes(value));
export const reportReading=(name,{value,unit})=>`${name} · ${value}${unit?' '+unit:''}`;

export function activityNeedsReview(answers={}){
 return ['Sometimes','Often'].includes(answers.limitations)||answers.illness==='Yes'
  ||includesAny(answers.conditions,['Heart or blood-vessel disease','Long-term lung disease','Kidney disease','Diabetes'])
  ||includesAny(answers.context,['Pregnant','Recently gave birth','Receiving dialysis','Recovering from major surgery']);
}

const glucoseStudy={
 duration:'6 months',
 protocol:'In a six-month study called STRRIDE-PD, one group received coaching on food and weight while gradually building up moderate exercise, mostly on a treadmill. They averaged about 150 minutes over three sessions each week. The researchers asked them to attend at least two supervised sessions a week.',
 paragraphs:[
  'By the end of the program, fasting blood sugar fell by an average of 0.32 mmol/L, or about 6 mg/dL. Triglycerides, a type of fat in the blood, fell by 0.34 mmol/L, or about 30 mg/dL. Both changes were measured in the group that worked on food and activity together.',
 ],
 outcomes:[
  ['Fasting blood sugar','−0.32 mmol/L','About 6 mg/dL lower on average in the combined group.'],
  ['Triglycerides (blood fats)','−0.34 mmol/L','About 30 mg/dL lower on average in the same group.'],
 ],
 contrast:'The vigorous-exercise group averaged 165 minutes over about three sessions a week. At peak exercise they used 0.18 litres more oxygen per minute on average. Their fasting blood sugar showed no clear change.',
};

function fastingGlucoseStep(assessment,aboveGuide,profileAnswers) {
 const {answers={},clinical,lab,labAge,labSubmitted,labFasting,labContext,system,assessmentType}=assessment;
 const metabolic=assessmentType==='metabolic';
 const glucose=metabolic?system?.inputs?.glucose:lab?.glucose;
 if(!glucose)return null;
 if([answers,profileAnswers].some(details=>details&&(activityNeedsReview(details)
  ||includesAny(details.medicines,['Diabetes medicine','Blood-pressure medicine'])
  ||['Smoke now','Every day','Some days'].includes(details.smoking))))return null;
 const value=Number(glucose.value);
 const inStudyRange=glucose.unit==='mg/dL'?value>=100&&value<=125
  :glucose.unit==='mmol/L'&&value>=5.6&&value<=6.94;
 const age=Number(metabolic?system.inputs.age?.value:labAge);
 if(!inStudyRange||age<45||age>75||!Number.isFinite(age))return null;

 const markers=[reportReading('Fasting blood sugar',glucose)];
 const paragraphs=[
  `Your fasting blood sugar was ${glucose.value} ${glucose.unit}. This measures how much sugar was in your blood at the time of the test. Your reading was above the comparison range, so it’s worth asking whether it was a one-off result or part of a pattern. HbA1c, a test that reflects your average blood sugar over the last few months, can help with that question.`,
 ];
 let action='Ask your clinician whether repeating the fasting test or trying a structured food-and-activity program would be useful for you.';
 let coversMovement=false;
 let fit='Your age and fasting result are within the study’s entry ranges. The researchers also used body measurements and confirmed elevated blood sugar on two fasting tests.';
 if(metabolic){
  const {inputs,review,result}=system;
  if(result?.status!=='ready'||inputs.diabetes!=='No'||inputs.pregnancy!=='No'||inputs.hypertension!=='No'
   ||inputs.smoking==='Current smoker'||review?.fields?.glucose?.comparison?.status!=='above')return null;
  if(inputs.activity)markers.push(reportReading('Activity you reported',inputs.activity));
  const bmi=profileBmi(profileAnswers||answers);
  if(Number.isFinite(bmi)&&(bmi<25||bmi>35))return null;
 }else{
  const recordedBmi=profileBmi(answers);
  const bmi=recordedBmi??profileBmi(profileAnswers);
  if(!labSubmitted||labFasting!=='Yes'||labContext!==true||!aboveGuide||!Number.isFinite(clinical?.value)||clinical.reason||clinical.withheld
   ||!Number.isFinite(bmi)||bmi<25||bmi>35)return null;
  const context=answers.conditions?.length||answers.context?.length||answers.illness?answers:profileAnswers;
  if(!onlyNone(context?.conditions)||!onlyNone(context?.context)||context.illness!=='No')return null;
  fit=recordedBmi===null
   ?'Your age at the draw and fasting result are within the study’s ranges. Your BMI comes from a separate health profile. The study enrolled adults with low activity and confirmed elevated blood sugar on two fasting tests.'
   :'Your age at the draw, recorded BMI and fasting result are within the study’s ranges. The study enrolled adults with low activity and confirmed elevated blood sugar on two fasting tests.';
 }
 const activity=profileAnswers||(!metabolic?answers:null);
 if(activity&&[activity.moderate,activity.vigorous].every(value=>(typeof value==='number'||typeof value==='string'&&value.trim())&&Number.isFinite(Number(value))&&Number(value)>=0)){
  const moderate=Number(activity.moderate),vigorous=Number(activity.vigorous);
  markers.push(`Moderate activity · ${moderate} min/week`,`Vigorous activity · ${vigorous} min/week`);
  const usualActivity=moderate===0&&vigorous===0?'You recorded no moderate or vigorous activity in a typical week.'
   :vigorous===0?`You reported about ${moderate} minutes of moderate activity in a typical week, with no vigorous activity.`
    :`You reported ${moderate} minutes of moderate activity and ${vigorous} minutes of vigorous activity in a typical week.`;
  paragraphs.push(usualActivity+' That gives you and your clinician a starting point for talking about what could fit into your routine.');
  if(activity.limitations==='No'&&moderate+2*vigorous<150){
   coversMovement=true;
   action='If walking suits your health, one option to discuss is building on the activity you already do and pairing it with a food change you could keep up. Your clinician can help you choose a starting point and decide which blood test would tell you whether it’s helping.';
  }else if(moderate+2*vigorous>=150){
   action='You already reach the WHO’s general activity starting target. Bring your activity pattern and the fasting result to your next visit to discuss whether a repeat test or changes to eating would help.';
  }
 }
 return {
  section:'matched',name:'What your fasting blood sugar can tell you',measurements:markers,coversMovement,paragraphs,
  text:markers.length>1?'Your fasting blood sugar was above the comparison range. The activity you recorded gives you a starting point for choosing a next step.'
   :'Your fasting blood sugar was above the comparison range. Bring this reading to your next visit to discuss what follow-up fits.',
  evidence:'In a six-month study of inactive adults aged 45 to 75 with elevated fasting blood sugar, the group that combined dietary changes and regular exercise averaged a drop of 0.32 mmol/L (about 6 mg/dL). That was the result of the full program.',
  study:{...glucoseStudy,fit},
  visit:[
   'Given my health history and medications, what type and intensity of activity would suit me?',
   'Should we follow fasting blood sugar or HbA1c, and when would you want to check it again?',
  ],
  action,sources:['strride-pd','activity','diabetes-diagnosis'],
 };
}

function heartMarkerSteps(heart,answers) {
 const {inputs,review,result}=heart||{};
 if(!inputs||!result||inputs.conditions!=='No'||result.reason||review?.pressureWarning||review?.fields?.glucose?.check?.warning
  ||includesAny(answers.conditions,['Heart or blood-vessel disease','Kidney disease','Diabetes'])
  ||includesAny(answers.context,['Pregnant','Receiving dialysis']))return [];
 const steps=[];
 const top=Number(inputs.systolic?.value),bottom=Number(inputs.diastolic?.value);
 const age=Number(inputs.age);
 if(age>=22&&inputs.systolic?.unit==='mmHg'&&top>=140&&top<=159&&(!inputs.diastolic||bottom<=95)
  &&review?.fields?.systolic?.check?.status==='ok'&&inputs.bpTreatment!=='Yes'&&!answers.medicines?.includes('Blood-pressure medicine')){
  steps.push({
   section:'matched',name:'Less salt and the top blood pressure number',
   measurements:[reportReading('Systolic blood pressure',inputs.systolic),...(inputs.diastolic?[reportReading('Diastolic blood pressure',inputs.diastolic)]:[])],
   text:'Systolic is the top number. It measures pressure when your heart beats. Several readings give a clearer picture of your usual blood pressure.',
   paragraphs:[
    (inputs.diastolic?`You entered a blood pressure of ${top}/${bottom} mmHg. `:`You entered a top blood pressure number of ${top} mmHg. `)
     +'The top number, called systolic pressure, tells you how much pressure there is when your heart beats. The bottom number measures the pressure between beats. Because blood pressure changes through the day, a few readings taken in the same way can give a clearer picture of what’s usual for you.',
   ],
   evidence:'In the DASH-Sodium feeding trial, reducing sodium lowered systolic blood pressure on average in adults with above-optimal or mildly elevated readings.',
   study:{
    duration:'30 days at each sodium level',
    protocol:'The DASH-Sodium researchers wanted to see how much difference the salt in food could make. They provided meals so that participants could spend 30 days at each of three levels of sodium, a mineral in salt, while keeping the rest of their assigned diet consistent.',
    paragraphs:['On the comparison diet, moving from the higher to the middle sodium level lowered the top number by an average of 2.1 mmHg. That gives you a specific reading to discuss and a practical question about where salt comes from in your usual meals.'],
    outcomes:[
     ['Systolic blood pressure','−2.1 mmHg','Average drop from the higher to the middle sodium level on the comparison diet.'],
    ],
    fit:inputs.diastolic&&bottom<80
     ?'Your top number is within the trial’s range. Your bottom number is below the range used to enroll participants. Bring both readings to your clinician.'
     :'Your top number is within the range studied. Researchers used both numbers and screened for medicines that affect blood pressure.',
   },
   visit:[
    'Is reducing sodium a good fit for my readings and medical history?',
    'Would a home blood pressure log help, and how would you like me to take and review the readings?',
   ],
   action:'Compare the sodium on two versions of a packaged food you buy regularly and choose the lower one if it fits your care plan.',
   sources:['dash-sodium','who-sodium'],
  });
 }
 if(age>=50&&age<=75&&inputs.total&&review?.fields?.total?.comparison?.status==='above'
  &&review.fields.total.check?.status==='ok'&&!answers.medicines?.includes('Cholesterol-lowering medicine')){
  steps.push({
   section:'matched',name:'A cooking swap and total cholesterol',
   measurements:[reportReading('Total cholesterol',inputs.total),...(inputs.hdl?[reportReading('HDL cholesterol',inputs.hdl)]:[])],
   text:'Total cholesterol includes HDL and other types of cholesterol. Your clinician can use those individual results to give the total more context.',
   paragraphs:[
    `Your total cholesterol was ${inputs.total.value} ${inputs.total.unit}. `
     +(inputs.hdl?`Your HDL cholesterol was ${inputs.hdl.value} ${inputs.hdl.unit}. `:'')
     +'Think of total cholesterol as a summary. The individual results, including LDL and HDL, tell your clinician which kinds of cholesterol make up that total and which result is most useful to follow.',
   ],
   evidence:'In a four-week randomized trial of adults aged 50 to 75, total cholesterol rose more in the butter group than in the olive oil group. WHO recommends replacing saturated fats with unsaturated fats where possible.',
   study:{
    duration:'4 weeks',
    protocol:'A four-week trial compared three familiar cooking fats. Adults were assigned olive oil, coconut oil or butter, with each group receiving 50 grams of its assigned fat a day as part of the experiment.',
    paragraphs:['Total cholesterol rose less in the olive oil group than in the butter group, by 0.38 mmol/L on average. The researchers also measured LDL separately and found it was lower in the olive oil group relative to butter. If you often cook with butter, that makes the choice of cooking fat a concrete topic to discuss.'],
    outcomes:[
     ['Total cholesterol','0.38 mmol/L less rise','Difference in average change in the olive oil group compared with the butter group.'],
     ['LDL cholesterol','Lower with olive oil','The study measured LDL separately from total cholesterol.'],
    ],
    fit:'Your age is within the study’s 50 to 75 age range. Participants had no known heart disease or diabetes and were screened for cholesterol medicines.',
   },
   visit:[
    'Which cholesterol result should I follow, and what would a useful change look like for me?',
    'If I make a cooking swap, when would a repeat cholesterol test tell us something useful?',
   ],
   action:'If you cook with butter, try using olive oil in a familiar dish where the swap works for you. Follow any dietary guidance you already have.',
   sources:['khaw-dietary-fats','who-dietary-fats'],
  });
 }
 return steps;
}

function fitnessTrainingStep(system,answers){
 const {inputs,result,review}=system||{};
 if(result?.method!=='HUNT'||!Number.isFinite(review?.estimatedVo2)||!inputs?.moderate||!inputs.vigorous
  ||inputs.fitnessContext!=='None of these'||!onlyNone(answers.conditions)||!onlyNone(answers.medicines)
  ||!onlyNone(answers.context)||answers.illness!=='No'||answers.limitations!=='No'||Number(inputs.moderate?.value)+Number(inputs.vigorous?.value)>=60)return null;
 const activity=Number(answers.moderate)+Number(answers.vigorous);
 if(!Number.isFinite(activity)||answers.moderate===''||answers.vigorous===''||activity>=60)return null;
 return {
  section:'matched',name:'What structured training can change',coversMovement:true,
  text:'Peak oxygen uptake measures how much oxygen your body can use during hard exercise. It’s the fitness measure the researchers tested.',
  paragraphs:[`You recorded ${inputs.moderate.value} minutes of moderate and ${inputs.vigorous.value} minutes of vigorous activity per week in this assessment. That can help you and your clinician decide whether a structured activity program would suit where you’re starting.`,
   'If the goal is to build stamina, peak oxygen uptake gives you a specific measure to follow. It describes how much oxygen your body can use when you’re working hard.'],
  measurements:[`Estimated oxygen uptake · ${review.estimatedVo2.toFixed(1)} mL/kg/min`,
   reportReading('Moderate activity',inputs.moderate),reportReading('Vigorous activity',inputs.vigorous)],
  study:{duration:'6 months',protocol:'In a six-month study of previously inactive adults, the supervised group worked toward four 43-minute fitness sessions a week. A second group followed a step-count walking program.',
   paragraphs:['Measured peak oxygen uptake improved by about 9% on average in the supervised group. The step-count group showed no clear change on that test. If you want to know whether your stamina is changing, that distinction can help you decide which measurement to use.'],
   outcomes:[['Peak oxygen uptake','About 9% higher','Average gain in the supervised training group. The walking group had no clear change on this test.']],
   fit:'You reported less than an hour of weekly activity in both assessments. The study measured oxygen uptake during an exercise test. Your fitness assessment estimates it from your answers and readings.'},
  visit:['Is a supervised program appropriate for me, and what starting level makes sense?',
   'Would an exercise test help us measure change, and when would repeating it be useful?'],
  sources:['bell-fitness-training','activity'],
 };
}

export function markerGuidance(assessment,aboveFastingGuide,profileAnswers) {
 const glucose=fastingGlucoseStep(assessment,aboveFastingGuide,profileAnswers);
 const answers=profileAnswers||assessment.answers||{};
 const fitness=assessment.assessmentType==='fitness'?fitnessTrainingStep(assessment.system,answers):null;
 return [...(glucose?[glucose]:[]),...heartMarkerSteps(assessment.heart,answers),...(fitness?[fitness]:[])];
}
