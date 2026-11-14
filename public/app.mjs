import {initializeLabFeedback,clinicalCheckSummary} from './lab-feedback.mjs';
import {clinicalForDisplay} from './lab-safety.mjs';
import {initializeAppearance} from './theme.mjs';
import {PAGES_PREVIEW,NATIVE_APP,HOSTED_APP_URL} from './hosting-mode.mjs';
import {accountFetch,accountOrigin,forgetNativeAccount,listenForProviderReturn,openProvider,shareNativeExport} from './native-account.mjs';
import {decorateDirectionalSymbols} from './icons.mjs';
import {clearContactFeedback,validateContactPage,showContactPage,advanceContactPage} from './consultation-feedback.mjs';
import {renderThemeHome,renderOverviewPicker,overviewChoices,overviewPresentation} from './theme-home.mjs';
import {initializeResultMotion} from './result-motion.mjs';
import {initializeLanguage} from './language-system.mjs';
import {initializeLaunch} from './launch-screen.mjs';
import {APP_NAME} from './brand.mjs';
import {CONSENT_VERSION} from './account-consent.mjs';
import {accountEntry} from './account-entry.mjs';
import {freshAssessment,continueAssessment,assessmentProgress,previousAssessment,profileProgress,profileSectionProgress} from './assessment-flow.mjs';
import {createNavigationHistory} from './navigation-history.mjs';
import {labReferenceGroup,validateLabReferences,setLabEntryUnit} from './lab-review.mjs';
import {REFERENCE_CATALOG_VERSION} from './lab-reference-catalog.mjs';
import {renderAssessmentReport} from './report-ui.mjs';
import {initializeReportExport} from './report-export.mjs';
import {reportOffer} from './report-controls.mjs';
import {reportReadiness,reportGoal} from './report-readiness.mjs';
import {renderProgress} from './report-progress.mjs';
import {assessHeartVascular, HEART_ASSESSMENT, heartOffersArterialAge} from './heart-vascular.mjs';
import {heartSteps, heartRoute, readHeartForm, refreshHeartFeedback, changeHeartUnit, renderHeartForm, renderHeartReport, renderHeartArterialForm, readHeartArterialForm, heartRoutineAgeStep} from './heart-vascular-ui.mjs';
import {heartPrefill} from './heart-prefill.mjs';
import {assessSystem, systemAssessment, systemAssessments, systemField, systemPrefill, systemSampleInputs} from './system-assessments.mjs';
import {readSystemForm, refreshSystemFeedback, renderSystemForm, renderSystemReport, systemMethods, systemRoute, systemSampleButton, systemStepFor} from './system-assessment-ui.mjs';
import {resultInstrument,screenHeading,uiIcon,backButton,renderAssessments,renderReportLibrary,renderAccount,renderPagesAccount,renderRecordLibrary,assessmentTitle,statusMessage,unmeasuredMark} from './ui-components.mjs';
import {questionContext,questionDestination,questionNextLabel,renderQuestionnaire,renderLabForm,labErrorStep} from './flow-ui.mjs';
import {sections,labs,validateLabs,assessClinical,validateQuestionnaire,profileMeasurementErrors,profileBmi,profileWaistRatio,EXCLUSIVE_ANSWERS,sampleAnswers,sampleLabs} from './model.mjs';
import {references,clockComparison} from './evidence.mjs';
import {birthYearAge} from './profile-age.mjs';
const $=s=>document.querySelector(s), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let state={...freshAssessment(),view:'home'},draftBackup=null;
const parkedAssessments=new Map();
const overviewSnapshots=new Map();
const returnTrail=[];
const hiddenRecordsKey='kq-hidden-assessments-v1';
function readHiddenRecords(){
 try{
  const ids=JSON.parse(localStorage.getItem(hiddenRecordsKey)||'[]');
  return new Set(Array.isArray(ids)?ids.filter(id=>typeof id==='string'&&/^[a-f0-9-]{36}$/i.test(id)):[]);
 }catch{return new Set();}
}
let hiddenRecords=readHiddenRecords();
let overviewType='';
const assessmentType=draft=>draft.assessmentType||'profile';
const isHeartAssessment=draft=>assessmentType(draft)===HEART_ASSESSMENT;
const isSystemAssessment=draft=>!!systemAssessment(assessmentType(draft));
const independentAssessment=draft=>isHeartAssessment(draft)||isSystemAssessment(draft);
let auth={loading:true,authenticated:false,csrf:null,profile:null,history:[],purchases:[],providers:[],reportReview:false,payments:{enabled:false,label:'US$7.99'},error:''};
let signIn={};
function discardCurrentDraft(){
 const {view,accountTab,libraryPage}=state;
 returnTrail.length=0;
 navigationHistory.clear();
 state=state.sample&&draftBackup?draftBackup:freshAssessment();
 draftBackup=null;
 Object.assign(state,{view:view==='account'?'account':'home',accountTab,libraryPage});
}
function evictHiddenRecords(){
 auth.history=auth.history.filter(record=>!hiddenRecords.has(record.id));
 for(const id of overviewSnapshots.keys())if(hiddenRecords.has(id))overviewSnapshots.delete(id);
 for(const [type,draft] of parkedAssessments)if(hiddenRecords.has(draft.saveId))parkedAssessments.delete(type);
 if(hiddenRecords.has(draftBackup?.saveId))draftBackup=null;
 if(hiddenRecords.has(state.saveId))discardCurrentDraft();
}
function hideSavedRecord(id){
 hiddenRecords=new Set([...hiddenRecords,...readHiddenRecords(),id]);
 evictHiddenRecords();
 try{localStorage.setItem(hiddenRecordsKey,JSON.stringify([...hiddenRecords]));return true;}
 catch{return false;}
}
const account=()=>auth.profile?{...auth.profile,history:auth.history}:null;
const language=initializeLanguage();
const reportExport=initializeReportExport();
const resultMotion=initializeResultMotion();
initializeLaunch();
initializeLabFeedback({getState:()=>state});
const today=()=>new Date().toLocaleDateString('en-CA');
async function api(path,method='GET',data){if(PAGES_PREVIEW)throw new Error('Cloud services are unavailable in the GitHub Pages preview.');const csrf=auth.csrf;const response=await accountFetch(path,{method,credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(10000),headers:method==='GET'?{}:{'Content-Type':'application/json','X-KQ-CSRF':csrf||''},...(data===undefined?{}:{body:JSON.stringify(data)})});let result;try{result=await response.json();}catch{throw new Error('Account storage could not be reached. Please try again.');}if(!response.ok){if(response.status===401&&auth.csrf===csrf){auth.authenticated=false;auth.profile=null;auth.history=[];auth.purchases=[];auth.reportReview=false;overviewSnapshots.clear();}throw new Error(result.error||'Your request could not be completed.');}return result;}
let accountRefresh=null;
async function refreshAccount(){
 if(PAGES_PREVIEW){auth.loading=false;auth.authenticated=false;auth.profile=null;auth.history=[];auth.purchases=[];auth.error='';auth.reportReview=true;nav();return;}

 if(accountRefresh)return accountRefresh;
 auth.loading=true;auth.error='';auth.collectionsError='';auth.purchaseError='';
 accountRefresh=(async()=>{try{
  const response=await accountFetch('session',{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(10000)});
  if(response.status===401){
   const session=await response.json().catch(()=>null);
   auth.providers=session?.providers||[];
   auth.reviewAccess=!!session?.reviewAccess;
   auth.emailSignIn=!!session?.emailSignIn;
   auth.authenticated=false;auth.profile=null;auth.history=[];auth.purchases=[];auth.csrf=null;auth.reportReview=false;auth.payments=session?.payments;overviewSnapshots.clear();return;
  }
  const session=await response.json();if(!response.ok)throw new Error(session.error||'Account storage is unavailable.');
  if(auth.csrf!==session.csrf){auth.history=[];auth.purchases=[];overviewSnapshots.clear();}
  auth.authenticated=true;auth.csrf=session.csrf;auth.reportReview=!!session.reportReview;auth.payments=session.payments;auth.profile=session.profile;auth.providers=session.providers||[];
  if(session.profile){const [history,purchases]=await Promise.allSettled([api('assessments'),NATIVE_APP?Promise.resolve({purchases:[]}):api('purchases')]);
   if(history.status==='fulfilled'){
    auth.history=history.value.assessments.filter(record=>!hiddenRecords.has(record.id));
    const ids=new Set(auth.history.map(record=>record.id));
    for(const id of overviewSnapshots.keys())if(!ids.has(id))overviewSnapshots.delete(id);
   }else auth.collectionsError='Saved assessments could not refresh. Please retry.';
   if(purchases.status==='fulfilled')auth.purchases=purchases.value.purchases;else auth.purchaseError='Purchase status could not refresh. Please retry.';
  }else{auth.history=[];auth.purchases=[];}
 }catch(error){auth.error=error.name==='TimeoutError'?'The account connection took too long. Your current assessment is safe on this screen.':error.message;}
 finally{auth.loading=false;nav();if(state.view==='home'){renderOverview();void hydrateOverview();}}})().finally(()=>{accountRefresh=null;});
 return accountRefresh;
}
async function action(button,fn){if(button.disabled)return;button.disabled=true;button.setAttribute('aria-busy','true');try{await fn();}catch(error){modal('Your change was not completed.', '<p role="alert">'+esc(error.message)+'</p><p>Your current assessment is still on this page. Please retry after refreshing the account connection.</p><button class="btn" data-action="close">Close</button>');}finally{button.disabled=false;button.removeAttribute('aria-busy');}}
function dirty(){
 delete state.saveId;delete state.savedReport;delete state.saved;
 delete state.reportProfile;delete state.reportEdition;
}

function announce(t){$('#live').textContent=t;}
const arrow=' '+uiIcon('forward'),sampleBadge=()=>state.sample?'<div class="sample-badge">Illustrative sample data · Not a personal assessment'+(draftBackup?'<button class="text-link" data-action="restore-draft">Return to your assessment</button>':'')+'</div>':'';
const accountLabels={history:'My assessments',saved:'Assessment history','report-history':'Saved reports',reports:'Reports',settings:'Account',data:'Saved data',about:'About',purchases:'Purchases',progress:'Progress'};
const screenLabels={home:'Overview',consent:'Before you begin',questionnaire:'Health profile',review:'Review answers',heart:'Heart & Vascular',labs:'Blood results',results:'Your result',report:'Assessment report',consult:'Consultation',enquiry:'Enquiry preview'};
const returnFields={
 account:['accountTab','libraryPage','showSampleTrends','trendSeries'],report:['reportTab','reportEdition'],results:['resultTab'],
 consent:['goal'],questionnaire:['goal','step','questionIndex'],review:['goal'],
 labs:['goal','labStep'],heart:['heartStep','heartReviewEdit','heartCompleteVascularAge','heartSpecialist'],
 system:['systemStep','systemMode','systemReviewField','systemReturnStep','systemBase'],
};
const navigationHistory=createNavigationHistory({
 read:historyPoint,
 restore:restoreHistoryPoint,
 back(){
  const button=$('#main .task-back');
  if(!button)return false;
  if($('.modal'))close();
  button.click();
  return true;
 },
});
const assessmentEntry={view:'account',position:{accountTab:'history',libraryPage:0},label:'My assessments'};
const reportEntry={view:'account',position:{accountTab:'reports',libraryPage:0},label:'Reports'};
const fallbackReturn=()=>state.view==='report'?reportEntry:assessmentEntry;
function nav(){
 $('#account-nav')?.setAttribute('aria-label',account()?'My account':'Account');
 const labels={...screenLabels,consent:'New assessment',system:systemAssessment(state.assessmentType)?.title};
 $('#workspace-current').textContent=state.view==='account'?(accountLabels[state.accountTab]||'Account'):(labels[state.view]||'Overview');
 const route=state.view==='account'?(['history','saved','reports','report-history','progress'].includes(state.accountTab)?(['reports','report-history'].includes(state.accountTab)?'reports':'history'):'settings'):state.view==='report'?'reports':['consent','questionnaire','review','labs','heart','system'].includes(state.view)?'history':state.view==='results'?'home':state.view;
 document.querySelectorAll('.workspace-link[data-route]').forEach(link=>{if(link.dataset.route===route)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});
}
function goto(view,scrollTop=0,{track=true,...options}={}){
 if(track&&!options.backward)navigationHistory.update({scrollTop:$('#main').scrollTop,reportScrollTop:$('.report-workspace .report-paper')?.scrollTop});
 state.view=view;
 state.errors={};
 render();
 $('#main').scrollTop=scrollTop;
 $('#main').focus({preventScroll:true});
 if(track)navigationHistory.visit(options);
 if(view==='home')void hydrateOverview();
}
function gotoRoot(view,options){returnTrail.length=0;goto(view,0,options);}
function returnPoint(opener,{restore='',editStep=''}={}){
 const view=state.view;
 const position=Object.fromEntries((returnFields[view]||[]).map(key=>[key,state[key]]));
 const label=view==='account'?accountLabels[state.accountTab]:screenLabels[view]||systemAssessment(state.assessmentType)?.title;
 const focus=opener?.closest('#main')?{...opener.dataset}:null;
 return {view,position,label,focus,scrollTop:$('#main').scrollTop,reportScrollTop:$('.report-workspace .report-paper')?.scrollTop,
  entry:navigationHistory.position,editStep,restore,
  ...(restore?{draft:state,backup:draftBackup}:{})};
}
function historyPoint(){
 const point=returnPoint(null);
 const keyParts={
  account:[state.accountTab],consent:[state.goal],questionnaire:[state.step,state.questionIndex],
  labs:[state.labStep],heart:[state.heartStep,state.heartReviewEdit],
  system:[state.assessmentType,state.systemStep,state.systemMode],
 };
 const key=JSON.stringify([point.view,...(keyParts[point.view]||[])]);
 return {...point,key,parent:returnTrail.at(-1)?.entry,trail:[...returnTrail],draft:state,backup:draftBackup,overviewType};
}
function restoreHistoryPoint(point){
 if(!point)return;
 if(hiddenRecords.has(point.draft.saveId)||point.draft.savedReport&&!account()){
  gotoRoot('home',{replace:true});
  return;
 }
 if(state!==point.draft){
  selectAssessment(assessmentType(point.draft));
  state=point.draft;
  draftBackup=point.backup;
 }
 returnTrail.splice(0,returnTrail.length,...point.trail);
 overviewType=point.overviewType;
 restoreScreen(point,{track:false});
}
function rememberReturn(opener,options){returnTrail.push(returnPoint(opener,options));}
function returnLabel(){return returnTrail.at(-1)?.label||fallbackReturn().label;}
function goBack({commitEdit=false}={}){
 let origin=returnTrail.pop();
 while(origin?.draft&&hiddenRecords.has(origin.draft.saveId))origin=returnTrail.pop();
 origin??=fallbackReturn();
 if(origin.restore==='edit'&&!commitEdit)navigationHistory.forget(point=>point.draft===state);
 const profileReturn=origin.restore==='report-profile';
 const restoreDraft=origin.restore==='edit'?!commitEdit:profileReturn||origin.restore==='preview'||state.savedReport||state.sample;
 if(restoreDraft&&origin.draft&&state!==origin.draft){
  if(profileReturn)parkedAssessments.set(assessmentType(state),state);
  state=origin.draft;
  draftBackup=origin.backup;
  parkedAssessments.delete(assessmentType(state));
 }
 restoreScreen(origin,{backward:true,returnTo:origin.entry});
}
function restoreScreen(origin,options){
 Object.assign(state,origin.position);
 goto(origin.view,origin.scrollTop,options);
 const paper=$('.report-workspace .report-paper');
 if(paper&&origin.reportScrollTop!==undefined)paper.scrollTop=origin.reportScrollTop;
 if(origin.focus){
  [...$('#main').querySelectorAll('[data-action]')].find(button=>
   Object.entries(origin.focus).every(([key,value])=>button.dataset[key]===value)
  )?.focus({preventScroll:true});
 }
}
function finishAt(view){
 const origin=returnTrail.at(-1);
 if(origin?.view===view&&origin.editStep)goBack({commitEdit:true});
 else goto(view);
}
function beginReportEdit(opener,step){
 rememberReturn(opener,{restore:'edit',editStep:step});
 state=structuredClone(state);
}
function modal(title,body,{picker=false,authentication=false}={}){
 const overlayClass=picker?' overview-picker-overlay':authentication?' auth-overlay':'';
 const dialogClass=picker?' overview-picker':authentication?' auth-dialog':'';
 $('#modal-root').innerHTML=`<div class="overlay${overlayClass}"><section class="modal${dialogClass}" role="dialog" aria-modal="true" aria-labelledby="modal-title"><header class="dialog-heading"><h2 id="modal-title">${title}</h2><button class="close" type="button" data-action="close" aria-label="Close dialog">${uiIcon('close')}</button></header>${body}</section></div>`;
 const dialog=$('.modal');
 decorateDirectionalSymbols(dialog);
 setTimeout(()=>{if(dialog.isConnected)(dialog.querySelector('[aria-current="true"]')||dialog.querySelector('button'))?.focus();},0);
}
function close(){
 const picker=$('.overview-picker');
 if($('.auth-dialog'))signIn={};
 $('#modal-root').innerHTML='';
 ((picker&&$('#overview-switch'))||$('#main')).focus({preventScroll:true});
}

