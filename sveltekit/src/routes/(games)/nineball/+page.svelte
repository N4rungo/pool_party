<!--
  Page complète du jeu 9-Ball.

  Phases :
   - 'setup' → joueurs, mode équipe optionnel (3+ joueurs), ordre de casse, mode match
   - 'game'  → ordre de jeu (mode individuel) ou cartes équipes (mode équipe)
   - 'win'   → overlay de victoire

  2 joueurs  : toujours individuel, 2 boutons dorés
  3+ joueurs : toggle mode équipe (défaut OFF)
    OFF → chacun pour soi, 1 bouton → overlay de sélection
    ON  → équipes A/B, 2 boutons colorés + rappel de passage de main

  Logique individuelle : $lib/games/nineball.js  (state.players / state.breakerIndex)
  Logique équipes      : $lib/games/pool.js       (state.teams / state.breakerTeamIndex)
-->
<script>
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import GameLayout from '$lib/components/GameLayout.svelte';
  import Overlay from '$lib/components/Overlay.svelte';
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
  const PLAYER_EMOJIS = ['🟡', '🔵', '🔴', '⚪', '🟠', '🟣'];

  import {
    createInitialState as createIndividualState,
    declareWinner as declareIndividualWinner,
    undo as undoIndividual,
  } from '$lib/games/nineball.js';
  import {
    createInitialState as createTeamState,
    declareWinner as declareTeamWinner,
    undo as undoTeam,
  } from '$lib/games/pool.js';

  // ── Phase courante ─────────────────────────────────────
  let phase = 'setup';
  $: phase, typeof window !== 'undefined' && window.scrollTo({ top: 0, behavior: 'instant' });

  // ── Setup ──────────────────────────────────────────────
  let playerCount = 2;
  let picks = [
    { name: '', profileId: null },
    { name: '', profileId: null },
  ];
  let playerTeams = [0, 1];
  let teamMode = false;
  let randomOrder = true;
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
    // Désactiver le mode équipe si on repasse à 2 joueurs
    if (playerCount === 2) teamMode = false;
    _prevCount = playerCount;
  }

  $: selectedIds   = picks.map(p => p.profileId).filter(Boolean);
  $: selectedNames = picks.map(p => p.name.trim().toLowerCase()).filter(Boolean);

  // ── Gestion des équipes ────────────────────────────────
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

  function buildTeams() {
    const _t = get(t);
    const tA = picks
      .filter((_, i) => playerTeams[i] === 0 && picks[i].name.trim())
      .map(p => ({ name: p.name.trim(), profileId: p.profileId }));
    const tB = picks
      .filter((_, i) => playerTeams[i] === 1 && picks[i].name.trim())
      .map(p => ({ name: p.name.trim(), profileId: p.profileId }));
    return [
      { label: tA.length === 1 ? tA[0].name : _t('pool.teamA'), players: tA },
      { label: tB.length === 1 ? tB[0].name : _t('pool.teamB'), players: tB },
    ];
  }

  // ── État de partie ─────────────────────────────────────
  let state = null;
  let gamePlayers = null;  // mode individuel
  let gameTeams   = null;  // mode équipe
  let gameBreakOrder = null;
  let picksMap = {};
  // Victoire individuelle
  let winnerIndex = null;
  let winnerPickOpen = false;
  // Victoire équipe
  let winTeamIndex = null;

  // ── Match ──────────────────────────────────────────────
  let showMatchRecap = false;
  let showMatchSummary = false;
  let matchAbandoned = false;

  // ── Lancement ──────────────────────────────────────────
  function handleLaunch() {
    const _t = get(t);
    gameBreakOrder = breakOrder;

    if (teamMode) {
      // ── Mode équipe ──
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
          showToast(_t('pool.toast.onePlayerPerTeam'));
          return;
        }
      }
      gameTeams = buildTeams();
      picksMap  = Object.fromEntries(picks.map(p => [p.name.trim(), p.profileId]));
      if (matchMode) startMatch('nineball', gameTeams.map(t => t.label), matchTotalGames);
      startTeamGame(randomOrder ? null : 0);

    } else {
      // ── Mode individuel ──
      let finalPicks = picks.map((p, i) =>
        p.name.trim() ? p : { ...p, name: _t('setup.defaultPlayer', { values: { n: i + 1 } }) }
      );
      if (randomOrder) {
        for (let i = finalPicks.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [finalPicks[i], finalPicks[j]] = [finalPicks[j], finalPicks[i]];
        }
      }
      gamePlayers = finalPicks;
      picksMap    = Object.fromEntries(finalPicks.map(p => [p.name, p.profileId]));
      if (matchMode) startMatch('nineball', finalPicks.map(p => p.name), matchTotalGames);
      startIndividualGame();
    }
  }

  function startIndividualGame(initialBreakerIndex = null) {
    state          = createIndividualState(gamePlayers, gameBreakOrder, initialBreakerIndex);
    winnerIndex    = null;
    winnerPickOpen = false;
    phase          = 'game';
    showToast(get(t)('nineball.toast.break', { values: { name: state.players[state.breakerIndex].name } }));
  }

  function startTeamGame(initialBreakerIndex = null) {
    state        = createTeamState(gameTeams, gameBreakOrder, initialBreakerIndex);
    winTeamIndex = null;
    phase        = 'game';
    showToast(get(t)('pool.toast.break', { values: { team: state.teams[state.breakerTeamIndex].label } }));
  }

  // ── Ordre de jeu affiché (mode individuel) ─────────────
  $: playOrder = !teamMode && state
    ? Array.from({ length: state.players.length }, (_, i) => {
        const pi = (state.breakerIndex + i) % state.players.length;
        return { ...state.players[pi], isBreaker: i === 0, playerIndex: pi };
      })
    : [];

  // ── Déclarer un vainqueur ──────────────────────────────
  function onDeclareWinner(idx) {
    if (teamMode) {
      const { newState, outcome } = declareTeamWinner(state, idx);
      state        = newState;
      winTeamIndex = idx;

      const allPlayers = [...state.teams[0].players, ...state.teams[1].players];
      recordHistory({
        gameId: 'nineball',
        players: allPlayers.map(p => ({ name: p.name, profileId: picksMap[p.name] ?? null })),
        winners: state.teams[idx].players.map(p => p.name),
        scores:  Object.fromEntries(allPlayers.map(p => [p.name, null])),
      });

      if ($matchStore.isActive) {
        recordResult([state.teams[idx].label], state.teams.map(t => ({ name: t.label, score: null })));
        showMatchRecap = true;
      } else {
        phase = 'win';
      }
    } else {
      const { newState, outcome } = declareIndividualWinner(state, idx);
      state          = newState;
      winnerIndex    = idx;
      winnerPickOpen = false;

      recordHistory({
        gameId: 'nineball',
        players: gamePlayers.map(p => ({ name: p.name, profileId: picksMap[p.name] ?? null })),
        winners: [outcome.winner.name],
        scores:  Object.fromEntries(gamePlayers.map(p => [p.name, null])),
      });

      if ($matchStore.isActive) {
        recordResult([outcome.winner.name], gamePlayers.map(p => ({ name: p.name, score: null })));
        showMatchRecap = true;
      } else {
        phase = 'win';
      }
    }
  }

  // ── Undo depuis l'overlay de victoire ─────────────────
  function onUndoFromWin() {
    if (teamMode) {
      state        = undoTeam(state);
      winTeamIndex = null;
    } else {
      state       = undoIndividual(state);
      winnerIndex = null;
    }
    phase = 'game';
    showToast(get(t)('toast.winCancelled'));
  }

  // ── Rejouer / nouveau jeu ──────────────────────────────
  function replay() {
    if (teamMode) startTeamGame(state.breakerTeamIndex);
    else startIndividualGame(state.breakerIndex);
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
    if (teamMode) { winTeamIndex = null; startTeamGame(state.breakerTeamIndex); }
    else          { winnerIndex = null;  startIndividualGame(state.breakerIndex); }
  }

  function onMatchViewFinal() {
    showMatchRecap = false;
    showMatchSummary = true;
  }

  function onMatchUndo() {
    undoResult();
    if (teamMode) { state = undoTeam(state);       winTeamIndex = null; }
    else          { state = undoIndividual(state);  winnerIndex  = null; }
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
    matchAbandoned   = false;
    showMatchSummary = false;
    if (teamMode) {
      startMatch('nineball', gameTeams.map(t => t.label), savedTotal);
      winTeamIndex = null;
      startTeamGame();
    } else {
      startMatch('nineball', gamePlayers.map(p => p.name), savedTotal);
      winnerIndex = null;
      startIndividualGame();
    }
  }

  function onMatchNewGame() {
    endMatch();
    matchAbandoned   = false;
    showMatchSummary = false;
    goto(base || '/');
  }

  // ── Règles ─────────────────────────────────────────────
  let rulesOpen = false;

  // ── Dérivés victoire ───────────────────────────────────
  $: winnerPlayer = !teamMode && winnerIndex !== null && state ? state.players[winnerIndex] : null;
  $: winnerTeam   =  teamMode && winTeamIndex !== null && state ? state.teams[winTeamIndex] : null;
  $: winName = teamMode ? (winnerTeam?.label ?? '') : (winnerPlayer?.name ?? '');
  $: winSub  = teamMode
    ? (winnerTeam && winnerTeam.players.length > 1
        ? winnerTeam.players.map(p => p.name).join(' & ')
        : $t('pool.winSub'))
    : $t('nineball.winSub');
  $: winOpen = phase === 'win' && (teamMode ? winTeamIndex !== null : winnerIndex !== null);
  $: canUndoWin = state?.history?.length > 0;

  $: matchRecapGameNumber = $matchStore.currentGame - 1;
  $: matchRecapWinners    = $matchStore.results?.[$matchStore.results.length - 1]?.winners ?? [];
