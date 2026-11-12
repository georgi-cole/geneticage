import {reportSaveButton} from './report-controls.mjs';
import {hasReportFolio,isFamilyFolio} from './report-folio.mjs';
import {renderEditorialSources,renderClinicalRecord,renderClinicalMethods,renderFamilyRecord} from './report-editorial-ui.mjs';
import {reviewLabSafety,clinicalForDisplay,LAB_SAFETY_VERSION} from './lab-safety.mjs';
import {safetyMarkup,clinicalCheckSummary} from './lab-feedback.mjs';
import {sections,profileSectionsV1,legacySections,labs,insights,ASSESSMENT_PROTOCOL} from './model.mjs';
import {CONTENT_VERSION} from './evidence.mjs';
import {assessmentProgress,profileSectionProgress,provided} from './assessment-flow.mjs';
import {compareLabReference,reviewLabReference,labDescriptions,LAB_REFERENCE_SOURCE} from './lab-review.mjs';
import {REFERENCE_CATALOG_SOURCE} from './lab-reference-catalog.mjs';
import {escapeHTML as esc,uiIcon,unmeasuredMark} from './ui-components.mjs';

import {composeReportDocument} from './report-composer.mjs';
import {renderReportDocument} from './report-document-ui.mjs';

const tabs=[['summary','Your report'],['data','Your data'],['details','Method & evidence']];
const tabAliases={findings:'summary',blood:'data'};
function answerText(question,answers){
 const value=answers[question.id];if(!provided(value))return 'Not answered';
 let text=Array.isArray(value)?value.map(item=>typeof item==='object'?`${item.type}: ${item.count||'?'} × ${item.ml||'?'} mL · ${item.abv||'?'}%`:(question.optionLabels?.[item]||item)).join('; '):question.optionLabels?.[value]||String(value);
 if(question.unit||question.units)text+=' '+(answers[question.id+'Unit']||question.units?.[0]||question.unit);
 return text;
}
function answerSummary(answers,displaySections=sections,groupProgress=[]){
 return displaySections.map((section,index)=>{
  const applicable=section.questions.filter(q=>!q.show||q.show(answers)),answered=applicable.filter(q=>provided(answers[q.id])),count=groupProgress.find(group=>group.name===section.name)||groupProgress[index]||{answered:answered.length,total:applicable.length};
  return `<details class="report-answer-group"><summary><span>${section.name}</span><span class="answer-count">${count.answered} / ${count.total}</span></summary><dl>${applicable.map(q=>`<div class="answer-row ${provided(answers[q.id])?'':'answer-missing'}"><dt>${esc(q.label)}</dt><dd>${esc(answerText(q,answers))}</dd></div>`).join('')}</dl></details>`;
 }).join('');
}
function referenceText(comparison){
 if(['unknown','missing','invalid'].includes(comparison.status))return '—';
 const {low,high,unit,lowExclusive,highExclusive}=comparison;
 if(low!==null&&high!==null&&!lowExclusive&&!highExclusive)return `${low}–${high} ${unit}`;
 return [low===null?'':`${lowExclusive?'>':'≥'} ${low}`,high===null?'':`${highExclusive?'<':'≤'} ${high}`].filter(Boolean).join(' · ')+' '+unit;
}
function comparisonValueText(comparison){
 for(let digits=4;digits<=12;digits++){
  const value=Number(comparison.comparisonValue.toPrecision(digits));
  if(compareLabReference({value,referenceLow:comparison.low,referenceHigh:comparison.high}).status===comparison.status)return String(value);
 }
 return String(comparison.comparisonValue);
}
function referenceSummary(comparisons){
 return ['lab','published'].map(kind=>{
  const compared=comparisons.filter(item=>item.sourceKind===kind&&['above','below','within'].includes(item.status));
  if(!compared.length)return '';
  const outside=compared.filter(item=>['above','below'].includes(item.status));
  return `<div class="report-comparison-note"><span>${kind==='lab'?'Your laboratory intervals':'Published adult comparisons'}</span><strong>${outside.length?esc(outside.map(item=>item.lab.name).join(' · ')):'No compared value falls outside this reference.'}</strong>${outside.length?'<small>Outside this reference · Review in clinical context</small>':''}<p>${compared.length} / 9 <span>measurements compared.</span></p></div>`;
 }).join('');
}
function bloodResults(state){
 return `<div class="report-section-heading"><div><span class="eyebrow">YOUR MEASUREMENTS</span><h2>Blood results, in context</h2></div><button class="text-btn" data-action="labs">Edit entries ${uiIcon('forward')}</button></div><p class="report-intro">Your laboratory interval takes precedence. Where it is missing, the published adult guide can provide an educational comparison if the required context is known. Each result names the reference used.</p><div class="blood-review-list">${labs.map(lab=>{
  const entry=state.lab[lab.id]||{},check=!state.savedReport||state.savedReport.clinical?.safetyVersion===LAB_SAFETY_VERSION?reviewLabSafety(lab.id,entry):{status:'ok',warning:null},reference=reviewLabReference(lab.id,entry,state),comparison=check.status==='invalid'?{...reference,status:'invalid',label:'Check the entry'}:reference,hasValue=provided(entry.value),both=Number.isFinite(comparison.low)&&Number.isFinite(comparison.high),position=both?Math.max(0,Math.min(100,(comparison.comparisonValue-comparison.low)/(comparison.high-comparison.low)*100)):null;
  const unit=entry.unit||lab.units[0],converted=comparison.sourceKind==='published'&&unit!==comparison.unit;
  return `<details class="blood-review-item" data-reference-status="${comparison.status}" data-reference-source="${comparison.sourceKind||'none'}"><summary><span class="blood-marker-name">${lab.name}</span><span class="blood-marker-value">${hasValue?esc(entry.value):'—'}<small>${hasValue?esc(unit):''}</small></span><span class="reference-status">${comparison.label}</span>${check.warning?'<span class="blood-safety-label critical"><span aria-hidden="true">△</span>Potentially critical result</span>':['review','invalid'].includes(check.status)?'<span class="blood-safety-label"><span aria-hidden="true">?</span>Check the entry</span>':''}</summary><div class="blood-marker-detail"><p>${labDescriptions[lab.id]}</p>${safetyMarkup(check)}<div class="reference-interval"><span>${comparison.threshold?'Cardiovascular threshold':comparison.sourceKind==='published'?'Published adult guide':comparison.sourceKind==='lab'?'Your laboratory interval':'Reference comparison'}</span><strong>${esc(referenceText(comparison))}</strong></div>${comparison.sourceKind==='published'?`<a class="reference-source" href="${comparison.sourceUrl}" target="_blank" rel="noopener noreferrer">${comparison.sourceLabel} ↗</a>`:''}${converted?`<p class="converted-value"><span>Your value in the reference unit:</span> <strong>${comparisonValueText(comparison)} ${esc(comparison.unit)}</strong></p>`:''}${position!==null?`<div class="reference-rail" aria-hidden="true"><i style="left:${position}%"></i></div>`:''}<p class="small muted">${comparison.status==='unknown'?esc(comparison.reason):comparison.status==='missing'?'Enter this measurement to include it in the calculation.':comparison.status==='invalid'?'Check the value, unit and reference limits before comparing.':'A result outside a reference is not a diagnosis; a result inside it does not rule out illness. Review it with a clinician in your medical context.'}</p>${comparison.status==='unknown'&&['creatinine','crp'].includes(lab.id)?`<button class="text-btn no-print" data-action="lab-reference-edit" data-id="${esc(lab.id)}">Review comparison ↗</button>`:''}<details class="formula-explainer"><summary>How this measurement enters the age formula</summary><p>${['albumin','lymphocytes'].includes(lab.id)?'Holding the other inputs fixed, a higher value lowers the numerical estimate in this formula.':'Holding the other inputs fixed, a higher value raises the numerical estimate in this formula.'}</p><p class="small muted">This describes the formula, not a treatment target.</p></details></div></details>`;
 }).join('')}</div><p class="report-footnote">Published intervals may differ from your laboratory. Reference colours show direction only. Separate critical-result alerts use their own published thresholds. The hs-CRP threshold provides cardiovascular context.</p><p class="report-footnote"><a href="${REFERENCE_CATALOG_SOURCE}" target="_blank" rel="noopener noreferrer">Published guide: ABIM · January 2026 ↗</a><br><a href="${LAB_REFERENCE_SOURCE}" target="_blank" rel="noopener noreferrer">Why laboratory intervals differ ↗</a></p>`;
}

