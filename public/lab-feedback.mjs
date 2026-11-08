import {reviewLabReference,validateLabReferences} from './lab-review.mjs';
import {reviewLabSafety} from './lab-safety.mjs';
import {escapeHTML as esc} from './ui-components.mjs';
import {labs} from './lab-definitions.mjs';

export function clinicalCheckSummary(clinical){
 const checks=clinical?.checks||[];
 return checks.length?`<div class="clinical-check-summary">${checks.map(check=>`<div class="clinical-check-row ${check.warning?'critical':''}"><span aria-hidden="true">${check.warning?'△':'?'}</span><strong>${esc(labs.find(lab=>lab.id===check.id)?.name||check.id)}</strong><span>${check.warning?'Potentially critical result':check.status==='invalid'?'Check the entry':'Age estimate unavailable'}</span>${check.warning?`<a href="${check.warning.url}" target="_blank" rel="noopener noreferrer">${esc(check.warning.source)} ↗</a>`:''}</div>`).join('')}</div>`:'';
}

export function safetyMarkup(check,{reviewTitle='Age estimate unavailable',reviewText='Check the value and unit against your lab report.'}={}){
 const input=['invalid','review'].includes(check.status)?`<div class="lab-entry-note"><span class="lab-check-symbol" aria-hidden="true">?</span><div><strong>${check.status==='invalid'?'Check the entry':esc(reviewTitle)}</strong><p>${esc(check.status==='invalid'?check.message:reviewText)}</p>${check.coverage?`<details class="coverage-explanation"><summary>Why?</summary><p>Correct results can fall outside this prototype’s estimation coverage. Ask your laboratory or clinician if unsure.</p><a href="${check.coverage.url}" target="_blank" rel="noopener noreferrer">Estimation coverage source ↗</a></details>`:''}</div></div>`:'';
 const warning=check.warning?`<div class="lab-critical-note"><span class="lab-alert-symbol" aria-hidden="true">!</span><p><strong>Potentially critical result</strong><span>${check.warning.message}</span><a href="${check.warning.url}" target="_blank" rel="noopener noreferrer">${esc(check.warning.source)} ↗</a></p></div>`:'';
 return input+warning;
}
export function feedbackState(id,entry,context){
 const check=reviewLabSafety(id,entry),comparison=reviewLabReference(id,entry,context),referenceError=validateLabReferences({[id]:entry})[id];
 const direction=check.status==='invalid'||referenceError?'unknown':comparison.status;
 return {check,comparison,direction,referenceError};
}
export function labFeedbackMarkup(id,entry,context){
 return measurementFeedbackMarkup(labs.find(item=>item.id===id),entry,feedbackState(id,entry,context));
}

export function measurementFeedbackMarkup(lab,entry,{check,comparison,direction,referenceError},{showSource=false,reviewTitle,reviewText}={}){
 if(check.status==='missing')return '';
 const symbols={below:'↓',within:'✓',above:'↑'},compared=Object.hasOwn(symbols,direction);
 let markup='';
 if(check.status!=='invalid'&&referenceError)markup=`<div class="lab-entry-note"><span class="lab-check-symbol" aria-hidden="true">?</span><p><strong>Check the reference interval</strong><span>${esc(referenceError)}</span></p></div>`;
 else if(check.status!=='invalid'&&comparison){
  const unit=showSource?comparison.unit:entry.unit||lab.units[0],converted=compared&&comparison.unit!==unit;
  const factor=converted?lab.factor(comparison.unit)/lab.factor(unit):1;
  const bound=value=>value==null?null:converted?Number((value*factor).toPrecision(6)):value;
  const low=bound(comparison.low),high=bound(comparison.high);
  const limits=low!==null&&high!==null&&!comparison.lowExclusive&&!comparison.highExclusive?`${low}–${high}`:[low===null?'':`${comparison.lowExclusive?'>':'≥'} ${low}`,high===null?'':`${comparison.highExclusive?'<':'≤'} ${high}`].filter(Boolean).join(' · ');
  const interval=(converted?'≈ ':'')+limits+' '+unit;
  const source=showSource&&compared&&comparison.sourceUrl?` <a href="${esc(comparison.sourceUrl)}" target="_blank" rel="noopener noreferrer">${esc(comparison.sourceLabel)} ↗</a>`:'';
  markup=`<p class="lab-comparison" data-comparison="${compared?direction:'unknown'}"><span aria-hidden="true">${symbols[direction]||'·'}</span><span>${esc(comparison.label)}<small ${converted?'title="Approximate converted interval. Status uses the unrounded source interval."':''}>${esc(compared?interval:comparison.reason||'Add the interval from your lab report.')}</small>${source}</span></p>`;
 }
 return markup+safetyMarkup(check,{reviewTitle,reviewText});
}
export function refreshLabFeedback(root,state,id,{editing=false,badInput=false}={}){
 const field=root.querySelector(`[data-lab-field="${id}"]`);if(!field)return;
 const input=field.querySelector('[data-lab]'),feedback=field.querySelector('.lab-feedback');
 if(!feedback)return;
 if(editing){feedback.replaceChildren();field.dataset.referenceStatus='editing';delete field.dataset.entryCheck;input.removeAttribute('aria-invalid');return;}
 const entry=state.lab[id]||{},info=feedbackState(id,entry,state),check=badInput?{status:'invalid',message:'Enter a number in the selected unit.',warning:null}:info.check;
 field.dataset.referenceStatus=check.status==='invalid'?'unknown':info.direction;
 field.dataset.entryCheck=check.status;
 const hadWarning=!!feedback.querySelector('.lab-critical-note');
 feedback.innerHTML=badInput?safetyMarkup(check):labFeedbackMarkup(id,entry,state);
 input.setAttribute('aria-invalid',String(check.status==='invalid'));
 if(check.warning&&!hadWarning){
  const note=feedback.querySelector('.lab-critical-note');
  // Language replacement can change height; reveal the final, translated alert.
  const reveal=()=>{if(note?.isConnected)note.scrollIntoView?.({block:'nearest',behavior:'auto'});};
  if(root.defaultView?.requestAnimationFrame)root.defaultView.requestAnimationFrame(reveal);else queueMicrotask(reveal);
 }
}
// Feedback never remounts the form. Values and focus stay in their original nodes.
export function initializeLabFeedback({root=document,getState}){
 const clear=id=>{const state=getState();state.labTouched??={};state.labTouched[id]=false;refreshLabFeedback(root,state,id,{editing:true});};
 root.addEventListener('input',event=>{
  const target=event.target,id=target.dataset?.lab||target.dataset?.labReference;
  if(id)clear(id);
 });
 root.addEventListener('focusout',event=>{
  const target=event.target,id=target.dataset?.lab||target.dataset?.labReference;
  if(!id)return;
  const state=getState();state.labTouched??={};state.labTouched[id]=true;
  refreshLabFeedback(root,state,id,{badInput:!!target.dataset.lab&&target.validity.badInput});
 });
 root.addEventListener('change',event=>{
  const t=event.target;
  if(!t.dataset?.labUnit&&!t.dataset?.labReferenceRule&&!['lab-reference-mode','lab-reference-group','crp-assay','lab-context'].includes(t.id)&&t.name!=='lab-fasting')return;
  queueMicrotask(()=>{
   const state=getState(),choice=t.id==='lab-reference-group'?'creatinine':t.id==='crp-assay'?'crp':null;
   if(choice&&state.lab[choice]?.value){state.labTouched??={};state.labTouched[choice]=true;}
   for(const [id,touched]of Object.entries(state.labTouched||{}))if(touched)refreshLabFeedback(root,state,id);
  });
 });
}
