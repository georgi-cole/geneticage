import { randomInt } from 'node:crypto';
import { CONSENT_VERSION } from '../public/account-consent.mjs';
import { authorizationUrl, exchangeIdentity, oauthConfig } from './oauth-provider.mjs';

const encoder = new TextEncoder();
const OTP_LIFETIME_MS = 10 * 60 * 1000;
const PROOF_LIFETIME_MS = 15 * 60 * 1000;
const OAUTH_FLOW_MS = 10 * 60 * 1000;
const SESSION_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;
const EMAIL_LIMIT_PER_HOUR = 3;
const IP_LIMIT_PER_HOUR = 15;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const AUTH_TOKEN = /^[a-f0-9]{64}$/;

class AuthError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

const fail = (status, message) => { throw new AuthError(status, message); };

function json(value, status = 200, extraHeaders = {}) {
  const headers = new Headers({
    'Cache-Control': 'private, no-store, max-age=0',
    'Pragma': 'no-cache',
    'Vary': 'Cookie',
    'X-Content-Type-Options': 'nosniff',
  });
  for (const [name, item] of Object.entries(extraHeaders)) {
    if (name.toLowerCase() === 'set-cookie' && Array.isArray(item)) {
      for (const cookie of item) headers.append(name, cookie);
    } else {
      headers.set(name, item);
    }
  }
  return Response.json(value, { status, headers });
}

function keyBytes(env) {
  try {
    const bytes = Uint8Array.from(atob(env.ASSESSMENT_ENCRYPTION_KEY || ''), c => c.charCodeAt(0));
    if (bytes.length === 32) return bytes;
  } catch {}
  fail(503, 'Sign-in is not configured yet.');
}

async function mac(env, purpose, value) {
  const master = await crypto.subtle.importKey('raw', keyBytes(env), 'HKDF', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: encoder.encode('kolequant-auth-v1'), info: encoder.encode('email-auth-hmac') },
    master,
    { name: 'HMAC', hash: 'SHA-256', length: 256 },
    false,
    ['sign'],
  );
  const signed = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(`${purpose}:${value}`)));
  return [...signed].map(value => value.toString(16).padStart(2, '0')).join('');
}

function equal(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return difference === 0;
}

function randomHex(size) {
  return [...crypto.getRandomValues(new Uint8Array(size))].map(value => value.toString(16).padStart(2, '0')).join('');
}

function cookieName(request, name) {
  return new URL(request.url).protocol === 'https:' ? `__Host-kq_${name}` : `kq_${name}`;
}
function authCookie(request, name, token, lifetime) {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `${cookieName(request, name)}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${lifetime / 1000}${secure}`;
}
function clearCookie(request, name) {
  return authCookie(request, name, '', 0);
}

function cookieValue(request, name) {
  for (const raw of (request.headers.get('cookie') || '').split(';')) {
    const part = raw.trim();
    const split = part.indexOf('=');
    if (split >= 0 && part.slice(0, split).trim() === name) return part.slice(split + 1).trim();
  }
  return '';
}

async function readBody(request) {
  if (Number(request.headers.get('content-length')) > 4096) fail(413, 'The request is too large.');
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) fail(415, 'A JSON request is required.');
  if (request.headers.get('origin') !== new URL(request.url).origin || request.headers.get('sec-fetch-site') === 'cross-site') {
    fail(403, 'Please use this website to sign in.');
  }
  const reader = request.body?.getReader();
  if (!reader) fail(400, 'Please check the request.');
  const decoder = new TextDecoder();
  let size = 0, content = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 4096) {
      await reader.cancel();
      fail(413, 'The request is too large.');
    }
    content += decoder.decode(value, {stream:true});
  }
  let data;
  try { data = JSON.parse(content + decoder.decode()); } catch { fail(400, 'Please check the request.'); }
  if (!data || typeof data !== 'object' || Array.isArray(data)) fail(400, 'Please check the request.');
  return data;
}

function normalizeEmail(value) {
  if (typeof value !== 'string') fail(400, 'Enter a valid email address.');
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !EMAIL_RE.test(email) || /[\r\n\0]/.test(email)) fail(400, 'Enter a valid email address.');
  return email;
}

