// The reading view and its supporting record are separate print documents.
// Browser-menu printing uses the personal report unless an export button chose
// the technical record. Restore the screen's disclosure state after either.
export function initializeReportExport({document=globalThis.document,window=globalThis.window}={}){
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
   restore();prepare(scope);
   try{window.print();}catch(error){restore();throw error;}
   // A managed browser can silently ignore print(). Once loading is complete,
   // a call that never reached beforeprint must not leave its scope selected.
   // While loading, keep the request for the browser's deferred printing steps.
   if(active&&!active.printing&&document.readyState==='complete')restore();
  },
  destroy(){
   restore();
   window.removeEventListener('beforeprint',beforePrint);
   window.removeEventListener('afterprint',restore);
  }
 };
}
