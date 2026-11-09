import {profileProgress,provided} from './assessment-flow.mjs';
import {HEART_ASSESSMENT} from './heart-vascular.mjs';
import {labs,profileMeasurementErrors,validateQuestionnaire} from './model.mjs';
import {systemAssessment,systemField} from './system-assessments.mjs';

const known=value=>provided(value)&&(Array.isArray(value)
 ?value.some(answer=>!['Not sure','Prefer not to say'].includes(answer))
 :Boolean(String(value).trim())&&!['Not sure','Prefer not to say','Not recorded'].includes(value));
const coreProfileLabels={age:'Age',height:'Height',weight:'Weight'};

export function reportGoal(assessment){
 const {assessmentType,labSubmitted,goal}=assessment;
 if(assessmentType===HEART_ASSESSMENT||systemAssessment(assessmentType))return assessmentType;
 return labSubmitted||goal==='labs'?'labs':'profile';
}

export function reportReadiness(assessment,profile){
 const goal=reportGoal(assessment);
 const answers=profile?.answers||assessment.answers||{};
 const errors=validateQuestionnaire(answers,{requireAge:false});
 const profileFields=Object.keys(profileMeasurementErrors(answers)).map(id=>coreProfileLabels[id]);
 if(!['moderate','vigorous','limitations'].every(id=>!errors[id]&&known(answers[id])))profileFields.push('Weekly activity and any activity limits');
 if(!['conditions','medicines','context','illness'].every(id=>known(answers[id])))profileFields.push('Health history, medicines and recent health changes');
 if(!known(answers.smoking))profileFields.push('Cigarette smoking history');
 if(!known(answers.diet))profileFields.push('Usual fruit and vegetable intake');
 if(goal==='profile'&&!['sleep','rested'].every(id=>!errors[id]&&known(answers[id])))profileFields.push('Typical sleep and how rested you feel');
 const measurements=[];
 const helpful=[];
 let measurementHint='';
 let coverageNote='';
 if(goal==='labs'){
  measurements.push(...labs.filter(lab=>!known(assessment.lab?.[lab.id]?.value)).map(lab=>lab.name));
  if(!known(assessment.labDate))measurements.push('Date of the blood draw');
  if(!known(assessment.labFasting))measurements.push('Whether you fasted for the blood draw');
  if(!known(assessment.labAge))measurements.push('Age at the blood draw');
  measurementHint='Collection details help put your blood results in context.';
  if(assessment.labSubmitted&&(assessment.labFasting==='No'||assessment.labContext===false)){
   coverageNote='The report can explain your blood results. The age estimate requires a confirmed fasting sample and collection circumstances that fit the study.';
  }
 }else if(goal===HEART_ASSESSMENT){
  const inputs=assessment.heart?.inputs||{};
  if(!known(inputs.systolic?.value)||!known(inputs.diastolic?.value))measurements.push('Both blood pressure numbers');
  if(!known(inputs.total?.value)||!known(inputs.hdl?.value))measurements.push('Total and HDL cholesterol');
  if(!known(inputs.conditions)||!known(inputs.smoking))measurements.push('Heart and blood vessel history and smoking status');
  measurementHint='Both pressure numbers, cholesterol and your history help give a fuller picture.';
 }else if(systemAssessment(goal)){
  const {inputs={},result}=assessment.system||{};
  for(const id of result?.missing||[]){
   const label=systemField(goal,id)?.label;
   if(typeof label==='string')measurements.push(label);
  }
  if(goal==='metabolic'&&inputs.diabetes!=='Yes'&&inputs.pregnancy!=='Yes'&&!known(inputs.glucose?.value)&&!known(inputs.hba1c?.value)){
   helpful.push('Fasting glucose or HbA1c');
   measurementHint='A blood sugar result adds a direct measurement alongside your questionnaire answers.';
  }
  if(goal==='kidney'){
   if(!known(inputs.creatinine?.value))measurements.push('Creatinine');
   if(!['kidney-collection','kidney-treatment'].includes(result?.issue)){
    if(!known(inputs.acr?.value))helpful.push('Urine albumin result');
    if(!known(inputs.cystatin?.value))helpful.push('Cystatin C result');
   }
   measurementHint='Urine albumin and a second blood marker can add detail to a creatinine-based estimate.';
  }
  if(goal==='fitness'&&result?.method!=='FRIEND'){
   helpful.push('Supervised exercise test result');
   measurementHint='A supervised test can measure the oxygen uptake this assessment estimates.';
  }
 }
 const hasProfile=profileProgress(answers).answered>0;
 return {
  goal,profileFields,measurements:[...new Set(measurements)],helpful,measurementHint,coverageNote,
  source:hasProfile?(profile?.answers?profile.source:'assessment'):'missing',
  saved:profile?.saved,profileId:profile?.id,
  profileUnavailable:profile?.source==='unavailable',
  limited:profileFields.length>0||measurements.length>0||helpful.length>0||profile?.source==='unavailable',
 };
}
