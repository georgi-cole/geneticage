import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { randomBytes, randomUUID, createHmac } from 'node:crypto';
import { handleAccountApi, CONSENT_VERSION } from './lib/account-api.mjs';
import { handleStripeWebhook, paymentConfiguration } from './lib/payments.mjs';
import { sampleAnswers, sampleLabs } from './public/model.mjs';

const db=new DatabaseSync(':memory:');db.exec('PRAGMA foreign_keys=ON');for(const f of readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())db.exec(readFileSync('drizzle/'+f,'utf8'));
function prepared(sql,values=[]){return {bind(...args){return prepared(sql,args);},async first(){return db.prepare(sql).get(...values)??null;},async all(){return {results:db.prepare(sql).all(...values)};},async run(){return {meta:{changes:Number(db.prepare(sql).run(...values).changes)}};}};}
const env={DB:{prepare:prepared,async batch(statements){db.exec('BEGIN');try{const results=[];for(const s of statements)results.push(await s.run());db.exec('COMMIT');return results;}catch(e){db.exec('ROLLBACK');throw e;}}},ASSESSMENT_ENCRYPTION_KEY:randomBytes(32).toString('base64'),PAYMENTS_ENABLED:'true',PAYMENT_WEBHOOK_READY:'true',STRIPE_MODE:'test',STRIPE_SECRET_KEY:'sk_test_fixture_only',STRIPE_WEBHOOK_SECRET:'whsec_fixture_only',STRIPE_REPORT_PRICE_ID:'price_fixture',PUBLIC_SITE_ORIGIN:'https://site.test'};
assert.equal(paymentConfiguration(env).enabled,true);assert.equal(paymentConfiguration({...env,PAYMENT_WEBHOOK_READY:'false'}).enabled,false);
const users={a:{userId:'a'},b:{userId:'b'}},tokens={},sessions=new Map(),requests=[],idempotent=new Map();let counter=0;
const originalFetch=globalThis.fetch;
globalThis.fetch=async(url,options={})=>{
  assert.ok(String(url).startsWith('https://api.stripe.com/v1/'));requests.push({url:String(url),body:options.body});
  const path=String(url).replace('https://api.stripe.com/v1/','').split('?')[0];
  if(path==='prices/price_fixture')return Response.json({id:'price_fixture',active:true,type:'one_time',unit_amount:799,currency:'usd',livemode:false});
  if(path==='checkout/sessions'&&options.method==='POST'){
    const key=options.headers['Idempotency-Key'];if(idempotent.has(key))return Response.json(idempotent.get(key));
    const form=new URLSearchParams(options.body);assert.equal(form.get('line_items[0][price]'),'price_fixture');assert.equal(form.get('line_items[0][quantity]'),'1');assert.equal(form.get('mode'),'payment');
    assert.deepEqual([...form.keys()].filter(k=>k.startsWith('metadata')),['metadata[order_id]']);assert.ok(!String(options.body).includes('Bulgaria'));assert.ok(!String(options.body).includes('creatinine'));assert.ok(!form.has('customer_email'));
    const id='cs_test_fixtureSession'+(++counter);const result={id,livemode:false,url:'https://checkout.stripe.com/c/pay/'+id,client_reference_id:form.get('client_reference_id'),metadata:{order_id:form.get('metadata[order_id]')},mode:'payment',line_items:{data:[{price:{id:'price_fixture',unit_amount:799,currency:'usd'},quantity:1}],has_more:false},currency:'usd',amount_subtotal:799,amount_total:799,status:'open',payment_status:'unpaid',payment_intent:null};sessions.set(id,result);idempotent.set(key,result);return Response.json(result);
  }
  if(path.endsWith('/expire')){const session=sessions.get(path.split('/')[2]);session.status='expired';return Response.json(session);}
  if(path.startsWith('checkout/sessions/')){const session=sessions.get(path.split('/')[2]);assert.ok(session);return Response.json(session);}
  if(path==='disputes')return Response.json({data:[{status:disputeStatus}],has_more:false});
  throw Error('Unexpected provider request '+path);
};
async function call(who,path,method='GET',data){const request=new Request('https://site.test/api/'+path,{method,headers:method==='GET'?{}:{Origin:'https://site.test','Content-Type':'application/json','X-KQ-CSRF':tokens[who]||''},...(data===undefined?{}:{body:JSON.stringify(data)})});const r=await handleAccountApi(request,env,users[who]);return {status:r.status,data:await r.json()};}
async function webhook(type,object,{timestamp=Math.floor(Date.now()/1000),badSignature=false,live=false}={}){const text=JSON.stringify({id:'evt_fixture'+Math.random().toString(36).slice(2),type,livemode:live,data:{object}});const signature=createHmac('sha256',env.STRIPE_WEBHOOK_SECRET).update(timestamp+'.'+text).digest('hex');return handleStripeWebhook(new Request('https://site.test/api/payments/webhook',{method:'POST',headers:{'Stripe-Signature':`t=${timestamp},v1=${badSignature?'0'.repeat(64):signature}`},body:text}),env);}
function paid(session){session.status='complete';session.payment_status='paid';session.payment_intent={id:'pi_fixture'+counter,status:'succeeded',currency:'usd',amount_received:799,latest_charge:{id:'ch_fixture'+counter,paid:true,captured:true,livemode:false,currency:'usd',amount:799,amount_refunded:0,refunded:false,disputed:false,receipt_url:'https://pay.stripe.com/receipts/fixture'}};}
let disputeStatus='needs_response';
try{
for(const who of ['a','b']){tokens[who]=(await call(who,'session')).data.csrf;assert.equal((await call(who,'account','POST',{name:'Payment test',adult:true,consent:true,consentVersion:CONSENT_VERSION})).status,201);}
const id=randomUUID(),entry={id,answers:sampleAnswers,lab:sampleLabs(),labAge:'45',labDate:'2026-11-01',labSubmitted:true,labContext:true,labFasting:'Yes',sample:false,unlocked:true};
assert.equal((await call('a','assessments','POST',entry)).status,201);
let report=(await call('a','assessments/'+id)).data;assert.equal(report.assessment.unlocked,false);assert.equal(report.report.full,false);assert.equal(report.report.priorities.length,1);
assert.equal((await call('b','payments/checkout','POST',{assessmentId:id,confirm:true})).status,404);
env.PAYMENTS_ENABLED='false';assert.equal((await call('a','payments/checkout','POST',{assessmentId:id,confirm:true})).status,503);env.PAYMENTS_ENABLED='true';
const purchase=await call('a','payments/checkout','POST',{assessmentId:id,confirm:true});assert.equal(purchase.status,200);assert.match(purchase.data.url,/^https:\/\/checkout.stripe.com/);
const orderId=purchase.data.orderId,session=[...sessions.values()][0];
const second=await call('a','payments/checkout','POST',{assessmentId:id,confirm:true});assert.equal(second.data.orderId,orderId);assert.equal(sessions.size,1);
assert.equal((await call('a','assessments/'+id,'DELETE',{confirm:true})).status,409);
assert.equal((await call('b','payments/refresh','POST',{orderId})).status,404);
assert.equal((await call('a','payments/refresh','POST',{orderId})).data.purchases[0].status,'open');
assert.equal((await webhook('checkout.session.completed',session,{badSignature:true})).status,400);
assert.equal((await webhook('checkout.session.completed',session,{timestamp:Math.floor(Date.now()/1000)-301})).status,400);
// A completed but unpaid checkout is not access.
session.status='complete';session.payment_status='unpaid';assert.equal((await webhook('checkout.session.completed',session)).status,200);assert.equal((await call('a','assessments/'+id+'/report')).data.report.full,false);
paid(session);
// Wrong price/amount and a different live mode cannot grant access.
session.amount_subtotal=1;assert.equal((await webhook('checkout.session.completed',session)).status,503);session.amount_subtotal=799;
assert.equal((await webhook('checkout.session.completed',session,{live:true})).status,200);assert.equal((await call('a','assessments/'+id+'/report')).data.report.full,false);
assert.equal((await webhook('checkout.session.completed',session)).status,200);assert.equal((await webhook('checkout.session.completed',session)).status,200);
report=(await call('a','assessments/'+id)).data;assert.equal(report.report.full,true);assert.equal(report.report.access.testOnly,true);assert.ok(report.report.priorities.length>1);assert.equal((await call('b','assessments/'+id+'/report')).status,404);
assert.equal((await call('a','payments/checkout','POST',{assessmentId:id,confirm:true})).data.purchased,true);assert.equal(sessions.size,1);
const exportData=(await call('a','account/export')).data;assert.equal(exportData.purchases.length,1);assert.equal(exportData.assessments[0].report.full,true);
// Partial refund retains access. Full refund revokes it, including after stale completion events.
session.payment_intent.latest_charge.amount_refunded=100;assert.equal((await webhook('charge.refunded',{payment_intent:session.payment_intent.id})).status,200);assert.equal((await call('a','assessments/'+id+'/report')).data.report.full,true);
session.payment_intent.latest_charge.amount_refunded=799;session.payment_intent.latest_charge.refunded=true;assert.equal((await webhook('charge.refunded',{payment_intent:session.payment_intent.id})).status,200);assert.equal((await webhook('checkout.session.completed',session)).status,200);assert.equal((await call('a','assessments/'+id+'/report')).data.report.full,false);
// A fresh order after a refund can be bought again and has a separate session.
const again=await call('a','payments/checkout','POST',{assessmentId:id,confirm:true});assert.equal(again.status,200);const session2=[...sessions.values()][1];paid(session2);assert.equal((await call('a','payments/refresh','POST',{orderId:again.data.orderId})).status,200);
session2.payment_intent.latest_charge.disputed=true;assert.equal((await webhook('charge.dispute.created',{payment_intent:session2.payment_intent.id})).status,200);assert.equal((await call('a','assessments/'+id+'/report')).data.report.full,false);disputeStatus='won';assert.equal((await webhook('charge.dispute.closed',{payment_intent:session2.payment_intent.id})).status,200);assert.equal((await call('a','assessments/'+id+'/report')).data.report.full,true);
// Test purchases never grant live entitlements.
env.STRIPE_MODE='live';assert.equal((await call('a','assessments/'+id+'/report')).data.report.full,false);env.STRIPE_MODE='test';
const id2=randomUUID();await call('a','assessments','POST',{...entry,id:id2});const cancel=await call('a','payments/checkout','POST',{assessmentId:id2,confirm:true});assert.equal((await call('a','payments/cancel','POST',{orderId:cancel.data.orderId})).data.cancelled,true);
assert.equal((await call('a','account','DELETE',{confirm:'DELETE'})).status,200);assert.equal(db.prepare('SELECT count(*) n FROM report_orders WHERE user_id=?').get('a').n,0);
console.log('Passed: disabled-payment gate, ownership, server price, retry-safe checkout, signed notifications, timestamp/replay handling, unpaid/underpaid/mode checks, paid report access, refunds, disputes, receipts/export, test/live separation, cancellation and deletion. No real Stripe account or card was used.');
}finally{globalThis.fetch=originalFetch;db.close();}
