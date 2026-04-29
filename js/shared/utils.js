function closeOverlay(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('hidden');
}


function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const r = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[r]] = [arr[r], arr[i]];
  }
}

function showToast(msg) {
  const old = document.getElementById('toast');
  if (old) old.remove();
  const t = document.createElement('div');
  t.id = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

/**
 * Lie la touche Entrée d'un input à une fonction callback.
 * À appeler à chaque fois que l'input est affiché.
 */
function bindEnterKey(inputId, callback) {
  const input = document.getElementById(inputId);
  if (!input) return;
  // Retirer l'ancien listener pour éviter les doublons
  input._enterHandler && input.removeEventListener('keydown', input._enterHandler);
  input._enterHandler = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      callback();
    }
  };
  input.addEventListener('keydown', input._enterHandler);
}
