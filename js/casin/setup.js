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
    // Initialise les joueurs avec le X global
    casinSetup.players = Array.from({ length: casinSetup.count }, (_, i) => ({
        name: '',
        x: casinSetup.globalX,
    }));
    casinSetup.currentPlayerSetup = 0;
    closeOverlay('casinOverlayStep1');
    casinShowStep2();
}

// ── Step 2 : nom + x individuel ─────────────────────

function casinShowStep2() {
    const i = casinSetup.currentPlayerSetup;
    const player = casinSetup.players[i];

    document.getElementById('casinStep2Progress').textContent =
        `Joueur ${i + 1} / ${casinSetup.count}`;
    document.getElementById('casinStep2Emoji').textContent =
        EMOJIS[i % EMOJIS.length];
    document.getElementById('casinStep2Name').value = player.name;
    document.getElementById('casinStep2XDisplay').textContent = player.x;

    // Bouton retour désactivé pour le 1er joueur
    document.getElementById('casinBtnPrev').disabled = i === 0;

    document.getElementById('casinOverlayStep2').classList.remove('hidden');
}

function casinStep2ChangeX(delta) {
    const i = casinSetup.currentPlayerSetup;
    casinSetup.players[i].x = Math.min(CASIN_MAX_X, Math.max(CASIN_MIN_X, casinSetup.players[i].x + delta));
    document.getElementById('casinStep2XDisplay').textContent = casinSetup.players[i].x;
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
    if (i > 0) {
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
