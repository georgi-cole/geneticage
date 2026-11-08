import {initializeLabFeedback,clinicalCheckSummary} from './lab-feedback.mjs';
import {clinicalForDisplay,isReportableAge} from './lab-safety.mjs';
import {initializeAppearance} from './theme.mjs';
import {PAGES_PREVIEW,HOSTED_APP_URL} from './hosting-mode.mjs';
import {decorateDirectionalSymbols} from './icons.mjs';
import {clearContactFeedback,validateContactPage,showContactPage,advanceContactPage} from './consultation-feedback.mjs';
import {renderThemeHome,overviewPresentation} from './theme-home.mjs';
import {initializeResultMotion} from './result-motion.mjs';
import {initializeLanguage} from './language-system.mjs';
import {initializeLaunch} from './launch-screen.mjs';
import {APP_NAME} from './brand.mjs';
import {freshAssessment,continueAssessment,assessmentProgress} from './assessment-flow.mjs';
import {validateLabReferences,setLabEntryUnit} from './lab-review.mjs';
import {REFERENCE_CATALOG_VERSION} from './lab-reference-catalog.mjs';
import {renderAssessmentReport} from './report-ui.mjs';
import {assessHeartVascular, HEART_ASSESSMENT} from './heart-vascular.mjs';
import {heartSteps, heartRoute, readHeartForm, refreshHeartFeedback, changeHeartUnit, renderHeartForm, renderHeartOverview, renderHeartReport} from './heart-vascular-ui.mjs';
import {heartPrefill} from './heart-prefill.mjs';
import {resultInstrument,screenHeading,uiIcon,renderAssessments,renderReportLibrary,renderAccount,renderPagesAccount,renderRecordLibrary,assessmentTitle,statusMessage,unmeasuredMark} from './ui-components.mjs';
import {questionContext,questionChoices,questionDestination,renderQuestionnaire,renderLabForm,labErrorStep} from './flow-ui.mjs';
import {sections,labs,validateLabs,assessClinical,validateQuestionnaire,insights,sampleAnswers,sampleLabs} from './model.mjs';
import {references,clockComparison} from './evidence.mjs';
const $=s=>document.querySelector(s), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let state={...freshAssessment(),view:'home'},draftBackup=null;
const parkedAssessments=new Map();
const assessmentType=draft=>draft.assessmentType||'profile';
const isHeartAssessment=draft=>assessmentType(draft)===HEART_ASSESSMENT;
let auth={loading:true,authenticated:false,csrf:null,profile:null,history:[],purchases:[],reportReview:false,payments:{enabled:false,label:'US$7.99'},error:''};
const account=()=>auth.profile?{...auth.profile,history:auth.history}:null;
const language=initializeLanguage();
const resultMotion=initializeResultMotion();
initializeLaunch();
initializeLabFeedback({getState:()=>state});
const today=()=>new Date().toLocaleDateString('en-CA');
const consentVersion='account-storage-2026-11-04-v1';
async function api(path,method='GET',data){if(PAGES_PREVIEW)throw new Error('Cloud services are unavailable in the GitHub Pages preview.');const response=await fetch('/api/'+path,{method,credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(10000),headers:method==='GET'?{}:{'Content-Type':'application/json','X-KQ-CSRF':auth.csrf||''},...(data===undefined?{}:{body:JSON.stringify(data)})});let result;try{result=await response.json();}catch{throw new Error('Account storage could not be reached. Please try again.');}if(!response.ok){if(response.status===401){auth.authenticated=false;auth.profile=null;auth.history=[];}throw new Error(result.error||'Your request could not be completed.');}return result;}
let accountRefresh=null;
async function refreshAccount(){
 if(PAGES_PREVIEW){auth.loading=false;auth.authenticated=false;auth.profile=null;auth.history=[];auth.purchases=[];auth.error='';auth.reportReview=true;nav();return;}

 if(accountRefresh)return accountRefresh;
 auth.loading=true;auth.error='';auth.collectionsError='';auth.purchaseError='';
 accountRefresh=(async()=>{try{
  const response=await fetch('/api/session',{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(10000)});
  if(response.status===401){auth.authenticated=false;auth.profile=null;auth.history=[];auth.purchases=[];auth.csrf=null;return;}
  const session=await response.json();if(!response.ok)throw new Error(session.error||'Account storage is unavailable.');
  auth.authenticated=true;auth.csrf=session.csrf;auth.reportReview=!!session.reportReview;auth.payments=session.payments;auth.profile=session.profile;
  if(session.profile){const [history,purchases]=await Promise.allSettled([api('assessments'),api('purchases')]);
   if(history.status==='fulfilled')auth.history=history.value.assessments;else auth.collectionsError='Saved assessments could not refresh. Please retry.';
   if(purchases.status==='fulfilled')auth.purchases=purchases.value.purchases;else auth.purchaseError='Purchase status could not refresh. Please retry.';
  }else{auth.history=[];auth.purchases=[];}
 }catch(error){auth.error=error.name==='TimeoutError'?'The account connection took too long. Your current assessment is safe on this screen.':error.message;}
 finally{auth.loading=false;nav();}})().finally(()=>{accountRefresh=null;});
 return accountRefresh;
}
async function action(button,fn){if(button.disabled)return;button.disabled=true;button.setAttribute('aria-busy','true');try{await fn();}catch(error){modal('Your change was not completed.', '<p role="alert">'+esc(error.message)+'</p><p>Your current assessment is still on this page. Please retry after refreshing the account connection.</p><button class="btn" data-action="close">Close</button>');}finally{button.disabled=false;button.removeAttribute('aria-busy');}}
function dirty(){delete state.saveId;delete state.savedReport;delete state.saved;state.unlocked=false;}

function announce(t){$('#live').textContent=t;}
const arrow=' '+uiIcon('forward'),sampleBadge=()=>state.sample?'<div class="sample-badge">Illustrative sample data · Not a personal assessment'+(draftBackup?'<button class="text-link" data-action="restore-draft">Return to your assessment</button>':'')+'</div>':'';
function nav(){
 $('#account-nav')?.setAttribute('aria-label',account()?'My account':'Account');
 const accountLabels={history:'My assessments',saved:'Assessment history','report-history':'Saved reports',reports:'Reports',settings:'Account',data:'Saved data',about:'About',purchases:'Purchases',progress:'Progress'};
 const labels={home:'Overview',consent:'New assessment',questionnaire:'Health profile',review:'Review answers',heart:'Heart & Vascular',labs:'Blood results',results:'Your result',report:'Assessment report',consult:'Consultation',enquiry:'Enquiry preview'};
 $('#workspace-current').textContent=state.view==='account'?(accountLabels[state.accountTab]||'Account'):(labels[state.view]||'Overview');
 const route=state.view==='account'?(['history','saved','reports','report-history','progress'].includes(state.accountTab)?(['reports','report-history'].includes(state.accountTab)?'reports':'history'):'settings'):state.view==='report'?'reports':['consent','questionnaire','review','labs','heart'].includes(state.view)?'history':state.view==='results'?'home':state.view;
 document.querySelectorAll('.workspace-link[data-route]').forEach(link=>{if(link.dataset.route===route)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});
}
function goto(view){state.view=view;state.errors={};render();$('#main').scrollTop=0;$('#main').focus({preventScroll:true});}
function modal(title,body){$('#modal-root').innerHTML=`<div class="overlay"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><button class="close" data-action="close" aria-label="Close dialog">×</button><h2 id="modal-title">${title}</h2>${body}</section></div>`;decorateDirectionalSymbols($('.modal'));setTimeout(()=>$('.modal button')?.focus(),0);}
function close(){ $('#modal-root').innerHTML='';$('#main').focus({preventScroll:true});}

const labHelp={albumin:'Blood albumin, not urine albumin.',creatinine:'Blood creatinine, not eGFR.',glucose:'Blood glucose, not HbA1c.',crp:'CRP or hs-CRP concentration. Check mg/L versus mg/dL carefully.',lymphocytes:'Percentage of white blood cells, not an absolute lymphocyte count.',mcv:'Usually labelled MCV on the report.',rdw:'RDW-CV (%) only. RDW-SD in fL is a different measurement.',alp:'Often labelled ALP.',wbc:'The total white blood cell count, often labelled WBC.'};
function sourceLinks(ids){return '<ul class="source-list">'+references.filter(r=>ids.includes(r.id)).map(r=>'<li><a href="'+esc(r.url)+'" target="_blank" rel="noopener noreferrer">'+esc(r.label)+' ↗</a></li>').join('')+'</ul>';}
function insightSources(i){const refs=references.filter(r=>(i.sources||[]).includes(r.id));return refs.length?'<p class="small muted">Guidance: '+refs.map(r=>'<a href="'+esc(r.url)+'" target="_blank" rel="noopener noreferrer">'+esc(r.label.split(' · ')[0])+'</a>').join(', ')+'</p>':'';}
function displayGap(gap){const n=Math.round(gap);return n>0?'+'+n:String(n===0?0:n);}
function ageComparison(c,age){const n=Math.round(c.value)-Number(age);return n===0?'Rounded to the nearest year, the estimate matches your age at the blood draw.':'The estimate is about '+Math.abs(n)+' '+(Math.abs(n)===1?'year':'years')+' '+(n>0?'higher':'lower')+' than your age at the blood draw.';}

