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
  import { showToast } from '$lib/stores/toast.js';
  import { askConfirm } from '$lib/stores/confirm.js';
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
      { label: tA.length === 1 ? tA[0].name : 'Équipe A', players: tA },
      { label: tB.length === 1 ? tB[0].name : 'Équipe B', players: tB },
    ];
  }

  // ── Lancement ──────────────────────────────────────────
  function handleLaunch() {
    const tA = picks.filter((_, i) => playerTeams[i] === 0 && picks[i].name.trim());
    const tB = picks.filter((_, i) => playerTeams[i] === 1 && picks[i].name.trim());

    if (picks.some(p => !p.name.trim())) {
      showToast('⚠️ Tous les joueurs doivent avoir un nom');
      return;
    }
    if (tA.length === 0 || tB.length === 0) {
      showToast('⚠️ Il faut au moins un joueur par équipe');
      return;
    }

    gameTeams = buildTeams();
    gameBreakOrder = breakOrder;
    picksMap = Object.fromEntries(picks.map(p => [p.name.trim(), p.profileId]));

    if (matchMode) {
      startMatch('pool', gameTeams.map(t => t.label), matchTotalGames);
    }

    startGame();
  }

  function startGame(initialBreakerIndex = null) {
    state = createInitialState(gameTeams, gameBreakOrder, initialBreakerIndex);
    winTeamIndex = null;
    phase = 'game';
    showToast(`🎱 ${state.teams[state.breakerTeamIndex].label} casse !`);
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
    showToast('↩ Victoire annulée — on continue !');
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
    const ok = await askConfirm("Abandonner la partie et revenir à l'accueil ?", {
      confirmLabel: 'Abandonner',
      cancelLabel: 'Continuer',
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
    showToast('↩ Victoire annulée — on continue !');
  }

  async function onMatchAbandon() {
    const ok = await askConfirm('Abandonner le match en cours ?', {
      confirmLabel: 'Abandonner',
      cancelLabel: 'Continuer',
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
    : 'Félicitations !';

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
    <div class="setup-sub">8-Ball — Rayures ou Pleines</div>

    <div class="popup-box setup-box">

      <NumberSelector
        bind:value={playerCount}
        min={2}
        max={8}
        step={1}
        label="Nombre de joueurs" />

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
            <button
              class="team-toggle"
              class:team-a={playerTeams[i] === 0}
              class:team-b={playerTeams[i] === 1}
              on:click={() => toggleTeam(i)}
              title="Basculer d'équipe"
            >
              {playerTeams[i] === 0 ? 'A' : 'B'}
            </button>
          </div>
        {/each}
      </div>

      <!-- Aperçu des équipes -->
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

      <!-- Ordre de casse -->
      <div class="section-sep"></div>
      <div class="section-label">Ordre de casse</div>
      <div class="break-options">
        <button
          class="break-option"
          class:active={breakOrder === 'alternate'}
          on:click={() => (breakOrder = 'alternate')}
        >🔄 Casse alternée</button>
        <button
          class="break-option"
          class:active={breakOrder === 'winner'}
          on:click={() => (breakOrder = 'winner')}
        >🏆 Le vainqueur casse</button>
      </div>

      <MatchSetup bind:matchMode bind:totalGames={matchTotalGames} />

      <button class="btn-main btn-gold" on:click={handleLaunch}>
        {matchMode ? '🏆 Lancer le match !' : '🎱 Lancer la partie !'}
      </button>
      <button class="btn-main btn-gray" on:click={() => goto(base || '/')}>← Retour</button>
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
              <div class="break-badge">🎱 Casse</div>
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
        <div class="reminder-item">
          👥 Le même joueur reste à la table tant qu'il empoche
        </div>
        <div class="reminder-item">
          ⚫ Bille noire : annoncer le trou avant de jouer
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
    align-items: stretch;
    gap: 8px;
  }

  .picker-wrap {
    flex: 1;
    min-width: 0;
  }

  .team-toggle {
    width: 44px;
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

  /* ── Ordre de casse ── */
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

  .break-options {
    display: flex;
    gap: 8px;
    margin-bottom: 4px;
  }

  .break-option {
    flex: 1;
    padding: 10px 8px;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    background: rgba(0, 0, 0, 0.25);
    color: rgba(255, 255, 255, 0.55);
    font-family: inherit;
    font-size: 12px;
    cursor: pointer;
    transition: background 0.12s, border-color 0.12s, color 0.12s;
    -webkit-tap-highlight-color: transparent;
  }

  .break-option.active {
    background: rgba(var(--color-gold-rgb), 0.15);
    border-color: rgba(var(--color-gold-rgb), 0.5);
    color: var(--color-gold);
    font-weight: bold;
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
    background: rgba(0, 0, 0, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 12px;
    padding: 10px 14px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 10px;
  }

  .reminder-item {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.4);
    text-align: left;
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
