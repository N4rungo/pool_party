// ── Start ────────────────────────────────────────────

function casinStartGame() {
    closeOverlay('casinOverlayStep3');

    casinState.players = casinSetup.players.map(p => ({
        name: p.name,
        x: p.x,
        scores: Object.fromEntries(CASIN_ACTIONS.map(a => [a.id, 0])),
        // doneThisturn: [],
        lastAction: null,
    }));

    casinState.currentIndex = 0;
    casinState.history = [];
    casinState.winner = null;

    document.getElementById('launcher').classList.add('hidden');
    document.getElementById('casinGame').classList.remove('hidden');
    casinRender();
}

// ── History ──────────────────────────────────────────

function casinSaveHistory() {
    if (casinState.history.length >= 5) casinState.history.shift();
    casinState.history.push(JSON.stringify({
        players: casinState.players.map(p => ({
            ...p,
            doneThisturn: [...p.doneThisturn],
        })),
        currentIndex: casinState.currentIndex,
    }));
}

function casinUndo() {
    if (casinState.history.length === 0) return;
    const snap = JSON.parse(casinState.history.pop());
    casinState.players = snap.players.map(p => ({
        ...p,
        doneThisturn: p.doneThisturn,
    }));
    casinState.currentIndex = snap.currentIndex;
    casinRender();
    showToast('↩ Action annulée');
}

// ── Action ───────────────────────────────────────────

function casinDoAction(actionId) {
    const player = casinState.players[casinState.currentIndex];

    // Déjà fait ce tour
    if (player.doneThisturn.includes(actionId)) {
        showToast('⛔ Déjà réalisée ce tour !');
        return;
    }
    // Action fermée
    if (player.scores[actionId] >= player.x) {
        showToast('✅ Action déjà complétée !');
        return;
    }

    casinSaveHistory();

    player.scores[actionId]++;
    player.lastAction = actionId;

    // Vérif victoire
    const allDone = CASIN_ACTIONS.every(a => player.scores[a.id] >= player.x);
    if (allDone) {
        casinState.winner = casinState.currentIndex;
        casinRender();
        casinShowWin(player.name);
        return;
    }

    showToast(`✅ ${CASIN_ACTIONS.find(a => a.id === actionId).label} validée !`);
    casinRender();
}

// Coup neutre : reset lastAction, reste dans le tour
function casinNeutralShot() {
    const player = casinState.players[casinState.currentIndex];
    if (player.lastAction === null) {
        showToast('ℹ️ Aucune action à réinitialiser');
        return;
    }
    casinSaveHistory();
    player.lastAction = null;
    showToast('↺ Coup libre — toutes les actions disponibles');
    casinRender();
}

// ── Next player ──────────────────────────────────────

function casinNextPlayer() {
    casinSaveHistory();

    // Reset doneThisturn du joueur courant
    casinState.players[casinState.currentIndex].lastAction = null;

    // Joueur suivant (skip si on voulait gérer des éliminations — pas le cas ici)
    casinState.currentIndex =
        (casinState.currentIndex + 1) % casinState.players.length;

    casinRender();
}

function casinRenderActions() {
    const player = casinState.players[casinState.currentIndex];

    document.getElementById('casinActionGrid').innerHTML =
        CASIN_ACTIONS.map(a => {
            const count = player.scores[a.id];
            const closed = count >= player.x;
            const isBlocked = player.lastAction === a.id;
            const disabled = closed || isBlocked;

            const pips = Array.from({ length: player.x }, (_, h) =>
                `<span class="casin-pip ${h < count ? 'filled' : ''}"></span>`
            ).join('');

            return `
        <button
          class="casin-action-btn ${closed ? 'closed' : ''} ${isBlocked ? 'blocked' : ''}"
          onclick="casinDoAction('${a.id}')"
          ${disabled ? 'disabled' : ''}
          title="${a.desc}"
        >
          <span class="casin-action-icon">${a.icon}</span>
          <span class="casin-action-label">${a.label}</span>
          <div class="casin-pips">${pips}</div>
          ${isBlocked ? '<span class="casin-blocked-label">⛔ Dernier coup</span>' : ''}
        </button>`;
        }).join('');
}

// ── Win ──────────────────────────────────────────────

function casinShowWin(name) {
    document.getElementById('casinWinName').textContent = `🏆 ${name} a gagné !`;
    document.getElementById('casinOverlayWin').classList.remove('hidden');
}

function casinRestart() {
    closeOverlay('casinOverlayWin');
    document.getElementById('casinGame').classList.add('hidden');
    // Repart au setup step1 avec les mêmes paramètres
    document.getElementById('casinOverlayStep1').classList.remove('hidden');
    document.getElementById('casinCountDisplay').textContent = casinSetup.count;
    document.getElementById('casinGlobalXDisplay').textContent = casinSetup.globalX;
}

function casinNewGame() {
    closeOverlay('casinOverlayWin');
    document.getElementById('casinGame').classList.add('hidden');
    showLauncher();
}

// ── Render ───────────────────────────────────────────

function casinRender() {
    casinRenderHeader();
    casinRenderScoreboard();
    casinRenderActions();
    document.getElementById('casinBtnUndo').disabled = casinState.history.length === 0;
}

function casinRenderHeader() {
    const player = casinState.players[casinState.currentIndex];
    document.getElementById('casinCurrentPlayer').textContent =
        `${EMOJIS[casinState.currentIndex % EMOJIS.length]} ${player.name}`;
}

function casinRenderScoreboard() {
    document.getElementById('casinScoreboard').innerHTML =
        casinState.players.map((p, i) => {
            const done = CASIN_ACTIONS.filter(a => p.scores[a.id] >= p.x).length;
            const isActive = i === casinState.currentIndex;
            return `
        <div class="casin-score-card ${isActive ? 'active' : ''}">
          <span class="casin-score-emoji">${EMOJIS[i % EMOJIS.length]}</span>
          <span class="casin-score-name">${p.name}</span>
          <span class="casin-score-progress">${done} / ${CASIN_ACTIONS.length}</span>
          <span class="casin-score-x">×${p.x}</span>
        </div>`;
        }).join('');
}

function casinRenderActions() {
    const player = casinState.players[casinState.currentIndex];

    document.getElementById('casinActionGrid').innerHTML =
        CASIN_ACTIONS.map(a => {
            const count = player.scores[a.id];
            const closed = count >= player.x;
            const doneThisTurn = player.doneThisturn.includes(a.id);
            const disabled = closed || doneThisTurn;

            const pips = Array.from({ length: player.x }, (_, h) =>
                `<span class="casin-pip ${h < count ? 'filled' : ''}"></span>`
            ).join('');

            return `
        <button
          class="casin-action-btn ${closed ? 'closed' : ''} ${doneThisTurn ? 'done-turn' : ''}"
          onclick="casinDoAction('${a.id}')"
          ${disabled ? 'disabled' : ''}
          title="${a.desc}"
        >
          <span class="casin-action-icon">${a.icon}</span>
          <span class="casin-action-label">${a.label}</span>
          <div class="casin-pips">${pips}</div>
        </button>`;
        }).join('');
}