function method(){modal('About the assessments',`<p>Biological age is an estimate of aspects of health and aging. Different methods measure different features, so their results are not interchangeable.</p><details open><summary>Health and lifestyle profile</summary><p>Your answers are compared with selected health guidance to identify topics for review. This is an educational profile, not a validated age clock or a clinical risk score. It does not calculate an age in years.</p></details><details><summary>Blood-based age: clinical PhenoAge</summary><p>The published formula combines your age with nine blood measurements. It was developed using US population data and expresses a pattern associated with health outcomes on an age scale.</p><p>This version reports estimates for ages 20–84, using confirmed fasting samples and a collection-history check. These are the app’s interpretation rules. They do not establish accuracy for every person or country.</p><p>The displayed difference is clinical PhenoAge minus age at the blood draw. It is not the study’s age-adjusted PhenoAgeAccel measure, a measure of aging speed, or a forecast of years left to live.</p></details><details><summary>Heart & Vascular</summary><p>SCORE2 and SCORE2-OP estimate 10-year cardiovascular risk for eligible adults aged 40–69 and 70–89, respectively. The report uses the region for your country of residence, compares your risk with a reference age, and lists any optional results.</p></details><details><summary>Epigenetic laboratory tests</summary><p>These use DNA methylation: chemical marks on DNA. They require a suitable laboratory assay and a defined calculation. Routine blood chemistry and lifestyle answers cannot substitute for those measurements.</p><div class="clock-list">${clockComparison.slice(1).map(c=>`<article><h3>${c.name}</h3><p>${c.meaning}</p><p class="small muted">${c.availability}</p></article>`).join('')}</div><p>Laboratory clocks also produce estimates. A test cannot establish one exact biological or “genetic” age. KoleQuant can advise which question a test may help answer and whether it is available.</p></details><details><summary>Mortality risk and progress over time</summary><p>Some clocks are associated with mortality in research populations. That association does not, by itself, provide your probability of death. A personal risk estimate needs a model with a defined time period and evidence that it applies to the relevant population.</p><p>Repeated clinical age estimates can be compared as a history. Changes may reflect illness, sampling conditions, measurement variation or a change in health. A falling result is not proof of reversed aging.</p></details><details><summary>Research and health guidance</summary>${sourceLinks(references.map(r=>r.id))}</details>`);}
function privacy(){if(PAGES_PREVIEW){modal('Privacy & data','<p>Your answers stay in this page’s memory. Reloading or closing the page clears them. Only theme and language preferences are stored on this device.</p><p>This preview does not send your answers to an account database or payment service. GitHub delivers the static app files.</p>');return;}modal('Your account & information',`<p>You can explore an assessment without saving it. Unsaved questionnaire and blood entries stay in this page’s memory.</p><p>Sign-in is handled by ChatGPT. KoleQuant does not receive or store your password. Your account uses a site-specific identifier and a nickname; this application does not store your sign-in email or real name.</p><p>When you explicitly save, your questionnaire, blood entries, results and educational report are sent over HTTPS and stored in the hosted account database. Health records are encrypted by the application before database storage. Authorized service operators can administer the service; this is not end-to-end encryption.</p><p>Saving is optional and is not permission for research, marketing or sharing with a consultation team. Those uses are not enabled. Hosting providers may process ordinary connection logs.</p><p>You can export or delete individual assessments, or delete your KoleQuant account and its live records in Data & settings. Provider backups may retain deleted data for a limited period. Downloaded copies remain on your device. Deleting this account does not delete your ChatGPT account.</p><p>For a report purchase, Stripe collects payment and billing details. We store the purchase status, amount, payment references and receipt link. No questionnaire, blood entries or results are sent to Stripe. Deleting a purchased report removes account access; this does not request a refund. Stripe retains its own payment records.</p><p>Legacy demo accounts remain in their original browser storage unless you remove them. They are not uploaded automatically.</p><p class="small muted">The age calculation and consultation enquiry remain prototype features. A clinician has not reviewed results. Report purchases use Stripe when enabled; purchase availability is shown before checkout.</p>`);}

function home(){
 const saved=auth.profile&&auth.history.some(item=>item.id===auth.overview?.assessment?.id)?auth.overview:null;
 const heartRecord=state.assessment?state:saved?.assessment;
 if(heartRecord&&isHeartAssessment(heartRecord))return renderHeartOverview(heartRecord.heart,state.assessment?null:saved.assessment.id);
 const record=state.assessment?{...state,clinical:clinical()}:saved?{...saved.assessment,clinical:saved.report.clinical,overviewSaved:true}:null;
 return renderThemeHome(overviewPresentation(record,{hasProfile:!!auth.profile}));
}
let overviewRefresh=null;
async function hydrateOverview(){
 const latest=auth.profile?auth.history.at(-1):null;
 if(!latest){auth.overview=null;return;}
 if(state.assessment||auth.overview?.assessment?.id===latest.id||overviewRefresh)return;
 overviewRefresh=(async()=>{try{
  const saved=await api('assessments/'+latest.id);
  if(auth.profile&&auth.history.at(-1)?.id===latest.id){auth.overview=saved;if(state.view==='home'&&!state.assessment)render();}
 }catch{ /* The welcome screen and private library remain usable if loading fails. */ }
 })().finally(()=>{overviewRefresh=null;});
 return overviewRefresh;
}
function consent(){return `<div class="wrap narrow"><div class="eyebrow">Before you start</div><h1>Before you begin.</h1><p class="lead">This is an educational service under development. It can help you understand the information you enter, but it does not diagnose a condition or replace medical care.</p><div class="notice">${PAGES_PREVIEW?'Your answers stay in this page’s memory. Cloud saving is available in the hosted app.':'Unsaved answers stay on this page. If you choose to save an assessment, its health information and report are stored in your account.'}</div><label class="checkline"><input id="consent" type="checkbox" ${state.consent?'checked':''}><span>I am 18 or older and have read the assessment note and <button class="text-link" data-action="privacy">information about my data</button>.</span></label>${state.errors.consent?`<p class="error" role="alert">${state.errors.consent}</p>`:''}<div class="actions"><button class="btn" data-action="consent-next">Continue ${arrow}</button><button class="text-btn" data-action="sample">View the sample instead</button></div></div>`;}
function inputField(q){const a=state.answers,v=a[q.id]??'';if(q.type==='multi'||q.options)return `<div class="options">${q.options.map(o=>`<label class="option"><input type="${q.type==='multi'?'checkbox':'radio'}" name="${q.id}" value="${esc(o)}" data-answer="${q.id}" ${q.type==='multi'?(Array.isArray(v)&&v.includes(o)?'checked':''):(v===o?'checked':'')}><i class="choice-mark" aria-hidden="true"></i><span>${esc(q.optionLabels?.[o]||o)}</span></label>`).join('')}</div>`;
 if(q.type==='country')return `<input type="text" data-answer="${q.id}" id="${q.id}" aria-label="${esc(q.label)}" value="${esc(v)}" list="countries" placeholder="Search or enter a country" autocomplete="off"><datalist id="countries">${['Australia','Austria','Belgium','Brazil','Bulgaria','Canada','China','Croatia','Cyprus','Czechia','Denmark','Estonia','Finland','France','Germany','Greece','Hungary','India','Ireland','Israel','Italy','Japan','Latvia','Lithuania','Malta','Netherlands','New Zealand','Norway','Poland','Portugal','Romania','Singapore','South Africa','Spain','Sweden','Switzerland','United Kingdom','United States'].map(x=>`<option>${x}</option>`).join('')}</datalist>`;
 if(q.type==='drinks')return `<div class="drink-list">${(a.drinks||[]).map((d,i)=>`<div class="drink-summary"><span><strong>${esc(d.type)}</strong><small>${esc(d.count||'?')} × ${esc(d.ml||'?')} mL · ${esc(d.abv||'?')}%</small></span><button class="text-link" type="button" data-action="edit-drink" data-index="${i}">Edit</button><button class="text-btn" type="button" data-action="remove-drink" data-index="${i}" aria-label="Remove drink ${i+1}">×</button></div>`).join('')}</div><button class="btn secondary" data-action="add-drink" type="button">+ Add a drink type</button>`;
 return `<div class="input-row"><input type="number" id="${q.id}" aria-label="${esc(q.label)}" data-answer="${q.id}" value="${esc(v)}" min="${q.min??0.1}" ${q.max?`max="${q.max}"`:''} step="${q.step??'any'}" inputmode="decimal" placeholder="${q.required?'Required':'Optional'}">${q.type==='measure'?`<select data-unit="${q.id}" aria-label="Unit for ${esc(q.label)}">${q.units.map(x=>`<option ${(a[q.id+'Unit']||q.units[0])===x?'selected':''}>${x}</option>`).join('')}</select>`:q.unit?`<span class="unit">${q.unit}</span>`:''}</div>`;
}
function pruneSmokingAnswers(){
 const a=state.answers,current=['Every day','Some days'].includes(a.smoking),regularQuestionApplies=a.smokingEver100==='Yes'||current;
 if(!regularQuestionApplies){delete a.smokingRegular;delete a.smokingStartAge;delete a.quit;}
 if(a.smokingRegular!=='Yes'){delete a.smokingStartAge;delete a.quit;}
 if(a.smoking!=='Not at all')delete a.quit;
 if(!current)delete a.cigarettes;
 if(a.smoking!=='Some days')delete a.smokingDays30;
}
function editDrink(index=-1){const d=state.answers.drinks?.[index]||{type:'Wine',count:'',ml:'',abv:''};modal(index<0?'Add a drink':'Edit drink',`<form id="drink-form" class="form-stack" data-index="${index}"><label for="drink-type">Drink type</label><select id="drink-type">${['Wine','Beer','Spirits','Other'].map(x=>`<option ${d.type===x?'selected':''}>${x}</option>`).join('')}</select>${[['count','Servings'],['ml','mL per serving'],['abv','Alcohol %']].map(([k,label])=>`<label for="drink-${k}">${label}</label><input id="drink-${k}" type="number" inputmode="decimal" min="0.1" ${k==='abv'?'max="100"':''} step="any" value="${esc(d[k])}">`).join('')}<button class="btn" type="submit">Keep drink →</button></form>`);}
function questionnaire(){return renderQuestionnaire(state,inputField);}
function review(){return `<div class="wrap narrow"><div class="eyebrow">Questionnaire</div><h1>Review your answers</h1><p class="lead">You can edit a section before viewing your health profile. Unanswered questions remain missing; they are not treated as healthy answers.</p>${sampleBadge()}<div class="card">${sections.map((s,i)=>{const qs=s.questions.filter(q=>!q.show||q.show(state.answers));const n=qs.filter(q=>state.answers[q.id]!==undefined&&state.answers[q.id]!==''&&(!Array.isArray(state.answers[q.id])||state.answers[q.id].length)).length;return `<div class="row" style="display:flex;justify-content:space-between;padding:13px 0;border-bottom:1px solid var(--line)"><span>${s.name} <span class="small muted">${n} of ${qs.length} answered</span></span><button class="text-link" data-action="edit-section" data-index="${i}">Edit</button></div>`;}).join('')}</div><div class="actions" style="margin-top:25px"><button class="btn" data-action="results">View health profile ${arrow}</button><button class="btn secondary" data-action="labs">Add blood results</button></div></div>`;}
function labForm(){return renderLabForm(state,labHelp);}
function clinical(){if(state.savedReport)return clinicalForDisplay(state.savedReport.clinical,{stored:true});if(!state.labSubmitted)return null;return assessClinical({age:Number(state.labAge),lab:state.lab,contextConfirmed:state.labContext===true,fasting:state.labFasting});}
function result(){
 const c=clinical(),all=state.savedReport?state.savedReport.priorities:insights(state.answers),tab=state.resultTab||'summary';
 const tabs=`<nav class="result-tabs" aria-label="Result details">${[['summary','Result'],['insights','Insights'],['details','Details']].map(([id,label])=>`<button data-action="result-tab" data-tab="${id}" ${tab===id?'aria-current="page"':''}>${label}</button>`).join('')}</nav>`;
 let content='';
 if(tab==='summary')content=(c&&!c.reason?resultInstrument({value:Math.round(c.value),age:state.labAge,gap:displayGap(c.gap),sample:false,illustrative:state.sample,title:'Your blood-based age',action:'method',date:state.labDate}):`<section class="card result-surface" data-theme-part><span class="eyebrow">${c?'ESTIMATE WITHHELD':'HEALTH & LIFESTYLE'}</span><h2>${c?'These entries need review':'Your personal health profile'}</h2>${c?'<div class="withheld-emblem">'+unmeasuredMark()+'</div>':''}<p>${c?esc(c.reason):'Your answers identify topics for review. This assessment does not calculate an age in years.'}</p>${clinicalCheckSummary(c)}<button class="btn secondary" data-action="labs">${c?'Review blood entries':'Add blood results'} →</button></section>`)+`<p class="result-context">${c&&!c.reason?'One blood sample, in context. This is not a measure of aging speed.':c?'Your report identifies the flagged measurements and explains the checks.':'Open Insights to explore the topics supported by your answers.'}</p>`;
 else if(tab==='insights'&&!all.length){content='<section class="card"><h2>No findings in this saved report</h2><p>The stored report has no findings. Its original result and answers are preserved.</p><button class="text-btn" data-action="report">Review the saved inputs →</button></section>';}else if(tab==='insights'){
  const index=Math.max(0,Math.min(state.insightPage||0,all.length-1)),i=all[index];
  content=`<section class="card priority" data-theme-part><div class="eyebrow">${esc(i.tag)} · ${index+1} OF ${all.length}</div><h2>${esc(i.name)}</h2><p>${esc(i.text)}</p><p class="small muted">${esc(i.action)}</p>${insightSources(i)}</section><nav class="compact-pager" aria-label="Health insights"><button class="text-btn" data-action="insight-page" data-page="${index-1}" ${index===0?'disabled':''}>← Previous</button><span>${index+1} / ${all.length}</span><button class="text-btn" data-action="insight-page" data-page="${index+1}" ${index===all.length-1?'disabled':''}>Next →</button></nav><p class="result-context">These topics come from your answers and health guidance. Their order does not explain the cause of an age estimate.</p>`;
 }else content=`<div class="detail-actions" data-theme-part><button class="account-setting" data-action="report"><span><strong>Assessment report</strong><small>Interpretation, entries and evidence</small></span><span>↗</span></button><button class="account-setting" data-action="labs"><span><strong>Blood entries</strong><small>Review the values and collection details</small></span><span>↗</span></button><button class="account-setting" data-action="review"><span><strong>Questionnaire</strong><small>Review your health and lifestyle answers</small></span><span>↗</span></button><button class="account-setting" data-action="method"><span><strong>Methods & limitations</strong><small>What this estimate can and cannot tell you</small></span><span>↗</span></button><button class="account-setting" data-action="consult"><span><strong>Discuss your results</strong><small>Consultation and laboratory testing</small></span><span>↗</span></button></div>${hasContext()?'<div class="notice amber">You reported a condition, treatment or recent illness. This profile cannot determine whether your care should change.</div>':''}`;
 return `<div class="wrap app-screen result-screen ${tab==='insights'?'insight-screen':''}">${screenHeading(state.sample?'ILLUSTRATIVE SAMPLE':'YOUR ASSESSMENT',c?(c.reason?'Review your assessment':'Your result'):'Your health profile',state.sample?'Sample data · Not a personal assessment':c?'Blood draw · '+esc(state.labDate):'Based on the answers you provided.')}${tabs}${content}<div class="result-actions">${PAGES_PREVIEW?'<button class="text-btn" data-action="review">Review answers</button>':'<button class="btn secondary" data-action="save">Save assessment</button>'}<button class="btn secondary" data-action="report">Open report ↗</button></div></div>`;
}
function hasContext(){return state.answers.illness==='Yes'||['conditions','medicines','context'].some(k=>state.answers[k]?.some(x=>!['None','Not sure','Prefer not to say'].includes(x)));}

