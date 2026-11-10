import {renderEditorialDocument} from './report-editorial-ui.mjs';
import {escapeHTML as esc} from './ui-components.mjs';

const sectionKinds=new Set(['intro','priority','strength','context','plan']);

function citationUrl(value){
 if(typeof value!=='string')return null;
 try{
  const url=new URL(value);
  return ['https:','http:'].includes(url.protocol)?value:null;
 }catch{return null;}
}

// New editions freeze their evidence labels and destinations with the narrative.
// An explicit empty/malformed list must not acquire today's catalogue entries.
export function renderReportSources(document,ids,{sourceLinks=()=>''}={}){
 if(!Object.hasOwn(document||{},'citations'))return sourceLinks(ids);
 const citations=new Map();
 for(const citation of Array.isArray(document.citations)?document.citations:[]){
  if(citation&&typeof citation.id==='string'&&typeof citation.label==='string'&&citation.label.trim()&&citationUrl(citation.url)&&!citations.has(citation.id))citations.set(citation.id,citation);
 }
 const selected=[...new Set(Array.isArray(ids)?ids:[])].map(id=>citations.get(id)).filter(Boolean);
 return selected.length?`<ul class="source-list">${selected.map(citation=>`<li><a href="${esc(citation.url)}" target="_blank" rel="noopener noreferrer">${esc(citation.label)} ↗</a></li>`).join('')}</ul>`:'';
}

// Presentation only: saved prose is rendered verbatim, never recomposed here.
export function renderReportDocument(document,{sourceLinks=()=>''}={}){
 if(document?.editorial?.version==='personal-science-v2')return renderEditorialDocument(document);
 if(!Array.isArray(document?.sections))return '';
 let priorityNumber=0;
 const sections=document.sections.filter(section=>section&&typeof section==='object').map(section=>{
  const kind=sectionKinds.has(section.kind)?section.kind:'context';
  const paragraphs=(Array.isArray(section.paragraphs)?section.paragraphs:[]).filter(paragraph=>typeof paragraph==='string'&&paragraph.trim());
  if(!paragraphs.length&&!section.title)return '';
  const sources=(Array.isArray(section.sources)?section.sources:[]).filter(source=>typeof source==='string');
  const factIds=(Array.isArray(section.factIds)?section.factIds:[]).filter(id=>typeof id==='string');
  const number=kind==='priority'?String(++priorityNumber).padStart(2,'0'):null;
  return `<section class="report-narrative-section" data-section-kind="${kind}" data-section-id="${esc(section.id||'')}"${factIds.length?` data-fact-ids="${esc(factIds.join(' '))}"`:''}>
   <header class="report-narrative-heading">${number?`<span class="report-priority-number" aria-hidden="true">${number}</span>`:''}<h2>${esc(section.title||'')}</h2></header>
   <div class="report-narrative-prose">${paragraphs.map(paragraph=>`<p>${esc(paragraph)}</p>`).join('')}</div>
   ${sources.length?`<div class="report-narrative-sources">${renderReportSources(document,sources,{sourceLinks})}</div>`:''}
  </section>`;
 }).join('');
 return `<article class="personal-report-document" data-report-document-version="${esc(document.version||'')}" data-export-scope="report">${sections}</article>`;
}
