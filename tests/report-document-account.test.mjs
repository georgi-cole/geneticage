import assert from 'node:assert/strict';
import {test} from 'node:test';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync, readdirSync} from 'node:fs';
import {randomBytes, randomUUID} from 'node:crypto';
import {handleAccountApi, CONSENT_VERSION, validateSnapshot} from '../lib/account-api.mjs';
import {seal, unseal} from '../lib/record-encryption.mjs';
import {sampleAnswers, sampleLabs, calculatePhenoAge, normalizeLab} from '../public/model.mjs';
import {systemSampleInputs} from '../public/system-assessments.mjs';
import {composeReportDocument, REPORT_DOCUMENT_VERSION} from '../public/report-composer.mjs';
import {REPORT_CONTENT_VERSION} from '../public/report-content.mjs';
import {references} from '../public/evidence.mjs';

// The same in-memory D1 adapter used by the account/payment suites. No account,
// storage key, health record or payment provider outside this fixture is used.
async function accountFixture(t) {
  const db = new DatabaseSync(':memory:');
  t.after(() => db.close());
  db.exec('PRAGMA foreign_keys=ON');
  const migrations = new URL('../drizzle/', import.meta.url);
  for (const file of readdirSync(migrations).filter(name => name.endsWith('.sql')).sort()) {
    db.exec(readFileSync(new URL(file, migrations), 'utf8'));
  }
  function prepared(sql, values = []) {
    return {
      bind(...args) { return prepared(sql, args); },
      async first() { return db.prepare(sql).get(...values) ?? null; },
      async all() { return {results:db.prepare(sql).all(...values)}; },
      async run() { return {meta:{changes:Number(db.prepare(sql).run(...values).changes)}}; },
    };
  }
  const env = {
    DB:{prepare:prepared, async batch(statements) {
      db.exec('BEGIN');
      try {
        const results = [];
        for (const statement of statements) results.push(await statement.run());
        db.exec('COMMIT');
        return results;
      } catch (error) { db.exec('ROLLBACK'); throw error; }
    }},
    ASSESSMENT_ENCRYPTION_KEY:randomBytes(32).toString('base64'),
    PAYMENTS_ENABLED:'false', STRIPE_MODE:'test',
  };
  const users = {a:{userId:'report-owner-a'}, b:{userId:'report-owner-b'}}, tokens = {};
  async function call(who, path, method = 'GET', data) {
    const request = new Request('https://site.test/api/' + path, {
      method,
      headers:method === 'GET' ? {} : {Origin:'https://site.test', 'Content-Type':'application/json', 'X-KQ-CSRF':tokens[who]},
      ...(data === undefined ? {} : {body:JSON.stringify(data)}),
    });
    const response = await handleAccountApi(request, env, users[who]);
    return {status:response.status, data:await response.json()};
  }
  for (const who of Object.keys(users)) {
    tokens[who] = (await call(who, 'session')).data.csrf;
    assert.equal((await call(who, 'account', 'POST', {
      name:'Fictional report fixture', adult:true, consent:true, consentVersion:CONSENT_VERSION,
    })).status, 201);
  }
  const row = id => db.prepare('SELECT * FROM assessments WHERE id=?').get(id);
  const storedReport = id => unseal(env, users.a.userId, id, 'report', row(id).report);
  return {db, env, users, call, row, storedReport};
}

const clinicalEntry = (overrides = {}) => ({
  id:randomUUID(), answers:structuredClone(sampleAnswers), lab:sampleLabs(),
  labAge:'45', labDate:'2026-11-01', labSubmitted:true, labContext:true, labFasting:'Yes',
  sample:false, ...overrides,
});

test('profile birth year survives server validation without changing snapshot age',()=>{
 const year=new Date().getFullYear();
 const entry=clinicalEntry();
 entry.answers={...entry.answers,birthYear:String(year-45),ageRecordedYear:String(year)};
 const validated=validateSnapshot(entry);
 assert.equal(validated.answers.birthYear,String(year-45));
 assert.equal(validated.answers.ageRecordedYear,String(year));
 assert.equal(validated.answers.age,String(entry.answers.age));
 assert.throws(()=>validateSnapshot({...entry,answers:{...entry.answers,birthYear:'invalid'}}));
});

