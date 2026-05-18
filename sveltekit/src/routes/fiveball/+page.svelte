<!--
  Page complète du 5-Ball.

  Phases gérées par la variable `phase` :
   - 'setup1'   → nb joueurs + score commun
   - 'setup2'   → saisie des noms (page unique)
   - 'setup3'   → recap avec score modifiable par joueur
   - 'game'     → plateau de billes en T + scoreboard
   - 'win'      → overlay victoire

  Stress test des composants partagés de la phase 3.4 :
   - NumberSelector  : nb joueurs + score commun + score individuel
   - PlayerNameInputs: saisie des noms
   - RecapList       : recap avec slot NumberSelector
   - askConfirm      : retour accueil
   - WinOverlay      : fin de partie
   - BallButton      : billes du plateau
   - Toast           : feedbacks
   - GameHeader      : header du jeu
-->
<script>
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import GameLayout from '$lib/components/GameLayout.svelte';
  import RulesViewer from '$lib/components/RulesViewer.svelte';
  import WinOverlay from '$lib/components/WinOverlay.svelte';
  import BallButton from '$lib/components/BallButton.svelte';
  import NumberSelector from '$lib/components/NumberSelector.svelte';
  import PlayerNameInputs from '$lib/components/PlayerNameInputs.svelte';
  import RecapList from '$lib/components/RecapList.svelte';
  import { showToast } from '$lib/stores/toast.js';
  import { askConfirm } from '$lib/stores/confirm.js';
  import {
    FIVE_BALL_MIN_PLAYERS,
    FIVE_BALL_MAX_PLAYERS,
    FIVE_BALL_DEFAULT_PLAYERS,
    FIVE_BALL_DEFAULT_TARGET,
    FIVE_BALL_MIN_TARGET,
    FIVE_BALL_TARGET_STEP,
    FIVE_BALL_BALLS,
    FIVE_BALL_BOARD_LAYOUT,
    createInitialState,
    activeCueBall,
    selectedTotal,
    isBustRemaining,
    toggleBall,
    validateTurn,
    undo
  } from '$lib/games/fiveball.js';

  // ── Phase courante ────────────────────────────────────
  let phase = 'setup1';
  $: phase, typeof window !== 'undefined' && window.scrollTo({ top: 0, behavior: 'instant' });

  // ── Setup ─────────────────────────────────────────────
  let count = FIVE_BALL_DEFAULT_PLAYERS;
  let defaultTarget = FIVE_BALL_DEFAULT_TARGET;
  let setupPlayers = [];

  function gotoSetup2() {
    // Crée le tableau de joueurs avec les valeurs par défaut.
    // On préserve les noms si on revient en arrière.
    setupPlayers = Array.from({ length: count }, (_, i) => ({
      name:   setupPlayers[i]?.name ?? '',
      target: setupPlayers[i]?.target ?? defaultTarget,
    }));
    phase = 'setup2';
  }

  function gotoSetup3() {
    // Defaults pour les noms vides
    setupPlayers = setupPlayers.map((p, i) => ({
      ...p,
      name: p.name?.trim() || `Joueur ${i + 1}`,
    }));
    phase = 'setup3';
  }

  // Mise à jour explicite du target d'un joueur dans le récap.
  // On réassigne le tableau pour forcer la réactivité Svelte (mutation
  // d'une propriété profonde n'est pas détectée automatiquement).
  function updatePlayerTarget(i, newTarget) {
    setupPlayers = setupPlayers.map((p, idx) =>
      idx === i ? { ...p, target: newTarget } : p
    );
  }

  // ── État de partie ────────────────────────────────────
  let state = null;
  let winnerName = null;

  function startGame() {
    state = createInitialState(setupPlayers);
    winnerName = null;
    phase = 'game';
    showToast(`🎯 Engagement : ${state.players[0].name} doit toucher la rouge !`);
  }

  // ── Sélection / validation ────────────────────────────
  function onToggleBall(id) {
    state = toggleBall(state, id);
  }

  function onValidateTurn() {
    const { newState, outcome } = validateTurn(state);
    state = newState;

    if (outcome.kind === 'win') {
      winnerName = outcome.winner.name;
      phase = 'win';
    } else if (outcome.kind === 'scored') {
      showToast(`🎱 −${outcome.delta} pts`);
    } else if (outcome.kind === 'fault') {
      showToast(`⚠️ ${outcome.detail}`);
    }
  }

  // ── Annuler (en jeu) ──────────────────────────────────
  function onUndo() {
    state = undo(state);
    showToast('↩ Action annulée');
  }

  // ── Annuler depuis l'overlay de victoire ──────────────
  function onUndoFromWin() {
    state = undo(state);
    winnerName = null;
    phase = 'game';
    showToast('↩ Coup décisif annulé — on continue !');
  }

  // ── Rejouer / Nouveau jeu / Accueil ───────────────────
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

  // ── Overlay règles ────────────────────────────────────
  let rulesOpen = false;

  // ── Helpers réactifs ──────────────────────────────────
  $: cue = state ? activeCueBall(state) : null;
  $: cueLabel = cue ? FIVE_BALL_BALLS[cue].label : '';
  $: total = state ? selectedTotal(state) : 0;
  $: activePlayer = state ? state.players[state.currentIndex] : null;
  $: remaining = activePlayer ? activePlayer.score - total : 0;
  $: previewKind = computePreviewKind(state, total, remaining);

  function computePreviewKind(s, t, rem) {
    if (!s) return 'muted';
    const c = s.selected.length;
    if (c === 0) return 'muted-zero';
    if (c < 2)   return 'muted-one';
    if (s.isFirstTurn && !s.selected.includes('red')) return 'engagement';
    if (isBustRemaining(rem)) return 'bust';
    if (rem === 0) return 'win';
    return 'ok';
  }
