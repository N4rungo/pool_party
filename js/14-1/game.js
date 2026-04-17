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

// ── Actions ──────────────────────────────────────────
function spChangeBreak(delta) {
  const newBreak = spState.currentBreak + delta;
  if (newBreak < 0) return; // break ne peut pas être négatif

  spSaveHistory();

  spState.currentBreak = newBreak;
  const player = spState.players[spState.currentIndex];
  player.score += delta;

  if (spState.currentBreak > player.bestBreak) {
    player.bestBreak = spState.currentBreak;
  }

  // Vérif victoire
  if (player.score >= player.target) {
    spState.winner = spState.currentIndex;
    spRender();
    spEndGame(player);
    return;
  }

  spRender();
}

function spPass() {
  spSaveHistory();
  spState.currentBreak = 0;
  spState.currentIndex = (spState.currentIndex + 1) % spState.players.length;
  spRender();
  showToast(`👤 Tour de ${spState.players[spState.currentIndex].name}`);
}

function spFault() {
  spSaveHistory();
  spState.players[spState.currentIndex].score--;
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
function spEndGame(player) {
  document.getElementById('spWinName').textContent  = `${player.name}`;
  document.getElementById('spWinScore').textContent = `${player.score} points`;
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
