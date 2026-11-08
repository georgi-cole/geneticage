import {resultInstrument,screenHeading,uiIcon} from './ui-components.mjs';
import {clinicalForDisplay} from './lab-safety.mjs';
import {HEART_ASSESSMENT,heartAgeReadout} from './heart-vascular.mjs';
import {systemAssessment} from './system-assessments.mjs';

// Display only a current assessment or an immutable saved result, never an inferred age.
export function overviewPresentation(record,{hasProfile=false}={}){
 if(!record)return {empty:true,hasProfile,value:null,age:null,gap:null,sample:false,action:'sample'};
 const heart=record.assessmentType===HEART_ASSESSMENT?record.heart:null,spec=systemAssessment(record.assessmentType);
 if(heart||spec){
  const result=heart?.result??record.system?.result;
  const ready=result&&(heart?!result.reason:result.status==='ready');
  const readout=ready?(heart?heartAgeReadout(result):{age:result.age,direction:result.ageRange,boundary:result.boundary,band:result.ageBand}):{};
  const comparison=readout.band
   ? {label:'Study age group',value:readout.band.from+'–'+readout.band.to,unit:'years'}
   : {label:'Method',value:result?.method||'—'};
  return {hasProfile,withheld:!ready,value:readout.age??null,boundary:readout.boundary,direction:readout.direction,comparison,
   title:spec?.title??'Heart & Vascular',readoutLabel:spec?.readout??'APPROXIMATE VASCULAR AGE',caption:'STUDY REFERENCE',
   ageLabel:record.assessmentType==='kidney'?'Age at blood draw':record.assessmentType==='fitness'?'Age at measurement':'Your age',
   age:heart?.inputs.age??record.system?.inputs.age?.value??null,sample:false,
   action:record.overviewSaved?'open-report':'report',recordId:record.overviewSaved?record.id:'',actionLabel:'Open your report'};
 }
 const c=clinicalForDisplay(record.clinical,{stored:!!record.overviewSaved}),valid=c&&!c.reason&&typeof c.value==='number'&&Number.isFinite(c.value);
 const gap=valid&&Number.isFinite(c.gap)?Math.round(c.gap):null;
 return {empty:false,hasProfile,profileOnly:!valid,withheld:!!c&&!valid,value:valid?Math.round(c.value):null,age:record.labAge??null,gap:gap===null?'—':gap>0?'+'+gap:String(gap===0?0:gap),sample:record.sample===true,action:record.overviewSaved?'open-saved':'results',recordId:record.overviewSaved?record.id:'',date:record.labDate||'',actionLabel:record.overviewSaved?'Open saved result':'Open your result'};
}

// One shared screen, with theme identity expressed in materials.
export function renderThemeHome({value,gap,age=45,sample=true,empty=false,profileOnly=false,withheld=false,hasProfile=false,action='sample',actionLabel='',recordId='',date='',title,readoutLabel,caption,ageLabel,comparison,boundary,direction}){
 return `<div class="wrap home-workspace app-screen">
  ${screenHeading('YOUR HEALTH',profileOnly?'Your health, in context.':'Your age, in context.',empty?(hasProfile?'Your workspace is ready. Start your first assessment.':'Start an assessment. No profile needed.'):'A personal perspective, grounded in science.')}
  ${resultInstrument({value,gap,age,sample,empty,profileOnly,withheld,action,actionLabel,recordId,date,readoutLabel,caption,ageLabel,comparison,boundary,direction,title:title??(empty?'Your first assessment':withheld?'Review your assessment':profileOnly?'Your health profile':'A look at the result')})}
  <div class="overview-actions" data-theme-part><button class="btn" data-action="assessments">${empty?'Start assessment':'New assessment'} ${uiIcon('arrow')}</button><button class="overview-method text-btn" data-action="method" aria-label="Understand the method"><span>The method</span>${uiIcon('external')}</button></div>
  <p class="overview-footnote">For adults 18+ · Saving is optional</p>
 </div>`;
}
