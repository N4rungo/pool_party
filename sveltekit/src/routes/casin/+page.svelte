<!--
  Page complète du Casin.

  Phases :
   - 'setup1' → nb joueurs + X global
   - 'setup2' → noms
   - 'setup3' → recap avec X individuel
   - 'game'   → scoreboard + grille des 9 actions cliquables
   - 'win'    → WinOverlay
-->
<script>
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import GameLayout from '$lib/components/GameLayout.svelte';
  import RulesViewer from '$lib/components/RulesViewer.svelte';
  import WinOverlay from '$lib/components/WinOverlay.svelte';
  import NumberSelector from '$lib/components/NumberSelector.svelte';
  import PlayerNameInputs from '$lib/components/PlayerNameInputs.svelte';
  import RecapList from '$lib/components/RecapList.svelte';
  import { showToast } from '$lib/stores/toast.js';
  import { askConfirm } from '$lib/stores/confirm.js';
  import {
    CASIN_ACTIONS,
    CASIN_MIN_PLAYERS,
    CASIN_MAX_PLAYERS,
    CASIN_DEFAULT_X,
    CASIN_MIN_X,
    CASIN_MAX_X,
    createInitialState,
    doAction,
    neutralShot,
    nextPlayer,
    undo,
    doneCount
  } from '$lib/games/casin.js';

  const EMOJIS = ['🟡', '🔵', '🔴', '⚪', '🟠', '🟣', '🟤', '🟢'];

  let phase = 'setup1';
  $: phase, typeof window !== 'undefined' && window.scrollTo({ top: 0, behavior: 'instant' });

  // Setup
  let count = CASIN_MIN_PLAYERS;
  let globalX = CASIN_DEFAULT_X;
  let setupPlayers = [];

  function gotoSetup2() {
    setupPlayers = Array.from({ length: count }, (_, i) => ({
      name: setupPlayers[i]?.name ?? '',
      x:    setupPlayers[i]?.x ?? globalX,
    }));
    phase = 'setup2';
  }

  function gotoSetup3() {
    setupPlayers = setupPlayers.map((p, i) => ({
      ...p,
      name: p.name?.trim() || `Joueur ${i + 1}`,
    }));
    phase = 'setup3';
  }

  function updatePlayerX(i, newX) {
    setupPlayers = setupPlayers.map((p, idx) =>
      idx === i ? { ...p, x: newX } : p
    );
  }

  // Game state
  let state = null;
  let winnerName = null;

  function startGame() {
    state = createInitialState(setupPlayers);
    winnerName = null;
    phase = 'game';
    showToast(`🎯 Tour de ${state.players[0].name}`);
  }

  function onDoAction(actionId) {
    const { newState, outcome } = doAction(state, actionId);
    state = newState;

    if (outcome.kind === 'closed') {
      showToast('✅ Action déjà complétée !');
    } else if (outcome.kind === 'win') {
      winnerName = outcome.winner.name;
      phase = 'win';
    } else if (outcome.kind === 'scored') {
      const a = CASIN_ACTIONS.find(a => a.id === outcome.actionId);
      showToast(`✅ ${a.label} validé !`);
    }
  }

  function onNeutralShot() {
    const { newState, outcome } = neutralShot(state);
    state = newState;
    if (outcome.kind === 'reset') {
      showToast('↺ Coup libre — toutes les actions disponibles');
    } else {
      showToast('ℹ️ Aucune action à réinitialiser');
    }
  }

  function onNextPlayer() {
    state = nextPlayer(state);
    showToast(`👤 Tour de ${state.players[state.currentIndex].name}`);
  }

  function onUndo() {
    state = undo(state);
    showToast('↩ Action annulée');
  }

  function onUndoFromWin() {
    state = undo(state);
    winnerName = null;
    phase = 'game';
    showToast('↩ Coup décisif annulé — on continue !');
  }

  function replay() {
    startGame();
  }
  function newGame() {
    goto(base || '/');
  }
  async function confirmGoHome() {
    const ok = await askConfirm("Abandonner la partie et revenir à l'accueil ?", {
      confirmLabel: 'Abandonner',
      cancelLabel:  'Continuer',
      iconImage:    `${base}/assets/home.png`
    });
    if (ok) goto(base || '/');
  }

  let rulesOpen = false;

  // Helpers réactifs
  $: activePlayer = state ? state.players[state.currentIndex] : null;
</script>