function storedFindings(findings,{full,sourceLinks}){
 return `<div class="finding-list report-stored-findings">${!findings.length?'<p>No findings were stored in this saved report. Its original inputs and result are preserved.</p>':''}${findings.map((finding,index)=>`<section class="finding-card report-narrative-section" data-section-kind="priority"><header class="report-narrative-heading"><span class="report-priority-number" aria-hidden="true">${String(index+1).padStart(2,'0')}</span><h2>${esc(finding.name)}</h2></header><div class="report-narrative-prose"><p>${esc(finding.text)}</p>${full&&finding.action?`<p>${esc(finding.action)}</p>`:''}</div><div class="report-narrative-sources">${sourceLinks(finding.sources||[])}</div></section>`).join('')}</div>`;
}
function collectionDetails(state){
 return `<details class="report-answer-group"><summary>Collection details</summary><dl><div class="answer-row"><dt>Age at blood draw</dt><dd>${esc(state.labAge||'Not entered')}</dd></div><div class="answer-row"><dt>Date of blood draw</dt><dd>${esc(state.labDate||'Not entered')}</dd></div><div class="answer-row"><dt>Fasted for at least eight hours?</dt><dd>${esc(state.labFasting||'Not recorded')}</dd></div><div class="answer-row"><dt>Collection history</dt><dd>${state.labContext?'None of the listed situations applied':'Needs individual review'}</dd></div></dl></details>`;
}
function reportMethods({state,document,sourceLinks,consultations}){
 const sourceIds=[...new Set(['phenoage','validation','activity','sleep','diet','alcohol','tobacco','nhis-smoking','nhanes-smoking','weight-history','weight-change','adult-intervals','critical-mayo','critical-crouse','lab-coverage',...(document?.sourceIds||[])])];
 return `<div class="report-section-heading"><div><span class="eyebrow">METHOD & EVIDENCE</span><h2>How to read this assessment</h2></div></div>
 <section class="report-explanation"><h3>How the estimate works</h3><p>Clinical PhenoAge combines age with nine blood measurements using the published formula. Supported units are converted before calculating. Laboratory reference intervals provide separate context; they do not change the formula.</p><p>The age difference is a simple subtraction. It is not the age-adjusted PhenoAgeAccel measure used in research. Individual uncertainty and applicability to different populations remain limitations.</p><p>To report an age, the app requires readings within the estimation range and checks for potentially critical results. It displays rounded ages from 1 to 99.</p><p>The health profile uses selected guidance-based rules. It is not a validated questionnaire age model. No clock establishes an exact biological or genetic age.</p></section>
 <section class="report-explanation"><h3>Evidence and sources</h3>${sourceLinks(sourceIds)}<a class="text-link" href="${LAB_REFERENCE_SOURCE}" target="_blank" rel="noopener noreferrer">Understanding laboratory reference intervals ↗</a></section>
 ${document?`<section class="report-explanation report-provenance"><h3>About this report</h3><p>Prepared automatically from the recorded assessment. No clinician has reviewed this report.</p><dl>${[['Report edition',document.version],['Content version',document.contentVersion],['Questionnaire version',document.questionnaireVersion],['Model version',document.modelVersion]].filter(([,value])=>value).map(([label,value])=>`<div class="answer-row"><dt>${label}</dt><dd data-no-translate>${esc(value)}</dd></div>`).join('')}</dl></section>`:''}
 <section class="report-explanation"><h3>Discuss the result</h3><p>Ask a clinician which results need attention in your medical context and whether the sampling conditions suit this calculation. A change between estimates does not establish an intervention’s effect or a change in aging rate.</p>${consultations?`<button class="text-btn no-print" data-action="consult">Consultation options ${uiIcon('forward')}</button>`:''}</section>
 ${state.savedReport&&!document?'<p class="report-footnote">This is an earlier saved assessment. Its stored result has not been recalculated.</p>':''}`;
}

