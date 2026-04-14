// ── Start ────────────────────────────────────────────────────
function snookerStart() {
    closeOverlay('snookerOverlayStep3');

    snookerState.players = snookerSetup.players.map(p => ({
        name: p.name,
        score: 0,
        currentBreak: 0,
        bestBreak: 0,
    }));

    snookerState.currentIndex = 0;
    snookerState.redsRemaining = SNOOKER_TOTAL_REDS;
    snookerState.phase = 'red';
    snookerState.endgameColorIdx = 0;
    snookerState.freeBall = false;
    snookerState.freeBallActive = false;
    snookerState.mustReplay = false;
    snookerState.multiRedCount = 1;
    snookerState.mode = snookerSetup.mode;
    snookerState.history = [];

    document.getElementById('gameSnooker').classList.remove('hidden');
    snookerRender();
}

// ── History / Undo ───────────────────────────────────────────
function snookerSaveHistory() {
    const snap = JSON.parse(JSON.stringify({
        players: snookerState.players,
        currentIndex: snookerState.currentIndex,
        redsRemaining: snookerState.redsRemaining,
        phase: snookerState.phase,
        endgameColorIdx: snookerState.endgameColorIdx,
        freeBall: snookerState.freeBall,
        freeBallActive: snookerState.freeBallActive,
        mustReplay: snookerState.mustReplay,
    }));
    snookerState.history.push(snap);
    if (snookerState.history.length > SNOOKER_MAX_HISTORY) {
        snookerState.history.shift();
    }
}

function snookerUndo() {
    if (snookerState.history.length === 0) return;
    const snap = snookerState.history.pop();
    Object.assign(snookerState, snap);
    snookerRender();
}

// ── Render ───────────────────────────────────────────────────
function snookerRender() {
    snookerRenderScoreboard();
    snookerRenderActions();
    snookerRenderActiveInfo();
    document.getElementById('snookerBtnUndo').disabled = snookerState.history.length === 0;
}

function snookerRenderScoreboard() {
    document.getElementById('snookerScoreboard').innerHTML =
        snookerState.players.map((p, i) => {
            const isActive = i === snookerState.currentIndex;
            return `
        <div class="snooker-score-card ${isActive ? 'active' : ''}">
          <span class="snooker-score-emoji">${EMOJIS[i % EMOJIS.length]}</span>
          <span class="snooker-score-name">${p.name}</span>
          <span class="snooker-score-pts">${p.score}</span>
          <span class="snooker-best-break" title="Meilleur break">🏆 ${p.bestBreak}</span>
        </div>`;
        }).join('');
}

function snookerRenderActiveInfo() {
    const p = snookerState.players[snookerState.currentIndex];
    document.getElementById('snookerActiveName').textContent = p.name;
    document.getElementById('snookerBreakNow').textContent = snookerState.mustReplay
        ? `${p.name} rejoue (suite à une faute)`
        : `Break : ${p.currentBreak}`;

    // Indication de phase
    let phaseLabel = '';
    if (snookerState.phase === 'red') phaseLabel = '🔴 Jouer une rouge';
    if (snookerState.phase === 'color') phaseLabel = '🎱 Jouer une couleur';
    if (snookerState.phase === 'endgame') phaseLabel = snookerEndgameLabel();
    document.getElementById('snookerPhaseLabel').textContent = phaseLabel;
}

function snookerEndgameLabel() {
    const ball = SNOOKER_COLORS_ORDER[snookerState.endgameColorIdx];
    const b = SNOOKER_BALLS[ball];
    return `Phase finale — jouer : ${b.label} (${b.points} pts)`;
}

function snookerRenderActions() {
  const zone = document.getElementById('snookerActionZone');
  zone.innerHTML = '';

  if (snookerState.phase === 'red') {
    const wrap = document.createElement('div');
    wrap.className = 'snooker-red-wrap';
    wrap.appendChild(snookerBtnBall('red'));
    wrap.appendChild(snookerBtnMultiRed());
    zone.appendChild(wrap);

  } else if (snookerState.phase === 'color' || snookerState.phase === 'color_last') {
    const grid = document.createElement('div');
    grid.className = 'snooker-colors-grid';
    SNOOKER_COLORS_ORDER.forEach(colorId => {
      grid.appendChild(snookerBtnBall(colorId));
    });
    zone.appendChild(grid);

  } else if (snookerState.phase === 'endgame') {
    const grid = document.createElement('div');
    grid.className = 'snooker-colors-grid';
    SNOOKER_COLORS_ORDER.forEach((colorId, idx) => {
      const btn = snookerBtnBall(colorId);
      if (idx !== snookerState.endgameColorIdx) {
        btn.disabled = true;
        btn.classList.add('snooker-btn-inactive');
      } else {
        btn.classList.add('snooker-btn-next');
      }
      grid.appendChild(btn);
    });
    zone.appendChild(grid);
  }

  // Free ball (mode expert uniquement, si activée)
  if (snookerState.freeBallActive && snookerState.mode === 'expert') {
    const fbBtn = document.createElement('button');
    fbBtn.className = 'btn-main btn-gold snooker-freeball-btn';
    fbBtn.textContent = '🎱 Free Ball';
    fbBtn.onclick = snookerPlayFreeBall;
    zone.appendChild(fbBtn);
  }
}