async function bumpLimit(env, purpose, subject, limit, bucket) {
  const keyHash = await mac(env, 'rate-limit', `${purpose}:${subject}`);
  const result = await env.DB.prepare(
    'INSERT INTO auth_rate_limits (key_hash,bucket,count) VALUES (?1,?2,1) ON CONFLICT(key_hash) DO UPDATE SET bucket=excluded.bucket,count=CASE WHEN auth_rate_limits.bucket=excluded.bucket THEN auth_rate_limits.count+1 ELSE 1 END RETURNING count',
  ).bind(keyHash, bucket).first();
  return result.count <= limit;
}

async function sendCode(env, email, code) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    signal: AbortSignal.timeout(7500),
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.AUTH_EMAIL_FROM || 'KoleQuant <support@kolequant.xyz>',
      to: [email],
      reply_to: 'support@kolequant.xyz',
      subject: 'Your KoleQuant sign-in code',
      text: `Your KoleQuant sign-in code is ${code}. It expires in 10 minutes. If you did not request this code, you can ignore this email. Never share your code. No health information is included in this email.`,
    }),
  });
  if (!response.ok) fail(503, 'We could not send a sign-in code. Please try again later.');
}

async function requestCode(request, env) {
  if (!env.DB) fail(503, 'Account storage is temporarily unavailable.');
  const data = await readBody(request);
  const email = normalizeEmail(data.email);
  if (!env.RESEND_API_KEY) fail(503, 'Email sign-in is not configured yet.');
  const now = Date.now(), bucket = Math.floor(now / 3600000);
  await env.DB.prepare('DELETE FROM auth_rate_limits WHERE bucket<?1').bind(bucket - 24).run();
  const ip = request.headers.get('CF-Connecting-IP') || 'unavailable';
  if (!(await bumpLimit(env, 'email', email, EMAIL_LIMIT_PER_HOUR, bucket)) ||
      !(await bumpLimit(env, 'ip', ip, IP_LIMIT_PER_HOUR, bucket))) {
    fail(429, 'Too many sign-in requests. Please try again later.');
  }
  await env.DB.prepare('DELETE FROM email_auth_codes WHERE coalesce(proof_expires_at,expires_at)<=?1').bind(now).run();

  const code = String(randomInt(100000000)).padStart(8, '0');
  const codeHash = await mac(env, 'email-code', `${email}:${code}`);
  await env.DB.prepare(
    'INSERT INTO email_auth_codes (email,code_hash,expires_at,attempts,verified_at,proof_hash,proof_expires_at,created_at) VALUES (?1,?2,?3,0,NULL,NULL,NULL,?4) ON CONFLICT(email) DO UPDATE SET code_hash=excluded.code_hash,expires_at=excluded.expires_at,attempts=0,verified_at=NULL,proof_hash=NULL,proof_expires_at=NULL,created_at=excluded.created_at',
  ).bind(email, codeHash, now + OTP_LIFETIME_MS, now).run();

  try { await sendCode(env, email, code); }
  catch (error) {
    await env.DB.prepare('DELETE FROM email_auth_codes WHERE email=?1 AND code_hash=?2').bind(email, codeHash).run();
    throw error;
  }
  return json({ sent: true, message: 'If this address can receive sign-in codes, one has been sent.' }, 202);
}

async function createSession(env, request, userId) {
  const token = randomHex(32), tokenHash = await mac(env, 'session', token), now = Date.now();
  await env.DB.prepare('DELETE FROM auth_sessions WHERE expires_at<=?1').bind(now).run();
  await env.DB.prepare('INSERT INTO auth_sessions (token_hash,user_id,created_at,expires_at) VALUES (?1,?2,?3,?4)')
    .bind(tokenHash, userId, now, now + SESSION_LIFETIME_MS).run();
  return authCookie(request, 'session', token, SESSION_LIFETIME_MS);
}

