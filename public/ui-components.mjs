export const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export {icon as uiIcon} from './icons.mjs';
import {icon as uiIcon} from './icons.mjs';
import {isReportableAge} from './lab-safety.mjs';
export const screenHeading=(eyebrow,title,subtitle='',action='')=>`<header class="screen-head" data-theme-part><div><span class="eyebrow">${eyebrow}</span><h1>${title}</h1>${subtitle?`<p>${subtitle}</p>`:''}</div>${action}</header>`;

// Accessible text always contains the final value. Only the hidden visual copy counts.
function instrumentValue(value,{signed=false,digits=0}={}){
 const text=String(value??'—'),numeric=(typeof value==='number'||typeof value==='string'&&/^[+-]?\d+(?:\.\d+)?$/.test(value.trim()))&&Number.isFinite(Number(value));
 return numeric?`<span class="sr-only">${escapeHTML(text)}</span><span aria-hidden="true" data-count-to="${Number(value)}" data-count-final="${escapeHTML(text)}" data-count-signed="${signed}" data-count-digits="${digits}">${escapeHTML(text)}</span>`:escapeHTML(text);
}

// An open, paired form marks an unmeasured state; it is never a score or a loader.
export function unmeasuredMark(){
 return '<svg class="unmeasured-mark" viewBox="0 0 100 84" fill="none" aria-hidden="true" focusable="false"><defs><linearGradient id="signature-satin" x1="24" y1="10" x2="72" y2="73" gradientUnits="userSpaceOnUse"><stop stop-color="var(--result-accent)" stop-opacity=".3"/><stop offset=".32" stop-color="var(--result-ink)"/><stop offset=".48" stop-color="var(--result-accent)" stop-opacity=".5"/><stop offset=".7" stop-color="var(--result-ink)" stop-opacity=".9"/><stop offset="1" stop-color="var(--result-accent)" stop-opacity=".35"/></linearGradient></defs><g class="signature-surface"><path class="signature-rear" d="M33 6C70 17 73 28 52 42C30 56 33 68 67 80C42 61 41 57 60 45C87 28 70 13 33 6Z"/><path class="signature-front" d="M67 6C30 17 27 28 48 42C70 56 67 68 33 80C58 61 59 57 40 45C13 28 30 13 67 6Z"/><path class="signature-light" d="M67 6C35 18 30 28 48 42M60 51C65 61 54 71 33 80"/></g></svg>';
}