test('new report documents are composed from server facts and encrypted with the snapshot', async t => {
  const f = await accountFixture(t);
  const forged = 'CLIENT FORGED PERSONAL REPORT';
  const entry = clinicalEntry({
    userId:f.users.b.userId, unlocked:true, value:18,
    model:forged, contentVersion:forged, assessmentProtocol:forged, questionnaireVersion:forged, generatedAt:forged,
    clinical:{value:18}, priorities:[{title:forged}],
    document:{version:'client-version', sections:[forged], citations:[{id:'phenoage',label:forged,url:'https://example.test/forged'}]},
    report:{clinical:{value:18}, document:{version:'client-version', sections:[forged]}},
  });
  assert.equal((await f.call('a', 'assessments', 'POST', entry)).status, 201);
  const encrypted = f.row(entry.id);
  assert.equal(encrypted.user_id, f.users.a.userId);
  assert.match(encrypted.report, /^v1\./);
  assert.ok(!encrypted.report.includes(REPORT_DOCUMENT_VERSION));
  const saved = await f.storedReport(entry.id);
  const assessment = await unseal(f.env, f.users.a.userId, entry.id, 'assessment', encrypted.payload);
  assert.equal(saved.clinical.value, calculatePhenoAge(45, normalizeLab(sampleLabs())));
  assert.notEqual(saved.clinical.value, 18);
  assert.equal(saved.document.version, REPORT_DOCUMENT_VERSION);
  assert.equal(saved.document.contentVersion, REPORT_CONTENT_VERSION);
  assert.equal(saved.document.assessmentContentVersion, assessment.contentVersion);
  assert.deepEqual(saved.document.citations, saved.document.sourceIds.map(id => {
    const {label, url} = references.find(reference => reference.id === id);
    return {id, label, url};
  }));
  assert.equal(saved.document.type, 'clinical-phenoage');
  assert.equal(saved.document.resultState, 'ready');
  assert.equal(saved.document.clinicalReview, false);
  assert.ok(saved.document.sections.length > 0);
  assert.ok(!JSON.stringify(saved).includes(forged));
  assert.equal(assessment.document, undefined);
  assert.equal(assessment.report, undefined);
  assert.ok(!JSON.stringify(assessment).includes(forged));
  assert.deepEqual(saved.document, composeReportDocument({
    state:assessment, clinical:saved.clinical, priorities:saved.priorities, generatedAt:saved.generatedAt,
  }));
  f.env.REPORT_REVIEW_MODE = 'true';
  assert.deepEqual((await f.call('a', `assessments/${entry.id}/report`)).data.report.document, saved.document);
  assert.deepEqual((await f.call('a', `assessments/${entry.id}/report`)).data.report.document, saved.document,
    'Reading a report again does not generate a new document.');
});

test('locked assessment, report and account exports contain only the existing one-insight preview', async t => {
  const f = await accountFixture(t), entry = clinicalEntry({unlocked:true, full:true, access:{purchased:true}});
  assert.equal((await f.call('a', 'assessments', 'POST', entry)).status, 201);
  const saved = await f.storedReport(entry.id);
  assert.ok(saved.priorities.length > 1);
  async function assertLocked() {
    const responses = [
      (await f.call('a', `assessments/${entry.id}`)).data.report,
      (await f.call('a', `assessments/${entry.id}/report`)).data.report,
      (await f.call('a', 'account/export')).data.assessments[0].report,
    ];
    for (const report of responses) {
      assert.equal(report.full, false);
      assert.equal(Object.hasOwn(report, 'document'), false);
      assert.deepEqual(report.priorities, saved.priorities.slice(0, 1));
      assert.deepEqual(Object.keys(report).sort(), ['version','model','generatedAt','clinical','clinicalReview','priorities','full','access'].sort());
    }
  }
  await assertLocked();
  f.env.REPORT_REVIEW_MODE = 'true';
  const review = (await f.call('a', `assessments/${entry.id}/report`)).data.report;
  assert.equal(review.access.review, true);
  assert.deepEqual(review.document, saved.document);
  assert.equal(f.db.prepare('SELECT count(*) n FROM report_orders').get().n, 0);
  f.env.PAYMENTS_ENABLED = 'true';
  await assertLocked();

  // This fixture represents a verified server entitlement; the payment suite
  // separately exercises provider verification, signed notifications and refunds.
  const orderId = randomUUID(), now = new Date().toISOString();
  f.db.prepare("INSERT INTO report_orders (id,user_id,assessment_id,live_mode,price_id,amount,currency,status,created_at,paid_at) VALUES (?,?,?,0,'price_fixture',799,'usd','paid',?,?)")
    .run(orderId, f.users.a.userId, entry.id, now, now);
  const paid = (await f.call('a', `assessments/${entry.id}/report`)).data.report;
  assert.equal(paid.full, true);
  assert.equal(paid.access.purchased, true);
  assert.deepEqual(paid.document, saved.document);
  assert.deepEqual((await f.call('a', 'account/export')).data.assessments[0].report.document, saved.document);
  for (const path of [`assessments/${entry.id}`, `assessments/${entry.id}/report`]) {
    assert.equal((await f.call('b', path)).status, 404);
  }
  f.env.STRIPE_MODE = 'live';
  await assertLocked();
  f.env.STRIPE_MODE = 'test';
  f.db.prepare("UPDATE report_orders SET status='refunded' WHERE id=?").run(orderId);
  await assertLocked();
});

