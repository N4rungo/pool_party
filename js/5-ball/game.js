// ── Démarrage ─────────────────────────────────────────
function fiveBallStart() {
  fiveBallState.players = fiveBallSetup.players.map(p => ({
    name:   p.name,
    target: p.target,
    score:  p.target,
  }));
  fiveBallState.currentIndex = 0;
  fiveBallState.turnNumber   = 0;
  fiveBallState.isFirstTurn  = true;
  fiveBallState.selected     = [];
  fiveBallState.history      = [];

  closeOverlay('fiveBallOverlayStep3');
  document.getElementById('fiveBallGame').classList.remove('hidden');
  fiveBallRender();
}

// ── Helpers ───────────────────────────────────────────
function fiveBallActiveCueBall() {
  // Alternance stricte : tour pair = blanche, tour impair = jaune.
  // Conséquence : à 2 joueurs, J1 garde la blanche et J2 la jaune.
  return fiveBallState.turnNumber % 2 === 0 ? 'white' : 'yellow';
}

function fiveBallSelectedTotal() {
  return fiveBallState.selected.reduce(
    (sum, id) => sum + FIVE_BALL_BALLS[id].value, 0
  );
}

function fiveBallIsBustRemaining(remaining) {
  return remaining < 0 || FIVE_BALL_BUST_REMAINING.includes(remaining);
}

// ── Rendu ─────────────────────────────────────────────
function fiveBallRender() {
  fiveBallRenderScoreboard();
  fiveBallRenderBanner();
  fiveBallRenderBalls();
  fiveBallRenderActionBar();
  document.getElementById('fiveBallBtnUndo').disabled =
    fiveBallState.history.length === 0;
}

function fiveBallRenderScoreboard() {
  const html = fiveBallState.players.map((p, i) => {
    const active = i === fiveBallState.currentIndex ? ' active' : '';
    return `
      <div class="fb-player-row${active}">
        <span class="fb-player-emoji">${EMOJIS[i % EMOJIS.length]}</span>
        <span class="fb-player-name">${escapeHtml(p.name)}</span>
        <span class="fb-player-score">${p.score}<span class="fb-player-target"> / ${p.target}</span></span>
      </div>`;
  }).join('');
  document.getElementById('fiveBallScoreboard').innerHTML = html;
}

function fiveBallRenderBanner() {
  const cue = fiveBallActiveCueBall();
  const cueLabel = FIVE_BALL_BALLS[cue].label;
  const player   = fiveBallState.players[fiveBallState.currentIndex];

  let extra = '';
  if (fiveBallState.isFirstTurn) {
    extra = `<div class="fb-banner-engagement">🎯 Engagement — la rouge doit être touchée en premier !</div>`;
  }

  document.getElementById('fiveBallBanner').innerHTML = `
    <div class="fb-banner-current">À ${escapeHtml(player.name)} de jouer</div>
    <div class="fb-banner-cue">Cue ball : <strong>${cueLabel}</strong></div>
    ${extra}
  `;
}

function fiveBallRenderBalls() {
  const cue = fiveBallActiveCueBall();
  const html = ['red', 'blue', 'white', 'green', 'yellow'].map(id => {
    const b = FIVE_BALL_BALLS[id];
    const isCue      = id === cue;
    const isSelected = fiveBallState.selected.includes(id);
    const classes    = ['fb-ball', `fb-ball-${id}`];
    if (isCue)      classes.push('fb-ball-cue');
    if (isSelected) classes.push('fb-ball-selected');

    const onclick = isCue ? '' : `onclick="fiveBallToggleBall('${id}')"`;
    return `
      <button class="${classes.join(' ')}" ${onclick} aria-label="${b.label} (${b.value})">
        <img src="assets/${b.asset}" alt="${b.value}">
      </button>`;
  }).join('');
  document.getElementById('fiveBallBoard').innerHTML = html;
}

