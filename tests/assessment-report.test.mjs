import assert from 'node:assert/strict';
import {test} from 'node:test';
import {JSDOM} from 'jsdom';
import {renderAssessmentReport} from '../public/report-ui.mjs';
import {renderReportDocument} from '../public/report-document-ui.mjs';
import {freshAssessment,profileProgress} from '../public/assessment-flow.mjs';
import {sampleAnswers,sampleLabs,assessClinical} from '../public/model.mjs';
import {translateText} from '../public/language-system.mjs';

const state={...freshAssessment(),answers:structuredClone(sampleAnswers),lab:sampleLabs(),labAge:'45',labDate:'2026-11-01',labFasting:'Yes',labContext:true,labReferenceGroup:'male',labSubmitted:true,reportTab:'summary'};
state.lab.crp.assay='standard-crp';state.lab.albumin.referenceLow='35';state.lab.albumin.referenceHigh='50';
const clinical=assessClinical({age:45,lab:state.lab,contextConfirmed:true,fasting:'Yes'});
const render=(s=state,options={})=>new JSDOM(renderAssessmentReport({state:s,clinical,full:true,reviewing:true,pagesPreview:true,...options})).window.document;

test('the narrative, original data and methods have separate destinations and export scopes',()=>{
 const doc=render(),report=doc.querySelector('[data-report-panel="summary"]'),data=doc.querySelector('[data-report-panel="data"]'),methods=doc.querySelector('[data-report-panel="details"]');
 assert.deepEqual([...doc.querySelectorAll('.report-tabs button')].map(el=>el.textContent),['Your report','Your data','Method & evidence']);
 assert.equal(doc.querySelector('#report-chapter'),null);assert.equal(doc.querySelectorAll('.report-panel:not([hidden])').length,1);
 assert.equal(report.dataset.exportScope,'report');assert.equal(data.dataset.exportScope,'technical');assert.equal(methods.dataset.exportScope,'technical');
 assert.equal(report.querySelector('.report-age-line strong').textContent,String(Math.round(clinical.value)));
 assert.ok(report.querySelector('.personal-report-document'));
 assert.ok(report.querySelectorAll('.report-narrative-section').length>1);
 assert.equal(report.querySelectorAll('.answer-row,.blood-review-item').length,0,'The interpretation must not contain the input transcript.');
 assert.equal(methods.querySelectorAll('.blood-review-item').length,0);
 const answers=[...data.querySelectorAll('.answer-row')];
 assert.ok(answers.some(el=>el.querySelector('dt').textContent==='How old are you?'&&el.querySelector('dd').textContent==='45 years'));
 assert.ok(answers.some(el=>el.querySelector('dd').textContent==='Bulgaria'));
 assert.equal(data.querySelectorAll('.blood-review-item').length,9);
 assert.equal(data.querySelectorAll('[data-reference-source="lab"]').length,1);
 assert.equal(data.querySelectorAll('[data-reference-source="published"]').length,8);
 assert.equal(doc.querySelector('.report-tools [data-action="save"]'),null,'A static preview cannot cloud-save.');
 assert.deepEqual([...doc.querySelectorAll('[data-action="print"]')].map(el=>el.dataset.export),['report','technical']);
 assert.match(data.textContent,/Your value in the reference unit:/);assert.match(data.textContent,/111\.7 mg\/dL/);
 assert.ok(data.querySelector('a[href$="#page=5"]'));
 assert.match(methods.textContent,/Laboratory reference intervals provide separate context; they do not change the formula/);
 const counts=profileProgress(state.answers);
 assert.match(data.querySelector('.report-data-status').textContent,new RegExp(`${counts.answered} / ${counts.total}`));
});

test('legacy navigation maps to the new narrative and data destinations',()=>{
 for(const [oldTab,newTab] of [['findings','summary'],['blood','data']]){
  const doc=render({...state,reportTab:oldTab});
  assert.equal(doc.querySelector('.report-panel:not([hidden])').dataset.reportPanel,newTab);
  assert.equal(doc.querySelector('.report-tabs [aria-current="page"]').dataset.tab,newTab);
 }
});

test('a converted value near a guide boundary cannot round into an apparently contradictory flag',()=>{
 const boundary=structuredClone(state);boundary.lab.glucose.value=String(99.0001/18.0182);
 const doc=render(boundary),item=doc.querySelectorAll('.blood-review-item')[2];
 assert.equal(item.dataset.referenceStatus,'above');assert.equal(item.querySelector('.converted-value strong').textContent,'99.0001 mg/dL');
});

