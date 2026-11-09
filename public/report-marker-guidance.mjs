import {profileBmi} from './model.mjs';

const onlyNone=answers=>answers?.length===1&&answers[0]==='None';
const reading=(name,entry)=>`${name} · ${entry.value} ${entry.unit}`;

function fastingGlucoseStep(assessment, aboveGuide) {
 const {answers={},clinical,lab,labAge,labSubmitted,labFasting,labContext,system,assessmentType}=assessment;
 const metabolic=assessmentType==='metabolic';
 const glucose=metabolic?system?.inputs?.glucose:lab?.glucose;
 if(!glucose)return null;
 const value=Number(glucose.value);
 const inStudyRange=glucose.unit==='mg/dL'?value>=100&&value<=125
  :glucose.unit==='mmol/L'&&value>=5.6&&value<=6.94;
 const age=Number(metabolic?system.inputs.age?.value:labAge);
 if(!inStudyRange||age<45||age>75||!Number.isFinite(age))return null;

 const markers=[reading('Fasting blood sugar',glucose)];
 let action='Ask your clinician whether repeating the fasting test or trying a structured food-and-activity program would be useful for you.';
 let coversMovement=false;
 if(metabolic){
  const {inputs,review,result}=system;
  if(result?.status!=='ready'||inputs.diabetes!=='No'||inputs.pregnancy!=='No'||inputs.hypertension!=='No'
   ||inputs.smoking==='Current smoker'||review?.fields?.glucose?.comparison?.status!=='above')return null;
  if(inputs.activity)markers.push(reading('Activity you reported',inputs.activity));
 }else{
  const bmi=profileBmi(answers);
  if(!labSubmitted||labFasting!=='Yes'||labContext!==true||!aboveGuide||!Number.isFinite(clinical?.value)||clinical.reason||clinical.withheld
   ||!onlyNone(answers.conditions)||!onlyNone(answers.context)||answers.illness!=='No'
   ||!Number.isFinite(bmi)||bmi<25||bmi>35||['Smoke now','Every day','Some days'].includes(answers.smoking))return null;
  if([answers.moderate,answers.vigorous].every(value=>(typeof value==='number'||typeof value==='string'&&value.trim())&&Number.isFinite(Number(value))&&Number(value)>=0)){
   const moderate=Number(answers.moderate),vigorous=Number(answers.vigorous);
   markers.push(`Moderate activity · ${moderate} min/week`,`Vigorous activity · ${vigorous} min/week`);
   if(answers.limitations==='No'&&moderate+2*vigorous<150){
    coversMovement=true;
    action='If walking suits your health, try adding a short walk after a meal you have most days. Ask your clinician whether a program that combines food changes and activity fits this result.';
   }else if(moderate+2*vigorous>=150){
    action='You already reach the WHO’s general activity starting target. Bring your activity pattern and the fasting result to your next visit to discuss whether a repeat test or changes to eating would help.';
   }
  }
 }
 return {
  section:'matched',name:'Food and activity for fasting blood sugar',measurements:markers,coversMovement,
  text:markers.length>1?'Your fasting blood sugar was above the comparison range. The activity you recorded gives you a starting point for choosing a next step.'
   :'Your fasting blood sugar was above the comparison range. Bring this reading to your next visit to discuss what follow-up fits.',
  evidence:'In a six-month study of inactive adults aged 45 to 75 with elevated fasting blood sugar, the group that combined dietary changes and regular exercise averaged a drop of 0.32 mmol/L (about 6 mg/dL). That was the result of the full program.',
  action,sources:['strride-pd','activity','diabetes-diagnosis'],
 };
}

function heartMarkerSteps(heart) {
 const {inputs,review,result}=heart||{};
 if(!inputs||!result||inputs.conditions!=='No'||result.reason||review?.pressureWarning||review?.fields?.glucose?.check?.warning)return [];
 const steps=[];
 const top=Number(inputs.systolic?.value),bottom=Number(inputs.diastolic?.value);
 if(inputs.systolic?.unit==='mmHg'&&top>=140&&top<=159&&(!inputs.diastolic||bottom<=95)
  &&review?.fields?.systolic?.check?.status==='ok'&&inputs.bpTreatment!=='Yes'){
  steps.push({
   section:'matched',name:'Less salt and the top blood pressure number',
   measurements:[reading('Systolic blood pressure',inputs.systolic),...(inputs.diastolic?[reading('Diastolic blood pressure',inputs.diastolic)]:[])],
   text:'Systolic is the top number. It measures pressure when your heart beats. Several readings give a clearer picture of your usual blood pressure.',
   evidence:'In the DASH-Sodium feeding trial, reducing sodium lowered systolic blood pressure on average in adults with above-optimal or mildly elevated readings.',
   action:'Compare the sodium on two versions of a packaged food you buy regularly and choose the lower one if it fits your care plan.',
   sources:['dash-sodium','who-sodium'],
  });
 }
 const age=Number(inputs.age);
 if(age>=50&&age<=75&&inputs.total&&review?.fields?.total?.comparison?.status==='above'
  &&review.fields.total.check?.status==='ok'){
  steps.push({
   section:'matched',name:'A cooking swap and total cholesterol',
   measurements:[reading('Total cholesterol',inputs.total),...(inputs.hdl?[reading('HDL cholesterol',inputs.hdl)]:[])],
   text:'Total cholesterol includes HDL and other types of cholesterol. Your clinician can use those individual results to give the total more context.',
   evidence:'In a four-week randomized trial of adults aged 50 to 75, total cholesterol rose more in the butter group than in the olive oil group. WHO recommends replacing saturated fats with unsaturated fats where possible.',
   action:'If you cook with butter, try using olive oil in a familiar dish where the swap works for you. Follow any dietary guidance you already have.',
   sources:['khaw-dietary-fats','who-dietary-fats'],
  });
 }
 return steps;
}

export function markerGuidance(assessment, aboveFastingGuide) {
 const glucose=fastingGlucoseStep(assessment,aboveFastingGuide);
 return [...(glucose?[glucose]:[]),...heartMarkerSteps(assessment.heart)];
}