// Calibration is decorative, not a health score, confidence interval or aging speed.
export function resultInstrument({value,age=null,gap=null,sample=false,illustrative=false,empty=false,profileOnly=false,withheld=false,action='sample',actionLabel='',recordId='',title='A look at the result',date=''}){
  if(!empty&&!profileOnly&&!withheld&&!isReportableAge(value)){withheld=true;profileOnly=true;}
  const ticks=Array.from({length:61},(_,i)=>{const a=(150+i*4)*Math.PI/180,r=i%5===0?112:116;return `<line x1="${(140+Math.cos(a)*r).toFixed(2)}" y1="${(140+Math.sin(a)*r).toFixed(2)}" x2="${(140+Math.cos(a)*121).toFixed(2)}" y2="${(140+Math.sin(a)*121).toFixed(2)}" class="${i%5===0?'major':''}"/>`;}).join('');
  const noAge=empty||profileOnly||withheld;
  return `<section class="result-instrument result-surface ${sample?'sample-panel':'personal-result'} ${noAge?'welcome-instrument':''}" aria-labelledby="result-instrument-title" data-theme-part ${!noAge&&Number.isFinite(value)?'data-result-motion':''}>
    <img class="theme-orb" data-theme-asset="blood-moon" src="/assets/blood-moon-overview-v2.webp" srcset="/assets/blood-moon-overview-v2-small.webp 256w, /assets/blood-moon-overview-v2.webp 512w" sizes="260px" width="512" height="512" alt="" decoding="async">
    <div class="instrument-heading ${empty?'instrument-heading-empty':''}"><h2 id="result-instrument-title" ${empty?'class="sr-only"':''}>${empty?'Start here':title}</h2><span class="instrument-tag">${empty?'START HERE':withheld?'REVIEW NEEDED':profileOnly?'HEALTH PROFILE':sample||illustrative?'SAMPLE':'YOUR RESULT'}</span></div>
    <div class="instrument-stage">
      <div class="instrument-atmosphere" aria-hidden="true"><span class="bionic-rib rib-one"></span><span class="bionic-rib rib-two"></span><span class="bionic-rib rib-three"></span></div>
      <div class="instrument-dial">
        <svg class="dial-rings" viewBox="0 0 280 280" fill="none" aria-hidden="true"><circle cx="140" cy="140" r="130" class="outer-orbit"/><path d="M36.08 200a120 120 0 1 1 207.84 0" class="dial-track"/>${ticks}<path d="M48.2 193a106 106 0 0 1 183.6-106" pathLength="1" class="dial-highlight"/><g class="dial-pointer" transform="translate(231.799 87) rotate(60)"><path d="M0-5 3.8 3-3.8 3Z"/></g><path d="M132 239h16M140 231v16" class="dial-cross"/></svg>
        <div class="instrument-number"><span class="readout-label">${withheld?'ESTIMATE UNAVAILABLE':profileOnly?'HEALTH & LIFESTYLE':'CLINICAL PHENOAGE'}</span><strong class="age-value ${noAge?'age-unmeasured':''}">${noAge?unmeasuredMark():instrumentValue(value,{digits:2})}</strong><span class="instrument-unit">${empty?'No assessment yet':withheld?'Needs review':profileOnly?'No age calculated':'years'}</span></div>
        <span class="dial-caption">${noAge?'A PERSONAL PERSPECTIVE':'BLOOD-BASED ESTIMATE'}</span>
      </div>
    </div>
    ${noAge?`<p class="welcome-instrument-note">${empty?'Begin with your health profile or blood results you already have.':withheld?'Open this assessment to review why an estimate is unavailable.':'Your questionnaire creates a health profile. It does not calculate an age.'}</p>`:`<div class="instrument-comparison"><div><span>Age at blood draw</span><strong>${instrumentValue(age)}<small>years</small></strong></div><span class="comparison-line" aria-hidden="true"></span><div><span>Simple difference</span><strong>${instrumentValue(gap,{signed:true})}<small>years</small></strong></div></div>`}
    <div class="instrument-footer"><span>${empty?'No profile needed':sample||illustrative?'Illustrative data · Not your result':escapeHTML(date)}</span><button class="text-btn" data-action="${action}" ${recordId?`data-id="${escapeHTML(recordId)}"`:''}>${actionLabel||(empty?'Explore a sample':sample?'Explore the result':'About the calculation')}<span aria-hidden="true">↗</span></button></div>
  </section>`;
}