const labHelp={albumin:'Blood albumin, not urine albumin.',creatinine:'Blood creatinine, not eGFR.',glucose:'Blood glucose, not HbA1c.',crp:'CRP or hs-CRP concentration. Check mg/L versus mg/dL carefully.',lymphocytes:'Percentage of white blood cells, not an absolute lymphocyte count.',mcv:'Usually labelled MCV on the report.',rdw:'RDW-CV (%) only. RDW-SD in fL is a different measurement.',alp:'Often labelled ALP.',wbc:'The total white blood cell count, often labelled WBC.'};
function sourceLinks(ids){return '<ul class="source-list">'+references.filter(r=>ids.includes(r.id)).map(r=>'<li><a href="'+esc(r.url)+'" target="_blank" rel="noopener noreferrer">'+esc(r.label)+' ↗</a></li>').join('')+'</ul>';}
function displayGap(gap){const n=Math.round(gap);return n>0?'+'+n:String(n===0?0:n);}
function ageComparison(c,age){const n=Math.round(c.value)-Number(age);return n===0?'Rounded to the nearest year, the estimate matches your age at the blood draw.':'The estimate is about '+Math.abs(n)+' '+(Math.abs(n)===1?'year':'years')+' '+(n>0?'higher':'lower')+' than your age at the blood draw.';}

function method(){modal('About the assessments',`<p>Biological age is an estimate of aspects of health and aging. Different methods measure different features, so their results are not interchangeable.</p><details open><summary>Health and lifestyle profile</summary><p>Your answers are compared with selected health guidance to identify topics for review. This is an educational profile, not a validated age clock or a clinical risk score. It does not calculate an age in years.</p></details><details><summary>Blood-based age: clinical PhenoAge</summary><p>The published formula combines your age with nine blood measurements. It was developed using US population data and expresses a pattern associated with health outcomes on an age scale.</p><p>This version reports estimates for ages 20–84, using confirmed fasting samples and a collection-history check. These are the app’s interpretation rules. They do not establish accuracy for every person or country.</p><p>The displayed difference is clinical PhenoAge minus age at the blood draw. It is not the study’s age-adjusted PhenoAgeAccel measure, a measure of aging speed, or a forecast of years left to live.</p></details><details><summary>Heart & Vascular</summary><p>For eligible adults aged 18–29, PDAY estimates an early vascular age range from routine measurements and health history.</p><p>For eligible adults aged 30–39, the Framingham model compares vascular age using blood pressure and routine cholesterol results.</p><p>SCORE2 and SCORE2-Diabetes cover eligible adults aged 40–69. SCORE2-OP covers ages 70–89. The 10-year risk estimate uses the region for your country of residence.</p><p>Younger adults can add a clinical pulse-wave result for a separate arterial stiffness age comparison.</p></details>${Object.entries(systemAssessments).map(([type,spec])=>`<details><summary>${spec.title}</summary>${systemMethods(type)}${sourceLinks(spec.sources)}</details>`).join('')}<details><summary>Glycan and protein clocks</summary><p>GlycanAge uses IgG glycans. Organ proteomic clocks use panels of blood proteins. Each needs the measurements and reference from its own study.</p>${sourceLinks(['glycan-age','igg-diabetes','organ-proteome','grimage-2'])}</details><details><summary>Epigenetic laboratory tests</summary><p>These use DNA methylation: chemical marks on DNA. They require a suitable laboratory assay and a defined calculation. Routine blood chemistry and lifestyle answers cannot substitute for those measurements.</p><div class="clock-list">${clockComparison.slice(1).map(c=>`<article><h3>${c.name}</h3><p>${c.meaning}</p><p class="small muted">${c.availability}</p></article>`).join('')}</div><p>Laboratory clocks also produce estimates. A test cannot establish one exact biological or “genetic” age. KoleQuant can advise which question a test may help answer and whether it is available.</p></details><details><summary>Mortality risk and progress over time</summary><p>Some clocks are associated with mortality in research populations. That association does not, by itself, provide your probability of death. A personal risk estimate needs a model with a defined time period and evidence that it applies to the relevant population.</p><p>Repeated clinical age estimates can be compared as a history. Changes may reflect illness, sampling conditions, measurement variation or a change in health. A falling result is not proof of reversed aging.</p></details><details><summary>Research and health guidance</summary>${sourceLinks(references.map(r=>r.id))}</details>`);}
function privacy(){if(NATIVE_APP){modal('Privacy & data',`<p>Read how GeneticAge uses your account and health information.</p><a class="btn" href="${accountOrigin}/privacy/" target="_blank" rel="noopener noreferrer">Privacy policy ↗</a>`);return;}if(PAGES_PREVIEW){modal('Privacy & data','<p>Your answers stay in this page’s memory. Reloading or closing the page clears them. Only theme and language preferences are stored on this device.</p><p>This preview does not send your answers to an account database or payment service. GitHub delivers the static app files.</p>');return;}modal('Your account & information',`<p>You can explore an assessment without saving it. Unsaved questionnaire and blood entries stay in this page’s memory.</p><p>KoleQuant stores your nickname, consent record and sign-in information. If you use email, we store your address and Resend delivers the sign-in code. If you use Apple or Google, we keep a sign-in identifier. Sign-in providers receive no health information.</p><p>When you explicitly save, your questionnaire, blood entries, results and educational report are sent over HTTPS and stored in the hosted account database. Health records are encrypted by the application before database storage. Authorized service operators can administer the service; this is not end-to-end encryption.</p><p>Saving is optional and is not permission for research, marketing or sharing with a consultation team. Those uses are not enabled. Hosting providers may process ordinary connection logs.</p><p>You can remove individual records from this browser. The browser stores only the IDs needed to hide those records. In Data & settings you can export your account or delete it and its live records. Provider backups may retain deleted data for a limited period. Downloaded copies remain on your device.</p><p>For a report purchase, Stripe collects payment and billing details. We store the purchase status, amount, payment references and receipt link. No questionnaire, blood entries or results are sent to Stripe. Stripe retains its own payment records.</p><p>Legacy demo accounts remain in their original browser storage unless you remove them. They are not uploaded automatically.</p><p class="small muted">Reports are generated automatically. Consultation enquiries are previews. Stripe handles checkout when report purchases are available.</p>`);}

