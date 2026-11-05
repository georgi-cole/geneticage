// Validation is requested only by Continue/Preview. Typing only clears feedback.
export function contactFieldMessage(id,validity){
 if(validity.valid)return '';
 if(validity.valueMissing)return ({'contact-email':'Enter your email address.','contact-country':'Enter your country of residence.','contact-reason':'Choose a topic to discuss.','contact-consent':'Confirm that this is an enquiry preview and nothing will be sent.'})[id]||'Complete this field.';
 if(id==='contact-email'&&validity.typeMismatch)return 'Enter a complete email address, for example name@example.com.';
 return 'Please check this entry.';
}

export function clearContactFeedback(field){
 if(!field?.closest?.('#consult-form'))return;
 const errorId=field.id+'-error';document.getElementById(errorId)?.remove();
 field.removeAttribute('aria-invalid');
 const described=(field.getAttribute('aria-describedby')||'').split(/\s+/).filter(id=>id&&id!==errorId);
 if(described.length)field.setAttribute('aria-describedby',described.join(' '));else field.removeAttribute('aria-describedby');
}

export function validateContactPage(form,index,{focus=true}={}){
 const page=form.querySelectorAll('.consult-page')[index];if(!page)return false;
 let firstInvalid=null;
 for(const field of page.querySelectorAll('input,select')){
  if(field.disabled)continue;
  clearContactFeedback(field);
  const message=contactFieldMessage(field.id,field.validity);if(!message)continue;
  const error=document.createElement('p');error.id=field.id+'-error';error.className='field-feedback';error.setAttribute('role','alert');error.textContent=message;
  const anchor=field.closest('.checkline')||field;anchor.after(error);
  field.setAttribute('aria-invalid','true');field.setAttribute('aria-describedby',[field.getAttribute('aria-describedby'),error.id].filter(Boolean).join(' '));
  firstInvalid??=field;
 }
 if(firstInvalid&&focus)firstInvalid.focus({preventScroll:true});
 return !firstInvalid;
}

export function showContactPage(form,index,{focus=true}={}){
 const pages=[...form.querySelectorAll('.consult-page')],next=Math.max(0,Math.min(index,pages.length-1));
 pages.forEach((page,i)=>{page.hidden=i!==next;});form.dataset.page=String(next);
 form.querySelector('[data-direction="-1"]').disabled=next===0;
 form.querySelector('[data-direction="1"]').hidden=next===pages.length-1;
 form.querySelector('.consult-page-count').textContent=(next+1)+' / '+pages.length;
 if(focus)(pages[next].querySelector('[aria-invalid="true"],input,select,button'))?.focus({preventScroll:true});
}

export function advanceContactPage(form,direction){
 const current=Number(form.dataset.page)||0;
 if(direction>0&&!validateContactPage(form,current))return false;
 showContactPage(form,current+direction);return true;
}
