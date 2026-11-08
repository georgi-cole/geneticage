import {escapeHTML as esc,backButton,screenHeading,uiIcon} from './ui-components.mjs';
import {PAGES_PREVIEW} from './hosting-mode.mjs';
import {reportTypeName,reportLanguage} from './report-products.mjs';

const instant = 'Instant Full Report', specialist = 'Specialist Review';
const arrow = uiIcon('forward');
const reportDate = (value,language,showTime) => new Intl.DateTimeFormat(language==='bg'?'bg-BG':'en-GB',{
  dateStyle:'medium',...(showTime ? {timeStyle:'short'} : {timeZone:'UTC'}),
}).format(new Date(value));
const reportPrice = (amount,currency,language) => new Intl.NumberFormat(language==='bg'?'bg-BG':'en-US',{
  style:'currency',currency:currency || 'usd',currencyDisplay:'code',
}).format(amount/100);
const countryName = (country,language) => new Intl.DisplayNames([reportLanguage(language)],{type:'region'}).of(country);
export const reportDateMarkup = (value,language,showTime=false) =>
  '<time datetime="'+esc(value)+'" data-product-date="'+(showTime?'time':'date')+'" data-no-translate>'+esc(reportDate(value,language,showTime))+'</time>';
export const reportPriceMarkup = (amount,currency,language) =>
  '<strong data-product-amount="'+esc(amount)+'" data-product-currency="'+esc(currency)+'" data-no-translate>'+esc(reportPrice(amount,currency,language))+'</strong>';
const personText = (text,tag='p') => '<'+tag+' class="review-person-text" data-no-translate>'+esc(text)+'</'+tag+'>';
export const samplePdfPath = language => (PAGES_PREVIEW?'./':'/')+'assets/report-samples/'+reportLanguage(language)+'.pdf';
export const fullPdfPath = (id,language) => '/api/assessments/'+encodeURIComponent(id)+'/full-report.pdf?lang='+reportLanguage(language);
export const samplePdf = language => '<a class="text-link" data-report-sample href="'+samplePdfPath(language)+'" target="_blank" rel="noopener noreferrer">View sample PDF '+uiIcon('external')+'</a>';
export const downloadPdf = (id,language,preview=false) => '<a class="text-link" data-report-download="'+esc(id)+'" href="'+fullPdfPath(id,language)+'">'+(preview?'Preview full PDF':'Download full PDF')+' '+arrow+'</a>';

export function localizeReportProducts(language,root=document) {
  root.querySelectorAll('[data-report-sample]').forEach(link=>{link.href=samplePdfPath(language);});
  root.querySelectorAll('[data-report-download]').forEach(link=>{link.href=fullPdfPath(link.dataset.reportDownload,language);});
  root.querySelectorAll('[data-product-date]').forEach(el=>{el.textContent=reportDate(el.dateTime,language,el.dataset.productDate==='time');});
  root.querySelectorAll('[data-product-amount]').forEach(el=>{el.textContent=reportPrice(Number(el.dataset.productAmount),el.dataset.productCurrency,language);});
  root.querySelectorAll('[data-product-country]').forEach(el=>{el.textContent=countryName(el.dataset.productCountry,language);});
}

export function reportOffers({assessment,eligible,purchased,preview,payments,specialistEnabled,language}) {
  const sample = assessment.sample;
  const downloadable = purchased || preview;
  const instantActions = (downloadable ? downloadPdf(assessment.saveId,language,!purchased) : '') +
    (eligible && !downloadable && payments?.enabled && !PAGES_PREVIEW ? '<button class="text-link" data-action="checkout">Get full report '+arrow+'</button>' : '') +
    samplePdf(language);
  return `<section class="report-offers no-print" aria-label="Report options" data-theme-part>
    <div class="report-offer">
      <span class="offer-symbol">${uiIcon('report')}</span>
      <div><h2>${instant}</h2><p>Measurement notes, methods and a question for your next visit.</p>
      ${!sample && eligible && !downloadable ? '<p class="offer-price">US$7.99 · One-time purchase</p>' : ''}
      <div class="offer-actions">${instantActions}</div></div>
    </div>
    ${sample || PAGES_PREVIEW ? '' : `<div class="report-offer">
      <span class="offer-symbol">${uiIcon('consult')}</span>
      <div><h2>${specialist}</h2><p>A specialist reviews your assessment and answers your question.</p>
      <div class="offer-actions"><button class="text-link" data-action="request-specialist">${specialistEnabled?'Request a quote':'About specialist reviews'} ${arrow}</button></div></div>
    </div>`}
  </section>`;
}