function overviewSelection(){
 const history=auth.profile?auth.history:[];
 const drafts=[state.sample?draftBackup:state,...[...parkedAssessments.values()].reverse()];
 const choices=overviewChoices(drafts,history);
 const choice=choices.find(item=>item.type===overviewType)||choices[0]||(state.assessment?{draft:state}:{saved:history.at(-1)});
 return {choices,choice};
}
function overviewSnapshot(id){
 const snapshot=overviewSnapshots.get(id);
 return auth.profile&&snapshot?.csrf===auth.csrf?snapshot:null;
}
function home(){
 const {choices,choice}=overviewSelection();
 const snapshot=choice.saved?overviewSnapshot(choice.saved.id):null;
 const record=choice.draft?{...choice.draft,clinical:clinical(choice.draft)}:snapshot?.record;
 const loadStatus=choice.saved&&!record?(snapshot?.failed?'error':'loading'):'';
 const presentation=overviewPresentation(record,{profileName:auth.profile?.name});
 if(choice.draft&&choice.draft!==state)presentation.action='open-overview-draft';
 return renderThemeHome(presentation,{choices,selected:choice.type,loadStatus,loadingTitle:choice.saved&&assessmentTitle(choice.saved),loadingSample:choice.saved?.sample===true});
}
function renderOverview(){
 const focused=$('#overview-switch')===document.activeElement;
 render();
 if(focused)($('#overview-switch')||$('#main')).focus({preventScroll:true});
}
function switchOverviewTo(choice,direction=0){
 overviewType=choice.type;
 if($('.overview-picker'))close();
 renderOverview();
 if(direction&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
  $('.home-workspace .instrument-stage')?.animate?.(
   [{transform:`translateX(${direction*20}px)`,opacity:.45},{transform:'translateX(0)',opacity:1}],
   {duration:180,easing:'ease-out'}
  );
 }
 announce(choice.title);
 void hydrateOverview();
}
async function hydrateOverview(retry=false){
 if(state.view!=='home')return;
 const id=overviewSelection().choice.saved?.id;
 if(!id)return;
 const cached=overviewSnapshot(id);
 if(cached&&!(retry&&cached.failed))return;
 const snapshot={csrf:auth.csrf};
 overviewSnapshots.set(id,snapshot);
 if(retry)renderOverview();
 try{
  const {assessment,report}=await api('assessments/'+id);
  snapshot.record={...assessment,clinical:report.clinical,overviewSaved:true};
 }catch{
  snapshot.failed=true;
 }
 if(state.view==='home'&&(!auth.profile||overviewSnapshot(id)===snapshot&&overviewSelection().choice.saved?.id===id))renderOverview();
}
function consent(){
 const sample=state.goal==='labs'?'<button class="text-btn" data-action="sample">Try a PhenoAge sample</button>':systemSampleButton(state.goal);
 return `<div class="wrap narrow"><div class="eyebrow">${esc(goalTitle(state.goal))}</div><h1>Before you begin</h1><p class="lead">This assessment puts your information in context using published research. Discuss your results with a healthcare professional when making decisions about your care.</p>${state.goal==='profile'?'<p>Enter your age, height and weight. We calculate BMI from your height and weight.</p>':''}<div class="notice">${PAGES_PREVIEW?'Your answers stay in this page’s memory. Cloud saving is available in the hosted app.':'Unsaved answers stay on this page. If you choose to save an assessment, its health information and report are stored in your account.'}</div><label class="checkline"><input id="consent" type="checkbox" ${state.consent?'checked':''}><span>I am 18 or older and have read the assessment note and <button class="text-link" data-action="privacy">information about my data</button>.</span></label>${state.errors.consent?`<p class="error" role="alert">${state.errors.consent}</p>`:''}<div class="actions"><button class="btn" data-action="consent-next">Continue ${arrow}</button>${sample}</div></div>`;
}
function inputField(q){const a=state.answers,v=a[q.id]??'';if(q.type==='multi'||q.options)return `<div class="options">${q.options.map(o=>`<label class="option"><input type="${q.type==='multi'?'checkbox':'radio'}" name="${q.id}" value="${esc(o)}" data-answer="${q.id}" ${q.type==='multi'?(Array.isArray(v)&&v.includes(o)?'checked':''):(v===o?'checked':'')}><i class="choice-mark" aria-hidden="true"></i><span>${esc(q.optionLabels?.[o]||o)}</span></label>`).join('')}</div>`;
 if(q.type==='country')return `<input type="text" data-answer="${q.id}" id="${q.id}" aria-label="${esc(q.label)}" value="${esc(v)}" list="countries" placeholder="Search or enter a country" autocomplete="off"><datalist id="countries">${['Australia','Austria','Belgium','Brazil','Bulgaria','Canada','China','Croatia','Cyprus','Czechia','Denmark','Estonia','Finland','France','Germany','Greece','Hungary','India','Ireland','Israel','Italy','Japan','Latvia','Lithuania','Malta','Netherlands','New Zealand','Norway','Poland','Portugal','Romania','Singapore','South Africa','Spain','Sweden','Switzerland','United Kingdom','United States'].map(x=>`<option>${x}</option>`).join('')}</datalist>`;
 if(q.type==='drinks')return `<div class="drink-list">${(a.drinks||[]).map((d,i)=>`<div class="drink-summary"><span><strong>${esc(d.type)}</strong><small>${esc(d.count||'?')} × ${esc(d.ml||'?')} mL · ${esc(d.abv||'?')}%</small></span><button class="text-link" type="button" data-action="edit-drink" data-index="${i}">Edit</button><button class="text-btn" type="button" data-action="remove-drink" data-index="${i}" aria-label="Remove drink ${i+1}">×</button></div>`).join('')}</div><button class="btn secondary" data-action="add-drink" type="button">+ Add a drink type</button>`;
 return `<div class="input-row"><input type="number" id="${q.id}" aria-label="${esc(q.label)}" data-answer="${q.id}" value="${esc(v)}" min="${q.min??0.1}" ${q.max?`max="${q.max}"`:''} step="${q.step??'any'}" inputmode="decimal" ${q.required?'required':''} placeholder="${q.required?'Required':'Optional'}">${q.type==='measure'?`<select data-unit="${q.id}" aria-label="Unit for ${esc(q.label)}">${q.units.map(x=>`<option ${(a[q.id+'Unit']||q.units[0])===x?'selected':''}>${x}</option>`).join('')}</select>`:q.unit?`<span class="unit">${q.unit}</span>`:''}</div>`;
}
function pruneSmokingAnswers(){
 const a=state.answers,current=['Every day','Some days'].includes(a.smoking),regularQuestionApplies=a.smokingEver100==='Yes'||current;
 if(!regularQuestionApplies){delete a.smokingRegular;delete a.smokingStartAge;delete a.quit;}
 if(a.smokingRegular!=='Yes'){delete a.smokingStartAge;delete a.quit;}
 if(a.smoking!=='Not at all')delete a.quit;
 if(!current)delete a.cigarettes;
 if(a.smoking!=='Some days')delete a.smokingDays30;
}
function pruneDependentAnswers(id){
 const answers=state.answers;
 if(['smoking','smokingEver100','smokingRegular'].includes(id))pruneSmokingAnswers();
 if(id==='alcohol'&&answers.alcohol!=='Yes'){
  delete answers.alcoholDays;
  delete answers.drinks;
 }
 if(id==='compositionMethod'&&!answers.compositionMethod){
  for(const field of ['bodyFat','skeletalMuscle','bodyWater'])delete answers[field];
 }
}
function editDrink(index=-1){const d=state.answers.drinks?.[index]||{type:'Wine',count:'',ml:'',abv:''};modal(index<0?'Add a drink':'Edit drink',`<form id="drink-form" class="form-stack" data-index="${index}"><label for="drink-type">Drink type</label><select id="drink-type">${['Wine','Beer','Spirits','Other'].map(x=>`<option ${d.type===x?'selected':''}>${x}</option>`).join('')}</select>${[['count','Servings'],['ml','mL per serving'],['abv','Alcohol %']].map(([k,label])=>`<label for="drink-${k}">${label}</label><input id="drink-${k}" type="number" inputmode="decimal" min="0.1" ${k==='abv'?'max="100"':''} step="any" value="${esc(d[k])}">`).join('')}<button class="btn" type="submit">Keep drink →</button></form>`);}
function questionnaire(){
 const origin=returnTrail.at(-1);
 return renderQuestionnaire(state,inputField,returnLabel(),origin?.view==='review'?Number(origin.editStep):undefined);
}
function advanceQuestion(opener){
 const origin=returnTrail.at(-1),{questions,index}=questionContext(state);
 if(origin?.view==='review'&&Number(origin.editStep)===state.step&&index===questions.length-1){
  goBack({commitEdit:true});
  return;
 }
 const next=questionDestination(state);
 if(next.view==='review'&&returnTrail.at(-1)?.view!=='review')rememberReturn(opener);
 Object.assign(state,next);
 finishAt(next.view);
}
function bodyMeasurements(answers){
 const bmi=profileBmi(answers),waistRatio=profileWaistRatio(answers,bmi);
 const errors=validateQuestionnaire(answers);
 const measurements=[];
 if(bmi!==null)measurements.push(['BMI',bmi.toFixed(1)+' kg/m²']);
 if(answers.waist&&!errors.waist)measurements.push(['Waist circumference',answers.waist+' '+(answers.waistUnit||'cm')]);
 if(waistRatio!==null)measurements.push(['Waist-to-height ratio',waistRatio.toFixed(2)]);
 if(answers.compositionMethod){
  for(const [field,label] of [['bodyFat','Body fat'],['skeletalMuscle','Skeletal muscle'],['bodyWater','Total body water']]){
   if(answers[field]&&!errors[field])measurements.push([label,answers[field]+'%']);
  }
 }
 if(!measurements.length)return '';
 return `<section class="card body-measurements" data-theme-part><h2>Body measurements</h2>
  <dl>${measurements.map(([label,value])=>`<div><dt>${label}</dt><dd data-no-translate>${esc(value)}</dd></div>`).join('')}</dl>
  ${bmi!==null?'<p class="hint">BMI compares weight with height. Waist size and measured body composition add separate context.</p>':''}
  ${answers.compositionMethod==='Smart scale or bioimpedance'?'<p class="hint">Smart-scale estimates can vary with hydration and measurement conditions.</p>':''}
 </section>`;
}
function review(){
 const summaries=profileSectionProgress(state.answers).map(({name,answered,total},index)=>{
  const status=answered===total?'complete':answered?'partial':'incomplete';
  const label={complete:'Complete',partial:'Partially answered',incomplete:'Unanswered'}[status];
  return `<li class="review-section" data-status="${status}">${uiIcon('status-'+status)}
   <span><strong>${name}</strong><small><span>${label}</span> · <span data-no-translate>${answered} / ${total}</span></small></span>
   <button class="text-link" data-action="edit-section" data-index="${index}">Edit<span class="sr-only"> · ${name}</span></button>
  </li>`;
 });
 return `<div class="wrap app-screen task-screen review-screen">${screenHeading('Questionnaire','Review your answers','Edit any section before viewing your health profile.')}
  ${sampleBadge()}${bodyMeasurements(state.answers)}
  <ul class="card review-sections">${summaries.join('')}</ul>
  <div class="review-actions"><button class="btn" data-action="results">View health profile ${uiIcon('arrow')}</button><button class="text-btn" data-action="labs">${uiIcon('drop')} Add blood results</button></div>
 </div>`;
}
function labForm(){
 const origin=returnTrail.at(-1);
 return renderLabForm(state,labHelp,returnLabel(),origin?.editStep===String(state.labStep)?origin.label:undefined);
}
function clinical(draft=state){if(draft.savedReport)return clinicalForDisplay(draft.savedReport.clinical,{stored:true});if(!draft.labSubmitted)return null;return assessClinical({age:Number(draft.labAge),lab:draft.lab,contextConfirmed:draft.labContext===true,fasting:draft.labFasting});}
function result(){
 const c=clinical(),tab=state.resultTab||'summary';
 const tabs=`<nav class="result-tabs" aria-label="Result details">${[['summary','Result'],['insights','Insights'],['details','Details']].map(([id,label])=>`<button data-action="result-tab" data-tab="${id}" ${tab===id?'aria-current="page"':''}>${label}</button>`).join('')}</nav>`;
 let content='';
 if(tab==='summary')content=(c&&!c.reason?resultInstrument({value:Math.round(c.value),age:state.labAge,gap:displayGap(c.gap),sample:false,illustrative:state.sample,title:'Your blood-based age',action:'method',date:state.labDate}):`<section class="card result-surface" data-theme-part><span class="eyebrow">${c?'ESTIMATE WITHHELD':'HEALTH & LIFESTYLE'}</span><h2>${c?'These entries need review':'Your personal health profile'}</h2>${c?'<div class="withheld-emblem">'+unmeasuredMark()+'</div>':''}<p>${c?esc(c.reason):'Your answers identify topics for review. This assessment does not calculate an age in years.'}</p>${clinicalCheckSummary(c)}<button class="btn secondary" data-action="labs">${c?'Review blood entries':'Add blood results'} →</button></section>`)+`<p class="result-context">${c&&!c.reason?'One blood sample, in context. This is not a measure of aging speed.':c?'Your report identifies the flagged measurements and explains the checks.':'Review the details of your health profile.'}</p>`;
 else if(tab==='insights')content='<div class="card">'+renderReportInsights({assessment:{...state,clinical:c},
  guidance:fullReportAvailable()&&(state.sample||state.reportEdition==='full')?currentGuidance():null,safety:clinicalCheckSummary(c),sourceLinks})+'</div>';
 else content=`<div class="detail-actions" data-theme-part><button class="account-setting" data-action="report"><span><strong>Assessment report</strong><small>Interpretation, entries and evidence</small></span><span>↗</span></button><button class="account-setting" data-action="labs"><span><strong>Blood entries</strong><small>Review the values and collection details</small></span><span>↗</span></button><button class="account-setting" data-action="review"><span><strong>Questionnaire</strong><small>Review your health and lifestyle answers</small></span><span>↗</span></button><button class="account-setting" data-action="method"><span><strong>Methods & limitations</strong><small>What this estimate can and cannot tell you</small></span><span>↗</span></button>${NATIVE_APP?'':'<button class="account-setting" data-action="consult"><span><strong>Discuss your results</strong><small>Consultation and laboratory testing</small></span><span>↗</span></button>'}</div>${hasContext()?'<div class="notice amber">You reported a condition, treatment or recent illness. This profile cannot determine whether your care should change.</div>':''}`;
 return `<div class="wrap app-screen result-screen ${tab==='insights'?'insight-screen':''}">${screenHeading(state.sample?'ILLUSTRATIVE SAMPLE':'YOUR ASSESSMENT',c?(c.reason?'Review your assessment':'Your result'):'Your health profile',state.sample?'Sample data · Not a personal assessment':c?'Blood draw · '+esc(state.labDate):'Based on the answers you provided.')}${tabs}${content}<div class="result-actions">${PAGES_PREVIEW?'<button class="text-btn" data-action="review">Review answers</button>':state.saved?'<button class="text-btn" type="button" disabled>Saved</button>':'<button class="btn secondary" data-action="save">Save assessment</button>'}<button class="btn secondary" data-action="report">Open report ↗</button></div></div>`;
}
function hasContext(){return state.answers.illness==='Yes'||['conditions','medicines','context'].some(k=>state.answers[k]?.some(x=>!['None','Not sure','Prefer not to say'].includes(x)));}

function pagesInfo(){modal('This preview is offline for accounts',`<p>Account creation needs the hosted app. You can use assessments in this preview, and your entries stay on this page.</p><a class="btn" href="${HOSTED_APP_URL}" target="_blank" rel="noopener noreferrer">Open hosted app ↗</a>`);}
function betaReportAccess(){return NATIVE_APP||PAGES_PREVIEW||auth.authenticated&&auth.reportReview;}
function fullReportAvailable(draft=state){
 return draft.sample===true||betaReportAccess()||independentAssessment(draft)||!!(account()&&draft.savedReport?.full);
}

function report(){
 const full=fullReportAvailable()&&state.reportEdition!=='basic';
 const reportState=state.reportProfile?.answers&&!state.saved?{...state,answers:{...state.reportProfile.answers,...state.answers}}:state;
 const options={saved:state.saved,savedReport:state.savedReport,pagesPreview:PAGES_PREVIEW,sourceLinks,tab:state.reportTab,full,sample:state.sample,hasDraftBackup:!!draftBackup,profileAnswers:reportState.answers};
 if(isHeartAssessment(state))return state.heart.result?renderHeartReport({heart:state.heart,...options}):heartForm();
 if(isSystemAssessment(state))return state.system.result?renderSystemReport({type:state.assessmentType,system:state.system,...options}):systemForm();
 return renderAssessmentReport({state:reportState,clinical:clinical(),...options,reviewing:betaReportAccess(),ageComparison,consultations:!NATIVE_APP});
}
function webReportCheckout(){return !NATIVE_APP&&!PAGES_PREVIEW&&!!auth.payments?.enabled;}
const offeredProfiles=new WeakMap();
let offerRequest=0;
function savedProfileRecord(){
 const records=auth.history.filter(record=>!record.sample&&record.hasProfile);
 return records.findLast(record=>!record.labSubmitted)||records.at(-1);
}
async function profileForReport(assessment){
 if(assessment.sample||assessment.saved||reportGoal(assessment)==='profile')return null;
 const assessmentId=assessment.id||assessment.saveId;
 const working=draftForGoal('profile');
 if(working&&!working.sample&&working!==assessment&&(!working.saved||working.saveId!==assessmentId)&&profileProgress(working.answers).answered){
  if(!working.saved)return {answers:structuredClone(working.answers),source:'session'};
  if(account())return {answers:structuredClone(working.answers),source:'saved',saved:working.saved,id:working.saveId};
 }
 const record=savedProfileRecord();
 if(!record)return auth.collectionsError?{source:'unavailable'}:null;
 if(record.id===assessmentId)return null;
 try{
  const {assessment:profile}=await api('assessments/'+record.id+'?snapshot=1');
  return profile.sample||hiddenRecords.has(record.id)?null:{answers:profile.answers,source:'saved',saved:profile.saved,id:profile.id};
 }catch{return {source:'unavailable'};}
}
async function checkout(id,opener){
 const request=++offerRequest,entry=navigationHistory.position,draft=state;
 if(accountRefresh)await accountRefresh;
 const session=auth.csrf;
 const record=id?auth.history.find(item=>item.id===id):state;
 if(!record||(!id&&!state.assessment))return;
 const assessment=id?(await api('assessments/'+id+'?snapshot=1')).assessment:draft;
 const profile=await profileForReport(assessment);
 if(request!==offerRequest||state!==draft||navigationHistory.position!==entry||session!==auth.csrf
  ||opener&&!opener.isConnected||id&&hiddenRecords.has(id))return;
 modal('Full report',reportOffer({
  assessment:assessmentTitle(record),price:auth.payments?.label,sample:record.sample,review:betaReportAccess(),
  purchased:!!(record.unlocked||record.access?.purchased||record.savedReport?.full),canPurchase:webReportCheckout(),
  needsSave:!record.saved,test:auth.payments?.mode==='test',recordId:id||'',readiness:reportReadiness(assessment,profile),
 }));
 offeredProfiles.set($('.report-offer'),profile);
}
function savedDraft(s,report,goal=s.labSubmitted?'labs':assessmentType(s)){
 const draft={...freshAssessment(goal),...s,labReferenceMode:s.labReferenceMode||'lab-only',labReferenceVersion:s.labReferenceVersion||null,labReferenceGroup:s.labReferenceGroup||'unspecified',profileCompleted:!Object.keys(profileMeasurementErrors(s.answers)).length,saveId:s.id,savedReport:report,assessment:true,labValid:true,consent:true};
 rememberSaved(draft);
 return draft;
}
async function openSaved(id,view='results',origin,{full=false,profile=null}={}){
 if(hiddenRecords.has(id))return;
 const {assessment:s,report}=await api('assessments/'+id);
 if(hiddenRecords.has(id))return;
 if(origin){
  if(navigationHistory.position!==origin.entry||state!==origin.draft||state.view!==origin.view||origin.view==='account'&&(state.accountTab!==origin.position.accountTab||state.libraryPage!==origin.position.libraryPage))return;
  returnTrail.push(origin);
 }
 if(s.sample)rememberDraftForSample();
 else selectAssessment(assessmentType(s));
 state=savedDraft(s,report);
 const unlocked=full&&fullReportAvailable();
 state.reportEdition=unlocked?'full':'basic';
 if(unlocked)state.reportProfile=profile;
 state.reportTab='summary';
 goto(independentAssessment(state)?'report':view);
 if(full&&!unlocked)await checkout();
}
function purchaseList(){const purchases=auth.purchases||[];return `<section class="card"><div class="section-head"><div><h2>Your purchases</h2><p class="muted small">Purchased reports follow your account across devices. Refresh to check a recent payment.</p></div><button class="btn secondary" data-action="refresh-payments">Refresh payments</button></div>${purchases.length?purchases.map(p=>`<article class="purchase-row"><div><strong>Full educational report</strong><p class="small muted">${esc(new Date(p.created).toLocaleDateString('en-GB'))} · ${p.testOnly?'Test checkout · ':''}${esc(p.id.slice(0,8))}</p><span class="pill">${esc(({paid:'Purchased',open:'Awaiting payment',creating:'Preparing checkout',processing:'Payment processing',expired:'Checkout ended',refunded:'Refunded',disputed:'Payment under review'})[p.status]||p.status)}</span></div><div><strong>US$${(p.amount/100).toFixed(2)}</strong><div class="actions" style="margin-top:12px">${p.status==='paid'&&!hiddenRecords.has(p.assessmentId)?`<button class="text-link" data-action="open-full-report" data-id="${esc(p.assessmentId)}">Read purchased report</button>`:''}${p.receiptUrl?`<a class="text-link" href="${esc(p.receiptUrl)}" target="_blank" rel="noopener noreferrer">Stripe receipt ↗</a>`:''}${['creating','open','processing'].includes(p.status)?`<button class="text-link" data-action="check-order" data-id="${esc(p.id)}">Check payment</button>`:''}${p.status==='open'?`<button class="text-btn" data-action="cancel-payment" data-id="${esc(p.id)}">Cancel checkout</button>`:''}</div></div></article>`).join(''):'<div class="empty"><h3>No purchases yet.</h3><p>Your saved report previews are available in Reports.</p></div>'}<p class="small muted" style="margin-top:20px">Payment records and receipts are also held by Stripe.</p></section>`;}
async function paymentReturn(){if(PAGES_PREVIEW)return;const params=new URLSearchParams(location.search);const id=params.get('payment_order')||params.get('payment_cancelled');if(!id){if(location.hash==='#purchases'){state.accountTab='purchases';goto('account');}return;}state.accountTab='purchases';goto('account');if(!account()){modal('Sign in to check your purchase.','<p>Use the same account that started checkout, then refresh Purchases. A redirect alone never unlocks a report.</p>');return;}try{const result=await api('payments/refresh','POST',{orderId:id});auth.purchases=result.purchases;await refreshAccount();goto('account');const purchase=auth.purchases.find(p=>p.id===id);const title=purchase?.status==='paid'?'Your report is ready.':purchase?.status==='expired'?'Checkout has ended.':'Your payment status';modal(title,`<p>${purchase?.status==='paid'?'Payment has been verified. You can read your full report from this account on any device.':purchase?.status==='open'?'Checkout is still open. No report access has been granted. You can continue from the report or cancel it in Purchases.':purchase?.status==='processing'?'Payment is still processing. Please check Purchases again shortly.':'Please review the status in Purchases before attempting another payment.'}</p>${purchase?.status==='paid'?`<button class="btn" data-action="open-full-report" data-id="${esc(purchase.assessmentId)}">Read my report →</button>`:'<button class="btn" data-action="close">View purchases</button>'}`);history.replaceState(history.state,'',location.pathname+'#purchases');}catch(error){modal('Check your purchase in your account.', '<p>'+esc(error.message)+'</p><p>Please refresh Purchases before attempting to pay again.</p>');}}