test('a retry cannot replace a saved document and earlier reports are not silently upgraded', async t => {
  const f = await accountFixture(t), entry = clinicalEntry();
  f.env.REPORT_REVIEW_MODE = 'true';
  assert.equal((await f.call('a', 'assessments', 'POST', entry)).status, 201);
  const original = {...f.row(entry.id)};
  const changed = clinicalEntry({id:entry.id, answers:{...sampleAnswers, sleep:'9'}, labAge:'55'});
  assert.equal((await f.call('a', 'assessments', 'POST', changed)).status, 201);
  assert.deepEqual({...f.row(entry.id)}, original, 'The exact encrypted snapshot remains unchanged on retry.');

  const legacyId = randomUUID(), created = '2026-10-01T10:00:00.000Z';
  const legacyState = {...validateSnapshot(entry), model:'earlier-model', assessmentProtocol:'earlier-protocol', value:43.7, clinical:{value:43.7}};
  const legacyReport = {
    version:'educational-report-v1', model:'earlier-model', generatedAt:created,
    clinical:{value:43.7}, priorities:[{title:'Earlier stored finding', text:'Keep the original interpretation.'}],
    sources:[], clinicalReview:false,
  };
  f.db.prepare('INSERT INTO assessments (id,user_id,created_at,model_version,payload,report) VALUES (?,?,?,?,?,?)').run(
    legacyId, f.users.a.userId, created, legacyState.model,
    await seal(f.env, f.users.a.userId, legacyId, 'assessment', legacyState),
    await seal(f.env, f.users.a.userId, legacyId, 'report', legacyReport),
  );
  const originalLegacy = {...f.row(legacyId)};
  const read = (await f.call('a', `assessments/${legacyId}/report`)).data.report;
  assert.equal(read.document, undefined);
  assert.equal(read.clinical.value, 43.7);
  assert.deepEqual(read.priorities, legacyReport.priorities);
  const exported = (await f.call('a', 'account/export')).data.assessments.find(value => value.id === legacyId);
  assert.equal(exported.report.document, undefined);
  assert.equal((await f.call('a', 'assessments', 'POST', {...changed,id:legacyId})).status, 201);
  assert.deepEqual({...f.row(legacyId)}, originalLegacy);
  assert.deepEqual(await f.storedReport(legacyId), legacyReport);

  // A document from an earlier editorial/source edition must also be returned
  // verbatim, even when its citation labels differ from today's catalogue.
  const earlierId = randomUUID(), earlierDocument = structuredClone((await f.storedReport(entry.id)).document);
  earlierDocument.contentVersion = 'historical-report-content-fixture';
  earlierDocument.citations[0] = {...earlierDocument.citations[0], label:'Earlier saved source label', url:'https://example.test/earlier-source'};
  const earlierReport = {...legacyReport, document:earlierDocument};
  f.db.prepare('INSERT INTO assessments (id,user_id,created_at,model_version,payload,report) VALUES (?,?,?,?,?,?)').run(
    earlierId, f.users.a.userId, created, legacyState.model,
    await seal(f.env, f.users.a.userId, earlierId, 'assessment', legacyState),
    await seal(f.env, f.users.a.userId, earlierId, 'report', earlierReport),
  );
  const originalEarlier = {...f.row(earlierId)};
  assert.deepEqual((await f.call('a', `assessments/${earlierId}/report`)).data.report.document, earlierDocument);
  assert.equal((await f.call('a', 'assessments', 'POST', {...changed,id:earlierId})).status, 201);
  assert.deepEqual({...f.row(earlierId)}, originalEarlier);
  assert.deepEqual((await f.call('a', 'account/export')).data.assessments.find(value => value.id === earlierId).report.document, earlierDocument);
});

test('profile and withheld snapshots persist the appropriate narrative state', async t => {
  const f = await accountFixture(t);
  for (const entry of [
    clinicalEntry({labSubmitted:false, lab:{}}),
    clinicalEntry({labContext:false}),
    clinicalEntry({lab:{...sampleLabs(), glucose:{value:'2',unit:'mmol/L'}}}),
  ]) {
    assert.equal((await f.call('a', 'assessments', 'POST', entry)).status, 201);
    const report = await f.storedReport(entry.id);
    assert.equal(report.document.type, entry.labSubmitted ? 'clinical-phenoage' : 'health-profile');
    assert.equal(report.document.resultState, entry.labSubmitted ? 'withheld' : 'profile');
    if (entry.labSubmitted) assert.equal(report.clinical.value, undefined);
  }
});

