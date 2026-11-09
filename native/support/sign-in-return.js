const value = location.hash.slice(1);
history.replaceState(null, '', location.pathname);
if (/^(?:[a-f0-9]{64}|cancelled|retry)$/.test(value)) {
  const link = document.getElementById('return-link');
  link.href = 'xyz.kolequant.geneticage://signin/complete#' + value;
  link.hidden = false;
} else {
  document.getElementById('message').textContent = 'Open GeneticAge and start sign-in again.';
}