function consultation(){return `<div class="wrap flow-grid"><aside><div class="eyebrow">KoleQuant</div><h2>Discuss your results</h2><p class="muted small">Consultations, genetic counseling and advice on suitable laboratory tests.</p><div class="aside-note">Testing depends on your question, the sample required and local availability. Laboratory clocks are estimates; they do not establish an exact age.</div><button class="text-link" data-action="method">Read about the different clocks</button></aside><section><div class="flow-title"><h1>Consultation enquiry</h1><p>Choose the topic you would like to discuss. KoleQuant would confirm the service, price and appointment arrangements before booking.</p></div><div class="notice amber"><strong>Enquiry preview only.</strong> This form does not send a message or book an appointment. Use fictional contact details while reviewing it.</div><form id="consult-form" class="form-stack" novalidate><label for="contact-email">Email address *</label><input id="contact-email" type="email" inputmode="email" spellcheck="false" autocapitalize="none" required placeholder="demo@example.com" autocomplete="off"><label for="contact-country">Country of residence *</label><input id="contact-country" type="text" required value="${esc(state.answers.country)}" placeholder="Country" autocomplete="off"><label for="contact-reason">What would you like to discuss? *</label><select id="contact-reason" required><option value="">Select a topic</option>${['Understand my age estimate','Discuss my blood results','Explore DNA methylation testing','Discuss genetic counseling','Choose a suitable assessment'].map(x=>`<option>${x}</option>`).join('')}</select><label for="contact-name">Preferred name (optional)</label><input id="contact-name" type="text" autocomplete="off"><label for="contact-language">Preferred language</label><select id="contact-language"><option>English</option><option>Bulgarian</option></select><label for="contact-availability">Contact preferences (optional)</label><input id="contact-availability" type="text" maxlength="150" placeholder="For example, weekday afternoons"><p class="small muted">Do not enter medical history in this field.</p>${state.assessment?`<label class="checkline"><input type="checkbox" id="share-assessment"><span>Include selected parts of this assessment in the enquiry preview.</span></label><div id="share-options" class="sharing" hidden><strong class="small">Choose what to include</strong>${[['answers','Questionnaire answers'],['labs','Blood entries'],['result','Result and limitations'],['report','Assessment report']].map(([v,l])=>`<label class="checkline"><input type="checkbox" name="share" value="${v}" checked><span>${l}</span></label>`).join('')}</div>`:''}<label class="checkline"><input type="checkbox" id="contact-consent" required><span>I understand that this form is a preview and nothing will be sent.</span></label><button class="btn" type="submit">Preview enquiry ${arrow}</button></form></section></div>`;}
function enquiryDone(summary){return `<div class="wrap narrow"><div class="card"><div class="eyebrow">Enquiry preview</div><h1>Review your enquiry</h1><div class="notice"><strong>${esc(summary.reason)}</strong><br>Country: ${esc(summary.country)}<br>Selected information: ${esc(summary.share.join(', ')||'None')}</div><p>Nothing has been sent and no appointment is booked. To make a real enquiry, use the contact options on KoleQuant’s website.</p><div class="actions"><a class="btn" href="https://kolequant.xyz/en/index.html" target="_blank" rel="noopener noreferrer">Contact KoleQuant ↗</a><button class="btn secondary" data-action="${state.assessment?'results':'home'}">${state.assessment?'Back to results':'Back to home'}</button></div></div></div>`;}
function signup(){
 if(PAGES_PREVIEW){pagesInfo();return;}
 if(account()){state.accountTab='settings';goto('account');return;}
 const drafts=[state,draftBackup,...parkedAssessments.values()];
 const keepDraft=drafts.some(draft=>draft&&!draft.sample&&assessmentProgress(draft).hasData);
 const {title,body}=accountEntry({...signIn,providers:auth.providers,keepDraft,native:NATIVE_APP,reviewAccess:NATIVE_APP&&auth.reviewAccess,emailSignIn:!NATIVE_APP||auth.emailSignIn});
 modal(title,body,{authentication:true});
 syncEmailSubmit($('#auth-email-form'));
 language.refresh();
}
function syncEmailSubmit(form){
 if(!form)return;
 form.querySelector('[type="submit"]').disabled=form.getAttribute('aria-busy')==='true'||!form.elements.email.validity.valid;
}
async function emailAction(form,job,button=form.querySelector('[type="submit"]')){
 if(form.getAttribute('aria-busy')==='true')return;
 const error=form.querySelector('[data-auth-error]');
 form.setAttribute('aria-busy','true');button.disabled=true;error.hidden=true;
 try{await job();}
 catch(reason){error.textContent=reason.message;error.hidden=false;language.refresh();}
 finally{
  form.removeAttribute('aria-busy');
  button.disabled=false;
  if(form.id==='auth-email-form')syncEmailSubmit(form);
 }
}
async function sendEmailCode(form,email,button){
 await emailAction(form,async()=>{
  await api('auth/code','POST',{email});
  if(form.isConnected){signIn={email,stage:'code'};signup();}
 },button);
}
async function finishSignIn(){
 if(accountRefresh)await accountRefresh;
 await refreshAccount();
 if(!account())throw new Error(auth.error||'Your session could not be opened. Try signing in again.');
 afterSignIn();
}
function afterSignIn(){
 signIn={};
 close();
 if(state.pendingSave){state.pendingSave=false;save();}
 else{
  state.accountTab='settings';
  gotoRoot('account',{replace:true});
  if(needsHealthProfile())startHealthProfile();
 }
}
function handleSignInReturn(){
 if(PAGES_PREVIEW)return;
 const url=new URL(location.href),status=url.searchParams.get('auth');
 if(!['signed-in','register','cancelled','retry'].includes(status))return;
 url.searchParams.delete('auth');
 history.replaceState(history.state,'',url);
 if(status==='signed-in'&&account()){afterSignIn();return;}
 if(status==='register'){signIn={stage:'social-register'};signup();return;}
 signIn={message:status==='cancelled'?'Sign-in was cancelled. Choose a sign-in method to try again.':'Sign-in could not be completed. Please try again.'};
 signup();
}
function clearAccountState(){
 forgetNativeAccount();
 signIn={};
 auth={...auth,authenticated:false,csrf:null,profile:null,history:[],purchases:[],reportReview:false,payments:{enabled:false,label:'US$7.99'}};
 overviewType='';overviewSnapshots.clear();
 draftBackup=null;parkedAssessments.clear();returnTrail.length=0;navigationHistory.clear();state=freshAssessment();
}

function recordInputs(draft){
 const context=draft.reportProfile?.answers&&!draft.saved?{...draft.reportProfile.answers,...draft.answers}:draft.answers;
 if(isHeartAssessment(draft))return {assessmentType:HEART_ASSESSMENT,heart:draft.heart.inputs,answers:context,sample:draft.sample};
 if(isSystemAssessment(draft))return {assessmentType:draft.assessmentType,system:draft.system.inputs,sample:draft.sample,answers:context};
 const {answers,lab,labAge,labDate,labSubmitted,labContext,labFasting,labReferenceMode,labReferenceVersion,sample}=draft;
 return {answers:context||answers,lab,labAge,labDate,labSubmitted:!!labSubmitted,labContext:!!labContext,labFasting:labFasting||'Not recorded',
  labReferenceMode,labReferenceGroup:labReferenceGroup(draft),labReferenceVersion,sample};
}
function inputSignature(inputs){
 return JSON.stringify(inputs,(key,value)=>{
  if(value===''||value===null)return undefined;
  if(Array.isArray(value))return value.length?value:undefined;
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b)));
  return value;
 });
}
function rememberSaved(draft){
 const {saveId,saved,savedReport,heart,system}=draft;
 draft.savedBaseline={signature:inputSignature(recordInputs(draft)),saveId,saved,savedReport,heart,system};
}
function restoreSavedStatus(draft){
 if(draft.saved||!draft.savedBaseline)return;
 const {signature,...snapshot}=draft.savedBaseline;
 if(inputSignature(recordInputs(draft))===signature)Object.assign(draft,snapshot);
}
async function persistAssessment(){
 const draft=state,csrf=auth.csrf;
 restoreSavedStatus(draft);
 if(draft.saved)return draft.saveId;
 const id=draft.saveId??=crypto.randomUUID(),inputs=recordInputs(draft),signature=inputSignature(inputs);
 await api('assessments','POST',{id,...inputs});
 const savedResult=await api('assessments/'+id);
 if(auth.csrf===csrf&&draft.saveId===id&&inputSignature(recordInputs(draft))===signature){
  Object.assign(draft,savedResult.assessment,{saveId:id,savedReport:savedResult.report});
  delete draft.reportProfile;
  rememberSaved(draft);
 }
 await refreshAccount();
 return id;
}
function save(){restoreSavedStatus(state);if(state.saved)return;if(PAGES_PREVIEW){pagesInfo();return;}if(!state.assessment){goto('home');return;}if(!account()){state.pendingSave=true;signup();return;}modal('Save this assessment?',`<p>Store this questionnaire, blood entries, result and educational report in <strong data-no-translate>${esc(account().name)}</strong>. They will be available when you sign in on another device.</p><p>Saving does not share information with the consultation team or enrol you in research.</p><div class="notice">This creates a dated snapshot. Later assessments are saved separately so your history stays intact. The saved copy keeps the answers and result from this assessment.</div><button class="btn" data-action="confirm-save">Save to my account →</button><button class="text-btn" data-action="close" style="margin-left:15px">Cancel</button>`);}


