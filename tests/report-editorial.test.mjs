import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {reportFixtures} from '../scripts/report-fixtures.mjs';
import {composeReportDocument} from '../public/report-composer.mjs';
import {reportPdfDefinition} from '../public/report-pdf.mjs';
import {renderEditorialDocument,renderEditorialSources} from '../public/report-editorial-ui.mjs';
import {initializeReportExport} from '../public/report-export.mjs';
import {nativePdfDelivery} from '../public/report-native-share.mjs';
import {KNOWLEDGE_MODULES} from '../public/report-knowledge/modules.mjs';
import {REPORT_BG} from '../public/report-knowledge/bg.mjs';
import {REPORT_EVIDENCE} from '../public/report-knowledge/sources.mjs';
import {assessClinical} from '../public/model.mjs';
const fixtures=reportFixtures();
const sample=fixtures.find(f=>f.id==='clinical-phenoage');
const chapter=(doc,id)=>doc.editorial.chapters.find(c=>c.id===id);
const prose=doc=>doc.editorial.chapters.flatMap(c=>[c.title,c.deck,...c.blocks.map(b=>b.text)]).join('\n');
function recompose(state){return composeReportDocument({state,clinical:assessClinical({age:Number(state.labAge),lab:state.lab,contextConfirmed:state.labContext,fasting:state.labFasting}),generatedAt:'2026-11-10T00:00:00.000Z'});}

