import {escapeHTML as esc,reportArtwork,uiIcon} from './ui-components.mjs';
import {reportHighlights} from './report-guidance.mjs';

export const insightsTab=['findings','Insights'];
export const reportSections=(tabs,full)=>full?[insightsTab,...tabs.filter(([id])=>id!==insightsTab[0])]:tabs;
export const reportEditionLabel=(full,sample)=>full?(sample?'FULL REPORT · SAMPLE':'FULL REPORT'):(sample?'ILLUSTRATIVE SAMPLE':'BASIC REPORT');

export function reportTools({saved,pagesPreview}) {
 const save=pagesPreview?'':saved?'<button class="text-btn report-saved" type="button" disabled>Saved</button>'
  :'<button class="text-btn" type="button" data-action="save">Save</button>';
 return `<div class="report-tools no-print">${save}<button class="text-btn" type="button" data-action="print">${uiIcon('report')}<span>Save PDF</span></button></div>`;
}

export function reportFootnote(studyBased=true,print=false) {
 return `<p class="report-footnote${print?' print-only':''}">${studyBased?'Clinical study based':'Health guidance based'}${print?' · For discussion with a healthcare professional.':''}</p>`;
}

const chapters=[
 ['matched','Steps linked to your readings','See what was tested, what changed, and what to discuss with your clinician.'],
 ['context','What stands out','The details that give your result more meaning.'],
 ['steps','Small steps to consider','Pick a change that fits your health and your routine.'],
 ['clinician','Questions for your next visit','Bring the questions that fit your situation and any earlier results you have.'],
];

function studyDetails({duration,protocol,outcomes,contrast,fit}){
 return `<div class="premium-report-study">
  <div class="premium-study-protocol">
   <div class="premium-study-heading"><strong class="premium-study-label">What the study tested</strong><span class="premium-study-duration">${esc(duration)}</span></div>
   <p>${esc(protocol)}</p>
  </div>
  <div class="premium-study-outcomes">
   <strong class="premium-study-label">What changed in the study</strong>
   <dl class="premium-study-results">${outcomes.map(([name,value,note])=>`<div>
    <dt>${esc(name)}</dt><dd><strong>${esc(value)}</strong><small>${esc(note)}</small></dd>
   </div>`).join('')}</dl>
  </div>
  ${contrast?`<details class="report-answer-group premium-study-comparison"><summary>What about vigorous exercise?</summary><p>${esc(contrast)}</p></details>`:''}
  <div class="premium-study-fit"><strong class="premium-study-label">How closely it applies</strong><p>${esc(fit)}</p></div>
 </div>`;
}

function insightCard(item,label,sourceLinks){
 const matched=item.study||item.evidence;
 return `<article class="premium-report-card${matched?' premium-report-matched':''}">
  <h3>${esc(item.name)}</h3>
  ${item.text?`<p>${esc(item.text)}</p>`:''}
  ${item.study?'<strong class="premium-study-label">Your starting point</strong>':''}
  ${item.measurements?.length?`<ul class="premium-report-readings">${item.measurements.map(reading=>typeof reading==='string'?`<li>${esc(reading)}</li>`
   :`<li><strong>${esc(reading.title)}</strong><small>${esc(reading.description)}</small></li>`).join('')}</ul>`:''}
  ${item.study?studyDetails(item.study):item.evidence?`<div class="premium-report-evidence"><strong>What the study found</strong><p>${esc(item.evidence)}</p></div>`:''}
  ${item.action?`<div class="premium-report-next"><strong>${label}</strong><p>${esc(item.action)}</p></div>`:''}
  ${item.visit?.length?`<div class="premium-report-visit">
   <strong class="premium-study-label">Bring to your clinician</strong>
   <ol>${item.visit.map(question=>`<li>${esc(question)}</li>`).join('')}</ol>
  </div>`:''}
  ${matched?sourceLinks(item.sources||[]):''}
 </article>`;
}

export function renderReportInsights({guidance,assessment,safety='',sourceLinks=()=>''}) {
 if(!guidance)return `<section class="report-explanation no-print" data-pdf-exclude>
  <span class="eyebrow">FULL REPORT</span><h2>Insights from your assessment</h2>
  <p>Get more context for your results, guidance that applies to your answers, and questions to discuss with a healthcare professional.</p>
  <button class="btn secondary" type="button" data-action="checkout">Full report ${uiIcon('forward')}</button>
 </section>`;
 const {title,intro,stats=[]}=reportHighlights(assessment);
 const groups=chapters.map(([key,name,description])=>({key,name,description,items:guidance.filter(item=>(item.section||'context')===key)}))
  .filter(chapter=>chapter.items.length);
 const matchedSources=new Set(guidance.filter(item=>item.study||item.evidence).flatMap(item=>item.sources||[]));
 const sources=[...new Set(guidance.flatMap(item=>item.sources||[]))].filter(id=>!matchedSources.has(id));
 return `<section class="premium-report">
  <div class="premium-report-cover" data-theme-part>
   ${reportArtwork()}
   <span class="eyebrow">AT A GLANCE</span><h2>${esc(title)}</h2>
   <p>${esc(intro)}</p>
   ${stats.length?`<dl class="premium-report-stats">${stats.map(([label,value,unit])=>`<div><dt>${esc(label)}</dt><dd><strong>${esc(value)}</strong> <span>${esc(unit)}</span></dd></div>`).join('')}</dl>`:''}
  </div>
  ${safety}
  ${groups.map(({key,name,description,items},index)=>`<section class="premium-report-chapter">
   <header><span class="premium-report-number" aria-hidden="true">${String(index+1).padStart(2,'0')}</span><div><h2>${name}</h2><p>${description}</p></div></header>
   ${items.map(item=>insightCard(item,{steps:'A place to start',clinician:'Bring this up',matched:'A starting point to discuss'}[key]||'Keep in mind',sourceLinks)).join('')}
  </section>`).join('')}
  ${sources.length?`<details class="report-answer-group premium-report-sources"><summary>Research and guidance behind this report</summary>${sourceLinks(sources)}</details>`:''}
 </section>`;
}

