// ── Start ────────────────────────────────────────────
function startGame() {
  closeOverlay('overlayStep3');

  let pool = [];
  if (killerSetup.jokerMode === 'random') {
    JOKER_TYPES.forEach(j => {
      for (let i = 0; i < killerSetup.count; i++) pool.push(j.id);
    });
    shuffleArray(pool);
  }

  let players = killerSetup.players.map(p => ({
    name: p.name,
    lives: p.lives,
    jokers: killerSetup.jokerMode === 'choice'
      ? { pass: 1, hand: 1, target: 1 }
      : { pass: 0, hand: 0, target: 0 },
    jokersUsed: 0,
    eliminated: false,
  }));
  shuffleArray(players);

  killerState.players      = players;
  killerState.currentIndex = 0;
  killerState.jokerMode    = killerSetup.jokerMode;
  killerState.pool         = pool;
  killerState.forcedTurnFor  = null;
  killerState.forcedTurnBack = null;
  killerState.history      = [];
  killerState.savedConfig  = players.map(p => ({ name: p.name, lives: p.lives }));

  document.getElementById('game').classList.remove('hidden');
  renderGame();
}

// ── Render ───────────────────────────────────────────
function renderGame() {
  renderPool();
  renderPlayers();
  renderActions();
  document.getElementById('btnUndo').disabled = killerState.history.length === 0;
}

function renderPool() {
  // à compléter selon ton HTML poolZone
}

function renderPlayers() {
  const activeIdx = killerState.forcedTurnFor !== null ? killerState.forcedTurnFor : killerState.currentIndex;

  document.getElementById('playersList').innerHTML = killerState.players.map((p, i) => {
    const isActive = i === activeIdx;
    const isForced = killerState.forcedTurnFor !== null && i === killerState.forcedTurnFor;
    const hearts   = Array.from({ length: MAX_LIVES }, (_, h) =>
      h < p.lives ? '❤️' : '🖤').join('');

    const jokerBadges = killerState.jokerMode === 'choice' && !p.eliminated
      ? `<div class="joker-badges">
           ${JOKER_TYPES.map(j =>
             `<span class="joker-badge ${p.jokers[j.id] === 0 ? 'used' : ''}">
               ${j.icon}
             </span>`).join('')}
         </div>`
      : '';

    const maxed = p.jokersUsed >= MAX_JOKERS;
    const jokerCounter = !p.eliminated
      ? `<div class="joker-counter ${maxed ? 'maxed' : ''}">
           🃏 Jokers : ${p.jokersUsed} / ${MAX_JOKERS}
           ${maxed ? ' — Plus de joker disponible' : ''}
         </div>`
      : '';

    return `
      <div class="player-card ${isActive ? 'active' : ''} ${p.eliminated ? 'eliminated' : ''}">
        <div class="card-top">
          <div class="player-name">
            ${p.name}
            ${isForced  ? '<span class="badge-forced">TOUR FORCÉ</span>'
            : isActive  ? '<span class="badge-active">EN JEU</span>' : ''}
          </div>
          <div class="hearts">${p.eliminated ? '💀' : hearts}</div>
        </div>
        ${jokerBadges}
        ${jokerCounter}
      </div>`;
  }).join('');
}

function renderActions() {
  const activeIdx = killerState.forcedTurnFor !== null ? killerState.forcedTurnFor : killerState.currentIndex;
  const player    = killerState.players[activeIdx];
  const isForced  = killerState.forcedTurnFor !== null;

  document.getElementById('actionTitle').textContent =
    `Tour de ${player.name}${isForced ? ' (forcé)' : ''}`;

  const hasJoker = !isForced && player.jokersUsed < MAX_JOKERS && (
    killerState.jokerMode === 'random'
      ? killerState.pool.length > 0
      : Object.values(player.jokers).some(v => v > 0)
  );

  document.getElementById('actionButtons').innerHTML = `
    <button class="btn-action btn-hit"   onclick="doAction('hit')">✅ Tir réussi</button>
    <button class="btn-action btn-miss"  onclick="doAction('miss')">⚪❌ Tir raté</button>
    <button class="btn-action btn-black" onclick="doAction('black')"><img src="assets/bille_8_killer.png" alt="Killer" class="icon-img"> Bille noire</button>
    <button class="btn-action btn-joker" onclick="openJokerMenu()"
      ${!hasJoker ? 'disabled' : ''}>
      🃏 Joker${isForced ? ' (bloqué)' : player.jokersUsed >= MAX_JOKERS ? ' (épuisé)' : ''}
    </button>`;
}