function snookerBtnBall(ballId) {
    const b = SNOOKER_BALLS[ballId];
    const btn = document.createElement('button');
    btn.className = 'snooker-ball-btn';
    btn.innerHTML = `<img src="${b.icon}" alt="${b.label}"><span>${b.points} pt${b.points > 1 ? 's' : ''}</span>`;
    btn.onclick = () => snookerPocketBall(ballId);
    return btn;
}

function snookerBtnMultiRed() {
    const btn = document.createElement('button');
    btn.className = 'btn-main btn-gray snooker-multired-btn';
    btn.textContent = '🔴×N Plusieurs rouges';
    btn.onclick = snookerOpenMultiRed;
    return btn;
}

// ── Pocket a ball ────────────────────────────────────────────
function snookerPocketBall(ballId) {
    snookerSaveHistory();
    const player = snookerState.players[snookerState.currentIndex];
    const pts = SNOOKER_BALLS[ballId].points;

    player.score += pts;
    player.currentBreak += pts;
    if (player.currentBreak > player.bestBreak) {
        player.bestBreak = player.currentBreak;
    }

    if (ballId === 'red') {
        snookerState.redsRemaining--;
        // Après une rouge : jouer une couleur
        if (snookerState.redsRemaining >= 0) {
            snookerState.phase = 'color';
        } else {
            // Plus de rouges → phase finale
            snookerState.phase = 'endgame';
        }
    } else {
        // Couleur jouée
        if (snookerState.phase === 'color') {
            // Remise en jeu → retour rouge (si encore des rouges)
            snookerState.phase = snookerState.redsRemaining > 0 ? 'red' : 'endgame';
        } else if (snookerState.phase === 'endgame') {
            snookerState.endgameColorIdx++;
            if (snookerState.endgameColorIdx >= SNOOKER_COLORS_ORDER.length) {
                snookerEndFrame();
                return;
            }
        }
    }

    snookerRender();
}

// ── Multi-rouges ─────────────────────────────────────────────
function snookerOpenMultiRed() {
    snookerState.multiRedCount = 2;
    document.getElementById('snookerMultiRedCount').textContent = snookerState.multiRedCount;
    document.getElementById('snookerOverlayMultiRed').classList.remove('hidden');
}

function snookerMultiRedChange(delta) {
    const max = snookerState.redsRemaining;
    snookerState.multiRedCount = Math.min(max, Math.max(2, snookerState.multiRedCount + delta));
    document.getElementById('snookerMultiRedCount').textContent = snookerState.multiRedCount;
}

function snookerConfirmMultiRed() {
    closeOverlay('snookerOverlayMultiRed');
    snookerSaveHistory();
    const player = snookerState.players[snookerState.currentIndex];
    const n = snookerState.multiRedCount;
    const pts = n * SNOOKER_BALLS.red.points; // 1 pt par rouge

    player.score += pts;
    player.currentBreak += pts;
    if (player.currentBreak > player.bestBreak) player.bestBreak = player.currentBreak;

    snookerState.redsRemaining -= n;
    snookerState.phase = snookerState.redsRemaining > 0 ? 'color' : 'endgame';
    snookerRender();
}

// ── Fault ────────────────────────────────────────────────────
function snookerOpenFault() {
    snookerState.faulterIndex = snookerState.currentIndex;
    // Calcul de la valeur min de la faute selon la phase
    const minFault = snookerGetMinFault();
    document.getElementById('snookerFaultValue').textContent = minFault;
    snookerState._faultVal = minFault;
    document.getElementById('snookerOverlayFault').classList.remove('hidden');
}

function snookerGetMinFault() {
    if (snookerState.phase === 'red') return Math.max(SNOOKER_MIN_FAULT, 1);
    if (snookerState.phase === 'color') return SNOOKER_MIN_FAULT;
    if (snookerState.phase === 'endgame') {
        const ball = SNOOKER_COLORS_ORDER[snookerState.endgameColorIdx];
        return Math.max(SNOOKER_MIN_FAULT, SNOOKER_BALLS[ball].points);
    }
    return SNOOKER_MIN_FAULT;
}

function snookerFaultChangeVal(delta) {
    snookerState._faultVal = Math.max(snookerGetMinFault(),
        Math.min(7, snookerState._faultVal + delta));
    document.getElementById('snookerFaultValue').textContent = snookerState._faultVal;
}

