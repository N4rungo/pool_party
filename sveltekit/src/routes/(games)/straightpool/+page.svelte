<!--
  Page complète du 14-1 Continu.

  Phases :
   - 'setup1' → nb joueurs + score commun
   - 'setup2' → noms
   - 'setup3' → recap avec score modifiable individuellement
   - 'game'   → scoreboard + sélecteur de break + boutons Faute/Suivant
   - 'win'    → WinOverlay avec ranking final dans le slot
-->
<script>
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { onMount } from 'svelte';
  import GameLayout from '$lib/components/GameLayout.svelte';
  import RulesViewer from '$lib/components/RulesViewer.svelte';
  import WinOverlay from '$lib/components/WinOverlay.svelte';
  import NumberSelector from '$lib/components/NumberSelector.svelte';
  import PlayerSetupList from '$lib/components/PlayerSetupList.svelte';
  import RecapList from '$lib/components/RecapList.svelte';
  import { shuffle } from '$lib/utils.js';
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
    STRAIGHTPOOL_MIN_PLAYERS,
    STRAIGHTPOOL_MAX_PLAYERS,
    STRAIGHTPOOL_DEFAULT_TARGET,
    STRAIGHTPOOL_MIN_TARGET,
    STRAIGHTPOOL_MAX_TARGET,
    STRAIGHTPOOL_TARGET_STEP,
    createInitialState,
    incBreak,
    decBreak,
    passTurn,
    fault,
    undo,
    rankedPlayers
  } from '$lib/games/straightpool.js';

  const EMOJIS = ['🟡', '🔵', '🔴', '⚪', '🟠', '🟣', '🟤', '🟢'];

  let phase = 'setup1';
  $: phase, typeof window !== 'undefined' && window.scrollTo({ top: 0, behavior: 'instant' });

  // ── Mode match ────────────────────────────────────────
  let matchMode = false;
  let matchTotalGames = 3;
  let showMatchRecap = false;
  let showMatchSummary = false;
  let matchAbandoned = false;
  let picks = [];
  let picksMap = {};

  onMount(() => {
    if ($matchStore.isActive && $matchStore.gameId === 'straightpool') {
      const p = $matchStore.players;
      count = p.length;
      setupPlayers = p.map(name => ({ name, target: STRAIGHTPOOL_DEFAULT_TARGET }));
      matchMode = true;
      matchTotalGames = $matchStore.totalGames;
      picks = p.map(name => ({ name, profileId: null }));
      startGame();
    }
  });

  let count = 2;
  let defaultTarget = STRAIGHTPOOL_DEFAULT_TARGET;
  let randomizeOrder = true;
  let breakOrder = 'alternate';
  let setupPlayers = [];

  function gotoSetup2() {
    setupPlayers = Array.from({ length: count }, (_, i) => ({
      name:   setupPlayers[i]?.name ?? '',
      target: setupPlayers[i]?.target ?? defaultTarget,
    }));
    picks = Array.from({ length: count }, (_, i) => ({
      name:      picks[i]?.name      ?? setupPlayers[i]?.name ?? '',
      profileId: picks[i]?.profileId ?? null,
    }));
    phase = 'setup2';
  }

  function gotoSetup3() {
    setupPlayers = setupPlayers.map((p, i) => ({
      ...p,
      name: picks[i]?.name?.trim() || get(t)('setup.defaultPlayer', { values: { n: i + 1 } }),
    }));
    phase = 'setup3';
  }

  function updatePlayerTarget(i, newTarget) {
    setupPlayers = setupPlayers.map((p, idx) =>
      idx === i ? { ...p, target: newTarget } : p
    );
  }

  let state = null;
  let winnerName = null;
  let winnerRanking = [];

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
    winnerRanking = [];
    phase = 'game';
    showToast(get(t)('straightpool.toast.starts', { values: { name: state.players[0].name } }));
  }

  function onIncBreak() {
    const { newState, outcome } = incBreak(state);
    state = newState;
    if (outcome.kind === 'win') {
      winnerName = outcome.winner.name;
      winnerRanking = rankedPlayers(state);
      recordHistory({
        gameId: 'straightpool',
        players: state.players.map(p => ({ name: p.name, profileId: picksMap[p.name] ?? null })),
        winners: [outcome.winner.name],
        scores: Object.fromEntries(state.players.map(p => [p.name, p.score])),
        extras: Object.fromEntries(state.players.map(p => [p.name, { breakMax: p.bestBreak }])),
      });
      if ($matchStore.isActive) {
        const allScores = state.players.map(p => ({ name: p.name, score: p.score }));
        recordResult([outcome.winner.name], allScores);
        showMatchRecap = true;
      } else {
        phase = 'win';
      }
    }
  }

  function onDecBreak() {
    state = decBreak(state);
  }

  function onPassTurn() {
    state = passTurn(state);
    showToast(get(t)('toast.yourTurn', { values: { name: state.players[state.currentIndex].name } }));
  }

  function onFault() {
    state = fault(state);
    showToast(get(t)('straightpool.toast.fault'));
  }

  function onUndo() {
    state = undo(state);
    showToast(get(t)('toast.actionCancelled'));
  }

  function onUndoFromWin() {
    state = undo(state);
    winnerName = null;
    winnerRanking = [];
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
    winnerRanking = [];
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
    winnerRanking = [];
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
    startMatch('straightpool', savedPlayers, savedTotal);
    matchAbandoned = false;
    showMatchSummary = false;
    winnerName = null;
    winnerRanking = [];
    startGame();
  }
  function onMatchNewGame() {
    endMatch();
    matchAbandoned = false;
    showMatchSummary = false;
    goto(base || '/');
  }

  $: progressPct = (i) => {
    if (!state) return 0;
    const p = state.players[i];
    return Math.min(100, Math.max(0, (p.score / p.target) * 100));
  };
  $: tabCols = state ? (state.players.length >= 5 ? 3 : 2) : 1;
  $: activePlayer = state ? state.players[state.currentIndex] : null;
  $: matchRecapGameNumber = $matchStore.currentGame - 1;
  $: matchRecapWinners = $matchStore.results?.[$matchStore.results.length - 1]?.winners ?? [];
