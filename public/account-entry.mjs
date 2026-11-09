import {escapeHTML as esc} from './ui-components.mjs';

const signInOptions = {
  apple: { label: 'Continue with Apple', logo: 'apple.svg' },
  google: { label: 'Continue with Google', logo: 'google.png' },
};

export function accountEntry({email = '', stage = 'email', providers = [], keepDraft = false, message = '', native = false, reviewAccess = false, emailSignIn = true} = {}) {
  const error = `<p class="error" data-auth-error role="alert"${message?'':' hidden'}>${esc(message)}</p>`;
  const changeEmail = '<button class="text-btn" type="button" data-action="auth-change-email">Use a different email</button>';
  if (stage === 'store-review') return {
    title:'Store review access',
    body:`<p>Use the review code from the store’s app review notes. Review mode opens a separate demo account. Enter fictional health details.</p>
      <form id="store-review-form" class="form-stack">
        <label for="review-code">Review code</label>
        <input id="review-code" name="code" type="password" required maxlength="64" autocomplete="off">
        <label class="checkline"><input name="adult" type="checkbox" required><span>I am 18 or older.</span></label>
        <label class="checkline"><input name="consent" type="checkbox" required><span>I consent to storing fictional health information when I choose to save a demo assessment.</span></label>
        ${error}<button class="btn" type="submit">Continue →</button>
        <button class="text-btn" type="button" data-action="auth-change-email">Other sign-in options</button>
      </form>`,
  };
  if (stage === 'register' || stage === 'social-register') return {
    title:'Create your account',
    body:`<p>Choose a nickname for your private health journal. You’ll enter your health details separately.</p>
      <form id="signup-form" class="form-stack">
        <label for="account-name">Account nickname</label>
        <input id="account-name" name="name" type="text" required maxlength="40" autocomplete="nickname">
        <label class="checkline"><input name="adult" type="checkbox" required><span>I am 18 or older.</span></label>
        <details class="reference-editor">
          <summary>Account storage notice</summary>
          <p>${stage==='social-register'?'We keep a sign-in identifier from your provider.':'We keep your email for sign-in. Resend delivers the code.'} Assessments are encrypted and stored only when you choose to save them. You can export or delete them from your account.</p>
        </details>
        <label class="checkline"><input name="consent" type="checkbox" required><span>I consent to storing health information when I choose to save an assessment.</span></label>
        ${error}<button class="btn" type="submit">Create my account →</button>
        <button class="text-btn" type="button" data-action="auth-change-email">Start sign-in again</button>
      </form>`,
  };
  if (stage === 'code') return {
    title:'Enter your sign-in code',
    body:`<p>We sent an 8-digit code to <strong data-no-translate>${esc(email)}</strong>. It expires in 10 minutes.</p>
      <form id="auth-code-form" class="form-stack">
        <label for="auth-code">Sign-in code</label>
        <input id="auth-code" name="code" type="text" inputmode="numeric" autocomplete="one-time-code" required pattern="[0-9]{8}" maxlength="8">
        ${error}<button class="btn" type="submit">Verify code →</button>
        <div class="actions"><button class="text-btn" type="button" data-action="auth-resend">Send a new code</button>${changeEmail}</div>
      </form>`,
  };
  const social = Object.entries(signInOptions).filter(([provider])=>providers.includes(provider)).map(([provider,{label,logo}])=>{
    const content = `<img src="/assets/auth/${logo}" alt=""><span>${label}</span>`;
    return native
      ? `<button class="provider-sign-in ${provider}" type="button" data-action="native-provider" data-provider="${provider}">${content}</button>`
      : `<a class="provider-sign-in ${provider}" href="/api/auth/oauth/${provider}/start" target="${keepDraft?'_blank':'_top'}" rel="noopener noreferrer">${content}</a>`;
  }).join('');
  return {
    title:'Sign in or create an account',
    body:`${social?`<div class="provider-sign-in-options">${social}</div><p>Use the same sign-in method to open an existing account.</p>${keepDraft&&!native?`<p>Provider sign-in opens in a new tab so your entries stay here. Return to this tab when you’re done.</p>`:''}`:''}
      ${emailSignIn?`<p>${social?'Or sign in with a code sent to your email.':'We’ll email you a one-time code to open your private health journal.'}</p>
      <form id="auth-email-form" class="form-stack">
        <label for="auth-email">Email address</label>
        <input id="auth-email" name="email" type="email" autocomplete="email" required maxlength="254" value="${esc(email)}">
        ${error}<button class="btn" type="submit">Send sign-in code →</button>
        ${social&&keepDraft&&!native?'<button class="text-btn" type="button" data-action="auth-resume">Continue here after signing in</button>':''}
      </form>`:error}
      ${reviewAccess?'<button class="text-btn" type="button" data-action="store-review">Store review access</button>':''}`,
  };
}
