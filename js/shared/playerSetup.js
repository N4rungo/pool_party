/**
 * Génère les inputs de noms dans un conteneur.
 * @param {string} containerId
 * @param {Array}  players  - [{ name: string }]
 * @param {Object} options  - { maxLength: number, placeholder: string }
 */
function renderPlayerNameInputs(containerId, players, options = {}) {
  const { maxLength = 16, placeholder = 'Pseudo...' } = options;
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = players.map((p, i) => `
    <div class="player-name-row">
      <span class="player-name-emoji">${EMOJIS[i % EMOJIS.length]}</span>
      <input
        type="text"
        class="player-name-input"
        data-index="${i}"
        maxlength="${maxLength}"
        placeholder="${placeholder}"
        value="${escapeHtml(p.name)}"
      >
    </div>
  `).join('');
}

/**
 * Lit les inputs et met à jour le tableau players in-place.
 * @param {string} containerId
 * @param {Array}  players  - [{ name: string }]
 */
function collectPlayerNames(containerId, players) {
  const inputs = document.querySelectorAll(`#${containerId} .player-name-input`);
  inputs.forEach((input, i) => {
    players[i].name = input.value.trim() || `Joueur ${i + 1}`;
  });
}

/**
 * Génère le récap joueurs dans un conteneur.
 * @param {string}   containerId
 * @param {Array}    players     - [{ name: string }]
 * @param {Function} extraColFn  - (player, index) => htmlString | null
 */
function renderRecap(containerId, players, extraColFn = null) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = players.map((p, i) => `
    <div class="recap-row">
      <span class="recap-emoji">${EMOJIS[i % EMOJIS.length]}</span>
      <span class="recap-name">${escapeHtml(p.name)}</span>
      ${extraColFn ? extraColFn(p, i) : ''}
    </div>
  `).join('');
}

/**
 * Échappe les caractères HTML pour éviter les injections.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
