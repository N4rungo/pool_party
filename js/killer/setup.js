// ── Launch ──────────────────────────────────────────
function killerLaunch() {
  document.getElementById('launcher').classList.add('hidden');
  document.getElementById('overlayStep1').classList.remove('hidden');
}

// ── Step 1 ──────────────────────────────────────────
function changeCount(delta) {
  killerSetup.count = Math.min(16, Math.max(2, killerSetup.count + delta));
  document.getElementById('countDisplay').textContent = killerSetup.count;
}

function setJokerMode(mode) {
  killerSetup.jokerMode = mode;
  document.getElementById('toggleRandom').classList.toggle('active', mode === 'random');
  document.getElementById('toggleChoice').classList.toggle('active', mode === 'choice');
  document.getElementById('modeDesc').textContent = mode === 'random'
    ? 'Un joker aléatoire est tiré depuis le pool commun.'
    : 'Chaque joueur choisit son joker parmi les 3 types (1 de chaque).';
}

function goToStep2() {
  closeOverlay('overlayStep1');
  killerSetup.players = Array.from({ length: killerSetup.count }, () => ({
    name: '',
    lives: DEFAULT_LIVES,
  }));
  killerSetup.currentPlayerSetup = 0;
  showStep2();
}

// ── Step 2 ──────────────────────────────────────────
function showStep2() {
  const i = killerSetup.currentPlayerSetup;
  const p = killerSetup.players[i];
  document.getElementById('step2Progress').textContent =
    `Étape 2 / 3 — Joueur ${i + 1} sur ${killerSetup.count}`;
  document.getElementById('step2Title').textContent = `Joueur ${i + 1}`;
  document.getElementById('step2Emoji').textContent  = EMOJIS[i % EMOJIS.length];
  document.getElementById('step2Name').value         = p.name;
  document.getElementById('btnPrevPlayer').style.display = i === 0 ? 'none' : 'flex';
  renderHeartsPicker(p.lives);
  document.getElementById('overlayStep2').classList.remove('hidden');
  bindEnterKey('step2Name', savePlayerAndNext);
}

function renderHeartsPicker(currentLives) {
  const picker = document.getElementById('heartsPicker');
  picker.innerHTML = '';
  for (let h = 1; h <= MAX_LIVES; h++) {
    const btn = document.createElement('button');
    btn.className   = 'heart-btn';
    btn.textContent = h <= currentLives ? '❤️' : '🖤';
    btn.onclick     = () => setLivesForCurrentPlayer(h);
    picker.appendChild(btn);
  }
  document.getElementById('livesLabel').textContent =
    `${currentLives} vie${currentLives > 1 ? 's' : ''} de départ`;
}

function setLivesForCurrentPlayer(lives) {
  killerSetup.players[killerSetup.currentPlayerSetup].lives = lives;
  renderHeartsPicker(lives);
}

function savePlayerAndNext() {
  const name = document.getElementById('step2Name').value.trim();
  killerSetup.players[killerSetup.currentPlayerSetup].name =
    name || `Joueur ${killerSetup.currentPlayerSetup + 1}`;

  if (killerSetup.currentPlayerSetup < killerSetup.count - 1) {
    killerSetup.currentPlayerSetup++;
    showStep2();
  } else {
    closeOverlay('overlayStep2');
    showStep3();
  }
}

function goToPrevPlayer() {
  const name = document.getElementById('step2Name').value.trim();
  killerSetup.players[killerSetup.currentPlayerSetup].name = name;
  if (killerSetup.currentPlayerSetup > 0) {
    killerSetup.currentPlayerSetup--;
    showStep2();
  }
}

// ── Step 3 ──────────────────────────────────────────
function showStep3() {
  document.getElementById('recapMode').textContent = killerSetup.jokerMode === 'random'
    ? '🎲 Mode jokers : Aléatoire'
    : '🃏 Mode jokers : Choix libre';

  document.getElementById('recapList').innerHTML = killerSetup.players.map((p, i) => `
    <div class="recap-row">
      <span>${EMOJIS[i % EMOJIS.length]}</span>
      <span>${p.name || `Joueur ${i + 1}`}</span>
      <span class="recap-hearts">
        ${Array.from({ length: MAX_LIVES }, (_, h) => h < p.lives ? '❤️' : '🖤').join('')}
      </span>
    </div>
  `).join('');

  document.getElementById('overlayStep3').classList.remove('hidden');
}

function goToStep2FromRecap() {
  closeOverlay('overlayStep3');
  killerSetup.currentPlayerSetup = killerSetup.count - 1;
  showStep2();
}