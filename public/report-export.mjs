import {deliverReportPdf} from './report-download.mjs';
import {currentEditorialDocument} from './report-editorial-ui.mjs';
import {reportPdfDefinition} from './report-pdf.mjs';
import {EDITORIAL_COPY as C} from './report-knowledge/copy.mjs';
// The reading view and its supporting record are separate print documents.
// Browser-menu printing uses the personal report unless an export button chose
// the technical record. Restore the screen's disclosure state after either.
export function initializeReportExport({document=globalThis.document,window=globalThis.window,loadEngine}={}){
 let busy=false;
 let disposed=false;
 const engine=loadEngine||(()=>{
  const url=new URL('./assets/report-pdf-runtime.js',document.baseURI).href;
  return import(/* @vite-ignore */ url);
 });
 function status(text,error=false){
  let node=document.querySelector('.kq-pdf-status');
  if(!node){node=document.createElement('p');node.className='kq-pdf-status no-print';node.setAttribute('role','status');document.querySelector('.report-heading')?.append(node);}
  node.textContent=text;
  node.toggleAttribute('data-error',error);
 }
 async function download(snapshot,scope){
  if(busy)return;
  busy=true;
  const language=document.documentElement.lang==='bg'?'bg':'en';
  const t=text=>language==='bg'?snapshot.editorial.translations[text]||text:text;
  status(t(C.downloadBusy));
  try{
   const runtime=await engine();
   const blob=await runtime.createPdf(reportPdfDefinition(snapshot,{scope,language,logo:runtime.logo})).getBlob();
   if(disposed||currentEditorialDocument(document)!==snapshot)return;
   const delivered=await deliverReportPdf(blob,'GeneticAge-'+snapshot.type+'-'+scope+'-'+language+'.pdf',{window,document});
   if(delivered?.cancelled){status('');return;}
   status(t(C.downloadReady));
  }catch{if(!disposed&&currentEditorialDocument(document)===snapshot)status(t(C.downloadError),true);}
  finally{busy=false;}
 }
 let active=null;
 function restore(){
  if(!active)return;
  for(const [element,open]of active.details)element.open=open;
  if(active.scope===undefined)delete document.body.dataset.reportExport;
  else document.body.dataset.reportExport=active.scope;
  active=null;
 }
 function prepare(scope='report'){
  if(active||!document.querySelector('.report-paper'))return;
  const selected=scope==='technical'?'technical':'report';
  const details=[...document.querySelectorAll('.report-paper details')];
  active={scope:document.body.dataset.reportExport,details:details.map(element=>[element,element.open]),printing:false};
  document.body.dataset.reportExport=selected;
  for(const element of details){
   const owner=element.closest('[data-export-scope]')?.dataset.exportScope||'report';
   if(owner===selected)element.open=true;
  }
 }
 const beforePrint=()=>{prepare();if(active)active.printing=true;};
 window.addEventListener('beforeprint',beforePrint);
 window.addEventListener('afterprint',restore);
 return {
  print(scope='report'){
   const snapshot=currentEditorialDocument(document);
   if(snapshot){return download(snapshot,scope==='technical'?'technical':'report');}
   restore();prepare(scope);
   try{window.print();}catch(error){restore();throw error;}
   // A managed browser can silently ignore print(). Once loading is complete,
   // a call that never reached beforeprint must not leave its scope selected.
   // While loading, keep the request for the browser's deferred printing steps.
   if(active&&!active.printing&&document.readyState==='complete')restore();
  },
  destroy(){
   disposed=true;restore();
   window.removeEventListener('beforeprint',beforePrint);
   window.removeEventListener('afterprint',restore);
  }
 };
}
