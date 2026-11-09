import { sections, labs, validateLabs, assessClinical, validateQuestionnaire, profileMeasurementErrors, ASSESSMENT_PROTOCOL, insights } from '../public/model.mjs';
import { CONTENT_VERSION, references } from '../public/evidence.mjs';
import {assessHeartVascular, HEART_ASSESSMENT, heartSources} from '../public/heart-vascular.mjs';
import {assessSystem, systemAssessment} from '../public/system-assessments.mjs';
import {validateLabReferences} from '../public/lab-review.mjs';
import {referenceVersions,referenceModes,referenceGroups,crpAssays} from '../public/lab-reference-catalog.mjs';
import { PaymentError, paymentConfiguration, hasReportAccess, createCheckout, listPurchases, refreshPurchases, cancelCheckout, protectPendingDeletion } from './payments.mjs';
import { CONSENT_VERSION } from '../public/account-consent.mjs';
import { revokeAppleGrant, signInProviders } from './oauth-provider.mjs';
import { b64, keyBytes, seal, unseal } from './record-encryption.mjs';

export { CONSENT_VERSION };
export const MODEL_VERSION = 'clinical-phenoage-2018-demo-v1';
const encoder = new TextEncoder();
const maxBytes = 48 * 1024;
class ClientError extends Error { constructor(status, message) { super(message); this.status = status; } }
const fail = (status, message) => { throw new ClientError(status, message); };
const record = x => x !== null && typeof x === 'object' && !Array.isArray(x);
async function csrf(env, owner, day = Math.floor(Date.now() / 86400000)) {
  const key = await crypto.subtle.importKey('raw', keyBytes(env), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64(new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(`csrf:${owner}:${day}`))));
}
function equal(a, b) { if (!a || a.length !== b.length) return false; let diff = 0; for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i); return diff === 0; }
async function writeGuard(request, env, owner) {
  if (request.headers.get('origin') !== new URL(request.url).origin || request.headers.get('sec-fetch-site') === 'cross-site') fail(403, 'Please use this website to make changes.');
  if (!request.headers.get('content-type')?.startsWith('application/json')) fail(415, 'A JSON request is required.');
  const token = request.headers.get('x-kq-csrf');
  const day = Math.floor(Date.now() / 86400000);
  if (!equal(token, await csrf(env, owner, day)) && !equal(token, await csrf(env, owner, day - 1))) fail(403, 'Your session needs refreshing. Reload this page and try again.');
  const bucket = Math.floor(Date.now() / 3600000);
  const result = await env.DB.prepare('INSERT INTO mutation_limits (user_id,bucket,count) VALUES (?1,?2,1) ON CONFLICT(user_id) DO UPDATE SET bucket=excluded.bucket,count=CASE WHEN mutation_limits.bucket=excluded.bucket THEN mutation_limits.count+1 ELSE 1 END RETURNING count').bind(owner, bucket).first();
  if (result.count > 120) fail(429, 'Too many changes. Please try again in an hour.');
}
async function body(request) {
  if (Number(request.headers.get('content-length')) > maxBytes) fail(413, 'This assessment is too large.');
  if (!request.body) fail(400, 'The request is empty.');
  const reader = request.body.getReader(); const chunks = []; let size = 0;
  while (true) { const { done, value } = await reader.read(); if (done) break; size += value.byteLength; if (size > maxBytes) { await reader.cancel(); fail(413, 'This assessment is too large.'); } chunks.push(value); }
  const bytes = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  let data; try { data = JSON.parse(new TextDecoder().decode(bytes)); } catch { fail(400, 'The request could not be read.'); }
  if (!record(data)) fail(400, 'Please check the request.');
  return data;
}
const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value && value <= new Date().toISOString().slice(0, 10);