test('heart and system documents retain included access and server-calculated family results', async t => {
  const f = await accountFixture(t);
  const heart = {
    age:50, country:'Germany', sex:'Male', smoking:'Yes', conditions:'No', treatment:'No',
    systolic:{value:'140',unit:'mmHg'}, total:{value:'5.5',unit:'mmol/L'}, hdl:{value:'1.3',unit:'mmol/L'},
    result:{risk:0}, review:{version:'client-review'},
  };
  for (const type of ['heart-vascular','metabolic','kidney','fitness']) {
    const entry = {id:randomUUID(), assessmentType:type, ...(type === 'heart-vascular' ? {heart} : {system:systemSampleInputs(type)}),
      document:{version:'forged'}, report:{document:{sections:['FORGED FAMILY REPORT']}}};
    assert.equal((await f.call('a', 'assessments', 'POST', entry)).status, 201);
    const report = (await f.call('a', `assessments/${entry.id}/report`)).data.report;
    assert.equal(report.full, true);
    assert.equal(report.access.purchased, false);
    assert.equal(report.document.version, REPORT_DOCUMENT_VERSION);
    assert.equal(report.document.type, type);
    assert.ok(report.document.sections.length > 0);
    assert.ok(!JSON.stringify(report.document).includes('FORGED FAMILY REPORT'));
    assert.deepEqual(report.document, (await f.storedReport(entry.id)).document);
    if (type === 'heart-vascular') assert.equal(report.heart.result.risk.toFixed(1), '7.6');
    assert.equal((await f.call('b', `assessments/${entry.id}/report`)).status, 404);
    assert.equal((await f.call('a', 'payments/checkout', 'POST', {confirm:true,assessmentId:entry.id})).status, 400);
  }
});

test('a stored narrative remains bound to its owner, assessment ID and report record kind', async t => {
  const f = await accountFixture(t), first = clinicalEntry(), second = clinicalEntry();
  f.env.REPORT_REVIEW_MODE = 'true';
  for (const entry of [first, second]) assert.equal((await f.call('a', 'assessments', 'POST', entry)).status, 201);
  const firstRow = f.row(first.id), secondRow = f.row(second.id);
  f.db.prepare('UPDATE assessments SET report=? WHERE id=?').run(firstRow.report, second.id);
  assert.equal((await f.call('a', `assessments/${second.id}/report`)).status, 503);
  f.db.prepare('UPDATE assessments SET report=? WHERE id=?').run(secondRow.payload, second.id);
  assert.equal((await f.call('a', `assessments/${second.id}/report`)).status, 503);
  f.db.prepare('UPDATE assessments SET report=? WHERE id=?').run(secondRow.report, second.id);
  assert.equal((await f.call('a', `assessments/${second.id}/report`)).status, 200);
  assert.equal((await f.call('b', `assessments/${first.id}/report`)).status, 404);
});


test('new family reports freeze validated health-profile context without changing the family calculation', async t => {
 const f=await accountFixture(t);
 const id=randomUUID(),system=systemSampleInputs('fitness');
 const answers={...sampleAnswers,moderate:'180',strength:'2'};
 const without=validateSnapshot({assessmentType:'fitness',system});
 const validated=validateSnapshot({assessmentType:'fitness',system,answers});
 assert.deepEqual(validated.system,without.system,'Health-profile context does not change the fitness equation.');
 assert.equal((await f.call('a','assessments','POST',{id,assessmentType:'fitness',system,answers})).status,201);
 const original=(await f.call('a','assessments/'+id)).data;
 assert.equal(original.assessment.answers.moderate,'180');
 assert.equal(original.report.full,true,'The previously included family entitlement is preserved.');
 assert.deepEqual(original.report.document,composeReportDocument({state:validated,generatedAt:original.report.generatedAt}));
 assert.equal((await f.call('a','assessments','POST',{id,assessmentType:'fitness',system,answers:{...answers,moderate:'0'}})).status,201);
 assert.deepEqual((await f.call('a','assessments/'+id)).data,original,'Reusing a saved ID cannot replace its profile or document.');
 assert.equal((await f.call('b','assessments/'+id+'?snapshot=1')).status,404);
 assert.equal((await f.call('a','assessments','POST',{id:randomUUID(),assessmentType:'fitness',system,answers:{age:'not-an-age'}})).status,400);
});
