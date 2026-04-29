// ── Lancement ────────────────────────────────────────
function fiveBallLaunch() {
  document.getElementById('launcher').classList.add('hidden');
  fiveBallSetup.count         = FIVE_BALL_DEFAULT_PLAYERS;
  fiveBallSetup.defaultTarget = FIVE_BALL_DEFAULT_TARGET;
  fiveBallSetup.players       = [];
  fiveBallRenderStep1();
  document.getElementById('fiveBallOverlayStep1').classList.remove('hidden');
}

// ── Step 1 : nb joueurs + score cible ────────────────
function fiveBallRenderStep1() {
  document.getElementById('fiveBallCountDisplay').textContent  = fiveBallSetup.count;
  document.getElementById('fiveBallTargetDisplay').textContent = fiveBallSetup.defaultTarget;
}

function fiveBallChangeCount(delta) {
  fiveBallSetup.count = Math.min(FIVE_BALL_MAX_PLAYERS,
                          Math.max(FIVE_BALL_MIN_PLAYERS, fiveBallSetup.count + delta));
  fiveBallRenderStep1();
}

function fiveBallChangeTarget(delta) {
  const next = fiveBallSetup.defaultTarget + delta * FIVE_BALL_TARGET_STEP;
  fiveBallSetup.defaultTarget = Math.max(FIVE_BALL_MIN_TARGET, next);
  fiveBallRenderStep1();
}

function fiveBallGoToStep2() {
  closeOverlay('fiveBallOverlayStep1');
  fiveBallSetup.players = Array.from(
    { length: fiveBallSetup.count },
    () => ({ name: '', target: fiveBallSetup.defaultTarget })
  );
  renderPlayerNameInputs('fiveBallNameInputs', fiveBallSetup.players);
  document.getElementById('fiveBallOverlayStep2').classList.remove('hidden');
}

function fiveBallStep2Back() {
  closeOverlay('fiveBallOverlayStep2');
  document.getElementById('fiveBallOverlayStep1').classList.remove('hidden');
}

// ── Step 2 -> Step 3 ─────────────────────────────────
function fiveBallGoToStep3() {
  collectPlayerNames('fiveBallNameInputs', fiveBallSetup.players);
  closeOverlay('fiveBallOverlayStep2');
  fiveBallRenderStep3();
  document.getElementById('fiveBallOverlayStep3').classList.remove('hidden');
}

function fiveBallStep3Back() {
  closeOverlay('fiveBallOverlayStep3');
  renderPlayerNameInputs('fiveBallNameInputs', fiveBallSetup.players);
  document.getElementById('fiveBallOverlayStep2').classList.remove('hidden');
}

// ── Step 3 : recap + score modifiable par joueur ─────
function fiveBallRenderStep3() {
  const list = fiveBallSetup.players.map((p, i) => `
    <div class="recap-row">
      <span class="recap-emoji">${EMOJIS[i % EMOJIS.length]}</span>
      <span class="recap-name">${escapeHtml(p.name) || `Joueur ${i + 1}`}</span>
      <div class="recap-x-selector">
        <button class="btn-round-sm" onclick="fiveBallChangePlayerTarget(${i}, -1)">−</button>
        <span class="recap-x-value" id="fiveBallTarget${i}">${p.target}</span>
        <button class="btn-round-sm" onclick="fiveBallChangePlayerTarget(${i}, +1)">+</button>
      </div>
    </div>
  `).join('');
  document.getElementById('fiveBallRecapList').innerHTML = list;
}

function fiveBallChangePlayerTarget(playerIdx, delta) {
  const p = fiveBallSetup.players[playerIdx];
  p.target = Math.max(FIVE_BALL_MIN_TARGET, p.target + delta * FIVE_BALL_TARGET_STEP);
  document.getElementById(`fiveBallTarget${playerIdx}`).textContent = p.target;
}