function pagesInfo(){modal('Cloud features in the hosted app',`<p>This GitHub Pages preview supports assessments, themes and report exploration. Accounts, cloud storage and purchases are available in the hosted app.</p><a class="btn" href="${HOSTED_APP_URL}" target="_blank" rel="noopener noreferrer">Open hosted app ↗</a>`);}
function report(){
 if(isHeartAssessment(state))return state.heart.result?renderHeartReport({heart:state.heart,saved:!!state.saved,pagesPreview:PAGES_PREVIEW,sourceLinks,tab:state.reportTab}):heartForm();
 const reviewing=!!auth.reportReview||!!state.savedReport?.access?.review;state.unlocked=state.savedReport?.full===true||reviewing;
 return renderAssessmentReport({state,clinical:clinical(),full:state.unlocked,reviewing,pagesPreview:PAGES_PREVIEW,sourceLinks,ageComparison,hasDraftBackup:!!draftBackup});
}
function checkout(){if(PAGES_PREVIEW){pagesInfo();return;}if(!auth.payments?.enabled){modal('Report purchases are opening soon.',`<p>The full report will be available for <strong>US$7.99</strong> per saved assessment. Purchasing is not enabled yet, and no payment will be taken.</p><p>Your free insight, saved assessments and account history remain available.</p><button class="btn" data-action="close">Back to my report</button>`);return;}if(!account()){state.pendingCheckout=true;signup();return;}if(state.sample){modal('Explore this sample for free.','<p>This assessment contains illustrative data. Create an assessment with your own inputs before buying a personal report.</p><button class="btn" data-action="close">Back to sample</button>');return;}if(!state.saveId||!state.savedReport){modal('Save before you buy.',`<p>Save this assessment and report preview to your private account first. Your purchase will unlock this dated report on every device where you sign in.</p><button class="btn" data-action="save-before-checkout">Save & review purchase</button>`);return;}modal('Your full report. One simple purchase.',`<span class="pill">${auth.payments.mode==='test'?'Stripe test checkout · no real charge':'One-time purchase · no subscription'}</span><p style="margin-top:20px">Unlock the complete educational report for this saved assessment: all applicable priorities, your input summary, methods, and questions for a professional.</p><div class="notice"><strong>US$7.99</strong> · Any applicable taxes and the final total are shown on Stripe before you pay. This is an automated educational report, not a clinical consultation or diagnosis.</div><p class="small muted">Stripe handles payment details. Your questionnaire, blood measurements and results are not sent to Stripe. You’ll return here after checkout; purchased reports will also appear in your account.</p><button class="btn" data-action="purchase-checkout">Continue to secure payment →</button><button class="text-btn" data-action="close" style="margin-top:14px">Cancel</button>`);}
async function openSaved(id,view='results'){
 const {assessment:s,report}=await api('assessments/'+id);
 selectAssessment(assessmentType(s));
 state={...freshAssessment(assessmentType(s)),...s,labReferenceMode:s.labReferenceMode||'lab-only',labReferenceVersion:s.labReferenceVersion||null,labReferenceGroup:s.labReferenceGroup||'unspecified',profileCompleted:Object.keys(s.answers||{}).length>1,saveId:s.id,savedReport:report,unlocked:report.full===true,assessment:true,labValid:true,consent:true};
 goto(isHeartAssessment(state)?'report':view);
}
function purchaseList(){const purchases=auth.purchases||[];return `<section class="card"><div class="section-head"><div><h2>Your purchases</h2><p class="muted small">Purchased reports follow your account across devices. Refresh to check a recent payment.</p></div><button class="btn secondary" data-action="refresh-payments">Refresh payments</button></div>${purchases.length?purchases.map(p=>`<article class="purchase-row"><div><strong>Full educational report</strong><p class="small muted">${esc(new Date(p.created).toLocaleDateString('en-GB'))} · ${p.testOnly?'Test checkout · ':''}${esc(p.id.slice(0,8))}</p><span class="pill">${esc(({paid:'Purchased',open:'Awaiting payment',creating:'Preparing checkout',processing:'Payment processing',expired:'Checkout ended',refunded:'Refunded',disputed:'Payment under review'})[p.status]||p.status)}</span></div><div><strong>US$${(p.amount/100).toFixed(2)}</strong><div class="actions" style="margin-top:12px">${p.status==='paid'?`<button class="text-link" data-action="open-report" data-id="${esc(p.assessmentId)}">Read purchased report</button>`:''}${p.receiptUrl?`<a class="text-link" href="${esc(p.receiptUrl)}" target="_blank" rel="noopener noreferrer">Stripe receipt ↗</a>`:''}${['creating','open','processing'].includes(p.status)?`<button class="text-link" data-action="check-order" data-id="${esc(p.id)}">Check payment</button>`:''}${p.status==='open'?`<button class="text-btn" data-action="cancel-payment" data-id="${esc(p.id)}">Cancel checkout</button>`:''}</div></div></article>`).join(''):'<div class="empty"><h3>No purchases yet.</h3><p>Your saved report previews are available in Reports.</p></div>'}<p class="small muted" style="margin-top:20px">Deleting a purchased report or your account removes access to that saved report. Deletion does not request a refund. Payment records and receipts are also held by Stripe.</p></section>`;}
async function paymentReturn(){if(PAGES_PREVIEW)return;const params=new URLSearchParams(location.search);const id=params.get('payment_order')||params.get('payment_cancelled');if(!id){if(location.hash==='#purchases'){state.accountTab='purchases';goto('account');}return;}state.accountTab='purchases';goto('account');if(!account()){modal('Sign in to check your purchase.','<p>Use the same account that started checkout, then refresh Purchases. A redirect alone never unlocks a report.</p>');return;}try{const result=await api('payments/refresh','POST',{orderId:id});auth.purchases=result.purchases;await refreshAccount();goto('account');const purchase=auth.purchases.find(p=>p.id===id);const title=purchase?.status==='paid'?'Your report is ready.':purchase?.status==='expired'?'Checkout has ended.':'Your payment status';modal(title,`<p>${purchase?.status==='paid'?'Payment has been verified. You can read your full report from this account on any device.':purchase?.status==='open'?'Checkout is still open. No report access has been granted. You can continue from the report or cancel it in Purchases.':purchase?.status==='processing'?'Payment is still processing. Please check Purchases again shortly.':'Please review the status in Purchases before attempting another payment.'}</p>${purchase?.status==='paid'?`<button class="btn" data-action="open-report" data-id="${esc(purchase.assessmentId)}">Read my report →</button>`:'<button class="btn" data-action="close">View purchases</button>'}`);history.replaceState(null,'',location.pathname+'#purchases');}catch(error){modal('Check your purchase in your account.', '<p>'+esc(error.message)+'</p><p>Please refresh Purchases before attempting to pay again.</p>');}}

