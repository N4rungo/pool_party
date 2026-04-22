function showCasinSetup() {
    document.getElementById('launcher').classList.add('hidden');
    document.getElementById('casinOverlayStep1').classList.remove('hidden');
    // Reset affichage step1
    document.getElementById('casinCountDisplay').textContent = casinSetup.count;
    document.getElementById('casinGlobalXDisplay').textContent = casinSetup.globalX;
}


// ── Step 1 : nb joueurs + X global ──────────────────

function casinChangeCount(delta) {
    casinSetup.count = Math.min(CASIN_MAX_PLAYERS, Math.max(CASIN_MIN_PLAYERS, casinSetup.count + delta));
    document.getElementById('casinCountDisplay').textContent = casinSetup.count;
}

function casinChangeGlobalX(delta) {
    casinSetup.globalX = Math.min(CASIN_MAX_X, Math.max(CASIN_MIN_X, casinSetup.globalX + delta));
    document.getElementById('casinGlobalXDisplay').textContent = casinSetup.globalX;
}

function casinGoToStep2() {
  casinSetup.players = Array.from({ length: casinSetup.count }, (_, i) => ({
    name: '',
    x: casinSetup.globalX,
  }));
  closeOverlay('casinOverlayStep1');
  renderPlayerNameInputs('casinNameInputs', casinSetup.players);
  document.getElementById('casinOverlayStep2').classList.remove('hidden');
}

// ── Step 2 : noms ────────────────────────────────────────
function casinGoToStep3() {
  collectPlayerNames('casinNameInputs', casinSetup.players);
  closeOverlay('casinOverlayStep2');
  casinRenderRecap();
  document.getElementById('casinOverlayStep3').classList.remove('hidden');
}

function casinRenderRecap() {
  renderRecap('casinRecapList', casinSetup.players, (p, i) => `
    <div class="recap-x-selector">
      <button class="btn-round-sm" onclick="casinChangePlayerX(${i}, -1)">−</button>
      <span class="recap-x-value" id="casinPlayerX_${i}">${p.x}</span>
      <button class="btn-round-sm" onclick="casinChangePlayerX(${i}, +1)">+</button>
    </div>
  `);
}

function casinChangePlayerX(i, delta) {
  casinSetup.players[i].x = Math.min(CASIN_MAX_X, Math.max(CASIN_MIN_X, casinSetup.players[i].x + delta));
  document.getElementById(`casinPlayerX_${i}`).textContent = casinSetup.players[i].x;
}

// ── Start ────────────────────────────────────────────

function casinStartGame() {
    closeOverlay('casinOverlayStep3');

    casinState.players = casinSetup.players.map(p => ({
        name: p.name,
        x: p.x,
        scores: Object.fromEntries(CASIN_ACTIONS.map(a => [a.id, 0])),
        lastAction: null,
    }));

    casinState.currentIndex = 0;
    casinState.history = [];
    casinState.winner = null;

    document.getElementById('launcher').classList.add('hidden');
    document.getElementById('casinGame').classList.remove('hidden');
    casinRender();
}

function casinBackToStep1() {
  collectPlayerNames('casinNameInputs', casinSetup.players);
  closeOverlay('casinOverlayStep2');
  document.getElementById('casinOverlayStep1').classList.remove('hidden');
}

function casinBackToStep2() {
  closeOverlay('casinOverlayStep3');
  renderPlayerNameInputs('casinNameInputs', casinSetup.players);
  document.getElementById('casinOverlayStep2').classList.remove('hidden');
}

function casinSaveAndNext() {
    const i = casinSetup.currentPlayerSetup;
    const name = document.getElementById('casinStep2Name').value.trim();
    casinSetup.players[i].name = name || `Joueur ${i + 1}`;

    if (i < casinSetup.count - 1) {
        casinSetup.currentPlayerSetup++;
        casinShowStep2();
    } else {
        closeOverlay('casinOverlayStep2');
        casinShowStep3();
    }
}

function casinGoPrev() {
    const i = casinSetup.currentPlayerSetup;
    const name = document.getElementById('casinStep2Name').value.trim();
    casinSetup.players[i].name = name;

    if (i === 0) {                              // ← nouveau cas
        closeOverlay('casinOverlayStep2');
        document.getElementById('casinOverlayStep1').classList.remove('hidden');
    } else {
        casinSetup.currentPlayerSetup--;
        casinShowStep2();
    }
}

// ── Step 3 : récap ───────────────────────────────────

function casinShowStep3() {
    document.getElementById('casinRecapList').innerHTML = casinSetup.players.map((p, i) => `
    <div class="recap-row">
      <span>${EMOJIS[i % EMOJIS.length]}</span>
      <span>${p.name}</span>
      <span class="casin-recap-x">× ${p.x}</span>
    </div>
  `).join('');
    document.getElementById('casinOverlayStep3').classList.remove('hidden');
}

function casinGoToStep2FromRecap() {
    closeOverlay('casinOverlayStep3');
    casinSetup.currentPlayerSetup = casinSetup.count - 1;
    casinShowStep2();
}