</script>


<!-- ===== PHASE SETUP ===== -->
{#if phase === 'setup'}
  <div class="setup">
    <h1>
      <img src="{base}/assets/bille_9.png" alt="" class="icon-title" />
      9 Ball
    </h1>
    <div class="setup-sub">{$t('setup.configuration')}</div>

    <div class="popup-box setup-box">

      <div class="number-row">
        <NumberSelector
          bind:value={playerCount}
          min={2}
          max={6}
          step={1}
          label={$t('setup.playerCount')} />
        {#if teamMode && playerCount > 2}
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
            {#if teamMode && picks[i].name}
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

      <!-- Mode équipe (3+ joueurs seulement) -->
      {#if playerCount > 2}
        <div class="team-mode-row">
          <span class="team-mode-label">{$t('setup.teamMode')}</span>
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <div
            class="toggle-track"
            class:on={teamMode}
            on:click={() => teamMode = !teamMode}
            role="switch"
            aria-checked={teamMode}
            tabindex="0"
            on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && (teamMode = !teamMode)}
          >
            <div class="toggle-thumb"></div>
          </div>
        </div>

      {/if}

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
      title="9 BALL"
      icon="{base}/assets/bille_9.png"
      gameId="nineball"
      canUndo={false}
      on:home={confirmGoHome}
      on:rules={() => (rulesOpen = true)}
    >

      {#if teamMode}
        <!-- ── Mode équipe : cartes ── -->
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
              <div class="team-label" class:team-label-a={i === 0} class:team-label-b={i === 1}>
                {team.label}
              </div>
              {#if team.players.length > 1}
                <div class="team-players">{team.players.map(p => p.name).join(', ')}</div>
              {/if}
            </div>
          {/each}
        </div>

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
          <div class="reminder-item">{@html $t('nineball.reminderLowest')}</div>
          <div class="reminder-item">{@html $t('nineball.reminderNine')}</div>
          <div class="reminder-item">{@html $t('nineball.reminderFault')}</div>
        </div>

      {:else}
        <!-- ── Mode individuel ── -->
        {#if state.players.length === 2}
          <!-- 2 joueurs : cartes côte à côte (style Pool) -->
          <div class="teams-container">
            {#each state.players as player, i}
              <div class="team-card"
                class:team-card-a={i === 0}
                class:team-card-b={i === 1}
                class:team-card-breaker={state.breakerIndex === i}>
                {#if state.breakerIndex === i}
                  <div class="break-badge">{$t('nineball.breakBadge')}</div>
                {/if}
                <div class="team-label" class:team-label-a={i === 0} class:team-label-b={i === 1}>
                  {player.name}
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <!-- 3+ joueurs : ordre de jeu (liste) -->
          <div class="play-order">
            {#each playOrder as player, i}
              <div class="order-row" class:is-breaker={i === 0}>
                <span class="player-emoji">{PLAYER_EMOJIS[player.playerIndex % PLAYER_EMOJIS.length]}</span>
                <span class="order-name">{player.name}</span>
                {#if i === 0}
                  <span class="break-badge-inline">{$t('nineball.breakBadge')}</span>
                {/if}
              </div>
            {/each}
          </div>
        {/if}

        <div class="reminders">
          <div class="reminder-item">{@html $t('nineball.reminderLowest')}</div>
          <div class="reminder-item">{@html $t('nineball.reminderNine')}</div>
          <div class="reminder-item">{@html $t('nineball.reminderFault')}</div>
        </div>
      {/if}

      <!-- Boutons victoire dans le footer -->
      <svelte:fragment slot="footer">
        {#if teamMode}
          <!-- 2 boutons colorés équipe -->
          <div class="victory-buttons">
            <button class="btn-victory btn-victory-a" on:click={() => onDeclareWinner(0)}>
              🏆 {state.teams[0].label}
            </button>
            <button class="btn-victory btn-victory-b" on:click={() => onDeclareWinner(1)}>
              🏆 {state.teams[1].label}
            </button>
          </div>
        {:else if state.players.length === 2}
          <!-- 2 joueurs : boutons colorés (style Pool) -->
          <div class="victory-buttons">
            <button class="btn-victory btn-victory-a" on:click={() => onDeclareWinner(0)}>
              🏆 {state.players[0].name}
            </button>
            <button class="btn-victory btn-victory-b" on:click={() => onDeclareWinner(1)}>
              🏆 {state.players[1].name}
            </button>
          </div>
        {:else}
          <!-- 3+ joueurs individuels : bouton overlay -->
          <button class="btn-victory btn-victory-gold btn-declare" on:click={() => winnerPickOpen = true}>
            {$t('nineball.declareWinner')}
          </button>
        {/if}
      </svelte:fragment>
    </GameLayout>
  </div>
{/if}


<!-- ===== OVERLAY VICTOIRE ===== -->
<WinOverlay
  open={winOpen}
  trophy="🏆"
  name={winName}
  sub={winSub}
  canUndo={canUndoWin}
  on:undo={onUndoFromWin}
  on:replay={replay}
  on:newGame={newGame}
/>


<!-- ===== OVERLAY SÉLECTION VAINQUEUR (mode individuel 3+) ===== -->
<Overlay open={winnerPickOpen && !teamMode} on:close={() => winnerPickOpen = false}>
  {#if state}
    <h2 style="text-align:center;margin-bottom:14px;">{$t('nineball.chooseWinner')}</h2>
    <div class="pick-list">
      {#each state.players as player, i}
        <button class="pick-btn" on:click={() => onDeclareWinner(i)}>
          <span class="pick-emoji">{PLAYER_EMOJIS[i % PLAYER_EMOJIS.length]}</span>
          <span class="pick-name">{player.name}</span>
        </button>
      {/each}
    </div>
  {/if}
</Overlay>


<!-- ===== OVERLAY RÉCAP MATCH ===== -->
{#if showMatchRecap}
  <MatchRecapOverlay
    gameNumber={matchRecapGameNumber}
    totalGames={$matchStore.totalGames}
    winners={matchRecapWinners}
    matchScores={$matchStore.matchScores}
    isLastGame={matchRecapGameNumber === $matchStore.totalGames}
    canUndo={canUndoWin}
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
    gameId="nineball"
    totalGames={$matchStore.totalGames}
    abandoned={matchAbandoned}
    onPlayAgain={onMatchPlayAgain}
    onNewGame={onMatchNewGame}
  />
{/if}


<!-- ===== OVERLAY RÈGLES ===== -->
<RulesViewer gameId="nineball" open={rulesOpen} on:close={() => (rulesOpen = false)} />


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
    background: linear-gradient(160deg, var(--color-pool-mid), var(--color-pool-dark));
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

  /* Toggle équipe par joueur */
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

  /* Toggle mode équipe */
  .team-mode-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 6px 0 10px;
  }

  .team-mode-label {
    font-size: 14px;
    font-weight: bold;
    color: rgba(255, 255, 255, 0.85);
  }

  .toggle-track {
    width: 46px;
    height: 26px;
    border-radius: 13px;
    background: rgba(255, 255, 255, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.25);
    position: relative;
    flex-shrink: 0;
    cursor: pointer;
    transition: background 0.2s, border-color 0.2s;
  }

  .toggle-track.on {
    background: linear-gradient(145deg, var(--color-gold-light), var(--color-gold));
    border-color: var(--color-gold);
  }

  .toggle-thumb {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: white;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
    transition: transform 0.2s;
  }

  .toggle-track.on .toggle-thumb {
    transform: translateX(20px);
  }

  /* Aperçu équipes */
  .section-label {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.4);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 8px;
    text-align: left;
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
    border: 2px solid rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.6);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s, border-color 0.15s;
    -webkit-tap-highlight-color: transparent;
  }

  .btn-shuffle:active {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.35);
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

  /* ── Écran de jeu : mode équipe ── */
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

  .team-card-breaker.team-card-a .break-badge { color: #64b5f6; border: 1px solid rgba(33, 150, 243, 0.4); }
  .team-card-breaker.team-card-b .break-badge { color: #ef9a9a; border: 1px solid rgba(229, 57, 53, 0.4); }

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

  /* ── Écran de jeu : mode individuel ── */
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

  .player-emoji {
    font-size: 16px;
    width: 22px;
    text-align: center;
    flex-shrink: 0;
  }

  .order-name { flex: 1; }

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

  .reminder-item :global(strong) { color: rgba(255, 255, 255, 0.9); }

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

  .btn-victory-gold {
    background: linear-gradient(145deg, var(--color-gold-light), var(--color-gold));
    color: var(--color-pool);
    box-shadow: 0 4px 0 var(--color-gold-dark);
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

  .btn-declare {
    width: 100%;
    font-size: 15px;
  }

  /* ── Picker vainqueur (liste simple) ── */
  .pick-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 12px;
  }

  .pick-btn {
    width: 100%;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: white;
    padding: 12px 14px;
    border-radius: 12px;
    font-family: inherit;
    font-size: 15px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 10px;
    transition: background .15s, border-color .15s;
    -webkit-tap-highlight-color: transparent;
  }

  .pick-btn:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(var(--color-gold-rgb), 0.5);
  }

  .pick-emoji {
    font-size: 18px;
    flex-shrink: 0;
  }

  .pick-name {
    flex: 1;
    text-align: left;
  }
</style>