function consultation(){return `<div class="wrap flow-grid"><aside><div class="eyebrow">KoleQuant</div><h2>Discuss your results</h2><p class="muted small">Consultations, genetic counseling and advice on suitable laboratory tests.</p><div class="aside-note">Testing depends on your question, the sample required and local availability. Laboratory clocks are estimates; they do not establish an exact age.</div><button class="text-link" data-action="method">Read about the different clocks</button></aside><section><div class="flow-title"><h1>Consultation enquiry</h1><p>Choose the topic you would like to discuss. KoleQuant would confirm the service, price and appointment arrangements before booking.</p></div><div class="notice amber"><strong>Enquiry preview only.</strong> This form does not send a message or book an appointment. Use fictional contact details while reviewing it.</div><form id="consult-form" class="form-stack" novalidate><label for="contact-email">Email address *</label><input id="contact-email" type="email" inputmode="email" spellcheck="false" autocapitalize="none" required placeholder="demo@example.com" autocomplete="off"><label for="contact-country">Country of residence *</label><input id="contact-country" type="text" required value="${esc(state.answers.country)}" placeholder="Country" autocomplete="off"><label for="contact-reason">What would you like to discuss? *</label><select id="contact-reason" required><option value="">Select a topic</option>${['Understand my age estimate','Discuss my blood results','Explore DNA methylation testing','Discuss genetic counseling','Choose a suitable assessment'].map(x=>`<option>${x}</option>`).join('')}</select><label for="contact-name">Preferred name (optional)</label><input id="contact-name" type="text" autocomplete="off"><label for="contact-language">Preferred language</label><select id="contact-language"><option>English</option><option>Bulgarian</option></select><label for="contact-availability">Contact preferences (optional)</label><input id="contact-availability" type="text" maxlength="150" placeholder="For example, weekday afternoons"><p class="small muted">Do not enter medical history in this field.</p>${state.assessment?`<label class="checkline"><input type="checkbox" id="share-assessment"><span>Include selected parts of this assessment in the enquiry preview.</span></label><div id="share-options" class="sharing" hidden><strong class="small">Choose what to include</strong>${[['answers','Questionnaire answers'],['labs','Blood entries'],['result','Result and limitations'],['report','Assessment report']].map(([v,l])=>`<label class="checkline"><input type="checkbox" name="share" value="${v}" checked><span>${l}</span></label>`).join('')}</div>`:''}<label class="checkline"><input type="checkbox" id="contact-consent" required><span>I understand that this form is a preview and nothing will be sent.</span></label><button class="btn" type="submit">Preview enquiry ${arrow}</button></form></section></div>`;}
function enquiryDone(summary){return `<div class="wrap narrow"><div class="card"><div class="eyebrow">Enquiry preview</div><h1>Review your enquiry</h1><div class="notice"><strong>${esc(summary.reason)}</strong><br>Country: ${esc(summary.country)}<br>Selected information: ${esc(summary.share.join(', ')||'None')}</div><p>Nothing has been sent and no appointment is booked. To make a real enquiry, use the contact options on KoleQuant’s website.</p><div class="actions"><a class="btn" href="https://kolequant.xyz/en/index.html" target="_blank" rel="noopener noreferrer">Contact KoleQuant ↗</a><button class="btn secondary" data-action="${state.assessment?'results':'home'}">${state.assessment?'Back to results':'Back to home'}</button></div></div></div>`;}
function signup(){if(PAGES_PREVIEW){pagesInfo();return;}if(auth.loading){modal('Connecting to your account…','<p>Please wait, then try again.</p>');return;}if(auth.error){modal('Account connection unavailable','<p>'+esc(auth.error)+'</p><button class="btn" data-action="refresh-account">Try again</button>');return;}if(!auth.authenticated){modal('Sign in to save your assessments',`<p>Register or sign in with your ChatGPT account, then create your private KoleQuant profile. We do not handle passwords.</p><p class="small muted">Sign in before starting an assessment you want to save. A sign-in navigation will clear unsaved answers on this page.</p><a class="btn" href="/signin-with-chatgpt?return_to=%2F%23account" target="_top">Continue with ChatGPT →</a>`);return;}if(account()){goto('account');return;}modal('Create your KoleQuant account.',`<p>Your sign-in is verified. Choose a nickname to begin saving assessments and reports across devices.</p><form id="signup-form" class="form-stack"><label for="account-name">Account nickname</label><input id="account-name" type="text" required maxlength="40" placeholder="For example, My health journal" autocomplete="off"><label class="checkline"><input id="account-adult" type="checkbox" required><span>I am 18 or older.</span></label><label class="checkline"><input id="storage-consent" type="checkbox" required><span>I agree to the <button class="text-link" data-action="privacy">account storage notice</button> and explicitly consent to storing health information when I choose to save an assessment. This does not enrol me in research or marketing.</span></label><p class="small muted">Saved health records are encrypted in the hosted database. You can export and delete them in Data & settings.</p><button class="btn" type="submit">Create my account →</button></form>`);}

function snapshot(){
 state.saveId??=crypto.randomUUID();
 if(isHeartAssessment(state))return {id:state.saveId,assessmentType:HEART_ASSESSMENT,heart:structuredClone(state.heart.inputs)};
 return {id:state.saveId,answers:structuredClone(state.answers),lab:structuredClone(state.lab),labAge:state.labAge,labDate:state.labDate,labSubmitted:!!state.labSubmitted,labContext:!!state.labContext,labFasting:state.labFasting||'Not recorded',labReferenceMode:state.labReferenceMode,labReferenceGroup:state.labReferenceGroup,labReferenceVersion:state.labReferenceVersion,sample:state.sample,unlocked:state.unlocked};
}
function save(){if(PAGES_PREVIEW){pagesInfo();return;}if(!state.assessment){goto('home');return;}if(!account()){state.pendingSave=true;signup();return;}modal('Save this assessment?',`<p>Store this questionnaire, blood entries, result and educational report in <strong data-no-translate>${esc(account().name)}</strong>. They will be available when you sign in on another device.</p><p>Saving does not share information with the consultation team or enrol you in research.</p><div class="notice">This creates a dated snapshot. Later assessments are saved separately so your history stays intact. The saved copy keeps the answers and result from this assessment.</div><button class="btn" data-action="confirm-save">Save to my account →</button><button class="text-btn" data-action="close" style="margin-left:15px">Cancel</button>`);}

