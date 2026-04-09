// ── Step 1 : nombre de joueurs ───────────────────────
function ctChangeCount(delta) {
  ctSetup.count = Math.min(15, Math.max(2, ctSetup.count + delta));
  document.getElementById('ctCountDisplay').textContent = ctSetup.count;
}

function ctGoToPlayerSetup() {
  ctSetup.players = Array.from({ length: ctSetup.count }, () => ({ name: '' }));
  ctSetup.currentSetup = 0;
  closeOverlay('overlayCtStep1');
  ctShowPlayerSetup();
}

// ── Step 2 : noms des joueurs ────────────────────────
function ctShowPlayerSetup() {
  const i   = ctSetup.currentSetup;
  const n   = ctSetup.count;
  const lvl = i === 0 ? 'Débutant' : i === n - 1 ? 'Expert' : `Niveau ${i + 1}`;

  document.getElementById('ctPlayerProgress').textContent =
    `Joueur ${i + 1} / ${n}`;
  document.getElementById('ctPlayerTitle').textContent = lvl;
  document.getElementById('ctPlayerEmoji').textContent =
    EMOJIS[i % EMOJIS.length];
  document.getElementById('ctPlayerName').value =
    ctSetup.players[i].name;
  document.getElementById('ctBtnPrevPlayer').disabled = i === 0;

  document.getElementById('overlayCtStep2').classList.remove('hidden');
}

function ctSavePlayerAndNext() {
  const name = document.getElementById('ctPlayerName').value.trim();
  ctSetup.players[ctSetup.currentSetup].name =
    name || `Joueur ${ctSetup.currentSetup + 1}`;

  if (ctSetup.currentSetup < ctSetup.count - 1) {
    ctSetup.currentSetup++;
    ctShowPlayerSetup();
  } else {
    closeOverlay('overlayCtStep2');
    ctShowTriangle();
  }
}

function ctPrevPlayer() {
  const name = document.getElementById('ctPlayerName').value.trim();
  ctSetup.players[ctSetup.currentSetup].name = name;
  if (ctSetup.currentSetup > 0) {
    ctSetup.currentSetup--;
    ctShowPlayerSetup();
  }
}

// ── Step 3 : triangle ────────────────────────────────
function ctShowTriangle() {
  const dist    = ctComputeDistribution(ctSetup.count);
  const corners = ctCornerBalls(dist.removed, dist.groups);

  // Récap billes par joueur
  document.getElementById('ctTriangleRecap').innerHTML =
    dist.groups.map((g, i) => {
      const p = ctSetup.players[i];
      return `
        <div class="recap-row">
          <span>${EMOJIS[i % EMOJIS.length]}</span>
          <span>${p.name}</span>
          <span class="ct-balls-mini">
            ${g.map(b => `<img src="assets/bille_${b}.png" class="ball-mini" alt="${b}">`).join('')}
          </span>
        </div>`;
    }).join('');

  // Coins
  document.getElementById('ctCorners').innerHTML =
    corners.map(b =>
      `<img src="assets/bille_${b}.png" class="ball-corner" alt="${b}">`
    ).join('');

  document.getElementById('overlayCtTriangle').classList.remove('hidden');
}

function ctStartGame() {
  closeOverlay('overlayCtTriangle');

  const dist = ctComputeDistribution(ctSetup.count);

  // Initialisation de l'état
  ctState.distribution = dist;
  ctState.players = ctSetup.players.map((p, i) => ({
    name: p.name,
    balls: new Set(dist.groups[i]),
    eliminated: false,
  }));

  // Table des billes actives
  ctState.balls = {};
  dist.groups.flat().forEach(b => { ctState.balls[b] = 'in'; });

  ctState.currentIndex = 0;
  ctState.history = [];

  document.getElementById('game').classList.remove('hidden');
  ctRenderGame();
}