</script>

<!-- ============== SETUP 1 : nb joueurs + score commun ============== -->
{#if phase === 'setup1'}
  <div class="setup">
    <h1>
      <img src="{base}/assets/5-ball.png" alt="" class="icon-title" />
      5-Ball
    </h1>
    <div class="setup-sub">Étape 1 / 3</div>

    <div class="popup-box setup-box">
      <NumberSelector
        bind:value={count}
        min={FIVE_BALL_MIN_PLAYERS}
        max={FIVE_BALL_MAX_PLAYERS}
        label="Nombre de joueurs" />

      <div class="sep"></div>

      <NumberSelector
        bind:value={defaultTarget}
        min={FIVE_BALL_MIN_TARGET}
        step={FIVE_BALL_TARGET_STEP}
        label="Score à atteindre" />
      <div class="setup-tip">Le but : descendre à 0 pile (par pas de 10).</div>

      <button class="btn-main btn-gold" on:click={gotoSetup2}>Suivant →</button>
      <button class="btn-main btn-gray" on:click={() => goto(base || '/')}>← Retour</button>
    </div>
  </div>
{/if}

<!-- ============== SETUP 2 : noms ============== -->
{#if phase === 'setup2'}
  <div class="setup">
    <h1>
      <img src="{base}/assets/5-ball.png" alt="" class="icon-title" />
      5-Ball
    </h1>
    <div class="setup-sub">Étape 2 / 3 — Noms des joueurs</div>

    <div class="popup-box setup-box">
      <PlayerNameInputs bind:players={setupPlayers} />

      <button class="btn-main btn-gold" on:click={gotoSetup3}>Suivant →</button>
      <button class="btn-main btn-gray" on:click={() => phase = 'setup1'}>← Retour</button>
    </div>
  </div>
{/if}

<!-- ============== SETUP 3 : recap avec score individuel ============== -->
{#if phase === 'setup3'}
  <div class="setup">
    <h1>
      <img src="{base}/assets/5-ball.png" alt="" class="icon-title" />
      5-Ball
    </h1>
    <div class="setup-sub">Étape 3 / 3 — Récapitulatif</div>

    <div class="popup-box setup-box">
      <div class="setup-tip" style="margin-bottom:8px;">
        Score modifiable par joueur (par pas de 10)
      </div>

      <RecapList players={setupPlayers} let:player let:i>
        <NumberSelector
          value={player.target}
          min={FIVE_BALL_MIN_TARGET}
          step={FIVE_BALL_TARGET_STEP}
          on:change={(e) => updatePlayerTarget(i, e.detail)} />
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
      title="5-BALL"
      icon="{base}/assets/5-ball.png"
      gameId="fiveball"
      canUndo={state.history.length > 0}
      on:home={confirmGoHome}
      on:undo={onUndo}
      on:rules={() => rulesOpen = true}>

      <!-- Scoreboard -->
      <div class="fb-scoreboard">
        {#each state.players as player, i (i)}
          <div class="fb-player-row" class:active={i === state.currentIndex}>
            <span class="fb-player-emoji">
              {['🟡','🔵','🔴','⚪','🟠','🟣'][i % 6]}
            </span>
            <span class="fb-player-name">{player.name}</span>
            <span class="fb-player-score">
              {player.score}<span class="fb-player-target"> / {player.target}</span>
            </span>
          </div>
        {/each}
      </div>

      <!-- Bandeau d'info -->
      <div class="fb-banner">
        <div class="fb-banner-line">
          À <strong>{activePlayer.name}</strong> de jouer
          <span class="fb-banner-cue">— Cue : {cueLabel}</span>
        </div>
        {#if state.isFirstTurn}
          <div class="fb-banner-engagement">
            🎯 Engagement — la rouge doit être touchée en premier !
          </div>
        {/if}
      </div>

      <!-- Plateau en T -->
      <div class="fb-board">
        {#each FIVE_BALL_BOARD_LAYOUT as ballId}
          {@const ball = FIVE_BALL_BALLS[ballId]}
          {@const isCue = ballId === cue}
          <div class="fb-cell fb-cell-{ballId}">
            <BallButton
              src={`${base}/assets/${ball.asset}`}
              alt={`${ball.label} (${ball.value})`}
              size={62}
              disabled={isCue}
              selected={state.selected.includes(ballId)}
              on:click={() => onToggleBall(ballId)} />
          </div>
        {/each}
      </div>

      <svelte:fragment slot="footer">
        <!-- Preview du score + bouton Valider, fixés en bas -->
        <div class="fb-action-bar">
          {#if previewKind === 'muted-zero'}
            <span class="fb-preview-muted">Aucune bille sélectionnée — tour passé sans points.</span>
          {:else if previewKind === 'muted-one'}
            <span class="fb-preview-muted">1 seule bille — il en faut au moins 2 pour scorer.</span>
          {:else if previewKind === 'engagement'}
            <span class="fb-preview-bust">Engagement raté : la rouge doit être touchée.</span>
          {:else if previewKind === 'bust'}
            <span class="fb-preview-bust">−{total} → resterait {remaining} : tour annulé.</span>
          {:else if previewKind === 'win'}
            <span class="fb-preview-win">−{total} → 0 pile, partie gagnée ! 🏆</span>
          {:else if previewKind === 'ok'}
            <span class="fb-preview-ok">−{total} → reste {remaining} pts</span>
          {/if}
        </div>

        <button class="btn-main btn-gold" on:click={onValidateTurn}>Valider le tour →</button>
      </svelte:fragment>
    </GameLayout>
  </div>
{/if}

<!-- ============== WIN ============== -->
<WinOverlay
  open={phase === 'win'}
  trophy="🏆"
  name={winnerName}
  sub="Pile à 0 ! Bravo !"
  canUndo={state?.history?.length > 0}
  on:undo={onUndoFromWin}
  on:replay={replay}
  on:newGame={newGame} />

<!-- ============== RULES ============== -->
<RulesViewer gameId="fiveball" open={rulesOpen} on:close={() => rulesOpen = false} />


<style>
  /* ===== Layout général ===== */
  .setup,
  .game {
    width: 92%;
    max-width: 480px;
    padding-top: 10px;
  }

  /* ===== Setup ===== */
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
    color: rgba(255, 255, 255, 0.5);
    margin: 6px 0 4px;
    font-style: italic;
  }

  .sep {
    height: 1px;
    background: rgba(255, 255, 255, 0.1);
    margin: 16px 0;
  }

  /* ===== Scoreboard ===== */
  .fb-scoreboard {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 12px;
  }

  .fb-player-row {
    display: flex;
    align-items: center;
    gap: 10px;
    background: rgba(0, 0, 0, 0.25);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 12px;
    padding: 6px 10px;
    transition: border-color .2s, box-shadow .2s;
  }

  .fb-player-row.active {
    border-color: var(--color-gold);
    box-shadow: 0 0 16px rgba(var(--color-gold-rgb), 0.2);
  }

  .fb-player-emoji {
    font-size: 18px;
    width: 26px;
    text-align: center;
    flex-shrink: 0;
  }

  .fb-player-name {
    flex: 1;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.85);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .fb-player-row.active .fb-player-name {
    color: var(--color-gold);
    font-weight: bold;
  }

  .fb-player-score {
    font-size: 20px;
    font-weight: bold;
    color: white;
    line-height: 1;
  }

  .fb-player-row.active .fb-player-score {
    color: var(--color-gold);
  }

  .fb-player-target {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.4);
    font-weight: normal;
  }

  /* ===== Bandeau info ===== */
  .fb-banner {
    background: rgba(0, 0, 0, 0.25);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 14px;
    padding: 8px 14px;
    margin-bottom: 12px;
    text-align: center;
  }

  .fb-banner-line {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.75);
  }

  .fb-banner-cue {
    color: rgba(255, 255, 255, 0.5);
  }

  .fb-banner-engagement {
    margin-top: 6px;
    padding-top: 6px;
    border-top: 1px solid rgba(var(--color-gold-rgb), 0.3);
    font-size: 12px;
    color: var(--color-gold);
  }

  /* ===== Plateau en T ===== */
  .fb-board {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(3, auto);
    gap: 2px;
    justify-items: center;
    align-items: center;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 18px;
    padding: 0;
    margin: 0 auto 12px;
    border: 1px solid rgba(255, 255, 255, 0.07);
    max-width: 280px;
  }

  /* Positionnement de chaque cellule dans le T */
  .fb-cell-red    { grid-column: 2; grid-row: 1; }
  .fb-cell-blue   { grid-column: 2; grid-row: 2; }
  .fb-cell-white  { grid-column: 1; grid-row: 3; }
  .fb-cell-green  { grid-column: 2; grid-row: 3; }
  .fb-cell-yellow { grid-column: 3; grid-row: 3; }

  /* ===== Action bar (preview) ===== */
  .fb-action-bar {
    padding: 0 4px 6px;
    text-align: center;
    min-height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .fb-preview-muted { color: rgba(255, 255, 255, 0.45); font-size: 13px; }
  .fb-preview-bust  { color: #ff7a7a; font-size: 13px; font-weight: bold; }
  .fb-preview-ok    { color: var(--color-gold); font-size: 14px; font-weight: bold; }
  .fb-preview-win   { color: var(--color-gold-light); font-size: 14px; font-weight: bold; }
</style>
