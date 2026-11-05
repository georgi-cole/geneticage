export class PaymentError extends Error { constructor(status, message) { super(message); this.status = status; } }
const fail = (status, message) => { throw new PaymentError(status, message); };
const enc = new TextEncoder();
export const REPORT_AMOUNT = 799, REPORT_CURRENCY = 'usd';
export const paymentLiveMode = env => env.STRIPE_MODE !== 'test';
const validId = id => typeof id === 'string' && /^[a-f0-9-]{36}$/i.test(id);
const validSession = id => typeof id === 'string' && /^cs_(test_|live_)?[a-zA-Z0-9_]{10,180}$/.test(id);
const originFor = env => { try { const url = new URL(env.PUBLIC_SITE_ORIGIN); return url.protocol === 'https:' && url.origin === env.PUBLIC_SITE_ORIGIN ? url.origin : null; } catch { return null; } };
export function paymentConfiguration(env) {
  const mode = paymentLiveMode(env) ? 'live' : 'test';
  const enabled = env.PAYMENTS_ENABLED === 'true' && env.PAYMENT_WEBHOOK_READY === 'true' && /^price_[a-zA-Z0-9]+$/.test(env.STRIPE_REPORT_PRICE_ID || '') && (env.STRIPE_SECRET_KEY || '').startsWith(`sk_${mode}_`) && (env.STRIPE_WEBHOOK_SECRET || '').startsWith('whsec_') && !!originFor(env);
  return { enabled, mode, amount: REPORT_AMOUNT, currency: REPORT_CURRENCY, label: 'US$7.99', message: enabled ? (mode === 'test' ? 'Test checkout. No real payment will be taken.' : 'One-time purchase for this saved report. Any applicable taxes are shown at checkout.') : 'Report purchases are not available yet. Your free results and saved assessments remain available.' };
}
async function stripe(env, path, { method = 'GET', form, idempotencyKey } = {}) {
  if (!/^sk_(test|live)_/.test(env.STRIPE_SECRET_KEY || '')) fail(503, 'Payment verification is temporarily unavailable.');
  const response = await fetch('https://api.stripe.com/v1/' + path, { method, redirect: 'error', signal: AbortSignal.timeout(12000), headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, 'Stripe-Version': '2026-10-28.endive', ...(form ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}), ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}) }, ...(form ? { body: new URLSearchParams(form).toString() } : {}) });
  if (!response.ok) fail(503, 'The payment service could not complete this request. Please try again.');
  return response.json();
}
export async function hasReportAccess(env, owner, assessmentId) {
  const row = await env.DB.prepare("SELECT id,paid_at,live_mode FROM report_orders WHERE user_id=?1 AND assessment_id=?2 AND live_mode=?3 AND status='paid' LIMIT 1").bind(owner, assessmentId, paymentLiveMode(env) ? 1 : 0).first();
  return row ? { purchased: true, testOnly: !row.live_mode, paidAt: row.paid_at } : { purchased: false, testOnly: false };
}
function checkoutUrl(value) { try { const url = new URL(value); if (url.protocol === 'https:' && url.hostname === 'checkout.stripe.com') return url.href; } catch {} fail(503, 'Could not open secure checkout.'); }
function receiptUrl(value) { try { const url = new URL(value); return url.protocol === 'https:' && url.hostname === 'pay.stripe.com' ? url.href : null; } catch { return null; } }

