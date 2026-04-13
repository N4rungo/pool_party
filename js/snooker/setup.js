// ── Step 1 : nb joueurs + mode ───────────────────────────────
function snookerChangeCount(delta) {
  snookerSetup.count = Math.min(SNOOKER_MAX_PLAYERS,
                        Math.max(SNOOKER_MIN_PLAYERS, snookerSetup.count + delta));
  document.getElementById('snookerCountDisplay').textContent = snookerSetup.count;
}

function snookerSetMode(mode) {
  snookerSetup.mode = mode;
  document.getElementById('snookerModeSimple').classList.toggle('active', mode === 'simple');
  document.getElementById('snookerModeExpert').classList.toggle('active', mode === 'expert');
  document.getElementById('snookerModeDesc').textContent = mode === 'simple'
    ? 'Faute : les autres joueurs reçoivent les points automatiquement.'
    : 'Faute : le joueur lésé choisit de prendre les points, faire rejouer, ou les deux. Free ball disponible.';
}

function snookerGoToStep2() {
  closeOverlay('snookerOverlayStep1');
  snookerSetup.players = Array.from({ length: snookerSetup.count }, () => ({ name: '' }));
  snookerSetup.currentSetup = 0;
  snookerShowStep2();
}

// ── Step 2 : noms ────────────────────────────────────────────
function snookerShowStep2() {
  const i   = snookerSetup.currentSetup;
  const n   = snookerSetup.count;
  document.getElementById('snookerStep2Progress').textContent = `Joueur ${i + 1} / ${n}`;
  document.getElementById('snookerStep2Emoji').textContent    = EMOJIS[i % EMOJIS.length];
  document.getElementById('snookerStep2Name').value           = snookerSetup.players[i].name || '';
  document.getElementById('snookerBtnPrev').classList.toggle('hidden', i === 0);
  document.getElementById('snookerOverlayStep2').classList.remove('hidden');
  setTimeout(() => document.getElementById('snookerStep2Name').focus(), 100);
}

function snookerSaveAndNext() {
  const name = document.getElementById('snookerStep2Name').value.trim();
  snookerSetup.players[snookerSetup.currentSetup].name =
    name || `Joueur ${snookerSetup.currentSetup + 1}`;

  if (snookerSetup.currentSetup < snookerSetup.count - 1) {
    snookerSetup.currentSetup++;
    snookerShowStep2();
  } else {
    closeOverlay('snookerOverlayStep2');
    snookerShowStep3();
  }
}

function snookerGoPrev() {
  const name = document.getElementById('snookerStep2Name').value.trim();
  snookerSetup.players[snookerSetup.currentSetup].name = name;
  if (snookerSetup.currentSetup > 0) {
    snookerSetup.currentSetup--;
    snookerShowStep2();
  }
}

// ── Step 3 : récap ───────────────────────────────────────────
function snookerShowStep3() {
  document.getElementById('snookerRecapMode').textContent = snookerSetup.mode === 'simple'
    ? '🟢 Mode Simple'
    : '🔴 Mode Expert';

  document.getElementById('snookerRecapList').innerHTML =
    snookerSetup.players.map((p, i) => `
      <div class="recap-row">
        <span>${EMOJIS[i % EMOJIS.length]}</span>
        <span>${p.name}</span>
      </div>
    `).join('');

  document.getElementById('snookerOverlayStep3').classList.remove('hidden');
}

function snookerGoToStep2FromRecap() {
  closeOverlay('snookerOverlayStep3');
  snookerSetup.currentSetup = snookerSetup.count - 1;
  snookerShowStep2();
}

function snookerBackToLauncher() {
  closeOverlay('snookerOverlayStep1');
  showLauncher();
}

function snookerLaunchGame() {
  document.getElementById('launcher').classList.add('hidden');
  snookerSetup.count   = SNOOKER_DEFAULT_PLAYERS;
  snookerSetup.mode    = 'simple';
  snookerSetup.players = [];
  snookerSetup.currentSetup = 0;
  document.getElementById('snookerCountDisplay').textContent = SNOOKER_DEFAULT_PLAYERS;
  snookerSetMode('simple');
  document.getElementById('snookerOverlayStep1').classList.remove('hidden');
}
