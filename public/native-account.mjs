import { NATIVE_APP } from './hosting-mode.mjs';

export const accountOrigin = globalThis.document?.querySelector('meta[name="geneticage-account-origin"]')?.content;
const tokenHeaders = ['X-KQ-Session', 'X-KQ-Email-Proof', 'X-KQ-OAuth-Proof'];
const tokens = new Map();
const hex = bytes => Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
let verifier;
let openingProvider = false;

export function forgetNativeAccount() {
  tokens.clear();
  verifier = undefined;
}

export async function accountFetch(path, options) {
  if (!NATIVE_APP) return fetch('/api/' + path, options);
  const headers = new Headers(options.headers);
  for (const [name, token] of tokens) headers.set(name, token);
  const response = await fetch(accountOrigin + '/api/native/' + path, { ...options, credentials: 'omit', headers });
  for (const name of tokenHeaders) {
    const token = response.headers.get(name);
    if (token === '') tokens.delete(name);
    if (token) tokens.set(name, token);
  }
  return response;
}

export async function openProvider(provider) {
  if (!['apple', 'google'].includes(provider) || openingProvider) return;
  openingProvider = true;
  const secret = hex(crypto.getRandomValues(new Uint8Array(32)));
  verifier = secret;
  const { Browser, GeneticAgeProviderSession } = globalThis.Capacitor.Plugins;
  try {
    const challenge = hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret)));
    // Start from the account origin so the OAuth start request is same-origin.
    const url = new URL('/sign-in-start/', accountOrigin);
    url.searchParams.set('provider', provider);
    url.hash = challenge;
    if (!GeneticAgeProviderSession) {
      await Browser.open({ url: url.href });
      return;
    }
    url.searchParams.set('return', 'app');
    const result = await GeneticAgeProviderSession.open({ url: url.href });
    if (result.cancelled) return { ticket: 'cancelled' };
    const response = claimProviderReturn(result.url);
    if (!response) throw new Error('Invalid provider return.');
    return response;
  } catch (error) {
    if (verifier === secret) verifier = undefined;
    throw error;
  } finally {
    if (GeneticAgeProviderSession && verifier === secret) verifier = undefined;
    openingProvider = false;
  }
}

function claimProviderReturn(url) {
  let link;
  try { link = new URL(url); } catch { return; }
  if (!verifier || link.protocol !== 'xyz.kolequant.geneticage:' || link.hostname !== 'signin' || link.pathname !== '/complete') return;
  const ticket = link.hash.slice(1);
  if (!/^(?:[a-f0-9]{64}|cancelled|retry)$/.test(ticket)) return;
  const response = { ticket, verifier };
  verifier = undefined;
  return response;
}

export function listenForProviderReturn(receive) {
  if (!NATIVE_APP) return;
  const { App, Browser } = globalThis.Capacitor.Plugins;
  void App.addListener('appUrlOpen', async ({ url }) => {
    const response = claimProviderReturn(url);
    if (!response) return;
    try { await Browser.close(); } catch { /* Android focuses the existing activity on return. */ }
    await receive(response);
  });
}

export async function shareNativeExport(data) {
  await globalThis.Capacitor.Plugins.Share.share({ title: 'GeneticAge account export', text: JSON.stringify(data, null, 2) });
}
