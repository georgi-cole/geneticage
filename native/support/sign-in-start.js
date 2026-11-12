const url = new URL(location.href);
const provider = url.searchParams.get('provider');
const challenge = url.hash.slice(1);
if (['apple', 'google'].includes(provider) && /^[a-f0-9]{64}$/.test(challenge)) {
  const params = new URLSearchParams({ native_challenge: challenge });
  if (url.searchParams.get('return') === 'app') params.set('native_return', 'app');
  const destination = '/api/auth/oauth/' + provider + '/start?' + params;
  const link = document.getElementById('provider-link');
  link.href = destination;
  link.hidden = false;
  document.getElementById('message').textContent = 'Opening your sign-in provider…';
  location.replace(destination);
}
