import { createRemoteJWKSet, importPKCS8, jwtVerify, SignJWT } from 'jose';

const providers = {
  apple: {
    issuer: 'https://appleid.apple.com',
    authorize: 'https://appleid.apple.com/auth/authorize',
    token: 'https://appleid.apple.com/auth/token',
    keys: createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys')),
  },
  google: {
    issuer: ['https://accounts.google.com', 'accounts.google.com'],
    authorize: 'https://accounts.google.com/o/oauth2/v2/auth',
    token: 'https://oauth2.googleapis.com/token',
    keys: createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs')),
  },
};

function signInOrigin(request, env) {
  try {
    const configured = new URL(env.PUBLIC_SITE_ORIGIN);
    if (configured.username || configured.password || configured.pathname !== '/' || configured.search || configured.hash) return null;
    if (configured.origin === new URL(request.url).origin && configured.protocol === 'https:') return configured.origin;
  } catch {}
  return null;
}

function appleConfig(env) {
  if (!env.APPLE_SERVICES_ID || !env.APPLE_TEAM_ID || !env.APPLE_KEY_ID || !env.APPLE_PRIVATE_KEY) return null;
  return { ...providers.apple, provider: 'apple', clientId: env.APPLE_SERVICES_ID, teamId: env.APPLE_TEAM_ID, keyId: env.APPLE_KEY_ID, privateKey: env.APPLE_PRIVATE_KEY };
}

export function oauthConfig(request, env, provider) {
  const origin = signInOrigin(request, env);
  if (!origin || !env.DB || !env.ASSESSMENT_ENCRYPTION_KEY) return null;
  const redirectUri = `${origin}/api/auth/oauth/${provider}/callback`;
  if (provider === 'google' && env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    return { ...providers.google, provider, redirectUri, clientId: env.GOOGLE_CLIENT_ID, secret: env.GOOGLE_CLIENT_SECRET };
  }
  const apple = provider === 'apple' && appleConfig(env);
  if (apple) return { ...apple, redirectUri };
  return null;
}

export function signInProviders(request, env) {
  return ['apple', 'google'].filter(provider => oauthConfig(request, env, provider));
}

export async function authorizationUrl(config, { state, nonce, verifier }) {
  const url = new URL(config.authorize);
  url.search = new URLSearchParams({
    client_id: config.clientId, redirect_uri: config.redirectUri, response_type: 'code', state, nonce,
  }).toString();
  if (config.provider === 'google') {
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
    url.searchParams.set('scope', 'openid');
    url.searchParams.set('code_challenge_method', 'S256');
    url.searchParams.set('code_challenge', btoa(String.fromCharCode(...new Uint8Array(hash))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''));
  } else {
    // Apple supports a GET callback for code-only authorization without name or email scopes.
    url.searchParams.set('response_mode', 'query');
  }
  return url.href;
}

async function appleSecret(config) {
  const key = await importPKCS8(config.privateKey.replace(/\\n/g, '\n'), 'ES256');
  return new SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: config.keyId })
    .setIssuer(config.teamId)
    .setSubject(config.clientId)
    .setAudience(config.issuer)
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(key);
}

export async function exchangeIdentity(config, code, { nonce, verifier }) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code', code, redirect_uri: config.redirectUri, client_id: config.clientId,
    client_secret: config.provider === 'apple' ? await appleSecret(config) : config.secret,
  });
  if (config.provider === 'google') body.set('code_verifier', verifier);
  const response = await fetch(config.token, {
    method: 'POST', body, redirect: 'manual', signal: AbortSignal.timeout(7500),
  });
  if (!response.ok) throw new Error('Identity exchange failed.');
  const { id_token: token, refresh_token: refreshToken } = await response.json();
  if (typeof token !== 'string' || token.length > 8192) throw new Error('Invalid identity token.');
  const { payload } = await jwtVerify(token, config.keys, {
    issuer: config.issuer, audience: config.clientId, algorithms: ['RS256'],
    requiredClaims: ['sub', 'exp', 'iat', 'nonce'], maxTokenAge: '10m', clockTolerance: 30,
  });
  if (payload.nonce !== nonce || typeof payload.sub !== 'string' || !payload.sub || payload.sub.length > 255 ||
      (payload.azp !== undefined && payload.azp !== config.clientId) ||
      (Array.isArray(payload.aud) && payload.aud.length > 1 && payload.azp !== config.clientId)) {
    throw new Error('Invalid identity claims.');
  }
  const appleGrant = config.provider === 'apple' && typeof refreshToken === 'string' && refreshToken.length > 0 && refreshToken.length <= 8192
    ? { clientId: config.clientId, refreshToken }
    : null;
  return { subject: payload.sub, appleGrant };
}

export async function revokeAppleGrant(env, grant) {
  const config = appleConfig(env);
  if (!config || config.clientId !== grant.clientId) return false;
  const body = new URLSearchParams({
    client_id: config.clientId, client_secret: await appleSecret(config),
    token: grant.refreshToken, token_type_hint: 'refresh_token',
  });
  const response = await fetch('https://appleid.apple.com/auth/revoke', {
    method: 'POST', body, redirect: 'manual', signal: AbortSignal.timeout(4000),
  });
  return response.status === 200;
}
