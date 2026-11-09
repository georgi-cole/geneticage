import { handleAccountApi } from '../lib/account-api.mjs';
import { getSessionUser, handleAuthApi } from '../lib/auth-api.mjs';
import privacyPage from './support/privacy.html';
import deletionPage from './support/delete-account.html';
import startPage from './support/sign-in-start.html';
import returnPage from './support/sign-in-return.html';
import deletionScript from './support/delete-account.js';
import startScript from './support/sign-in-start.js';
import returnScript from './support/sign-in-return.js';
import stylesheet from './support/support.css';

const appOrigins = new Set(['https://localhost', 'capacitor://localhost']);
const tokenPattern = /^[a-f0-9]{64}$/;
const appCookies = ['session', 'email_proof', 'oauth_proof'];
const tokenHeader = name => 'X-KQ-' + name.replaceAll('_', '-');
const exposedHeaders = appCookies.map(tokenHeader).join(', ');
const webAuth = /^\/api\/auth\/(?:code|verify|logout|oauth\/(?:apple|google)\/(?:start|callback))$/;
const appApi = /^\/api\/(?:session|account(?:\/export)?|assessments(?:\/[a-f0-9-]+(?:\/report)?)?|auth\/(?:code|verify|register|logout|native-complete|store-review))$/;
const assets = new Map([
  ['', ['text/html', deletionPage]],
  ['/privacy', ['text/html', privacyPage]],
  ['/delete-account', ['text/html', deletionPage]],
  ['/sign-in-start', ['text/html', startPage]],
  ['/sign-in-return', ['text/html', returnPage]],
  ['/support.css', ['text/css', stylesheet]],
  ['/delete-account.js', ['text/javascript', deletionScript]],
  ['/sign-in-start.js', ['text/javascript', startScript]],
  ['/sign-in-return.js', ['text/javascript', returnScript]],
]);

async function dispatch(request, env) {
  return await handleAuthApi(request, env) ?? handleAccountApi(request, env, await getSessionUser(request, env));
}

function secureHeaders(response) {
  const result = new Response(response.body, response);
  result.headers.set('X-Content-Type-Options', 'nosniff');
  result.headers.set('Referrer-Policy', 'no-referrer');
  result.headers.set('X-Robots-Tag', 'noindex');
  result.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  result.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'");
  result.headers.set('Cache-Control', 'no-store');
  return result;
}

async function appRequest(request, env, url) {
  const origin = request.headers.get('Origin');
  const path = url.pathname.replace(/^\/api\/native\//, '/api/');
  if (!appOrigins.has(origin) || !appApi.test(path)) return new Response('Not found', { status: 404 });
  const cors = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Expose-Headers': exposedHeaders,
    'Vary': 'Origin',
  };
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: {
      ...cors, 'Access-Control-Allow-Methods': 'GET, POST, DELETE',
      'Access-Control-Allow-Headers': 'Content-Type, X-KQ-CSRF, ' + exposedHeaders,
    } });
  }
  const headers = new Headers({ Origin: url.origin });
  for (const name of ['content-type', 'content-length', 'x-kq-csrf', 'cf-connecting-ip']) {
    const value = request.headers.get(name);
    if (value !== null) headers.set(name, value);
  }
  const cookies = appCookies.flatMap(name => {
    const token = request.headers.get(tokenHeader(name));
    return tokenPattern.test(token) ? [`__Host-kq_${name}=${token}`] : [];
  });
  if (cookies.length) headers.set('Cookie', cookies.join('; '));
  const internal = new Request(new Request(new URL(path + url.search, url), request), { headers });
  const response = await dispatch(internal, env);
  const result = new Response(response.body, { status: response.status, headers: cors });
  result.headers.set('Content-Type', response.headers.get('Content-Type') || 'application/json');
  for (const cookie of response.headers.getSetCookie()) {
    const [key, value] = cookie.split(';', 1)[0].split('=');
    const name = key.replace(/^__Host-kq_/, '');
    if (appCookies.includes(name) && (tokenPattern.test(value) || value === '')) result.headers.set(tokenHeader(name), value);
  }
  return result;
}

const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, '');
    if (url.origin !== env.PUBLIC_SITE_ORIGIN) return new Response('Not found', { status: 404 });
    if (path.startsWith('/api/native/')) return secureHeaders(await appRequest(request, env, url));
    if (path.startsWith('/api/')) {
      const allowed = webAuth.test(path) ||
        (path === '/api/session' && request.method === 'GET') ||
        (path === '/api/account' && request.method === 'DELETE');
      const result = allowed ? await dispatch(request, { ...env, STORE_WEB_DELETION_ONLY: 'true' }) : new Response('Not found', { status: 404 });
      return secureHeaders(result);
    }
    const asset = assets.get(path);
    if (!asset || !['GET', 'HEAD'].includes(request.method)) return new Response('Not found', { status: 404 });
    return secureHeaders(new Response(request.method === 'HEAD' ? null : asset[1], {
      headers: { 'Content-Type': asset[0] + '; charset=utf-8' },
    }));
  },
  async scheduled(_controller, env) {
    const now = Date.now();
    const bucket = Math.floor(now / 3600000);
    await env.DB.batch([
      env.DB.prepare('DELETE FROM oauth_pending WHERE expires_at<=?1').bind(now),
      env.DB.prepare('DELETE FROM auth_sessions WHERE expires_at<=?1').bind(now),
      env.DB.prepare('DELETE FROM email_auth_codes WHERE COALESCE(proof_expires_at, expires_at)<=?1').bind(now),
      env.DB.prepare('DELETE FROM auth_rate_limits WHERE bucket<?1').bind(bucket - 24),
    ]);
  },
};

export default worker;
