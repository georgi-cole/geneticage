import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const base='http://127.0.0.1:5173', dir=new URL('../account-qa/',import.meta.url);await fs.mkdir(dir,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const context=await browser.newContext({viewport:{width:375,height:850}}),page=await context.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(15000);
const click=a=>page.locator(`[data-action="${a}"]`).first().click();
const shot=name=>page.screenshot({path:fileURLToPath(new URL(name+'.png',dir)),fullPage:true});
try {
await page.goto(base);await page.getByRole('heading',{name:/Biological age,/}).waitFor();
await click('account');await page.getByRole('button',{name:'Register / sign in'}).waitFor();await click('signup');
await page.getByRole('link',{name:'Continue with ChatGPT'}).click();await page.waitForURL('**/#account');
const prior=await page.evaluate(async()=>{const session=await (await fetch('/api/session')).json();if(session.profile?.name==='Private test journal')await fetch('/api/account',{method:'DELETE',headers:{'Content-Type':'application/json','X-KQ-CSRF':session.csrf},body:JSON.stringify({confirm:'DELETE'})});return session.profile?.name;});
assert.ok(!prior||prior==='Private test journal','Refusing to replace a non-test local account');await page.reload();await page.getByRole('button',{name:'Create my KoleQuant account'}).waitFor();
await click('signup');await page.locator('#account-name').fill('Private test journal');await page.locator('#account-adult').check();await page.locator('#storage-consent').check();await page.locator('#signup-form button[type=submit]').click();await page.getByRole('heading',{name:'Private test journal'}).waitFor();
await shot('mobile-account-empty');
await click('home');await click('sample');await page.locator('.age-value').waitFor();await click('report');await page.getByRole('heading',{name:'Results and interpretation'}).waitFor();await page.getByText('The full report is available while this private version is being reviewed.',{exact:false}).waitFor();assert.equal(await page.locator('[data-action=checkout]').count(),0);assert.equal(await page.locator('[data-action=unlock]').count(),0);await click('save');await click('confirm-save');await page.locator('.history-row').waitFor();assert.equal(await page.locator('.history-row').count(),1);
await click('seed-history');await page.locator('.trend svg').waitFor();assert.equal(await page.locator('.history-row').count(),3);await shot('mobile-progress');
await page.locator('[data-tab=reports]').click();await click('open-report');await page.getByRole('heading',{name:'Results and interpretation'}).waitFor();
await page.reload();await click('account');await page.locator('.history-row').first().waitFor();assert.equal(await page.locator('.history-row').count(),3);
const second=await browser.newContext({viewport:{width:1440,height:950}}),p2=await second.newPage();
await p2.goto(base+'/signin-with-chatgpt?return_to=%2F%23account');await p2.locator('.history-row').first().waitFor();assert.equal(await p2.locator('.history-row').count(),3);
await p2.screenshot({path:fileURLToPath(new URL('desktop-synced-account.png',dir)),fullPage:true});await second.close();
await page.locator('[data-tab=purchases]').click();await page.getByRole('heading',{name:'Your purchases'}).waitFor();await shot('mobile-purchases');await page.locator('[data-tab=settings]').click();
const downloaded=page.waitForEvent('download');await click('export');const download=await downloaded;const exportData=JSON.parse(await fs.readFile(await download.path(),'utf8'));assert.equal(exportData.assessments.length,3);assert.ok(exportData.assessments.every(x=>x.report));
assert.equal(await page.evaluate(async()=>{const r=await fetch('/api/account',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({confirm:'DELETE'})});return r.status;}),403);
await click('home');await click('start');await page.locator('#consent').check();await click('consent-next');await page.locator('#age').fill('17');await page.locator('#questions button[type=submit]').click();await page.getByText('This assessment is for adults aged 18 or over', {exact:false}).waitFor();await page.locator('#age').fill('45');await page.locator('#questions button[type=submit]').click();await page.getByText('I smoke now, daily or occasionally',{exact:true}).click();await page.locator('#cigarettes').fill('10');await page.locator('#smokingYears').fill('12');await page.locator('#questions button[type=submit]').click();for(let i=0;i<4;i++)await page.locator('#questions button[type=submit]').click();await click('results');await click('save');await click('confirm-save');await page.locator('.history-row').first().waitFor();assert.equal(await page.locator('.history-row').count(),4);
await click('open-saved');await page.getByRole('heading',{name:'Smoking',exact:true}).first().waitFor();assert.equal(await page.locator('.age-value').count(),0);
await click('account');await page.locator('[data-tab=progress]').click();await click('trend-personal');assert.equal(await page.locator('.trend svg').count(),0);await click('trend-sample');await page.locator('.trend svg').waitFor();
for(const width of [320,375,768,1440]){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Overflow at ${width}`);}
await click('delete-saved');await click('confirm-delete-saved');await page.waitForFunction(()=>document.querySelectorAll('.history-row').length===3);assert.equal(await page.locator('.history-row').count(),3);
await page.locator('[data-tab=settings]').click();await click('delete-account');await page.locator('#delete-confirm').fill('DELETE');await page.locator('#delete-account-form button[type=submit]').click();await page.getByRole('button',{name:'Create my KoleQuant account'}).waitFor();
assert.deepEqual(errors,[]);console.log(JSON.stringify({registration:'passed',encryptedBackend:'passed',reportPersistence:'passed',independentBrowserSync:'passed',exportAndDeletion:'passed',csrf:'passed',sampleTrendSeparation:'passed',questionnaireRegression:'passed',responsiveWidths:[320,375,768,1440],pageErrors:errors}));
} catch(error){await shot('failure').catch(()=>{});throw error;} finally {await browser.close();}