function trend(history){const candidates=history.filter(x=>isReportableAge(x.value)&&x.labDate&&x.model==='clinical-phenoage-2018-demo-v1'&&x.sample===!!state.showSampleTrends),data=candidates.filter(x=>x.labFasting==='Yes').sort((a,b)=>a.labDate.localeCompare(b.labDate)),older=candidates.length-data.length;const note=older?'<p class="small muted">Earlier records without confirmed fasting remain in your history. They are not included in this comparison.</p>':'';if(data.length<2)return '<div class="notice">Save at least two clinical age estimates with confirmed fasting to view this chart. Use the same method and comparable sampling conditions.</div>'+note;const min=Math.min(...data.map(x=>x.value))-3,max=Math.max(...data.map(x=>x.value))+3,start=new Date(data[0].labDate).getTime(),end=new Date(data.at(-1).labDate).getTime();const pts=data.map((d,i)=>({x:35+(end===start?i/(data.length-1):(new Date(d.labDate).getTime()-start)/(end-start))*530,y:150-(d.value-min)/(max-min)*115,d}));return `<div class="card trend"><h3>Clinical age estimates over time</h3><p class="small muted">${state.showSampleTrends?'Sample history':'Your saved results'} · clinical PhenoAge · years</p><svg viewBox="0 0 600 200" role="img" aria-label="Clinical age history: ${data.map(x=>x.labDate+' '+Math.round(x.value)+' years').join('; ')}"><path d="M35 165H565M35 20V165" stroke="var(--line)" fill="none"/><polyline points="${pts.map(p=>`${p.x},${p.y}`).join(' ')}" stroke="var(--accent)" stroke-width="2" fill="none"/>${pts.map(p=>`<circle cx="${p.x}" cy="${p.y}" r="5" fill="var(--accent)"/><text x="${p.x}" y="${p.y-12}" text-anchor="middle" fill="var(--ink)" font-size="12">${Math.round(p.d.value)}</text>`).join('')}<text x="35" y="190" fill="var(--muted)" font-size="11">${data[0].labDate}</text><text x="565" y="190" text-anchor="end" fill="var(--muted)" font-size="11">${data.at(-1).labDate}</text></svg><p class="small muted">A change can reflect health, illness, laboratory variation or sampling conditions. This chart does not measure your pace of aging or establish the effect of an intervention.</p>${note}</div>`;}
function dashboard(){
 const progress=assessmentProgress(state);
 const heartActive=isHeartAssessment(state);
 const heartDraft=heartActive?progress.hasData:assessmentProgress(parkedAssessments.get(HEART_ASSESSMENT)||{}).hasData;
 const common={progress:state.sample||heartActive?null:progress,profile:auth.profile,history:auth.history,authenticated:auth.authenticated,loading:auth.loading,error:auth.error||auth.collectionsError||'',page:state.libraryPage||0,assessment:state.assessment||(!heartActive&&progress.hasData),pagesPreview:PAGES_PREVIEW,heartCurrent:heartActive&&state.assessment,heartDraft,heartActive};
 if(state.accountTab==='saved'||state.accountTab==='report-history')return renderRecordLibrary({...common,reports:state.accountTab==='report-history'});
 if(state.accountTab==='history')return renderAssessments(common);
 if(state.accountTab==='reports')return renderReportLibrary(common);
 if(state.accountTab==='settings')return PAGES_PREVIEW?renderPagesAccount():renderAccount(common);
 const back='<button class="text-btn task-back" data-action="account-tab" data-tab="settings">← Account</button>';
 if(state.accountTab==='about')return `<div class="wrap app-screen account-subscreen">${back}${screenHeading('INFORMATION & SUPPORT','About this app')}<section class="card" data-theme-part><h2>Understand the assessment</h2><p>Explore the assessment experience and its methods. Automated educational estimates do not diagnose disease or predict lifespan.</p><a class="text-link" href="https://kolequant.xyz/en/index.html" target="_blank" rel="noopener noreferrer">KoleQuant website ↗</a></section><section class="account-settings utility-actions" aria-label="Support and assessment controls"><button class="account-setting" data-action="consult"><span class="setting-symbol">${uiIcon('consult')}</span><span class="setting-copy"><strong>Contact options</strong><small>Questions, interpretation and support</small></span>${uiIcon('external')}</button><button class="account-setting quiet-setting" data-action="reset"><span class="setting-symbol">${uiIcon('reset')}</span><span class="setting-copy"><strong>Reset assessment</strong><small>Clear the current assessment</small></span>${uiIcon('forward')}</button></section></div>`;
 if(state.accountTab==='records'){const list=[...auth.history].reverse(),page=Math.max(0,Math.min(state.libraryPage||0,Math.max(0,Math.ceil(list.length/3)-1)));return `<div class="wrap app-screen account-subscreen"><button class="text-btn task-back" data-action="account-tab" data-tab="data">← Saved data</button>${screenHeading('YOUR ACCOUNT','Manage records')}<div class="record-list">${list.slice(page*3,page*3+3).map(x=>`<article class="record-row"><div><h3>${assessmentTitle(x)}</h3><p>${esc(x.labDate||new Date(x.saved).toLocaleDateString('en-GB'))}${x.sample?' · Sample':''}</p></div><button class="text-link" data-action="delete-saved" data-id="${esc(x.id)}" style="margin-left:auto">Delete</button></article>`).join('')||'<div class="quiet-empty"><p>No saved records.</p></div>'}</div><nav class="compact-pager"><button class="text-btn" data-action="library-page" data-page="${page-1}" ${page===0?'disabled':''}>← Previous</button><span>${page+1} / ${Math.max(1,Math.ceil(list.length/3))}</span><button class="text-btn" data-action="library-page" data-page="${page+1}" ${page>=Math.ceil(list.length/3)-1?'disabled':''}>Next →</button></nav></div>`;}
 if(state.accountTab==='progress')return `<div class="wrap app-screen account-subscreen"><button class="text-btn task-back" data-action="account-tab" data-tab="history">← My assessments</button>${screenHeading('YOUR HISTORY','Progress over time')}<div class="actions"><button class="btn secondary" data-action="trend-personal">My results</button><button class="text-link" data-action="trend-sample">Sample history</button></div>${trend(auth.history)}</div>`;
 if(state.accountTab==='purchases')return `<div class="wrap app-screen account-subscreen">${back}${screenHeading('YOUR ACCOUNT','Purchases')}${statusMessage({loading:auth.loading,error:auth.error||auth.purchaseError})}${account()?purchaseList():'<section class="card"><h2>Keep your reports together.</h2><p>Sign in to check purchased-report access and payment status.</p><button class="btn" data-action="signup">Sign in / create profile →</button></section>'}</div>`;
 return `<div class="wrap app-screen account-subscreen">${back}${screenHeading('YOUR ACCOUNT','Manage saved data')}<section class="card"><h2>Your information, your choice.</h2><p>Saved assessments and report snapshots are encrypted before database storage. Saving does not enable research, marketing or consultation sharing.</p>${account()?'<div class="actions"><button class="btn secondary" data-action="export">Export data & reports</button><button class="text-link" data-action="account-tab" data-tab="records">Manage individual records</button><button class="text-link" data-action="delete-account">Delete KoleQuant account</button></div><button class="text-link" data-action="import-legacy">Import an old on-device demo account</button>':'<button class="btn" data-action="signup">Sign in / create profile →</button>'}</section><button class="text-link" data-action="privacy">Read the full storage notice ↗</button></div>`;
}
function legacyAccounts(){try{return JSON.parse(localStorage.getItem('kq-demo-workspaces-v1'))?.accounts||[];}catch{return [];}}
function importLegacy(){const accounts=legacyAccounts();if(!accounts.length){modal('No old demo accounts found.','<p>This browser has no saved demo accounts to import.</p>');return;}modal('Import an on-device demo account',`<p>This will upload the selected demo history to your signed-in KoleQuant account. Please review which account you select. Original browser copies stay on this device.</p><form id="import-form"><label for="legacy-id">Select an old demo account</label><select id="legacy-id">${accounts.map(a=>`<option value="${esc(a.id)}" data-user-prefix="${esc(a.name)}">${esc(a.name)} (${a.history?.length||0} assessments)</option>`).join('')}</select><label class="checkline"><input type="checkbox" required><span>I choose to upload this account’s saved health information to my private online account.</span></label><button class="btn" type="submit">Import selected history</button></form>`);}