function readinessMarkup(readiness,record,sample,recordId){
 if(!readiness)return '';
 const {source,saved,goal,profileId,profileFields,measurements,helpful,measurementHint,coverageNote,profileUnavailable,limited}=readiness;
 const profileRecord=profileId||(source==='assessment'&&['profile','labs'].includes(goal)?recordId:'');
 const editProfile=profileRecord?` data-id="${esc(profileRecord)}"`:'';
 const profileStatus={
  assessment:'Uses the health-profile answers recorded with this assessment.',
  saved:'Uses your saved health profile',
  session:'Uses the health-profile answers you entered in this session.',
  missing:sample?'This sample uses fictional information.':'Health-profile answers are missing.',
 };
 const missing=(label,fields)=>fields.length?`<div class="report-readiness-group"><strong>${label}</strong><ul>${fields.map(field=>`<li>${esc(field)}</li>`).join('')}</ul></div>`:'';
 const hasAssessmentGaps=measurements.length>0||helpful.length>0;
 return `<section class="report-readiness">
  <h3>Before building your report</h3>
  <p>${profileStatus[source]}${source==='saved'&&typeof saved==='string'?' · '+esc(saved.slice(0,10)):''}</p>
  ${profileUnavailable?'<p>We could not load your saved health profile. Try again to include those answers.</p>':''}
  ${sample?'':missing('Health details that could add context',profileFields)}
  ${missing('Assessment details to fill in',measurements)}
  ${missing('Extra measurements to add if available',helpful)}
  ${hasAssessmentGaps&&measurementHint?`<p>${esc(measurementHint)}</p>`:''}
  ${coverageNote?`<p>${esc(coverageNote)}</p>`:''}
  ${!sample&&limited?'<p>The report can use the information you’ve entered. Missing details may limit which findings and next steps it can offer.</p>':''}
  ${!sample&&profileFields.length?`<button class="text-link" type="button" data-action="report-review-profile"${editProfile}>Review health profile ${uiIcon('forward')}</button>`:''}
  ${!sample&&hasAssessmentGaps?`<button class="text-link" type="button" data-action="edit-existing-assessment" data-goal="${esc(goal)}"${record}>Review this assessment ${uiIcon('forward')}</button>`:''}
 </section>`;
}

export function reportOffer({assessment,price='US$7.99',sample,review,purchased,canPurchase,needsSave,test,recordId='',readiness}) {
 const record=recordId?` data-id="${esc(recordId)}"`:'';
 const open=sample||review||purchased;
 const button=open?`<button class="btn" type="button" data-action="open-full-report"${record}>${sample?'Explore full sample':readiness?.limited?'Continue with available data':purchased?'Open full report':'Preview full report'} ${uiIcon('forward')}</button>`
  :canPurchase?`<button class="btn" type="button" data-action="${needsSave?'save-before-checkout':'purchase-checkout'}"${record}>${needsSave?'Save and review purchase':'Continue to secure payment'} ${uiIcon('forward')}</button>`:'';
 const status=sample?'Free sample with fictional data.':purchased?'Unlocked for this saved report.':review?'Full report preview for internal testing.'
  :canPurchase?(test?'Stripe test checkout · no real charge':'Review the final total at checkout.'):'Purchases are coming soon.';
 return `<div class="report-offer">
  <div class="report-offer-price"><div><strong data-no-translate>${esc(price)}</strong><span>One-time price per saved assessment</span></div><span class="record-icon">${uiIcon('report')}</span></div>
  <p><strong>${esc(assessment)}</strong></p>
  ${readinessMarkup(readiness,record,sample,recordId)}
  <details class="report-answer-group report-offer-contents">
   <summary>What the full report includes</summary>
   <ul>
    <li><strong>Your results in everyday language</strong><span>See what the numbers mean and which readings deserve a closer look.</span></li>
    <li><strong>Practical next steps</strong><span>See what people in a relevant study did, which readings changed and what to ask before trying a change.</span></li>
    <li><strong>Questions for your next visit</strong><span>Bring the full PDF and ask about tests that could add context.</span></li>
   </ul>
  </details>
  <p>${status}</p>
  <div class="report-offer-actions">${button}${recordId?`<button class="text-btn" type="button" data-action="open-report"${record}>View basic report ${uiIcon('forward')}</button>`
    :'<button class="text-btn" type="button" data-action="close">Back to assessment</button>'}</div>
 </div>`;
}