test('knowledge modules have sources, bilingual copy and explicit review status',()=>{
 assert.equal(Object.keys(KNOWLEDGE_MODULES).length,18);
 for(const m of Object.values(KNOWLEDGE_MODULES)){
  assert.equal(m.reviewStatus,'clinical-review-required');
  for(const text of [m.title,m.deck,...m.blocks.flatMap(b=>[b.title,b.text])])assert.ok(REPORT_BG[text],text);
  for(const b of m.blocks){assert.ok(b.sources.length);for(const id of b.sources)assert.ok(REPORT_EVIDENCE[id],id);}
 }
});
test('all nine blood markers receive connected education, not a three-priority cap',()=>{
 const d=sample.document;
 for(const id of ['glucose','prevention','immune','crp','albumin','kidney','redcells','alp','sleep','movement','starting-plan','follow-up'])assert.ok(chapter(d,id),id);
 assert.match(prose(d),/0.32 mmol\/L after six months/);
 assert.match(prose(d),/58% relative to placebo/);
 assert.match(prose(d),/3–6 months/);
 assert.equal(d.editorial.derivedFacts.find(f=>f.id==='derived.absolute-lymphocytes').value,1.9);
 assert.match(prose(d),/not a separately measured laboratory result/);
 assert.match(prose(d),/90 moderate minutes/);
 assert.match(prose(d),/about 120 minutes/);
 assert.match(prose(d),/6.5 hours/);
});
test('impaired fasting glucose handles conventional unit boundaries independently',()=>{
 for(const [value,unit,expected] of [['100','mg/dL',true],['99','mg/dL',false],['5.6','mmol/L',true],['126','mg/dL',false],['7','mmol/L',false]]){
  const s=structuredClone(sample.state);s.lab.glucose={value,unit};
  const doc=recompose(s);assert.equal(!!chapter(doc,'prevention'),expected,value+' '+unit);
  if(['126','7'].includes(value)){assert.match(prose(doc),/timely clinical confirmation/);assert.equal(chapter(doc,'starting-plan').blocks.some(b=>b.id==='baseline-step'),false);}
 }
});
test('unknown fasting, existing diabetes and pregnancy suppress the prevention treatment pathway',()=>{
 for(const mutate of [s=>s.labFasting='Not sure',s=>s.answers.conditions=['Diabetes'],s=>s.answers.context=['Pregnant']]){
  const s=structuredClone(sample.state);mutate(s);const d=recompose(s);
  assert.equal(chapter(d,'prevention'),undefined);
  assert.doesNotMatch(prose(d),/metformin for selected/);
 }
});
test('critical results keep original alerts and suppress ordinary treatment and optimization',()=>{
 const d=fixtures.find(f=>f.id==='critical').document;
 assert.equal(d.resultState,'withheld');assert.equal(d.editorial.metric.age,null);
 assert.equal(d.editorial.chapters.length,1);
 assert.match(prose(d),/urgent medical advice/);
 assert.doesNotMatch(prose(d),/58%|metformin|Weeks 1|start.*exercise/);
});
test('activity constraints and established habits materially alter the plan',()=>{
 const restricted=structuredClone(sample.state);restricted.answers.limitations='Often';
 const doc=recompose(restricted);
 assert.match(prose(doc),/constraints or recovery status/);
 assert.equal(chapter(doc,'starting-plan').blocks.some(b=>b.id==='baseline-step'),false);
 const unknown=structuredClone(sample.state);delete unknown.answers.limitations;
 assert.match(prose(recompose(unknown)),/No individualized increase/);
 const established=fixtures.find(f=>f.id==='health-profile').document;
 assert.match(prose(established),/already reach the general starting recommendation/);
 assert.equal(chapter(established,'sleep').blocks.some(b=>b.id==='cbti'),false);
 assert.equal(chapter(established,'prevention'),undefined);
});
test('derived lymphocytes respect the WBC unit and never impute a missing percentage',()=>{
 const s=structuredClone(sample.state);s.lab.wbc={value:'7600',unit:'cells/µL'};
 assert.equal(recompose(s).editorial.derivedFacts.find(f=>f.id==='derived.absolute-lymphocytes').value,1.9);
 delete s.lab.lymphocytes;
 assert.equal(recompose(s).editorial.derivedFacts.some(f=>f.id==='derived.absolute-lymphocytes'),false);
});
test('all six families have their own content and decorative signature',()=>{
 const signatures=new Set();
 for(const id of ['clinical-phenoage','health-profile','heart-vascular','metabolic','kidney','fitness']){
  const doc=fixtures.find(f=>f.id===id).document;signatures.add(doc.editorial.signature.accent);
  assert.equal(doc.editorial.type,doc.type);
  assert.ok(doc.editorial.chapters.length>=3);
  assert.equal(doc.editorial.reviewStatus,'clinical-review-required');
  if(id!=='clinical-phenoage')assert.equal(chapter(doc,'immune'),undefined);
  if(id==='health-profile')assert.equal(doc.editorial.metric.age,null);
 }
 assert.equal(signatures.size,6);
});
test('frozen translations, sources and original values survive JSON roundtrip',()=>{
 const doc=structuredClone(sample.document),before=JSON.stringify(doc),stored=JSON.parse(before);
 assert.deepEqual(stored,doc);
 for(const c of stored.editorial.chapters)for(const b of c.blocks){assert.ok(stored.editorial.translations[b.text]);for(const id of b.sources)assert.ok(stored.editorial.citations.some(s=>s.id===id));}
 const glucose=chapter(doc,'glucose').blocks.find(b=>b.id==='your-glucose');
 assert.match(doc.editorial.translations[glucose.text],/6.2 mmol\/L/);
 assert.match(doc.editorial.translations[glucose.text],/Да/);
 assert.equal(doc.editorial.record.find(r=>r.id==='lab.glucose').value,'6.2');
 assert.ok(doc.editorial.record.find(r=>r.id==='clinical.value'));
 reportPdfDefinition(doc);reportPdfDefinition(doc,{scope:'technical',language:'bg'});
 assert.equal(JSON.stringify(doc),before);
});
test('PDF scopes are definitions of the same snapshot without copying raw answers into the narrative',()=>{
 const doc=sample.document;
 const full=JSON.stringify(reportPdfDefinition(doc));const technical=JSON.stringify(reportPdfDefinition(doc,{scope:'technical'}));
 assert.match(full,/A signal worth understanding/);assert.match(full,/estimated absolute lymphocyte count of 1.9/);
 assert.doesNotMatch(full,/Which country do you live in\?/);
 assert.match(technical,/Which country do you live in\?/);assert.match(technical,/Bulgaria/);
 assert.match(technical,/normalized WBC/);assert.match(technical,/lab.lymphocytes/);
 assert.doesNotMatch(technical,/What works—and what the evidence/);
 assert.throws(()=>reportPdfDefinition({}),/legacy/);
});
test('editorial HTML escapes prose and rejects unsafe source URLs',()=>{
 const doc=structuredClone(sample.document);doc.editorial.chapters[0].blocks[0].text='<script>bad()</script>';
 doc.editorial.citations[0].url='javascript:bad()';
 const dom=new JSDOM(renderEditorialDocument(doc)+renderEditorialSources(doc));
 assert.equal(dom.window.document.querySelectorAll('script').length,0);
 assert.equal(dom.window.document.querySelectorAll('a[href^="javascript:"]').length,0);
 assert.match(dom.window.document.body.textContent,/<script>bad\(\)<\/script>/);
 dom.window.close();
});
test('premium PDF download uses the chosen snapshot, scope and frozen language, not window.print',async()=>{
 const doc=structuredClone(sample.document);
 const dom=new JSDOM('<html lang="bg"><body><header class="report-heading"></header><article class="report-paper">'+renderEditorialDocument(doc)+'</article></body></html>',{url:'https://app.test/'});
 const definitions=[],downloads=[];let printed=false;
 dom.window.print=()=>{printed=true;};dom.window.URL.createObjectURL=()=> 'blob:fixture';dom.window.URL.revokeObjectURL=()=>{};
 dom.window.HTMLAnchorElement.prototype.click=function(){downloads.push(this.download);};
 const controller=initializeReportExport({document:dom.window.document,window:dom.window,loadEngine:async()=>({createPdf:def=>({getBlob:async()=>{definitions.push(def);return new Blob(['%PDF-fixture']);}})})});
 await controller.print('technical');
 assert.equal(printed,false);assert.equal(downloads[0],'GeneticAge-clinical-phenoage-technical-bg.pdf');
 assert.match(JSON.stringify(definitions[0]),/Данни и методи/);
 assert.equal(dom.window.document.body.hasAttribute('data-report-export'),false);
 controller.destroy();dom.window.close();
});
test('a new report or a locked rendering cannot export a previously registered snapshot',async()=>{
 const doc=structuredClone(sample.document);
 const dom=new JSDOM('<html><body><header class="report-heading"></header><article class="report-paper">'+renderEditorialDocument(doc)+'</article></body></html>',{url:'https://app.test/'});
 let release,downloaded=false;
 dom.window.URL.createObjectURL=()=>{downloaded=true;return 'blob:fixture';};
 const controller=initializeReportExport({document:dom.window.document,window:dom.window,loadEngine:()=>new Promise(resolve=>release=resolve)});
 const pending=controller.print('report');
 dom.window.document.querySelector('.report-paper').innerHTML='Locked preview';
 release({createPdf:()=>({getBlob:async()=>new Blob(['%PDF-fixture'])})});await pending;
 assert.equal(downloaded,false);controller.destroy();dom.window.close();
});
test('native PDF delivery uses a private cache, cleans old owned files and handles cancellation',async()=>{
 const calls=[];const filesystem={readdir:async()=>({files:[{name:'11111111-1111-1111-1111-111111111111-GeneticAge-report-en.pdf',mtime:1},{name:'unrelated.txt',mtime:1}]}),deleteFile:async p=>calls.push(['delete',p]),writeFile:async p=>{calls.push(['write',p]);return {uri:'file:///private/cache/fixture.pdf'};}};
 const deliver=nativePdfDelivery({filesystem,share:{share:async p=>calls.push(['share',p])},now:()=>90000000,randomId:()=> '22222222-2222-2222-2222-222222222222'});
 const result=await deliver(new Blob(['%PDF-fixture']),'GeneticAge-kidney-report-en.pdf');
 assert.equal(result.delivered,true);
 assert.equal(calls[0][1].path.endsWith('unrelated.txt'),false);
 assert.equal(calls.find(c=>c[0]==='write')[1].directory,'CACHE');
 assert.deepEqual(calls.find(c=>c[0]==='share')[1].files,['file:///private/cache/fixture.pdf']);
 const cancel=nativePdfDelivery({filesystem,share:{share:async()=>{throw Error('User cancelled');}},randomId:()=> '22222222-2222-2222-2222-222222222222'});
 assert.equal((await cancel(new Blob(['%PDF-fixture']),'GeneticAge-kidney-report-en.pdf')).cancelled,true);
 await assert.rejects(()=>deliver(new Blob(['invalid']),'GeneticAge-report-en.pdf'),/Invalid PDF/);
 await assert.rejects(()=>deliver(new Blob(['%PDF-fixture']),'../../private.pdf'),/filename/);
});

