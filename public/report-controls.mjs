import {escapeHTML as esc,uiIcon} from './ui-components.mjs';

export function reportSaveButton(saved,pagesPreview=false){
 return pagesPreview?'':saved?'<button class="text-btn report-saved" type="button" disabled>Saved</button>':'<button class="text-btn" type="button" data-action="save">Save</button>';
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
  <h3>Before opening your report</h3>
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
 const status=sample?'Free sample with fictional data.':purchased?'Unlocked for this saved report.':review?'Full report preview.'
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