async function verifyCode(request, env) {
  if (!env.DB) fail(503, 'Account storage is temporarily unavailable.');
  const data = await readBody(request);
  const email = normalizeEmail(data.email);
  const code = typeof data.code === 'string' ? data.code.trim() : '';
  if (!/^\d{8}$/.test(code)) fail(400, 'Enter the 8-digit code from your email.');
  const now = Date.now();
  const challenge = await env.DB.prepare(
    'UPDATE email_auth_codes SET attempts=attempts+1 WHERE email=?1 AND expires_at>?2 AND attempts<?3 AND verified_at IS NULL RETURNING code_hash',
  ).bind(email, now, MAX_OTP_ATTEMPTS).first();
  if (!challenge || !equal(await mac(env, 'email-code', `${email}:${code}`), challenge.code_hash)) {
    fail(400, 'That code is incorrect or expired. Request a new one and try again.');
  }

  const account = await env.DB.prepare('SELECT user_id FROM auth_accounts WHERE email=?1').bind(email).first();
  const proof = account ? null : randomHex(32);
  const proofHash = proof ? await mac(env, 'email-proof', proof) : null;
  const claimed = await env.DB.prepare(
    'UPDATE email_auth_codes SET verified_at=?1,proof_hash=?2,proof_expires_at=?3 WHERE email=?4 AND code_hash=?5 AND verified_at IS NULL AND expires_at>?1 RETURNING email',
  ).bind(now, proofHash, proof ? now + PROOF_LIFETIME_MS : null, email, challenge.code_hash).first();
  if (!claimed) fail(400, 'That code is incorrect or expired. Request a new one and try again.');
  if (account) {
    const cookie = await createSession(env, request, account.user_id);
    await env.DB.prepare('DELETE FROM email_auth_codes WHERE email=?1 AND code_hash=?2').bind(email, challenge.code_hash).run();
    return json({ authenticated: true, registrationRequired: false }, 200, {
      'Set-Cookie': [cookie, clearCookie(request, 'email_proof')],
    });
  }
  return json({ authenticated: false, registrationRequired: true }, 200, {
    'Set-Cookie': authCookie(request, 'email_proof', proof, PROOF_LIFETIME_MS),
  });
}

function oauthRedirect(location, cookies = []) {
  const headers = new Headers({ Location: location, 'Cache-Control': 'private, no-store, max-age=0', 'Referrer-Policy': 'no-referrer' });
  for (const cookie of cookies) headers.append('Set-Cookie', cookie);
  return new Response(null, { status: 303, headers });
}

function oauthReturn(status, cookies) {
  return oauthRedirect(`/?auth=${status}#account`, cookies);
}

async function oauthTransaction(env, config, token) {
  const context = JSON.stringify([config.provider, config.clientId, config.redirectUri, token]);
  const [state, nonce, verifier, tokenHash] = await Promise.all(
    ['oauth-state', 'oauth-nonce', 'oauth-verifier', 'oauth-flow'].map(purpose => mac(env, purpose, context)),
  );
  return { state, nonce, verifier, tokenHash };
}

async function startOAuth(request, env, config) {
  const fetchSite = request.headers.get('Sec-Fetch-Site');
  if (fetchSite && !['same-origin', 'none'].includes(fetchSite)) return oauthReturn('retry');
  if (await getSessionUser(request, env)) return oauthReturn('signed-in');
  const now = Date.now(), bucket = Math.floor(now / 3600000);
  const ip = request.headers.get('CF-Connecting-IP') || 'unavailable';
  if (!(await bumpLimit(env, 'oauth', ip, 60, bucket))) return oauthReturn('retry');
  const token = randomHex(32), transaction = await oauthTransaction(env, config, token);
  const destination = await authorizationUrl(config, transaction);
  await env.DB.batch([
    env.DB.prepare('DELETE FROM auth_rate_limits WHERE bucket<?1').bind(bucket - 24),
    env.DB.prepare('DELETE FROM oauth_pending WHERE expires_at<=?1').bind(now),
    env.DB.prepare('INSERT INTO oauth_pending (token_hash,provider,expires_at) VALUES (?1,?2,?3)')
      .bind(transaction.tokenHash, config.provider, now + OAUTH_FLOW_MS),
  ]);
  return oauthRedirect(destination, [authCookie(request, 'oauth_state', token, OAUTH_FLOW_MS)]);
}