// ── Actions ──────────────────────────────────────────
function saveHistory() {
  if (killerState.history.length >= 5) killerState.history.shift();
  killerState.history.push(JSON.stringify({
    players:       killerState.players,
    currentIndex:  killerState.currentIndex,
    pool:          killerState.pool,
    forcedTurnFor: killerState.forcedTurnFor,
    forcedTurnBack: killerState.forcedTurnBack,
  }));
}

function undoAction() {
  if (killerState.history.length === 0) return;
  const prev = JSON.parse(killerState.history.pop());
  killerState.players       = prev.players;
  killerState.currentIndex  = prev.currentIndex;
  killerState.pool          = prev.pool;
  killerState.forcedTurnFor  = prev.forcedTurnFor;
  killerState.forcedTurnBack = prev.forcedTurnBack;
  renderGame();
  showToast('↩ Action annulée');
}

function nextTurn() {
  const total = killerState.players.length;
  let next = (killerState.currentIndex + 1) % total;
  while (killerState.players[next].eliminated) {
    next = (next + 1) % total;
  }
  killerState.currentIndex = next;
}

function doAction(type) {
  saveHistory();
  const activeIdx = killerState.forcedTurnFor !== null ? killerState.forcedTurnFor : killerState.currentIndex;
  const player    = killerState.players[activeIdx];
  const isForced  = killerState.forcedTurnFor !== null;

  function endForcedOrNext() {
    if (isForced) {
      killerState.currentIndex   = killerState.forcedTurnBack;
      killerState.forcedTurnFor  = null;
      killerState.forcedTurnBack = null;
    } else {
      nextTurn();
    }
  }

  if (type === 'hit') {
    endForcedOrNext();
    showToast(`✅ ${player.name} a réussi son tir !`);

  } else if (type === 'miss') {
    player.lives--;
    if (player.lives <= 0) {
      player.lives    = 0;
      player.eliminated = true;
      showToast(`💀 ${player.name} est éliminé !`);
      const alive = killerState.players.filter(p => !p.eliminated);
      if (alive.length === 1) { endGame(alive[0]); return; }
    } else {
      showToast(`⚪ ${player.name} a raté ! −1 vie`);
    }
    endForcedOrNext();

  } else if (type === 'black') {
    if (player.lives < MAX_LIVES) {
      player.lives++;
      showToast(`🎱 ${player.name} a rentré la noire ! +1 vie`);
    } else {
      showToast(`🎱 ${player.name} a rentré la noire ! (vies max)`);
    }
    endForcedOrNext();
  }

  renderGame();
}

// ── Jokers ───────────────────────────────────────────
function openJokerMenu() {
  const player = killerState.players[killerState.currentIndex];
  document.getElementById('jokerPlayerName').textContent = `${player.name} utilise un joker`;
  const list = document.getElementById('jokerChoiceList');

  if (killerState.jokerMode === 'random') {
    list.innerHTML = `
      <button class="joker-choice-btn" onclick="drawRandomJoker()">
        <span class="jc-icon">🎲</span>
        <div>
          <div>Tirer un joker aléatoire</div>
          <div class="jc-desc">${killerState.pool.length} joker${killerState.pool.length > 1 ? 's' : ''} restant${killerState.pool.length > 1 ? 's' : ''} dans le pool</div>
        </div>
      </button>`;
  } else {
    list.innerHTML = JOKER_TYPES.map(j => `
      <button class="joker-choice-btn"
        onclick="useJoker('${j.id}')"
        ${player.jokers[j.id] === 0 ? 'disabled' : ''}>
        <span class="jc-icon">${j.icon}</span>
        <div>
          <div>${j.label}</div>
          <div class="jc-desc">${j.desc}</div>
        </div>
      </button>`).join('');
  }

  document.getElementById('overlayJoker').classList.remove('hidden');
}

function drawRandomJoker() {
  if (killerState.pool.length === 0) { closeOverlay('overlayJoker'); return; }
  const idx   = Math.floor(Math.random() * killerState.pool.length);
  const drawn = killerState.pool.splice(idx, 1)[0];
  closeOverlay('overlayJoker');
  useJoker(drawn);
}

