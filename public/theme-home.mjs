import {escapeHTML,resultInstrument,screenHeading,uiIcon} from './ui-components.mjs';
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
export function renderThemeHome({age=45,sample=true,...presentation},{choices=[],selected,loadStatus='',loadingTitle}={}){
 const {empty=false,profileOnly=false,withheld=false,hasProfile=false}=presentation;
 const welcome=empty&&!loadStatus;
 const picker=choices.length>1?'<select id="overview-result" class="overview-result-select" aria-label="Assessment result">'+choices.map(({type,label})=>`<option value="${escapeHTML(type)}" ${type===selected?'selected':''}>${escapeHTML(label)}</option>`).join('')+'</select>':'';
 const title=(picker?choices.find(choice=>choice.type===selected)?.label:null)??presentation.title??(empty?'Your first assessment':withheld?'Review your assessment':profileOnly?'Your health profile':'A look at the result');
 const instrument=loadStatus
  ? `<section class="result-instrument result-surface personal-result" aria-labelledby="result-instrument-title" data-theme-part>
      <div class="instrument-heading"><h2 id="result-instrument-title" ${picker?'class="sr-only"':''}>${escapeHTML(loadingTitle)}</h2>${picker}<span class="instrument-tag">YOUR RESULT</span></div>
      <div class="instrument-stage"><div class="overview-load-state"><p role="status">${loadStatus==='error'?'Could not load your saved result.':'Loading your saved result…'}</p>${loadStatus==='error'?'<button class="text-link" data-action="retry-overview">Try again</button>':''}</div></div>
    </section>`
  : resultInstrument({age,sample,...presentation,title,headingControl:picker});
 return `<div class="wrap home-workspace app-screen">
  ${screenHeading('YOUR HEALTH',profileOnly?'Your health, in context.':'Your age, in context.',welcome?(hasProfile?'Your workspace is ready. Start your first assessment.':'Start an assessment. No profile needed.'):'A personal perspective, grounded in science.')}
  ${instrument}
  <div class="overview-actions" data-theme-part><button class="btn" data-action="assessments">${welcome?'Start assessment':'New assessment'} ${uiIcon('arrow')}</button><button class="overview-method text-btn" data-action="method" aria-label="Understand the method"><span>The method</span>${uiIcon('external')}</button></div>
  <p class="overview-footnote">For adults 18+ · Saving is optional</p>
 </div>`;
}
