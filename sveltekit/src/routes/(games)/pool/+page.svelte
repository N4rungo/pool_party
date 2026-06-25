<!--
  Page complète du jeu Pool (8-ball américain).

  Phases :
   - 'setup' → saisie des joueurs, équipes, ordre de casse et mode match
   - 'game'  → écran de jeu : équipes, casseur actif, rappels, boutons victoire
   - 'win'   → overlay de victoire (partie simple)

  Pas de score numérique : le score est dans le match store (victoires par équipe).
  La logique pure vit dans $lib/games/pool.js.
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
  import ShuffleIcon from '$lib/components/ShuffleIcon.svelte';
  import { showToast } from '$lib/stores/toast.js';
  import { askConfirm } from '$lib/stores/confirm.js';
  import { t } from 'svelte-i18n';
  import { get } from 'svelte/store';
  import { matchStore, startMatch, recordResult, endMatch, undoResult } from '$lib/stores/match.js';
  import { recordHistory } from '$lib/stores/history.js';
  import { createInitialState, declareWinner, undo } from '$lib/games/pool.js';

  // ── Phase courante ─────────────────────────────────────
  let phase = 'setup';
  $: phase, typeof window !== 'undefined' && window.scrollTo({ top: 0, behavior: 'instant' });

  // ── Setup ──────────────────────────────────────────────
  let playerCount = 2;
  let picks = [
    { name: '', profileId: null },
    { name: '', profileId: null },
  ];
  let playerTeams = [0, 1]; // 0 = Équipe A, 1 = Équipe B
  let randomizeOrder = true;
  let breakOrder = 'alternate'; // 'alternate' | 'winner'
  let matchMode = false;
  let matchTotalGames = 3;

  // Redimensionne les tableaux quand playerCount change
  let _prevCount = 2;
  $: if (playerCount !== _prevCount) {
    if (playerCount > _prevCount) {
      for (let i = _prevCount; i < playerCount; i++) {
        picks = [...picks, { name: '', profileId: null }];
        playerTeams = [...playerTeams, i % 2];
      }
    } else {
      picks = picks.slice(0, playerCount);
      playerTeams = playerTeams.slice(0, playerCount);
    }
    _prevCount = playerCount;
  }

  // Listes d'exclusion pour les PlayerPickers
  $: selectedIds   = picks.map(p => p.profileId).filter(Boolean);
  $: selectedNames = picks.map(p => p.name.trim().toLowerCase()).filter(Boolean);

  function toggleTeam(i) {
    playerTeams = playerTeams.map((t, j) => (j === i ? 1 - t : t));
  }

  function randomizeTeams() {
    const n = picks.length;
    const indices = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    const half = Math.round(n / 2);
    const newTeams = new Array(n).fill(1);
    indices.slice(0, half).forEach(i => (newTeams[i] = 0));
    playerTeams = newTeams;
  }

  // Aperçu des équipes
  $: teamAPreview = picks
    .filter((_, i) => playerTeams[i] === 0 && picks[i].name.trim())
    .map(p => p.name.trim());
  $: teamBPreview = picks
    .filter((_, i) => playerTeams[i] === 1 && picks[i].name.trim())
    .map(p => p.name.trim());

  // ── État de partie ─────────────────────────────────────
  let state = null;
  let gameTeams = null;
  let gameBreakOrder = null;
  let picksMap = {};
  let winTeamIndex = null;

  // ── Match ──────────────────────────────────────────────
  let showMatchRecap = false;
  let showMatchSummary = false;
  let matchAbandoned = false;

  // ── Helpers ────────────────────────────────────────────
  function buildTeams() {
    const tA = picks
      .filter((_, i) => playerTeams[i] === 0 && picks[i].name.trim())
      .map(p => ({ name: p.name.trim(), profileId: p.profileId }));
    const tB = picks
      .filter((_, i) => playerTeams[i] === 1 && picks[i].name.trim())
      .map(p => ({ name: p.name.trim(), profileId: p.profileId }));
    return [
      { label: tA.length === 1 ? tA[0].name : get(t)('pool.teamA'), players: tA },
      { label: tB.length === 1 ? tB[0].name : get(t)('pool.teamB'), players: tB },
    ];
  }

  // ── Lancement ──────────────────────────────────────────
  function handleLaunch() {
    const _t = get(t);
    const allNamed = picks.every(p => p.name.trim());

    if (!allNamed) {
      // Compte les joueurs nommés déjà affectés à chaque équipe
      let countA = picks.filter((p, i) => p.name.trim() && playerTeams[i] === 0).length;
      let countB = picks.filter((p, i) => p.name.trim() && playerTeams[i] === 1).length;

      // Applique les noms par défaut et distribue les joueurs sans nom pour équilibrer
      const newTeams = [...playerTeams];
      picks = picks.map((p, i) => {
        if (p.name.trim()) return p;
        if (countA <= countB) { newTeams[i] = 0; countA++; }
        else { newTeams[i] = 1; countB++; }
        return { ...p, name: _t('setup.defaultPlayer', { values: { n: i + 1 } }) };
      });
      playerTeams = newTeams;
    } else {
      // Tous les joueurs sont nommés : on vérifie que les deux équipes existent
      const tA = picks.filter((_, i) => playerTeams[i] === 0);
      const tB = picks.filter((_, i) => playerTeams[i] === 1);
      if (tA.length === 0 || tB.length === 0) {
        showToast(_t('pool.toast.onePlayerPerTeam'));
        return;
      }
    }

    gameTeams = buildTeams();
    gameBreakOrder = breakOrder;
    picksMap = Object.fromEntries(picks.map(p => [p.name.trim(), p.profileId]));

    if (matchMode) {
      startMatch('pool', gameTeams.map(t => t.label), matchTotalGames);
    }

    startGame(randomizeOrder ? null : 0);
  }

  function startGame(initialBreakerIndex = null) {
    state = createInitialState(gameTeams, gameBreakOrder, initialBreakerIndex);
    winTeamIndex = null;
    phase = 'game';
    showToast(get(t)('pool.toast.break', { values: { team: state.teams[state.breakerTeamIndex].label } }));
  }

  // ── Déclarer un vainqueur ──────────────────────────────
  function onDeclareWinner(teamIndex) {
    const { newState } = declareWinner(state, teamIndex);
    state = newState;
    winTeamIndex = teamIndex;

    const allPlayers = [...state.teams[0].players, ...state.teams[1].players];
    const winners = state.teams[teamIndex].players.map(p => p.name);

    recordHistory({
      gameId: 'pool',
      players: allPlayers.map(p => ({ name: p.name, profileId: picksMap[p.name] ?? null })),
      winners,
      scores: Object.fromEntries(allPlayers.map(p => [p.name, null])),
    });

    if ($matchStore.isActive) {
      const allScores = state.teams.map(t => ({ name: t.label, score: null }));
      recordResult([state.teams[teamIndex].label], allScores);
      showMatchRecap = true;
    } else {
      phase = 'win';
    }
  }

  // ── Undo depuis l'overlay de victoire ─────────────────
  function onUndoFromWin() {
    state = undo(state);
    winTeamIndex = null;
    phase = 'game';
    showToast(get(t)('toast.winCancelled'));
  }

  // ── Rejouer / nouveau jeu ──────────────────────────────
  function replay() {
    startGame();
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
      cancelLabel: _t('confirm.continueLabel'),
      iconImage: `${base}/assets/home.png`,
    });
    if (ok) {
      if (matchMode) endMatch();
      goto(base || '/');
    }
  }

  // ── Handlers match ─────────────────────────────────────
  function onMatchNext() {
    showMatchRecap = false;
    winTeamIndex = null;
    startGame(state.breakerTeamIndex);
  }

  function onMatchViewFinal() {
    showMatchRecap = false;
    showMatchSummary = true;
  }

  function onMatchUndo() {
    undoResult();
    state = undo(state);
    winTeamIndex = null;
    showMatchRecap = false;
    showToast(get(t)('toast.winCancelled'));
  }

  async function onMatchAbandon() {
    const _t = get(t);
    const ok = await askConfirm(_t('confirm.leaveMatch'), {
      confirmLabel: _t('confirm.abandonLabel'),
      cancelLabel: _t('confirm.continueLabel'),
    });
    if (!ok) return;
    showMatchRecap = false;
    matchAbandoned = true;
    showMatchSummary = true;
  }

  function onMatchPlayAgain() {
    const savedTotal = $matchStore.totalGames;
    endMatch();
    startMatch('pool', gameTeams.map(t => t.label), savedTotal);
    matchAbandoned = false;
    showMatchSummary = false;
    winTeamIndex = null;
    startGame();
  }

  function onMatchNewGame() {
    endMatch();
    matchAbandoned = false;
    showMatchSummary = false;
    goto(base || '/');
  }

  // ── Règles ─────────────────────────────────────────────
  let rulesOpen = false;

  // ── Dérivés ────────────────────────────────────────────
  $: winnerTeam = winTeamIndex !== null && state ? state.teams[winTeamIndex] : null;
  $: winName = winnerTeam?.label ?? '';
  $: winSub = winnerTeam && winnerTeam.players.length > 1
    ? winnerTeam.players.map(p => p.name).join(' & ')
    : $t('pool.winSub');

  $: matchRecapGameNumber = $matchStore.currentGame - 1;
  $: matchRecapWinners = $matchStore.results?.[$matchStore.results.length - 1]?.winners ?? [];
