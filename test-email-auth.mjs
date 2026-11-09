import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { exportJWK, exportPKCS8, generateKeyPair, jwtVerify, SignJWT } from 'jose';
import { CONSENT_VERSION, handleAccountApi } from './lib/account-api.mjs';
import { getSessionUser, handleAuthApi } from './lib/auth-api.mjs';

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
  const response = await handleAuthApi(request('/api/auth/' + path, method, data, options), env);
  return { response, data: await response.json() };
}
const cookieValue = header => header.split(';', 1)[0];
const withSiteCookie = cookie => 'site_access=fixture; ' + cookie;
const codeFrom = message => message.text.match(/\b(\d{8})\b/)?.[1];

async function verifySocialSignIn(emailOwner) {
  const signing = await generateKeyPair('RS256');
  const client = await generateKeyPair('ES256', { extractable: true });
  const key = { ...await exportJWK(signing.publicKey), kid: 'fixture-key', alg: 'RS256' };
  const socialEnv = {
    ...env, PUBLIC_SITE_ORIGIN: 'https://site.test', GOOGLE_CLIENT_ID: 'google-fixture',
    GOOGLE_CLIENT_SECRET: 'google-secret-fixture', APPLE_SERVICES_ID: 'apple-fixture',
    APPLE_TEAM_ID: 'team-fixture', APPLE_KEY_ID: 'apple-key-fixture', APPLE_PRIVATE_KEY: await exportPKCS8(client.privateKey),
  };
  const fixtures = {
    google: { issuer: 'https://accounts.google.com', clientId: socialEnv.GOOGLE_CLIENT_ID, token: 'https://oauth2.googleapis.com/token' },
    apple: { issuer: 'https://appleid.apple.com', clientId: socialEnv.APPLE_SERVICES_ID, token: 'https://appleid.apple.com/auth/token' },
  };
  const start = async provider => {
    const response = await handleAuthApi(request(`/api/auth/oauth/${provider}/start`), socialEnv);
    assert.equal(response.status, 303);
    const authorize = new URL(response.headers.get('Location'));
    const stateCookie = response.headers.getSetCookie()[0];
    assert.match(stateCookie, /^__Host-kq_oauth_state=.*HttpOnly; SameSite=Lax;.*Secure$/);
    const query = authorize.searchParams;
    assert.equal(query.get('client_id'), fixtures[provider].clientId);
    assert.equal(query.get('redirect_uri'), `https://site.test/api/auth/oauth/${provider}/callback`);
    assert.equal(query.get('response_type'), 'code');
    assert.equal(query.get('scope'), provider === 'google' ? 'openid' : null);
    assert.equal(query.get('code_challenge_method'), provider === 'google' ? 'S256' : null);
    if (provider === 'apple') assert.equal(query.get('response_mode'), 'query');
    return { provider, query, cookie: cookieValue(stateCookie) };
  };
  const callback = (flow, cookie = flow.cookie, params = {}) => {
    const query = new URLSearchParams({ state: flow.query.get('state'), code: 'fixture-code', ...params });
    return handleAuthApi(request(`/api/auth/oauth/${flow.provider}/callback?${query}`, 'GET', undefined, { cookie }), socialEnv);
  };
  const consent = { name: 'Fictional social user', adult: true, consent: true, consentVersion: CONSENT_VERSION, signInMethod: 'social' };
  const register = (cookie, fields = {}) => handleAuthApi(request('/api/auth/register', 'POST', { ...consent, ...fields }, { cookie }), socialEnv);
  const outcome = response => response.headers.get('Location');
  const emailFetch = globalThis.fetch;
  let flow, invalidClaim = '', exchanges = 0;
  globalThis.fetch = async (url, options = {}) => {
    const address = String(url);
    if (address === 'https://www.googleapis.com/oauth2/v3/certs' || address === 'https://appleid.apple.com/auth/keys') {
      return Response.json({ keys: [key] });
    }
    const fixture = fixtures[flow.provider];
    assert.equal(address, fixture.token);
    assert.equal(options.method, 'POST');
    assert.equal(options.body.get('code'), 'fixture-code');
    assert.equal(options.body.get('redirect_uri'), flow.query.get('redirect_uri'));
    if (flow.provider === 'google') {
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(options.body.get('code_verifier')));
      assert.equal(Buffer.from(digest).toString('base64url'), flow.query.get('code_challenge'));
    } else {
      assert.equal(options.body.has('code_verifier'), false);
      await jwtVerify(options.body.get('client_secret'), client.publicKey, {
        algorithms: ['ES256'], issuer: socialEnv.APPLE_TEAM_ID, audience: fixture.issuer, subject: fixture.clientId,
      });
    }
    exchanges++;
    const token = await new SignJWT({
      nonce: invalidClaim === 'nonce' ? 'different-nonce' : flow.query.get('nonce'),
      email: 'member@example.com', email_verified: true,
    }).setProtectedHeader({ alg: 'RS256', kid: key.kid }).setIssuer(fixture.issuer)
      .setAudience(invalidClaim === 'aud' ? 'different-app' : fixture.clientId)
      .setSubject('fictional-provider-subject').setIssuedAt().setExpirationTime('5m').sign(signing.privateKey);
    return Response.json({ id_token: token });
  };
  try {
    const options = await handleAccountApi(request('/api/session'), socialEnv, null);
    assert.deepEqual((await options.json()).providers, ['apple', 'google']);
    const disabled = await handleAccountApi(request('/api/session'), { ...socialEnv, PUBLIC_SITE_ORIGIN: 'https://other.test' }, null);
    assert.deepEqual((await disabled.json()).providers, []);
    assert.equal((await register('')).status, 401);
    flow = await start('google');
    assert.equal(outcome(await callback(flow, '')), '/?auth=retry#account');
    assert.equal(outcome(await callback(flow, flow.cookie, { state: 'f'.repeat(64) })), '/?auth=retry#account');
    assert.equal(outcome(await callback(flow, flow.cookie, { error: 'access_denied' })), '/?auth=cancelled#account');
    assert.equal(outcome(await callback(flow)), '/?auth=retry#account');
    assert.equal(exchanges, 0, 'Missing state, mismatched state and cancellations must never exchange a code.');

    for (const claim of ['nonce', 'aud']) {
      flow = await start('google');
      invalidClaim = claim;
      assert.equal(outcome(await callback(flow)), '/?auth=retry#account');
    }
    invalidClaim = '';
    for (const provider of ['google', 'apple']) {
      flow = await start(provider);
      const responses = await Promise.all([callback(flow), callback(flow)]);
      const verified = responses.find(response=>outcome(response)==='/?auth=register#account');
      assert.ok(verified, 'The signed provider identity leads to registration.');
      assert.equal(responses.filter(response=>outcome(response)==='/?auth=retry#account').length, 1);
      const proof = cookieValue(verified.headers.getSetCookie()[0]);
      assert.match(proof, /^__Host-kq_oauth_proof=/);
      assert.equal(await getSessionUser(request('/api/session', 'GET', undefined, { cookie: proof }), socialEnv), null);
      assert.equal((await register(proof, { consent: false })).status, 400);
      const registration = await register(proof);
      assert.equal(registration.status, 201);
      assert.equal((await register(proof)).status, 401);
      const cookie = cookieValue(registration.headers.getSetCookie()[0]);
      const owner = await getSessionUser(request('/api/session', 'GET', undefined, { cookie }), socialEnv);
      assert.notEqual(owner.userId, emailOwner.userId, 'A matching provider email must never open the existing email account.');
      const session = await (await handleAccountApi(request('/api/session'), socialEnv, owner)).json();
      assert.equal(session.email, null);
      assert.equal(session.profile.name, consent.name);

      flow = await start(provider);
      const returning = await callback(flow);
      assert.equal(outcome(returning), '/?auth=signed-in#account');
      const returningCookie = cookieValue(returning.headers.getSetCookie()[0]);
      assert.deepEqual(await getSessionUser(request('/api/session', 'GET', undefined, { cookie: returningCookie }), socialEnv), owner);
      const deletion = await handleAccountApi(request('/api/account', 'DELETE', { confirm: 'DELETE' }, { csrf: session.csrf }), socialEnv, owner);
      assert.equal(deletion.status, 200);
      assert.equal(db.prepare('SELECT COUNT(*) n FROM oauth_accounts WHERE user_id=?').get(owner.userId).n, 0);
      assert.equal(await getSessionUser(request('/api/session', 'GET', undefined, { cookie: returningCookie }), socialEnv), null);
    }
  } finally {
    globalThis.fetch = emailFetch;
  }
}