</script>

<!-- ============== SETUP 1 ============== -->
{#if phase === 'setup1'}
  <div class="setup">
    <h1>
      <img src="{base}/assets/triangle_14-1.png" alt="" class="icon-title" />
      14-1 Continu
    </h1>
    <div class="setup-sub">{$t('setup.step', { values: { n: 1, total: 3 } })} — {$t('setup.general')}</div>

    <div class="popup-box setup-box">
      <NumberSelector
        bind:value={count}
        min={STRAIGHTPOOL_MIN_PLAYERS}
        max={STRAIGHTPOOL_MAX_PLAYERS}
        label={$t('setup.playerCount')} />

      <div class="sep"></div>

      <NumberSelector
        bind:value={defaultTarget}
        min={STRAIGHTPOOL_MIN_TARGET}
        max={STRAIGHTPOOL_MAX_TARGET}
        step={STRAIGHTPOOL_TARGET_STEP}
        label={$t('setup.targetScore')} />
      <div class="setup-tip">{$t('straightpool.setupTip')}</div>

      <button class="btn-main btn-gold" on:click={gotoSetup2}>{$t('setup.next')}</button>
      <button class="btn-main btn-gray" on:click={() => goto(base || '/')}>{$t('setup.back')}</button>
    </div>
  </div>
{/if}

<!-- ============== SETUP 2 ============== -->
{#if phase === 'setup2'}
  <div class="setup">
    <h1>
      <img src="{base}/assets/triangle_14-1.png" alt="" class="icon-title" />
      14-1 Continu
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
      <img src="{base}/assets/triangle_14-1.png" alt="" class="icon-title" />
      14-1 Continu
    </h1>
    <div class="setup-sub">{$t('setup.step', { values: { n: 3, total: 3 } })} — {$t('setup.recap')}</div>

    <div class="popup-box setup-box">
      <div class="sp-target-title">{$t('straightpool.targetPerPlayer')}</div>
      <div class="sp-target-sub">{$t('straightpool.targetPerPlayerSub')}</div>

      <RecapList players={setupPlayers} let:player let:i>
        <NumberSelector
          value={player.target}
          min={STRAIGHTPOOL_MIN_TARGET}
          max={STRAIGHTPOOL_MAX_TARGET}
          step={STRAIGHTPOOL_TARGET_STEP}
          on:change={(e) => updatePlayerTarget(i, e.detail)} />
      </RecapList>

      <MatchSetup bind:randomizeOrder bind:matchMode bind:totalGames={matchTotalGames} bind:breakOrder />

      <button class="btn-main btn-gold" on:click={() => { if (matchMode) startMatch('straightpool', setupPlayers.map(p => p.name), matchTotalGames); startGame(); }}>
        {matchMode ? $t('setup.launchMatch') : $t('setup.launchGame')}
      </button>
      <button class="btn-main btn-gray" on:click={() => phase = 'setup2'}>{$t('setup.back')}</button>
    </div>
  </div>
{/if}

<!-- ============== GAME ============== -->
{#if phase === 'game' && state}
  <div class="game">
    <GameLayout
      title="14-1 CONTINU"
      icon="{base}/assets/triangle_14-1.png"
      gameId="straightpool"
      canUndo={state.history.length > 0}
      on:home={confirmGoHome}
      on:undo={onUndo}
      on:rules={() => rulesOpen = true}>

      <!-- Liste des joueurs -->
      <div class="sp-players" style="--tab-cols: {tabCols}">
      {#each state.players as player, i (i)}
        <div class="sp-player-card" class:active={i === state.currentIndex}>
          <div class="sp-card-top">
            <div class="sp-player-name">
              {EMOJIS[i % EMOJIS.length]} {player.name}
              {#if i === state.currentIndex}
                <span class="sp-badge-active">EN JEU</span>
              {/if}
            </div>
            <div class="sp-score">
              {player.score} <span class="sp-target-label">/ {player.target}</span>
            </div>
          </div>
          <div class="sp-progress-bar">
            <div class="sp-progress-fill" style="width: {progressPct(i)}%"></div>
          </div>
          <div class="sp-best-break">{$t('straightpool.bestBreak', { values: { n: player.bestBreak } })}</div>
        </div>
      {/each}
    </div>

      <svelte:fragment slot="footer">
        <div class="sp-action-title">{$t('straightpool.currentTurn', { values: { name: activePlayer.name } })}</div>
        <!-- Sélecteur de break courant — toujours visible -->
        <div class="sp-break-section">
          <div class="sp-break-label">{$t('straightpool.currentBreakLabel')}</div>
          <div class="sp-break-selector">
            <button class="sp-break-btn" on:click={onDecBreak} disabled={state.currentBreak === 0}>−</button>
            <span class="sp-break-value">{state.currentBreak}</span>
            <button class="sp-break-btn" on:click={onIncBreak}>+</button>
          </div>
          <div class="sp-break-hint">{$t('straightpool.breakHint')}</div>
        </div>
        <div class="game-bottombar">
          <button class="btn-fault" on:click={onFault}>{$t('cutthroat.faultBtn')}</button>
          <button class="btn-next" on:click={onPassTurn}>{$t('setup.next')}</button>
        </div>
      </svelte:fragment>
    </GameLayout>
  </div>
{/if}

<!-- ============== WIN avec ranking ============== -->
<WinOverlay
  open={phase === 'win'}
  trophy="🏆"
  name={winnerName}
  sub={$t('straightpool.winSub')}
  canUndo={state?.history?.length > 0}
  on:undo={onUndoFromWin}
  on:replay={replay}
  on:newGame={newGame}>
  {#if winnerRanking.length > 0}
    <div class="sp-ranking">
      {#each winnerRanking as p (p.name)}
        {@const idx = state.players.indexOf(p)}
        {@const isWin = p.name === winnerName}
        <div class="sp-ranking-row" class:winner={isWin}>
          <span class="sp-rank-emoji">{EMOJIS[idx % EMOJIS.length]}</span>
          <span class="sp-rank-name">{p.name}</span>
          <span class="sp-rank-score">{p.score} pts</span>
          <span class="sp-rank-break">🏅 {p.bestBreak}</span>
        </div>
      {/each}
    </div>
  {/if}
</WinOverlay>

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
    gameId="straightpool"
    totalGames={$matchStore.totalGames}
    abandoned={matchAbandoned}
    onPlayAgain={onMatchPlayAgain}
    onNewGame={onMatchNewGame} />
{/if}

<!-- ============== RULES ============== -->
<RulesViewer gameId="straightpool" open={rulesOpen} on:close={() => rulesOpen = false} />


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

  .sp-target-title {
    font-size: 22px;
    color: var(--color-gold);
    text-shadow: 0 0 10px rgba(var(--color-gold-rgb), 0.4);
    text-align: center;
    margin-bottom: 4px;
  }

  .sp-target-sub {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
    text-transform: uppercase;
    letter-spacing: 1px;
    text-align: center;
    margin-bottom: 12px;
  }

  .setup-tip {
    font-size: 12px;
    color: rgba(var(--color-gold-rgb), 0.85);
    margin: 6px 0 4px;
    font-style: italic;
  }

  .sep {
    height: 1px;
    background: rgba(255, 255, 255, 0.1);
    margin: 16px 0;
  }

  /* ===== Cartes joueurs ===== */
  .sp-players {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 16px;
  }

  @media (min-width: 700px) {
    .sp-players {
      display: grid;
      grid-template-columns: repeat(var(--tab-cols, 1), 1fr);
      gap: 10px;
    }
    .sp-player-name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .sp-player-card {
    background: rgba(0, 0, 0, 0.25);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 14px;
    padding: 12px 14px;
    transition: border-color .2s, box-shadow .2s;
  }

  .sp-player-card.active {
    border-color: var(--color-gold);
    box-shadow: 0 0 16px rgba(var(--color-gold-rgb), 0.2);
  }

  .sp-card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .sp-player-name {
    font-size: 15px;
    color: rgba(255, 255, 255, 0.9);
    font-weight: bold;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .sp-player-card.active .sp-player-name {
    color: var(--color-gold);
  }

  .sp-badge-active {
    font-size: 10px;
    background: var(--color-gold);
    color: var(--color-pool);
    padding: 2px 8px;
    border-radius: 8px;
    letter-spacing: 1px;
  }

  .sp-score {
    font-size: 22px;
    font-weight: bold;
    color: white;
    line-height: 1;
  }

  .sp-player-card.active .sp-score {
    color: var(--color-gold);
  }

  .sp-target-label {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.4);
    font-weight: normal;
  }

  .sp-progress-bar {
    height: 4px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    overflow: hidden;
    margin: 4px 0 6px;
  }

  .sp-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--color-gold), #FFA500);
    border-radius: 4px;
    transition: width .4s ease;
  }

  .sp-best-break {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
  }

  /* ===== Section break courant ===== */
  .sp-action-title {
    text-align: center;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.85);
    margin-bottom: 8px;
  }

  .sp-break-section {
    background: rgba(0, 0, 0, 0.25);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    padding: 14px;
    margin-bottom: 14px;
    text-align: center;
  }

  .sp-break-label {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 8px;
  }

  .sp-break-selector {
    display: inline-flex;
    align-items: center;
    gap: 24px;
  }

  .sp-break-value {
    font-size: 48px;
    font-weight: bold;
    color: var(--color-gold);
    text-shadow: 0 0 20px rgba(var(--color-gold-rgb), 0.4);
    min-width: 64px;
    text-align: center;
    line-height: 1;
  }

  .sp-break-btn {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    border: none;
    background: linear-gradient(145deg, var(--color-gold-light), var(--color-gold));
    color: var(--color-pool);
    font-size: 28px;
    font-weight: bold;
    cursor: pointer;
    box-shadow: 0 4px 0 var(--color-gold-dark);
    transition: transform .1s, box-shadow .1s, opacity .15s;
    line-height: 1;
  }

  .sp-break-btn:active:not(:disabled) {
    transform: translateY(2px);
    box-shadow: none;
  }

  .sp-break-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .sp-break-hint {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.4);
    margin-top: 8px;
    font-style: italic;
  }

  /* ===== Boutons bottombar ===== */
  .game-bottombar {
    display: flex;
    gap: 10px;
  }

  .btn-fault {
    flex: 1;
    padding: 14px;
    background: linear-gradient(145deg, #f44336, #c62828);
    color: white;
    border: none;
    border-radius: 50px;
    font-family: inherit;
    font-size: 15px;
    font-weight: bold;
    cursor: pointer;
    box-shadow: 0 4px 0 #8b0000;
    transition: transform .1s, box-shadow .1s;
  }
  .btn-fault:active {
    transform: translateY(2px);
    box-shadow: none;
  }

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

  /* ===== Ranking final dans WinOverlay ===== */
  .sp-ranking {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 16px;
  }

  .sp-ranking-row {
    background: rgba(0, 0, 0, 0.25);
    border-radius: 10px;
    padding: 8px 12px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
  }

  .sp-ranking-row.winner {
    background: rgba(var(--color-gold-rgb), 0.15);
    border: 1px solid var(--color-gold);
  }

  .sp-rank-emoji {
    font-size: 18px;
  }

  .sp-rank-name {
    flex: 1;
    text-align: left;
    color: white;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .sp-rank-score {
    font-weight: bold;
    color: var(--color-gold);
  }

  .sp-rank-break {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.6);
  }
</style>
