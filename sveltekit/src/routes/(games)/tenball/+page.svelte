<!--
  Page complète du jeu 10-Ball.

  Phases :
   - 'setup' → saisie des joueurs, ordre de jeu, ordre de casse, mode match
   - 'game'  → ordre de jeu avec casseur mis en avant, rappels de règles,
                bouton(s) victoire
   - 'win'   → overlay de victoire (partie simple)

  Différence vs 9-Ball : annonce obligatoire (bille + trou) avant chaque coup.
  La logique pure vit dans $lib/games/tenball.js (re-export de nineball.js).
-->
<script>
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import GameLayout from '$lib/components/GameLayout.svelte';
  import RulesViewer from '$lib/components/RulesViewer.svelte';
  import WinOverlay from '$lib/components/WinOverlay.svelte';
  import NumberSelector from '$lib/components/NumberSelector.svelte';
  import MatchSetup from '$lib/components/MatchSetup.svelte';
  import MatchRecapOverlay from '$lib/components/MatchRecapOverlay.svelte';
  import MatchSummaryOverlay from '$lib/components/MatchSummaryOverlay.svelte';
  import PlayerPicker from '$lib/components/PlayerPicker.svelte';
  import { showToast } from '$lib/stores/toast.js';
  import { askConfirm } from '$lib/stores/confirm.js';
  import { t } from 'svelte-i18n';
  import { get } from 'svelte/store';
  import { matchStore, startMatch, recordResult, endMatch, undoResult } from '$lib/stores/match.js';
  import { recordHistory } from '$lib/stores/history.js';
  import { createInitialState, declareWinner, undo } from '$lib/games/tenball.js';

  // ── Phase courante ─────────────────────────────────────
  let phase = 'setup';
  $: phase, typeof window !== 'undefined' && window.scrollTo({ top: 0, behavior: 'instant' });

  // ── Setup ──────────────────────────────────────────────
  let playerCount = 2;
  let picks = [
    { name: '', profileId: null },
    { name: '', profileId: null },
  ];
  let randomOrder = true;
  let breakOrder = 'alternate';
  let matchMode = false;
  let matchTotalGames = 3;

  let _prevCount = 2;
  $: if (playerCount !== _prevCount) {
    if (playerCount > _prevCount) {
      for (let i = _prevCount; i < playerCount; i++) {
        picks = [...picks, { name: '', profileId: null }];
      }
    } else {
      picks = picks.slice(0, playerCount);
    }
    _prevCount = playerCount;
  }

  $: selectedIds   = picks.map(p => p.profileId).filter(Boolean);
  $: selectedNames = picks.map(p => p.name.trim().toLowerCase()).filter(Boolean);

  // ── État de partie ─────────────────────────────────────
  let state = null;
  let gamePlayers = null;
  let gameBreakOrder = null;
  let picksMap = {};
  let winnerIndex = null;
  let winnerPickOpen = false;

  // ── Match ──────────────────────────────────────────────
  let showMatchRecap = false;
  let showMatchSummary = false;
  let matchAbandoned = false;

  // ── Lancement ──────────────────────────────────────────
  function handleLaunch() {
    const _t = get(t);

    let finalPicks = picks.map((p, i) =>
      p.name.trim() ? p : { ...p, name: _t('setup.defaultPlayer', { values: { n: i + 1 } }) }
    );

    if (randomOrder) {
      for (let i = finalPicks.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [finalPicks[i], finalPicks[j]] = [finalPicks[j], finalPicks[i]];
      }
    }

    gamePlayers    = finalPicks;
    gameBreakOrder = breakOrder;
    picksMap       = Object.fromEntries(finalPicks.map(p => [p.name, p.profileId]));

    if (matchMode) {
      startMatch('tenball', finalPicks.map(p => p.name), matchTotalGames);
    }

    startGame();
  }

  function startGame(initialBreakerIndex = null) {
    state          = createInitialState(gamePlayers, gameBreakOrder, initialBreakerIndex);
    winnerIndex    = null;
    winnerPickOpen = false;
    phase          = 'game';
    showToast(get(t)('tenball.toast.break', { values: { name: state.players[state.breakerIndex].name } }));
  }

  // ── Ordre de jeu affiché (commence au casseur) ─────────
  $: playOrder = state
    ? Array.from({ length: state.players.length }, (_, i) => ({
        ...state.players[(state.breakerIndex + i) % state.players.length],
        isBreaker: i === 0,
      }))
    : [];

  // ── Déclarer un vainqueur ──────────────────────────────
  function onDeclareWinner(idx) {
    const { newState, outcome } = declareWinner(state, idx);
    state          = newState;
    winnerIndex    = idx;
    winnerPickOpen = false;

    recordHistory({
      gameId: 'tenball',
      players: gamePlayers.map(p => ({ name: p.name, profileId: picksMap[p.name] ?? null })),
      winners: [outcome.winner.name],
      scores:  Object.fromEntries(gamePlayers.map(p => [p.name, null])),
    });

    if ($matchStore.isActive) {
      const allScores = gamePlayers.map(p => ({ name: p.name, score: null }));
      recordResult([outcome.winner.name], allScores);
      showMatchRecap = true;
    } else {
      phase = 'win';
    }
  }

  // ── Undo depuis l'overlay de victoire ─────────────────
  function onUndoFromWin() {
    state       = undo(state);
    winnerIndex = null;
    phase       = 'game';
    showToast(get(t)('toast.winCancelled'));
  }

  // ── Rejouer / nouveau jeu ──────────────────────────────
  function replay() {
    startGame(state.breakerIndex);
  }

  function newGame() {
    if ($matchStore.isActive) endMatch();
    goto(base || '/');
  }

  // ── Confirmation retour accueil ────────────────────────
  async function confirmGoHome() {
    const _t = get(t);
    const ok = await askConfirm(_t('confirm.leaveGame'), {
      confirmLabel: _t('confirm.abandonLabel'),
      cancelLabel:  _t('confirm.continueLabel'),
      iconImage:    `${base}/assets/home.png`,
    });
    if (ok) {
      if (matchMode) endMatch();
      goto(base || '/');
    }
  }

  // ── Handlers match ─────────────────────────────────────
  function onMatchNext() {
    showMatchRecap = false;
    winnerIndex    = null;
    startGame(state.breakerIndex);
  }

  function onMatchViewFinal() {
    showMatchRecap = false;
    showMatchSummary = true;
  }

  function onMatchUndo() {
    undoResult();
    state          = undo(state);
    winnerIndex    = null;
    showMatchRecap = false;
    showToast(get(t)('toast.winCancelled'));
  }

  async function onMatchAbandon() {
    const _t = get(t);
    const ok = await askConfirm(_t('confirm.leaveMatch'), {
      confirmLabel: _t('confirm.abandonLabel'),
      cancelLabel:  _t('confirm.continueLabel'),
    });
    if (!ok) return;
    showMatchRecap   = false;
    matchAbandoned   = true;
    showMatchSummary = true;
  }

  function onMatchPlayAgain() {
    const savedTotal = $matchStore.totalGames;
    endMatch();
    startMatch('tenball', gamePlayers.map(p => p.name), savedTotal);
    matchAbandoned   = false;
    showMatchSummary = false;
    winnerIndex      = null;
    startGame();
  }

  function onMatchNewGame() {
    endMatch();
    matchAbandoned   = false;
    showMatchSummary = false;
    goto(base || '/');
  }

  // ── Règles ─────────────────────────────────────────────
  let rulesOpen = false;

  // ── Dérivés ────────────────────────────────────────────
  $: winner  = winnerIndex !== null && state ? state.players[winnerIndex] : null;
  $: winName = winner?.name ?? '';

  $: matchRecapGameNumber = $matchStore.currentGame - 1;
  $: matchRecapWinners    = $matchStore.results?.[$matchStore.results.length - 1]?.winners ?? [];