export async function reconcileOrder(env, order) {
  if (!order.session_id || !validSession(order.session_id)) return order;
  const version = await env.DB.prepare('UPDATE report_orders SET verify_version=verify_version+1 WHERE id=?1 RETURNING verify_version').bind(order.id).first();
  if (!version) return null;
  const session = await stripe(env, `checkout/sessions/${order.session_id}?expand[]=line_items&expand[]=payment_intent.latest_charge`);
  const items = session.line_items?.data, intent = session.payment_intent, charge = intent?.latest_charge;
  if (session.id !== order.session_id || session.client_reference_id !== order.id || session.metadata?.order_id !== order.id || session.mode !== 'payment' || Number(session.livemode) !== order.live_mode || !Array.isArray(items) || items.length !== 1 || session.line_items.has_more || items[0].price?.id !== order.price_id || items[0].quantity !== 1 || items[0].price?.unit_amount !== order.amount || items[0].price?.currency !== order.currency || session.currency !== order.currency || session.amount_subtotal !== order.amount) fail(409, 'This payment needs a support review. Report access has not changed.');
  let status = session.status === 'expired' ? 'expired' : session.status === 'open' ? 'open' : 'processing';
  let paidAt = order.paid_at, receipt = order.receipt_url;
  if (session.status === 'complete' && session.payment_status === 'paid') {
    if (!intent || intent.status !== 'succeeded' || intent.currency !== order.currency || intent.amount_received !== session.amount_total || session.amount_total < order.amount || !charge || charge.paid !== true || charge.captured !== true || charge.currency !== order.currency || charge.amount !== session.amount_total || Number(charge.livemode) !== order.live_mode) fail(409, 'This payment is still being verified. Please check again shortly.');
    let disputed = false;
    if (charge.disputed) {
      const disputes = await stripe(env, `disputes?payment_intent=${intent.id}&limit=100`);
      disputed = disputes.has_more || !Array.isArray(disputes.data) || !disputes.data.length || disputes.data.some(d => !['won','warning_closed'].includes(d.status));
    }
    status = charge.refunded || charge.amount_refunded >= charge.amount ? 'refunded' : disputed ? 'disputed' : 'paid';
    paidAt ||= new Date().toISOString(); receipt = receiptUrl(charge.receipt_url);
  }
  await env.DB.prepare('UPDATE report_orders SET status=?1,payment_intent_id=?2,checked_at=?3,paid_at=?4,receipt_url=?5 WHERE id=?6 AND verify_version=?7').bind(status, typeof intent === 'object' ? intent?.id || null : intent || null, new Date().toISOString(), paidAt || null, receipt || null, order.id, version.verify_version).run();
  return env.DB.prepare('SELECT * FROM report_orders WHERE id=?1').bind(order.id).first();
}
export async function createCheckout(env, owner, assessmentId) {
  if (!paymentConfiguration(env).enabled) fail(503, 'Report purchases are not available yet. No payment has been taken.');
  if (!validId(assessmentId)) fail(400, 'Choose a saved report.');
  if (!await env.DB.prepare('SELECT id FROM assessments WHERE id=?1 AND user_id=?2').bind(assessmentId, owner).first()) fail(404, 'Assessment not found.');
  if (await env.DB.prepare("SELECT id FROM report_orders WHERE user_id=?1 AND assessment_id=?2 AND live_mode=?3 AND status='disputed' LIMIT 1").bind(owner,assessmentId,paymentLiveMode(env)?1:0).first()) fail(409,'This payment is under review. Please resolve it before starting another checkout.');
  if ((await hasReportAccess(env, owner, assessmentId)).purchased) return { purchased: true, assessmentId };
  const price = await stripe(env, 'prices/' + env.STRIPE_REPORT_PRICE_ID);
  if (!price.active || price.type !== 'one_time' || price.recurring || price.unit_amount !== REPORT_AMOUNT || price.currency !== REPORT_CURRENCY || Number(price.livemode) !== Number(paymentLiveMode(env))) fail(503, 'The report price is not available. No payment has been taken.');
  const newId = crypto.randomUUID(), mode = paymentLiveMode(env) ? 1 : 0;
  await env.DB.prepare("INSERT INTO report_orders (id,user_id,assessment_id,live_mode,price_id,amount,currency,status,created_at) VALUES (?1,?2,?3,?4,?5,?6,?7,'creating',?8) ON CONFLICT DO NOTHING").bind(newId, owner, assessmentId, mode, price.id, REPORT_AMOUNT, REPORT_CURRENCY, new Date().toISOString()).run();
  let order = await env.DB.prepare("SELECT * FROM report_orders WHERE user_id=?1 AND assessment_id=?2 AND live_mode=?3 AND status IN ('creating','open','processing','paid') LIMIT 1").bind(owner, assessmentId, mode).first();
  if (!order) fail(409, 'Please refresh the report and try again.');
  if (order.session_id) {
    order = await reconcileOrder(env, order);
    if (order?.status === 'paid') return { purchased: true, assessmentId };
    if (order?.status === 'open') { const existing = await stripe(env, 'checkout/sessions/' + order.session_id); return { url: checkoutUrl(existing.url), orderId: order.id }; }
    if (order?.status !== 'creating') fail(409, order?.status === 'processing' ? 'Your payment is processing. Check Purchases before trying again.' : 'This checkout has ended. Refresh and try again.');
  }
  const origin = originFor(env);
  const session = await stripe(env, 'checkout/sessions', { method: 'POST', idempotencyKey: 'report-order-' + order.id, form: {
    mode: 'payment', 'payment_method_types[0]': 'card', 'line_items[0][price]': order.price_id, 'line_items[0][quantity]': '1',
    client_reference_id: order.id, 'metadata[order_id]': order.id,
    success_url: `${origin}/?payment_order=${order.id}#purchases`, cancel_url: `${origin}/?payment_cancelled=${order.id}#purchases`,
    'automatic_tax[enabled]': env.STRIPE_AUTOMATIC_TAX === 'false' ? 'false' : 'true',
  } });
  if (!validSession(session.id) || Number(session.livemode) !== mode) fail(503, 'Could not create secure checkout.');
  const url = checkoutUrl(session.url);
  await env.DB.prepare("UPDATE report_orders SET session_id=?1,status='open' WHERE id=?2 AND session_id IS NULL").bind(session.id, order.id).run();
  return { url, orderId: order.id };
}