export function specialistRequestForm({title,saved,countries,language,preferredCountry}) {
  const options = countries.map(code=>`<option value="${esc(code)}"${code===preferredCountry?' selected':''} data-product-country="${esc(code)}" data-no-translate>${esc(countryName(code,language))}</option>`).join('');
  return `<p>Get a written quote with the scope, fee and delivery time. The request is free.</p>
  <p class="small muted"><span>Assessment to share</span> · <strong>${esc(title)}</strong></p>
  ${saved ? '' : '<p>We’ll save this assessment to your account when you send the request.</p>'}
  <form id="specialist-request-form" class="form-stack review-form">
    <label for="review-country">Country of residence</label>
    <select id="review-country" name="country" required><option value="">Choose your country</option>${options}</select>
    <label for="review-language">Language for your review</label>
    <select id="review-language" name="language"><option value="en"${language==='en'?' selected':''}>English</option><option value="bg"${language==='bg'?' selected':''}>Bulgarian</option></select>
    <label for="review-question">What would you like the specialist to address?</label>
    <textarea id="review-question" name="question" maxlength="1500" rows="3" placeholder="Optional question"></textarea>
    <label class="checkline"><input type="checkbox" name="consent" required><span>I agree to share this assessment and my question with authorized KoleQuant reviewers for the quote and any review I buy.</span></label>
    <p class="error" data-form-error role="alert" hidden></p>
    <button class="btn" type="submit">Send quote request ${arrow}</button>
  </form>`;
}

const reviewStatus = review => {
  if (review.status==='cancelled') return 'Withdrawn';
  if (review.paymentStatus==='disputed') return 'Payment under review';
  if (review.status==='delivered' && review.paymentStatus!=='paid') return 'Review access paused';
  if (review.status==='quoted' && review.paymentStatus==='paid') return 'In review';
  if (['creating','open','processing'].includes(review.paymentStatus)) return 'Payment pending';
  return {requested:'Quote requested',quoted:'Quote ready',declined:'Unable to review',expired:'Quote expired',delivered:'Review delivered'}[review.status] || '';
};
const openPayment = review => ['creating','open','processing'].includes(review.paymentStatus);
const openRequest = review => ['requested','quoted','expired'].includes(review.status);
const formError = '<p class="error" data-form-error role="alert" hidden></p>';
function quoteActions(review,payments) {
  if (['paid','disputed','processing'].includes(review.paymentStatus) || review.status!=='quoted') return '';
  if (!payments?.specialistEnabled) return '<p class="small muted">Payment for specialist quotes is currently unavailable.</p>';
  return `${payments.mode==='test'?'<p class="small muted">Test checkout. No real payment will be taken.</p>':''}
    <div class="offer-actions"><button class="btn" data-action="pay-specialist" data-id="${esc(review.id)}">${openPayment(review)?'Return to payment':'Accept quote & continue to payment'} ${arrow}</button></div>`;
}
function quoteSection(review,{language,staff,payments}) {
  if (!review.quote) return '';
  const {name,qualifications,scope,amount,currency,days,expiresAt} = review.quote;
  return `<section class="card review-detail-card" data-theme-part>
    <div class="review-quote-heading"><h2>Review quote</h2>${reportPriceMarkup(amount,currency,language)}</div>
    ${personText(name,'h3')}${personText(qualifications)}${personText(scope)}
    <dl class="review-terms"><div><dt>Delivery after payment</dt><dd><span>${esc(days)}</span> <span>${days===1?'calendar day':'calendar days'}</span></dd></div>
    <div><dt>Start payment by</dt><dd>${reportDateMarkup(expiresAt,language,true)}</dd></div></dl>
    <p class="small muted">Includes the Instant Full Report. Stripe shows the final total before you pay.</p>
    ${staff ? '' : quoteActions(review,payments)}
  </section>`;
}
function reviewRows(rows) {
  return rows.map(row=>`<div class="answer-row"><dt>${esc(row.label)}</dt><dd>${esc(row.value)}${row.notes?.length?'<small>'+esc(row.notes.join(' · '))+'</small>':''}</dd></div>`).join('');
}
function staffSection(review) {
  const content = review.assessment;
  if (!content) return '';
  const id = esc(review.id);
  const postForm = (action,fields,label)=>`<form class="form-stack review-form" data-review-id="${id}" data-review-action="${action}">${fields}${formError}<button class="btn" type="submit">${label} ${arrow}</button></form>`;
  const textarea = (id,label,max)=>`<label for="review-${id}">${label}</label><textarea id="review-${id}" name="${id}" maxlength="${max}" rows="4" required></textarea>`;
  const terms = `<label for="quote-amount">Price in the selected currency</label><input id="quote-amount" name="amount" inputmode="decimal" maxlength="7" pattern="[0-9]{1,4}([.,][0-9]{1,2})?" required>
    <label for="quote-currency">Currency</label><select id="quote-currency" name="currency"><option value="usd">USD</option><option value="eur">EUR</option><option value="gbp">GBP</option></select>
    <label for="quote-days">Delivery time in calendar days</label><input id="quote-days" name="days" type="number" min="1" max="60" step="1" required>`;
  const assessment = `<section class="card review-detail-card" data-theme-part><h2>Shared assessment</h2>
    ${content.age?`<p><span>${esc(content.ageLabel)}</span> <strong>${esc(content.age)}</strong></p>`:''}
    ${content.reason?'<p>'+esc(content.reason)+'</p>':''}
    ${content.method?'<p>'+esc(content.method)+'</p>':''}
    <dl>${reviewRows(content.comparison)}</dl>
    <details class="report-answer-group"><summary>Measurements & answers</summary><dl>${reviewRows([...content.measurements,...content.inputRows])}</dl></details>
    ${content.sources.length?'<details class="report-answer-group"><summary>Sources</summary><ul class="source-list">'+content.sources.map(source=>`<li><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.label)}</a></li>`).join('')+'</ul></details>':''}
  </section>`;
  if (review.status==='requested') return assessment + `<section class="card review-detail-card" data-theme-part><h2>Prepare a quote</h2>
    <p class="small muted">Confirm that you can review this assessment in the requested location and language. The quote is valid for seven days.</p>
    ${postForm('quote',textarea('scope','What the review will cover',2000)+terms,'Send quote')}
    <details class="report-answer-group"><summary>Decline request</summary>${postForm('decline',textarea('reason','Message to the customer',1500),'Decline request')}</details>
  </section>`;
  if (review.status==='quoted' && review.paymentStatus==='paid') return assessment + `<section class="card review-detail-card" data-theme-part><h2>Write the review</h2>
    ${postForm('deliver',textarea('findings','Findings',8000)+textarea('limitations','Limitations',4000)+textarea('nextSteps','Follow-up',4000),'Deliver review')}
  </section>`;
  return assessment;
}

