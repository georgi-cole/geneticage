import {FAMILY_COPY as F} from './report-knowledge/family-copy.mjs';
import {CLINICAL_COPY as L} from './report-knowledge/clinical-copy.mjs';
import {clinicalRecordGroups,clinicalComparison} from './report-clinical.mjs';
import {hasReportFolio,isFamilyFolio,reportFolioArt,reportFolioPage,reportFolioPalette,reportFolioRecord} from './report-folio.mjs';
import {EDITORIAL_COPY as C} from './report-knowledge/copy.mjs';

// Values are never HTML. This renderer accepts a saved, server-authored document,
// not arbitrary source fragments or client-supplied template instructions.
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl=value=>{try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)?value:null;}catch{return null;}};
const documents=new Map();
let sequence=0;
function register(document){
 const key='kq-report-'+(++sequence);
 documents.clear(); // Only the current rendered edition can be exported.
 documents.set(key,document);
 return key;
}
export function currentEditorialDocument(root){
 const node=root?.querySelector('.report-paper [data-editorial-document]');
 return node?documents.get(node.dataset.editorialDocument)||null:null;
}
export function storedText(editorial,text,language='en'){
 return language==='bg'?editorial.translations?.[text]??text:text;
}
function translated(editorial,text,tag='span',className=''){
 const bg=storedText(editorial,text,'bg');
 return `<${tag}${className?` class="${className}"`:''} data-no-translate data-kq-en="${esc(text)}" data-kq-bg="${esc(bg)}">${esc(text)}</${tag}>`;
}

// Decorative, deliberately not an ECG, laboratory image or measured chart.
export function signatureSvg(motif='cells',accent='#803E4B'){
 const color=/^#[a-f0-9]{6}$/i.test(accent)?accent:'#803E4B';
 let shapes='';
 if(motif==='cells')shapes=Array.from({length:7},(_,i)=>{const x=70+(i%3)*105,y=65+Math.floor(i/3)*92,r=23+i*3;return `<circle cx="${x}" cy="${y}" r="${r}"/><circle cx="${x-5}" cy="${y-3}" r="${r*.6}"/>`;}).join('');
 else if(motif==='branches')shapes=Array.from({length:7},(_,i)=>`<path d="M${50+i*17} 310 Q${120+i*12} 180 ${280-i*12} 20 M${120+i*12} 180 Q${75+i*14} 130 ${20+i*25} 70"/>`).join('');
 else if(motif==='layers')shapes=Array.from({length:9},(_,i)=>`<ellipse cx="${150+i*4}" cy="${110+i*14}" rx="${118-i*6}" ry="${68-i*3}" transform="rotate(-28 170 170)"/>`).join('');
 else if(motif==='bands')shapes=Array.from({length:9},(_,i)=>`<path d="M${10+i*32} 20 Q${310-i*20} 170 ${30+i*32} 310 M10 ${20+i*32} Q170 ${310-i*20} 310 ${30+i*32}"/>`).join('');
 else shapes=Array.from({length:10},(_,i)=>`<path d="M10 ${170+i*13} C90 ${60+i*12} 190 ${300-i*9} 320 ${40+i*18}"/>`).join('');
 return `<svg viewBox="0 0 340 340" fill="none" aria-hidden="true" focusable="false"><g stroke="${color}" stroke-width="1.4" opacity=".64">${shapes}</g></svg>`;
}
function sourceLinks(editorial,ids){
 const citations=new Map(editorial.citations.map((s,i)=>[s.id,{...s,index:i+1}]));
 return [...new Set(ids||[])].map(id=>{
  const source=citations.get(id),url=safeUrl(source?.url);
  return url?`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(source.label)}">[${source.index}]</a>`:'';
 }).join(' ');
}
export function renderEditorialSources(document){
 const e=document?.editorial;if(!e)return '';
 return `<section class="kq-evidence"><h2>${translated(e,C.evidence)}</h2><p>${translated(e,e.folio?.footer?L.clinicalSourcesLead:C.notice)}</p><ol>${e.citations.filter(s=>safeUrl(s.url)).map(s=>`<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${translated(e,s.label)}</a><small>${translated(e,s.kind)}</small></li>`).join('')}</ol></section>`;
}
export function renderEditorialDocument(document){
 const e=document?.editorial;if(!e||!Array.isArray(e.chapters))return '';
 const key=register(document);
 if(hasReportFolio(e))return folioNarrative(document,key);
 const accent=/^#[a-f0-9]{6}$/i.test(e.signature?.accent)?e.signature.accent:'#803E4B';
 const pale=/^#[a-f0-9]{6}$/i.test(e.signature?.pale)?e.signature.pale:'#F2E8E8';
 return `<article class="personal-report-document kq-editorial" data-editorial-document="${key}" data-report-document-version="${esc(document.version)}" data-export-scope="report" style="--kq-accent:${accent};--kq-pale:${pale}">
  <header class="kq-editorial-cover">
   <div class="kq-cover-copy"><p class="kq-kicker">${translated(e,C.report)}</p><h2>${translated(e,e.title)}</h2><p class="kq-cover-deck">${translated(e,e.deck)}</p><div class="kq-cover-meta">${translated(e,e.sample?C.sample:C.personal)}<br><span data-no-translate>${esc(e.drawDate||e.date?.slice(0,10)||'')}</span></div></div>
   <div class="kq-signature">${signatureSvg(e.signature?.motif,accent)}</div>
   <p class="kq-cover-note">${translated(e,C.notice)}</p>
  </header>
  <div class="kq-chapters">${e.chapters.map((chapter,index)=>`<section class="report-narrative-section kq-chapter" data-section-kind="${esc(chapter.kind)}" data-section-id="${esc(chapter.id)}">
   <header class="kq-chapter-heading"><span class="kq-folio" aria-hidden="true">${String(index+1).padStart(2,'0')}</span><div><h2>${translated(e,chapter.title)}</h2>${chapter.deck?translated(e,chapter.deck,'p','kq-deck'):''}</div></header>
   <div class="report-narrative-prose kq-article-grid">${chapter.blocks.map(block=>`<section class="kq-block kq-${esc(block.kind)}" data-evidence-kind="${esc(block.kind)}">${block.title?translated(e,block.title,'h3'):''}${translated(e,block.text,'p')}${block.sources?.length?`<div class="kq-citations">${sourceLinks(e,block.sources)}</div>`:''}</section>`).join('')}</div>
  </section>`).join('')}</div>
  <footer class="kq-brand-footer"><img src="/assets/kolequant-mark.webp" width="20" height="40" alt=""><strong>KoleQuant</strong><span>${translated(e,C.brand)}</span></footer>
 </article>`;
}

