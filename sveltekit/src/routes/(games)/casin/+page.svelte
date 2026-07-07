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
  import { shuffle } from '$lib/utils.js';
  import { onMount } from 'svelte';
  import GameLayout from '$lib/components/GameLayout.svelte';
  import RulesViewer from '$lib/components/RulesViewer.svelte';
  import WinOverlay from '$lib/components/WinOverlay.svelte';
  import TrophyIcon from '$lib/components/TrophyIcon.svelte';
  import NumberSelector from '$lib/components/NumberSelector.svelte';
  import PlayerSetupList from '$lib/components/PlayerSetupList.svelte';
  import RecapList from '$lib/components/RecapList.svelte';
  import MatchSetup from '$lib/components/MatchSetup.svelte';
  import MatchRecapOverlay from '$lib/components/MatchRecapOverlay.svelte';
  import MatchSummaryOverlay from '$lib/components/MatchSummaryOverlay.svelte';
  import { showToast } from '$lib/stores/toast.js';
  import { askConfirm } from '$lib/stores/confirm.js';
  import { t } from 'svelte-i18n';
  import { get } from 'svelte/store';
  import { matchStore, startMatch, recordResult, endMatch, undoResult, isLastGame } from '$lib/stores/match.js';
  import { recordHistory } from '$lib/stores/history.js';
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
  import BallIcon from '$lib/components/BallIcon.svelte';
  import { BALL_COLORS } from '$lib/constants/balls.js';

  let phase = 'setup1';
  $: phase, typeof window !== 'undefined' && window.scrollTo({ top: 0, behavior: 'instant' });

  // ── Mode match ────────────────────────────────────────
  let matchMode = false;
  let matchTotalGames = 3;
  let showMatchRecap = false;
  let showMatchSummary = false;
  let matchAbandoned = false;
  let breakOrder = 'alternate';
  let picks = [];
  let picksMap = {};

  onMount(() => {
    if ($matchStore.isActive && $matchStore.gameId === 'casin') {
      const p = $matchStore.players;
      count = p.length;
      setupPlayers = p.map(name => ({ name, x: CASIN_DEFAULT_X }));
      matchMode = true;
      matchTotalGames = $matchStore.totalGames;
      picks = p.map(name => ({ name, profileId: null }));
      startGame();
    }
  });

  // Setup
  let count = CASIN_MIN_PLAYERS;
  let globalX = CASIN_DEFAULT_X;
  let randomizeOrder = true;
  let setupPlayers = [];

  function gotoSetup2() {
    setupPlayers = Array.from({ length: count }, (_, i) => ({
      name: setupPlayers[i]?.name ?? '',
      x:    setupPlayers[i]?.x ?? globalX,
    }));
    picks = Array.from({ length: count }, (_, i) => ({
      name:      picks[i]?.name      ?? setupPlayers[i]?.name ?? '',
      profileId: picks[i]?.profileId ?? null,
    }));
    phase = 'setup2';
  }

  function gotoSetup3() {
    const _t = get(t);
    setupPlayers = setupPlayers.map((p, i) => ({
      ...p,
      name: picks[i]?.name?.trim() || _t('setup.defaultPlayer', { values: { n: i + 1 } }),
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

  function resolveBreakOrder() {
    if (!$matchStore.isActive || $matchStore.results.length === 0) {
      return randomizeOrder ? shuffle([...setupPlayers]) : [...setupPlayers];
    }
    if (breakOrder === 'winner') {
      const lastName = $matchStore.results[$matchStore.results.length - 1]?.winners[0];
      const idx = setupPlayers.findIndex(p => p.name === lastName);
      return idx > 0 ? [...setupPlayers.slice(idx), ...setupPlayers.slice(0, idx)] : [...setupPlayers];
    }
    const offset = ($matchStore.currentGame - 1) % setupPlayers.length;
    return [...setupPlayers.slice(offset), ...setupPlayers.slice(0, offset)];
  }

  function startGame() {
    picksMap = Object.fromEntries(picks.map(p => [p.name.trim() || p.name, p.profileId]));
    const players = resolveBreakOrder();
    state = createInitialState(players);
    winnerName = null;
    phase = 'game';
    showToast(get(t)('casin.toast.turn', { values: { name: state.players[0].name } }));
  }

  function onDoAction(actionId) {
    const { newState, outcome } = doAction(state, actionId);
    state = newState;

    if (outcome.kind === 'closed') {
      showToast(get(t)('casin.alreadyDone'));
    } else if (outcome.kind === 'win') {
      winnerName = outcome.winner.name;
      recordHistory({
        gameId: 'casin',
        players: state.players.map(p => ({ name: p.name, profileId: picksMap[p.name] ?? null })),
        winners: [outcome.winner.name],
        scores: Object.fromEntries(state.players.map(p => [p.name, doneCount(p)])),
      });
      if ($matchStore.isActive) {
        const allScores = state.players.map(p => ({ name: p.name, score: doneCount(p) }));
        recordResult([outcome.winner.name], allScores);
        showMatchRecap = true;
      } else {
        phase = 'win';
      }
    } else if (outcome.kind === 'scored') {
      showToast(get(t)('casin.actionDone', { values: { label: get(t)('casin.actions.' + outcome.actionId) } }));
    }
  }

  function onNeutralShot() {
    const { newState, outcome } = neutralShot(state);
    state = newState;
    if (outcome.kind === 'reset') {
      showToast(get(t)('casin.neutralResetToast'));
    } else {
      showToast(get(t)('casin.neutralNoneToast'));
    }
  }

  function onNextPlayer() {
    state = nextPlayer(state);
    showToast(get(t)('toast.yourTurn', { values: { name: state.players[state.currentIndex].name } }));
  }

  function onUndo() {
    state = undo(state);
    showToast(get(t)('toast.actionCancelled'));
  }

  function onUndoFromWin() {
    state = undo(state);
    winnerName = null;
    phase = 'game';
    showToast(get(t)('toast.finalShotCancelled'));
  }

  function replay() {
    startGame();
  }
  function newGame() {
    goto(base || '/');
  }
  async function confirmGoHome() {
    const _t = get(t);
    const ok = await askConfirm(_t('confirm.leaveGame'), {
      confirmLabel: _t('confirm.abandonLabel'),
      cancelLabel:  _t('confirm.continueLabel'),
      iconImage:    `${base}/assets/home.png`
    });
    if (ok) {
      if (matchMode) endMatch();
      goto(base || '/');
    }
  }

  let rulesOpen = false;

  // ── Handlers match recap ──────────────────────────────
  function onMatchNext() {
    showMatchRecap = false;
    winnerName = null;
    startGame();
  }
  function onMatchViewFinal() {
    showMatchRecap = false;
    showMatchSummary = true;
  }
  function onMatchUndo() {
    undoResult();
    state = undo(state);
    winnerName = null;
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
    showMatchRecap = false;
    matchAbandoned = true;
    showMatchSummary = true;
  }
  function onMatchPlayAgain() {
    const savedPlayers = $matchStore.players;
    const savedTotal = $matchStore.totalGames;
    endMatch();
    startMatch('casin', savedPlayers, savedTotal);
    matchAbandoned = false;
    showMatchSummary = false;
    winnerName = null;
    startGame();
  }
  function onMatchNewGame() {
    endMatch();
    matchAbandoned = false;
    showMatchSummary = false;
    goto(base || '/');
  }

  // Helpers réactifs
  $: activePlayer = state ? state.players[state.currentIndex] : null;
  $: tabCols = state ? (state.players.length >= 5 ? 3 : 2) : 1;
  $: matchRecapGameNumber = $matchStore.currentGame - 1;
  $: matchRecapWinners = $matchStore.results?.[$matchStore.results.length - 1]?.winners ?? [];
</script>

<!-- ============== SETUP 1 ============== -->
{#if phase === 'setup1'}
  <div class="setup">
    <h1>
      <img src="{base}/assets/3_billes_check.png" alt="" class="icon-title" />
      Casin
    </h1>
    <div class="setup-sub">{$t('setup.step', { values: { n: 1, total: 3 } })} — {$t('setup.general')}</div>

    <div class="popup-box setup-box">
      <NumberSelector
        bind:value={count}
        min={CASIN_MIN_PLAYERS}
        max={CASIN_MAX_PLAYERS}
        label={$t('setup.playerCount')} />

      <div class="sep"></div>

      <NumberSelector
        bind:value={globalX}
        min={CASIN_MIN_X}
        max={CASIN_MAX_X}
        label={$t('casin.repetitionsLabel')} />
      <div class="setup-tip">
        {$t('casin.repetitionsTip')}
      </div>

      <button class="btn-main btn-gold" on:click={gotoSetup2}>{$t('setup.next')}</button>
      <button class="btn-main btn-gray" on:click={() => goto(base || '/')}>{$t('setup.back')}</button>
    </div>
  </div>
{/if}

<!-- ============== SETUP 2 ============== -->
{#if phase === 'setup2'}
  <div class="setup">
    <h1>
      <img src="{base}/assets/3_billes_check.png" alt="" class="icon-title" />
      Casin
    </h1>
    <div class="setup-sub">{$t('setup.step', { values: { n: 2, total: 3 } })} — {$t('setup.playerNames')}</div>

    <div class="popup-box setup-box">
      <PlayerSetupList bind:picks count={setupPlayers.length} />

      <button class="btn-main btn-gold" on:click={gotoSetup3}>{$t('setup.next')}</button>
      <button class="btn-main btn-gray" on:click={() => phase = 'setup1'}>{$t('setup.back')}</button>
    </div>
  </div>
{/if}

<!-- ============== SETUP 3 ============== -->
{#if phase === 'setup3'}
  <div class="setup">
    <h1>
      <img src="{base}/assets/3_billes_check.png" alt="" class="icon-title" />
      Casin
    </h1>
    <div class="setup-sub">{$t('setup.step', { values: { n: 3, total: 3 } })} — {$t('setup.recap')}</div>

    <div class="popup-box setup-box">
      <div class="casin-target-title">{$t('casin.targetPerPlayer')}</div>
      <div class="casin-target-sub">{$t('casin.targetPerPlayerSub')}</div>

      <RecapList players={setupPlayers} let:player let:i>
        <NumberSelector
          value={player.x}
          min={CASIN_MIN_X}
          max={CASIN_MAX_X}
          on:change={(e) => updatePlayerX(i, e.detail)} />
      </RecapList>

      <MatchSetup bind:randomizeOrder bind:matchMode bind:totalGames={matchTotalGames} bind:breakOrder />

      <button class="btn-main btn-gold" on:click={() => { if (matchMode) startMatch('casin', setupPlayers.map(p => p.name), matchTotalGames); startGame(); }}>
        {#if matchMode}<TrophyIcon size="1.3em" color="currentColor" /> {$t('setup.launchMatch')}{:else}{$t('setup.launchGame')}{/if}
      </button>
      <button class="btn-main btn-gray" on:click={() => phase = 'setup2'}>{$t('setup.back')}</button>
    </div>
  </div>
{/if}

<!-- ============== GAME ============== -->
{#if phase === 'game' && state && activePlayer}
  <div class="game">
    <GameLayout
      title="CASIN"
      icon="{base}/assets/3_billes_check.png"
      gameId="casin"
      canUndo={state.history.length > 0}
      on:home={confirmGoHome}
      on:undo={onUndo}
      on:rules={() => rulesOpen = true}>

      <!-- Scoreboard compact -->
      {#if state.players.length === 2}
        <div class="casin-scores-2p">
          {#each state.players as player, i (i)}
            {@const isActive = i === state.currentIndex}
            {@const blockedAction = isActive && player.lastAction && player.scores[player.lastAction] < player.x
              ? CASIN_ACTIONS.find(a => a.id === player.lastAction)
              : null}
            <div class="casin-card-2p" class:casin-card-active={isActive}>
              <div class="casin-card-emoji"><BallIcon color={BALL_COLORS[i % BALL_COLORS.length]} size="22px" /></div>
              <div class="casin-card-name">{player.name}</div>
              <div class="casin-card-progress">
                <span class="casin-card-score-val">{doneCount(player)}</span>
                <span class="casin-card-total">/ {CASIN_ACTIONS.length}</span>
              </div>
              {#if blockedAction}
                <div class="casin-blocked-badge">{$t('casin.blockedBadge', { values: { action: $t('casin.actions.' + blockedAction.id) } })}</div>
              {/if}
            </div>
          {/each}
        </div>
      {:else}
        <div class="casin-scoreboard" style="--tab-cols: {tabCols}">
        {#each state.players as player, i (i)}
          {@const isActive = i === state.currentIndex}
          {@const blockedAction = isActive && player.lastAction && player.scores[player.lastAction] < player.x
            ? CASIN_ACTIONS.find(a => a.id === player.lastAction)
            : null}
          <div class="casin-score-card" class:active={isActive}>
            <span class="casin-score-emoji"><BallIcon color={BALL_COLORS[i % BALL_COLORS.length]} /></span>
            <span class="casin-score-name">{player.name}</span>
            {#if blockedAction}
              <span class="casin-blocked-badge">{$t('casin.blockedBadge', { values: { action: $t('casin.actions.' + blockedAction.id) } })}</span>
            {/if}
            <span class="casin-score-progress">{doneCount(player)} / {CASIN_ACTIONS.length}</span>
          </div>
        {/each}
      </div>
      {/if}

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
          title={$t('casin.actions.' + action.id + 'Desc')}
          on:click={() => onDoAction(action.id)}>
          <span class="casin-action-icon">{action.icon}</span>
          <span class="casin-action-label">{$t('casin.actions.' + action.id)}</span>
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
          <button class="btn-neutral" on:click={onNeutralShot}>{$t('casin.neutralShot')}</button>
          <button class="btn-next" on:click={onNextPlayer}>{$t('setup.next')}</button>
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
  sub={$t('casin.winSub')}
  canUndo={state?.history?.length > 0}
  on:undo={onUndoFromWin}
  on:replay={replay}
  on:newGame={newGame} />

<!-- ============== OVERLAY RÉCAP MATCH ============== -->
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
    onAbandon={onMatchAbandon} />
{/if}

<!-- ============== OVERLAY RÉCAP FINAL MATCH ============== -->
{#if showMatchSummary}
  <MatchSummaryOverlay
    matchScores={$matchStore.matchScores}
    results={$matchStore.results}
    gameId="casin"
    totalGames={$matchStore.totalGames}
    abandoned={matchAbandoned}
    onPlayAgain={onMatchPlayAgain}
    onNewGame={onMatchNewGame} />
{/if}

<!-- ============== RULES ============== -->
<RulesViewer gameId="casin" open={rulesOpen} on:close={() => rulesOpen = false} />


<style>
  .setup,
  .game {
    width: var(--content-w, 92%);
    max-width: var(--content-max, 480px);
    padding-top: 10px;
  }

  .setup-sub {
    text-align: center;
    font-size: 12px;
    color: rgba(var(--color-text-rgb), 0.4);
    letter-spacing: 1px;
    text-transform: uppercase;
    margin-bottom: 18px;
  }

  .setup-box {
    background: linear-gradient(160deg, var(--color-pool-mid), var(--color-pool-dark));
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
    color: rgba(var(--color-text-rgb), 0.5);
    text-transform: uppercase;
    letter-spacing: 1px;
    text-align: center;
    margin-bottom: 12px;
  }

  .sep {
    height: 1px;
    background: rgba(var(--color-text-rgb), 0.1);
    margin: 16px 0;
  }

  /* ── 2 joueurs : cartes style Chicago ── */
  .casin-scores-2p {
    display: flex;
    gap: 12px;
    margin-bottom: 10px;
  }

  .casin-card-2p {
    flex: 1;
    background: rgba(0, 0, 0, 0.25);
    border: 2px solid rgba(var(--color-text-rgb), 0.1);
    border-radius: 16px;
    padding: 14px 10px 12px;
    text-align: center;
    transition: border-color .3s, box-shadow .3s;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .casin-card-2p.casin-card-active {
    border-color: var(--color-gold);
    box-shadow: 0 0 16px rgba(var(--color-gold-rgb), 0.25);
  }

  .casin-card-emoji {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .casin-card-name {
    font-size: 13px;
    color: rgba(var(--color-text-rgb), 0.6);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  .casin-card-2p.casin-card-active .casin-card-name {
    color: var(--color-gold);
    font-weight: bold;
  }

  .casin-card-progress {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 3px;
    line-height: 1;
  }

  .casin-card-score-val {
    font-size: 28px;
    font-weight: bold;
    color: white;
  }

  .casin-card-2p.casin-card-active .casin-card-score-val {
    color: var(--color-gold);
    text-shadow: 0 0 20px rgba(var(--color-gold-rgb), 0.4);
  }

  .casin-card-total {
    font-size: 13px;
    color: rgba(var(--color-text-rgb), 0.35);
    font-weight: normal;
  }

  /* ===== Scoreboard ===== */
  .casin-scoreboard {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 10px;
  }

  @media (min-width: 700px) {
    .casin-scoreboard {
      display: grid;
      grid-template-columns: repeat(var(--tab-cols, 1), 1fr);
      gap: 6px;
    }
  }

  .casin-score-card {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(0, 0, 0, 0.25);
    border: 1px solid rgba(var(--color-text-rgb), 0.06);
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
    width: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .casin-score-name {
    flex: 1;
    color: rgba(var(--color-text-rgb), 0.85);
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
    border: 1px solid rgba(var(--color-text-rgb), 0.08);
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
    color: rgba(var(--color-text-rgb), 0.9);
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
    background: rgba(var(--color-text-rgb), 0.15);
    border: 1px solid rgba(var(--color-text-rgb), 0.2);
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
    background: rgba(var(--color-text-rgb), 0.1);
    color: rgba(var(--color-text-rgb), 0.85);
    border: 1px solid rgba(var(--color-text-rgb), 0.2);
    border-radius: 50px;
    font-family: inherit;
    font-size: 15px;
    font-weight: bold;
    cursor: pointer;
    transition: background .15s;
  }
  .btn-neutral:hover { background: rgba(var(--color-text-rgb), 0.15); }

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