function dashboard(){
 const progress=assessmentProgress(state);
 const profileAssessment=!independentAssessment(state);
 const currentRecordId=auth.history.some(record=>record.id===state.saveId)?state.saveId:'';
 const common={profile:auth.profile,history:auth.history,authenticated:auth.authenticated,loading:auth.loading,error:auth.error||auth.collectionsError||'',page:state.libraryPage||0,pagesPreview:PAGES_PREVIEW,currentRecordId};
 if(state.accountTab==='saved'||state.accountTab==='report-history')return renderRecordLibrary({...common,reports:state.accountTab==='report-history'});
 if(state.accountTab==='history'){
  const heartDraft=isHeartAssessment(state)?progress.hasData:assessmentProgress(parkedAssessments.get(HEART_ASSESSMENT)||{}).hasData;
  const systemDrafts=Object.fromEntries(Object.keys(systemAssessments).map(type=>[type,assessmentProgress(type===state.assessmentType?state:parkedAssessments.get(type)||{}).hasData]));
  return renderAssessments({...common,progress:profileAssessment&&!state.sample&&!state.assessment?progress:null,
   resumeLabs:state.goal==='labs',canStartNew:!state.sample&&progress.hasData,heartDraft,systemDrafts});
 }
 if(state.accountTab==='reports'){
  const draft=state.assessment&&!currentRecordId?state:null;
  const latest=draft?null:auth.history.at(-1);
  return renderReportLibrary({...common,draft,latest});
 }
 if(state.accountTab==='settings')return PAGES_PREVIEW?renderPagesAccount():renderAccount({...common,needsHealthProfile:needsHealthProfile(),healthProfileProgress:healthProfileProgress(),purchases:!NATIVE_APP});
 const back=backButton('account-tab','Account','settings');
 if(state.accountTab==='about')return `<div class="wrap app-screen account-subscreen">${back}${screenHeading('INFORMATION & SUPPORT','About this app')}<section class="card" data-theme-part><h2>Understand the assessment</h2><p>Explore the assessment experience and its methods. Automated educational estimates do not diagnose disease or predict lifespan.</p><a class="text-link" href="https://kolequant.xyz/en/index.html" target="_blank" rel="noopener noreferrer">KoleQuant website ↗</a></section><section class="account-settings utility-actions" aria-label="Support and assessment controls">${NATIVE_APP?`<a class="account-setting" href="mailto:support@kolequant.xyz"><span class="setting-symbol">${uiIcon('consult')}</span><span class="setting-copy"><strong>Contact support</strong><small>Questions about your account and the app</small></span>${uiIcon('external')}</a>`:`<button class="account-setting" data-action="consult"><span class="setting-symbol">${uiIcon('consult')}</span><span class="setting-copy"><strong>Contact options</strong><small>Questions, interpretation and support</small></span>${uiIcon('external')}</button>`}<button class="account-setting quiet-setting" data-action="reset"><span class="setting-symbol">${uiIcon('reset')}</span><span class="setting-copy"><strong>Reset assessment</strong><small>Clear the current assessment</small></span>${uiIcon('forward')}</button></section></div>`;
 if(state.accountTab==='progress')return `<div class="wrap app-screen account-subscreen">${backButton('account-tab','My assessments','history')}${screenHeading('YOUR HISTORY','Progress over time')}<div class="actions"><button class="btn secondary" data-action="trend-personal">My results</button><button class="text-link" data-action="trend-sample">Sample history</button></div>${renderProgress(auth.history,{sample:!!state.showSampleTrends,selected:state.trendSeries})}</div>`;
 if(state.accountTab==='purchases')return `<div class="wrap app-screen account-subscreen">${back}${screenHeading('YOUR ACCOUNT','Purchases')}${statusMessage({loading:auth.loading,error:auth.error||auth.purchaseError})}${account()?purchaseList():'<section class="card"><h2>Keep your reports together.</h2><p>Sign in to check purchased-report access and payment status.</p><button class="btn" data-action="signup">Sign in / create profile →</button></section>'}</div>`;
 return `<div class="wrap app-screen account-subscreen">${back}${screenHeading('YOUR ACCOUNT','Manage saved data')}<section class="card"><h2>Your information, your choice.</h2><p>Saved assessments and report snapshots are encrypted before database storage. Saving does not enable research, marketing or consultation sharing.</p>${account()?'<div class="actions"><button class="btn secondary" data-action="export">Export data & reports</button><button class="text-link" data-action="delete-account">Delete KoleQuant account</button></div><button class="text-link" data-action="import-legacy">Import an old on-device demo account</button>':'<button class="btn" data-action="signup">Sign in / create profile →</button>'}</section><button class="text-link" data-action="privacy">Read the full storage notice ↗</button></div>`;
}
function legacyAccounts(){try{return JSON.parse(localStorage.getItem('kq-demo-workspaces-v1'))?.accounts||[];}catch{return [];}}
function importLegacy(){const accounts=legacyAccounts();if(!accounts.length){modal('No old demo accounts found.','<p>This browser has no saved demo accounts to import.</p>');return;}modal('Import an on-device demo account',`<p>This will upload the selected demo history to your signed-in KoleQuant account. Please review which account you select. Original browser copies stay on this device.</p><form id="import-form"><label for="legacy-id">Select an old demo account</label><select id="legacy-id">${accounts.map(a=>`<option value="${esc(a.id)}" data-user-prefix="${esc(a.name)}">${esc(a.name)} (${a.history?.length||0} assessments)</option>`).join('')}</select><label class="checkline"><input type="checkbox" required><span>I choose to upload this account’s saved health information to my private online account.</span></label><button class="btn" type="submit">Import selected history</button></form>`);}