function oauthAccount(env, provider, subjectHash) {
  return env.DB.prepare('SELECT user_id FROM oauth_accounts WHERE provider=?1 AND subject_hash=?2')
    .bind(provider, subjectHash);
}

async function finishOAuth(request, env, config) {
  const params = new URL(request.url).searchParams;
  const state = params.get('state');
  const token = cookieValue(request, cookieName(request, 'oauth_state'));
  if (!AUTH_TOKEN.test(state) || !AUTH_TOKEN.test(token)) return oauthReturn('retry');
  const transaction = await oauthTransaction(env, config, token);
  if (!equal(state, transaction.state)) return oauthReturn('retry');
  const claimed = await env.DB.prepare(
    'DELETE FROM oauth_pending WHERE token_hash=?1 AND provider=?2 AND subject_hash IS NULL AND expires_at>?3 RETURNING token_hash',
  ).bind(transaction.tokenHash, config.provider, Date.now()).first();
  if (!claimed) return oauthReturn('retry');
  if (params.has('error')) {
    return oauthReturn(['access_denied', 'user_cancelled_authorize'].includes(params.get('error')) ? 'cancelled' : 'retry');
  }
  const code = params.get('code');
  if (!code || code.length > 2048) return oauthReturn('retry');
  if (await getSessionUser(request, env)) return oauthReturn('signed-in');
  const subject = await exchangeIdentity(config, code, transaction);
  const subjectHash = await mac(env, 'oauth-subject', JSON.stringify([config.provider, config.clientId, subject]));
  const account = await oauthAccount(env, config.provider, subjectHash).first();
  if (account) return oauthReturn('signed-in', [await createSession(env, request, account.user_id)]);

  const proof = randomHex(32);
  await env.DB.prepare('INSERT INTO oauth_pending (token_hash,provider,expires_at,subject_hash) VALUES (?1,?2,?3,?4)')
    .bind(await mac(env, 'oauth-proof', proof), config.provider, Date.now() + PROOF_LIFETIME_MS, subjectHash).run();
  return oauthReturn('register', [authCookie(request, 'oauth_proof', proof, PROOF_LIFETIME_MS)]);
}

function validateNickname(value) {
  const name = typeof value === 'string' ? value.trim() : '';
  if (!name || name.length > 40 || /[\u0000-\u001f]/.test(name)) fail(400, 'Choose an account nickname of 1–40 characters.');
  return name;
}

async function register(request, env) {
  if (!env.DB) fail(503, 'Account storage is temporarily unavailable.');
  const data = await readBody(request);
  if (data.consent !== true || data.adult !== true || data.consentVersion !== CONSENT_VERSION) {
    fail(400, 'Confirm that you are an adult and agree to the account storage notice.');
  }
  const name = validateNickname(data.name);
  const social = data.signInMethod === 'social', now = Date.now();
  if (social && await getSessionUser(request, env)) fail(409, 'Sign out before using a different account.');
  const nameOfProof = social ? 'oauth_proof' : 'email_proof';
  const proof = cookieValue(request, cookieName(request, nameOfProof));
  if (!AUTH_TOKEN.test(proof)) fail(401, social ? 'Start Apple or Google sign-in again.' : 'Verify your email address before creating an account.');
  const proofHash = await mac(env, social ? 'oauth-proof' : 'email-proof', proof);
  const verified = await (social
    ? env.DB.prepare('DELETE FROM oauth_pending WHERE token_hash=?1 AND subject_hash IS NOT NULL AND expires_at>?2 RETURNING provider,subject_hash')
    : env.DB.prepare('DELETE FROM email_auth_codes WHERE proof_hash=?1 AND verified_at IS NOT NULL AND proof_expires_at>?2 RETURNING email')
  ).bind(proofHash, now).first();
  if (!verified) fail(401, social ? 'Your sign-in expired. Please sign in again.' : 'Your email verification expired. Request a new code.');

  const identity = social ? oauthAccount(env, verified.provider, verified.subject_hash)
    : env.DB.prepare('SELECT user_id FROM auth_accounts WHERE email=?1').bind(verified.email);
  let userId = (await identity.first())?.user_id, created = false;
  if (!userId) {
    userId = crypto.randomUUID();
    const timestamp = new Date(now).toISOString();
    try {
      await env.DB.batch([
        env.DB.prepare('INSERT INTO profiles (user_id,nickname,consent_version,consent_at,created_at) VALUES (?1,?2,?3,?4,?4)').bind(userId, name, CONSENT_VERSION, timestamp),
        social
          ? env.DB.prepare('INSERT INTO oauth_accounts (user_id,provider,subject_hash) VALUES (?1,?2,?3)').bind(userId, verified.provider, verified.subject_hash)
          : env.DB.prepare('INSERT INTO auth_accounts (user_id,email,created_at) VALUES (?1,?2,?3)').bind(userId, verified.email, timestamp),
      ]);
      created = true;
    } catch {
      const raced = await identity.first();
      if (!raced) fail(409, 'Could not finish account registration. Please sign in again.');
      userId = raced.user_id;
    }
  }
  const cookie = await createSession(env, request, userId);
  return json({ authenticated: true, created }, 201, {
    'Set-Cookie': [cookie, clearCookie(request, nameOfProof)],
  });
}

