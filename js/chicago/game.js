// ── Historique ───────────────────────────────────────
function saveChicagoHistory() {
  const snapshot = JSON.stringify({
    players:       chicagoState.players.map(p => ({ ...p })),
    currentIndex:  chicagoState.currentIndex,
    pocketedBalls: [...chicagoState.pocketedBalls],
  });
  chicagoState.history.push(snapshot);
  if (chicagoState.history.length > CHICAGO_MAX_HISTORY) {
    chicagoState.history.shift();
  }
  updateChicagoUndoBtn();
}

function undoChicagoAction() {
  if (chicagoState.history.length === 0) return;
  const prev = JSON.parse(chicagoState.history.pop());
  chicagoState.players       = prev.players;
  chicagoState.currentIndex  = prev.currentIndex;
  chicagoState.pocketedBalls = new Set(prev.pocketedBalls);
  renderChicagoGame();
  showToast('↩ Action annulée');
}

function updateChicagoUndoBtn() {
  const btn = document.getElementById('btnChicagoUndo');
  if (btn) btn.disabled = chicagoState.history.length === 0;
}

// ── Actions ──────────────────────────────────────────
function chicagoPocketBall(number) {
  if (chicagoState.pocketedBalls.has(number)) return;

  saveChicagoHistory();
  chicagoState.pocketedBalls.add(number);
  chicagoState.players[chicagoState.currentIndex].score += number;

  const [p0, p1] = chicagoState.players;

  // Victoire par score
  if (p0.score >= CHICAGO_TARGET_SCORE || p1.score >= CHICAGO_TARGET_SCORE) {
    renderChicagoGame();
    showChicagoWin(p0.score > p1.score ? p0 : p1);
    return;
  }

  // Toutes les billes empochées → fin de partie
  if (chicagoState.pocketedBalls.size === 15) {
    renderChicagoGame();
    if (p0.score === p1.score) {
      showChicagoDraw(p0.score);
    } else {
      showChicagoWin(p0.score > p1.score ? p0 : p1);
    }
    return;
  }

  renderChicagoGame();
  showToast(`🎱 +${number} pts pour ${chicagoState.players[chicagoState.currentIndex].name} !`);
}


function chicagoEndTurn() {
  saveChicagoHistory();
  chicagoState.currentIndex = chicagoState.currentIndex === 0 ? 1 : 0;
  renderChicagoGame();
  const current = chicagoState.players[chicagoState.currentIndex];
  showToast(`👤 Tour de ${current.name}`);
}

// ── Victoire ─────────────────────────────────────────
function showChicagoWin(winner) {
  document.getElementById('chicagoWinTrophy').textContent = '🏆';
  document.getElementById('chicagoWinSub').textContent    = 'Félicitations !';
  document.getElementById('chicagoWinName').textContent = winner.name;
  document.getElementById('overlayChicagoWin').classList.remove('hidden');
}

// ── Egalité ─────────────────────────────────────────
function showChicagoDraw(score) {
  document.getElementById('chicagoWinName').textContent  = 'Égalité !';
  document.getElementById('chicagoWinSub').textContent   = `Les deux joueurs finissent à ${score} points`;
  document.getElementById('chicagoWinTrophy').textContent = '🤝';
  document.getElementById('overlayChicagoWin').classList.remove('hidden');
}

function chicagoNewGame() {
  closeOverlay('overlayChicagoWin');
  document.getElementById('gameChicago').classList.add('hidden');
  showLauncher();
}

function chicagoReplay() {
  closeOverlay('overlayChicagoWin');
  chicagoState.players.forEach(p => p.score = 0);
  chicagoState.currentIndex  = 0;
  chicagoState.pocketedBalls = new Set();
  chicagoState.history       = [];
  renderChicagoGame();
}

// ── Render ───────────────────────────────────────────
function renderChicagoGame() {
  renderChicagoScores();
  renderChicagoTriangle();
  updateChicagoUndoBtn();
}

function chicagoBackToLauncher() {
  closeOverlay('overlayChicagoSetup');
  showLauncher();
}

function renderChicagoScores() {
  const [p0, p1] = chicagoState.players;
  const ci = chicagoState.currentIndex;

  document.getElementById('chicagoScore0').innerHTML = `
    <div class="chicago-player-name ${ci === 0 ? 'chicago-active' : ''}">${p0.name}</div>
    <div class="chicago-score ${ci === 0 ? 'chicago-active' : ''}">${p0.score}</div>
  `;
  document.getElementById('chicagoScore1').innerHTML = `
    <div class="chicago-player-name ${ci === 1 ? 'chicago-active' : ''}">${p1.name}</div>
    <div class="chicago-score ${ci === 1 ? 'chicago-active' : ''}">${p1.score}</div>
  `;

  // barre de progression
  [0, 1].forEach(i => {
    const pct = Math.min(100, Math.round(chicagoState.players[i].score / CHICAGO_TARGET_SCORE * 100));
    document.getElementById(`chicagoProgress${i}`).style.width = pct + '%';
  });

  document.getElementById('chicagoScoreCard0').classList.toggle('active-card', ci === 0);
  document.getElementById('chicagoScoreCard1').classList.toggle('active-card', ci === 1);
}

function renderChicagoTriangle() {
  const container = document.getElementById('chicagoTriangle');
  container.innerHTML = CHICAGO_TRIANGLE.map(row => `
    <div class="chicago-row">
      ${row.map(n => {
        const pocketed = chicagoState.pocketedBalls.has(n);
        return `
          <button
            class="chicago-ball ${pocketed ? 'pocketed' : ''}"
            onclick="chicagoPocketBall(${n})"
            ${pocketed ? 'disabled' : ''}
          >
            <img src="assets/bille_${n}.png" alt="Bille ${n}">
          </button>`;
      }).join('')}
    </div>
  `).join('');
}