export async function listPurchases(env, owner) {
  const result = await env.DB.prepare('SELECT id,assessment_id,status,amount,currency,live_mode,created_at,paid_at,receipt_url FROM report_orders WHERE user_id=?1 ORDER BY created_at DESC LIMIT 500').bind(owner).all();
  return result.results.map(row => ({ id: row.id, assessmentId: row.assessment_id, status: row.status, amount: row.amount, currency: row.currency, testOnly: !row.live_mode, created: row.created_at, paid: row.paid_at, receiptUrl: row.receipt_url }));
}
export async function refreshPurchases(env, owner, orderId) {
  if (orderId && !validId(orderId)) fail(400, 'Invalid purchase reference.');
  const result = orderId ? { results: [await env.DB.prepare('SELECT * FROM report_orders WHERE id=?1 AND user_id=?2').bind(orderId, owner).first()].filter(Boolean) } : await env.DB.prepare("SELECT * FROM report_orders WHERE user_id=?1 AND live_mode=?2 AND session_id IS NOT NULL AND status IN ('open','processing','paid','disputed') ORDER BY checked_at ASC LIMIT 8").bind(owner, paymentLiveMode(env) ? 1 : 0).all();
  if (orderId && !result.results.length) fail(404, 'Purchase not found.');
  for (const order of result.results) await reconcileOrder(env, order);
  return listPurchases(env, owner);
}
export async function cancelCheckout(env, owner, orderId) {
  if (!validId(orderId)) fail(400, 'Invalid purchase reference.');
  let order = await env.DB.prepare('SELECT * FROM report_orders WHERE id=?1 AND user_id=?2').bind(orderId, owner).first();
  if (!order) fail(404, 'Purchase not found.');
  if (order.status === 'creating' && !order.session_id) fail(409, 'Checkout is being prepared. Retry opening checkout before cancelling.');
  if (order.session_id) order = await reconcileOrder(env, order);
  if (order?.status === 'open') { await stripe(env, `checkout/sessions/${order.session_id}/expire`, { method: 'POST', form: {}, idempotencyKey: 'cancel-' + order.id }); order = await reconcileOrder(env, order); }
  if (order?.status === 'processing') fail(409, 'A payment is processing. Wait for its outcome before deleting the report.');
  return { cancelled: order?.status === 'expired', status: order?.status };
}
export async function protectPendingDeletion(env, owner, assessmentId) {
  const row = await env.DB.prepare("SELECT id FROM report_orders WHERE user_id=?1 AND (?2 IS NULL OR assessment_id=?2) AND status IN ('creating','open','processing') LIMIT 1").bind(owner, assessmentId || null).first();
  if (row) fail(409, 'An unfinished checkout is linked to this data. Use Purchases to check or cancel it before deleting.');
}

