import {BG as BASE_BG} from './locales/bg.mjs';
import {REPORT_BG} from './report-knowledge/bg.mjs';
const BG=Object.freeze({...BASE_BG,...REPORT_BG});

export const LANGUAGE_KEY='kq-language-v1';
export const languageBootstrap="(()=>{let v='en';try{v=localStorage.getItem('kq-language-v1')||'en'}catch{}v=v==='bg'?'bg':'en';document.documentElement.lang=v;document.documentElement.dataset.language=v})()";
const normalize=text=>text.replace(/\s+/g,' ').trim();
const escapePattern=value=>value.replace(/[.*+?^{}$()|[\]\\]/g,'\\$&');
const phrases=Object.keys(BG).sort((a,b)=>b.length-a.length);
const phrasePattern=new RegExp('(?<![\\p{L}\\p{N}])(?:'+phrases.map(escapePattern).join('|')+')(?![\\p{L}\\p{N}])','gu');
// Composed report sentences retain canonical English in saved snapshots. Match
// only complete, curated templates so changing language never changes a number,
// unit, model identifier or other interpolated fact.
const placeholder=/\{([A-Za-z][A-Za-z0-9_]*)\}/g;
const translationTemplates=phrases.filter(key=>/\{[A-Za-z][A-Za-z0-9_]*\}/.test(key)).map(key=>{
 const names=[];
 const parts=[];
 let offset=0;
 for(const match of key.matchAll(placeholder)){
  parts.push(escapePattern(key.slice(offset,match.index)),'(.+?)');
  names.push(match[1]);offset=match.index+match[0].length;
 }
 parts.push(escapePattern(key.slice(offset)));
 return {pattern:new RegExp('^'+parts.join('')+'$','u'),names,text:BG[key]};
});
function translateTemplate(source){
 for(const template of translationTemplates){
  const match=template.pattern.exec(source);
  if(!match)continue;
  const values=new Map();
  let consistent=true;
  template.names.forEach((name,index)=>{
   if(values.has(name)&&values.get(name)!==match[index+1])consistent=false;
   values.set(name,match[index+1]);
  });
  if(consistent)return template.text.replace(placeholder,(_,name)=>values.get(name)??'{'+name+'}');
 }
}

export function translateText(text,language='en',{protectedPrefix=''}={}){
 if(protectedPrefix&&text.startsWith(protectedPrefix))return protectedPrefix+translateText(text.slice(protectedPrefix.length),language);
 if(language!=='bg'||!text||!/[A-Za-z]/.test(text))return text;
 const source=normalize(text);
 let translated=BG[source]??translateTemplate(source);
 if(translated===undefined){
  const match=source.match(/^(\d+) saved (assessment|report)s?$/);
  const dated=source.match(/^(\d+) dated (record|records)$/);
  if(match)translated=match[1]+(Number(match[1])===1?' запазен ':' запазени ')+(match[2]==='report'?(Number(match[1])===1?'доклад':'доклада'):(Number(match[1])===1?'анализ':'анализа'));
  else if(dated)translated=dated[1]+(Number(dated[1])===1?' запис с дата':' записа с дата');
  else translated=source.replace(phrasePattern,phrase=>BG[phrase]);
 }
 return (text.match(/^\s*/)?.[0]||'')+translated+(text.match(/\s*$/)?.[0]||'');
}

