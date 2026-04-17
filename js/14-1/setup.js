// ── Lancement ────────────────────────────────────────
function spShowSetup() {
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
  spSetup.currentPlayerSetup = 0;
  closeOverlay('spOverlayStep1');
  document.getElementById('spOverlayStep2').classList.remove('hidden');
  spRenderStep2();
}

// ── Step 2 : noms des joueurs ────────────────────────
function spRenderStep2() {
  const container = document.getElementById('spNamesList');
  container.innerHTML = spSetup.players.map((p, i) => `
    <div class="sp-name-row">
      <span class="player-emoji">${EMOJIS[i % EMOJIS.length]}</span>
      <input
        type="text"
        maxlength="16"
        placeholder="Joueur ${i + 1}"
        value="${p.name}"
        oninput="spSetup.players[${i}].name = this.value.trim()"
      >
    </div>
  `).join('');
}

function spGoToStep3() {
  // Noms vides → noms par défaut
  spSetup.players.forEach((p, i) => {
    if (!p.name) p.name = `Joueur ${i + 1}`;
  });
  closeOverlay('spOverlayStep2');
  document.getElementById('spOverlayStep3').classList.remove('hidden');
  spRenderStep3();
}

// ── Step 3 : cibles individuelles ───────────────────
function spRenderStep3() {
  const container = document.getElementById('spTargetsList');
  container.innerHTML = spSetup.players.map((p, i) => `
    <div class="sp-target-row">
      <span class="player-emoji">${EMOJIS[i % EMOJIS.length]}</span>
      <span class="sp-target-name">${p.name}</span>
      <div class="number-selector">
        <button class="btn-round" onclick="spChangePlayerTarget(${i}, -5)">−</button>
        <span id="spTarget${i}">${p.target}</span>
        <button class="btn-round" onclick="spChangePlayerTarget(${i}, +5)">+</button>
      </div>
    </div>
  `).join('');
}

function spChangePlayerTarget(i, delta) {
  spSetup.players[i].target = Math.min(STRAIGHTPOOL_MAX_TARGET,
                               Math.max(STRAIGHTPOOL_MIN_TARGET,
                               spSetup.players[i].target + delta));
  document.getElementById(`spTarget${i}`).textContent = spSetup.players[i].target;
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