function snookerConfirmFault() {
    closeOverlay('snookerOverlayFault');
    const val = snookerState._faultVal;
    const mode = snookerState.mode;

    snookerSaveHistory();

    // Reset break du fautif
    const faulter = snookerState.players[snookerState.currentIndex];
    faulter.currentBreak = 0;

    if (mode === 'simple') {
        // Tous les autres joueurs reçoivent les points
        snookerState.players.forEach((p, i) => {
            if (i !== snookerState.currentIndex) p.score += val;
        });
        snookerNextPlayer();
        snookerRender();
    } else {
        // Mode expert : popup de choix pour le joueur suivant
        const nextName = snookerState.players[snookerState.faulterIndex].name;
        document.getElementById('snookerExpertFaultVal').textContent = val;
        document.getElementById('snookerExpertFaultWho').textContent = nextName;
        snookerState._faultVal = val;
        document.getElementById('snookerOverlayExpertFault').classList.remove('hidden');
    }
}

// Mode expert : choix après faute
function snookerExpertFaultChoice(takePoints, replay) {
    closeOverlay('snookerOverlayExpertFault');
    const val    = snookerState._faultVal;
    const nextIdx = snookerNextIndex(); // index de l'adversaire (receveur)

    if (takePoints) {
        snookerState.players[nextIdx].score += val;
    }

    if (replay) {
        // C'est le joueur SUIVANT (nextIdx) qui rejoue, pas le fautif
        snookerState.currentIndex = nextIdx;
        snookerState.mustReplay   = true;
        // Free ball proposée au joueur qui va rejouer
        if (snookerState.phase === 'red' || snookerState.phase === 'endgame') {
            snookerState.freeBall = true;
            snookerOpenFreeBallChoice();
            return;
        }
    } else {
        snookerNextPlayer();
    }
    snookerRender();
}

// ── Free Ball ────────────────────────────────────────────────
function snookerOpenFreeBallChoice() {
    document.getElementById('snookerOverlayFreeBall').classList.remove('hidden');
}

function snookerConfirmFreeBall(useFreeBall) {
    closeOverlay('snookerOverlayFreeBall');
    snookerState.freeBallActive = useFreeBall;
    snookerRender();
}

function snookerPlayFreeBall() {
    snookerSaveHistory();
    const player = snookerState.players[snookerState.currentIndex];
    let pts;

    if (snookerState.phase === 'red') {
        pts = 1;
        // Après free ball en phase rouge → jouer une couleur
        snookerState.phase = 'color';
    } else if (snookerState.phase === 'endgame') {
        const ball = SNOOKER_COLORS_ORDER[snookerState.endgameColorIdx];
        pts = SNOOKER_BALLS[ball].points;
        // endgameColorIdx ne bouge PAS, la bille "on" reste à jouer
        // phase reste 'endgame'
    }

    player.score        += pts;
    player.currentBreak += pts;
    if (player.currentBreak > player.bestBreak) player.bestBreak = player.currentBreak;

    snookerState.freeBallActive = false;
    snookerState.freeBall       = false;
    snookerState.mustReplay     = false;

    snookerRender();
}

// ── Turn management ──────────────────────────────────────────
function snookerNextIndex() {
    const n = snookerState.players.length;
    return (snookerState.currentIndex + 1) % n;
}

function snookerNextPlayer() {
    // Reset break du joueur courant
    const cur = snookerState.players[snookerState.currentIndex];
    if (cur.currentBreak > cur.bestBreak) cur.bestBreak = cur.currentBreak;
    cur.currentBreak = 0;

    snookerState.currentIndex = snookerNextIndex();
    snookerState.mustReplay = false;
    snookerState.freeBallActive = false;
    snookerState.freeBall = false;

    if (snookerState.redsRemaining > 0) {
        snookerState.phase = 'red';
    } else if (snookerState.redsRemaining === 0 && snookerState.phase === 'color') {
        snookerState.phase = 'endgame';
    }
}

// Bouton "Passer la main" (fin de tour volontaire)
function snookerEndTurn() {
    snookerSaveHistory();
    snookerNextPlayer();
    snookerRender();
}

// ── End frame ────────────────────────────────────────────────
function snookerEndFrame() {
    // Trouver le gagnant (score max)
    let winner = snookerState.players[0];
    snookerState.players.forEach(p => { if (p.score > winner.score) winner = p; });

    document.getElementById('snookerWinName').textContent = winner.name;
    document.getElementById('snookerWinScore').textContent = `${winner.score} points`;
    document.getElementById('snookerWinBreak').textContent = `Meilleur break : ${winner.bestBreak}`;

    // Tableau des scores finaux
    document.getElementById('snookerFinalScores').innerHTML =
        snookerState.players
            .slice()
            .sort((a, b) => b.score - a.score)
            .map((p, i) => `
        <div class="recap-row">
          <span>${i === 0 ? '🏆' : EMOJIS[snookerState.players.indexOf(p) % EMOJIS.length]}</span>
          <span>${p.name}</span>
          <span>${p.score} pts</span>
          <span style="font-size:12px;color:rgba(255,255,255,0.5);">Break: ${p.bestBreak}</span>
        </div>`).join('');

    document.getElementById('snookerOverlayWin').classList.remove('hidden');
}

function snookerNewGame() {
    closeOverlay('snookerOverlayWin');
    document.getElementById('gameSnooker').classList.add('hidden');
    showLauncher();
}

function snookerReplay() {
    closeOverlay('snookerOverlayWin');
    snookerStart();
}