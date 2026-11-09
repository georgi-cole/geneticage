import { NATIVE_APP } from './hosting-mode.mjs';

export const accountOrigin = globalThis.document?.querySelector('meta[name="geneticage-account-origin"]')?.content;
const tokenHeaders = ['X-KQ-Session', 'X-KQ-Email-Proof', 'X-KQ-OAuth-Proof'];
const tokens = new Map();
const hex = bytes => Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
let verifier;

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
  if (!['apple', 'google'].includes(provider)) return;
  verifier = hex(crypto.getRandomValues(new Uint8Array(32)));
  const challenge = hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
  // Load a page on the account origin first. Some system browsers mark the
  // initial app navigation as cross-site, which the OAuth start route rejects.
  const url = new URL('/sign-in-start/', accountOrigin);
  url.searchParams.set('provider', provider);
  url.hash = challenge;
  await globalThis.Capacitor.Plugins.Browser.open({ url: url.href });
}

export function listenForProviderReturn(receive) {
  if (!NATIVE_APP) return;
  const { App, Browser } = globalThis.Capacitor.Plugins;
  void App.addListener('appUrlOpen', async ({ url }) => {
    let link;
    try { link = new URL(url); } catch { return; }
    if (!verifier || link.protocol !== 'xyz.kolequant.geneticage:' || link.hostname !== 'signin' || link.pathname !== '/complete') return;
    const ticket = link.hash.slice(1);
    if (!/^(?:[a-f0-9]{64}|cancelled|retry)$/.test(ticket)) return;
    const secret = verifier;
    verifier = undefined;
    try { await Browser.close(); } catch { /* Android focuses the existing activity on return. */ }
    await receive(ticket, secret);
  });
}

export async function shareNativeExport(data) {
  await globalThis.Capacitor.Plugins.Share.share({ title: 'GeneticAge account export', text: JSON.stringify(data, null, 2) });
}