export function initializeLanguage(){
 let language=document.documentElement.dataset.language==='bg'?'bg':'en',queued=false;
 const originals=new WeakMap(),attributes=new WeakMap(),nativeErrors=new Set();
 const ignored='script,style,svg,textarea,input,[data-no-translate],[data-kq-en]';
 function textNode(node){
  const parent=node.parentElement;
  if(!parent||parent.closest(ignored+',.brand,[data-count-to]')||!node.nodeValue?.trim())return;
  if(parent.tagName==='OPTION'&&!parent.hasAttribute('value'))parent.setAttribute('value',parent.value);
  let record=originals.get(node);
  if(!record||node.nodeValue!==record.rendered)record={source:node.nodeValue};
  const rendered=language==='bg'&&parent.closest('.instrument-comparison small')&&record.source==='years'?'г.':translateText(record.source,language,{protectedPrefix:parent.dataset.userPrefix||''});
  if(node.nodeValue!==rendered)node.nodeValue=rendered;
  record.rendered=rendered;originals.set(node,record);
 }
 function refresh(){
  document.querySelectorAll('[data-kq-en]').forEach(element=>{
   const text=language==='bg'?element.dataset.kqBg||element.dataset.kqEn:element.dataset.kqEn;
   if(element.textContent!==text)element.textContent=text;
  });
  const walker=document.createTreeWalker(document.documentElement,NodeFilter.SHOW_TEXT);
  let node;while(node=walker.nextNode())textNode(node);
  document.querySelectorAll('[aria-label],[title],[placeholder]').forEach(element=>{
   if(element.closest('script,style,svg,[data-no-translate]'))return;
   let records=attributes.get(element)||{};
   for(const name of ['aria-label','title','placeholder']){
    const current=element.getAttribute(name);if(current===null)continue;
    let record=records[name];if(!record||current!==record.rendered)record={source:current};
    const rendered=translateText(record.source,language);
    if(current!==rendered)element.setAttribute(name,rendered);
    record.rendered=rendered;records[name]=record;
   }
   attributes.set(element,records);
  });
  const button=document.getElementById('language-toggle');
  if(button){button.textContent=language==='bg'?'БГ':'EN';button.setAttribute('aria-label',language==='bg'?'Превключете на английски':'Switch to Bulgarian');button.title=language==='bg'?'English':'Български';}
 }
 function setLanguage(next,{persist=true}={}){
  language=next==='bg'?'bg':'en';
  document.documentElement.lang=language;document.documentElement.dataset.language=language;
  nativeErrors.forEach(field=>field.setCustomValidity(''));nativeErrors.clear();
  if(persist)try{localStorage.setItem(LANGUAGE_KEY,language);}catch{}
  refresh();window.dispatchEvent(new CustomEvent('kq:language-change',{detail:{language}}));
 }
 document.addEventListener('click',event=>{if(event.target.closest('#language-toggle'))setLanguage(language==='en'?'bg':'en');});
 window.addEventListener('storage',event=>{if(event.key===LANGUAGE_KEY)setLanguage(event.newValue,{persist:false});});
 const observer=new MutationObserver(records=>{
  if(!records.some(record=>{const node=record.target.nodeType===1?record.target:record.target.parentElement;return !node?.closest('[data-count-to],script,style,svg,[data-no-translate]');}))return;
  if(!queued){queued=true;queueMicrotask(()=>{queued=false;refresh();});}
 });
 observer.observe(document.documentElement,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['aria-label','title','placeholder']});
 // Translate native feedback only on an explicit validation attempt.
 // Typing/language changes never validate; consultation keeps inline errors.
 document.addEventListener('invalid',event=>{
  const field=event.target;
  if(language!=='bg'||field.closest('#consult-form')||field.validity.customError)return;
  const v=field.validity;
  const message=v.valueMissing?'Попълнете това поле.':v.typeMismatch?'Въведете валидна стойност.':v.rangeUnderflow?'Стойността е под допустимия минимум.':v.rangeOverflow?'Стойността е над допустимия максимум.':v.stepMismatch?'Проверете допустимата стъпка на стойността.':'Проверете въведената стойност.';
  field.setCustomValidity(message);nativeErrors.add(field);
 },true);
 document.addEventListener('input',event=>{if(nativeErrors.has(event.target)){event.target.setCustomValidity('');nativeErrors.delete(event.target);}});
 setLanguage(language,{persist:false});
 return {refresh,setLanguage,get language(){return language;}};
}
