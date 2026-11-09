const url = new URL(location.href);
const provider = url.searchParams.get('provider');
const challenge = url.hash.slice(1);
if (['apple', 'google'].includes(provider) && /^[a-f0-9]{64}$/.test(challenge)) {
  const destination = '/api/auth/oauth/' + provider + '/start?native_challenge=' + challenge;
  const link = document.getElementById('provider-link');
  link.href = destination;
  link.hidden = false;
  document.getElementById('message').textContent = 'Opening your sign-in provider…';
  location.replace(destination);
}
