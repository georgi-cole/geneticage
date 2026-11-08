import {SPECIALIST_CONSENT_VERSION,assessmentReportType,reportTypeName,reportLanguage} from '../public/report-products.mjs';
import {seal,unseal} from './assessment-storage.mjs';
import {fullReportContent} from './full-report.mjs';
import {createReviewCheckout,paymentLiveMode} from './payments.mjs';

export class ReviewError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const fail = (status, message) => { throw new ReviewError(status,message); };
const idPattern = /^[a-f0-9-]{36}$/i;
const countryPattern = /^[A-Z]{2}$/;
const countryCode = code => typeof code === 'string' && countryPattern.test(code);
const record = value => value && typeof value === 'object' && !Array.isArray(value);
const text = (value, max) => typeof value === 'string' && value.trim().length <= max ? value.trim() : null;
const openStates = "('requested','quoted')";
const now = () => new Date().toISOString();

function reviewRoster(env) {
  try {
    const entries = JSON.parse(env.SPECIALIST_REVIEWERS_JSON || '[]');
    if (!Array.isArray(entries) || entries.length > 50) return [];
    const emails = new Set();
    const result = [];
    for (const entry of entries) {
      if (!record(entry)) return [];
      const email = text(entry.email,254)?.toLowerCase(), name = text(entry.name,120), qualifications = text(entry.qualifications,300);
      if (!email || !/^\S+@\S+\.\S+$/.test(email) || emails.has(email) || !name || !qualifications ||
        !Array.isArray(entry.countries) || !entry.countries.length || entry.countries.length > 30 || !entry.countries.every(countryCode)) return [];
      emails.add(email);
      result.push({email,name,qualifications,countries:[...new Set(entry.countries)]});
    }
    return result;
  } catch { return []; }
}

export function specialistAvailability(env, verifiedEmail) {
  const roster = reviewRoster(env);
  return {
    enabled: env.SPECIALIST_REVIEWS_ENABLED === 'true' && roster.length > 0,
    countries: [...new Set(roster.flatMap(reviewer => reviewer.countries))].sort(),
    reviewer: roster.some(entry => entry.email === verifiedEmail),
  };
}

async function reviewerFor(env, owner) {
  const account = await env.DB.prepare('SELECT email FROM auth_accounts WHERE user_id=?1').bind(owner).first();
  const reviewer = reviewRoster(env).find(entry => entry.email === account?.email);
  if (!reviewer) fail(403, 'Specialist reviewer access is required.');
  return reviewer;
}

const selectReviews = `SELECT r.*,
  (SELECT status FROM report_orders WHERE review_request_id=r.id AND user_id=r.user_id AND live_mode=?1
    ORDER BY CASE status WHEN 'paid' THEN 0 WHEN 'disputed' THEN 1 WHEN 'open' THEN 2 WHEN 'processing' THEN 2 WHEN 'creating' THEN 2 ELSE 3 END, created_at DESC LIMIT 1) AS payment_status,
  (SELECT paid_at FROM report_orders WHERE review_request_id=r.id AND user_id=r.user_id AND live_mode=?1 AND status='paid' LIMIT 1) AS paid_at
  FROM specialist_reviews r`;

function summary(row, request) {
  const paymentStatus = row.payment_status || null;
  const openPayment = ['paid','disputed','creating','open','processing'].includes(paymentStatus);
  const expired = row.status === 'quoted' && !openPayment && row.quote_expires_at <= now();
  return {
    id:row.id,assessmentId:row.assessment_id,type:request.type,createdAt:row.created_at,country:row.country,language:row.language,
    status:expired?'expired':row.status,paymentStatus,paidAt:row.paid_at || null,closedAt:row.closed_at,
  };
}

async function reviewData(env, row, {detail=false, forReviewer=false} = {}) {
  const owner = row.user_id, id = row.id;
  const request = await unseal(env,owner,id,'specialist-request',row.request);
  const result = summary(row,request);
  if (!detail) return result;
  result.question = request.question;
  if (row.quote) result.quote = {
    ...await unseal(env,owner,id,'specialist-quote',row.quote), amount:row.quote_amount,currency:row.quote_currency,
    issuedAt:row.quoted_at,expiresAt:row.quote_expires_at,
  };
  if (row.status === 'delivered' && row.payment_status === 'paid') {
    result.delivery = {...await unseal(env,owner,id,'specialist-delivery',row.delivery),deliveredAt:row.delivered_at};
  }
  if (row.status === 'declined' && row.delivery) result.declineReason = (await unseal(env,owner,id,'specialist-declined',row.delivery)).reason;
  if (forReviewer) {
    const saved = await env.DB.prepare('SELECT payload,report,created_at FROM assessments WHERE id=?1 AND user_id=?2').bind(row.assessment_id,owner).first();
    if (!saved) fail(404,'Assessment not found.');
    const [assessment,report] = await Promise.all([
      unseal(env,owner,row.assessment_id,'assessment',saved.payload),
      unseal(env,owner,row.assessment_id,'report',saved.report),
    ]);
    result.assessment = fullReportContent(assessment,report,saved.created_at);
  }
  return result;
}