function useJoker(jokerId) {
  // saveHistory();
  const player = killerState.players[killerState.currentIndex];
  player.jokersUsed++;
  if (killerState.jokerMode === 'choice') player.jokers[jokerId]--;

  const joker = JOKER_TYPES.find(j => j.id === jokerId);
  showToast(`${joker.icon} ${player.name} utilise : ${joker.label}`);

  closeOverlay('overlayJoker');

  if (jokerId === 'pass') {
    saveHistory();
    nextTurn();
    renderGame();
  } else if (jokerId === 'hand') {
    saveHistory();
    renderGame();
  } else if (jokerId === 'target') {
    saveHistory();
    openTargetOverlay();
    // return; // on ne ferme pas overlayJoker ici, openTargetOverlay le remplace
  }

  
}

function openTargetOverlay() {
  const targets = killerState.players.filter((p, i) =>
    !p.eliminated && i !== killerState.currentIndex
  );

  document.getElementById('targetList').innerHTML = targets.map(p => {
    const i = killerState.players.indexOf(p);
    return `
      <button class="target-btn" onclick="applyTarget(${i})">
        <span>${EMOJIS[i % EMOJIS.length]}</span>
        <span>${p.name}</span>
        <span style="margin-left:auto;">
          ${Array.from({ length: MAX_LIVES }, (_, h) => h < p.lives ? '❤️' : '🖤').join('')}
        </span>
      </button>`;
  }).join('');

  document.getElementById('overlayTarget').classList.remove('hidden');
}

function applyTarget(targetIdx) {
  closeOverlay('overlayTarget');
  const backIdx = killerState.currentIndex;
  // nextTurn();
  killerState.forcedTurnFor  = targetIdx;
  killerState.forcedTurnBack = backIdx;
  renderGame();
}

// ── End / Replay ─────────────────────────────────────
function endGame(winner) {
  document.getElementById('winName').textContent = `🏆 ${winner.name}`;
  document.getElementById('overlayWin').classList.remove('hidden');
}

function openReplay() {
  closeOverlay('overlayWin');
  const replayData = killerState.savedConfig;

  window._replayData = replayData;

  document.getElementById('replayList').innerHTML = replayData.map((p, i) => `
    <div class="replay-row">
      <div class="replay-name">${p.name}</div>
      <div style="font-size:12px;color:rgba(255,255,255,0.45);">Vies de départ</div>
      <div class="hearts-picker" id="replayHearts_${i}"></div>
    </div>`).join('');

  window._replayData.forEach((p, i) => renderReplayHearts(i, p.lives));
  document.getElementById('overlayReplay').classList.remove('hidden');
  
}

function renderReplayHearts(idx, currentLives) {
  window._replayData[idx].lives = currentLives;
  const picker = document.getElementById(`replayHearts_${idx}`);
  if (!picker) return;
  picker.innerHTML = '';
  for (let h = 1; h <= MAX_LIVES; h++) {
    const btn = document.createElement('button');
    btn.className   = 'heart-btn';
    btn.textContent = h <= currentLives ? '❤️' : '🖤';
    btn.onclick     = () => renderReplayHearts(idx, h);
    picker.appendChild(btn);
  }
}

function confirmReplay() {
  closeOverlay('overlayReplay');
  const replayData = window._replayData;

  let pool = [];
  if (killerState.jokerMode === 'random') {
    const n = replayData.length;
    JOKER_TYPES.forEach(j => { for (let i = 0; i < n; i++) pool.push(j.id); });
    shuffleArray(pool);
  }

  let players = replayData.map(p => ({
    name: p.name,
    lives: p.lives,
    jokers: killerState.jokerMode === 'choice'
      ? { pass: 1, hand: 1, target: 1 }
      : { pass: 0, hand: 0, target: 0 },
    jokersUsed: 0,
    eliminated: false,
  }));
  shuffleArray(players);

  killerState.players       = players;
  killerState.currentIndex  = 0;
  killerState.pool          = pool;
  killerState.forcedTurnFor  = null;
  killerState.forcedTurnBack = null;
  killerState.history       = [];
  killerState.savedConfig   = players.map(p => ({ name: p.name, lives: p.lives }));

  document.getElementById('game').classList.remove('hidden');
  renderGame();
}

function openNewGame() {
  closeOverlay('overlayWin');
  showLauncher();
}
