// ── Snapshot ─────────────────────────────────────────
function ctSnapshot() {
  return JSON.stringify({
    players: ctState.players.map(p => ({
      ...p,
      balls: [...p.balls],
    })),
    balls: { ...ctState.balls },
    currentIndex: ctState.currentIndex,
  });
}

function ctPushHistory() {
  ctState.history.push(ctSnapshot());
  if (ctState.history.length > 5) ctState.history.shift();
}

function ctUndo() {
  if (!ctState.history.length) return;
  const snap = JSON.parse(ctState.history.pop());
  ctState.players = snap.players.map(p => ({ ...p, balls: new Set(p.balls) }));
  ctState.balls   = snap.balls;
  ctState.currentIndex = snap.currentIndex;
  ctRenderGame();
  showToast('↩ Action annulée');
}

// ── Render ────────────────────────────────────────────
function ctRenderGame() {
  ctRenderPlayers();
  document.getElementById('btnCtUndo').disabled = ctState.history.length === 0;
}

function ctRenderPlayers() {
  document.getElementById('ctPlayersList').innerHTML =
    ctState.players.map((p, i) => {
      const isCurrent = i === ctState.currentIndex && !p.eliminated;
      return `
        <div class="player-card ${isCurrent ? 'active' : ''} ${p.eliminated ? 'eliminated' : ''}">
          <div class="card-top">
            <div class="player-name">
              ${EMOJIS[i % EMOJIS.length]} ${p.name}
              ${isCurrent ? '<span class="badge-active">EN JEU</span>' : ''}
              ${p.eliminated ? '<span class="badge-forced">ÉLIMINÉ</span>' : ''}
            </div>
          </div>
          <div class="ct-balls-row">
            ${[...ctState.distribution.groups[i]].map(b => {
              const state = ctState.balls[b]; // 'in' | 'out' | undefined (retirée)
              if (state === undefined) return ''; // bille retirée, non trackée
              return `
                <button class="ct-ball-btn ${state === 'out' ? 'pocketed' : ''}"
                        onclick="ctToggleBall(${b})"
                        title="Bille ${b}">
                  <img src="assets/bille_${b}.png" alt="${b}">
                </button>`;
            }).join('')}
          </div>
        </div>`;
    }).join('');
}

// ── Toggle bille ──────────────────────────────────────
function ctToggleBall(ballNum) {
  ctPushHistory();

  const wasOut = ctState.balls[ballNum] === 'out';
  ctState.balls[ballNum] = wasOut ? 'in' : 'out';

  // Mise à jour éliminations
  ctState.players.forEach((p, i) => {
    const hasAny = ctState.distribution.groups[i]
      .some(b => ctState.balls[b] === 'in');
    p.eliminated = !hasAny;
  });

  // Vérification victoire : 1 seul joueur non éliminé
  const alive = ctState.players.filter(p => !p.eliminated);
  if (alive.length === 1) {
    ctEndGame(alive[0]);
    return;
  }

  ctRenderGame();
}

// ── Faute ─────────────────────────────────────────────
function ctOpenFaultMenu() {
  const list = document.getElementById('ctFaultPlayerList');
  list.innerHTML = ctState.players.map((p, i) => `
    <button class="joker-choice-btn" onclick="ctSelectFaulter(${i})">
      ${EMOJIS[i % EMOJIS.length]} ${p.name}
    </button>
  `).join('');
  document.getElementById('overlayCtFault').classList.remove('hidden');
}

function ctSelectFaulter(faulterIdx) {
  closeOverlay('overlayCtFault');
  ctPushHistory();

  // Ordre des joueurs qui peuvent remettre une bille : tous sauf le fautif,
  // à partir du joueur suivant le fautif
  const n       = ctState.players.length;
  const returns = [];

  for (let offset = 1; offset < n; offset++) {
    const idx = (faulterIdx + offset) % n;
    const p   = ctState.players[idx];
    // Peut remettre si au moins une bille est 'out'
    const pocketedBalls = ctState.distribution.groups[idx]
      .filter(b => ctState.balls[b] === 'out');
    if (pocketedBalls.length > 0) {
      returns.push({ playerIdx: idx, ball: pocketedBalls[0] });
    }
  }

  // Remettre les billes en jeu
  returns.forEach(r => {
    ctState.balls[r.ball] = 'in';
    ctState.players[r.playerIdx].eliminated = false;
  });

  // Afficher le popup récap
  ctShowFaultResult(faulterIdx, returns);
  ctRenderGame();
}

function ctShowFaultResult(faulterIdx, returns) {
  const faulter = ctState.players[faulterIdx];
  document.getElementById('ctFaultTitle').textContent =
    `Faute de ${faulter.name}`;

  document.getElementById('ctFaultReturns').innerHTML = returns.length
    ? returns.map(r => {
        const p = ctState.players[r.playerIdx];
        return `
          <div class="recap-row">
            <span>${EMOJIS[r.playerIdx % EMOJIS.length]}</span>
            <span>${p.name}</span>
            <span>remet la</span>
            <img src="assets/bille_${r.ball}.png" class="ball-mini" alt="${r.ball}">
          </div>`;
      }).join('')
    : '<div style="color:rgba(255,255,255,0.5);font-size:14px;">Aucune bille à remettre en jeu.</div>';

  document.getElementById('overlayCtFaultResult').classList.remove('hidden');
}

// ── Fin de partie ─────────────────────────────────────
function ctEndGame(winner) {
  document.getElementById('ctWinName').textContent =
    `${EMOJIS[ctState.players.indexOf(winner) % EMOJIS.length]} ${winner.name} gagne !`;
  document.getElementById('overlayCtWin').classList.remove('hidden');
}

function ctRestart() {
  closeOverlay('overlayCtWin');
  ctStartGame();
}

function ctNewGame() {
  closeOverlay('overlayCtWin');
  showLauncher();
}