test('clinical editions change the lead, sections and agenda with the recorded inputs',()=>{
 const reference=sample.document;
 const second=structuredClone(sample.state);
 second.lab.glucose.value='4.9';
 Object.assign(second.answers,{moderate:'180',strength:'2',sleep:'8',rested:'Usually'});
 const changed=recompose(second);
 assert.match(reference.editorial.folio.pages[0].title,/clarifying your glucose/);
 assert.equal(reference.editorial.record.find(row=>row.id==='lab.crp').assay,null);
 assert.equal(reference.editorial.folio.pages.find(page=>page.id==='follow-up').agenda[0].when,'Initial discussion');
 assert.match(changed.editorial.folio.pages[0].title,/routine you already have/);
 assert.equal(changed.editorial.folio.pages.some(page=>page.id==='prevention'),false);
 assert.equal(chapter(changed,'starting-plan').blocks.some(block=>block.id==='baseline-step'),false);
 assert.equal(changed.editorial.folio.pages.find(page=>page.id==='follow-up').agenda.some(row=>row.when==='About two weeks'),false);
 const legacy=structuredClone(reference);
 delete legacy.editorial.folio;
 legacy.editorial.layoutVersion='editorial-2026-11-10';
 assert.doesNotMatch(renderEditorialDocument(legacy),/kq-clinical-folio/);
 assert.doesNotMatch(JSON.stringify(reportPdfDefinition(legacy)),/Your blood results, in perspective/);
});