export function libraryMotif(){return '<div class="library-motif" aria-hidden="true"><i></i><i></i><i></i><img class="lunar-portrait" data-theme-asset="blood-moon" src="/assets/blood-moon-v2.webp" srcset="/assets/blood-moon-v2-small.webp 256w, /assets/blood-moon-v2.webp 512w" sizes="140px" width="512" height="512" alt="" decoding="async"></div>';}
export function reportArtwork(){return `<div class="report-artwork" aria-hidden="true">${[['black-metal','black-metal-report-v2'],['blood-moon','blood-moon-report-v1'],['bionic','bionic-report-v3']].map(([theme,asset])=>`<img data-report-art="${theme}" data-theme-asset="${theme}" src="/assets/${asset}.webp" srcset="/assets/${asset}-small.webp 256w, /assets/${asset}.webp 512w" sizes="150px" width="512" height="512" alt="" decoding="async">`).join('')}</div>`;}
export function statusMessage({loading,error}){return `${loading?'<span class="sync-status" role="status">Connecting to your account…</span>':''}${error?`<div class="connection-note" role="status">${escapeHTML(error)} <button class="text-link" data-action="refresh-account">Retry</button></div>`:''}`;}
export function pageSlice(items,page=0,size=2){const pages=Math.max(1,Math.ceil(items.length/size)),index=Math.max(0,Math.min(Number(page)||0,pages-1));return {items:items.slice(index*size,(index+1)*size),page:index,pages};}
export function libraryPager(page,pages){return pages<2?'':`<nav class="compact-pager" aria-label="Saved records pages"><button class="text-btn" data-action="library-page" data-page="${page-1}" ${page===0?'disabled':''}>← Previous</button><span>${page+1} / ${pages}</span><button class="text-btn" data-action="library-page" data-page="${page+1}" ${page===pages-1?'disabled':''}>Next →</button></nav>`;}
function historyRows(history,reports=false,page=0){const slice=pageSlice([...history].reverse(),page);return `<div class="record-list">${slice.items.map(s=>`<article class="record-row"><span class="record-icon">${uiIcon(reports?'report':s.labSubmitted||s.value!==null?'drop':'pulse')}</span><div><h3>${s.labSubmitted||s.value!==null?'Clinical PhenoAge':'Health & lifestyle'}</h3><p>${escapeHTML(s.labDate||new Date(s.saved).toLocaleDateString('en-GB'))}${s.sample?' · Sample':''}</p></div><div class="record-end"><strong>${isReportableAge(s.value)?Math.round(s.value)+'<small> yr</small>':s.labSubmitted||s.value!==null?'Needs review':'Profile'}</strong><button class="text-link" data-action="${reports?'open-report':'open-saved'}" data-id="${escapeHTML(s.id)}">${reports?'Read report':'Open'} ↗</button></div></article>`).join('')}</div>${libraryPager(slice.page,slice.pages)}`;}
export function renderRecordLibrary({history=[],reports=false,page=0}){return `<div class="wrap app-screen account-subscreen"><button class="text-btn task-back" data-action="account-tab" data-tab="${reports?'reports':'history'}">← ${reports?'Reports':'My assessments'}</button>${screenHeading('YOUR PRIVATE LIBRARY',reports?'Saved reports':'Assessment history',`${history.length} dated ${history.length===1?'record':'records'}`)}${historyRows(history,reports,page)}${!reports?'<button class="text-link" data-action="account-tab" data-tab="progress">View progress over time ↗</button>':''}</div>`;}
const recordSummary=(history,reports=false)=>`<button class="record-summary" data-action="account-tab" data-tab="${reports?'report-history':'saved'}"><span class="record-icon">${uiIcon(reports?'report':'pulse')}</span><span><strong>${history.length} saved ${reports?'reports':'assessments'}</strong><small>Open your private library</small></span>${uiIcon('arrow')}</button>`;

export function renderAssessments({profile,history=[],loading=false,error='',pagesPreview=false,progress=null}){
 return `<div class="wrap app-screen assessments-screen">${screenHeading('YOUR WORKSPACE','My assessments','Choose a starting point. Build a clearer picture.')}
  <section class="assessment-intro" data-theme-part>${libraryMotif()}<span class="eyebrow">TWO WAYS TO BEGIN</span><h2>One personal perspective.</h2><p>Start with your health profile or existing blood results.</p></section>
  ${progress?.hasData?`<section class="current-assessment"><div><strong>Continue your assessment</strong><p><span>${progress.answered} / ${progress.total}</span> <span>questions answered</span> · <span>${progress.measurements} / 9</span> <span>blood measurements</span></p></div><button class="text-btn" data-action="report">Open report ↗</button></section>`:''}
  <div class="assessment-routes"><button class="assessment-route" data-action="start" data-theme-part><span class="route-icon">${uiIcon('pulse')}</span><span><strong>Health & lifestyle</strong><small>26 questions · One question at a time</small></span>${uiIcon('arrow')}</button><button class="assessment-route" data-action="start-labs" data-theme-part><span class="route-icon">${uiIcon('drop')}</span><span><strong>Blood-based age</strong><small>9 measurements · Guided entry</small></span>${uiIcon('arrow')}</button></div>
  ${progress?.hasData?'<button class="text-btn new-assessment-link" data-action="new-assessment">Start a new assessment</button>':''}
  <section class="saved-records" aria-label="Saved assessments"><div class="section-caption"><h2>Your history</h2><span>${profile?'PRIVATE':'OPTIONAL TO SAVE'}</span></div>${statusMessage({loading,error})}${history.length?recordSummary(history):'<div class="quiet-empty"><span class="empty-orbit" aria-hidden="true"></span><p>'+(pagesPreview?'Cloud history is available in the hosted app.':'Your saved assessments will appear here.')+'</p></div>'}</section>
  ${pagesPreview?'<button class="account-nudge text-btn" data-action="pages-info">Cloud features ↗</button>':!profile?'<button class="account-nudge text-btn" data-action="signup">Sign in to keep your history <span aria-hidden="true">↗</span></button>':''}
 </div>`;
}

