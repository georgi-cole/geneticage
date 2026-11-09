const element = id => document.getElementById(id);
const message = element('message');
const signIn = element('sign-in');
const emailForm = element('request-code');
const verificationForm = element('verify-code');
const deletionForm = element('delete');
let csrf;
let email;

async function request(path, method, body) {
  const response = await fetch('/api/' + path, {
    method, cache: 'no-store', credentials: 'same-origin', signal: AbortSignal.timeout(10000),
    headers: method === 'GET' ? {} : { 'Content-Type': 'application/json', 'X-KQ-CSRF': csrf || '' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const result = await response.json();
  if (!response.ok && !(path === 'session' && response.status === 401)) throw new Error(result.error);
  return result;
}

async function showSession() {
  const session = await request('session', 'GET');
  csrf = session.csrf;
  signIn.hidden = Boolean(csrf);
  deletionForm.hidden = !csrf;
  element('apple').hidden = !session.providers?.includes('apple');
  element('google').hidden = !session.providers?.includes('google');
  emailForm.hidden = !session.emailSignIn;
}

function submit(form, action) {
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const button = form.querySelector('button');
    button.disabled = true;
    message.textContent = '';
    try { await action(); }
    catch (error) { message.textContent = error.message || 'The service could not be reached. Please try again.'; }
    finally { button.disabled = false; }
  });
}

submit(emailForm, async () => {
  email = emailForm.elements.email.value.trim();
  await request('auth/code', 'POST', { email });
  verificationForm.hidden = false;
  verificationForm.elements.code.focus();
  message.textContent = 'Check your email for a sign-in code.';
});
submit(verificationForm, async () => {
  await request('auth/verify', 'POST', { email, code: verificationForm.elements.code.value });
  verificationForm.reset();
  emailForm.reset();
  email = undefined;
  await showSession();
});
submit(deletionForm, async () => {
  const result = await request('account', 'DELETE', { confirm: deletionForm.elements.confirm.value });
  csrf = undefined;
  deletionForm.reset();
  deletionForm.hidden = true;
  element('apple-manual').hidden = result.appleRevocation !== 'manual';
  message.textContent = 'Your GeneticAge account and live records have been deleted.';
});

const status = new URL(location.href).searchParams.get('auth');
if (status) {
  history.replaceState(null, '', '/delete-account/');
  if (status === 'no-account') message.textContent = 'No GeneticAge account was found with this sign-in method.';
  if (status === 'cancelled') message.textContent = 'Sign-in was cancelled.';
  if (status === 'retry') message.textContent = 'Sign-in could not be completed. Please try again.';
}
showSession().catch(() => { message.textContent = 'Sign-in is temporarily unavailable. You can request help below.'; });