<!-- ============== SETUP 1 ============== -->
{#if phase === 'setup1'}
  <div class="setup">
    <h1>
      <img src="{base}/assets/3_billes.png" alt="" class="icon-title" />
      Casin
    </h1>
    <div class="setup-sub">Étape 1 / 3</div>

    <div class="popup-box setup-box">
      <NumberSelector
        bind:value={count}
        min={CASIN_MIN_PLAYERS}
        max={CASIN_MAX_PLAYERS}
        label="Nombre de joueurs" />

      <div class="sep"></div>

      <NumberSelector
        bind:value={globalX}
        min={CASIN_MIN_X}
        max={CASIN_MAX_X}
        label="Répétitions par action (X)" />
      <div class="setup-tip">
        Chaque joueur doit réussir chaque action X fois.
      </div>

      <button class="btn-main btn-gold" on:click={gotoSetup2}>Suivant →</button>
      <button class="btn-main btn-gray" on:click={() => goto(base || '/')}>← Retour</button>
    </div>
  </div>
{/if}

<!-- ============== SETUP 2 ============== -->
{#if phase === 'setup2'}
  <div class="setup">
    <h1>
      <img src="{base}/assets/3_billes.png" alt="" class="icon-title" />
      Casin
    </h1>
    <div class="setup-sub">Étape 2 / 3 — Noms des joueurs</div>

    <div class="popup-box setup-box">
      <PlayerNameInputs bind:players={setupPlayers} />

      <button class="btn-main btn-gold" on:click={gotoSetup3}>Suivant →</button>
      <button class="btn-main btn-gray" on:click={() => phase = 'setup1'}>← Retour</button>
    </div>
  </div>
{/if}

<!-- ============== SETUP 3 ============== -->
{#if phase === 'setup3'}
  <div class="setup">
    <h1>
      <img src="{base}/assets/3_billes.png" alt="" class="icon-title" />
      Casin
    </h1>
    <div class="setup-sub">Étape 3 / 3 — Récapitulatif</div>

    <div class="popup-box setup-box">
      <div class="casin-target-title">Score cible par joueur</div>
      <div class="casin-target-sub">Ajustez pour équilibrer les niveaux</div>

      <RecapList players={setupPlayers} let:player let:i>
        <NumberSelector
          value={player.x}
          min={CASIN_MIN_X}
          max={CASIN_MAX_X}
          on:change={(e) => updatePlayerX(i, e.detail)} />
      </RecapList>

      <button class="btn-main btn-gold" on:click={startGame}>🎱 Lancer la partie !</button>
      <button class="btn-main btn-gray" on:click={() => phase = 'setup2'}>← Retour</button>
    </div>
  </div>
{/if}

<!-- ============== GAME ============== -->
{#if phase === 'game' && state}
  <div class="game">
    <GameLayout
      title="CASIN"
      icon="{base}/assets/3_billes.png"
      gameId="casin"
      canUndo={state.history.length > 0}
      on:home={confirmGoHome}
      on:undo={onUndo}
      on:rules={() => rulesOpen = true}>

      <!-- Scoreboard compact -->
      <div class="casin-scoreboard">
      {#each state.players as player, i (i)}
        {@const isActive = i === state.currentIndex}
        {@const blockedAction = isActive && player.lastAction && player.scores[player.lastAction] < player.x
          ? CASIN_ACTIONS.find(a => a.id === player.lastAction)
          : null}
        <div class="casin-score-card" class:active={isActive}>
          <span class="casin-score-emoji">{EMOJIS[i % EMOJIS.length]}</span>
          <span class="casin-score-name">{player.name}</span>
          {#if blockedAction}
            <span class="casin-blocked-badge">Pas {blockedAction.label}</span>
          {/if}
          <span class="casin-score-progress">{doneCount(player)} / {CASIN_ACTIONS.length}</span>
          <span class="casin-score-x">×{player.x}</span>
        </div>
      {/each}
    </div>

    <!-- Grille des actions -->
    <div class="casin-grid">
      {#each CASIN_ACTIONS as action (action.id)}
        {@const count = activePlayer.scores[action.id]}
        {@const closed = count >= activePlayer.x}
        {@const blocked = activePlayer.lastAction === action.id}
        {@const disabled = closed || blocked}
        <button
          class="casin-action-btn"
          class:closed
          class:blocked
          {disabled}
          title={action.desc}
          on:click={() => onDoAction(action.id)}>
          <span class="casin-action-icon">{action.icon}</span>
          <span class="casin-action-label">{action.label}</span>
          <div class="casin-pips">
            {#each Array(activePlayer.x) as _, h}
              <span class="casin-pip" class:filled={h < count}></span>
            {/each}
          </div>
        </button>
      {/each}
    </div>

      <svelte:fragment slot="footer">
        <div class="game-bottombar">
          <button class="btn-neutral" on:click={onNeutralShot}>↺ Coup libre</button>
          <button class="btn-next" on:click={onNextPlayer}>Suivant →</button>
        </div>
      </svelte:fragment>
    </GameLayout>
  </div>
{/if}

<!-- ============== WIN ============== -->
<WinOverlay
  open={phase === 'win'}
  trophy="🏆"
  name={winnerName}
  sub="Checklist complétée !"
  canUndo={state?.history?.length > 0}
  on:undo={onUndoFromWin}
  on:replay={replay}
  on:newGame={newGame} />

<!-- ============== RULES ============== -->
<RulesViewer gameId="casin" open={rulesOpen} on:close={() => rulesOpen = false} />


<style>
  .setup,
  .game {
    width: 92%;
    max-width: 480px;
    padding-top: 10px;
  }

  .setup-sub {
    text-align: center;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.4);
    letter-spacing: 1px;
    text-transform: uppercase;
    margin-bottom: 18px;
  }

  .setup-box {
    background: linear-gradient(160deg, #1e5c34, #143d24);
    border: 2px solid var(--color-gold);
    border-radius: 20px;
    padding: 22px;
    text-align: center;
  }

  .setup-tip {
    font-size: 12px;
    color: rgba(var(--color-gold-rgb), 0.85);
    margin: 6px 0 4px;
    font-style: italic;
  }

  .casin-target-title {
    font-size: 22px;
    color: var(--color-gold);
    text-shadow: 0 0 10px rgba(var(--color-gold-rgb), 0.4);
    text-align: center;
    margin-bottom: 4px;
  }

  .casin-target-sub {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
    text-transform: uppercase;
    letter-spacing: 1px;
    text-align: center;
    margin-bottom: 12px;
  }

  .sep {
    height: 1px;
    background: rgba(255, 255, 255, 0.1);
    margin: 16px 0;
  }

  /* ===== Scoreboard ===== */
  .casin-scoreboard {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 10px;
  }

  .casin-score-card {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(0, 0, 0, 0.25);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 10px;
    padding: 6px 10px;
    font-size: 13px;
    transition: border-color .2s, box-shadow .2s;
  }

  .casin-score-card.active {
    border-color: var(--color-gold);
    box-shadow: 0 0 12px rgba(var(--color-gold-rgb), 0.2);
  }

  .casin-score-emoji {
    font-size: 16px;
    width: 22px;
    text-align: center;
    flex-shrink: 0;
  }

  .casin-score-name {
    flex: 1;
    color: rgba(255, 255, 255, 0.85);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .casin-score-card.active .casin-score-name {
    color: var(--color-gold);
    font-weight: bold;
  }

  .casin-score-progress {
    font-weight: bold;
    color: white;
  }

  .casin-score-x {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.4);
  }

  .casin-blocked-badge {
    font-size: 11px;
    color: #ff8a8a;
    background: rgba(255, 100, 100, 0.12);
    border-radius: 6px;
    padding: 2px 6px;
    white-space: nowrap;
    flex-shrink: 0;
  }

  /* ===== Grille 9 actions ===== */
  .casin-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-bottom: 14px;
  }

  .casin-action-btn {
    background: rgba(0, 0, 0, 0.25);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 14px;
    padding: 10px 6px 8px;
    color: white;
    font-family: inherit;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    transition: transform .1s, border-color .15s, box-shadow .15s, opacity .2s;
    -webkit-tap-highlight-color: transparent;
  }

  .casin-action-btn:active:not(:disabled) {
    transform: scale(0.97);
  }

  .casin-action-btn:not(:disabled):hover {
    border-color: rgba(var(--color-gold-rgb), 0.6);
    box-shadow: 0 0 10px rgba(var(--color-gold-rgb), 0.15);
  }

  .casin-action-btn.closed {
    opacity: 0.45;
    cursor: default;
    background: rgba(var(--color-gold-rgb), 0.1);
    border-color: rgba(var(--color-gold-rgb), 0.4);
  }

  .casin-action-btn.blocked {
    opacity: 0.35;
    cursor: not-allowed;
    background: rgba(255, 100, 100, 0.1);
    border-color: rgba(255, 100, 100, 0.3);
  }

  .casin-action-icon {
    font-size: 24px;
    line-height: 1;
  }

  .casin-action-label {
    font-size: 12px;
    font-weight: bold;
    color: rgba(255, 255, 255, 0.9);
    text-align: center;
  }

  .casin-pips {
    display: flex;
    gap: 3px;
    margin-top: 2px;
  }

  .casin-pip {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.2);
    transition: background .2s;
  }

  .casin-pip.filled {
    background: var(--color-gold);
    border-color: var(--color-gold-light);
    box-shadow: 0 0 4px rgba(var(--color-gold-rgb), 0.6);
  }

  /* ===== Bottombar ===== */
  .game-bottombar {
    display: flex;
    gap: 10px;
  }

  .btn-neutral {
    flex: 1;
    padding: 14px;
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 50px;
    font-family: inherit;
    font-size: 15px;
    font-weight: bold;
    cursor: pointer;
    transition: background .15s;
  }
  .btn-neutral:hover { background: rgba(255, 255, 255, 0.15); }

  .btn-next {
    flex: 1;
    padding: 14px;
    background: linear-gradient(145deg, #2196F3, #1565C0);
    color: white;
    border: none;
    border-radius: 50px;
    font-family: inherit;
    font-size: 15px;
    font-weight: bold;
    cursor: pointer;
    box-shadow: 0 4px 0 #0D47A1;
    transition: transform .1s, box-shadow .1s;
  }
  .btn-next:active {
    transform: translateY(2px);
    box-shadow: none;
  }
</style>