export function renderReportLibrary({profile,history=[],loading=false,error='',assessment=false,pagesPreview=false}){
 return `<div class="wrap app-screen reports-screen">${screenHeading('YOUR WORKSPACE','Reports','The detail behind your result.')}
  <button class="report-feature" data-action="${assessment?'report':'sample-report'}" data-theme-part>${reportArtwork()}<span class="eyebrow">${assessment?'CURRENT ASSESSMENT':'EXPLORE A SAMPLE'}</span><strong>Your health,<br>explained.</strong><span class="report-feature-caption">Interpretation · Findings · Sources</span><span class="report-feature-action">${assessment?'Open your report':'Preview a sample report'} ${uiIcon('arrow')}</span></button>
  <section class="saved-records"><div class="section-caption"><h2>Saved reports</h2><span>PRIVATE LIBRARY</span></div>${statusMessage({loading,error})}${history.length?recordSummary(history,true):'<div class="quiet-empty"><p>'+(pagesPreview?'Cloud history is available in the hosted app.':'Save an assessment to keep its dated report here.')+'</p></div>'}</section>
  ${pagesPreview?'<button class="account-nudge text-btn" data-action="pages-info">Cloud features ↗</button>':!profile?'<button class="account-nudge text-btn" data-action="signup">Sign in to access saved reports <span aria-hidden="true">↗</span></button>':''}
 </div>`;
}

export function renderAccount({profile,authenticated,loading,error}){
 const row=(name,sub,action,extra='',symbol='report')=>`<button class="account-setting" data-action="${action}" ${extra}><span class="setting-symbol">${uiIcon(symbol)}</span><span class="setting-copy"><strong>${name}</strong><small>${sub}</small></span>${uiIcon('external')}</button>`;
 return `<div class="wrap app-screen account-screen">${screenHeading('YOUR WORKSPACE','Account','Your profile, preferences and information.')}
 <section class="profile-card" data-theme-part><span class="profile-avatar">${uiIcon('person')}</span><div><h2${profile?' data-no-translate':''}>${escapeHTML(profile?.name||'Your private workspace')}</h2><p>${profile?'Connected with ChatGPT':authenticated?'ChatGPT connected · Profile not created':'Sign in to keep assessments across devices'}</p></div>${!profile?'<button class="btn" data-action="signup">'+(authenticated?'Create profile':'Sign in')+' →</button>':''}</section>
 ${statusMessage({loading,error})}<section class="account-settings" data-theme-part>${row('Privacy & data','Your information and choices','privacy','','shield')}${row('Assessment methods','Evidence and interpretation','method','','science')}${row('Purchases','Report access and payments','account-tab','data-tab="purchases"')}${profile?row('Manage saved data','Export and account controls','account-tab','data-tab="data"','history'):row('Saving assessments',authenticated?'Choose which assessments to save':'Sign in to save assessments','signup','','shield')}${row('About this app','Information and support','account-tab','data-tab="about"','spark')}</section>
 ${profile?'<a class="account-signout text-btn" href="/signout-with-chatgpt?return_to=%2F" target="_top">Sign out</a>':''}
 <p class="account-footnote">${uiIcon('shield')}<span>You choose what to save.</span></p></div>`;
}

export function renderPagesAccount(){
 const row=(name,sub,action,symbol,extra='')=>`<button class="account-setting" data-action="${action}" ${extra}><span class="setting-symbol">${uiIcon(symbol)}</span><span class="setting-copy"><strong>${name}</strong><small>${sub}</small></span>${uiIcon('external')}</button>`;
 return `<div class="wrap app-screen account-screen">${screenHeading('YOUR WORKSPACE','Account','Themes, language and app information.')}
 <section class="profile-card" data-theme-part><span class="profile-avatar">${uiIcon('person')}</span><div><h2>On this device</h2><p>GitHub Pages preview</p></div></section>
 <section class="account-settings" data-theme-part>${row('Privacy & data','Answers stay in this page’s memory','privacy','shield')}${row('Assessment methods','Evidence and interpretation','method','science')}${row('Cloud features','Accounts, saved history and purchases','pages-info','history')}${row('About this app','Information and support','account-tab','spark','data-tab="about"')}</section>
 <p class="account-footnote">${uiIcon('shield')}<span>This preview does not create an account.</span></p></div>`;
}