export async function listReviewRequests(env, owner) {
  const rows = await env.DB.prepare(selectReviews + ' WHERE r.user_id=?2 ORDER BY r.created_at DESC LIMIT 500')
    .bind(Number(paymentLiveMode(env)),owner).all();
  return Promise.all(rows.results.map(row => reviewData(env,row)));
}

async function ownerRequest(env, owner, id) {
  const row = await env.DB.prepare(selectReviews + ' WHERE r.user_id=?2 AND r.id=?3')
    .bind(Number(paymentLiveMode(env)),owner,id).first();
  if (!row) fail(404,'Review request not found.');
  return row;
}

async function submitRequest(env, owner, data) {
  const config = specialistAvailability(env);
  if (!config.enabled) fail(503,'Specialist review requests are currently unavailable.');
  if (data.consent !== true || data.consentVersion !== SPECIALIST_CONSENT_VERSION) fail(400,'Confirm which assessment you want to share.');
  const question = text(data.question ?? '',1500);
  if (question === null) fail(400,'Keep your question to 1,500 characters.');
  if (!config.countries.includes(data.country)) fail(400,'Choose a location where specialist review is available.');
  const assessmentId = data.assessmentId;
  const saved = await env.DB.prepare('SELECT payload FROM assessments WHERE id=?1 AND user_id=?2').bind(
    typeof assessmentId === 'string' ? assessmentId : '',owner).first();
  if (!saved) fail(404,'Assessment not found.');
  const assessment = await unseal(env,owner,assessmentId,'assessment',saved.payload);
  if (assessment.sample) fail(400,'Use a personal assessment to request a specialist review.');
  const id = crypto.randomUUID(), type = assessmentReportType(assessment);
  const request = await seal(env,owner,id,'specialist-request',{type,question});
  await env.DB.prepare(`INSERT INTO specialist_reviews (id,user_id,assessment_id,created_at,status,consent_version,country,language,request)
    SELECT ?1,?2,?3,?4,'requested',?5,?6,?7,?8
    WHERE (SELECT COUNT(*) FROM specialist_reviews WHERE user_id=?2 AND status IN ${openStates}) < 20
    ON CONFLICT DO NOTHING`).bind(id,owner,assessmentId,now(),SPECIALIST_CONSENT_VERSION,data.country,reportLanguage(data.language),request).run();
  const row = await env.DB.prepare(`SELECT id FROM specialist_reviews WHERE user_id=?1 AND assessment_id=?2
    AND status IN ('requested','quoted','delivered')`).bind(owner,assessmentId).first();
  if (!row) fail(409,'Withdraw an open request before starting another.');
  return {id:row.id};
}

async function withdrawRequest(env, owner, id) {
  const updated = await env.DB.prepare(`UPDATE specialist_reviews SET status='cancelled',closed_at=?1 WHERE user_id=?2 AND id=?3
    AND status IN ${openStates} AND NOT EXISTS (SELECT 1 FROM report_orders WHERE review_request_id=?3 AND status IN ('creating','open','processing'))
    RETURNING id`).bind(now(),owner,id).first();
  if (!updated) {
    const row = await ownerRequest(env,owner,id);
    if (row.status !== 'cancelled') fail(409,'Use Purchases to check or cancel any unfinished checkout before withdrawing this request.');
  }
  return {id};
}

async function reviewerRequest(env, owner, reviewer, id) {
  const row = await env.DB.prepare(selectReviews + ` WHERE r.id=?2 AND r.user_id<>?3
    AND r.status IN ${openStates} AND (r.reviewer_user_id IS NULL OR r.reviewer_user_id=?3)`)
    .bind(Number(paymentLiveMode(env)),id,owner).first();
  if (!row || !reviewer.countries.includes(row.country)) fail(404,'Review request not found.');
  return row;
}

async function issueQuote(env, row, owner, reviewer, data) {
  const scope = text(data.scope,2000), {amount,currency,days} = data;
  if (!scope || !Number.isSafeInteger(amount) || amount < 100 || amount > 999999 ||
    !['usd','eur','gbp'].includes(currency) || !Number.isInteger(days) || days < 1 || days > 60) {
    fail(400,'Enter the scope, price, currency and delivery days.');
  }
  const issuedAt = now(), expiresAt = new Date(Date.parse(issuedAt)+7*86400000).toISOString();
  const quote = await seal(env,row.user_id,row.id,'specialist-quote',{scope,days,name:reviewer.name,qualifications:reviewer.qualifications});
  const updated = await env.DB.prepare(`UPDATE specialist_reviews SET status='quoted',reviewer_user_id=?1,quote=?2,quote_amount=?3,
    quote_currency=?4,quote_expires_at=?5,quoted_at=?6 WHERE id=?7 AND status='requested' RETURNING id`)
    .bind(owner,quote,amount,currency,expiresAt,issuedAt,row.id).first();
  if (!updated) fail(409,'This request has already changed. Refresh the review queue.');
  return {id:row.id};
}