export function validateSnapshot(raw) {
  if (raw?.assessmentType === HEART_ASSESSMENT) {
    if (!record(raw.heart)) fail(400, 'Please check your assessment.');
    const {inputs, result, errors, review} = assessHeartVascular(raw.heart);
    if (Object.keys(errors).length) fail(400, Object.values(errors)[0]);
    return {assessmentType:HEART_ASSESSMENT, heart:{inputs,result,review}, model:result.version || 'heart-vascular-coverage-v2', sample:false, value:null};
  }
  const type=raw?.assessmentType;
  if (systemAssessment(type)) {
    if (!record(raw.system)) fail(400, 'Please check your assessment.');
    const {inputs, result, errors, review}=assessSystem(type, raw.system);
    if (Object.keys(errors).length) fail(400, Object.values(errors)[0]);
    if (!inputs.age) fail(400, 'An adult age is required.');
    return {assessmentType:type, system:{inputs,result,review}, model:result.version||type+'-coverage-v1', sample:raw.sample===true, value:null};
  }
  if (!record(raw) || !record(raw.answers) || !record(raw.lab)) fail(400, 'Please check your assessment.');
  const answers = {};
  for (const q of sections.flatMap(s => s.questions)) {
    const v = raw.answers[q.id]; if (v === undefined || v === '') continue;
    if (q.show && !q.show(answers)) continue;
    if (q.options) {
      if (q.type === 'multi') { if (!Array.isArray(v) || v.length > q.options.length || v.some(x => !q.options.includes(x))) fail(400, 'Please check your questionnaire choices.'); answers[q.id] = [...new Set(v)]; }
      else { if (!q.options.includes(v)) fail(400, 'Please check your questionnaire choices.'); answers[q.id] = v; }
    } else if (q.type === 'number' || q.type === 'measure') {
      if (!['number', 'string'].includes(typeof v) || !String(v).trim()) fail(400, 'Please check a questionnaire number.');
      const n = Number(v);
      if (!Number.isFinite(n) || n < (q.min ?? 0.1) || n > (q.max ?? 1000) || (q.id === 'age' && !Number.isInteger(n))) fail(400, 'Please check your questionnaire numbers.');
      answers[q.id] = String(n);
      if (q.units) { const u = raw.answers[q.id + 'Unit'] || q.units[0]; if (!q.units.includes(u)) fail(400, 'Please check measurement units.'); answers[q.id + 'Unit'] = u; }
    } else if (q.type === 'country') {
      if (typeof v !== 'string' || v.length > 80) fail(400, 'Please check your country.'); answers[q.id] = v.trim();
    } else if (q.type === 'drinks') {
      if (!Array.isArray(v) || v.length > 12) fail(400, 'Please check your drinks.');
      answers.drinks = v.map(d => { if (!record(d) || !['Wine', 'Beer', 'Spirits', 'Other'].includes(d.type)) fail(400, 'Please check drink types.'); const result = { type: d.type }; for (const [k, max] of [['count', 100], ['ml', 10000], ['abv', 100]]) { const n = Number(d[k]); if (d[k] === '') result[k] = ''; else if (!['number','string'].includes(typeof d[k]) || !Number.isFinite(n) || n <= 0 || n > max) fail(400, 'Please check drink amounts.'); else result[k] = String(n); } return result; });
    }
  }
  const labSubmitted = raw.labSubmitted === true;
  if(Object.keys(validateQuestionnaire(answers,{requireAge:!labSubmitted})).length)fail(400,'Check your questionnaire answers. Activity totals and smoking history must be consistent with the ages and time periods entered.');
  const age = Number(raw.labAge);
  if (!answers.age && !labSubmitted) fail(400, 'An adult age is required.');
  const labReferenceMode=raw.labReferenceMode??'lab-only',labReferenceGroup=raw.labReferenceGroup??'unspecified';
  if(!referenceModes.includes(labReferenceMode)||!referenceGroups.includes(labReferenceGroup))fail(400,'Please check the reference comparison settings.');
  if(labReferenceMode==='published'&&!referenceVersions.includes(raw.labReferenceVersion))fail(400,'Please use the current reference guide when creating a new assessment.');
  const lab = {};
  if (labSubmitted) {
    if (!Number.isInteger(age) || age < 18 || age > 120 || !validDate(raw.labDate)) fail(400, 'Please check age and collection date.');
    for (const l of labs) {
      const d=raw.lab[l.id];if(!record(d)||!['string','number'].includes(typeof d.value))fail(400,'Please check your blood measurements.');
      lab[l.id]={value:String(d.value),unit:d.unit||l.units[0]};
      if(l.id==='crp'&&d.assay!==undefined){if(!crpAssays.includes(d.assay))fail(400,'Please check the CRP test type.');lab[l.id].assay=d.assay;}
      for(const side of ['Low','High']){
        const key='reference'+side,exclusive=key+'Exclusive';
        if(d[key]!==undefined&&d[key]!==null&&d[key]!==''){
          if(!['string','number'].includes(typeof d[key])||String(d[key]).length>32)fail(400,'Please check the laboratory reference limits.');
          lab[l.id][key]=String(d[key]).trim();
          if(d[exclusive]!==undefined&&typeof d[exclusive]!=='boolean')fail(400,'Please check the laboratory reference limit rules.');
          if(d[exclusive]===true)lab[l.id][exclusive]=true;
        }
      }
    }
    if (Object.keys(validateLabs(lab)).length) fail(400, 'Please check your blood measurements and units.');
    if (Object.keys(validateLabReferences(lab)).length) fail(400,'Please check the laboratory reference limits.');
  }
  const labFasting=['Yes','No','Not sure'].includes(raw.labFasting)?raw.labFasting:'Not recorded';
  const clinical=labSubmitted?assessClinical({age,lab,contextConfirmed:raw.labContext===true,fasting:labFasting}):null;
  return { answers, lab, labAge: labSubmitted ? String(age) : '', labDate: labSubmitted ? raw.labDate : '', labSubmitted, labContext: raw.labContext === true, labFasting, labReferenceMode,labReferenceGroup,labReferenceVersion:labReferenceMode==='published'?raw.labReferenceVersion:null,assessmentProtocol:ASSESSMENT_PROTOCOL, contentVersion:CONTENT_VERSION, sample: raw.sample === true, unlocked: false, model: MODEL_VERSION, value: clinical?.value ?? null, clinical };
}