function clinicalReadings(e,readings){
 if(!readings.length)return '';
 return '<dl class="kq-reading-strip">'+readings.map(({label,value,unit})=>`<div><dt>${translated(e,label)}</dt><dd><strong>${translated(e,String(value))}</strong> ${translated(e,unit)}</dd></div>`).join('')+'</dl>';
}

function clinicalBlock(e,b){
 return `<section class="kq-block kq-${esc(b.kind)}">${b.title?translated(e,b.title,'h3'):''}<p>${translated(e,b.text)} ${b.sources?.length?`<sup class="kq-citations">${sourceLinks(e,b.sources)}</sup>`:''}</p></section>`;
}

function folioNarrative(document,key){
 const e=document.editorial,f=e.folio,m=e.metric;
 const family=isFamilyFolio(e);
 const {accent,cover,paper,soft}=reportFolioPalette(e);
 const familyResult=!family?'':f.coverReadings?.length?clinicalReadings(e,f.coverReadings):translated(e,f.coverMessage,'p','kq-no-age');
 const result=family?`<div class="kq-family-cover-result">${familyResult}${m.method?`<p class="kq-method-label" data-no-translate>${esc(m.method)}</p>`:''}</div>`:m.age===null?translated(e,C.notcalculated,'p','kq-no-age'):`<div class="kq-cover-metric"><div><span>${translated(e,e.title)}</span><div class="report-age-line"><strong>${esc(m.age)}</strong> ${translated(e,C.years)}</div>${translated(e,C.ageComparison,'small')}</div><dl>${m.chronologicalAge===null?'':`<dt>${translated(e,C.labage)}</dt><dd>${esc(m.chronologicalAge)} ${translated(e,C.years)}</dd>`}${m.gap===null?'':`<dt>${translated(e,C.gap)}</dt><dd>${m.gap>0?'+':''}${esc(m.gap)} ${translated(e,C.years)}</dd>`}</dl></div>`;
 const pages=f.pages.map(page=>{
  const view=reportFolioPage(e,page);
  const column=blocks=>blocks.map(b=>clinicalBlock(e,b)).join('');
  const educationContents=f.version==='assessment-folio-v2'&&page.id==='perspective'?`<nav class="kq-folio-toc">${translated(e,L.clinicalInside,'h3')}${f.pages.slice(1).map(item=>`<a href="#clinical-${esc(item.id)}">${translated(e,item.title)}</a>`).join('')}</nav>`:'';
  const contents=page.id==='perspective'&&document.resultState==='ready'&&(!family||view.columns.some(col=>col.length))?`<aside class="kq-folio-toc">${translated(e,L.clinicalInside,'h3')}${f.pages.slice(1).map(item=>`<a href="#clinical-${esc(item.id)}">${translated(e,item.title)}</a>`).join('')}</aside>`:'';
  const agenda=view.agenda?.length?`<dl class="kq-followup">${view.agenda.map(row=>`<div><dt>${translated(e,row.when)}</dt><dd><p>${translated(e,row.review)} <sup class="kq-citations">${sourceLinks(e,row.sources)}</sup></p>${translated(e,row.question,'p','kq-follow-question')}</dd></div>`).join('')}</dl>`:'';
  return `<section id="clinical-${esc(page.id)}" class="report-narrative-section kq-folio-page" data-section-id="${esc(page.id)}">
   ${translated(e,page.eyebrow,'p','kq-kicker')}${translated(e,page.title,'h2')}
   ${clinicalReadings(e,page.highlights||[])}${column(view.lead)}${educationContents}
   ${view.steps?.length?`<ol class="kq-plan-steps">${view.steps.map(step=>`<li>${clinicalBlock(e,step)}</li>`).join('')}</ol>`:''}
   ${agenda}
   ${view.columns.some(col=>col.length)||contents?`<div class="kq-folio-columns">${view.columns.map((col,i)=>col.length||i===1&&contents?`<div>${column(col)}${i===1?contents:''}</div>`:'').join('')}</div>`:''}
   ${column(view.aside)}
  </section>`;
 }).join('');
 return `<article class="personal-report-document kq-editorial kq-clinical-folio" data-editorial-document="${key}" data-report-document-version="${esc(document.version)}" data-export-scope="report" data-report-family="${esc(e.type)}" style="--kq-folio-accent:${accent};--kq-folio-cover:${cover};--kq-folio-paper:${paper};--kq-folio-soft:${soft}">
  <header class="kq-folio-cover">
   <div class="kq-folio-art">${reportFolioArt(e)}</div>
   <div class="kq-folio-mast"><span><img src="/assets/kolequant-report-mark.png" alt="" width="10" height="20"> KOLEQUANT</span>${translated(e,C.report)}</div>
   ${translated(e,family?e.title:L.clinicalFamily,'p','kq-kicker')}${translated(e,f.headline,'h2','kq-folio-title')}${translated(e,f.deck,'p','kq-folio-deck')}
   ${result}${f.urgent?clinicalBlock(e,{kind:'safety',text:C.critical}):''}
   <div class="kq-folio-meta">${translated(e,e.sample?C.sample:C.personal)}${e.drawDate?` · <time>${esc(e.drawDate)}</time>`:''}</div>
  </header>${pages}
  <footer class="kq-brand-footer"><img src="/assets/kolequant-report-mark.png" width="10" height="20" alt=""><strong>KoleQuant</strong><span>${translated(e,f.footer||L.clinicalSourcesNotice)}</span></footer>
 </article>`;
}