function fiveBallRenderActionBar() {
  const total      = fiveBallSelectedTotal();
  const player     = fiveBallState.players[fiveBallState.currentIndex];
  const count      = fiveBallState.selected.length;
  const validCount = count >= 2;
  const hasRed     = fiveBallState.selected.includes('red');
  const remaining  = player.score - total;

  let preview;
  if (count === 0) {
    preview = `<span class="fb-preview-muted">Aucune bille sélectionnée — tour passé sans points.</span>`;
  } else if (!validCount) {
    preview = `<span class="fb-preview-muted">1 seule bille — il en faut au moins 2 pour scorer.</span>`;
  } else if (fiveBallState.isFirstTurn && !hasRed) {
    preview = `<span class="fb-preview-bust">Engagement raté : la rouge doit être touchée.</span>`;
  } else if (fiveBallIsBustRemaining(remaining)) {
    preview = `<span class="fb-preview-bust">−${total} → resterait ${remaining} : tour annulé.</span>`;
  } else if (remaining === 0) {
    preview = `<span class="fb-preview-win">−${total} → 0 pile, partie gagnée ! 🏆</span>`;
  } else {
    preview = `<span class="fb-preview-ok">−${total} → reste ${remaining} pts</span>`;
  }

  document.getElementById('fiveBallPreview').innerHTML = preview;
}

// ── Actions ───────────────────────────────────────────
function fiveBallToggleBall(id) {
  if (id === fiveBallActiveCueBall()) return;
  const idx = fiveBallState.selected.indexOf(id);
  if (idx >= 0) fiveBallState.selected.splice(idx, 1);
  else          fiveBallState.selected.push(id);
  fiveBallRenderBalls();
  fiveBallRenderActionBar();
}

function fiveBallPushHistory() {
  if (fiveBallState.history.length >= 10) fiveBallState.history.shift();
  fiveBallState.history.push(JSON.stringify({
    players:      fiveBallState.players,
    currentIndex: fiveBallState.currentIndex,
    turnNumber:   fiveBallState.turnNumber,
    isFirstTurn:  fiveBallState.isFirstTurn,
  }));
}

function fiveBallValidateTurn() {
  const player    = fiveBallState.players[fiveBallState.currentIndex];
  const selected  = fiveBallState.selected;
  const total     = fiveBallSelectedTotal();
  const remaining = player.score - total;

  fiveBallPushHistory();

  // Cas d'annulation : faute, engagement raté ou bust
  const validCount = selected.length >= 2;
  const hasRed     = selected.includes('red');
  const isBust     = fiveBallIsBustRemaining(remaining);

  let scored = false;
  if (!validCount) {
    if (selected.length === 1) showToast('1 seule bille touchée — tour passé.');
  } else if (fiveBallState.isFirstTurn && !hasRed) {
    showToast('Engagement raté : la rouge doit être touchée en premier.');
  } else if (isBust) {
    if (remaining < 0) showToast(`Score négatif (${remaining}) — tour annulé.`);
    else               showToast(`Reste ${remaining} : score impossible à clore — tour annulé.`);
  } else {
    player.score = remaining;
    scored = true;
  }

  // L'engagement ne dure qu'un seul coup, succès ou non
  fiveBallState.isFirstTurn = false;

  if (scored && player.score === 0) {
    fiveBallShowWin(player);
    return;
  }

  // Tour suivant
  fiveBallState.selected     = [];
  fiveBallState.turnNumber  += 1;
  fiveBallState.currentIndex = (fiveBallState.currentIndex + 1) % fiveBallState.players.length;
  fiveBallRender();
}

function fiveBallUndo() {
  if (fiveBallState.history.length === 0) return;
  const prev = JSON.parse(fiveBallState.history.pop());
  fiveBallState.players      = prev.players;
  fiveBallState.currentIndex = prev.currentIndex;
  fiveBallState.turnNumber   = prev.turnNumber;
  fiveBallState.isFirstTurn  = prev.isFirstTurn;
  fiveBallState.selected     = [];
  fiveBallRender();
}

// ── Victoire ──────────────────────────────────────────
function fiveBallShowWin(player) {
  document.getElementById('fiveBallWinName').textContent = player.name;
  document.getElementById('fiveBallOverlayWin').classList.remove('hidden');
}

function fiveBallReplay() {
  closeOverlay('fiveBallOverlayWin');
  fiveBallStart();
}

function fiveBallNewGame() {
  closeOverlay('fiveBallOverlayWin');
  document.getElementById('fiveBallGame').classList.add('hidden');
  showLauncher();
}