export const reportReviewEnabled=env=>env.REPORT_REVIEW_MODE==='true'&&env.PAYMENTS_ENABLED!=='true';
function reportForAccess(report, access, env) {
  const clean = { ...report }; delete clean.demoAccess;
  if (clean.assessmentType === HEART_ASSESSMENT || systemAssessment(clean.assessmentType)) return {...clean,full:true,access};
  const review=reportReviewEnabled(env);
  return access.purchased||review ? { ...clean, full: true, access:{...access,review} } : { version: clean.version, model: clean.model, generatedAt: clean.generatedAt, clinical: clean.clinical, clinicalReview: false, priorities: clean.priorities.slice(0,1), full: false, access };
}

function json(value, status = 200, extra = {}) {
  return Response.json(value, { status, headers: { 'Cache-Control': 'private, no-store, max-age=0', 'Pragma': 'no-cache', 'Vary': 'Cookie', 'X-Content-Type-Options': 'nosniff', ...extra } });
}

export async function handleAccountApi(request, env, user) {
  try {
    const path = new URL(request.url).pathname.replace(/\/$/, ''); const method = request.method;
    if (!user?.userId) {
      const options = path === '/api/session' && method === 'GET' ? {
        providers: signInProviders(request, env),
        ...(env.NATIVE_AUTH_ENABLED === 'true' ? { reviewAccess: Boolean(env.NATIVE_REVIEW_CODE), emailSignIn: Boolean(env.RESEND_API_KEY) } : {}),
      } : {};
      return json({ error: 'Sign in to access your account.', code: 'sign_in_required', ...options }, 401);
    }
    if (!env.DB || !env.ASSESSMENT_ENCRYPTION_KEY) return json({ error: 'Account storage is temporarily unavailable.' }, 503);
    const owner = user.userId;
    const profile = await env.DB.prepare('SELECT nickname,created_at,consent_at,consent_version FROM profiles WHERE user_id=?1').bind(owner).first();
    if (path === '/api/session' && method === 'GET') {
      const login = await env.DB.prepare('SELECT email FROM auth_accounts WHERE user_id=?1').bind(owner).first();
      return json({ authenticated: true, email:login?.email ?? null, providers:signInProviders(request, env), csrf: await csrf(env, owner), reportReview:reportReviewEnabled(env), payments: paymentConfiguration(env), profile: profile ? { name: profile.nickname, created: profile.created_at, consentAt: profile.consent_at, consentVersion: profile.consent_version } : null });
    }
    if (!['GET', 'POST', 'DELETE'].includes(method)) return json({ error: 'Method not supported.' }, 405, { Allow: 'GET, POST, DELETE' });
    if (method !== 'GET') await writeGuard(request, env, owner);
    if (path === '/api/account' && method === 'POST') {
      const data = await body(request);
      if (data.consent !== true || data.adult !== true || data.consentVersion !== CONSENT_VERSION) fail(400, 'Confirm adult eligibility and the account storage notice.');
      const name = typeof data.name === 'string' ? data.name.trim() : '';
      if (!name || name.length > 40 || /[\u0000-\u001f]/.test(name)) fail(400, 'Choose an account nickname of 1–40 characters.');
      const now = new Date().toISOString();
      await env.DB.prepare('INSERT INTO profiles (user_id,nickname,consent_version,consent_at,created_at) VALUES (?1,?2,?3,?4,?4) ON CONFLICT(user_id) DO NOTHING').bind(owner, name, CONSENT_VERSION, now).run();
      return json({ created: !profile }, profile ? 200 : 201);
    }
    if (!profile) fail(409, 'Complete account registration before saving or viewing history.');
    if (path === '/api/payments/checkout' && method === 'POST') { const data=await body(request); if(data.confirm!==true)fail(400,'Confirm the report purchase.'); const row=await env.DB.prepare('SELECT id,payload FROM assessments WHERE id=?1 AND user_id=?2').bind(typeof data.assessmentId==='string'?data.assessmentId:'',owner).first();if(!row)fail(404,'Assessment not found.');const assessment=await unseal(env,owner,row.id,'assessment',row.payload);if(assessment.sample)fail(400,'Sample assessments are for free exploration. Create your own assessment before buying a report.');if(assessment.assessmentType===HEART_ASSESSMENT)fail(400,'Heart & Vascular includes its report.');if(systemAssessment(assessment.assessmentType))fail(400,'This assessment includes its report.');return json(await createCheckout(env,owner,data.assessmentId)); }
    if (path === '/api/purchases' && method === 'GET') return json({ purchases:await listPurchases(env,owner) });
    if (path === '/api/payments/refresh' && method === 'POST') { const data=await body(request); return json({ purchases:await refreshPurchases(env,owner,data.orderId) }); }
    if (path === '/api/payments/cancel' && method === 'POST') { const data=await body(request); return json(await cancelCheckout(env,owner,data.orderId)); }
    if (path === '/api/assessments' && method === 'GET') {
      const rows = await env.DB.prepare('SELECT id,created_at,payload FROM assessments WHERE user_id=?1 ORDER BY created_at ASC,id ASC').bind(owner).all();
      const assessments = await Promise.all(rows.results.map(async row => {
        const s = await unseal(env, owner, row.id, 'assessment', row.payload);
        const access=await hasReportAccess(env,owner,row.id);
        const review=reportReviewEnabled(env);
        if(s.assessmentType===HEART_ASSESSMENT)return {id:row.id,saved:row.created_at,assessmentType:s.assessmentType,model:s.model,value:null,sample:false,unlocked:true,access};
        if(systemAssessment(s.assessmentType))return {id:row.id,saved:row.created_at,assessmentType:s.assessmentType,model:s.model,method:s.system.result.method,value:null,sample:s.sample===true,unlocked:true,access};
        return { id: row.id, saved: row.created_at, labDate: s.labDate, labSubmitted: s.labSubmitted, labFasting:s.labFasting||'Not recorded', assessmentProtocol:s.assessmentProtocol||'earlier-version', value: s.value, sample: s.sample, hasProfile:Object.keys(s.answers||{}).length>0, hasCompleteProfile:!s.sample&&!Object.keys(profileMeasurementErrors(s.answers)).length, unlocked: access.purchased||review, access:{...access,review}, model: s.model };
      }));
      return json({ assessments });
    }
    if (path === '/api/assessments' && method === 'POST') {
      const data = await body(request);
      if (!/^[a-f0-9-]{36}$/i.test(data.id || '')) fail(400, 'An assessment identifier is required.');
      const s = validateSnapshot(data);
      const id = data.id, now = new Date().toISOString();
      const spec=systemAssessment(s.assessmentType);
      let report;
      if(s.assessmentType===HEART_ASSESSMENT){
        report={version:'heart-vascular-report-v6',assessmentType:s.assessmentType,model:s.model,generatedAt:now,heart:s.heart,sources:references.filter(r=>heartSources(s.heart.result,s.heart.review).includes(r.id)).map(r=>r.url),clinicalReview:false};
      }else if(spec){
        report={version:'system-age-report-v1',assessmentType:s.assessmentType,model:s.model,generatedAt:now,system:s.system,sample:s.sample,sources:references.filter(r=>spec.sources.includes(r.id)).map(r=>r.url),clinicalReview:false};
      }else{
        report={version:'educational-report-v2',model:MODEL_VERSION,contentVersion:CONTENT_VERSION,assessmentProtocol:ASSESSMENT_PROTOCOL,generatedAt:now,clinical:s.clinical,priorities:insights(s.answers),sources:references.map(r=>r.url),clinicalReview:false};
      }
      // A client cannot update an existing record or choose an owner. UUID makes retries idempotent.
      const [payload, reportPayload] = await Promise.all([seal(env, owner, id, 'assessment', s), seal(env, owner, id, 'report', report)]);
      await env.DB.prepare('INSERT INTO assessments (id,user_id,created_at,model_version,payload,report) SELECT ?1,?2,?3,?4,?5,?6 WHERE (SELECT COUNT(*) FROM assessments WHERE user_id=?2)<500 ON CONFLICT(id) DO NOTHING').bind(id, owner, now, s.model, payload, reportPayload).run();
      const saved = await env.DB.prepare('SELECT id FROM assessments WHERE id=?1 AND user_id=?2').bind(id, owner).first();
      if (!saved) fail(409, 'Could not save. Your account may have reached its 500-assessment limit.');
      return json({ id, saved: true }, 201);
    }
    const match = path.match(/^\/api\/assessments\/([a-f0-9-]{36})(\/report)?$/i);
    if (match && method === 'GET') {
      const row = await env.DB.prepare('SELECT id,created_at,payload,report FROM assessments WHERE id=?1 AND user_id=?2').bind(match[1], owner).first();
      if (!row) fail(404, 'Assessment not found.');
      const access=await hasReportAccess(env,owner,row.id);
      const report = reportForAccess(await unseal(env, owner, row.id, 'report', row.report),access,env);
      if (match[2]) return json({ report });
      return json({ assessment: { ...await unseal(env, owner, row.id, 'assessment', row.payload), unlocked:report.full, id: row.id, saved: row.created_at }, report });
    }
    if (match && !match[2] && method === 'DELETE') {
      return json({ error: 'Remove individual records from the app on this device.' }, 405, { Allow: 'GET' });
    }
    if (path === '/api/account/export' && method === 'GET') {
      const rows = await env.DB.prepare('SELECT id,created_at,payload,report FROM assessments WHERE user_id=?1 ORDER BY created_at ASC,id ASC').bind(owner).all();
      const assessments = await Promise.all(rows.results.map(async row => { const access=await hasReportAccess(env,owner,row.id),report=reportForAccess(await unseal(env, owner, row.id, 'report', row.report),access,env);return { ...await unseal(env, owner, row.id, 'assessment', row.payload), unlocked:report.full, id: row.id, saved: row.created_at, report }; }));
      const login = await env.DB.prepare('SELECT email FROM auth_accounts WHERE user_id=?1').bind(owner).first();
      return json({ exportedAt: new Date().toISOString(), profile, email:login?.email ?? null, assessments, purchases:await listPurchases(env,owner) }, 200, { 'Content-Disposition': 'attachment; filename="kolequant-account-export.json"' });
    }
    if (path === '/api/account' && method === 'DELETE') {
      const data = await body(request); if (data.confirm !== 'DELETE') fail(400, 'Confirm account deletion.');
      await protectPendingDeletion(env,owner);
      const [, , apple] = await env.DB.batch([
        env.DB.prepare('DELETE FROM email_auth_codes WHERE email=(SELECT email FROM auth_accounts WHERE user_id=?1)').bind(owner),
        env.DB.prepare('DELETE FROM oauth_pending WHERE EXISTS (SELECT 1 FROM oauth_accounts WHERE user_id=?1 AND provider=oauth_pending.provider AND subject_hash=oauth_pending.subject_hash)').bind(owner),
        env.DB.prepare("DELETE FROM oauth_accounts WHERE user_id=?1 AND provider='apple' RETURNING subject_hash,apple_grant").bind(owner),
        env.DB.prepare('DELETE FROM assessments WHERE user_id=?1').bind(owner),
        env.DB.prepare('DELETE FROM profiles WHERE user_id=?1').bind(owner),
        env.DB.prepare('DELETE FROM mutation_limits WHERE user_id=?1').bind(owner),
      ]);
      const credential = apple.results?.[0];
      if (credential) {
        let revoked = false;
        try {
          if (credential.apple_grant) {
            const grant = await unseal(env, 'oauth', credential.subject_hash, 'apple-grant', credential.apple_grant);
            revoked = await revokeAppleGrant(env, grant);
          }
        } catch {
          // Honor deletion even if Apple's service or the old credential is unavailable.
        }
        return json({ deleted: true, appleRevocation: revoked ? 'revoked' : 'manual' });
      }
      return json({ deleted: true });
    }
    return json({ error: 'Not found.' }, 404);
  } catch (error) {
    // Never log request bodies, identities, lab entries or decrypted records.
    return json({ error: error instanceof ClientError || error instanceof PaymentError ? error.message : 'Could not access account storage. Please try again.' }, error instanceof ClientError || error instanceof PaymentError ? error.status : 503);
  }
}
