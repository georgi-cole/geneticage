import {sections,labs,DECLINED_ANSWER,validateQuestionnaire} from './model.mjs';
import {REFERENCE_CATALOG_VERSION} from './lab-reference-catalog.mjs';
import {HEART_ASSESSMENT} from './heart-vascular.mjs';
import {systemAssessment} from './system-assessments.mjs';

export const provided=value=>value!==undefined&&value!==null&&value!==''&&(!Array.isArray(value)||value.length>0);
export function profileSectionProgress(answers={}){
 const errors=validateQuestionnaire(answers,{requireAge:false});
 return sections.map(({name,questions})=>{
  const applicable=questions.filter(question=>!question.show||question.show(answers));
  const answered=applicable.filter(({id})=>{
   const value=answers[id];
   if(errors[id]||!provided(value))return false;
   if(Array.isArray(value))return value.some(item=>item!==DECLINED_ANSWER);
   return typeof value!=='string'||Boolean(value.trim())&&value!==DECLINED_ANSWER;
  }).length;
  return {name,answered,total:applicable.length};
 });
}
export function profileProgress(answers){
 return profileSectionProgress(answers).reduce((progress,section)=>({
  answered:progress.answered+section.answered,total:progress.total+section.total,
 }),{answered:0,total:0});
}
export function assessmentProgress(state){
 if(state.assessmentType===HEART_ASSESSMENT)return {hasData:Object.values(state.heart?.inputs||{}).some(value=>provided(value&&typeof value==='object'?value.value:value))};
 if(systemAssessment(state.assessmentType))return {hasData:Object.values(state.system?.inputs||{}).some(value=>provided(value&&typeof value==='object'?value.value:value))};
 const {answered,total}=profileProgress(state.answers);
 const measurements=labs.filter(lab=>provided(state.lab?.[lab.id]?.value)).length;
 const hasAnswers=Object.values(state.answers||{}).some(provided);
 return {answered,total,measurements,hasData:hasAnswers||measurements>0||provided(state.labAge)||provided(state.labDate)};
}
export function previousAssessment(history,goal){
 const matches=record=>{
  if(goal==='labs')return record.labSubmitted||typeof record.value==='number';
  if(goal==='profile')return record.hasProfile&&(!record.sample||!record.labSubmitted);
  return record.assessmentType===goal;
 };
 return history.findLast(record=>!record.sample&&matches(record))||history.findLast(matches);
}
export function freshAssessment(goal='profile'){
 return {view:'consent',step:0,questionIndex:0,labStep:0,resultTab:'summary',reportTab:'summary',libraryPage:0,answers:{},lab:{},labAge:'',labDate:'',labReferenceMode:'published',labReferenceVersion:REFERENCE_CATALOG_VERSION,consent:false,goal,sample:false,errors:{},unlocked:false,assessment:false,profileCompleted:false,accountTab:'history',...(goal===HEART_ASSESSMENT?{assessmentType:HEART_ASSESSMENT,heartStep:'country',heart:{inputs:{}}}:systemAssessment(goal)?{assessmentType:goal,system:{inputs:{}},systemStep:'age',systemPrefilled:[],systemTouched:{}}:{})};
}
// Profile and blood entry share a draft. Each system assessment has its own.
export function continueAssessment(state,goal){
 if(goal===HEART_ASSESSMENT)return {...state,goal,errors:{},view:state.consent?'heart':'consent'};
 if(systemAssessment(goal))return {...state,goal,errors:{},view:state.consent?'system':'consent'};
 const step=goal==='labs'?(state.labSubmitted?0:state.labStep||0):state.step||0;
 return {...state,goal,errors:{},...(goal==='labs'?{labStep:step}:{step}),view:state.consent?(goal==='labs'?'labs':state.profileCompleted?'review':'questionnaire'):'consent'};
}