export function renderClinicalRecord(document){
 const e=document.editorial,{blood,collection,answers,outputs,alerts}=clinicalRecordGroups(e);
 const display=row=>{
  const value=typeof row.value==='boolean'?(row.value?'Yes':'No'):String(row.value);
  return translated(e,value)+(row.unit?' <span>'+esc(row.unit)+'</span>':'');
 };
 const pairs=rows=>`<dl>${rows.map(row=>`<div class="answer-row"><dt>${translated(e,row.label)}</dt><dd>${display(row)}</dd></div>`).join('')}</dl>`;
 const groups=[...new Set(answers.map(row=>row.group))];
 const coverage=document.coverage?.questions;
 const measured=blood.map(row=>{
  const detail=clinicalComparison(row),p=row.comparison?.provenance;
  const url=safeUrl(detail.url);
  return `<details class="blood-review-item" data-reference-status="${esc(row.comparison?.value||'unknown')}" data-reference-source="${esc(p?.sourceKind||'none')}">
   <summary><span class="blood-marker-name">${translated(e,row.label)}</span><strong class="blood-marker-value">${display(row)}</strong><span class="reference-status">${translated(e,detail.label)}</span></summary>
   <div class="blood-marker-detail">
    ${detail.range?`<p>${translated(e,C.comparison)} · ${esc(detail.range)}</p>`:''}
    ${detail.normalized?`<p class="converted-value"><span>Your value in the reference unit:</span> <strong>${esc(detail.normalized)}</strong></p>`:''}
    ${detail.assay?`<p>${translated(e,detail.assay)}</p>`:''}
    ${url?`<a class="reference-source" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(detail.source||'↗')}</a>`:''}
    ${p?.reason?translated(e,p.reason,'p'):''}
    ${row.id==='lab.crp'&&detail.assay===C.unknown||row.id==='lab.creatinine'&&p?.label==='Reference group needed'?`<button class="text-btn no-print" data-action="lab-reference-edit" data-id="${esc(row.id.slice(4))}">Review comparison ↗</button>`:''}
   </div></details>`;
 }).join('');
 return `<section class="kq-clinical-support">
  ${translated(e,L.clinicalRecordLabel,'p','kq-kicker')}${translated(e,L.clinicalRecord,'h2')}${translated(e,L.clinicalRecordDeck,'p')}
  <button class="text-btn no-print" data-action="labs">Edit entries</button>
  <div class="blood-review-list">${measured||translated(e,L.clinicalNoMeasurement,'p')}</div>
  ${alerts.map(row=>clinicalBlock(e,{kind:'safety',text:String(row.value),sources:[]})).join('')}
  ${collection.length?`<details class="report-answer-group"><summary>Collection details</summary>${pairs(collection)}</details>`:''}
  ${translated(e,L.clinicalAnswers,'h2')}
  <div class="report-data-status">${coverage?`<span>${coverage.answered} / ${coverage.total}</span>`:''}<button class="text-btn no-print" data-action="review">Edit answers</button></div>
  ${groups.map(name=>`<details class="report-answer-group"><summary>${translated(e,name)}</summary>${pairs(answers.filter(row=>row.group===name))}</details>`).join('')}
  ${outputs.length?`<details class="report-answer-group"><summary>${translated(e,L.clinicalResultPrecision)}</summary>${pairs(outputs)}</details>`:''}
  ${e.derivedFacts.length?`<details class="report-answer-group"><summary>${translated(e,C.derived)}</summary><dl>${e.derivedFacts.map(fact=>`<div class="answer-row"><dt>${translated(e,fact.label)}</dt><dd><b>${esc(fact.value)} ${esc(fact.unit)}</b><br>${translated(e,fact.formula)}</dd></div>`).join('')}</dl></details>`:''}
 </section>`;
}

