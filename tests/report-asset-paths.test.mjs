import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {b64,seal,unseal} from '../lib/record-encryption.mjs';
import {test} from 'node:test';
import {relativeAssets} from '../scripts/build-pages.mjs';
import {reportFixtures} from '../scripts/report-fixtures.mjs';
import {reportPdfDefinition} from '../public/report-pdf.mjs';

test('publication rewrites root assets without corrupting relative PDF imports',()=>{
 assert.equal(relativeAssets('"/assets/mark.png"'), '"./assets/mark.png"');
 assert.equal(relativeAssets('url(/assets/mark.png)'), 'url(./assets/mark.png)');
 for(const value of ['./assets/report-pdf-runtime.js','../assets/mark.png','https://example.test/assets/mark.png','assets/mark.png'])assert.equal(relativeAssets(value),value);
 assert.equal(relativeAssets('new URL("./assets/report-pdf-runtime.js", document.baseURI)'), 'new URL("./assets/report-pdf-runtime.js", document.baseURI)');
});

test('technical exports do not invent undefined reference bounds',()=>{
 const fixture=reportFixtures()[0];
 for(const fact of fixture.document.facts){if(fact.provenance){delete fact.provenance.low;delete fact.provenance.high;}}
 const definition=reportPdfDefinition(fixture.document,{scope:'technical'});
 assert.doesNotMatch(JSON.stringify(definition), /undefined/);
});

test('large bilingual reports retain the exact authenticated encryption format',async()=>{
 for(const length of [0,32767,32768,32769,200000]){
  const bytes=randomBytes(length);assert.equal(b64(bytes),bytes.toString('base64'));
 }
 const env={ASSESSMENT_ENCRYPTION_KEY:randomBytes(32).toString('base64')};
 const value={text:'Български / English · 6.2 mmol/L. '.repeat(20000)};
 const encrypted=await seal(env,'fictional-owner','report-id','report',value);
 assert.ok(encrypted.startsWith('v1.'));
 assert.deepEqual(await unseal(env,'fictional-owner','report-id','report',encrypted),value);
 for(const [owner,id,kind] of [['other-owner','report-id','report'],['fictional-owner','other-id','report'],['fictional-owner','report-id','assessment']]){
  await assert.rejects(unseal(env,owner,id,kind,encrypted));
 }
});

test('the final evidence entry cannot create a blank trailing PDF page',()=>{
 for(const fixture of reportFixtures())for(const scope of ['report','technical']){
  const definition=reportPdfDefinition(fixture.document,{scope});
  if(fixture.document.editorial.folio){
   const last=definition.content.at(-1);
   assert.ok(last.columns.some(column=>column.stack.length));
   assert.equal(last.pageBreak,undefined);
  }else assert.equal(definition.content.at(-1).margin[3],0);
 }
});