export function renderAssessmentReport({state,clinical,full=false,reviewing=false,pagesPreview=false,sourceLinks=()=>'',ageComparison=()=>'',hasDraftBackup=false,consultations=true}){
 clinical=clinicalForDisplay(clinical,{stored:!!state.savedReport});
 const answers=state.answers||{},lab=state.lab||{},reportState={...state,answers,lab};
 const legacySnapshot=!!state.savedReport&&(state.contentVersion||state.savedReport.contentVersion)!==CONTENT_VERSION;
 const previousProfile=state.savedReport&&(state.assessmentProtocol||state.savedReport.assessmentProtocol)!==ASSESSMENT_PROTOCOL;
 const displaySections=legacySnapshot?legacySections:previousProfile?profileSectionsV1:sections;
 const baseProgress=assessmentProgress(reportState);
 const questions=displaySections.flatMap(section=>section.questions.filter(q=>!q.show||q.show(answers)));
 const all=state.savedReport?(Array.isArray(state.savedReport.priorities)?state.savedReport.priorities:[]):insights(answers);
 // An entitlement preview cannot compose or embed premium content. A saved document
 // is authoritative, and old snapshots must never acquire today's interpretation.
 const document=full?(state.savedReport?state.savedReport.document||null:composeReportDocument({state:reportState,clinical,priorities:all})):null;
 const folio=hasReportFolio(document?.editorial),family=isFamilyFolio(document?.editorial);
 const currentGroups=!state.savedReport?profileSectionProgress(answers):null;
 const coverage=document?.coverage?.questions;
 const progress={...baseProgress,answered:coverage?.answered??(currentGroups?currentGroups.reduce((sum,group)=>sum+group.answered,0):questions.filter(q=>provided(answers[q.id])).length),total:coverage?.total??questions.length};
 const groupProgress=coverage?.groups||currentGroups||[];
 const valid=clinical&&!clinical.reason&&Number.isFinite(clinical.value);
 const requestedTab=tabAliases[state.reportTab]||state.reportTab;
 const tab=tabs.some(([id])=>id===requestedTab)?requestedTab:'summary';
 const findings=full?all:all.slice(0,1);
 const profilePresent=progress.answered>0;
 const clinicalSummary=valid?`<section class="report-estimate result-surface" data-theme-part><span class="eyebrow">CLINICAL PHENOAGE</span><div class="report-age-line"><strong>${Math.round(clinical.value)}</strong><span>years</span></div><div class="report-age-comparison"><div><span>Age at blood draw</span><strong>${esc(state.labAge)} <small>years</small></strong></div><div><span>Simple difference</span><strong>${Math.round(clinical.gap)>0?'+':''}${Math.round(clinical.gap)} <small>years</small></strong></div></div><p>${esc(ageComparison(clinical,state.labAge))}</p></section>`:`<section class="report-estimate result-surface" data-theme-part><span class="eyebrow">${clinical?'ESTIMATE WITHHELD':'YOUR HEALTH PROFILE'}</span><h2>${clinical?'Why no age is shown':'Your profile is ready to review'}</h2>${clinical?'<div class="withheld-emblem">'+unmeasuredMark()+'</div>':''}<p>${clinical?esc(clinical.reason):'Your questionnaire describes health and lifestyle. It does not calculate an age in years; the blood-based estimate needs nine measurements.'}</p>${clinicalCheckSummary(clinical)}<button class="text-btn no-print" data-action="labs">${progress.measurements?'Review blood entries':'Add blood results'} ${uiIcon('forward')}</button></section>`;
 const caveat=`<p class="report-result-caveat">${valid?'This is an estimate of a pattern in your blood results, expressed on an age scale. It is not the age of every organ, an aging speed or a prediction of lifespan.':'Keep the health profile and the blood calculation separate. An unanswered question is not a healthy answer, and missing blood values are not estimated.'}</p>`;
 const legacyIntro=state.savedReport&&!document&&full?'<p class="report-snapshot-note">The interpretation below is preserved from your saved report.</p>':'';
 const narrative=document?renderReportDocument(document,{sourceLinks}):profilePresent||state.savedReport?`${legacyIntro}${storedFindings(findings,{full,sourceLinks})}`:`<section class="report-empty"><span class="eyebrow">HEALTH & LIFESTYLE</span><h2>Add your health profile</h2><p>No questionnaire answers have been entered in this assessment. Your blood entries will be kept when you add them.</p><button class="btn secondary no-print" data-action="start">Continue health profile ${uiIcon('forward')}</button></section>`;
 const summary=`${folio?'':clinicalSummary+caveat}${narrative}${!full?'<div class="locked no-print"><p>The full report includes all findings and suggested next steps.</p><button class="btn secondary" data-action="checkout">Full report</button></div>':''}${clinical?.earlierValueHidden?'<p class="report-footnote">This earlier stored estimate is outside the current reporting range. Its original record has not been changed.</p>':''}${document?.editorial?.folio?.footer?'':'<p class="report-footnote">This report is not a diagnosis. Please always discuss any health-related matters with your clinician.</p>'}`;
 const comparisons=!folio?labs.map(item=>({lab:item,...reviewLabReference(item.id,lab[item.id],reportState)})):[];
 const recordedResult=`<div class="report-record-summary"><span>Recorded result</span><strong>${valid?`${Math.round(clinical.value)} <span>years</span>`:clinical?'Estimate withheld':'Health & lifestyle profile'}</strong>${valid?`<p><span>Age at blood draw</span> ${esc(state.labAge)} · <span>Simple difference</span> ${Math.round(clinical.gap)>0?'+':''}${Math.round(clinical.gap)} <span>years</span></p>`:''}</div>`;
 const data=family?renderFamilyRecord(document)+'<button class="text-btn no-print" data-action="review">Edit answers</button>':folio?renderClinicalRecord(document):`<div class="report-opening print-only"><h2>Data & methods</h2></div>${recordedResult}${bloodResults(reportState)}${referenceSummary(comparisons)}<div class="report-section-heading report-data-heading"><div><span class="eyebrow">YOUR RECORDED ANSWERS</span><h2>Your answers, preserved</h2></div></div><div class="report-data-status"><span>${progress.answered} / ${progress.total} <span>questions answered</span></span><button class="text-btn no-print" data-action="review">Edit answers ${uiIcon('forward')}</button></div>${answerSummary(answers,displaySections,groupProgress)}${collectionDetails(state)}`;
 const details=folio?renderClinicalMethods(document):renderEditorialSources(document)+reportMethods({state,document,sourceLinks,consultations});
 const panels={summary,data,details};
 return `<div class="wrap app-screen report-workspace personal-report-workspace${folio?' clinical-report-workspace':''}"><header class="report-heading" data-theme-part><div><span class="eyebrow">${state.sample?'ILLUSTRATIVE SAMPLE':reviewing?'CURRENT ASSESSMENT':full?'ASSESSMENT REPORT':'REPORT PREVIEW'}</span><h1>${clinical||document?.type==='clinical-phenoage'?'Clinical PhenoAge':'Health & lifestyle profile'}</h1>${folio?'':`<p>${state.labDate?'Blood draw · '+esc(state.labDate):'Your health and lifestyle profile'}</p>`}</div><div class="report-tools no-print">${reportSaveButton(state.saved,pagesPreview)}<button class="text-btn" data-action="print" data-export="report">${uiIcon('report')}<span>Report PDF</span></button><button class="text-btn" data-action="print" data-export="technical"><span>Data & methods PDF</span></button></div></header>${state.sample&&(!folio||hasDraftBackup)?'<p class="report-mode-note">Illustrative sample data · Not a personal assessment'+(hasDraftBackup?' <button class="text-link no-print" data-action="restore-draft">Return to your assessment</button>':'')+'</p>':pagesPreview&&!state.sample?'<p class="report-mode-note">Unsaved assessment · Reloading clears your entries</p>':''}<nav class="report-tabs no-print" aria-label="Report sections">${tabs.map(([id,label])=>`<button type="button" data-action="report-tab" data-tab="${id}" ${id===tab?'aria-current="page"':''}>${label}</button>`).join('')}</nav><article class="report-paper${folio?' has-clinical-folio':''}">${tabs.map(([id,label])=>`<section class="report-panel" data-report-panel="${id}" data-export-scope="${id==='summary'?'report':'technical'}" aria-label="${label}" ${id===tab?'':'hidden'}>${panels[id]}</section>`).join('')}</article>${document?.editorial?.folio?.footer?'':'<p class="report-footnote">This report is not a diagnosis. Please always discuss any health-related matters with your clinician.</p>'}</div>`;
}
