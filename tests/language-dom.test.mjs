import assert from 'node:assert/strict';
import {test,after} from 'node:test';
import {JSDOM} from 'jsdom';
import {initializeLanguage,LANGUAGE_KEY} from '../public/language-system.mjs';

// A DOM implementation exercises event and mutation behavior without a browser,
// network access, authentication, saved records or a running application server.
const dom=new JSDOM(`<!doctype html><html lang="en"><head><title>Your report</title></head><body>
 <button id="language-toggle" data-no-translate>EN</button>
 <div class="brand">KoleQuant Age</div><h1>Your health, in context.</h1>
 <form id="answers"><label for="age">How old are you?</label><input id="age" type="number" value="52" placeholder="Years" aria-label="How old are you?">
 <input id="country" value="България"><textarea id="notes">Fair</textarea>
 <select id="health"><option>Fair</option><option selected>Good</option></select>
 <select id="units"><option>cm</option><option selected>in</option></select>
 <input type="radio" name="smoking" value="Smoke now" checked><input type="checkbox" value="None" checked>
 <select id="profile"><option data-user-prefix="Fair">Fair (2 assessments)</option></select></form>
 <h2 data-no-translate>Fair</h2><span data-count-to="50">24</span>
 <section id="dynamic"></section><input id="native-email" type="email" required>
 <form id="consult-form"><input id="contact-email" type="email" required></form>
 </body></html>`,{url:'https://app.test/'});
const {window}=dom;
for(const key of ['window','document','NodeFilter','MutationObserver','CustomEvent','localStorage'])Object.defineProperty(globalThis,key,{configurable:true,value:key==='window'?window:window[key]});
document.documentElement.dataset.theme='blood-moon';
const language=initializeLanguage(),$=selector=>document.querySelector(selector);
const flush=()=>new Promise(resolve=>setImmediate(resolve));
after(()=>window.close());

test('EN/БГ changes captions in place while keeping every answer and canonical option value',async()=>{
 const input=$('#age'),select=$('#health'),form=$('#answers');
 let themeEvents=0;window.addEventListener('kq:theme-change',()=>themeEvents++);
 $('#language-toggle').click();await flush();
 assert.equal(document.documentElement.lang,'bg');assert.equal(document.title,'Вашият доклад');
 assert.equal($('h1').textContent,'Здравето ви отблизо');assert.equal($('#age').placeholder,'Години');
 assert.equal($('#age').getAttribute('aria-label'),'На колко години сте?');
 assert.equal($('#language-toggle').getAttribute('aria-label'),'Превключете на английски');
 assert.equal($('#age'),input);assert.equal($('#health'),select);assert.equal($('#answers'),form);
 assert.equal(input.value,'52');assert.equal($('#country').value,'България');assert.equal($('#notes').value,'Fair');
 assert.equal(select.value,'Good');assert.equal(select.selectedOptions[0].textContent,'Добро');
 assert.equal($('#units').value,'in');assert.equal($('input[type=radio]:checked').value,'Smoke now');
 assert.equal($('input[type=checkbox]:checked').value,'None');
 assert.equal($('#profile').value,'Fair (2 assessments)');assert.equal($('#profile option').textContent,'Fair (2 анализа)');
 assert.equal($('h2').textContent,'Fair');assert.equal($('[data-count-to]').textContent,'24');
 assert.equal(document.documentElement.dataset.theme,'blood-moon');assert.equal(themeEvents,0);
 assert.equal(localStorage.getItem(LANGUAGE_KEY),'bg');
 $('#language-toggle').click();await flush();
 assert.equal(document.documentElement.lang,'en');assert.equal(document.title,'Your report');
 assert.equal($('h1').textContent,'Your health, in context.');assert.equal(input.placeholder,'Years');
 assert.equal(input.getAttribute('aria-label'),'How old are you?');
 assert.equal(select.value,'Good');assert.equal(select.selectedOptions[0].textContent,'Good');
 assert.equal($('#profile option').textContent,'Fair (2 assessments)');assert.equal(input.value,'52');
});

test('new report content and accessible attributes translate through the mutation observer',async()=>{
 language.setLanguage('bg');
 $('#dynamic').innerHTML='<p>New assessment</p><input aria-label="Your age at the blood draw" placeholder="Years">';
 await flush();
 assert.equal($('#dynamic p').textContent,'Нов анализ');
 assert.equal($('#dynamic input').placeholder,'Години');
 assert.equal($('#dynamic input').getAttribute('aria-label'),'Възраст при вземане на пробата');
 $('#dynamic p').textContent='Your report is ready.';await flush();
 assert.equal($('#dynamic p').textContent,'Докладът ви е готов.');
 language.setLanguage('en');await flush();
 assert.equal($('#dynamic p').textContent,'Your report is ready.');
 assert.equal($('#dynamic input').getAttribute('aria-label'),'Your age at the blood draw');
});

test('other-tab preference updates display without writing a storage echo',async()=>{
 localStorage.setItem(LANGUAGE_KEY,'en');
 window.dispatchEvent(new window.StorageEvent('storage',{key:LANGUAGE_KEY,newValue:'bg'}));await flush();
 assert.equal(language.language,'bg');assert.equal(localStorage.getItem(LANGUAGE_KEY),'en');
 window.dispatchEvent(new window.StorageEvent('storage',{key:LANGUAGE_KEY,newValue:null}));await flush();
 assert.equal(language.language,'en');assert.equal($('#health').value,'Good');
});

test('typing and language changes never validate; explicit native feedback clears on editing',async()=>{
 const input=$('#native-email'),contact=$('#contact-email');
 language.setLanguage('bg');input.value='g';input.dispatchEvent(new window.Event('input',{bubbles:true}));
 assert.equal(input.validity.customError,false);
 language.setLanguage('en');language.setLanguage('bg');assert.equal(input.validity.customError,false);
 assert.equal(input.checkValidity(),false);assert.equal(input.validationMessage,'Въведете валидна стойност.');
 input.value='preview@example.com';input.dispatchEvent(new window.Event('input',{bubbles:true}));
 assert.equal(input.validity.valid,true);assert.equal(input.validity.customError,false);
 contact.value='g';assert.equal(contact.checkValidity(),false);assert.equal(contact.validity.customError,false,'Consultation keeps its inline feedback instead of native custom errors.');
 input.value='g';input.checkValidity();language.setLanguage('en');assert.equal(input.validity.customError,false);
 await flush();
});
