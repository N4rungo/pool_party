<!--
  Page complète du jeu Blackball (8-ball anglais).

  Phases :
   - 'setup' → saisie des joueurs, équipes (Jaunes/Rouges), ordre de casse, mode match
   - 'game'  → écran de jeu : équipes, casseur actif, rappels, boutons victoire
   - 'win'   → overlay de victoire (partie simple)

  Même logique que Pool ; la différence est dans les règles, les couleurs et l'i18n.
  La logique pure vit dans $lib/games/blackball.js (re-export de pool.js).
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
  import { createInitialState, declareWinner, undo } from '$lib/games/blackball.js';

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
  let breakOrder = 'alternate';
  let matchMode = false;
  let matchTotalGames = 3;

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
      { label: tA.length === 1 ? tA[0].name : get(t)('blackball.teamA'), players: tA },
      { label: tB.length === 1 ? tB[0].name : get(t)('blackball.teamB'), players: tB },
    ];
  }

  // ── Lancement ──────────────────────────────────────────
  function handleLaunch() {
    const _t = get(t);
    const allNamed = picks.every(p => p.name.trim());

    if (!allNamed) {
      let countA = picks.filter((p, i) => p.name.trim() && playerTeams[i] === 0).length;
      let countB = picks.filter((p, i) => p.name.trim() && playerTeams[i] === 1).length;

      const newTeams = [...playerTeams];
      picks = picks.map((p, i) => {
        if (p.name.trim()) return p;
        if (countA <= countB) { newTeams[i] = 0; countA++; }
        else { newTeams[i] = 1; countB++; }
        return { ...p, name: _t('setup.defaultPlayer', { values: { n: i + 1 } }) };
      });
      playerTeams = newTeams;
    } else {
      const tA = picks.filter((_, i) => playerTeams[i] === 0);
      const tB = picks.filter((_, i) => playerTeams[i] === 1);
      if (tA.length === 0 || tB.length === 0) {
        showToast(_t('blackball.toast.onePlayerPerTeam'));
        return;
      }
    }

    gameTeams = buildTeams();
    gameBreakOrder = breakOrder;
    picksMap = Object.fromEntries(picks.map(p => [p.name.trim(), p.profileId]));

    if (matchMode) {
      startMatch('blackball', gameTeams.map(t => t.label), matchTotalGames);
    }

    startGame(randomizeOrder ? null : 0);
  }

  function startGame(initialBreakerIndex = null) {
    state = createInitialState(gameTeams, gameBreakOrder, initialBreakerIndex);
    winTeamIndex = null;
    phase = 'game';
    showToast(get(t)('blackball.toast.break', { values: { team: state.teams[state.breakerTeamIndex].label } }));
  }

  // ── Déclarer un vainqueur ──────────────────────────────
  function onDeclareWinner(teamIndex) {
    const { newState } = declareWinner(state, teamIndex);
    state = newState;
    winTeamIndex = teamIndex;

    const allPlayers = [...state.teams[0].players, ...state.teams[1].players];
    const winners = state.teams[teamIndex].players.map(p => p.name);

    recordHistory({
      gameId: 'blackball',
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
      cancelLabel:  _t('confirm.continueLabel'),
    });
    if (!ok) return;
    showMatchRecap = false;
    matchAbandoned = true;
    showMatchSummary = true;
  }

  function onMatchPlayAgain() {
    const savedTotal = $matchStore.totalGames;
    endMatch();
    startMatch('blackball', gameTeams.map(t => t.label), savedTotal);
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
    : $t('blackball.winSub');

  $: matchRecapGameNumber = $matchStore.currentGame - 1;
  $: matchRecapWinners = $matchStore.results?.[$matchStore.results.length - 1]?.winners ?? [];
</script>


<!-- ===== PHASE SETUP ===== -->
{#if phase === 'setup'}
  <div class="setup">
    <h1>
      <img src="{base}/assets/3_billes_blackball.png" alt="" class="icon-title" />
      Blackball
    </h1>
    <div class="setup-sub">{$t('setup.configuration')}</div>

    <div class="popup-box setup-box">

      <NumberSelector
        bind:value={playerCount}
        min={2}
        max={8}
        step={1}
        label={$t('setup.playerCount')} />

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
            {#if picks[i].name}
              <button
                class="team-toggle"
                class:team-a={playerTeams[i] === 0}
                class:team-b={playerTeams[i] === 1}
                on:click={() => toggleTeam(i)}
                title={$t('blackball.toggleTeam')}
              >
                {playerTeams[i] === 0 ? 'A' : 'B'}
              </button>
            {/if}
          </div>
        {/each}
      </div>

      <!-- Aperçu des équipes + bouton randomize -->
      <div class="teams-section-header">
        <div class="section-label" style="margin-bottom: 0">{$t('blackball.teams')}</div>
        <button class="btn-randomize" on:click={randomizeTeams}>{$t('blackball.randomize')}</button>
      </div>
      <div class="team-preview">
        <div class="team-preview-col">
          <span class="team-badge team-badge-a">A</span>
          <span class="team-preview-names">
            {teamAPreview.length ? teamAPreview.join(', ') : '—'}
          </span>
        </div>
        <div class="team-preview-sep"></div>
        <div class="team-preview-col">
          <span class="team-badge team-badge-b">B</span>
          <span class="team-preview-names">
            {teamBPreview.length ? teamBPreview.join(', ') : '—'}
          </span>
        </div>
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
      title="BLACK BALL"
      icon="{base}/assets/3_billes_blackball.png"
      gameId="blackball"
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
              <div class="break-badge">{$t('blackball.breakBadge')}</div>
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
            {@html $t('blackball.reminderTeam')}
            <ul class="reminder-list">
              <li>{$t('blackball.reminderTeamRule1')}</li>
              <li>{$t('blackball.reminderTeamRule2')}</li>
            </ul>
          </div>
        {/if}
        <div class="reminder-item">
          {@html $t('blackball.reminderFault')}
        </div>
        <div class="reminder-item">
          {@html $t('blackball.reminderBlack')}
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
    gameId="blackball"
    totalGames={$matchStore.totalGames}
    abandoned={matchAbandoned}
    onPlayAgain={onMatchPlayAgain}
    onNewGame={onMatchNewGame}
  />
{/if}


<!-- ===== OVERLAY RÈGLES ===== -->
<RulesViewer gameId="blackball" open={rulesOpen} on:close={() => (rulesOpen = false)} />


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

  /* ── Section équipes ── */
  .teams-section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .btn-randomize {
    background: rgba(255, 255, 255, 0.07);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 20px;
    color: rgba(255, 255, 255, 0.6);
    font-family: inherit;
    font-size: 12px;
    padding: 5px 12px;
    cursor: pointer;
    transition: background 0.12s, color 0.12s;
    -webkit-tap-highlight-color: transparent;
  }

  .btn-randomize:active {
    background: rgba(255, 255, 255, 0.12);
    color: white;
  }

  /* ── Aperçu équipes ── */
  .team-preview {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 12px;
    padding: 10px 14px;
    margin-bottom: 4px;
  }

  .team-preview-col {
    flex: 1;
    display: flex;
    align-items: flex-start;
    gap: 8px;
    min-width: 0;
  }

  .team-preview-sep {
    width: 1px;
    background: rgba(255, 255, 255, 0.1);
    align-self: stretch;
    flex-shrink: 0;
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

  .team-preview-names {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.65);
    text-align: left;
    word-break: break-word;
  }

  /* ── Équipes (section header) ── */
  .section-sep {
    height: 1px;
    background: rgba(255, 255, 255, 0.1);
    margin: 16px 0 12px;
  }

  .section-label {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.4);
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
    border: 2px solid rgba(255, 255, 255, 0.08);
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
    color: rgba(255, 255, 255, 0.4);
    word-break: break-word;
    line-height: 1.4;
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

  .reminder-item strong {
    color: rgba(255, 255, 255, 0.9);
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
    color: rgba(255, 255, 255, 0.55);
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
