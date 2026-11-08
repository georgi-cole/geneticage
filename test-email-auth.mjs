import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { CONSENT_VERSION, handleAccountApi } from './lib/account-api.mjs';
import { getEmailUser, handleEmailAuthApi } from './lib/email-auth.mjs';

const db = new DatabaseSync(':memory:');
db.exec('PRAGMA foreign_keys=ON');
for (const file of readdirSync('drizzle').filter(name => name.endsWith('.sql')).sort()) db.exec(readFileSync('drizzle/' + file, 'utf8'));
function prepared(sql, values = []) {
  return {
    bind(...args) { return prepared(sql, args); },
    async first() { return db.prepare(sql).get(...values) ?? null; },
    async all() { return { results: db.prepare(sql).all(...values) }; },
    async run() { const result = db.prepare(sql).run(...values); return { meta: { changes: Number(result.changes) } }; },
  };
}
const env = {
  DB: {
    prepare: prepared,
    async batch(statements) {
      db.exec('BEGIN');
      try { const result = []; for (const statement of statements) result.push(await statement.run()); db.exec('COMMIT'); return result; }
      catch (error) { db.exec('ROLLBACK'); throw error; }
    },
  },
  ASSESSMENT_ENCRYPTION_KEY: randomBytes(32).toString('base64'),
  RESEND_API_KEY: 're_test_fixture_only',
};
const originalFetch = globalThis.fetch;
const sent = [];
globalThis.fetch = async (url, options = {}) => {
  assert.equal(String(url), 'https://api.resend.com/emails');
  assert.equal(options.headers.Authorization, 'Bearer re_test_fixture_only');
  const message = JSON.parse(options.body); sent.push(message);
  return Response.json({ id: 'email-fixture-' + sent.length });
};
function request(path, method = 'GET', data, { cookie = '', origin = 'https://site.test', ip = '192.0.2.10', csrf = '' } = {}) {
  return new Request('https://site.test' + path, {
    method,
    headers: {
      ...(method === 'GET' ? {} : { Origin: origin, 'Content-Type': 'application/json' }),
      ...(cookie ? { Cookie: cookie } : {}),
      ...(csrf ? { 'X-KQ-CSRF': csrf } : {}),
      'CF-Connecting-IP': ip,
    },
    ...(data === undefined ? {} : { body: JSON.stringify(data) }),
  });
}
async function authCall(path, method = 'GET', data, options) {
  const response = await handleEmailAuthApi(request('/api/auth/' + path, method, data, options), env);
  return { response, data: await response.json() };
}
const cookieValue = header => header.split(';', 1)[0];
const withSiteCookie = cookie => 'site_access=fixture; ' + cookie;
const codeFrom = message => message.text.match(/\b(\d{8})\b/)?.[1];