test('old snapshots preserve their stored findings and do not receive new composed interpretation',()=>{
 const old={...state,savedReport:{priorities:[{key:'stored',name:'Original saved topic',text:'Original stored interpretation.',action:'Original stored next step.',sources:[]}],version:'educational-report-v1'}};
 const before=structuredClone(old),doc=render(old);
 assert.equal(doc.querySelectorAll('.personal-report-document').length,0);
 assert.equal(doc.querySelectorAll('.finding-card').length,1);
 assert.match(doc.querySelector('[data-report-panel="summary"]').textContent,/Original stored interpretation/);
 assert.match(doc.querySelector('[data-report-panel="summary"]').textContent,/Original stored next step/);
 assert.match(doc.body.textContent,/stored result has not been recalculated/);
 assert.deepEqual(old,before,'Rendering must not rewrite an immutable snapshot.');
 const saved=render({...state,savedReport:{priorities:[],version:'educational-report-v1'}});
 assert.equal(saved.querySelectorAll('.finding-card').length,0);assert.match(saved.body.textContent,/No findings were stored/);
 const withheld=render(state,{clinical:{reason:'Fictional collection review reason'}});
 assert.equal(withheld.querySelector('.report-age-line'),null);assert.match(withheld.body.textContent,/Fictional collection review reason/);
});

test('new saved documents are authoritative even when inputs would select different current priorities',()=>{
 const savedDocument={version:'personal-report-v1',type:'profile',sourceIds:[],sections:[{id:'saved-intro',kind:'intro',title:'Saved assessment perspective',paragraphs:['The saved narrative stays unchanged.'],sources:[],factIds:[]}],coverage:{questions:{answered:1,total:10,groups:[]}}};
 const saved={...state,savedReport:{document:savedDocument,priorities:[{name:'Do not render this alternate legacy list',text:'Not the authoritative prose.',sources:[]}]}};
 const before=structuredClone(saved),doc=render(saved),report=doc.querySelector('[data-report-panel="summary"]');
 assert.equal(report.querySelectorAll('.report-narrative-section').length,1);
 assert.match(report.textContent,/The saved narrative stays unchanged/);
 assert.doesNotMatch(report.textContent,/Do not render this alternate legacy list|Not the authoritative prose/);
 assert.deepEqual(saved,before);
});

test('server preview gates composed text, next steps, detailed answers and blood comparisons out of the DOM',()=>{
 const saved={...state,savedReport:{document:{version:'personal-report-v1',sections:[{id:'secret',kind:'plan',title:'Premium private chapter',paragraphs:['Premium content must not be in preview DOM.'],sources:[]}]},priorities:[{name:'Allowed original preview',text:'One permitted insight.',action:'Premium next step must not be in preview DOM.',sources:[]},{name:'Second hidden finding',text:'Second hidden interpretation.',sources:[]}]}};
 const doc=render(saved,{full:false,reviewing:false,pagesPreview:false});
 assert.equal(doc.querySelectorAll('.finding-card').length,1);assert.equal(doc.querySelectorAll('.answer-row dt').length,4,'Collection metadata remains visible, not the full questionnaire.');
 assert.equal(doc.querySelectorAll('.blood-review-item').length,0);assert.equal(doc.querySelectorAll('.personal-report-document').length,0);
 assert.equal(doc.querySelector('[data-action="print"]'),null);
 assert.match(doc.body.textContent,/One permitted insight/);
 assert.doesNotMatch(doc.body.textContent,/Premium private chapter|Premium content|Premium next step|Second hidden/);
 assert.ok(doc.querySelector('[data-action="save"]'));assert.ok(doc.querySelector('[data-action="checkout"]'));
});

test('the shared renderer escapes recorded prose and numbers only the selected priority sections',()=>{
 const sections=[{id:'intro',kind:'intro',title:'<script>unsafe()</script>',paragraphs:['<img src=x onerror=unsafe()>'],sources:[]},{id:'one',kind:'priority',title:'First priority',paragraphs:['First paragraph.'],sources:['activity']},{id:'maintain',kind:'strength',title:'Maintain',paragraphs:['Existing baseline.'],sources:[]},{id:'two',kind:'priority',title:'Second priority',paragraphs:['Second paragraph.'],sources:[]}];
 const sourceCalls=[],doc=new JSDOM(renderReportDocument({version:'personal-report-v1',sections},{sourceLinks:ids=>{sourceCalls.push(ids);return '<span>Source link</span>';}})).window.document;
 assert.equal(doc.querySelectorAll('script,img').length,0);assert.match(doc.body.textContent,/<script>unsafe\(\)<\/script>/);
 assert.deepEqual([...doc.querySelectorAll('.report-priority-number')].map(el=>el.textContent),['01','02']);
 assert.deepEqual(sourceCalls,[['activity']]);
 assert.equal(doc.querySelector('.personal-report-document').dataset.exportScope,'report');
});