</script>


<!-- ===== PHASE SETUP ===== -->
{#if phase === 'setup'}
  <div class="setup">
    <h1>
      <img src="{base}/assets/bille_10.png" alt="" class="icon-title" />
      10 Ball
    </h1>
    <div class="setup-sub">{$t('setup.configuration')}</div>

    <div class="popup-box setup-box">

      <NumberSelector
        bind:value={playerCount}
        min={2}
        max={6}
        step={1}
        label={$t('setup.playerCount')} />

      <div class="players-list">
        {#each picks as pick, i (i)}
          <PlayerPicker
            bind:value={picks[i]}
            index={i}
            exclude={selectedIds.filter(id => id !== pick.profileId)}
            excludeNames={selectedNames.filter(n => n !== pick.name.trim().toLowerCase())}
          />
        {/each}
      </div>

      <MatchSetup bind:randomizeOrder={randomOrder} bind:matchMode bind:totalGames={matchTotalGames} bind:breakOrder />

      <button class="btn-main btn-gold" on:click={handleLaunch}>
        {matchMode ? $t('setup.launchMatch') : $t('setup.launchGame')}
      </button>
      <button class="btn-main btn-gray" on:click={() => goto(base || '/')}>{$t('setup.back')}</button>
    </div>
  </div>
{/if}


<!-- ===== PHASE GAME ===== -->
{#if phase === 'game' && state}
  <div class="game">
    <GameLayout
      title="10 BALL"
      icon="{base}/assets/bille_10.png"
      gameId="tenball"
      canUndo={false}
      on:home={confirmGoHome}
      on:rules={() => (rulesOpen = true)}
    >

      <!-- Ordre de jeu -->
      <div class="play-order">
        {#each playOrder as player, i}
          <div class="order-row" class:is-breaker={i === 0}>
            <span class="order-num">{i + 1}</span>
            <span class="order-name">{player.name}</span>
            {#if i === 0}
              <span class="break-badge-inline">{$t('tenball.breakBadge')}</span>
            {/if}
          </div>
        {/each}
      </div>

      <!-- Rappels de règles -->
      <div class="reminders">
        <div class="reminder-item">{@html $t('tenball.reminderLowest')}</div>
        <div class="reminder-item reminder-call">{@html $t('tenball.reminderCall')}</div>
        <div class="reminder-item">{@html $t('tenball.reminderTen')}</div>
        <div class="reminder-item">{@html $t('tenball.reminderFault')}</div>
      </div>

      <!-- Boutons victoire dans le footer -->
      <svelte:fragment slot="footer">
        {#if state.players.length === 2}
          <div class="victory-buttons">
            <button class="btn-victory" on:click={() => onDeclareWinner(0)}>
              🏆 {state.players[0].name}
            </button>
            <button class="btn-victory" on:click={() => onDeclareWinner(1)}>
              🏆 {state.players[1].name}
            </button>
          </div>
        {:else}
          <button class="btn-victory btn-declare" on:click={() => winnerPickOpen = true}>
            {$t('tenball.declareWinner')}
          </button>
        {/if}
      </svelte:fragment>
    </GameLayout>
  </div>
{/if}


<!-- ===== OVERLAY VICTOIRE ===== -->
<WinOverlay
  open={phase === 'win' && winnerIndex !== null}
  trophy="🏆"
  name={winName}
  sub={$t('tenball.winSub')}
  canUndo={state?.history?.length > 0}
  on:undo={onUndoFromWin}
  on:replay={replay}
  on:newGame={newGame}
/>


<!-- ===== OVERLAY SÉLECTION VAINQUEUR (3+ joueurs) ===== -->
{#if winnerPickOpen && state}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="winner-overlay" on:click|self={() => winnerPickOpen = false}>
    <div class="winner-panel">
      <div class="winner-panel-title">{$t('tenball.chooseWinner')}</div>
      {#each state.players as player, i}
        <button class="winner-btn" on:click={() => onDeclareWinner(i)}>
          🏆 {player.name}
        </button>
      {/each}
      <button class="winner-cancel" on:click={() => winnerPickOpen = false}>
        {$t('common.cancel')}
      </button>
    </div>
  </div>
{/if}


<!-- ===== OVERLAY RÉCAP MATCH ===== -->
{#if showMatchRecap}
  <MatchRecapOverlay
    gameNumber={matchRecapGameNumber}
    totalGames={$matchStore.totalGames}
    winners={matchRecapWinners}
    matchScores={$matchStore.matchScores}
    isLastGame={matchRecapGameNumber === $matchStore.totalGames}
    canUndo={state?.history?.length > 0}
    onUndo={onMatchUndo}
    onNext={onMatchNext}
    onViewFinal={onMatchViewFinal}
    onAbandon={onMatchAbandon}
  />
{/if}


<!-- ===== OVERLAY RÉCAP FINAL MATCH ===== -->
{#if showMatchSummary}
  <MatchSummaryOverlay
    matchScores={$matchStore.matchScores}
    results={$matchStore.results}
    gameId="tenball"
    totalGames={$matchStore.totalGames}
    abandoned={matchAbandoned}
    onPlayAgain={onMatchPlayAgain}
    onNewGame={onMatchNewGame}
  />
{/if}


<!-- ===== OVERLAY RÈGLES ===== -->
<RulesViewer gameId="tenball" open={rulesOpen} on:close={() => (rulesOpen = false)} />


<style>
  .setup,
  .game {
    width: var(--content-w, 92%);
    max-width: var(--content-max, 480px);
    padding-top: 10px;
  }

  /* ── Setup ── */
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

  .players-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 16px 0;
    text-align: left;
  }

  /* ── Ordre de jeu (game screen) ── */
  .play-order {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 8px;
    margin-bottom: 16px;
  }

  .order-row {
    display: flex;
    align-items: center;
    gap: 10px;
    background: rgba(0, 0, 0, 0.25);
    border: 2px solid rgba(255, 255, 255, 0.08);
    border-radius: 14px;
    padding: 12px 14px;
    color: rgba(255, 255, 255, 0.65);
    font-size: 15px;
    transition: border-color .3s, box-shadow .3s;
  }

  .order-row.is-breaker {
    border-color: rgba(var(--color-gold-rgb), 0.6);
    color: var(--color-gold);
    font-weight: bold;
    box-shadow: 0 0 14px rgba(var(--color-gold-rgb), 0.15);
  }

  .order-num {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.3);
    min-width: 18px;
  }

  .order-row.is-breaker .order-num {
    color: rgba(var(--color-gold-rgb), 0.55);
  }

  .order-name {
    flex: 1;
  }

  .break-badge-inline {
    font-size: 11px;
    font-weight: bold;
    background: rgba(var(--color-gold-rgb), 0.15);
    border: 1px solid rgba(var(--color-gold-rgb), 0.4);
    color: var(--color-gold);
    border-radius: 6px;
    padding: 2px 8px;
    white-space: nowrap;
  }

  /* ── Rappels ── */
  .reminders {
    background: rgba(0, 0, 0, 0.25);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 14px;
    padding: 12px 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 10px;
  }

  .reminder-item {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.65);
    text-align: left;
    line-height: 1.5;
  }

  .reminder-item :global(strong) {
    color: rgba(255, 255, 255, 0.9);
  }

  /* Le rappel "annonce" est mis en avant */
  .reminder-call {
    color: rgba(255, 255, 255, 0.8);
    background: rgba(var(--color-gold-rgb), 0.07);
    border: 1px solid rgba(var(--color-gold-rgb), 0.2);
    border-radius: 8px;
    padding: 6px 10px;
    margin: -2px -4px;
  }

  .reminder-call :global(strong) {
    color: var(--color-gold);
  }

  /* ── Boutons victoire ── */
  .victory-buttons {
    display: flex;
    gap: 10px;
  }

  .btn-victory {
    flex: 1;
    padding: 15px 8px;
    border: none;
    border-radius: 50px;
    font-family: inherit;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    background: linear-gradient(145deg, var(--color-gold-light), var(--color-gold));
    color: var(--color-pool);
    box-shadow: 0 4px 0 var(--color-gold-dark);
    transition: transform .1s, box-shadow .1s;
    -webkit-tap-highlight-color: transparent;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .btn-victory:active {
    transform: translateY(2px);
    box-shadow: none;
  }

  .btn-declare {
    width: 100%;
    font-size: 15px;
  }

  /* ── Overlay sélection vainqueur ── */
  .winner-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.65);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
  }

  .winner-panel {
    background: linear-gradient(160deg, #1e5c34, #143d24);
    border: 1px solid rgba(var(--color-gold-rgb), 0.5);
    border-radius: 20px;
    padding: 24px 20px;
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 88%;
    max-width: 320px;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
  }

  .winner-panel-title {
    font-size: 11px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.45);
    text-transform: uppercase;
    letter-spacing: 1.5px;
    margin-bottom: 4px;
  }

  .winner-btn {
    font-family: inherit;
    font-size: 15px;
    font-weight: bold;
    background: linear-gradient(145deg, var(--color-gold-light), var(--color-gold));
    color: var(--color-pool);
    border: none;
    border-radius: 14px;
    padding: 13px;
    cursor: pointer;
    box-shadow: 0 3px 0 var(--color-gold-dark);
    transition: transform .1s, box-shadow .1s;
    -webkit-tap-highlight-color: transparent;
  }

  .winner-btn:active {
    transform: translateY(2px);
    box-shadow: none;
  }

  .winner-cancel {
    font-family: inherit;
    font-size: 12px;
    background: none;
    border: 1px solid rgba(255, 255, 255, 0.18);
    color: rgba(255, 255, 255, 0.4);
    border-radius: 20px;
    padding: 6px 16px;
    cursor: pointer;
    margin-top: 4px;
    transition: background .15s, color .15s;
    -webkit-tap-highlight-color: transparent;
  }

  .winner-cancel:hover {
    background: rgba(255, 255, 255, 0.07);
    color: rgba(255, 255, 255, 0.65);
  }
</style>