function safeEqual(a, b) { if (a.length !== b.length) return false; let diff = 0; for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i); return diff === 0; }
async function webhookText(request) {
  if (Number(request.headers.get('content-length')) > 262144 || !request.body) fail(400, 'Invalid event.');
  const reader = request.body.getReader(), chunks = []; let size = 0;
  while (true) { const { done, value } = await reader.read(); if (done) break; size += value.length; if (size > 262144) { await reader.cancel(); fail(400, 'Invalid event.'); } chunks.push(value); }
  const bytes = new Uint8Array(size); let offset = 0; for (const c of chunks) { bytes.set(c, offset); offset += c.length; } return new TextDecoder().decode(bytes);
}
export async function handleStripeWebhook(request, env) {
  try {
    if (request.method !== 'POST') return Response.json({ error: 'Method not allowed.' }, { status: 405 });
    if (!env.STRIPE_WEBHOOK_SECRET || !env.DB) return Response.json({ error: 'Payments unavailable.' }, { status: 503 });
    const text = await webhookText(request), parts = (request.headers.get('stripe-signature') || '').split(',').map(x => x.split('='));
    const timestamps = parts.filter(([k]) => k === 't'), signatures = parts.filter(([k,v]) => k === 'v1' && /^[a-f0-9]{64}$/.test(v || '')).map(([,v])=>v);
    if (timestamps.length !== 1 || !/^\d+$/.test(timestamps[0][1]) || Math.abs(Date.now() / 1000 - Number(timestamps[0][1])) > 300 || !signatures.length) fail(400, 'Invalid signature.');
    const key = await crypto.subtle.importKey('raw', enc.encode(env.STRIPE_WEBHOOK_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const signed = await crypto.subtle.sign('HMAC', key, enc.encode(timestamps[0][1] + '.' + text));
    const expected = Array.from(new Uint8Array(signed), x => x.toString(16).padStart(2, '0')).join('');
    if (!signatures.some(s => safeEqual(s, expected))) fail(400, 'Invalid signature.');
    let event; try { event = JSON.parse(text); } catch { fail(400, 'Invalid event.'); }
    if (!/^evt_[a-zA-Z0-9]+$/.test(event.id || '') || !event.data?.object || typeof event.livemode !== 'boolean') fail(400, 'Invalid event.');
    const object = event.data.object; let order;
    if (['checkout.session.completed','checkout.session.async_payment_succeeded','checkout.session.async_payment_failed','checkout.session.expired'].includes(event.type)) {
      if (!validSession(object.id)) fail(400, 'Invalid checkout.');
      order = await env.DB.prepare('SELECT * FROM report_orders WHERE session_id=?1').bind(object.id).first();
      // A very fast notification can arrive before createCheckout stores the session ID.
      if (!order && validId(object.metadata?.order_id)) { order = await env.DB.prepare('SELECT * FROM report_orders WHERE id=?1').bind(object.metadata.order_id).first(); if (order && !order.session_id) fail(503, 'Checkout is still being prepared. Retry this event.'); }
    } else if (['charge.refunded','charge.dispute.created','charge.dispute.closed','charge.dispute.updated'].includes(event.type)) {
      const intent = typeof object.payment_intent === 'object' ? object.payment_intent?.id : object.payment_intent;
      if (typeof intent === 'string' && /^pi_[a-zA-Z0-9]+$/.test(intent)) order = await env.DB.prepare('SELECT * FROM report_orders WHERE payment_intent_id=?1').bind(intent).first();
    }
    if (order && Number(event.livemode) === order.live_mode) await reconcileOrder(env, order);
    return Response.json({ received: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    // No raw events, card details, health information or provider errors in logs.
    return Response.json({ error: error instanceof PaymentError && error.status === 400 ? error.message : 'Event processing incomplete. Retry later.' }, { status: error instanceof PaymentError && error.status === 400 ? 400 : 503 });
  }
}