test('stored evidence labels and URLs remain authoritative when the live catalogue changes',()=>{
 const document={version:'personal-report-v1',citations:[{id:'activity',label:'Original guidance label',url:'https://archive.example.test/guidance?edition=1&language=en'}],sections:[{id:'movement',kind:'priority',title:'Movement',paragraphs:['Stored interpretation.'],sources:['activity','new-live-source']}]};
 const before=structuredClone(document),liveCalls=[];
 const doc=new JSDOM(renderReportDocument(document,{sourceLinks:ids=>{liveCalls.push(ids);return '<a href="https://live.example.test/replacement">Replacement label</a>';}})).window.document;
 const links=[...doc.querySelectorAll('.report-narrative-sources a')];
 assert.equal(links.length,1);
 assert.equal(links[0].getAttribute('href'),'https://archive.example.test/guidance?edition=1&language=en');
 assert.equal(links[0].textContent,'Original guidance label ↗');
 assert.deepEqual(liveCalls,[],'A frozen edition must not consult current source metadata.');
 assert.doesNotMatch(doc.body.textContent,/Replacement label|new-live-source/);
 assert.deepEqual(document,before);
});

test('an explicitly empty citation record never falls back to current evidence',()=>{
 for(const citations of [[],null,{}]){
  const document={citations,sections:[{id:'context',kind:'context',title:'Context',paragraphs:['Stored context.'],sources:['activity']}]};
  const doc=new JSDOM(renderReportDocument(document,{sourceLinks:()=>{assert.fail('Present citation records cannot use the live fallback.');}})).window.document;
  assert.equal(doc.querySelectorAll('.report-narrative-sources a').length,0);
 }
});

test('frozen citations reject unsafe or relative destinations and escape labels and URL attributes',()=>{
 const citations=[
  {id:'javascript',label:'Script destination',url:'javascript:alert(1)'},
  {id:'data',label:'Data destination',url:'data:text/html,<script>alert(1)</script>'},
  {id:'relative',label:'Relative destination',url:'/guidance'},
  {id:'protocol-relative',label:'Protocol-relative destination',url:'//example.test/guidance'},
  {id:'file',label:'Local file destination',url:'file:///private/record'},
  {id:'secure',label:'<img src=x onerror=unsafe()>',url:'https://example.test/source?label="quoted"&edition=1'},
  {id:'http',label:'Archived source',url:'http://archive.example.test/source'},
 ];
 const document={citations,sections:[{id:'context',kind:'context',title:'Context',paragraphs:['Stored context.'],sources:citations.map(citation=>citation.id)}]};
 const doc=new JSDOM(renderReportDocument(document,{sourceLinks:()=>assert.fail('Unsafe frozen links cannot be replaced from the live catalogue.')})).window.document;
 const links=[...doc.querySelectorAll('.report-narrative-sources a')];
 assert.equal(links.length,2);
 assert.deepEqual(links.map(link=>new URL(link.href).protocol),['https:','http:']);
 assert.equal(links[0].getAttribute('href'),citations[5].url);
 assert.equal(links[0].textContent,'<img src=x onerror=unsafe()> ↗');
 assert.equal(doc.querySelectorAll('img,script,[onerror]').length,0);
 for(const link of links)assert.equal(link.getAttribute('rel'),'noopener noreferrer');
});

test('the report translates its explanations and statuses without translating measurement units',()=>{
 const doc=render();
 const walker=doc.createTreeWalker(doc.body,4),sources=[];let node;
 while(node=walker.nextNode())if(!node.parentElement.closest('svg,[data-no-translate]'))sources.push(node.nodeValue.trim());
 for(const source of sources.filter(source=>/[A-Za-z]/.test(source))){
  const translated=translateText(source,'bg');
  assert.doesNotMatch(translated,/\b(?:Your|Published|Holding|reference|measurement|report|Outside|clinical|formula|guide|result|These|The|This|Collection|Illustrative|personal|assessment|Not)\b/,'Untranslated report copy: '+source);
 }
 assert.equal(translateText('mmol/L','bg'),'mmol/L');
});
