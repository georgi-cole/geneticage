import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { sampleAnswers, sampleLabs, normalizeLab, calculatePhenoAge, insights } from './public/model.mjs';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const id=randomUUID(),orderId=randomUUID(),clinical={x:normalizeLab(sampleLabs()),value:calculatePhenoAge(45,normalizeLab(sampleLabs()))};clinical.gap=clinical.value-45;
const assessment={id,saved:new Date().toISOString(),answers:sampleAnswers,lab:sampleLabs(),labAge:'45',labDate:'2026-11-01',labSubmitted:true,labContext:true,labFasting:'Yes',sample:false,unlocked:true,model:'clinical-phenoage-2018-demo-v1',value:clinical.value};
const report={version:'educational-report-v1',clinical,priorities:insights(sampleAnswers),full:true,access:{purchased:true,testOnly:true}};
const purchase={id:orderId,assessmentId:id,status:'paid',amount:799,currency:'usd',testOnly:true,created:assessment.saved,paid:assessment.saved,receiptUrl:'https://pay.stripe.com/receipts/fixture'};
try{
const context=await browser.newContext({viewport:{width:375,height:850}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('**/api/**',async route=>{const path=new URL(route.request().url()).pathname;let data;
if(path==='/api/session')data={authenticated:true,csrf:'fixture',profile:{name:'Purchased report fixture',consentAt:assessment.saved},payments:{enabled:true,mode:'test',label:'US$7.99'}};
else if(path==='/api/assessments')data={assessments:[assessment]};else if(path==='/api/purchases'||path==='/api/payments/refresh')data={purchases:[purchase]};else if(path==='/api/assessments/'+id)data={assessment,report};else throw Error('Unexpected fixture route '+path);
await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});});
await page.goto('http://127.0.0.1:5173/#purchases');await page.getByRole('button',{name:'Read purchased report'}).click();await page.getByRole('heading',{name:'Your assessment report'}).waitFor();await page.getByLabel('Report chapter').selectOption({label:'Your blood entries'});await page.getByRole('heading',{name:'Your blood entries'}).waitFor();assert.equal(await page.locator('.report-page:not([hidden]) .report-table tbody tr').count(),9);assert.ok(await page.getByRole('button',{name:'Print / PDF',exact:true}).count()>0);await page.emulateMedia({media:'print'});assert.equal(await page.locator('.report-page:visible').count(),await page.locator('.report-page').count());await page.emulateMedia({media:'screen'});assert.equal(await page.locator('[data-action=checkout]').count(),0);
await page.screenshot({path:'../account-qa/mobile-purchased-report-fixture.png',fullPage:true});assert.deepEqual(errors,[]);
console.log('Passed: purchased-report library, full report display, 9 blood-marker rows and print controls using API fixtures. No payment occurred.');
}finally{await browser.close();}
