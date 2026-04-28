// ── Lancement ────────────────────────────────────────
function straightpoolLaunch() {
  document.getElementById('launcher').classList.add('hidden');
  document.getElementById('spOverlayStep1').classList.remove('hidden');
  spRenderStep1();
}

// ── Step 1 : nb joueurs + cible globale ─────────────
function spRenderStep1() {
  document.getElementById('spCountDisplay').textContent  = spSetup.count;
  document.getElementById('spTargetDisplay').textContent = spSetup.target;
}

function spChangeCount(delta) {
  spSetup.count = Math.min(STRAIGHTPOOL_MAX_PLAYERS,
                  Math.max(STRAIGHTPOOL_MIN_PLAYERS, spSetup.count + delta));
  document.getElementById('spCountDisplay').textContent = spSetup.count;
}

function spChangeGlobalTarget(delta) {
  spSetup.target = Math.min(STRAIGHTPOOL_MAX_TARGET,
                   Math.max(STRAIGHTPOOL_MIN_TARGET, spSetup.target + delta));
  document.getElementById('spTargetDisplay').textContent = spSetup.target;
}

function spGoToStep2() {
  spSetup.players = Array.from({ length: spSetup.count }, () => ({
    name:   '',
    target: spSetup.target,
  }));
  closeOverlay('spOverlayStep1');
  renderPlayerNameInputs('spNamesList', spSetup.players);
  document.getElementById('spOverlayStep2').classList.remove('hidden');
}

function spStep2GoPrev() {
  closeOverlay('spOverlayStep2');
  document.getElementById('spOverlayStep1').classList.remove('hidden');
}

function spGoToStep3() {
  collectPlayerNames('spNamesList', spSetup.players);
  closeOverlay('spOverlayStep2');
  renderRecap('spTargetsList', spSetup.players, (p, i) => `
    <div class="recap-x-selector">
      <button class="btn-round-sm" onclick="spChangePlayerTarget(${i}, -5)">−</button>
      <span class="recap-x-value" id="spTarget_${i}">${p.target}</span>
      <button class="btn-round-sm" onclick="spChangePlayerTarget(${i}, +5)">+</button>
    </div>
  `);
  document.getElementById('spOverlayStep3').classList.remove('hidden');
}

function spStep3GoPrev() {
  closeOverlay('spOverlayStep3');
  renderPlayerNameInputs('spNamesList', spSetup.players);
  document.getElementById('spOverlayStep2').classList.remove('hidden');
}

function spChangePlayerTarget(i, delta) {
  spSetup.players[i].target = Math.min(200, Math.max(10, spSetup.players[i].target + delta));
  document.getElementById(`spTarget_${i}`).textContent = spSetup.players[i].target;
}

// ── Démarrage ────────────────────────────────────────
function spStartGame() {
  closeOverlay('spOverlayStep3');

  spState.players = spSetup.players.map(p => ({
    name:       p.name,
    target:     p.target,
    score:      0,
    bestBreak:  0,
  }));
  spState.currentIndex = 0;
  spState.currentBreak = 0;
  spState.history      = [];
  spState.winner       = null;

  document.getElementById('spGame').classList.remove('hidden');
  spRender();
}
