import {resultInstrument,screenHeading,uiIcon} from './ui-components.mjs';

// Display only a current assessment or an immutable saved result, never an inferred age.
export function overviewPresentation(record,{hasProfile=false}={}){
 if(!record)return {empty:true,hasProfile,value:null,age:null,gap:null,sample:false,action:'sample'};
 const c=record.clinical,valid=c&&!c.reason&&typeof c.value==='number'&&Number.isFinite(c.value);
 const gap=valid&&Number.isFinite(c.gap)?Math.round(c.gap):null;
 return {empty:false,hasProfile,profileOnly:!valid,withheld:!!c&&!valid,value:valid?Math.round(c.value):null,age:record.labAge??null,gap:gap===null?'—':gap>0?'+'+gap:String(gap===0?0:gap),sample:record.sample===true,action:record.overviewSaved?'open-saved':'results',recordId:record.overviewSaved?record.id:'',date:record.labDate||'',actionLabel:record.overviewSaved?'Open saved result':'Open your result'};
}

// One shared screen, with theme identity expressed in materials.
export function renderThemeHome({value,gap,age=45,sample=true,empty=false,profileOnly=false,withheld=false,hasProfile=false,action='sample',actionLabel='',recordId='',date=''}){
 return `<div class="wrap home-workspace app-screen">
  ${screenHeading('YOUR HEALTH',profileOnly?'Your health, in context.':'Your age, in context.',empty?(hasProfile?'Your workspace is ready. Start your first assessment.':'Start an assessment. No profile needed.'):'A personal perspective, grounded in science.')}
  ${resultInstrument({value,gap,age,sample,empty,profileOnly,withheld,action,actionLabel,recordId,date,title:empty?'Your first assessment':withheld?'Review your assessment':profileOnly?'Your health profile':'A look at the result'})}
  <div class="overview-actions" data-theme-part><button class="btn" data-action="assessments">${empty?'Start assessment':'New assessment'} ${uiIcon('arrow')}</button><button class="overview-method text-btn" data-action="method" aria-label="Understand the method"><span>The method</span>${uiIcon('external')}</button></div>
  <p class="overview-footnote">For adults 18+ · Saving is optional</p>
 </div>`;
}
