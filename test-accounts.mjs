import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { randomBytes, randomUUID } from 'node:crypto';
import { handleAccountApi, CONSENT_VERSION } from './lib/account-api.mjs';
import { sampleAnswers, sampleLabs, calculatePhenoAge, normalizeLab } from './public/model.mjs';
import {REFERENCE_CATALOG_VERSION} from './public/lab-reference-catalog.mjs';

const sqlite = new DatabaseSync(':memory:');
sqlite.exec('PRAGMA foreign_keys=ON');
for (const file of readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort()) sqlite.exec(readFileSync('drizzle/'+file,'utf8'));
function prepared(sql, values = []) { return { bind(...args) { return prepared(sql, args); }, async first() { return sqlite.prepare(sql).get(...values) ?? null; }, async all() { return { results: sqlite.prepare(sql).all(...values) }; }, async run() { const r = sqlite.prepare(sql).run(...values); return { meta: { changes: Number(r.changes) } }; } }; }
const env = { DB: { prepare: prepared, async batch(statements) { sqlite.exec('BEGIN'); try { const result = []; for (const stmt of statements) result.push(await stmt.run()); sqlite.exec('COMMIT'); return result; } catch (error) { sqlite.exec('ROLLBACK'); throw error; } } }, ASSESSMENT_ENCRYPTION_KEY: randomBytes(32).toString('base64') };
const a = { userId: 'user-a' }, b = { userId: 'user-b' };
const tokens = {};
async function call(user, path, method = 'GET', data, headers = {}) {
  const request = new Request('https://site.test/api/' + path, { method, headers: { ...(method === 'GET' ? {} : { 'Origin': 'https://site.test', 'Content-Type': 'application/json', 'X-KQ-CSRF': tokens[user?.userId] || '' }), ...headers }, ...(data === undefined ? {} : { body: typeof data === 'string' ? data : JSON.stringify(data) }) });
  const response = await handleAccountApi(request, env, user); return { response, data: await response.json() };
}
assert.equal((await call(null, 'session')).response.status, 401);
for (const user of [a,b]) { const r = await call(user, 'session'); tokens[user.userId] = r.data.csrf; assert.equal(r.data.profile, null); assert.match(r.response.headers.get('Cache-Control'), /no-store/); }
const registration = { name: 'My journal', adult: true, consent: true, consentVersion: CONSENT_VERSION };
assert.equal((await call(a, 'account', 'POST', registration, { 'Origin': 'https://evil.test' })).response.status, 403);
assert.equal((await call(a, 'account', 'POST', registration, { 'X-KQ-CSRF': tokens[b.userId] })).response.status, 403);
assert.equal((await call(a, 'account', 'POST', { ...registration, consent: false })).response.status, 400);
for (const user of [a,b]) assert.equal((await call(user, 'account', 'POST', registration)).response.status, 201);
const id = randomUUID();
const entry = { id, userId: b.userId, answers: structuredClone(sampleAnswers), lab: sampleLabs(), labAge: '45', labDate: '2026-11-01', labSubmitted: true, labContext: true, labFasting: 'Yes', sample: true, unlocked: true, value: 18, report: { clinical: { value: 18 } } };
assert.equal((await call(a, 'assessments', 'POST', entry)).response.status, 201);
assert.equal((await call(a, 'assessments', 'POST', entry)).response.status, 201);
assert.equal((await call(a, 'assessments')).data.assessments.length, 1);
const stored = sqlite.prepare('SELECT * FROM assessments').get();
assert.equal(stored.user_id, a.userId);
assert.match(stored.payload, /^v1\./); assert.ok(!stored.payload.includes('Bulgaria')); assert.ok(!stored.report.includes('Movement'));
env.REPORT_REVIEW_MODE='true';
const review=await call(a,'assessments/'+id);assert.equal(review.data.report.full,true);assert.equal(review.data.report.access.review,true);assert.equal(review.data.report.access.purchased,false);
assert.equal(sqlite.prepare('SELECT count(*) n FROM report_orders').get().n,0);
env.PAYMENTS_ENABLED='true';assert.equal((await call(a,'assessments/'+id)).data.report.full,false);env.PAYMENTS_ENABLED='false';delete env.REPORT_REVIEW_MODE;
const result = await call(a, 'assessments/' + id);
assert.equal(result.data.assessment.labReferenceMode,'lab-only','Earlier requests without a guide choice must not gain new reference flags.');
assert.equal(result.data.assessment.value, calculatePhenoAge(45, normalizeLab(sampleLabs())));
assert.equal(result.data.report.clinical.value, result.data.assessment.value);
assert.equal((await call(b, 'assessments')).data.assessments.length, 0);
for (const path of ['assessments/' + id, 'assessments/' + id + '/report']) assert.equal((await call(b, path)).response.status, 404);
assert.equal((await call(b, 'assessments/' + id, 'DELETE', { confirm: true })).response.status, 404);
assert.equal((await call(a, 'assessments', 'POST', { ...entry, id: randomUUID(), lab: { ...entry.lab, crp: { value: '0', unit: 'mg/L' } } })).response.status, 400);
assert.equal((await call(a, 'assessments', 'POST', { ...entry, id: randomUUID(), labDate: '2026-02-30' })).response.status, 400);
assert.equal((await call(a, 'assessments', 'POST', { ...entry, id: randomUUID(), labAge: '17' })).response.status, 400);
assert.equal((await call(a, 'assessments', 'POST', '{bad json')).response.status, 400);
assert.equal((await call(a, 'assessments', 'POST', { payload: 'a'.repeat(50000) })).response.status, 413);
const withheldId=randomUUID();
assert.equal((await call(a, 'assessments', 'POST', { ...entry, id:withheldId, labContext:false })).response.status,201);
assert.equal((await call(a, 'assessments/'+withheldId)).data.assessment.value,null);
const exported=await call(a,'account/export');assert.equal(exported.data.assessments.length,2);assert.ok(exported.data.assessments.every(x=>x.report.version));
const referenced=structuredClone(entry);referenced.id=randomUUID();referenced.labReferenceMode='published';referenced.labReferenceGroup='female';referenced.labReferenceVersion=REFERENCE_CATALOG_VERSION;
Object.assign(referenced.lab.crp,{referenceLow:'0',referenceHigh:'5',referenceHighExclusive:true,assay:'standard-crp'});
assert.equal((await call(a,'assessments','POST',referenced)).response.status,201);
const roundTrip=(await call(a,'assessments/'+referenced.id)).data.assessment;
assert.deepEqual(roundTrip.lab.crp,referenced.lab.crp);assert.equal(roundTrip.labReferenceVersion,REFERENCE_CATALOG_VERSION);assert.equal(roundTrip.labReferenceGroup,'female');
assert.equal(roundTrip.value,result.data.assessment.value,'Reference context does not change the clinical calculation.');
referenced.lab.crp.referenceHigh='10';referenced.labReferenceGroup='male';
assert.equal((await call(a,'assessments','POST',referenced)).response.status,201);
assert.deepEqual((await call(a,'assessments/'+referenced.id)).data.assessment,roundTrip,'Retrying an ID cannot rewrite the saved reference context.');
assert.equal((await call(a,'assessments/'+referenced.id,'DELETE',{confirm:true})).response.status,200);
// Critical entries are saved truthfully as withheld snapshots, never as a supplied age.
const criticalId=randomUUID(),criticalLab=sampleLabs();criticalLab.glucose={value:'2',unit:'mmol/L',referenceLow:'0',referenceHigh:'100'};
assert.equal((await call(a,'assessments','POST',{...entry,id:criticalId,lab:criticalLab,value:25,clinical:{value:25}})).response.status,201);
const criticalStored=(await call(a,'assessments/'+criticalId)).data;
assert.equal(criticalStored.assessment.value,null);assert.equal(criticalStored.report.clinical.withheld,'critical-values');assert.equal(criticalStored.report.clinical.value,undefined);assert.ok(criticalStored.report.clinical.checks.some(check=>check.warning?.code==='critical-glucose'));
assert.equal((await call(a,'assessments','POST',{...entry,id:criticalId})).response.status,201);
assert.deepEqual((await call(a,'assessments/'+criticalId)).data.report.clinical,criticalStored.report.clinical,'An existing snapshot cannot be silently replaced.');
assert.equal((await call(a,'assessments/'+criticalId,'DELETE',{confirm:true})).response.status,200);
// A Heart & Vascular snapshot is recomputed and uses the same ownership rules.
const heartId=randomUUID(),heartEntry={id:heartId,assessmentType:'heart-vascular',value:42,heart:{
  age:50,country:'Germany',sex:'Male',smoking:'Yes',conditions:'No',treatment:'No',
  systolic:{value:'140',unit:'mmHg'},total:{value:'5.5',unit:'mmol/L'},hdl:{value:'1.3',unit:'mmol/L'},
  apob:{value:'95',unit:'mg/dL',referenceHigh:'100'},lpa:{value:'<12',unit:'nmol/L'},result:{risk:0},review:{version:'client-supplied'},
}};
assert.equal((await call(a,'assessments','POST',heartEntry)).response.status,201);
const savedHeart=(await call(a,'assessments/'+heartId)).data;
assert.equal(savedHeart.assessment.value,null);
assert.equal(savedHeart.report.heart.result.method,'SCORE2');
assert.equal(savedHeart.report.heart.result.risk.toFixed(1),'7.6');
assert.equal(savedHeart.report.heart.result.region,'moderate');
assert.equal(savedHeart.report.heart.review.version,'heart-measurement-review-v1');
assert.equal(savedHeart.report.heart.review.fields.apob.comparison.label,'Within your lab interval');
assert.equal(savedHeart.report.heart.review.fields.lpa.direction,'unknown');
assert.deepEqual(savedHeart.report.heart.inputs.lpa,heartEntry.heart.lpa);
assert.equal(savedHeart.report.full,true);
assert.equal(savedHeart.report.access.purchased,false);
assert.equal((await call(a,'assessments')).data.assessments.find(x=>x.id===heartId).assessmentType,'heart-vascular');
assert.equal((await call(a,'assessments')).data.assessments.find(x=>x.id===entry.id).hasProfile,true);
assert.equal((await call(b,'assessments/'+heartId)).response.status,404);
assert.equal((await call(a,'payments/checkout','POST',{confirm:true,assessmentId:heartId})).response.status,400);
const olderHeart={...heartEntry,heart:{...heartEntry.heart,age:75,country:'Bulgaria',smoking:'Some days',smokingDays30:8,cigarettes:3}};
assert.equal((await call(a,'assessments','POST',olderHeart)).response.status,201);
assert.deepEqual((await call(a,'assessments/'+heartId+'/report')).data.report,savedHeart.report);
olderHeart.id=randomUUID();
assert.equal((await call(a,'assessments','POST',olderHeart)).response.status,201);
const savedOlderHeart=(await call(a,'assessments/'+olderHeart.id+'/report')).data.report;
assert.equal(savedOlderHeart.model,'score2-op-2021-regional-v1');
assert.equal(savedOlderHeart.heart.result.method,'SCORE2-OP');
assert.ok(savedOlderHeart.sources.includes('https://doi.org/10.1093/eurheartj/ehab312'));
assert.equal(savedOlderHeart.heart.inputs.smokingDays30,8);
assert.equal((await call(a,'assessments/'+olderHeart.id,'DELETE',{confirm:true})).response.status,200);
assert.equal((await call(a,'assessments/'+heartId,'DELETE',{confirm:true})).response.status,200);
// AES-GCM binds records to their owner and ID, rejecting ciphertext substitution.
sqlite.prepare('UPDATE assessments SET payload=? WHERE id=?').run(stored.payload,withheldId);
assert.equal((await call(a,'assessments/'+withheldId)).response.status,503);
assert.equal((await call(a,'assessments/'+withheldId,'DELETE',{confirm:true})).response.status,200);
sqlite.prepare('UPDATE mutation_limits SET count=120 WHERE user_id=?').run(b.userId);
assert.equal((await call(b,'account','POST',registration)).response.status,429);
assert.equal((await call(a,'account','DELETE',{confirm:'DELETE'})).response.status,200);
assert.equal(sqlite.prepare('SELECT count(*) n FROM assessments WHERE user_id=?').get(a.userId).n,0);
assert.equal((await call(a,'session')).data.profile,null);
assert.ok((await call(b,'session')).data.profile);
console.log('Passed: registration, storage consent, CSRF, owner isolation, encrypted storage, server-calculated snapshots, idempotent save, validation, report export, tamper rejection, rate limits and deletion.');
