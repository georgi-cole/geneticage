import assert from 'node:assert/strict';
import {test} from 'node:test';
import {JSDOM} from 'jsdom';
import {initializeReportExport} from '../public/report-export.mjs';

function fixture(){
 const dom=new JSDOM('<body><article class="report-paper"><section data-export-scope="report"><details id="report"><summary>Interpretation</summary>Personal report</details></section><section data-export-scope="technical" hidden><details id="data"><summary>Recorded data</summary>Private measurements</details><details id="method" open><summary>Evidence</summary>Method</details></section></article></body>');
 const {document}=dom.window;
 const controller=initializeReportExport({document,window:dom.window});
 return {dom,document,controller};
}

test('each PDF selects only its own disclosure scope and restores the reading state',()=>{
 const {dom,document,controller}=fixture();
 const details=[...document.querySelectorAll('details')];
 const before=details.map(element=>element.open);
 for(const scope of ['report','technical']){
  let calls=0;
  dom.window.print=()=>{
   calls++;
   dom.window.dispatchEvent(new dom.window.Event('beforeprint'));
   assert.equal(document.body.dataset.reportExport,scope,'Browser beforeprint preserves the chosen export.');
   assert.equal(document.getElementById('report').open,scope==='report');
   assert.equal(document.getElementById('data').open,scope==='technical');
   assert.equal(document.getElementById('method').open,true);
  };
  controller.print(scope);
  assert.equal(calls,1);
  dom.window.dispatchEvent(new dom.window.Event('afterprint'));
  assert.equal(document.body.hasAttribute('data-report-export'),false);
  assert.deepEqual(details.map(element=>element.open),before);
  assert.equal(document.querySelector('[data-export-scope="technical"]').hidden,true,'Export never changes the selected reading tab.');
 }
 controller.destroy();dom.window.close();
});

test('browser-menu printing defaults to the personal report after a technical export',()=>{
 const {dom,document,controller}=fixture();
 dom.window.print=()=>{};
 controller.print('technical');
 dom.window.dispatchEvent(new dom.window.Event('afterprint'));
 dom.window.dispatchEvent(new dom.window.Event('beforeprint'));
 assert.equal(document.body.dataset.reportExport,'report');
 assert.equal(document.getElementById('data').open,false);
 dom.window.dispatchEvent(new dom.window.Event('afterprint'));
 assert.equal(document.body.hasAttribute('data-report-export'),false);
 assert.equal(document.getElementById('report').open,false);
 controller.destroy();dom.window.close();
});

test('a failed print call restores the screen and does not leave a technical export selected',()=>{
 const {dom,document,controller}=fixture();
 dom.window.print=()=>{throw Error('Print unavailable');};
 assert.throws(()=>controller.print('technical'),/Print unavailable/);
 assert.equal(document.body.hasAttribute('data-report-export'),false);
 assert.equal(document.getElementById('data').open,false);
 assert.equal(document.getElementById('method').open,true);
 controller.destroy();dom.window.close();
});

test('a browser that silently ignores printing leaves no export scope or expanded data behind',async()=>{
 const {dom,document,controller}=fixture();
 if(document.readyState!=='complete')await new Promise(resolve=>dom.window.addEventListener('load',resolve,{once:true}));
 dom.window.print=()=>{};
 controller.print('technical');
 assert.equal(document.body.hasAttribute('data-report-export'),false);
 assert.equal(document.getElementById('data').open,false);
 assert.equal(document.getElementById('method').open,true);
 dom.window.dispatchEvent(new dom.window.Event('beforeprint'));
 assert.equal(document.body.dataset.reportExport,'report','A later browser-menu print starts with the personal report.');
 controller.destroy();dom.window.close();
});