export function renderReviewArea({data,staff,selected,backLabel,language,payments,enabled,hiddenRecords}) {
  const title = staff?'Review queue':'Specialist reviews';
  const back = selected?backButton('back-screen',backLabel):backButton('account-tab','Account','settings');
  const header = screenHeading('YOUR ACCOUNT',selected?'Review request':title);
  const status = data?.error ? '<p class="connection-note" role="status">'+esc(data.error)+'</p>'
    : !data || data.loading ? '<span class="sync-status" role="status">Loading review requests…</span>' : '';
  let body = status;
  if (!selected && data?.reviews) {
    body = data.reviews.length ? `<section class="account-settings" aria-label="${title}" data-theme-part>${data.reviews.map(review=>
      `<button class="account-setting" data-action="open-review-request" data-id="${esc(review.id)}">
        <span class="setting-symbol">${uiIcon('consult')}</span><span class="setting-copy"><strong>${esc(reportTypeName(review.type))}</strong>
        <small><span>${reviewStatus(review)}</span> · ${reportDateMarkup(review.createdAt,language)}</small></span>${arrow}</button>`).join('')}</section>`
      : `<section class="card" data-theme-part><h2>${staff?'The queue is empty.':'No specialist requests yet.'}</h2>${staff?'':`<p>${enabled?'Open a personal assessment to request a quote.':'New requests will open when reviewers are available.'}</p>`}</section>`;
  } else if (data?.review) {
    const review = data.review;
    const status = reviewStatus(review);
    body = `<section class="card review-detail-card" data-theme-part>
      <span class="pill">${status}</span><h2>${esc(reportTypeName(review.type))}</h2>
      <p class="small muted"><span data-no-translate data-product-country="${esc(review.country)}">${esc(countryName(review.country,language))}</span> · <span>${review.language==='bg'?'Bulgarian':'English'}</span> · ${reportDateMarkup(review.createdAt,language)}</p>
      ${review.question?'<h3>Question for the specialist</h3>'+personText(review.question):''}
      ${review.declineReason?personText(review.declineReason):''}
      ${review.status==='requested' && !staff?'<p>Check here for your quote. You can decide after you see the scope and fee.</p>':''}
      ${review.status==='expired' && !staff?'<p>Withdraw this request to request a new quote from your assessment.</p>':''}
    </section>
    ${review.delivery?`<section class="card review-detail-card" data-theme-part><h2>Written review</h2>
      <h3>Findings</h3>${personText(review.delivery.findings)}
      <h3>Limitations</h3>${personText(review.delivery.limitations)}
      <h3>Follow-up</h3>${personText(review.delivery.nextSteps)}
    </section>`:''}
    ${quoteSection(review,{language,staff,payments})}
    ${!staff && review.paymentStatus==='paid' && !hiddenRecords.has(review.assessmentId)?`<div class="offer-actions">${downloadPdf(review.assessmentId,language)}</div>`:''}
    ${!staff && openPayment(review)?'<button class="text-link" data-action="account-tab" data-tab="purchases">Check payment in Purchases</button>':''}
    ${!staff && openRequest(review) && !openPayment(review)?`<button class="text-link" data-action="withdraw-specialist" data-id="${esc(review.id)}">Withdraw request</button>`:''}
    ${staff?staffSection(review):''}`;
  }
  return `<div class="wrap app-screen account-subscreen review-screen">${back}${header}${body}
  ${data?.error?'<button class="text-link" data-action="refresh-reviews">Retry</button>':data?.review?'<button class="text-link" data-action="refresh-reviews">Refresh request</button>':staff&&!selected?'<button class="text-link" data-action="refresh-reviews">Refresh queue</button>':''}</div>`;
}