async function declineRequest(env, row, owner, data) {
  const reason = text(data.reason,1500);
  if (!reason) fail(400,'Explain why you cannot take this request.');
  const note = await seal(env,row.user_id,row.id,'specialist-declined',{reason});
  const updated = await env.DB.prepare(`UPDATE specialist_reviews SET status='declined',reviewer_user_id=?1,delivery=?2,closed_at=?3
    WHERE id=?4 AND status='requested' RETURNING id`).bind(owner,note,now(),row.id).first();
  if (!updated) fail(409,'This request has already changed. Refresh the review queue.');
  return {id:row.id};
}

async function deliverReview(env, row, owner, data) {
  const findings = text(data.findings,8000), limitations = text(data.limitations,4000), nextSteps = text(data.nextSteps,4000);
  if (!findings || !limitations || !nextSteps) fail(400,'Complete the findings, limitations and follow-up sections.');
  const delivery = await seal(env,row.user_id,row.id,'specialist-delivery',{findings,limitations,nextSteps});
  const updated = await env.DB.prepare(`UPDATE specialist_reviews SET status='delivered',delivery=?1,delivered_at=?2
    WHERE id=?3 AND status='quoted' AND reviewer_user_id=?4
    AND EXISTS (SELECT 1 FROM report_orders WHERE review_request_id=?3 AND user_id=specialist_reviews.user_id AND live_mode=?5 AND status='paid') RETURNING id`)
    .bind(delivery,now(),row.id,owner,Number(paymentLiveMode(env))).first();
  if (!updated) fail(409,'A verified payment is required before delivery.');
  return {id:row.id};
}

export async function handleSpecialistRoute(env, owner, path, method, readBody) {
  if (path === '/api/specialist-reviews') {
    if (method === 'GET') return {reviews:await listReviewRequests(env,owner)};
    if (method === 'POST') return submitRequest(env,owner,await readBody());
  }
  const customer = path.match(/^\/api\/specialist-reviews\/([^/]+)(?:\/(withdraw|checkout))?$/);
  if (customer && idPattern.test(customer[1])) {
    const [,id,action] = customer;
    if (method === 'GET' && !action) return {review:await reviewData(env,await ownerRequest(env,owner,id),{detail:true})};
    if (method === 'POST' && action === 'withdraw') return withdrawRequest(env,owner,id);
    if (method === 'POST' && action === 'checkout') {
      if ((await readBody()).confirm !== true) fail(400,'Confirm the quoted review before paying.');
      const row = await ownerRequest(env,owner,id);
      if (row.status === 'quoted' && row.payment_status !== 'paid') {
        const assigned = await env.DB.prepare('SELECT email FROM auth_accounts WHERE user_id=?1').bind(row.reviewer_user_id).first();
        if (!reviewRoster(env).some(reviewer=>reviewer.email===assigned?.email&&reviewer.countries.includes(row.country))) {
          fail(409,'The quoted reviewer is no longer available. Contact KoleQuant about this request.');
        }
      }
      return createReviewCheckout(env,owner,id);
    }
  }
  const staff = path.match(/^\/api\/specialist-queue(?:\/([^/]+)(?:\/(quote|decline|deliver))?)?$/);
  if (staff) {
    const reviewer = await reviewerFor(env,owner);
    const [,id,action] = staff;
    if (!id && method === 'GET') {
      const countries = reviewer.countries.map((_,index) => '?'+(index+3)).join(',');
      const rows = await env.DB.prepare(selectReviews + ` WHERE r.user_id<>?2 AND r.status IN ${openStates}
        AND (r.reviewer_user_id IS NULL OR r.reviewer_user_id=?2) AND r.country IN (${countries})
        ORDER BY CASE WHEN payment_status='paid' THEN 0 WHEN r.status='requested' THEN 1 ELSE 2 END, r.created_at LIMIT 100`).bind(Number(paymentLiveMode(env)),owner,...reviewer.countries).all();
      return {reviews:await Promise.all(rows.results.map(row => reviewData(env,row)))};
    }
    if (id && idPattern.test(id)) {
      const row = await reviewerRequest(env,owner,reviewer,id);
      if (method === 'GET' && !action) return {review:await reviewData(env,row,{detail:true,forReviewer:true})};
      if (method === 'POST' && action === 'quote') return issueQuote(env,row,owner,reviewer,await readBody());
      if (method === 'POST' && action === 'decline') return declineRequest(env,row,owner,await readBody());
      if (method === 'POST' && action === 'deliver') return deliverReview(env,row,owner,await readBody());
    }
  }
  fail(404,'Review request not found.');
}

export async function exportReviewRequests(env, owner) {
  const rows = await env.DB.prepare(selectReviews + ' WHERE r.user_id=?2 ORDER BY r.created_at')
    .bind(Number(paymentLiveMode(env)),owner).all();
  return Promise.all(rows.results.map(async row => {
    const review = await reviewData(env,row,{detail:true});
    return {...review,title:reportTypeName(review.type),consentVersion:row.consent_version};
  }));
}