try {
  assert.equal((await authCall('code', 'POST', { email: 'member@example.com' }, { origin: 'https://evil.test' })).response.status, 403);
  assert.equal(sent.length, 0, 'Cross-site requests must not send mail.');

  const address = '  MEMBER@example.com ';
  const unconfigured = await handleEmailAuthApi(request('/api/auth/code', 'POST', {email:address}), {...env,RESEND_API_KEY:undefined});
  assert.equal(unconfigured.status, 503);
  assert.equal(sent.length, 0);
  const sentCode = await authCall('code', 'POST', { email: address });
  assert.equal(sentCode.response.status, 202);
  assert.equal(sentCode.response.headers.get('Cache-Control'), 'private, no-store, max-age=0');
  assert.equal(sent[0].to[0], 'member@example.com');
  assert.equal(sent[0].from, 'KoleQuant <support@kolequant.xyz>');
  assert.match(sent[0].text, /no health information/i);
  assert.doesNotMatch(sent[0].text, /creatinine|assessment|result/i);
  const code = codeFrom(sent[0]);
  assert.match(code, /^\d{8}$/);
  const storedCodeHash = db.prepare('SELECT code_hash FROM email_auth_codes WHERE email=?').get('member@example.com').code_hash;
  assert.match(storedCodeHash, /^[a-f0-9]{64}$/);
  assert.notEqual(storedCodeHash, code, 'Only a keyed code digest is stored.');

  const badOrigin = await authCall('verify', 'POST', { email: 'member@example.com', code }, { origin: 'http://site.test' });
  assert.equal(badOrigin.response.status, 403);
  const race = await Promise.all([1,2].map(()=>authCall('verify', 'POST', { email: 'member@example.com', code })));
  assert.deepEqual(race.map(item=>item.response.status).sort(), [200,400], 'A sign-in code can be consumed only once.');
  const verified = race.find(item=>item.response.ok);
  assert.equal(verified.response.status, 200);
  assert.equal(verified.data.registrationRequired, true);
  const cookies = verified.response.headers.getSetCookie();
  assert.equal(cookies.length, 1);
  const proofCookie = cookieValue(cookies[0]);
  assert.match(proofCookie, /^__Host-kq_email_proof=/);
  assert.match(cookies[0], /HttpOnly/);
  assert.match(cookies[0], /Secure/);
  assert.match(cookies[0], /SameSite=Lax/);

  const incomplete = await authCall('register', 'POST', { name: 'Health journal', adult: false, consent: true, consentVersion: CONSENT_VERSION }, { cookie: proofCookie });
  assert.equal(incomplete.response.status, 400);
  assert.equal(db.prepare('SELECT count(*) n FROM profiles').get().n, 0);

  const registered = await authCall('register', 'POST', { name: 'Health journal', adult: true, consent: true, consentVersion: CONSENT_VERSION }, { cookie: withSiteCookie(proofCookie) });
  assert.equal(registered.response.status, 201);
  assert.equal(registered.data.created, true);
  const proofReplay = await authCall('register','POST',{name:'Duplicate',adult:true,consent:true,consentVersion:CONSENT_VERSION},{cookie:proofCookie});
  assert.equal(proofReplay.response.status, 401);
  const registrationCookies = registered.response.headers.getSetCookie();
  assert.equal(registrationCookies.length, 2, 'Registration must set a session and clear the proof cookie separately.');
  const sessionHeader = registrationCookies.find(value => value.startsWith('__Host-kq_session='));
  assert.ok(sessionHeader);
  assert.match(sessionHeader, /HttpOnly/);
  assert.match(sessionHeader, /Secure/);
  assert.match(registrationCookies.find(value => value.startsWith('__Host-kq_email_proof=')), /Max-Age=0/);
  const sessionCookie = cookieValue(sessionHeader);
  const sessionToken = sessionCookie.split('=')[1];
  const owner = await getEmailUser(request('/api/session', 'GET', undefined, { cookie: withSiteCookie(sessionCookie) }), env);
  assert.ok(owner?.userId);
  const storedSessionHash = db.prepare('SELECT token_hash FROM auth_sessions').get().token_hash;
  assert.match(storedSessionHash, /^[a-f0-9]{64}$/);
  assert.notEqual(storedSessionHash, sessionToken, 'Only a keyed session digest is stored.');
  const sessionResponse = await handleAccountApi(request('/api/session', 'GET', undefined, { cookie: sessionCookie }), env, owner);
  const accountSession = await sessionResponse.json();
  assert.equal(accountSession.email, 'member@example.com');
  assert.equal(accountSession.profile.name, 'Health journal');

  const loginCode = await authCall('code', 'POST', { email: 'member@example.com' });
  const login = await authCall('verify', 'POST', { email: 'member@example.com', code: codeFrom(sent.at(-1)) });
  assert.equal(login.data.authenticated, true);
  assert.equal(login.data.registrationRequired, false);
  const loginCookie = cookieValue(login.response.headers.getSetCookie()[0]);
  const loginOwner = await getEmailUser(request('/api/session', 'GET', undefined, { cookie: loginCookie }), env);
  assert.equal(loginOwner.userId, owner.userId);
  assert.equal(loginCode.response.status, 202);

  const logout = await authCall('logout', 'POST', {}, { cookie: withSiteCookie(loginCookie) });
  assert.equal(logout.response.status, 200);
  assert.ok(logout.response.headers.getSetCookie().length >= 2);
  assert.equal(await getEmailUser(request('/api/session', 'GET', undefined, { cookie: loginCookie }), env), null);

  const attemptsEmail = 'attempts@example.com';
  const attemptCode = await authCall('code', 'POST', { email: attemptsEmail });
  assert.equal(attemptCode.response.status, 202);
  for (let attempt = 0; attempt < 5; attempt++) {
    const wrong = await authCall('verify', 'POST', { email: attemptsEmail, code: codeFrom(sent.at(-1)) === '00000000' ? '00000001' : '00000000' });
    assert.equal(wrong.response.status, 400);
  }
  assert.equal((await authCall('verify', 'POST', { email: attemptsEmail, code: codeFrom(sent.at(-1)) })).response.status, 400, 'A challenge cannot be brute-forced after five attempts.');

  const limitedEmail = 'limited@example.com';
  for (let i = 0; i < 3; i++) assert.equal((await authCall('code', 'POST', { email: limitedEmail })).response.status, 202);
  assert.equal((await authCall('code', 'POST', { email: limitedEmail })).response.status, 429, 'Email requests are rate-limited.');

  const pendingCode = await authCall('code', 'POST', { email: 'member@example.com' });
  assert.equal(pendingCode.response.status, 202);
  const deletion = await handleAccountApi(request('/api/account', 'DELETE', { confirm: 'DELETE' }, { cookie: sessionCookie, csrf: accountSession.csrf }), env, owner);
  assert.equal(deletion.status, 200);
  assert.equal(db.prepare('SELECT count(*) n FROM email_auth_codes WHERE email=?').get('member@example.com').n, 0);
  assert.equal(db.prepare('SELECT count(*) n FROM auth_accounts WHERE user_id=?').get(owner.userId).n, 0);
  assert.equal(db.prepare('SELECT count(*) n FROM auth_sessions WHERE user_id=?').get(owner.userId).n, 0);
  console.log('Passed: same-origin email sign-in, Resend message contents, code hashing/expiry/attempt limit, consent-gated registration, separate secure cookies, account login, session hashing/logout and cascading deletion. No real email was sent.');
} finally {
  globalThis.fetch = originalFetch;
  db.close();
}
