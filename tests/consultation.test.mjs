import assert from 'node:assert/strict';
import {test,after} from 'node:test';
import {JSDOM} from 'jsdom';
import {advanceContactPage,clearContactFeedback,showContactPage,validateContactPage} from '../public/consultation-feedback.mjs';

const dom=new JSDOM(`<!doctype html><form id="consult-form" novalidate data-page="0">
 <section class="consult-page"><p id="email-help">Contact details</p>
 <input id="contact-email" type="email" required aria-describedby="email-help">
 <input id="contact-country" required><select id="contact-reason" required><option value="">Select a topic</option><option value="blood">Blood results</option></select></section>
 <section class="consult-page" hidden><input id="contact-name"><input id="disabled-field" required disabled></section>
 <section class="consult-page" hidden><label class="checkline"><input id="contact-consent" type="checkbox" required></label></section>
 <button data-direction="-1" type="button" disabled>Back</button><span class="consult-page-count">1 / 3</span><button data-direction="1" type="button">Continue</button></form>
 <input id="outside" aria-invalid="true" aria-describedby="unrelated">`,{url:'https://app.test/'});
const {window}=dom;
Object.defineProperty(globalThis,'document',{configurable:true,value:window.document});
const form=document.querySelector('form'),$=selector=>document.querySelector(selector);
after(()=>window.close());

test('Continue blocks missing/partial input with one inline error per field and no native validation event',()=>{
 let invalidEvents=0;form.addEventListener('invalid',()=>invalidEvents++,true);
 $('#contact-email').value='g';
 assert.equal(advanceContactPage(form,1),false);assert.equal(form.dataset.page,'0');
 assert.equal(document.activeElement,$('#contact-email'));
 assert.equal($('#contact-email-error').textContent,'Enter a complete email address, for example name@example.com.');
 assert.equal($('#contact-email').getAttribute('aria-describedby'),'email-help contact-email-error');
 assert.equal(form.querySelectorAll('[role=alert]').length,3);
 validateContactPage(form,0);assert.equal(form.querySelectorAll('[role=alert]').length,3);
 assert.equal(invalidEvents,0,'Reading validity must not call reportValidity/checkValidity or open browser popovers.');
});

test('editing clears only that field and preserves authored help and other errors',()=>{
 const email=$('#contact-email');email.value='preview@example.com';clearContactFeedback(email);
 assert.equal($('#contact-email-error'),null);assert.equal(email.getAttribute('aria-invalid'),null);
 assert.equal(email.getAttribute('aria-describedby'),'email-help');
 assert.ok($('#contact-country-error'));
 clearContactFeedback($('#outside'));assert.equal($('#outside').getAttribute('aria-describedby'),'unrelated');
 assert.equal($('#outside').getAttribute('aria-invalid'),'true');
});

test('forward/back navigation retains original inputs; optional/disabled fields do not block',()=>{
 const email=$('#contact-email');$('#contact-country').value='България';$('#contact-reason').value='blood';
 assert.equal(advanceContactPage(form,1),true);assert.equal(form.dataset.page,'1');
 assert.equal($('.consult-page-count').textContent,'2 / 3');assert.equal(document.activeElement,$('#contact-name'));
 $('#contact-name').value='Example';assert.equal(advanceContactPage(form,-1),true);
 assert.equal($('#contact-email'),email);assert.equal(email.value,'preview@example.com');
 assert.equal($('#contact-country').value,'България');assert.equal($('#contact-reason').value,'blood');
 assert.equal(advanceContactPage(form,1),true);assert.equal($('#contact-name').value,'Example');
 assert.equal(advanceContactPage(form,1),true);assert.equal(form.dataset.page,'2');
 assert.equal($('[data-direction="1"]').hidden,true);assert.equal(validateContactPage(form,2),false);
 assert.ok($('#contact-consent-error'));$('#contact-consent').checked=true;
 assert.equal(validateContactPage(form,2),true);assert.equal($('#contact-consent-error'),null);
});

test('out-of-range page requests are bounded and missing pages cannot validate',()=>{
 showContactPage(form,99,{focus:false});assert.equal(form.dataset.page,'2');
 showContactPage(form,-99,{focus:false});assert.equal(form.dataset.page,'0');
 assert.equal($('[data-direction="-1"]').disabled,true);assert.equal($('[data-direction="1"]').hidden,false);
 assert.equal(form.querySelectorAll('.consult-page:not([hidden])').length,1);
 assert.equal(validateContactPage(form,99),false);
});
