// ── History ──────────────────────────────────────────
function spSaveHistory() {
  const snapshot = {
    players:      spState.players.map(p => ({ ...p })),
    currentIndex: spState.currentIndex,
    currentBreak: spState.currentBreak,
    winner:       spState.winner,
  };
  spState.history.push(snapshot);
  if (spState.history.length > STRAIGHTPOOL_MAX_HISTORY) {
    spState.history.shift();
  }
}

function spUndo() {
  if (spState.history.length === 0) return;
  const snapshot = spState.history.pop();
  spState.players      = snapshot.players;
  spState.currentIndex = snapshot.currentIndex;
  spState.currentBreak = snapshot.currentBreak;
  spState.winner       = snapshot.winner;

  // Si on revient avant une victoire, fermer l'overlay
  if (spState.winner === null) {
    closeOverlay('overlaySPWin');
  }
  spRender();
}

function spUndoFromWin() {
  closeOverlay('overlaySPWin');
  spUndo();
}

// ── Actions ──────────────────────────────────────────
function spChangeBreak(delta) {
  const newBreak = Math.max(0, spState.currentBreak + delta);
  const player   = spState.players[spState.currentIndex];

  // Delta positif : on met à jour le score immédiatement
  if (delta > 0) {
    spSaveHistory();
    player.score += 1;
    spState.currentBreak = newBreak;
    // Victoire ?
    if (player.score >= player.target) {
      spEndGame(player);
      return;
    }
  } else {
    // Delta négatif : on retire du score, mais sans sauvegarder dans l'historique
    if (spState.currentBreak === 0) return;
    player.score = Math.max(0, player.score - 1);
    spState.currentBreak = newBreak;
  }

  // bestBreak mis à jour seulement si le break courant dépasse l'ancien max
  // → NON : on ne touche plus à bestBreak ici, uniquement dans spPass/spFault
  spRender();
}

function spPass() {
  spSaveHistory();
  const player = spState.players[spState.currentIndex];
  // Valider le bestBreak maintenant
  if (spState.currentBreak > player.bestBreak) {
    player.bestBreak = spState.currentBreak;
  }
  spState.currentBreak  = 0;
  spState.currentIndex  = (spState.currentIndex + 1) % spState.players.length;
  spRender();
  showToast(`👤 Tour de ${spState.players[spState.currentIndex].name}`);
}

function spFault() {
  spSaveHistory();
  const player = spState.players[spState.currentIndex];
  // Retire 1 point (le dernier empoche du break, ou pénalité si break = 0)
  player.score -= 1;
  // bestBreak : on valide le break courant - 1 (sans le point retiré)
  const effectiveBreak = Math.max(0, spState.currentBreak - 1);
  if (effectiveBreak > player.bestBreak) {
    player.bestBreak = effectiveBreak;
  }
  spState.currentBreak = 0;
  spState.currentIndex = (spState.currentIndex + 1) % spState.players.length;
  spRender();
  showToast(`⚠️ Faute ! −1 point`);
}

// ── Render ───────────────────────────────────────────
function spRender() {
  spRenderPlayers();
  spRenderBreak();
  document.getElementById('btnSpUndo').disabled = spState.history.length === 0;
}

function spRenderPlayers() {
  const container = document.getElementById('spPlayersList');
  container.innerHTML = spState.players.map((p, i) => {
    const isActive = i === spState.currentIndex;
    const pct      = Math.min(100, Math.max(0, (p.score / p.target) * 100));
    return `
      <div class="player-card ${isActive ? 'active' : ''}">
        <div class="card-top">
          <div class="player-name">
            ${EMOJIS[i % EMOJIS.length]} ${p.name}
            ${isActive ? '<span class="badge-active">EN JEU</span>' : ''}
          </div>
          <div class="sp-score">${p.score} <span class="sp-target-label">/ ${p.target}</span></div>
        </div>
        <div class="chicago-progress-bar">
          <div class="chicago-progress-fill" style="width:${pct}%"></div>
        </div>
        <div class="sp-best-break">🏆 Meilleur break : ${p.bestBreak}</div>
      </div>
    `;
  }).join('');
}

function spRenderBreak() {
  document.getElementById('spBreakDisplay').textContent = spState.currentBreak;
}

// ── Victoire ─────────────────────────────────────────
function spEndGame(winner) {
  // Valider le bestBreak du gagnant
  if (spState.currentBreak > winner.bestBreak) {
    winner.bestBreak = spState.currentBreak;
  }
  spState.currentBreak = 0;
  spState.winner = winner;

  // Classement : tri par score décroissant
  const ranked = [...spState.players].sort((a, b) => b.score - a.score);

  document.getElementById('spWinName').textContent =
    `${EMOJIS[spState.players.indexOf(winner) % EMOJIS.length]} ${winner.name} gagne !`;

  document.getElementById('spWinRanking').innerHTML = ranked.map((p, i) => {
    const idx    = spState.players.indexOf(p);
    const isWin  = p === winner;
    return `
      <div class="sp-ranking-row ${isWin ? 'sp-ranking-winner' : ''}">
        <span class="sp-rank">${i + 1}.</span>
        <span class="sp-rank-emoji">${EMOJIS[idx % EMOJIS.length]}</span>
        <span class="sp-rank-name">${p.name}</span>
        <span class="sp-rank-score">${p.score} pts</span>
        <span class="sp-rank-break">🏅 ${p.bestBreak}</span>
      </div>`;
  }).join('');

  document.getElementById('overlaySPWin').classList.remove('hidden');
}

function spReplay() {
  closeOverlay('overlaySPWin');
  spState.players.forEach(p => {
    p.score     = 0;
    p.bestBreak = 0;
  });
  spState.currentIndex = 0;
  spState.currentBreak = 0;
  spState.history      = [];
  spState.winner       = null;
  spRender();
}

function spNewGame() {
  closeOverlay('overlaySPWin');
  showLauncher();
}