</script>

<!-- ===== PHASE SETUP ===== -->
{#if phase === 'setup'}
  <div class="setup">
    <h1>
      <img src="{base}/assets/bille_8.png" alt="" class="icon-title" />
      Pool
    </h1>
    <div class="setup-sub">{$t('setup.configuration')}</div>

    <div class="popup-box setup-box">

      <div class="number-row">
        <NumberSelector
          bind:value={playerCount}
          min={2}
          max={8}
          step={1}
          label={$t('setup.playerCount')} />
        {#if playerCount > 2}
          <button class="btn-shuffle btn-shuffle-inline" on:click={randomizeTeams} title={$t('pool.randomize')}>
            <ShuffleIcon size={18} />
          </button>
        {/if}
      </div>

      <div class="players-list">
        {#each picks as pick, i (i)}
          <div class="player-row">
            <div class="picker-wrap">
              <PlayerPicker
                bind:value={picks[i]}
                index={i}
                exclude={selectedIds.filter(id => id !== pick.profileId)}
                excludeNames={selectedNames.filter(n => n !== pick.name.trim().toLowerCase())}
              />
            </div>
            {#if picks[i].name && playerCount > 2}
              <button
                class="team-toggle"
                class:team-a={playerTeams[i] === 0}
                class:team-b={playerTeams[i] === 1}
                on:click={() => toggleTeam(i)}
                title={$t('pool.toggleTeam')}
              >
                {playerTeams[i] === 0 ? 'A' : 'B'}
              </button>
            {/if}
          </div>
        {/each}
      </div>

      <MatchSetup bind:randomizeOrder bind:matchMode bind:totalGames={matchTotalGames} bind:breakOrder />

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
      title="POOL"
      icon="{base}/assets/bille_8.png"
      gameId="pool"
      canUndo={false}
      on:home={confirmGoHome}
      on:rules={() => (rulesOpen = true)}
    >

      <!-- Cartes des équipes -->
      <div class="teams-container">
        {#each state.teams as team, i}
          <div
            class="team-card"
            class:team-card-a={i === 0}
            class:team-card-b={i === 1}
            class:team-card-breaker={state.breakerTeamIndex === i}
          >
            {#if state.breakerTeamIndex === i}
              <div class="break-badge">{$t('pool.breakBadge')}</div>
            {/if}
            <div
              class="team-label"
              class:team-label-a={i === 0}
              class:team-label-b={i === 1}
            >
              {team.label}
            </div>
            {#if team.players.length > 1}
              <div class="team-players">
                {team.players.map(p => p.name).join(', ')}
              </div>
            {/if}
          </div>
        {/each}
      </div>

      <!-- Rappels de règles -->
      <div class="reminders">
        {#if state.teams.some(t => t.players.length > 1)}
          <div class="reminder-item">
            {@html $t('pool.reminderTeam')}
            <ul class="reminder-list">
              <li>{$t('pool.reminderTeamRule1')}</li>
              <li>{$t('pool.reminderTeamRule2')}</li>
            </ul>
          </div>
        {/if}
        <div class="reminder-item">
          {@html $t('pool.reminderFault')}
        </div>
        <div class="reminder-item">
          {@html $t('pool.reminderBlack')}
        </div>
      </div>

      <!-- Boutons victoire dans le footer -->
      <svelte:fragment slot="footer">
        <div class="victory-buttons">
          <button
            class="btn-victory btn-victory-a"
            on:click={() => onDeclareWinner(0)}
          >
            🏆 {state.teams[0].label}
          </button>
          <button
            class="btn-victory btn-victory-b"
            on:click={() => onDeclareWinner(1)}
          >
            🏆 {state.teams[1].label}
          </button>
        </div>
      </svelte:fragment>
    </GameLayout>
  </div>
{/if}

<!-- ===== OVERLAY VICTOIRE ===== -->
<WinOverlay
  open={phase === 'win' && winTeamIndex !== null}
  trophy="🏆"
  name={winName}
  sub={winSub}
  canUndo={state?.history?.length > 0}
  on:undo={onUndoFromWin}
  on:replay={replay}
  on:newGame={newGame}
/>

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
    gameId="pool"
    totalGames={$matchStore.totalGames}
    abandoned={matchAbandoned}
    onPlayAgain={onMatchPlayAgain}
    onNewGame={onMatchNewGame}
  />
{/if}

<!-- ===== OVERLAY RÈGLES ===== -->
<RulesViewer gameId="pool" open={rulesOpen} on:close={() => (rulesOpen = false)} />


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

  /* ── Joueurs ── */
  .players-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 16px 0;
    text-align: left;
  }

  .player-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .picker-wrap {
    flex: 1;
    min-width: 0;
  }

  .team-toggle {
    width: 44px;
    height: 44px;
    flex-shrink: 0;
    border-radius: 12px;
    border: 2px solid transparent;
    font-size: 15px;
    font-weight: bold;
    font-family: inherit;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;
    -webkit-tap-highlight-color: transparent;
  }

  .team-toggle.team-a {
    background: rgba(33, 150, 243, 0.2);
    border-color: rgba(33, 150, 243, 0.55);
    color: #64b5f6;
  }

  .team-toggle.team-b {
    background: rgba(229, 57, 53, 0.2);
    border-color: rgba(229, 57, 53, 0.55);
    color: #ef9a9a;
  }

  /* ── Bouton shuffle ── */
  .number-row {
    position: relative;
    display: flex;
    justify-content: center;
  }

  .btn-shuffle-inline {
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
  }

  .btn-shuffle {
    width: 44px;
    height: 44px;
    flex-shrink: 0;
    border-radius: 12px;
    border: 2px solid rgba(var(--color-text-rgb), 0.2);
    background: rgba(var(--color-text-rgb), 0.08);
    color: rgba(var(--color-text-rgb), 0.6);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s, border-color 0.15s;
    -webkit-tap-highlight-color: transparent;
  }

  .btn-shuffle:active {
    background: rgba(var(--color-text-rgb), 0.15);
    border-color: rgba(var(--color-text-rgb), 0.35);
    color: white;
  }

  .team-badge {
    font-size: 11px;
    font-weight: bold;
    border-radius: 6px;
    padding: 2px 7px;
    flex-shrink: 0;
    line-height: 1.6;
  }

  .team-badge-a {
    background: rgba(33, 150, 243, 0.15);
    border: 1px solid rgba(33, 150, 243, 0.45);
    color: #64b5f6;
  }

  .team-badge-b {
    background: rgba(229, 57, 53, 0.15);
    border: 1px solid rgba(229, 57, 53, 0.45);
    color: #ef9a9a;
  }

  /* ── Ordre de casse ── */
  .section-sep {
    height: 1px;
    background: rgba(var(--color-text-rgb), 0.1);
    margin: 16px 0 12px;
  }

  .section-label {
    font-size: 11px;
    color: rgba(var(--color-text-rgb), 0.4);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 8px;
    text-align: left;
  }

  /* ── Écran de jeu ── */
  .teams-container {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
    margin-top: 8px;
  }

  .team-card {
    flex: 1;
    background: rgba(0, 0, 0, 0.25);
    border: 2px solid rgba(var(--color-text-rgb), 0.08);
    border-radius: 18px;
    padding: 22px 10px 14px;
    text-align: center;
    position: relative;
    transition: border-color 0.3s, box-shadow 0.3s;
    min-height: 90px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 5px;
  }

  .team-card-breaker.team-card-a {
    border-color: rgba(33, 150, 243, 0.65);
    box-shadow: 0 0 18px rgba(33, 150, 243, 0.18);
  }

  .team-card-breaker.team-card-b {
    border-color: rgba(229, 57, 53, 0.65);
    box-shadow: 0 0 18px rgba(229, 57, 53, 0.18);
  }

  .break-badge {
    position: absolute;
    top: -11px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 11px;
    font-weight: bold;
    background: var(--color-pool);
    padding: 2px 8px;
    border-radius: 10px;
    white-space: nowrap;
  }

  .team-card-breaker.team-card-a .break-badge {
    color: #64b5f6;
    border: 1px solid rgba(33, 150, 243, 0.4);
  }

  .team-card-breaker.team-card-b .break-badge {
    color: #ef9a9a;
    border: 1px solid rgba(229, 57, 53, 0.4);
  }

  .team-label {
    font-size: 20px;
    font-weight: bold;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  .team-label-a { color: #64b5f6; }
  .team-label-b { color: #ef9a9a; }

  .team-players {
    font-size: 11px;
    color: rgba(var(--color-text-rgb), 0.4);
    word-break: break-word;
    line-height: 1.4;
  }

  /* ── Rappels ── */
  .reminders {
    background: rgba(0, 0, 0, 0.25);
    border: 1px solid rgba(var(--color-text-rgb), 0.1);
    border-radius: 14px;
    padding: 12px 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 10px;
  }

  .reminder-item {
    font-size: 13px;
    color: rgba(var(--color-text-rgb), 0.65);
    text-align: left;
    line-height: 1.5;
  }

  .reminder-item strong {
    color: rgba(var(--color-text-rgb), 0.9);
  }

  .reminder-list {
    margin: 4px 0 0 4px;
    padding-left: 18px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .reminder-list li {
    font-size: 13px;
    color: rgba(var(--color-text-rgb), 0.55);
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
    transition: transform 0.1s, box-shadow 0.1s;
    -webkit-tap-highlight-color: transparent;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .btn-victory:active {
    transform: translateY(2px);
    box-shadow: none;
  }

  .btn-victory-a {
    background: linear-gradient(145deg, #2196f3, #1565c0);
    color: white;
    box-shadow: 0 4px 0 #0d47a1;
  }

  .btn-victory-b {
    background: linear-gradient(145deg, #e53935, #b71c1c);
    color: white;
    box-shadow: 0 4px 0 #7f0000;
  }
</style>