function organizeConsultation(){
 const wrap=$('#main>.wrap'),form=$('#consult-form');if(!form||!wrap)return;wrap.classList.add('consult-screen');
 const nodes=[...form.children],pages=[document.createElement('div'),document.createElement('div'),document.createElement('div')];pages.forEach((p,i)=>{p.className='consult-page';p.hidden=i!==0;});
 let page=0;for(const node of nodes){if(node.matches('label[for="contact-name"]'))page=1;if(node.matches('.checkline'))page=2;pages[page].append(node);}
 form.append(...pages);const nav=document.createElement('div');nav.className='form-nav';nav.innerHTML='<button class="text-btn" type="button" data-action="consult-step" data-direction="-1" disabled>← Back</button><span class="consult-page-count small muted">1 / 3</span><button class="btn" type="button" data-action="consult-step" data-direction="1">Continue →</button>';form.append(nav);form.dataset.page='0';
}
function syncChoiceInputs(id,target){
 for(const input of $('#questions')?.querySelectorAll('input[data-answer]')||[]){if(input.dataset.answer!==id)continue;input.checked=Array.isArray(state.answers[id])?state.answers[id].includes(input.value):state.answers[id]===input.value;}
 delete state.errors[id];target.closest('fieldset')?.querySelector('.error')?.remove();
 if($('#questions')){
  const context=questionContext(state),origin=returnTrail.at(-1);
  $('.task-caption>span:last-child').textContent='Question '+(context.index+1)+' / '+context.questions.length;
  $('#questions [data-question-next]').textContent=questionNextLabel(state,origin?.view==='review'?Number(origin.editStep):undefined);
  language.refresh();
 }
}
function captureQuestion(){
 const form=$('#questions');if(!form)return;
 for(const input of form.querySelectorAll('input[data-answer]:not([type=checkbox]):not([type=radio])'))state.answers[input.dataset.answer]=input.value;
 for(const input of form.querySelectorAll('input[data-answer][type=radio]:checked'))state.answers[input.dataset.answer]=input.value;
 const q=questionContext(state).question;
 if(q.type==='multi')state.answers[q.id]=[...form.querySelectorAll('input[data-answer][type=checkbox]:checked')].map(input=>input.value);
 for(const input of form.querySelectorAll('select[data-unit]'))state.answers[input.dataset.unit+'Unit']=input.value;
 if(q.id==='age'&&state.answers.age)state.answers.ageRecordedYear=String(new Date().getFullYear());
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
function heartForm(){
 const origin=returnTrail.at(-1);
 const backLabel=origin?.editStep===state.heartStep?origin.label:undefined;
 return renderHeartForm({inputs:state.heart.inputs,errors:state.errors,step:state.heartStep,specialistEdit:!!state.heartSpecialist,prefilled:state.heartPrefilled,touched:state.heartTouched,prefillUnavailable:state.heartPrefillUnavailable,backLabel,entryLabel:returnLabel()});
}
function captureHeart(form){
 const previous=state.heart.inputs,inputs=readHeartForm(form,previous,state.heartStep);
 if(inputs.smoking!==previous.smoking)for(const id of ['smokingDays30','cigarettes','smokingYears'])delete inputs[id];
 if(inputs.conditions!==previous.conditions)delete inputs.diagnoses;
 if(JSON.stringify(inputs)===JSON.stringify(previous))return;
 dirty();
 state.heart={inputs};
 state.assessment=false;
 const next=form.querySelector('[data-heart-specialist-next]');
 if(next){
  next.textContent=['apob','lpa','cfpwv'].some(id=>inputs[id]?.value)?'View report':'Continue without these tests';
  language.refresh();
 }
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
function reviewArterialField(target,editing){
 const form=target.form;
 if(editing){
  target.removeAttribute('aria-invalid');
  form.querySelector('#heart-'+target.name+'-error')?.remove();
 }
 if(target.name==='cfpwv'){
  const inputs={...state.heart.inputs,cfpwv:readHeartArterialForm(form)};
  refreshHeartFeedback(form,inputs,{cfpwv:!editing});
 }
}
function render(){
 nav();
 const {view}=state,main=$('#main');
 if(view==='report'||view==='results')restoreSavedStatus(state);
 document.body.dataset.view=view;
 const views={home,consent,questionnaire,review,labs:labForm,heart:heartForm,system:systemForm,results:result,report,consult:consultation,account:dashboard,enquiry:()=>enquiryDone(state.enquiry)};
 main.innerHTML=(views[view]||home)();
 const screen=main.firstElementChild;
 if(['consent','review','results'].includes(view)||view==='report'&&screen?.matches('.report-workspace')){
  screen?.insertAdjacentHTML('afterbegin',backButton('back-screen',returnLabel()));
 }
 if(view==='consult')organizeConsultation();
 if(view==='consent')screen?.classList.add('app-screen','task-screen','consent-screen');
 decorateDirectionalSymbols(main);
 document.title=({home:'Your health workspace',account:state.accountTab==='reports'?'Reports':state.accountTab==='history'?'My assessments':'Your account',results:'Your assessment',heart:'Heart & Vascular',system:systemAssessment(state.assessmentType)?.title,report:'Your report',consult:'Consultation'}[view]||'Your assessment')+' — '+APP_NAME;
 language.refresh();
 resultMotion.refresh();
}
function selectAssessment(type){
 if(state.sample){state=draftBackup||freshAssessment();draftBackup=null;}
 const current=assessmentType(state);
 if(current===type)return;
 parkedAssessments.set(current,state);
 state=parkedAssessments.get(type)||freshAssessment(type);
 parkedAssessments.delete(type);
}
const hasProfileDetails=answers=>!!answers?.age&&!!answers?.sex;
function withSavedProfile(draft,saved){
 if(!draft||!Object.keys(draft).length)return saved;
 return {...draft,age:draft.age||saved?.age,sex:draft.sex||saved?.sex};
}
async function enterHeart(fromConsent=false){
 const draft=state,view=state.view,accountTab=state.accountTab;
 if(!draft.heart.result){
  const profile=parkedAssessments.get('profile');
  let answers=!profile?.sample&&Object.keys(profile?.answers||{}).length?profile.answers:null;
  if(!hasProfileDetails(answers)&&!PAGES_PREVIEW){
   if(accountRefresh)await accountRefresh;
   const saved=auth.profile&&auth.history.findLast(record=>!record.sample&&record.hasProfile&&!isHeartAssessment(record));
   if(saved){
    try{answers=withSavedProfile(answers,(await api('assessments/'+saved.id)).assessment.answers);}
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
 goto('heart',0,{replace:fromConsent});
}
function returnToHeartReview(){
 state.heartReviewEdit=false;state.heartStep=heartRoute(state.heart.inputs,state.heartPrefilled)[0].id;goto('heart',0,{backward:true});
}
async function enterSystem(fromConsent=false){
 const draft=state, type=state.assessmentType, view=state.view, accountTab=state.accountTab;
 if(draft.system.result){goto('report');return;}
 if(!draft.systemPrefillLoaded||!draft.system.inputs.age){
  const profile=parkedAssessments.get('profile');
  let answers=profile?.sample?null:profile?.answers, blood=profile?.labSubmitted&&!profile.sample?profile:null, heart=parkedAssessments.get(HEART_ASSESSMENT)?.heart?.inputs;
  if(!PAGES_PREVIEW){
   if(accountRefresh)await accountRefresh;
   if(auth.profile){
    const personal=auth.history.filter(record=>!record.sample);
    const profileId=!hasProfileDetails(answers)&&personal.findLast(record=>record.hasProfile)?.id;
    const bloodId=type==='kidney'&&!blood&&personal.findLast(record=>record.labSubmitted)?.id;
    const heartId=!answers?.sex&&!heart?.sex&&personal.findLast(isHeartAssessment)?.id;
    const ids=[...new Set([profileId,bloodId,heartId].filter(Boolean))];
    const records=await Promise.allSettled(ids.map(id=>api('assessments/'+id)));
    const found=Object.fromEntries(records.flatMap((record,i)=>record.status==='fulfilled'?[[ids[i],record.value.assessment]]:[]));
    answers=withSavedProfile(answers,found[profileId]?.answers);
    blood=found[bloodId]||blood;
    heart=found[heartId]?.heart?.inputs||heart;
    draft.systemPrefillUnavailable=records.some(record=>record.status==='rejected');
   }
  }
  if(state!==draft||state.view!==view||state.accountTab!==accountTab)return;
  const inputs=draft.system.inputs;
  const additions=Object.entries(systemPrefill(type,answers||{},heart||{},blood||{})).filter(([id])=>!Object.hasOwn(inputs,id));
  Object.assign(inputs,Object.fromEntries(additions));
  draft.systemPrefilled=additions.map(([id])=>id);
  draft.systemStep=systemRoute(type,inputs,draft.systemPrefilled)[0].id;
  draft.systemPrefillLoaded=true;
 }
 goto('system',0,{replace:fromConsent});
}

function currentSystemStep(){
 const {assessmentType:type,system:{inputs},systemStep,systemMode,systemReviewField,systemPrefilled}=state;
 if(systemMode){
  const step=systemStepFor(type,inputs,systemStep);
  if(step)return systemMode==='review'?{...step,fields:[systemReviewField]}:step;
 }
 const route=systemRoute(type,inputs,systemPrefilled);
 return route.find(step=>step.id===systemStep)||route[0];
}

function systemForm(){
 return renderSystemForm({type:state.assessmentType,inputs:state.system.inputs,step:currentSystemStep(),
  prefilled:state.systemPrefilled,errors:state.errors,mode:state.systemMode,touched:state.systemTouched,
  prefillUnavailable:state.systemPrefillUnavailable,entryLabel:returnLabel(),
  backLabel:returnTrail.at(-1)?.editStep===state.systemStep?returnLabel():undefined});
}

function captureSystem(form){
 const previous=state.system.inputs, inputs=readSystemForm(state.assessmentType,form,previous);
 if(JSON.stringify(inputs)!==JSON.stringify(previous)){
  dirty();
  state.system={inputs};
  state.assessment=false;
  const label=form.querySelector('[data-system-skip]');
  if(label){
   const step=currentSystemStep(), route=systemRoute(state.assessmentType,inputs,state.systemPrefilled);
   const entered=step.fields.some(id=>inputs[id]?.value||typeof inputs[id]==='string'&&inputs[id]);
   label.textContent=entered?(step.id===route.at(-1).id?'View report':'Continue'):label.dataset.systemSkip;
   language.refresh();
  }
 }
}

function systemFeedback(target,editing){
 const id=target.closest('[data-system-field]')?.dataset.systemField;
 if(!id)return;
 state.systemTouched[id]=!editing;
 if(editing){
  for(const key of [id,id+'Reference']){
   delete state.errors[key];
   target.form.querySelector('#system-'+key+'-error')?.remove();
  }
  target.removeAttribute('aria-invalid');
 }
 refreshSystemFeedback(state.assessmentType,target.form,state.system.inputs,state.systemTouched);
 if(!editing)language.refresh();
}

function endSystemEdit(){
 delete state.systemMode;
 delete state.systemBase;
 delete state.systemReviewField;
 delete state.systemReturnStep;
}

function editSystem(part,mode){
 const step=systemStepFor(state.assessmentType,state.system.inputs,part);
 if(!step)return;
 state.systemBase??=state.system;
 state.systemMode=mode;
 state.systemStep=step.id;
 if(mode==='review')state.systemReviewField=part;
 goto('system');
}

function backSystem(){
 if(state.systemMode){
  const review=state.systemMode==='review', returnStep=state.systemReturnStep;
  state.system=state.systemBase||state.system;
  state.assessment=!!state.system.result;
  endSystemEdit();
  if(review||returnStep){state.systemStep=review?'review':returnStep;goto('system',0,{backward:true});}
  else if(returnTrail.at(-1)?.restore==='edit')goBack();
  else goto('report',0,{backward:true});
  return;
 }
 const route=systemRoute(state.assessmentType,state.system.inputs,state.systemPrefilled);
 const index=route.findIndex(step=>step.id===currentSystemStep().id);
 const origin=returnTrail.at(-1);
 if(origin?.view==='report'&&origin.editStep===state.systemStep){goBack();return;}
 if(index>0){state.systemStep=route[index-1].id;goto('system',0,{backward:true});}
 else goBack();
}

function showSystemReport({inputs,result,review}){
 endSystemEdit();
 if(!state.saved)state.system={inputs,result,review};
 state.assessment=true;
 state.reportTab='summary';
 finishAt('report');
}

function submitSystem(partial=false){
 const {assessmentType:type,system:{inputs},systemMode}=state;
 const current=currentSystemStep(), checked=assessSystem(type,inputs);
 const keys=current.fields.flatMap(id=>[id,id+'Reference']);
 const errors=Object.fromEntries(Object.entries(checked.errors).filter(([key])=>keys.includes(key)));
 if(!partial&&current.id!=='review'){
  for(const id of current.fields){
   if(checked.inputs[id]===undefined&&!systemField(type,id).optional&&!errors[id])errors[id]='Add this detail to continue.';
  }
 }
 if(Object.keys(errors).length){
  state.errors=errors;
  render();
  $('#system-form [aria-invalid="true"]')?.focus();
  return;
 }
 if(systemMode==='review'){
  endSystemEdit();
  state.systemStep=systemRoute(type,inputs,state.systemPrefilled)[0].id;
  goto('system',0,{backward:true});return;
 }
 if(!systemMode&&!partial){
  const route=systemRoute(type,inputs,state.systemPrefilled), next=route[route.findIndex(step=>step.id===current.id)+1];
  if(next){state.systemStep=next.id;goto('system');return;}
 }
 if(Object.keys(checked.errors).length){
  const part=Object.keys(checked.errors)[0].replace(/Reference$/,'');
  state.systemReturnStep??=current.id;
  editSystem(part,'finish');
  state.errors=checked.errors;
  render();
  $('#system-form [aria-invalid="true"]')?.focus();
  return;
 }
 if(systemMode==='finish'&&checked.result.status==='missing'&&!partial){
  const next=checked.result.missing[0];
  if(!current.fields.includes(next)){editSystem(next,'finish');return;}
 }
 showSystemReport(checked);
}

const draftTypeForGoal=goal=>goal===HEART_ASSESSMENT||systemAssessment(goal)?goal:'profile';
const assessmentGoal=goal=>goal==='profile'||goal==='labs'||draftTypeForGoal(goal)!=='profile';
const goalTitle=goal=>goal==='labs'?'Clinical PhenoAge':goal==='profile'?'Health & lifestyle':systemAssessment(goal)?.title||'Heart & Vascular';
function draftForGoal(goal){
 const active=state.sample?draftBackup:state;
 const type=draftTypeForGoal(goal);
 return active&&assessmentType(active)===type?active:parkedAssessments.get(type);
}
function needsHealthProfile(){
 if(!auth.profile||auth.loading||auth.collectionsError)return false;
 const draft=draftForGoal('profile');
 const completeHere=draft?.profileCompleted&&!Object.keys(profileMeasurementErrors(draft.answers)).length;
 return !completeHere&&!auth.history.some(record=>record.hasCompleteProfile&&!record.sample);
}
function healthProfileProgress(){
 const {answered,total}=profileProgress(draftForGoal('profile')?.answers);
 return Math.floor(100*answered/total);
}
function startHealthProfile(opener){
 rememberReturn(opener);
 beginAssessment('profile');
}
function checkProfileMeasurements(){
 const errors=profileMeasurementErrors(state.answers);
 const id=Object.keys(errors)[0];
 if(!id)return true;
 state.profileCompleted=false;
 state.step=0;
 state.questionIndex=sections[0].questions.findIndex(question=>question.id===id);
 goto('questionnaire');
 state.errors={[id]:errors[id]};
 render();
 return false;
}
function hasEntriesForGoal(draft,goal){
 if(!draft)return false;
 if(goal==='profile')return Object.keys(draft.answers||{}).length>0;
 if(goal==='labs')return !!(draft.labSubmitted||draft.labAge||draft.labDate||Object.keys(draft.lab||{}).length);
 return assessmentProgress(draft).hasData;
}
function completedForGoal(draft,goal){
 if(!draft)return false;
 if(goal==='profile')return draft.profileCompleted===true;
 if(goal==='labs')return draft.labSubmitted===true;
 return draft.assessment===true;
}
async function requestAssessment(goal,startOver=false,opener){
 const current=state,view=state.view,tab=state.accountTab;
 if(accountRefresh)await accountRefresh;
 if(state!==current||state.view!==view||state.accountTab!==tab)return;
 const draft=draftForGoal(goal);
 const saved=hasEntriesForGoal(draft,goal)?null:previousAssessment(auth.history,goal);
 if(!startOver&&!completedForGoal(draft,goal)&&!saved){
  rememberReturn(opener);
  return beginAssessment(goal);
 }
 modal('Start new or edit existing?',`<p><strong>${esc(goalTitle(goal))}</strong></p><p>Each save creates a dated report. Starting new clears this assessment’s working answers and keeps your saved history.</p><div class="actions"><button class="btn" data-action="edit-existing-assessment" data-goal="${esc(goal)}" ${saved?`data-id="${esc(saved.id)}"`:''}>Edit existing</button><button class="btn secondary" data-action="restart-assessment" data-goal="${esc(goal)}">Start new</button></div>`);
}
function otherRouteFields(draft,goal){
 if(goal==='profile')return Object.fromEntries(Object.entries(draft).filter(([key])=>key.startsWith('lab')));
 if(goal==='labs'){
  const {answers,profileCompleted,step,questionIndex}=draft;
  return {answers,profileCompleted,step,questionIndex};
 }
 return {};
}
function restartAssessment(goal){
 rememberReturn();
 selectAssessment(draftTypeForGoal(goal));
 const draft=state;
 navigationHistory.forget(point=>point.draft===draft||goal==='profile'&&point.draft.answers===draft.answers||goal==='labs'&&point.draft.lab===draft.lab);
 const other=otherRouteFields(state,goal);
 const hasOtherResult=other.profileCompleted||other.labSubmitted&&!state.savedReport;
 state={...freshAssessment(goal),...other,assessment:!!hasOtherResult};
 goto('consent');
}
async function editExistingAssessment(goal,id,button,{reportContext=false}={}){
 const saved=id?await api('assessments/'+id):null;
 if(!button.isConnected||id&&hiddenRecords.has(id))return;
 close();
 const restore=saved?.assessment.sample?'preview':reportContext&&independentAssessment(state)?'report-profile':'';
 rememberReturn(null,{restore});
 if(saved?.assessment.sample){
  rememberDraftForSample();
  state=savedDraft(saved.assessment,saved.report,goal);
 }else{
  selectAssessment(draftTypeForGoal(goal));
  if(saved){
   const pairedGoal=goal==='labs'?'profile':goal==='profile'?'labs':'';
   const other=pairedGoal&&hasEntriesForGoal(state,pairedGoal)?otherRouteFields(state,goal):{};
   state={...savedDraft(saved.assessment,saved.report,goal),...other};
   if(Object.keys(other).length){dirty();state.assessment=false;}
  }
 }
 if(goal===HEART_ASSESSMENT&&state.heart.result){
  state.heartStep=state.heartPrefilled?.length?'review':'country';
  state.heartReviewEdit=false;state.reportTab='summary';
  goto('heart');return;
 }
 if(systemAssessment(goal)&&state.system.result){
  state.systemPrefillLoaded=true;state.systemPrefilled=[];state.systemStep='age';
  goto('system');return;
 }
 return resumeAssessment(goal);
}
function beginAssessment(goal){
 if(state.view==='review')state.profileCompleted=!Object.keys(profileMeasurementErrors(state.answers)).length;
 selectAssessment(draftTypeForGoal(goal));
 return resumeAssessment(goal);
}
function resumeAssessment(goal){
 if(goal===HEART_ASSESSMENT){
  state.reportTab='summary';
  if(state.consent)return enterHeart();
 }
 if(systemAssessment(goal)&&state.consent)return enterSystem();
 state=continueAssessment(state,goal);goto(state.view);
}
function rememberDraftForSample(){if(!state.sample&&assessmentProgress(state).hasData)draftBackup=structuredClone(state);}
function loadSample(type,opener,view='results'){
 rememberReturn(opener,{restore:'preview'});
 rememberDraftForSample();
 if(type===HEART_ASSESSMENT){
  const heart=assessHeartVascular({age:50,country:'Germany',sex:'Male',smoking:'Yes',conditions:'No',treatment:'No',systolic:{value:'140',unit:'mmHg'},diastolic:{value:'85',unit:'mmHg'},total:{value:'5.5',unit:'mmol/L'},hdl:{value:'1.3',unit:'mmol/L'},apob:{value:'0.95',unit:'g/L'},lpa:{value:'<12',unit:'mg/dL'}});
  state={...freshAssessment(type),heart,sample:true,consent:true,assessment:true};goto('report');return;
 }
 const sample=systemSampleInputs(type);
 if(sample){
  const {inputs,result,review}=assessSystem(type,sample);
  state={...freshAssessment(type),system:{inputs,result,review},sample:true,consent:true,assessment:true};
  goto('report');
  return;
 }
 state={...freshAssessment(),resultTab:'summary',answers:structuredClone(sampleAnswers),lab:sampleLabs(),labAge:'45',labReferenceGroup:'male',labFasting:'Yes',labDate:'2026-11-01',labValid:true,labContext:true,sample:true,labSubmitted:true,consent:true,assessment:true,profileCompleted:true};
 if(type==='profile'){state.lab={};state.labSubmitted=false;state.labAge='';state.labDate='';}
 goto(view);
}
document.addEventListener('click',async e=>{
 if(e.target.matches('.overview-picker-overlay')){close();return;}
 const b=e.target.closest('[data-action]');if(!b)return;const act=b.dataset.action;e.preventDefault();
 if(navigationHistory.moving)return;
 if(state.view==='questionnaire')captureQuestion();else if(state.view==='labs')captureLabs();
 if(act==='back-screen'){goBack();return;}
 if(act==='start-system'&&systemAssessment(b.dataset.type)){await action(b,()=>requestAssessment(b.dataset.type,false,b));return;}
 if(act==='start'||act==='start-labs'||act==='start-heart'){
  const goal=act==='start'?'profile':act==='start-labs'?'labs':HEART_ASSESSMENT;
  await action(b,()=>requestAssessment(goal,false,b));return;
 }
 if(act==='consent-next'){
  state.consent=$('#consent').checked;
  if(!state.consent){state.errors={consent:'Confirm your age and that you have read the assessment note.'};render();return;}
  if(state.goal===HEART_ASSESSMENT){await action(b,()=>enterHeart(true));return;}
  if(systemAssessment(state.goal)){await action(b,()=>enterSystem(true));return;}
  goto(state.goal==='labs'?'labs':'questionnaire',0,{replace:true});return;
 }
 if(isSystemAssessment(state)&&act.startsWith('system-')){
  const form=$('#system-form');
  if(form)captureSystem(form);
  if(act==='system-back')backSystem();
  if(act==='system-skip-test'){
   const id=currentSystemStep().testId;
   if(id){delete state.system.inputs[id];state.system.inputs[id+'Status']='Not attempted';submitSystem();}
  }
  if(act==='system-partial')submitSystem(true);
  if(act==='system-review-edit')editSystem(b.dataset.part,'review');
  if(act==='system-finish'){
   const part=state.system.result?.missing?.[0],step=systemStepFor(state.assessmentType,state.system.inputs,part);
   if(step){beginReportEdit(b,step.id);state.systemStep=step.id;goto('system');}
  }
  if(act==='system-extra'){
   if(state.view==='system')state.systemReturnStep=state.systemStep;
   else{
    const step=systemStepFor(state.assessmentType,state.system.inputs,b.dataset.part);
    if(!step)return;
    beginReportEdit(b,step.id);
   }
   editSystem(b.dataset.part,'report');
  }
  if(act==='system-edit'){
   const step=b.hasAttribute('data-review-all')?'age':systemStepFor(state.assessmentType,state.system.inputs,b.dataset.part)?.id;
   if(!step)return;
   beginReportEdit(b,step);
   if(b.hasAttribute('data-review-all')){
    state.systemPrefilled=[];
    state.systemStep='age';
    goto('system');
   }else editSystem(b.dataset.part,'report');
  }
  if(act==='system-copy'&&state.saved&&!state.sample){
   beginReportEdit(b,'age');
   state.systemPrefilled=[];
   state.systemStep='age';
   goto('system');
  }
  return;
 }
 if(act==='pages-info'){pagesInfo();return;}
 if(act==='choose-overview-result'){
  const {choices,choice}=overviewSelection();
  if(state.view==='home'&&choices.length>1)modal('Switch result',renderOverviewPicker(choices,choice.type),{picker:true});
  return;
 }
 if(act==='show-overview-result'){
  const choice=state.view==='home'&&overviewSelection().choices.find(item=>item.type===b.dataset.type);
  if(choice)switchOverviewTo(choice);
  else close();
  return;
 }
 if(act==='retry-overview'){void hydrateOverview(true);return;}
 if(act==='open-overview-draft'){
  const {draft}=overviewSelection().choice;
  if(draft){rememberReturn(b);selectAssessment(assessmentType(draft));goto(independentAssessment(state)?'report':'results');}
  return;
 }
 if(act==='native-provider'&&NATIVE_APP){
  try{
   const response=await openProvider(b.dataset.provider);
   if(response)await finishProviderSignIn(response);
  }catch{signIn={message:'Sign-in could not be completed. Please try again.'};signup();}
  return;
 }
 if(act==='store-review'&&NATIVE_APP){signIn={stage:'store-review'};signup();return;}
 if(act==='auth-change-email'){signIn={};signup();return;}
 if(act==='auth-resend'){await sendEmailCode(b.closest('form'),signIn.email,b);return;}
 if(act==='auth-resume'){await emailAction(b.closest('form'),finishSignIn,b);return;}
 if(act==='complete-health-profile'){startHealthProfile(b);return;}
 if(act==='sign-out'){
  await action(b,async()=>{
   if(accountRefresh)await accountRefresh;
   await api('auth/logout','POST',{});
   clearAccountState();
   goto('home');
  });
  return;
 }
 if(act==='report-tab'){state.reportTab=b.dataset.tab;goto('report');return;}
 if(act==='lab-reference-edit'&&['creatinine','crp'].includes(b.dataset.id)){
  const step=labErrorStep({[b.dataset.id]:true});
  beginReportEdit(b,String(step));
  state.labStep=step;goto('labs');return;
 }
 if(act==='heart-arterial'&&state.heart){
  const form=$('#heart-form');
  if(form)captureHeart(form);
  const {inputs}=state.heart;
  const result=state.heart.result||assessHeartVascular(inputs).result;
  if(heartOffersArterialAge(inputs,result)){modal('Pulse-wave measurement',renderHeartArterialForm(inputs));language.refresh();}
  return;
 }
 if(act==='heart-back'){
  const form=$('#heart-form'),origin=returnTrail.at(-1);
  if(form)captureHeart(form);
  if(origin?.restore==='edit'&&(origin.editStep===state.heartStep||state.heartCompleteVascularAge)){goBack();return;}
  if(state.heartStep==='specialist'&&state.heartSpecialist){
   Object.assign(state,state.heartSpecialist);
   delete state.heartSpecialist;
   state.heartStep='measurements';
   finishAt('report');
   return;
  }
  if(state.heartCompleteVascularAge){
   state.heartCompleteVascularAge=false;
   if(state.heart.result){finishAt('report');return;}
  }
  if(state.heartReviewEdit){returnToHeartReview();return;}
  const steps=heartRoute(state.heart.inputs,state.heartPrefilled);
  const index=steps.findIndex(step=>step.id===state.heartStep);
  if(index>0){state.heartStep=steps[index-1].id;goto('heart',0,{backward:true});}
  else goBack();
  return;
 }
 if(act==='heart-review-edit'){
  state.heartStep=b.dataset.part;state.heartReviewEdit=true;goto('heart');return;
 }
 if(act==='heart-edit'){
  const part=b.dataset.part;
  const step=part==='answers'?(state.heartPrefilled?.length?'review':'country'):part;
  if(state.view==='report')beginReportEdit(b,step);
  if(part==='specialist'&&state.view==='report'){
   const {heart, saved, saveId, savedReport, unlocked, assessment}=state;
   state.heartSpecialist={heart,saved,saveId,savedReport,unlocked,assessment};
  }
  state.heartStep=step;
  state.heartCompleteVascularAge=b.hasAttribute('data-complete-age');
  state.heartReviewEdit=part!=='specialist'&&!state.heartCompleteVascularAge&&!heartRoute(state.heart.inputs,state.heartPrefilled).some(step=>step.id===state.heartStep);
  state.reportTab=!state.heartCompleteVascularAge&&['measurements','blood-pressure'].includes(state.heartStep)?'measurements':'summary';
  goto('heart');
  return;
 }
 if(act==='restore-draft'&&draftBackup){
  const origin=returnTrail.at(-1);
  if(origin?.restore==='preview'&&assessmentProgress(origin.draft).hasData)goBack();
  else{state=draftBackup;draftBackup=null;gotoRoot(state.view);}
  return;
 }
 if(act==='new-assessment'){await action(b,()=>requestAssessment(state.goal,true,b));return;}
 if(act==='edit-existing-assessment'&&assessmentGoal(b.dataset.goal)){
  await action(b,()=>editExistingAssessment(b.dataset.goal,b.dataset.id,b));return;
 }
 if(act==='restart-assessment'&&assessmentGoal(b.dataset.goal)){close();restartAssessment(b.dataset.goal);return;}
 if(act==='sample-report'){loadSample(b.dataset.type,b,'report');return;}
 if(act==='result-tab'){state.resultTab=b.dataset.tab;goto('results');return;}
 if(act==='library-page'){state.libraryPage=Number(b.dataset.page);goto('account');return;}
 if(act==='lab-back'){
  const step=state.labStep||0;
  if(step>0&&returnTrail.at(-1)?.editStep!==String(step)){state.labStep--;goto('labs',0,{backward:true});}
  else goBack();
  return;
 }
 if(act==='consult-step'){advanceContactPage($('#consult-form'),Number(b.dataset.direction));return;}
 if(act==='account-area'||act==='assessments'){
  state.accountTab=b.dataset.tab||'history';state.libraryPage=0;gotoRoot('account');
  void refreshAccount().then(()=>{if(state.view==='account')render();});return;
 }
 if(act==='home'){gotoRoot('home');return;}
 if(act==='method'){method();return;}
 if(act==='privacy'){privacy();return;}
 if(act==='close'){close();return;}
 if(act==='sample'){loadSample(b.dataset.type,b);return;}
 if(act==='question-back'){
  const previous=questionDestination(state,-1),origin=returnTrail.at(-1);
  if(previous.view==='consent'||origin?.view==='review'&&origin.editStep===String(state.step)&&questionContext(state).index===0)goBack();
  else{Object.assign(state,previous);goto(previous.view,0,{backward:true});}
  return;
 }
 if(act==='skip'&&!questionContext(state).question.required){
  const id=b.dataset.id;
  if(Object.hasOwn(state.answers,id)||Object.hasOwn(state.answers,id+'Unit'))dirty();
  delete state.answers[id];
  delete state.answers[id+'Unit'];
  pruneDependentAnswers(id);
  advanceQuestion(b);
  return;
 }
 if(act==='edit-section'){
  rememberReturn(b,{editStep:b.dataset.index});
  state.step=Number(b.dataset.index);state.questionIndex=0;goto('questionnaire');return;
 }
 if(act==='add-drink'){editDrink();return;}
 if(act==='edit-drink'){editDrink(Number(b.dataset.index));return;}
 if(act==='remove-drink'){dirty();state.answers.drinks.splice(Number(b.dataset.index),1);render();return;}
 if(act==='without-labs'){
  if(!checkProfileMeasurements())return;
  rememberReturn(b);state.profileCompleted=true;dirty();state.labSubmitted=false;state.assessment=true;goto('results');return;
 }
 if(act==='labs'){
  if(state.view==='report'){
   beginReportEdit(b,'0');
   resumeAssessment('labs');
   return;
  }
  rememberReturn(b);
  beginAssessment('labs');return;
 }
 if(act==='sample-labs'){loadSample(undefined,b,'labs');return;}
 if(act==='results'){
  if(state.view==='review'){
   if(!checkProfileMeasurements())return;
   state.profileCompleted=true;
  }
  state.assessment=true;
  const view=independentAssessment(state)?'report':'results';
  if(returnTrail.at(-1)?.view===view)goBack();
  else{rememberReturn(b);state.resultTab='summary';goto(view);}
  return;
 }
 if(act==='review'||act==='report'){
  if(returnTrail.at(-1)?.view===act)goBack();
  else{
   if(state.view!==act)rememberReturn(b);
   if(act==='report')state.reportTab='summary';
   goto(act);
  }
  return;
 }
 if(act==='checkout'||act==='offer-report'||act==='open-full-report'&&!b.closest('.report-offer')){
  await action(b,()=>checkout(b.dataset.id,b));return;
 }
 if(act==='report-review-profile'){
  await action(b,()=>editExistingAssessment('profile',b.dataset.id,b,{reportContext:true}));return;
 }
 if(act==='print'){
  await action(b,async()=>{
   try{await reportExport.print(b.dataset.export);}
   catch{modal('Could not save PDF','<p>Try saving the report again.</p>');}
  });
  return;
 }
 if(act==='save-before-checkout'&&webReportCheckout()){
  if(!account()){state.pendingSave=true;signup();return;}
  await action(b,async()=>{
   const draft=state;
   await persistAssessment();
   if(state===draft){render();await checkout();}
  });
  return;
 }
 if(act==='purchase-checkout'&&webReportCheckout()){
  const id=b.dataset.id||state.saveId;
  if(!id||!account())return;
  const profile=offeredProfiles.get(b.closest('.report-offer'));
  await action(b,async()=>{
   const result=await api('payments/checkout','POST',{assessmentId:id,confirm:true});
   if(result.purchased){close();await openSaved(id,'report',returnPoint(b,{restore:'saved'}),{full:true,profile});return;}
   const url=new URL(result.url);
   if(url.protocol!=='https:'||url.hostname!=='checkout.stripe.com')throw Error('Could not open secure checkout.');
   modal('Your secure checkout is ready.',`<p>Continue to Stripe to review the final total and pay. Your saved report stays in your account if you leave checkout.</p><a class="btn" href="${esc(url.href)}" target="_top" rel="noreferrer">Open Stripe checkout →</a><p class="small muted" style="margin-top:15px">You can return to Purchases to check or cancel an unfinished checkout.</p>`);
  });
  return;
 }
 if(act==='refresh-payments'||act==='check-order'){await action(b,async()=>{const result=await api('payments/refresh','POST',act==='check-order'?{orderId:b.dataset.id}:{});auth.purchases=result.purchases;await refreshAccount();state.accountTab='purchases';goto('account');});return;}
 if(act==='cancel-payment'){await action(b,async()=>{await api('payments/cancel','POST',{orderId:b.dataset.id});await refreshAccount();state.accountTab='purchases';goto('account');});return;}
 if(act==='consult'){if(!NATIVE_APP)goto('consult');return;}
 if(act==='account'){state.accountTab='settings';gotoRoot('account');void refreshAccount().then(()=>{if(state.view==='account')render();});return;}
 if(act==='signup'||act==='signin'){signup();return;}
 if(act==='refresh-account'){close();const job=refreshAccount();gotoRoot('account');void job.then(()=>{if(state.view==='account')render();});return;}
 if(act==='account-tab'){
  if(state.accountTab!==b.dataset.tab)state.libraryPage=0;
  state.accountTab=b.dataset.tab;
  gotoRoot('account',{backward:b.matches('.task-back')});
  return;
 }
 if(act==='trend-personal'||act==='trend-sample'){state.showSampleTrends=act==='trend-sample';delete state.trendSeries;goto('account');return;}
 if(act==='save'){save();return;}
 if(act==='confirm-save'){await action(b,async()=>{
  const draft=state;
  await persistAssessment();
  if(b.isConnected)close();
  if(state===draft)render();
  announce('Assessment and report saved to your private account.');
 });return;}
 if(act==='open-full-report'&&!b.dataset.id){
  if(!fullReportAvailable())return;
  state.reportProfile=offeredProfiles.get(b.closest('.report-offer'));
  close();
  if(state.view!=='report')rememberReturn(null);
  state.reportEdition='full';
  state.reportTab='summary';
  goto('report');
  return;
 }
 if(['open-saved','open-report','open-full-report'].includes(act)&&b.dataset.id){
  const profile=offeredProfiles.get(b.closest('.report-offer'));
  const opener=b.closest('#main')?b:[...$('#main').querySelectorAll('[data-action="offer-report"]')].find(button=>button.dataset.id===b.dataset.id);
  const origin=returnPoint(opener,{restore:'saved'});
  await action(b,async()=>{close();await openSaved(b.dataset.id,act==='open-saved'?'results':'report',origin,{full:act==='open-full-report',profile});});return;
 }
 if(act==='remove-local'||act==='reset'){
  const id=b.dataset.id;
  if(id&&!auth.history.some(record=>record.id===id)||!id&&!assessmentProgress(state).hasData)return;
  const note=id?'This removes the assessment and its report from this browser. The saved copy is available on your other devices.':'This clears the current assessment and its report from this browser.';
  modal('Remove from this device?',`<p>${note}</p><div class="actions"><button class="btn secondary" data-action="close">Cancel</button><button class="btn" data-action="confirm-remove-local" ${id?`data-id="${esc(id)}"`:''}>Remove from this device</button></div>`);
  return;
 }
 if(act==='confirm-remove-local'){
  const id=b.dataset.id;
  const persisted=id?hideSavedRecord(id):true;
  if(!id)discardCurrentDraft();
  close();gotoRoot('account');
  announce(persisted?'Removed from this device.':'Removed for this session.');
  return;
 }
 if(act==='delete-account'){modal('Delete your KoleQuant account?',`<p>This removes your profile, sign-in information, sessions and saved reports from the live database. ${NATIVE_APP?'Backups expire separately. Copies you downloaded remain on your device.':'Provider backups, downloads and Stripe payment records have separate lifecycles.'}</p><form id="delete-account-form"><label for="delete-confirm">Type DELETE to confirm</label><input id="delete-confirm" type="text" required pattern="DELETE" autocomplete="off"><button class="btn" type="submit" style="margin-top:20px">Delete my account & history</button></form>`);return;}
 if(act==='export'){await action(b,async()=>{const data=await api('account/export');if(NATIVE_APP){await shareNativeExport(data);return;}const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='kolequant-account-export.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);});return;}
 if(act==='import-legacy'){importLegacy();return;}
 if(act==='seed-history'){await action(b,async()=>{for(const [date,rdw] of [['2026-10-01',14.4],['2026-11-01',14]]){const l=sampleLabs();l.rdw.value=String(rdw);await api('assessments','POST',{id:crypto.randomUUID(),answers:structuredClone(sampleAnswers),lab:l,labAge:'45',labDate:date,labSubmitted:true,labContext:true,labFasting:'Yes',sample:true,unlocked:false});}await refreshAccount();state.accountTab='progress';state.showSampleTrends=true;goto('account');});return;}


});
document.addEventListener('input',e=>{const t=e.target;if(t.form?.id==='heart-arterial-form'){reviewArterialField(t,true);return;}if(t.form?.id==='heart-form'){if(!t.dataset.heartUnit)captureHeart(t.form);if(t.dataset.heartValue||t.dataset.heartReference&&t.type==='text')reviewHeartField(t,true);return;}if(t.dataset.labReference){dirty();state.lab[t.dataset.labReference]??={};state.lab[t.dataset.labReference][t.dataset.referenceKey]=t.value;delete state.errors[t.dataset.labReference+'Reference'];t.closest('details')?.querySelector('.error')?.remove();}});
document.addEventListener('change',e=>{const t=e.target;if(t.form?.id==='heart-form'){if(t.dataset.heartUnit)changeHeartUnit(t,state.heart.inputs[t.dataset.heartUnit]);captureHeart(t.form);if(t.dataset.heartUnit||t.dataset.heartReference&&t.tagName==='SELECT')reviewHeartField(t);return;}if(['lab-reference-mode','lab-reference-group','crp-assay'].includes(t.id)){dirty();if(t.id==='crp-assay'){state.lab.crp??={};state.lab.crp.assay=t.value;}else{state[t.id==='lab-reference-mode'?'labReferenceMode':'labReferenceGroup']=t.value;state.labReferenceVersion=REFERENCE_CATALOG_VERSION;}}if(t.dataset.labReferenceRule){dirty();state.lab[t.dataset.labReferenceRule]??={};state.lab[t.dataset.labReferenceRule][t.dataset.referenceKey]=t.value==='exclusive';}});
document.addEventListener('toggle',e=>{if(e.target.matches?.('.reference-editor[open]'))document.querySelectorAll('.reference-editor[open]').forEach(editor=>{if(editor!==e.target)editor.open=false;});},true);
for(const event of ['input','change','focusout']){
 document.addEventListener(event,e=>{
  const target=e.target;
  if(target.form?.id!=='system-form')return;
  captureSystem(target.form);
  systemFeedback(target,event==='input');
 });
}
document.addEventListener('focusout',e=>{const t=e.target;if(t.form?.id==='heart-arterial-form')reviewArterialField(t,false);if(t.form?.id==='heart-form'&&(t.dataset.heartValue||t.dataset.heartReference&&t.type==='text'))reviewHeartField(t);});
document.addEventListener('input',e=>{
 if(e.target.dataset.answer!=='birthYear')return;
 const age=birthYearAge(e.target.value);
 const field=e.target.form?.querySelector('[data-answer="age"]');
 if(age&&field)field.value=age;
});
document.addEventListener('input',e=>{const t=e.target;if(t.id==='auth-email')syncEmailSubmit(t.form);clearContactFeedback(t);if(t.dataset.answer!==undefined||t.dataset.lab||t.dataset.drink!==undefined||['lab-age','lab-date'].includes(t.id))dirty();if(t.dataset.answer!==undefined&&!['radio','checkbox'].includes(t.type)){state.answers[t.dataset.answer]=t.value;if(['weight','weightYearAgo'].includes(t.dataset.answer))delete state.answers.weightChangeIntent;}if(t.dataset.lab){state.lab[t.dataset.lab]??={unit:labs.find(l=>l.id===t.dataset.lab).units[0]};state.lab[t.dataset.lab].value=t.value;}if(t.dataset.drink!==undefined)state.answers.drinks[Number(t.dataset.drink)][t.dataset.key]=t.value;if(t.id==='lab-age')state.labAge=t.value;if(t.id==='lab-date')state.labDate=t.value;});
document.addEventListener('change',e=>{
 const t=e.target;
 if(t.id==='trend-series'&&state.accountTab==='progress'){state.trendSeries=t.value;render();$('#trend-series')?.focus();return;}
 if(t.id==='auth-email')syncEmailSubmit(t.form);
 clearContactFeedback(t);
 if(t.dataset.answer!==undefined||t.dataset.unit||t.dataset.labUnit||['lab-valid','lab-context'].includes(t.id))dirty();
 if(t.dataset.answer!==undefined&&['radio','checkbox'].includes(t.type)){
  const id=t.dataset.answer;
  if(t.type==='checkbox'){
   const selected=Array.isArray(state.answers[id])?state.answers[id]:[];
   const remaining=selected.filter(value=>value!==t.value&&!EXCLUSIVE_ANSWERS.includes(value));
   state.answers[id]=t.checked?(EXCLUSIVE_ANSWERS.includes(t.value)?[t.value]:[...remaining,t.value]):selected.filter(value=>value!==t.value);
  }else{
   state.answers[id]=t.value;
   pruneDependentAnswers(id);
  }
  syncChoiceInputs(id,t);
 }
 if(t.dataset.unit){state.answers[t.dataset.unit+'Unit']=t.value;if(['weight','weightYearAgo'].includes(t.dataset.unit))delete state.answers.weightChangeIntent;}if(t.dataset.labUnit){const id=t.dataset.labUnit,previous=state.lab[id]||{value:''},changed=previous.unit!==t.value&&['referenceLow','referenceHigh'].some(key=>previous[key]!==undefined&&previous[key]!=='');state.lab[id]=setLabEntryUnit(id,previous,t.value);for(const input of t.closest('fieldset').querySelectorAll('[data-lab-reference]'))input.value=state.lab[id][input.dataset.referenceKey]??'';if(changed){let note=t.closest('fieldset').querySelector('.reference-unit-note');if(!note){note=document.createElement('p');note.className='hint reference-unit-note';note.setAttribute('role','status');t.closest('.input-row').after(note);}note.textContent='Reference limits were converted to the selected unit. Check them against your report.';language.refresh();}}if(t.id==='lab-valid')state.labValid=t.checked;if(t.name==='lab-fasting'){dirty();state.labFasting=t.value;}if(t.id==='lab-context')state.labContext=t.checked;if(t.id==='share-assessment')$('#share-options').hidden=!t.checked;});
document.addEventListener('submit',async e=>{
 e.preventDefault();
 if(navigationHistory.moving)return;
 const f=e.target;
 if(f.id==='system-form'){captureSystem(f);submitSystem();return;}
 if(f.id==='questions'){
  captureQuestion();
  const q=questionContext(state).question,errors=validateQuestionnaire(state.answers,{requireMeasurements:true});
  state.errors=q.id==='age'?Object.fromEntries(Object.entries(errors).filter(([id])=>['age','birthYear'].includes(id))):errors[q.id]?{[q.id]:errors[q.id]}:{};
  if(Object.keys(state.errors).length){render();return;}
  advanceQuestion(e.submitter);return;
 }
 if(f.id==='heart-form'){
  captureHeart(f);
  const specialist=state.heartStep==='specialist'&&state.heartSpecialist;
  const directEdit=state.heartReviewEdit||state.heartCompleteVascularAge||specialist;
  const steps=directEdit?heartSteps(state.heart.inputs).filter(step=>step.id===state.heartStep):heartRoute(state.heart.inputs,state.heartPrefilled);
  const index=steps.findIndex(step=>step.id===state.heartStep);
  const {inputs,errors,result,review}=assessHeartVascular(state.heart.inputs,{requireHistory:!state.saved});
  const errorIndex=steps.findIndex(step=>step.fields.some(field=>errors[field.id]||errors[field.id+'Reference']));
  if(errorIndex>=0&&errorIndex<=index){
   state.heartStep=steps[errorIndex].id;state.errors=errors;render();
   $('#heart-form [aria-invalid="true"]')?.focus();
   return;
  }
  if(specialist){
   delete state.heartSpecialist;
   state.heartStep='measurements';
   if(!state.saved){dirty();state.heart={inputs,result,review};}
   state.assessment=true;
   state.reportTab='measurements';
   finishAt('report');return;
  }
  if(state.heartReviewEdit){returnToHeartReview();return;}
  if(state.heartCompleteVascularAge){
   const next=['framingham-data','pday-data'].includes(result?.issue)?heartRoutineAgeStep(result.missing):null;
   if(next&&next!==state.heartStep){state.heartStep=next;goto('heart');return;}
   state.heartCompleteVascularAge=false;
  }
  if(index<steps.length-1){
   state.heartStep=steps[index+1].id;goto('heart');return;
  }
  if(!state.saved){dirty();state.heart={inputs,result,review};}
  state.assessment=true;finishAt('report');return;
 }
 if(f.id==='heart-arterial-form'){
  const cfpwv=e.submitter?.value==='remove'?null:readHeartArterialForm(f);
  const draft={...state.heart.inputs,cfpwv};
  const {inputs,errors,result,review}=assessHeartVascular(draft,{requireHistory:!state.saved});
  if(cfpwv&&!cfpwv.value.trim())errors.cfpwv='Enter the measured value.';
  if(Object.keys(errors).length){
   if(!errors.cfpwv&&!errors.cfpwvMethod)errors.arterial='Review your answers before adding a pulse-wave result.';
   f.outerHTML=renderHeartArterialForm(draft,errors,!!state.heart.inputs.cfpwv);
   language.refresh();
   $('#heart-arterial-form [aria-invalid="true"]')?.focus();
   return;
  }
  if(state.view==='heart'){
   dirty();state.heart={inputs};close();goto('heart');return;
  }
  dirty();state.heart={inputs,result,review};state.reportTab='summary';close();goto('report');
  if(review.arterialAge)$('.heart-arterial')?.scrollIntoView?.({block:'nearest'});
  return;
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
  if(step<4){state.labStep=step+1;goto('labs');return;}
  state.labSubmitted=true;state.assessment=true;state.resultTab='summary';
  const origin=returnTrail.at(-1);
  if(origin?.restore==='edit')goBack({commitEdit:true});
  else goto('results');
 }
 if(f.id==='consult-form'){
  const current=Number(f.dataset.page)||0;if(current<2){advanceContactPage(f,1);return;}
  for(let i=0;i<3;i++){if(!validateContactPage(f,i,{focus:false})){showContactPage(f,i);return;}}
  state.enquiry={reason:$('#contact-reason').value,country:$('#contact-country').value,share:$('#share-assessment')?.checked?[...document.querySelectorAll('input[name="share"]:checked')].map(x=>x.value):[]};goto('enquiry');
 }
 if(f.id==='store-review-form'&&NATIVE_APP&&f.reportValidity())await emailAction(f,async()=>{
  await api('auth/store-review','POST',{code:f.elements.code.value.trim()});
  await api('auth/register','POST',{
   name:'GeneticAge Review',adult:f.elements.adult.checked,consent:f.elements.consent.checked,
   consentVersion:CONSENT_VERSION,signInMethod:'social',
  });
  await finishSignIn();
 });
 if(f.id==='auth-email-form'&&f.reportValidity())await sendEmailCode(f,f.elements.email.value.trim());
 if(f.id==='auth-code-form'&&f.reportValidity())await emailAction(f,async()=>{
  const {registrationRequired}=await api('auth/verify','POST',{email:signIn.email,code:f.elements.code.value});
  if(registrationRequired){if(f.isConnected){signIn.stage='register';signup();}}
  else await finishSignIn();
 });
 if(f.id==='signup-form'&&f.reportValidity())await emailAction(f,async()=>{
  await api('auth/register','POST',{name:f.elements.name.value,adult:f.elements.adult.checked,consent:f.elements.consent.checked,consentVersion:CONSENT_VERSION,signInMethod:signIn.stage==='register'?'email':'social'});
  await finishSignIn();
 });
 if(f.id==='delete-account-form'){
  if(!f.reportValidity())return;
  await action(f.querySelector('[type="submit"]'),async()=>{
   const result=await api('account','DELETE',{confirm:$('#delete-confirm').value});
   clearAccountState();
   close();
   state.accountTab='settings';
   goto('account');
   const deleted='Your KoleQuant account and live records have been deleted.';
   announce(deleted);
   if(result.appleRevocation==='manual'){
    modal('Account deleted',`<p>${deleted}</p><p>To remove GeneticAge from Sign in with Apple, open your Apple Account settings and remove the app.</p><a class="btn secondary" href="https://support.apple.com/102571" target="_blank" rel="noopener noreferrer">View Apple’s instructions ↗</a>`);
   }
  });
 }
 if(f.id==='import-form'){if(!f.reportValidity())return;const a=legacyAccounts().find(x=>x.id===$('#legacy-id').value);await action(f.querySelector('[type="submit"]'),async()=>{let count=0;for(const entry of a.history||[]){try{await api('assessments','POST',{...entry,id:entry.id||crypto.randomUUID()});count++;}catch(error){await refreshAccount();throw new Error(count+' assessments imported. The next entry could not be imported: '+error.message);}}await refreshAccount();close();state.accountTab='history';goto('account');announce(count+' assessments imported. Original copies remain on this browser.');});}


});
document.addEventListener('invalid',e=>{if(e.target.closest?.('#consult-form'))e.preventDefault();},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('.overlay'))close();if(e.key==='Tab'&&$('.modal')){const items=[...$('.modal').querySelectorAll('button,a,input,select')].filter(el=>!el.hidden&&!el.disabled);const first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});

let overviewSwipe=null;
document.addEventListener('pointerdown',e=>{
 if(e.pointerType!=='touch')return;
 overviewSwipe=null;
 const card=e.target.closest('.home-workspace [data-overview-swipe]');
 if(e.isPrimary&&card&&!e.target.closest('button,a')){
  overviewSwipe={id:e.pointerId,x:e.clientX,y:e.clientY,card};
 }
});
document.addEventListener('pointerup',e=>{
 if(!overviewSwipe||overviewSwipe.id!==e.pointerId)return;
 const {x,y,card}=overviewSwipe;
 overviewSwipe=null;
 if(state.view!=='home'||!card.isConnected)return;
 const dx=e.clientX-x,dy=e.clientY-y;
 if(Math.abs(dx)<44||Math.abs(dx)<Math.abs(dy)*1.4)return;
 const {choices,choice}=overviewSelection();
 if(choices.length<2)return;
 const index=choices.findIndex(item=>item.type===choice.type);
 const direction=dx<0?1:-1;
 switchOverviewTo(choices[(index+direction+choices.length)%choices.length],direction);
});
document.addEventListener('pointercancel',e=>{if(overviewSwipe?.id===e.pointerId)overviewSwipe=null;});
async function finishProviderSignIn({ticket,verifier}){
 try{
  if(ticket==='cancelled'){signIn={message:'Sign-in was cancelled. Choose a sign-in method to try again.'};signup();return;}
  if(ticket==='retry')throw new Error('Provider sign-in failed.');
  const result=await api('auth/native-complete','POST',{ticket,verifier});
  if(result.registrationRequired){signIn={stage:'social-register'};signup();}
  else await finishSignIn();
 }catch{signIn={message:'Sign-in could not be completed. Please try again.'};signup();}
}
listenForProviderReturn(finishProviderSignIn);
initializeAppearance();
render();
navigationHistory.visit({replace:true});
refreshAccount().then(async()=>{
 if(location.hash==='#account'){state.accountTab='settings';goto('account',0,{replace:true});}
 else if(['account','report','results'].includes(state.view))render();
 handleSignInReturn();
 await paymentReturn();
});
window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
window.addEventListener('storage',event=>{
 if(event.key!==hiddenRecordsKey)return;
 hiddenRecords=new Set([...hiddenRecords,...readHiddenRecords()]);
 evictHiddenRecords();
 if(state.view==='account')render();
 if(state.view==='home'){renderOverview();void hydrateOverview();}
});
