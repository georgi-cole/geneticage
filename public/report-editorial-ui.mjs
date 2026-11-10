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
 return `<section class="kq-evidence"><h2>${translated(e,C.evidence)}</h2><p>${translated(e,C.notice)}</p><ol>${e.citations.filter(s=>safeUrl(s.url)).map(s=>`<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${translated(e,s.label)}</a><small>${translated(e,s.kind)}</small></li>`).join('')}</ol></section>`;
}
export function renderEditorialDocument(document){
 const e=document?.editorial;if(!e||!Array.isArray(e.chapters))return '';
 const key=register(document),accent=/^#[a-f0-9]{6}$/i.test(e.signature?.accent)?e.signature.accent:'#803E4B';
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