function organizeConsultation(){
 const wrap=$('#main>.wrap'),form=$('#consult-form');if(!form||!wrap)return;wrap.classList.add('consult-screen');
 const nodes=[...form.children],pages=[document.createElement('div'),document.createElement('div'),document.createElement('div')];pages.forEach((p,i)=>{p.className='consult-page';p.hidden=i!==0;});
 let page=0;for(const node of nodes){if(node.matches('label[for="contact-name"]'))page=1;if(node.matches('.checkline'))page=2;pages[page].append(node);}
 form.append(...pages);const nav=document.createElement('div');nav.className='form-nav';nav.innerHTML='<button class="text-btn" type="button" data-action="consult-step" data-direction="-1" disabled>← Back</button><span class="consult-page-count small muted">1 / 3</span><button class="btn" type="button" data-action="consult-step" data-direction="1">Continue →</button>';form.append(nav);form.dataset.page='0';
}
function fitQuestionChoices(){
 const q=questionContext(state).question,options=$('#questions .options'),main=$('#main');
 if(q.type!=='multi'||!options)return;
 const bounds=options.getBoundingClientRect(),bottom=main.getBoundingClientRect().bottom;
 if(!bounds.height||!bottom)return;
 const available=bottom-bounds.top-($('#questions .form-nav')?.getBoundingClientRect().height||0)-($('.question-optional')?.getBoundingClientRect().height||0)-($('#questions .error')?.getBoundingClientRect().height||0)-34;
 if(bounds.height<=available)return;
 const labels=[...options.querySelectorAll('.option')],rows=[];
 for(const label of labels){const box=label.getBoundingClientRect();let row=rows.find(row=>Math.abs(row.top-box.top)<2);if(!row){row={top:box.top,bottom:box.bottom,count:0};rows.push(row);}row.bottom=Math.max(row.bottom,box.bottom);row.count++;}
 const fitting=rows.filter(row=>row.bottom-bounds.top<=available),capacity=Math.max(rows[0]?.count||2,fitting.reduce((sum,row)=>sum+row.count,0));
 if(capacity<q.options.length){state.choiceCapacity=capacity;$('#main').innerHTML=questionnaire();}
}
function syncChoiceInputs(id,target){
 for(const input of $('#questions')?.querySelectorAll('input[data-answer]')||[]){if(input.dataset.answer!==id)continue;input.checked=Array.isArray(state.answers[id])?state.answers[id].includes(input.value):state.answers[id]===input.value;}
 delete state.errors[id];target.closest('fieldset')?.querySelector('.error')?.remove();
 if($('#questions')){const context=questionContext(state);$('.task-caption>span:last-child').textContent='Question '+(context.index+1)+' / '+context.questions.length;language.refresh();}
}
function captureQuestion(){
 const form=$('#questions');if(!form)return;
 for(const input of form.querySelectorAll('input[data-answer]:not([type=checkbox]):not([type=radio])'))state.answers[input.dataset.answer]=input.value;
 for(const input of form.querySelectorAll('input[data-answer][type=radio]:checked'))state.answers[input.dataset.answer]=input.value;
 const q=questionContext(state).question;
 if(q.type==='multi'){const inputs=[...form.querySelectorAll('input[data-answer][type=checkbox]')],visible=inputs.map(input=>input.value),other=(state.answers[q.id]||[]).filter(value=>!visible.includes(value));state.answers[q.id]=[...other,...inputs.filter(input=>input.checked).map(input=>input.value)];}
 for(const input of form.querySelectorAll('select[data-unit]'))state.answers[input.dataset.unit+'Unit']=input.value;
}
function captureLabs(){
 const form=$('#labs-form');if(!form)return;
 for(const input of form.querySelectorAll('input[data-lab]')){state.lab[input.dataset.lab]??={unit:labs.find(l=>l.id===input.dataset.lab).units[0]};state.lab[input.dataset.lab].value=input.value;}
 for(const input of form.querySelectorAll('select[data-lab-unit]')){state.lab[input.dataset.labUnit]??={value:''};state.lab[input.dataset.labUnit].unit=input.value;}
 for(const input of form.querySelectorAll('input[data-lab-reference]')){state.lab[input.dataset.labReference]??={};state.lab[input.dataset.labReference][input.dataset.referenceKey]=input.value;}
 for(const input of form.querySelectorAll('select[data-lab-reference-rule]')){state.lab[input.dataset.labReferenceRule]??={};state.lab[input.dataset.labReferenceRule][input.dataset.referenceKey]=input.value==='exclusive';}
 if($('#lab-age'))state.labAge=$('#lab-age').value;if($('#lab-date'))state.labDate=$('#lab-date').value;
 for(const [id,key] of [['lab-reference-mode','labReferenceMode'],['lab-reference-group','labReferenceGroup']])if($('#'+id))state[key]=$('#'+id).value;
 if($('#crp-assay')){state.lab.crp??={};state.lab.crp.assay=$('#crp-assay').value;}
 if($('#lab-context'))state.labContext=$('#lab-context').checked;
 const fasting=form.querySelector('[name=lab-fasting]:checked');if(fasting)state.labFasting=fasting.value;
}
function heartForm(){return renderHeartForm({inputs:state.heart.inputs,errors:state.errors,step:state.heartStep,showOptional:state.heartOptional,prefilled:state.heartPrefilled,touched:state.heartTouched,prefillUnavailable:state.heartPrefillUnavailable});}
function captureHeart(form){
 const previous=state.heart.inputs,inputs=readHeartForm(form,previous,state.heartStep);
 if(inputs.smoking!==previous.smoking)for(const id of ['smokingDays30','cigarettes','smokingYears'])delete inputs[id];
 if(inputs.conditions!==previous.conditions)delete inputs.diagnoses;
 if(JSON.stringify(inputs)===JSON.stringify(previous))return;
 dirty();
 state.heart={inputs};
 state.assessment=false;
}
function reviewHeartField(target,editing=false){
 const id=target.dataset.heartValue||target.dataset.heartReference||target.dataset.heartUnit;
 if(!id)return;
 state.heartTouched??={};
 state.heartTouched[id]=!editing;
 if(editing||target.tagName==='SELECT'){
  const errorKey=id+(target.dataset.heartReference?'Reference':'');
  delete state.errors[errorKey];
  target.form.querySelector('#heart-'+errorKey+'-error')?.remove();
  if(target.dataset.heartReference)target.removeAttribute('aria-invalid');
 }
 refreshHeartFeedback(target.form,state.heart.inputs,state.heartTouched);
}
function render(){state.choiceCapacity=undefined;nav();document.body.dataset.view=state.view;const views={home,consent,questionnaire,review,labs:labForm,heart:heartForm,results:result,report,consult:consultation,account:dashboard,enquiry:()=>enquiryDone(state.enquiry)};$('#main').innerHTML=(views[state.view]||home)();if(state.view==='questionnaire'){language.refresh();fitQuestionChoices();}if(state.view==='consult')organizeConsultation();if(state.view==='review')$('#main>.wrap')?.classList.add('app-screen','task-screen','review-screen');if(state.view==='consent')$('#main>.wrap')?.classList.add('app-screen','task-screen','consent-screen');decorateDirectionalSymbols($('#main'));document.title=({home:'Your health workspace',account:state.accountTab==='reports'?'Reports':state.accountTab==='history'?'My assessments':'Your account',results:'Your assessment',heart:'Heart & Vascular',report:'Your report',consult:'Consultation'}[state.view]||'Your assessment')+' — '+APP_NAME;language.refresh();resultMotion.refresh();}
function reset(goal=assessmentType(state)){draftBackup=null;state=freshAssessment(goal);goto('consent');}
function selectAssessment(type){
 if(state.sample){state=draftBackup||freshAssessment();draftBackup=null;}
 const current=assessmentType(state);
 if(current===type)return;
 parkedAssessments.set(current,state);
 state=parkedAssessments.get(type)||freshAssessment(type);
 parkedAssessments.delete(type);
}
async function enterHeart(){
 const draft=state,view=state.view,accountTab=state.accountTab;
 if(!draft.heart.result){
  const profile=parkedAssessments.get('profile');
  let answers=!profile?.sample&&Object.keys(profile?.answers||{}).length?profile.answers:null;
  if(!answers&&!PAGES_PREVIEW){
   if(accountRefresh)await accountRefresh;
   const saved=auth.profile&&auth.history.findLast(record=>!record.sample&&record.hasProfile&&!isHeartAssessment(record));
   if(saved){
    try{answers=(await api('assessments/'+saved.id)).assessment.answers;}
    catch{draft.heartPrefillUnavailable=true;}
   }
  }
  if(state!==draft||state.view!==view||state.accountTab!==accountTab)return;
  const previous=draft.heart.inputs,prefill=heartPrefill(answers||{});
  if(previous.smoking&&previous.smoking!==prefill.smoking){delete prefill.smokingDays30;delete prefill.cigarettes;}
  if(previous.conditions&&previous.conditions!==prefill.conditions)delete prefill.diagnoses;
  const additions=Object.entries(prefill).filter(([id])=>!Object.hasOwn(previous,id));
  if(additions.length){
   Object.assign(draft.heart.inputs,Object.fromEntries(additions));
   draft.heartPrefilled=[...new Set([...(draft.heartPrefilled||[]),...additions.map(([id])=>id)])];
   draft.heartStep='review';draft.heartReviewEdit=false;
  }
 }
 goto('heart');
}
function returnToHeartReview(){
 state.heartReviewEdit=false;state.heartStep=heartRoute(state.heart.inputs,state.heartPrefilled)[0].id;goto('heart');
}
function beginAssessment(goal){
 if(state.view==='review')state.profileCompleted=true;
 selectAssessment(goal===HEART_ASSESSMENT?HEART_ASSESSMENT:'profile');
 if(goal===HEART_ASSESSMENT){
  state.reportTab='summary';
  if(state.consent)return enterHeart();
 }
 state=continueAssessment(state,goal);goto(state.view);
}
function loadSample(){if(!state.sample&&assessmentProgress(state).hasData)draftBackup=structuredClone(state);state={...freshAssessment(),resultTab:'summary',answers:structuredClone(sampleAnswers),lab:sampleLabs(),labAge:'45',labReferenceGroup:'male',labFasting:'Yes',labDate:'2026-11-01',labValid:true,labContext:true,sample:true,labSubmitted:true,consent:true,assessment:true,profileCompleted:true};state.lab.crp.assay='standard-crp';goto('results');}
document.addEventListener('click',async e=>{const b=e.target.closest('[data-action]');if(!b)return;const act=b.dataset.action;e.preventDefault();
 if(state.view==='questionnaire')captureQuestion();else if(state.view==='labs')captureLabs();
 if(act==='pages-info'){pagesInfo();return;}
 if(act==='report-tab'){state.reportTab=b.dataset.tab;goto('report');return;}
 if(act==='heart-back'){
  if(state.heartReviewEdit){returnToHeartReview();return;}
  const steps=heartRoute(state.heart.inputs,state.heartPrefilled);
  const index=steps.findIndex(step=>step.id===state.heartStep);
  if(index>0){state.heartStep=steps[index-1].id;goto('heart');}
  else{state.accountTab='history';goto('account');}
  return;
 }
 if(act==='heart-review-edit'){
  state.heartStep=b.dataset.part;state.heartReviewEdit=true;goto('heart');return;
 }
 if(act==='heart-edit'){
  const part=b.dataset.part;
  state.heartStep=part==='answers'?(state.heartPrefilled?.length?'review':'country'):part==='specialist'?'measurements':part;
  state.heartReviewEdit=!heartRoute(state.heart.inputs,state.heartPrefilled).some(step=>step.id===state.heartStep);
  state.heartOptional=part==='specialist';
  state.reportTab=['measurements','blood-pressure'].includes(state.heartStep)?'measurements':'summary';
  goto('heart');
  if(state.heartOptional)$('#heart-apob')?.focus();
  return;
 }
 if(act==='restore-draft'&&draftBackup){state=draftBackup;draftBackup=null;goto(state.view);return;}
 if(act==='new-assessment'){modal('Start a new assessment?','<p>This clears the current unsaved answers and blood entries.</p><div class="actions"><button class="btn secondary" data-action="close">Keep current assessment</button><button class="btn" data-action="new-assessment-confirm">Start new assessment</button></div>');return;}
 if(act==='new-assessment-confirm'){close();reset();return;}
 if(act==='sample-report'){loadSample();state.reportTab='summary';goto('report');return;}
 if(act==='result-tab'){state.resultTab=b.dataset.tab;goto('results');return;}
 if(act==='insight-page'){state.insightPage=Number(b.dataset.page);goto('results');return;}
 if(act==='library-page'){state.libraryPage=Number(b.dataset.page);goto('account');return;}
 if(act==='lab-back'){if((state.labStep||0)>0){state.labStep--;goto('labs');}else goto('consent');return;}
 if(act==='consult-step'){advanceContactPage($('#consult-form'),Number(b.dataset.direction));return;}
 if(act==='account-area'||act==='assessments'){state.accountTab=b.dataset.tab||'history';state.libraryPage=0;goto('account');void refreshAccount().then(()=>{if(state.view==='account')render();});return;}if(act==='home'){goto('home');void hydrateOverview();return;}if(act==='method'){method();return;}if(act==='privacy'){privacy();return;}if(act==='close'){close();return;}if(act==='start'){beginAssessment('profile');return;}if(act==='start-labs'){beginAssessment('labs');return;}if(act==='start-heart'){await action(b,()=>beginAssessment(HEART_ASSESSMENT));return;}if(act==='sample'){loadSample();return;}if(act==='consent-next'){state.consent=$('#consent').checked;if(!state.consent){state.errors={consent:'Confirm your age and that you have read the assessment note.'};render();return;}if(state.goal===HEART_ASSESSMENT){await action(b,enterHeart);return;}goto(state.goal==='labs'?'labs':'questionnaire');return;}
 if(act==='question-back'){if(questionChoices(state).page>0){state.optionPage--;render();return;}Object.assign(state,questionDestination(state,-1));goto(state.view);return;}if(act==='skip'){dirty();delete state.answers[b.dataset.id];Object.assign(state,questionDestination(state));goto(state.view);return;}if(act==='edit-section'){state.step=Number(b.dataset.index);state.questionIndex=0;state.optionPage=0;goto('questionnaire');return;}if(act==='add-drink'){editDrink();return;}if(act==='edit-drink'){editDrink(Number(b.dataset.index));return;}if(act==='remove-drink'){dirty();state.answers.drinks.splice(Number(b.dataset.index),1);render();return;}
 if(act==='without-labs'){state.profileCompleted=true;dirty();state.labSubmitted=false;state.assessment=true;goto('results');return;}if(act==='labs'){beginAssessment('labs');return;}if(act==='sample-labs'){loadSample();state.labStep=0;goto('labs');return;}if(act==='results'){if(state.view==='review')state.profileCompleted=true;state.assessment=true;state.resultTab='summary';goto('results');return;}if(act==='review'){goto('review');return;}if(act==='report'){state.reportTab='summary';goto('report');return;}if(act==='checkout'){checkout();return;}if(act==='print'){if(isHeartAssessment(state)||auth.reportReview||state.savedReport?.full===true){const details=[...document.querySelectorAll('.report-paper details')],previous=details.map(d=>d.open);details.forEach(d=>d.open=true);window.addEventListener('afterprint',()=>details.forEach((d,i)=>d.open=previous[i]),{once:true});window.print();}else checkout();return;}
 if(act==='save-before-checkout'){await action(b,async()=>{await api('assessments','POST',snapshot());await openSaved(state.saveId,'report');checkout();});return;}
 if(act==='purchase-checkout'){await action(b,async()=>{const result=await api('payments/checkout','POST',{assessmentId:state.saveId,confirm:true});if(result.purchased){close();await openSaved(state.saveId,'report');return;}const url=new URL(result.url);if(url.protocol!=='https:'||url.hostname!=='checkout.stripe.com')throw Error('Could not open secure checkout.');modal('Your secure checkout is ready.',`<p>Continue to Stripe to review the final total and pay. Your saved report stays in your account if you leave checkout.</p><a class="btn" href="${esc(url.href)}" target="_top" rel="noreferrer">Open Stripe checkout →</a><p class="small muted" style="margin-top:15px">You can return to Purchases to check or cancel an unfinished checkout.</p>`);});return;}
 if(act==='refresh-payments'||act==='check-order'){await action(b,async()=>{const result=await api('payments/refresh','POST',act==='check-order'?{orderId:b.dataset.id}:{});auth.purchases=result.purchases;await refreshAccount();state.accountTab='purchases';goto('account');});return;}
 if(act==='cancel-payment'){await action(b,async()=>{await api('payments/cancel','POST',{orderId:b.dataset.id});await refreshAccount();state.accountTab='purchases';goto('account');});return;}
 if(act==='consult'){goto('consult');return;}if(act==='account'){state.accountTab='settings';goto('account');void refreshAccount().then(()=>{if(state.view==='account')render();});return;}if(act==='signup'||act==='signin'){signup();return;}if(act==='refresh-account'){close();const job=refreshAccount();goto('account');void job.then(()=>{if(state.view==='account')render();});return;}if(act==='account-tab'){if(state.accountTab!==b.dataset.tab)state.libraryPage=0;state.accountTab=b.dataset.tab;goto('account');return;}if(act==='trend-personal'||act==='trend-sample'){state.showSampleTrends=act==='trend-sample';goto('account');return;}if(act==='save'){save();return;}
 if(act==='confirm-save'){await action(b,async()=>{
  const draft=state, entry=snapshot();
  await api('assessments','POST',entry);
  if(isHeartAssessment(draft)&&draft.saveId===entry.id)draft.saved=new Date().toISOString();
  await refreshAccount();if(auth.error)throw new Error('Your assessment was saved, but history could not refresh. Reopen your account to check.');
  close();if(state===draft){state.accountTab='history';goto('account');}announce('Assessment and report saved to your private account.');
 });return;}
 if(act==='open-saved'||act==='open-report'){await action(b,async()=>{close();await openSaved(b.dataset.id,act==='open-report'?'report':'results');});return;}
 if(act==='delete-saved'){modal('Delete this saved assessment?',`<p>This removes the assessment and its report, including purchased access, from your live account on all devices. It does not request a refund. Downloaded copies remain on your device.</p><button class="btn" data-action="confirm-delete-saved" data-id="${esc(b.dataset.id)}">Delete assessment & report</button>`);return;}
 if(act==='confirm-delete-saved'){await action(b,async()=>{
  const id=b.dataset.id;
  await api('assessments/'+id,'DELETE',{confirm:true});
  if(state.saveId===id){dirty();state.answers={};state.lab={};state.assessment=false;state.labSubmitted=false;if(isHeartAssessment(state))state.heart={inputs:{}};}
  for(const [type,draft] of parkedAssessments)if(draft.saveId===id)parkedAssessments.delete(type);
  if(draftBackup?.saveId===id)draftBackup=null;
  await refreshAccount();close();goto('account');announce('Assessment and report deleted.');
 });return;}
 if(act==='delete-account'){modal('Delete your KoleQuant account?',`<p>This removes your profile, assessments and report snapshots from the live database across devices. It does not delete your ChatGPT account. This also removes purchased-report access. It does not request a refund. Provider backups, downloads and Stripe payment records have separate lifecycles.</p><form id="delete-account-form"><label for="delete-confirm">Type DELETE to confirm</label><input id="delete-confirm" type="text" required pattern="DELETE" autocomplete="off"><button class="btn" type="submit" style="margin-top:20px">Delete my account & history</button></form>`);return;}
 if(act==='export'){await action(b,async()=>{const data=await api('account/export');const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='kolequant-account-export.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);});return;}
 if(act==='import-legacy'){importLegacy();return;}
 if(act==='seed-history'){await action(b,async()=>{for(const [date,rdw] of [['2026-10-01',14.4],['2026-11-01',14]]){const l=sampleLabs();l.rdw.value=String(rdw);await api('assessments','POST',{id:crypto.randomUUID(),answers:structuredClone(sampleAnswers),lab:l,labAge:'45',labDate:date,labSubmitted:true,labContext:true,labFasting:'Yes',sample:true,unlocked:false});}await refreshAccount();state.accountTab='progress';state.showSampleTrends=true;goto('account');});return;}


});
document.addEventListener('input',e=>{const t=e.target;if(t.form?.id==='heart-form'){if(!t.dataset.heartUnit)captureHeart(t.form);if(t.dataset.heartValue||t.dataset.heartReference&&t.type==='text')reviewHeartField(t,true);return;}if(t.dataset.labReference){dirty();state.lab[t.dataset.labReference]??={};state.lab[t.dataset.labReference][t.dataset.referenceKey]=t.value;delete state.errors[t.dataset.labReference+'Reference'];t.closest('details')?.querySelector('.error')?.remove();}});
document.addEventListener('change',e=>{const t=e.target;if(t.form?.id==='heart-form'){if(t.dataset.heartUnit)changeHeartUnit(t,state.heart.inputs[t.dataset.heartUnit]);captureHeart(t.form);if(t.dataset.heartUnit||t.dataset.heartReference&&t.tagName==='SELECT')reviewHeartField(t);return;}if(['lab-reference-mode','lab-reference-group','crp-assay'].includes(t.id)){dirty();if(t.id==='crp-assay'){state.lab.crp??={};state.lab.crp.assay=t.value;}else{state[t.id==='lab-reference-mode'?'labReferenceMode':'labReferenceGroup']=t.value;state.labReferenceVersion=REFERENCE_CATALOG_VERSION;}}if(t.dataset.labReferenceRule){dirty();state.lab[t.dataset.labReferenceRule]??={};state.lab[t.dataset.labReferenceRule][t.dataset.referenceKey]=t.value==='exclusive';}});
document.addEventListener('toggle',e=>{if(e.target.matches?.('.reference-editor[open]'))document.querySelectorAll('.reference-editor[open]').forEach(editor=>{if(editor!==e.target)editor.open=false;});},true);
document.addEventListener('focusout',e=>{const t=e.target;if(t.form?.id==='heart-form'&&(t.dataset.heartValue||t.dataset.heartReference&&t.type==='text'))reviewHeartField(t);});
document.addEventListener('input',e=>{const t=e.target;clearContactFeedback(t);if(t.dataset.answer!==undefined||t.dataset.lab||t.dataset.drink!==undefined||['lab-age','lab-date'].includes(t.id))dirty();if(t.dataset.answer!==undefined&&!['radio','checkbox'].includes(t.type)){state.answers[t.dataset.answer]=t.value;if(['weight','weightYearAgo'].includes(t.dataset.answer))delete state.answers.weightChangeIntent;}if(t.dataset.lab){state.lab[t.dataset.lab]??={unit:labs.find(l=>l.id===t.dataset.lab).units[0]};state.lab[t.dataset.lab].value=t.value;}if(t.dataset.drink!==undefined)state.answers.drinks[Number(t.dataset.drink)][t.dataset.key]=t.value;if(t.id==='lab-age')state.labAge=t.value;if(t.id==='lab-date')state.labDate=t.value;});
document.addEventListener('change',e=>{const t=e.target;clearContactFeedback(t);if(t.dataset.answer!==undefined||t.dataset.unit||t.dataset.labUnit||['lab-valid','lab-context'].includes(t.id))dirty();if(t.dataset.answer!==undefined&&['radio','checkbox'].includes(t.type)){const id=t.dataset.answer;if(t.type==='checkbox'){const exclusive=['None','Prefer not to say','Not sure'];let v=Array.isArray(state.answers[id])?[...state.answers[id]]:[];if(t.checked){v=exclusive.includes(t.value)?[t.value]:[...v.filter(x=>!exclusive.includes(x)),t.value];}else v=v.filter(x=>x!==t.value);state.answers[id]=v;}else{state.answers[id]=t.value;if(['smoking','smokingEver100','smokingRegular'].includes(id))pruneSmokingAnswers();if(id==='alcohol'&&t.value!=='Yes'){delete state.answers.alcoholDays;delete state.answers.drinks;}}syncChoiceInputs(id,t);}
 if(t.dataset.unit){state.answers[t.dataset.unit+'Unit']=t.value;if(['weight','weightYearAgo'].includes(t.dataset.unit))delete state.answers.weightChangeIntent;}if(t.dataset.labUnit){const id=t.dataset.labUnit,previous=state.lab[id]||{value:''},changed=previous.unit!==t.value&&['referenceLow','referenceHigh'].some(key=>previous[key]!==undefined&&previous[key]!=='');state.lab[id]=setLabEntryUnit(id,previous,t.value);for(const input of t.closest('fieldset').querySelectorAll('[data-lab-reference]'))input.value=state.lab[id][input.dataset.referenceKey]??'';if(changed){let note=t.closest('fieldset').querySelector('.reference-unit-note');if(!note){note=document.createElement('p');note.className='hint reference-unit-note';note.setAttribute('role','status');t.closest('.input-row').after(note);}note.textContent='Reference limits were converted to the selected unit. Check them against your report.';language.refresh();}}if(t.id==='lab-valid')state.labValid=t.checked;if(t.name==='lab-fasting'){dirty();state.labFasting=t.value;}if(t.id==='lab-context')state.labContext=t.checked;if(t.id==='share-assessment')$('#share-options').hidden=!t.checked;});
document.addEventListener('submit',async e=>{e.preventDefault();const f=e.target;if(f.id==='questions'){captureQuestion();const choices=questionChoices(state);if(choices.page<choices.pages-1){state.optionPage=choices.page+1;render();return;}const q=questionContext(state).question,errors=validateQuestionnaire(state.answers);state.errors=errors[q.id]?{[q.id]:errors[q.id]}:{};if(Object.keys(state.errors).length){render();return;}Object.assign(state,questionDestination(state));goto(state.view);}
 if(f.id==='heart-form'){
  captureHeart(f);
  const steps=state.heartReviewEdit?heartSteps(state.heart.inputs).filter(step=>step.id===state.heartStep):heartRoute(state.heart.inputs,state.heartPrefilled);
  const index=steps.findIndex(step=>step.id===state.heartStep);
  const {inputs,errors,result,review}=assessHeartVascular(state.heart.inputs,{requireHistory:!state.saved});
  const errorIndex=steps.findIndex(step=>step.fields.some(field=>errors[field.id]||errors[field.id+'Reference']));
  if(errorIndex>=0&&errorIndex<=index){
   state.heartStep=steps[errorIndex].id;state.errors=errors;render();
   $('#heart-form [aria-invalid="true"]')?.focus();
   return;
  }
  if(state.heartReviewEdit){returnToHeartReview();return;}
  if(index<steps.length-1){
   state.heartStep=steps[index+1].id;goto('heart');return;
  }
  if(!state.saved){dirty();state.heart={inputs,result,review};}
  state.assessment=true;state.heartOptional=false;goto('report');return;
 }
 if(f.id==='drink-form'){if(!f.reportValidity())return;const draft={type:$('#drink-type').value,count:$('#drink-count').value,ml:$('#drink-ml').value,abv:$('#drink-abv').value},index=Number(f.dataset.index);state.answers.drinks??=[];if(index<0)state.answers.drinks.push(draft);else state.answers.drinks[index]=draft;dirty();close();render();return;}
 if(f.id==='labs-form'){
  captureLabs();
  if($('#lab-age'))state.labAge=$('#lab-age').value||state.answers.age;if($('#lab-date'))state.labDate=$('#lab-date').value;
  const step=state.labStep||0;let errors={};
  if(step===0){if(!Number.isInteger(Number(state.labAge))||Number(state.labAge)<18||Number(state.labAge)>120)errors.age='Enter a whole-year age from 18 to 120.';if(!state.labDate||state.labDate>today())errors.date='Enter the collection date. It cannot be in the future.';}
  else if(step<4){const all=validateLabs(state.lab),references=validateLabReferences(state.lab);for(const l of labs.slice((step-1)*3,step*3)){if(all[l.id])errors[l.id]=all[l.id];if(references[l.id])errors[l.id+'Reference']=references[l.id];}}
  else{state.labValid=$('#lab-valid').checked;state.labContext=$('#lab-context').checked;errors={...validateLabs(state.lab),...Object.fromEntries(Object.entries(validateLabReferences(state.lab)).map(([id,message])=>[id+'Reference',message]))};if(!state.labValid)errors.confirm='Confirm that these entries match the laboratory report.';}
  state.errors=errors;if(Object.keys(errors).length){if(step===4)state.labStep=labErrorStep(errors);render();return;}
  if(step<4){state.labStep=step+1;goto('labs');return;}state.labSubmitted=true;state.assessment=true;state.resultTab='summary';goto('results');
 }
 if(f.id==='consult-form'){
  const current=Number(f.dataset.page)||0;if(current<2){advanceContactPage(f,1);return;}
  for(let i=0;i<3;i++){if(!validateContactPage(f,i,{focus:false})){showContactPage(f,i);return;}}
  state.enquiry={reason:$('#contact-reason').value,country:$('#contact-country').value,share:$('#share-assessment')?.checked?[...document.querySelectorAll('input[name="share"]:checked')].map(x=>x.value):[]};goto('enquiry');
 }
 if(f.id==='signup-form'){if(!f.reportValidity())return;const name=$('#account-name').value.trim(),adult=$('#account-adult').checked,consent=$('#storage-consent').checked;await action(f.querySelector('[type="submit"]'),async()=>{await api('account','POST',{name,adult,consent,consentVersion});await refreshAccount();if(auth.error)throw new Error(auth.error);close();if(state.pendingCheckout){state.pendingCheckout=false;checkout();}else if(state.pendingSave){state.pendingSave=false;save();}else goto('account');});}
 if(f.id==='delete-account-form'){if(!f.reportValidity())return;await action(f.querySelector('[type="submit"]'),async()=>{await api('account','DELETE',{confirm:$('#delete-confirm').value});auth.profile=null;auth.history=[];close();parkedAssessments.clear();reset('profile');goto('account');announce('Your KoleQuant account and live records have been deleted.');});}
 if(f.id==='import-form'){if(!f.reportValidity())return;const a=legacyAccounts().find(x=>x.id===$('#legacy-id').value);await action(f.querySelector('[type="submit"]'),async()=>{let count=0;for(const entry of a.history||[]){try{await api('assessments','POST',{...entry,id:entry.id||crypto.randomUUID()});count++;}catch(error){await refreshAccount();throw new Error(count+' assessments imported. The next entry could not be imported: '+error.message);}}await refreshAccount();close();state.accountTab='history';goto('account');announce(count+' assessments imported. Original copies remain on this browser.');});}


});
document.addEventListener('invalid',e=>{if(e.target.closest?.('#consult-form'))e.preventDefault();},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('.overlay'))close();if(e.key==='Tab'&&$('.modal')){const items=[...$('.modal').querySelectorAll('button,a,input,select')].filter(el=>!el.hidden&&!el.disabled);const first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});

document.addEventListener('click',e=>{if(e.target.closest('[data-action="reset"]')){reset();goto('home');}});
initializeAppearance();
render();
refreshAccount().then(async()=>{if(location.hash==='#account'){state.accountTab='settings';goto('account');}else if(['account','report','results'].includes(state.view))render();else if(state.view==='home'){if(auth.profile&&!auth.history.length)render();await hydrateOverview();}await paymentReturn();});
window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
