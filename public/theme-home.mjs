import {assessmentTitle,escapeHTML,instrumentFooterNote,resultInstrument,screenHeading,uiIcon} from './ui-components.mjs';
import {clinicalForDisplay} from './lab-safety.mjs';
import {HEART_ASSESSMENT,heartAgeReadout} from './heart-vascular.mjs';
import {systemAssessment} from './system-assessments.mjs';

export function overviewChoices(drafts,history){
 const byType=new Map();
 const add=(record,source)=>{
  const independent=record.assessmentType===HEART_ASSESSMENT||systemAssessment(record.assessmentType);
  const type=independent?record.assessmentType:record.labSubmitted||typeof record.value==='number'?'phenoage':null;
  if(type&&!byType.has(type)){
   const title=record.sample&&type==='phenoage'?'PhenoAge':assessmentTitle(record);
   byType.set(type,{type,title,sample:record.sample===true,[source]:record});
  }
 };
 for(const draft of drafts)if(draft?.assessment&&!draft.sample)add(draft,'draft');
 const newestFirst=[...history].reverse();
 for(const record of newestFirst)if(!record.sample)add(record,'saved');
 // A saved sample fills the slot when that assessment type has no personal result.
 for(const record of newestFirst)if(record.sample)add(record,'saved');
 return [...byType.values()];
}

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
   age:heart?.inputs.age??record.system?.inputs.age?.value??null,sample:record.sample===true,
   action:record.overviewSaved?'open-report':'report',recordId:record.overviewSaved?record.id:'',actionLabel:'Open your report'};
 }
 const c=clinicalForDisplay(record.clinical,{stored:!!record.overviewSaved}),valid=c&&!c.reason&&typeof c.value==='number'&&Number.isFinite(c.value);
 const gap=valid&&Number.isFinite(c.gap)?Math.round(c.gap):null;
 return {empty:false,hasProfile,profileOnly:!valid,withheld:!!c&&!valid,value:valid?Math.round(c.value):null,age:record.labAge??null,gap:gap===null?'—':gap>0?'+'+gap:String(gap===0?0:gap),sample:record.sample===true,action:record.overviewSaved?'open-saved':'results',recordId:record.overviewSaved?record.id:'',date:record.labDate||'',actionLabel:record.overviewSaved?'Open saved result':'Open your result'};
}

export function renderOverviewPicker(choices,selected){
 return `<div class="overview-options">${choices.map(choice=>{
  const current=choice.type===selected;
  const icon=choice.type==='phenoage'?'drop':systemAssessment(choice.type)?.icon||'pulse';
  return `<button class="overview-option" type="button" data-action="show-overview-result" data-type="${escapeHTML(choice.type)}" ${current?'aria-current="true"':''}>
   <span class="overview-option-icon">${uiIcon(icon)}</span><span>${escapeHTML(choice.title)}</span>
   ${choice.sample?'<small class="instrument-tag">Sample</small>':''}<span class="overview-option-check">${current?uiIcon('check'):''}</span>
  </button>`;
 }).join('')}</div>`;
}

// One shared screen, with theme identity expressed in materials.
export function renderThemeHome({age=45,sample=true,...presentation},{choices=[],selected,loadStatus='',loadingTitle,loadingSample=false}={}){
 const {empty=false,profileOnly=false,withheld=false,hasProfile=false}=presentation;
 const welcome=empty&&!loadStatus;
 const switchable=choices.length>1;
 const title=choices.find(choice=>choice.type===selected)?.title??loadingTitle??presentation.title??(empty?'Your first assessment':withheld?'Review your assessment':profileOnly?'Your health profile':'A look at the result');
 const subtitle=welcome?(hasProfile?'Your workspace is ready. Start your first assessment.':'Start an assessment. No profile needed.'):'';
 const instrument=loadStatus
  ? `<section class="result-instrument result-surface personal-result" aria-labelledby="result-instrument-title" data-theme-part ${switchable?'data-overview-swipe':''}>
      <div class="instrument-heading"><h2 id="result-instrument-title">${escapeHTML(title)}</h2><span class="instrument-tag">${loadingSample?'SAMPLE':'YOUR RESULT'}</span></div>
      <div class="instrument-stage"><div class="overview-load-state"><p role="status">${loadStatus==='error'?'Could not load your saved result.':'Loading your saved result…'}</p>${loadStatus==='error'?'<button class="text-link" data-action="retry-overview">Try again</button>':''}</div></div>
      ${switchable?`<div class="instrument-footer">${instrumentFooterNote(loadingSample?'Illustrative data · Not your result':'',true)}</div>`:''}
    </section>`
  : resultInstrument({age,sample,...presentation,title,switchable});
 return `<div class="wrap home-workspace app-screen">
  ${screenHeading('YOUR HEALTH',profileOnly?'Your health, in context.':'Your age, in context.',subtitle)}
  ${instrument}
  <div class="overview-actions" data-theme-part><button class="btn" data-action="assessments">${welcome?'Start assessment':'New assessment'} ${uiIcon('arrow')}</button><button class="overview-method text-btn" data-action="method" aria-label="Understand the method"><span>The method</span>${uiIcon('external')}</button></div>
  <p class="overview-footnote">For adults 18+ · Saving is optional</p>
 </div>`;
}
