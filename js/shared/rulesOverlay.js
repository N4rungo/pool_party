// Affiche les règles d'un jeu dans un overlay.
// Utilise marked.js (chargé via CDN dans index.html) pour parser le markdown.
function showRules(gameId) {
  const overlay = document.getElementById('overlayRules');
  const content = document.getElementById('rulesContent');
  if (!overlay || !content) return;

  content.innerHTML = '<div class="rules-loading">⏳ Chargement…</div>';
  overlay.classList.remove('hidden');
  // Reset du scroll quand on ouvre une nouvelle fiche
  overlay.querySelector('.popup-box')?.scrollTo?.(0, 0);

  fetch(`rules/${gameId}.md`)
    .then(r => {
      if (!r.ok) throw new Error(`Règles ${gameId} non trouvées (${r.status})`);
      return r.text();
    })
    .then(md => {
      content.innerHTML = marked.parse(md);
    })
    .catch(err => {
      content.innerHTML = `<div class="rules-error">⚠️ ${escapeHtml(err.message)}</div>`;
    });
}

function closeRules() {
  closeOverlay('overlayRules');
}