try {
  assert.equal((await authCall('code', 'POST', { email: 'member@example.com' }, { origin: 'https://evil.test' })).response.status, 403);
  assert.equal(sent.length, 0, 'Cross-site requests must not send mail.');

  const address = '  MEMBER@example.com ';
  const unconfigured = await handleAuthApi(request('/api/auth/code', 'POST', {email:address}), {...env,RESEND_API_KEY:undefined});
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
  const owner = await getSessionUser(request('/api/session', 'GET', undefined, { cookie: withSiteCookie(sessionCookie) }), env);
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
  const loginOwner = await getSessionUser(request('/api/session', 'GET', undefined, { cookie: loginCookie }), env);
  assert.equal(loginOwner.userId, owner.userId);
  assert.equal(loginCode.response.status, 202);

  const logout = await authCall('logout', 'POST', {}, { cookie: withSiteCookie(loginCookie) });
  assert.equal(logout.response.status, 200);
  assert.ok(logout.response.headers.getSetCookie().length >= 2);
  assert.equal(await getSessionUser(request('/api/session', 'GET', undefined, { cookie: loginCookie }), env), null);

  await verifySocialSignIn(owner);

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
  console.log('Passed: email codes, Google and Apple identity verification, consent-gated registration, session isolation, logout and cascading deletion. No providers were contacted.');
} finally {
  globalThis.fetch = originalFetch;
  db.close();
}
