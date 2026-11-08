import {sections,labs} from './model.mjs';
import {REFERENCE_CATALOG_VERSION} from './lab-reference-catalog.mjs';
import {HEART_ASSESSMENT} from './heart-vascular.mjs';

export const provided=value=>value!==undefined&&value!==null&&value!==''&&(!Array.isArray(value)||value.length>0);
export function assessmentProgress(state){
 if(state.assessmentType===HEART_ASSESSMENT)return {hasData:Object.values(state.heart?.inputs||{}).some(value=>provided(value&&typeof value==='object'?value.value:value))};
 const questions=sections.flatMap(section=>section.questions.filter(q=>!q.show||q.show(state.answers||{})));
 const answered=questions.filter(q=>provided(state.answers?.[q.id])).length;
 const measurements=labs.filter(lab=>provided(state.lab?.[lab.id]?.value)).length;
 return {answered,total:questions.length,measurements,hasData:answered>0||measurements>0||provided(state.labAge)||provided(state.labDate)};
}
export function freshAssessment(goal='profile'){
 return {view:'consent',step:0,questionIndex:0,optionPage:0,labStep:0,resultTab:'summary',reportTab:'summary',libraryPage:0,answers:{},lab:{},labAge:'',labDate:'',labReferenceMode:'published',labReferenceGroup:'unspecified',labReferenceVersion:REFERENCE_CATALOG_VERSION,consent:false,goal,sample:false,errors:{},unlocked:false,assessment:false,profileCompleted:false,accountTab:'history',...(goal===HEART_ASSESSMENT?{assessmentType:HEART_ASSESSMENT,heartStep:0,heart:{inputs:{}}}:{})};
}
// Profile and blood entry share a draft. Heart & Vascular has its own draft.
export function continueAssessment(state,goal){
 if(goal===HEART_ASSESSMENT)return {...state,goal,errors:{},view:state.consent?'heart':'consent'};
 const step=goal==='labs'?(state.labSubmitted?0:state.labStep||0):state.step||0;
 return {...state,goal,errors:{},...(goal==='labs'?{labStep:step}:{step}),view:state.consent?(goal==='labs'?'labs':state.profileCompleted?'review':'questionnaire'):'consent'};
}
