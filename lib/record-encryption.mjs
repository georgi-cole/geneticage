const encoder = new TextEncoder();
export function b64(bytes) {
  // Bounded chunks avoid argument-count limits for long bilingual report snapshots.
  const chunks = [];
  for (let offset = 0; offset < bytes.length; offset += 32768) chunks.push(String.fromCharCode(...bytes.subarray(offset, offset + 32768)));
  return btoa(chunks.join(''));
}
const unb64 = value => Uint8Array.from(atob(value), c => c.charCodeAt(0));

export function keyBytes(env) {
  const bytes = unb64(env.ASSESSMENT_ENCRYPTION_KEY || '');
  if (bytes.length !== 32) throw new Error('Storage key unavailable');
  return bytes;
}

export async function seal(env, owner, id, kind, value) {
  const key = await crypto.subtle.importKey('raw', keyBytes(env), 'AES-GCM', false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: encoder.encode(`${owner}:${id}:${kind}`) }, key, encoder.encode(JSON.stringify(value)));
  return `v1.${b64(iv)}.${b64(new Uint8Array(data))}`;
}

export async function unseal(env, owner, id, kind, value) {
  const [version, iv, data] = value.split('.');
  if (version !== 'v1') throw new Error('Unknown storage version');
  const key = await crypto.subtle.importKey('raw', keyBytes(env), 'AES-GCM', false, ['decrypt']);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(iv), additionalData: encoder.encode(`${owner}:${id}:${kind}`) }, key, unb64(data));
  return JSON.parse(new TextDecoder().decode(plain));
}