async function logout(request, env) {
  if (!env.DB) fail(503, 'Account storage is temporarily unavailable.');
  await readBody(request);
  const token = cookieValue(request, cookieName(request, 'session'));
  if (/^[a-f0-9]{64}$/i.test(token)) {
    await env.DB.prepare('DELETE FROM auth_sessions WHERE token_hash=?1').bind(await mac(env, 'session', token)).run();
  }
  const proof = cookieValue(request, cookieName(request, 'email_proof'));
  if (/^[a-f0-9]{64}$/i.test(proof)) {
    await env.DB.prepare('DELETE FROM email_auth_codes WHERE proof_hash=?1').bind(await mac(env, 'email-proof', proof)).run();
  }
  const socialProof = cookieValue(request, cookieName(request, 'oauth_proof'));
  if (AUTH_TOKEN.test(socialProof)) {
    await env.DB.prepare('DELETE FROM oauth_pending WHERE token_hash=?1').bind(await mac(env, 'oauth-proof', socialProof)).run();
  }
  return json({ signedOut: true }, 200, {
    'Set-Cookie': [clearCookie(request, 'session'), clearCookie(request, 'email_proof'), clearCookie(request, 'oauth_proof'), clearCookie(request, 'oauth_state')],
  });
}

export async function getSessionUser(request, env) {
  if (!env.DB || !env.ASSESSMENT_ENCRYPTION_KEY) return null;
  const token = cookieValue(request, cookieName(request, 'session'));
  if (!/^[a-f0-9]{64}$/i.test(token)) return null;
  try {
    const tokenHash = await mac(env, 'session', token);
    return await env.DB.prepare('SELECT user_id AS userId FROM auth_sessions WHERE token_hash=?1 AND expires_at>?2')
      .bind(tokenHash, Date.now()).first();
  } catch { return null; }
}

export async function handleAuthApi(request, env) {
  const path = new URL(request.url).pathname.replace(/\/$/, '');
  const method = request.method;
  const oauth = path.match(/^\/api\/auth\/oauth\/(apple|google)\/(start|callback)$/);
  if (oauth) {
    if (method !== 'GET') return json({ error: 'Method not supported.' }, 405, { Allow: 'GET' });
    const [, provider, phase] = oauth;
    const config = oauthConfig(request, env, provider);
    if (!config) return oauthReturn('retry');
    try {
      return await (phase === 'start' ? startOAuth(request, env, config) : finishOAuth(request, env, config));
    } catch {
      return oauthReturn('retry');
    }
  }
  const handlers = {
    '/api/auth/code': ['POST', requestCode],
    '/api/auth/verify': ['POST', verifyCode],
    '/api/auth/register': ['POST', register],
    '/api/auth/logout': ['POST', logout],
  };
  const route = handlers[path];
  if (!route) return null;
  try {
    if (method !== route[0]) return json({ error: 'Method not supported.' }, 405, { Allow: route[0] });
    return await route[1](request, env);
  } catch (error) {
    const status = error instanceof AuthError ? error.status : 503;
    const message = error instanceof AuthError ? error.message : 'Sign-in is temporarily unavailable.';
    return json({ error: message }, status);
  }
}