export function renderClinicalMethods(document){
 const e=document.editorial;
 return `<section class="kq-clinical-support">${translated(e,L.clinicalMethodsLabel,'p','kq-kicker')}${translated(e,L.clinicalMethods,'h2')}
  ${e.methods.map(text=>translated(e,text,'p')).join('')} ${reportFolioRecord(e).blood.length?translated(e,L.clinicalBloodNote,'p'):''}${e.folio.footer?translated(e,L.clinicalReviewStatus,'p'):''}
  ${translated(e,C.version,'h3')}<p data-no-translate>${esc([document.modelVersion,document.questionnaireVersion,e.knowledgeVersion,e.evidenceVersion,e.layoutVersion].filter(Boolean).join(' · '))}</p>
  ${renderEditorialSources(document)}
 </section>`;
}

export function renderFamilyRecord(document){
 const e=document.editorial,{blood,answers,outputs,alerts}=reportFolioRecord(e);
 const lines=rows=>`<dl>${rows.map(row=>{
  const detail=clinicalComparison(row);
  const value=typeof row.value==='boolean'?(row.value?'Yes':'No'):String(row.value);
  const url=safeUrl(detail.url);
  return `<div class="answer-row"><dt>${translated(e,row.label)}</dt><dd>${translated(e,value)}${row.unit?' '+translated(e,row.unit):''}
   ${row.comparison?`<small>${translated(e,detail.label)}${detail.range?' · '+esc(detail.range):''}${url?` · <a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(detail.source||'↗')}</a>`:''}</small>`:''}</dd></div>`;
 }).join('')}</dl>`;
 const section=(title,rows)=>rows.length?`<section>${translated(e,title,'h3')}${lines(rows)}</section>`:'';
 const groups=[...new Set(answers.map(row=>row.group))];
 return `<section class="kq-clinical-support">${translated(e,C.data,'p','kq-kicker')}${translated(e,L.clinicalRecord,'h2')}
 ${translated(e,L.clinicalRecordDeck,'p')}<div class="report-record-summary"><span>Recorded result</span>${clinicalReadings(e,e.folio.coverReadings)||translated(e,e.type==='health-profile'?e.folio.coverMessage:'Estimate withheld','p')}</div>
 ${section(F.familyMeasurements,blood)}${groups.map(group=>section(group,answers.filter(row=>row.group===group))).join('')}
 ${section('Calculated model outputs',outputs)}${alerts.map(row=>clinicalBlock(e,{kind:'safety',text:String(row.value),sources:[]})).join('')}</section>`;
}
