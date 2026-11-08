import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { randomBytes, randomUUID, createHmac } from 'node:crypto';
import { handleAccountApi, CONSENT_VERSION } from './lib/account-api.mjs';
import { handleStripeWebhook, paymentConfiguration } from './lib/payments.mjs';
import { renderFullReportPdf } from './lib/report-pdf.mjs';
import { PDFDocument } from 'pdf-lib';
import { sampleAnswers, sampleLabs } from './public/model.mjs';
import { SPECIALIST_CONSENT_VERSION } from './public/report-products.mjs';
import { systemSampleInputs } from './public/system-assessments.mjs';

const db=new DatabaseSync(':memory:');db.exec('PRAGMA foreign_keys=ON');for(const f of readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())db.exec(readFileSync('drizzle/'+f,'utf8'));
function prepared(sql,values=[]){return {bind(...args){return prepared(sql,args);},async first(){return db.prepare(sql).get(...values)??null;},async all(){return {results:db.prepare(sql).all(...values)};},async run(){return {meta:{changes:Number(db.prepare(sql).run(...values).changes)}};}};}
const env={DB:{prepare:prepared,async batch(statements){db.exec('BEGIN');try{const results=[];for(const s of statements)results.push(await s.run());db.exec('COMMIT');return results;}catch(e){db.exec('ROLLBACK');throw e;}}},ASSESSMENT_ENCRYPTION_KEY:randomBytes(32).toString('base64'),PAYMENTS_ENABLED:'true',PAYMENT_WEBHOOK_READY:'true',STRIPE_MODE:'test',STRIPE_SECRET_KEY:'sk_test_fixture_only',STRIPE_WEBHOOK_SECRET:'whsec_fixture_only',STRIPE_REPORT_PRICE_ID:'price_fixture',PUBLIC_SITE_ORIGIN:'https://site.test'};
assert.equal(paymentConfiguration(env).enabled,true);assert.equal(paymentConfiguration({...env,PAYMENT_WEBHOOK_READY:'false'}).enabled,false);
const users=Object.fromEntries(['a','b','c','d'].map(userId=>[userId,{userId}]));
const tokens={},sessions=new Map(),idempotent=new Map(),prices=new Map();let counter=0;
prices.set('price_fixture',{id:'price_fixture',active:true,type:'one_time',unit_amount:799,currency:'usd',livemode:false});
const originalFetch=globalThis.fetch;
globalThis.fetch=async(url,options={})=>{
  assert.ok(String(url).startsWith('https://api.stripe.com/v1/'));
  assert.equal(options.redirect,'manual');
  const path=String(url).replace('https://api.stripe.com/v1/','').split('?')[0];
  if(path==='prices/price_fixture')return Response.json(prices.get('price_fixture'));
  if(path==='prices'&&options.method==='POST'){
    const key=options.headers['Idempotency-Key'];
    if(idempotent.has(key))return Response.json(idempotent.get(key));
    const form=new URLSearchParams(options.body);
    assert.deepEqual([...form.keys()],['product','unit_amount','currency']);
    assert.equal(form.get('product'),'prod_fixture');
    const price={id:'price_quote'+(prices.size+1),product:form.get('product'),active:true,type:'one_time',unit_amount:Number(form.get('unit_amount')),currency:form.get('currency'),livemode:false};
    prices.set(price.id,price);idempotent.set(key,price);return Response.json(price);
  }
  if(path==='checkout/sessions'&&options.method==='POST'){
    const key=options.headers['Idempotency-Key'];if(idempotent.has(key))return Response.json(idempotent.get(key));
    const form=new URLSearchParams(options.body),price=prices.get(form.get('line_items[0][price]'));assert.ok(price);assert.equal(form.get('line_items[0][quantity]'),'1');assert.equal(form.get('mode'),'payment');
    assert.deepEqual([...form.keys()].filter(k=>k.startsWith('metadata')),['metadata[order_id]']);assert.ok(!String(options.body).includes('Bulgaria'));assert.ok(!String(options.body).includes('creatinine'));assert.ok(!form.has('customer_email'));
    const id='cs_test_fixtureSession'+(++counter);const result={id,livemode:false,url:'https://checkout.stripe.com/c/pay/'+id,client_reference_id:form.get('client_reference_id'),metadata:{order_id:form.get('metadata[order_id]')},mode:'payment',line_items:{data:[{price,quantity:1}],has_more:false},currency:price.currency,amount_subtotal:price.unit_amount,amount_total:price.unit_amount,status:'open',payment_status:'unpaid',payment_intent:null};sessions.set(id,result);idempotent.set(key,result);return Response.json(result);
  }
  if(path.endsWith('/expire')){const session=sessions.get(path.split('/')[2]);session.status='expired';return Response.json(session);}
  if(path.startsWith('checkout/sessions/')){const session=sessions.get(path.split('/')[2]);assert.ok(session);return Response.json(session);}
  if(path==='disputes')return Response.json({data:[{status:disputeStatus}],has_more:false});
  throw Error('Unexpected provider request '+path);
};
async function call(who,path,method='GET',data){const request=new Request('https://site.test/api/'+path,{method,headers:method==='GET'?{}:{Origin:'https://site.test','Content-Type':'application/json','X-KQ-CSRF':tokens[who]||''},...(data===undefined?{}:{body:JSON.stringify(data)})});const r=await handleAccountApi(request,env,users[who]);return {status:r.status,data:await r.json()};}
const fontBytes=readFileSync(new URL('./public/assets/fonts/manrope-report.ttf',import.meta.url));
const pdf=(who,id,lang='en')=>handleAccountApi(new Request('https://site.test/api/assessments/'+id+'/full-report.pdf?lang='+lang),env,users[who],{
  renderPdf:(content,language)=>renderFullReportPdf(content,{language,fontBytes}),
});
async function webhook(type,object,{timestamp=Math.floor(Date.now()/1000),badSignature=false,live=false}={}){const text=JSON.stringify({id:'evt_fixture'+Math.random().toString(36).slice(2),type,livemode:live,data:{object}});const signature=createHmac('sha256',env.STRIPE_WEBHOOK_SECRET).update(timestamp+'.'+text).digest('hex');return handleStripeWebhook(new Request('https://site.test/api/payments/webhook',{method:'POST',headers:{'Stripe-Signature':`t=${timestamp},v1=${badSignature?'0'.repeat(64):signature}`},body:text}),env);}
function paid(session){const {currency,amount_total:amount}=session;session.status='complete';session.payment_status='paid';session.payment_intent={id:'pi_fixture'+counter,status:'succeeded',currency,amount_received:amount,latest_charge:{id:'ch_fixture'+counter,paid:true,captured:true,livemode:false,currency,amount,amount_refunded:0,refunded:false,disputed:false,receipt_url:'https://pay.stripe.com/receipts/fixture'}};}
let disputeStatus='needs_response';
try{
for(const [who,email] of Object.entries({a:'owner@example.test',b:'other@example.test',c:'reviewer@example.test',d:'other-reviewer@example.test'})){
 tokens[who]=(await call(who,'session')).data.csrf;
 assert.equal((await call(who,'account','POST',{name:'Payment test',adult:true,consent:true,consentVersion:CONSENT_VERSION})).status,201);
 db.prepare('INSERT INTO auth_accounts (user_id,email,created_at) VALUES (?,?,?)').run(who,email,new Date().toISOString());
}
const id=randomUUID(),entry={id,answers:sampleAnswers,lab:sampleLabs(),labAge:'45',labDate:'2026-11-01',labSubmitted:true,labContext:true,labFasting:'Yes',sample:false,unlocked:true};
assert.equal((await call('a','assessments','POST',entry)).status,201);
let report=(await call('a','assessments/'+id)).data;assert.equal(report.assessment.unlocked,false);assert.equal(report.report.full,false);assert.equal(report.report.priorities.length,1);
assert.equal((await pdf('a',id)).status,403);
assert.equal((await pdf('b',id)).status,404);
assert.equal((await call('b','payments/checkout','POST',{assessmentId:id,confirm:true})).status,404);
env.PAYMENTS_ENABLED='false';assert.equal((await call('a','payments/checkout','POST',{assessmentId:id,confirm:true})).status,503);env.PAYMENTS_ENABLED='true';
const purchase=await call('a','payments/checkout','POST',{assessmentId:id,confirm:true});assert.equal(purchase.status,200);assert.equal(new URL(purchase.data.url).origin,'https://checkout.stripe.com');
const orderId=purchase.data.orderId,session=[...sessions.values()][0];
const second=await call('a','payments/checkout','POST',{assessmentId:id,confirm:true});assert.equal(second.data.orderId,orderId);assert.equal(sessions.size,1);
assert.equal((await call('a','account','DELETE',{confirm:'DELETE'})).status,409);
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
const purchasedPdf=await pdf('a',id,'bg');
assert.equal(purchasedPdf.status,200);
assert.equal(purchasedPdf.headers.get('content-type'),'application/pdf');
assert.match(purchasedPdf.headers.get('cache-control'),/no-store/);
assert.equal((await PDFDocument.load(await purchasedPdf.arrayBuffer())).getTitle(),'Пълен отчет веднага');
// Partial refund retains access. Full refund revokes it, including after stale completion events.
session.payment_intent.latest_charge.amount_refunded=100;assert.equal((await webhook('charge.refunded',{payment_intent:session.payment_intent.id})).status,200);assert.equal((await call('a','assessments/'+id+'/report')).data.report.full,true);
session.payment_intent.latest_charge.amount_refunded=799;session.payment_intent.latest_charge.refunded=true;assert.equal((await webhook('charge.refunded',{payment_intent:session.payment_intent.id})).status,200);assert.equal((await webhook('checkout.session.completed',session)).status,200);assert.equal((await call('a','assessments/'+id+'/report')).data.report.full,false);
assert.equal((await pdf('a',id)).status,403);
// A fresh order after a refund can be bought again and has a separate session.
const again=await call('a','payments/checkout','POST',{assessmentId:id,confirm:true});assert.equal(again.status,200);const session2=[...sessions.values()][1];paid(session2);assert.equal((await call('a','payments/refresh','POST',{orderId:again.data.orderId})).status,200);
session2.payment_intent.latest_charge.disputed=true;assert.equal((await webhook('charge.dispute.created',{payment_intent:session2.payment_intent.id})).status,200);assert.equal((await call('a','assessments/'+id+'/report')).data.report.full,false);disputeStatus='won';assert.equal((await webhook('charge.dispute.closed',{payment_intent:session2.payment_intent.id})).status,200);assert.equal((await call('a','assessments/'+id+'/report')).data.report.full,true);
// Test purchases never grant live entitlements.
env.STRIPE_MODE='live';assert.equal((await call('a','assessments/'+id+'/report')).data.report.full,false);env.STRIPE_MODE='test';
const id2=randomUUID();await call('a','assessments','POST',{...entry,id:id2});const cancel=await call('a','payments/checkout','POST',{assessmentId:id2,confirm:true});assert.equal((await call('a','payments/cancel','POST',{orderId:cancel.data.orderId})).data.cancelled,true);
// A quote is separate from the Instant Full Report for the same snapshot.
const reviewPath='specialist-reviews',queuePath='specialist-queue';
const sharing={assessmentId:id,country:'BG',language:'bg',question:'Fictional question about my saved assessment',consent:true,consentVersion:SPECIALIST_CONSENT_VERSION};
env.STRIPE_SPECIALIST_PRODUCT_ID='prod_fixture';
env.SPECIALIST_REVIEWERS_JSON=JSON.stringify([
 {email:'reviewer@example.test',name:'Test Reviewer',qualifications:'Fictional credentials for testing',countries:['BG']},
 {email:'other-reviewer@example.test',name:'Other Test Reviewer',qualifications:'Fictional credentials for testing',countries:['DE']},
]);
assert.equal((await call('a',reviewPath,'POST',sharing)).status,503);
assert.equal((await call('c','session')).data.specialist.reviewer,true);
env.SPECIALIST_REVIEWS_ENABLED='true';
assert.equal((await call('a',reviewPath,'POST',{...sharing,consent:false})).status,400);
assert.equal((await call('a',reviewPath,'POST',{...sharing,country:'US'})).status,400);
assert.equal((await call('b',reviewPath,'POST',sharing)).status,404);
const sampleId=randomUUID();
assert.equal((await call('a','assessments','POST',{...entry,id:sampleId,sample:true})).status,201);
assert.equal((await call('a',reviewPath,'POST',{...sharing,assessmentId:sampleId})).status,400);
const review=(await call('a',reviewPath,'POST',sharing)).data.id;
assert.ok(review);
assert.equal((await call('a',reviewPath,'POST',sharing)).data.id,review,'Retries reuse the active request');
const ownerReview=reviewPath+'/'+review,staffReview=queuePath+'/'+review;
assert.equal((await call('b',ownerReview)).status,404);
assert.equal((await call('a',queuePath)).status,403);
assert.equal((await call('a',ownerReview)).data.review.assessment,undefined);
assert.equal((await call('d',staffReview)).status,404);
assert.deepEqual((await call('d',queuePath)).data.reviews,[]);
assert.equal((await call('c',queuePath)).data.reviews[0].id,review);
const shared=(await call('c',staffReview)).data.review;
assert.equal(shared.question,sharing.question);
assert.equal(shared.assessment.age,'50');
assert.ok(shared.assessment.measurements.length>=9);
const quote={scope:'Fictional scope for this assessment',amount:4500,currency:'eur',days:4};
assert.equal((await call('a',staffReview+'/quote','POST',quote)).status,403);
assert.equal((await call('c',staffReview+'/quote','POST',{...quote,amount:'4500'})).status,400);
assert.equal((await call('c',staffReview+'/quote','POST',quote)).status,200);
assert.equal((await call('c',staffReview+'/quote','POST',quote)).status,409);
const delivered={findings:'Fictional findings',limitations:'Fictional limitations',nextSteps:'Fictional follow-up'};
assert.equal((await call('c',staffReview+'/deliver','POST',delivered)).status,409);
const quoted=(await call('a',ownerReview)).data.review;
assert.equal(quoted.quote.amount,4500);
assert.equal(quoted.quote.currency,'eur');
assert.equal(quoted.quote.name,'Test Reviewer');
assert.equal(quoted.quote.qualifications,'Fictional credentials for testing');
assert.equal(Date.parse(quoted.quote.expiresAt)-Date.parse(quoted.quote.issuedAt),7*86400000);
const storedReview=db.prepare('SELECT request,quote FROM specialist_reviews WHERE id=?').get(review);
assert.ok(!storedReview.request.includes(sharing.question));
assert.ok(!storedReview.quote.includes(quote.scope));
assert.equal((await call('b',ownerReview+'/checkout','POST',{confirm:true})).status,404);
assert.equal((await call('a',ownerReview+'/checkout','POST',{})).status,400);
const roster=env.SPECIALIST_REVIEWERS_JSON;
env.SPECIALIST_REVIEWERS_JSON='[]';
assert.equal((await call('a',ownerReview+'/checkout','POST',{confirm:true})).status,409);
env.SPECIALIST_REVIEWERS_JSON=roster;
const acceptance=await call('a',ownerReview+'/checkout','POST',{confirm:true,amount:1,currency:'usd'});
assert.equal(acceptance.status,200);
assert.notEqual(acceptance.data.orderId,again.data.orderId);
assert.equal((await call('a',ownerReview+'/checkout','POST',{confirm:true})).data.orderId,acceptance.data.orderId);
assert.equal((await call('a',ownerReview+'/withdraw','POST',{})).status,409);
const quotedSession=[...sessions.values()].at(-1);
assert.equal(quotedSession.amount_subtotal,4500);
assert.equal(quotedSession.currency,'eur');
paid(quotedSession);
assert.equal((await webhook('checkout.session.completed',quotedSession)).status,200);
assert.equal((await call('a',ownerReview)).data.review.paymentStatus,'paid');
assert.equal((await call('a',ownerReview+'/checkout','POST',{confirm:true})).data.reviewRequestId,review);
env.STRIPE_MODE='live';
assert.equal((await call('c',staffReview+'/deliver','POST',delivered)).status,409);
env.STRIPE_MODE='test';
assert.equal((await call('c',staffReview+'/deliver','POST',delivered)).status,200);
assert.equal((await call('c',staffReview)).status,404);
assert.equal((await call('a',ownerReview)).data.review.delivery.findings,delivered.findings);
assert.equal((await call('a','account/export')).data.specialistReviews[0].consentVersion,SPECIALIST_CONSENT_VERSION);
assert.ok(!db.prepare('SELECT delivery FROM specialist_reviews WHERE id=?').get(review).delivery.includes(delivered.findings));
quotedSession.payment_intent.latest_charge.amount_refunded=4500;
assert.equal((await webhook('charge.refunded',{payment_intent:quotedSession.payment_intent.id})).status,200);
assert.equal((await call('a',ownerReview)).data.review.delivery,undefined);
assert.equal((await pdf('a',id)).status,200,'Standalone entitlement survives a separate specialist refund');

const kidney=randomUUID(),kidneyEntry={id:kidney,assessmentType:'kidney',system:systemSampleInputs('kidney'),sample:false};
assert.equal((await call('a','assessments','POST',kidneyEntry)).status,201);
assert.equal((await pdf('a',kidney)).status,403);
const extra=(await call('a',reviewPath,'POST',{...sharing,assessmentId:kidney})).data.id;
assert.ok(extra);
assert.equal((await call('c',queuePath+'/'+extra+'/quote','POST',quote)).status,200);
db.prepare("UPDATE specialist_reviews SET quote_expires_at='2000-01-01T00:00:00Z' WHERE id=?").run(extra);
assert.equal((await call('a',reviewPath+'/'+extra)).data.review.status,'expired');
assert.equal((await call('a',reviewPath+'/'+extra+'/checkout','POST',{confirm:true})).status,409);
assert.equal((await call('a',reviewPath+'/'+extra+'/withdraw','POST',{})).status,200);
assert.equal((await call('c',queuePath+'/'+extra)).status,404);
const renewed=(await call('a',reviewPath,'POST',{...sharing,assessmentId:kidney})).data.id;
assert.notEqual(renewed,extra);
assert.equal((await call('c',queuePath+'/'+renewed+'/quote','POST',quote)).status,200);
const kidneyOrder=await call('a',reviewPath+'/'+renewed+'/checkout','POST',{confirm:true});
assert.equal(kidneyOrder.status,200);
const kidneySession=[...sessions.values()].at(-1);
paid(kidneySession);
assert.equal((await webhook('checkout.session.completed',kidneySession)).status,200);
assert.equal((await pdf('a',kidney)).status,200,'A verified review purchase includes the instant PDF');
assert.equal((await call('a','payments/checkout','POST',{assessmentId:kidney,confirm:true})).data.purchased,true);
assert.equal((await call('a',reviewPath+'/'+renewed+'/withdraw','POST',{})).status,200);
assert.equal((await call('c',queuePath+'/'+renewed)).status,404);
env.SPECIALIST_REVIEWS_ENABLED='false';
assert.equal((await call('a',reviewPath,'POST',{...sharing,assessmentId:kidney})).status,503);
assert.equal((await call('a',ownerReview)).status,200,'Existing account records remain available when intake closes');
assert.equal((await call('a','account','DELETE',{confirm:'DELETE'})).status,200);assert.equal(db.prepare('SELECT count(*) n FROM report_orders WHERE user_id=?').get('a').n,0);
assert.equal(db.prepare('SELECT count(*) n FROM specialist_reviews WHERE user_id=?').get('a').n,0);
console.log('Passed: instant and specialist checkout, scoped consent and reviewer access, server prices, verified PDFs and written delivery, expiry, refunds, disputes, test/live separation, cancellation, export and deletion with a simulated provider.');
}finally{globalThis.fetch=originalFetch;db.close();}
