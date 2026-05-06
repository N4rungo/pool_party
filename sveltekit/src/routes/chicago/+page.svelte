<!--
  Page complète du jeu Chicago : 3 phases gérées par une variable `phase`.

  - 'setup' → écran de saisie des 2 noms
  - 'game'  → plateau avec triangle de billes + score
  - 'win'   → overlay de victoire (ou égalité), avec bouton Annuler
              pour revenir en jeu si le coup décisif était une erreur.

  Toute la logique métier vit dans $lib/games/chicago.js (testable, pure).
  Ce composant n'est que de l'orchestration UI + état réactif local.
-->
<script>
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import GameHeader from '$lib/components/GameHeader.svelte';
  import RulesViewer from '$lib/components/RulesViewer.svelte';
  import WinOverlay from '$lib/components/WinOverlay.svelte';
  import BallButton from '$lib/components/BallButton.svelte';
  import { showToast } from '$lib/stores/toast.js';
  import { askConfirm } from '$lib/stores/confirm.js';
  import {
    CHICAGO_TARGET_SCORE,
    CHICAGO_TRIANGLE,
    createInitialState,
    pocketBall,
    endTurn,
    undo
  } from '$lib/games/chicago.js';

  // ── Phase courante ────────────────────────────────────
  let phase = 'setup';   // 'setup' | 'game' | 'win'

  // ── État du setup ─────────────────────────────────────
  let name1 = '';
  let name2 = '';

  // ── État de la partie (créé par startGame) ────────────
  let state = null;
  let winOutcome = null; // { kind: 'win', winner } | { kind: 'draw', score }

  // ── Démarrage (random sur qui commence) ───────────────
  function startGame() {
    state = createInitialState(name1.trim(), name2.trim());
    phase = 'game';
    showToast(`🎲 ${state.players[state.currentIndex].name} commence !`);
  }

  // ── Empocher une bille ────────────────────────────────
  function onPocketBall(n) {
    const playerName = state.players[state.currentIndex].name;
    const { newState, outcome } = pocketBall(state, n);
    state = newState;

    if (outcome.kind === 'win' || outcome.kind === 'draw') {
      winOutcome = outcome;
      phase = 'win';
    } else if (outcome.kind === 'continue') {
      showToast(`🎱 +${n} pts pour ${playerName}`);
    }
  }

  // ── Passer la main ────────────────────────────────────
  function onEndTurn() {
    state = endTurn(state);
    showToast(`👤 Tour de ${state.players[state.currentIndex].name}`);
  }

  // ── Annuler (en jeu) ──────────────────────────────────
  function onUndo() {
    state = undo(state);
    showToast('↩ Action annulée');
  }

  // ── Annuler depuis l'overlay de victoire ──────────────
  // Cas : on a cliqué sur la bille du coup décisif par erreur.
  // On annule la dernière action et on retourne en jeu.
  function onUndoFromWin() {
    state = undo(state);
    winOutcome = null;
    phase = 'game';
    showToast('↩ Coup décisif annulé — on continue !');
  }

  // ── Rejouer (mêmes joueurs, scores reset, nouveau tirage) ──
  function replay() {
    state = createInitialState(state.players[0].name, state.players[1].name);
    winOutcome = null;
    phase = 'game';
    showToast(`🎲 ${state.players[state.currentIndex].name} commence !`);
  }

  // ── Nouveau jeu (retour launcher) ─────────────────────
  function newGame() {
    goto(base || '/');
  }

  // ── Confirmation retour accueil pendant la partie ─────
  async function confirmGoHome() {
    const ok = await askConfirm("Abandonner la partie et revenir à l'accueil ?", {
      confirmLabel: 'Abandonner',
      cancelLabel:  'Continuer',
      iconImage:    '/assets/home.png'
    });
    if (ok) goto(base || '/');
  }

  // ── Overlay règles ────────────────────────────────────
  let rulesOpen = false;

  // Helper réactif : pourcentage de progression d'un joueur
  $: progressPct = (i) => {
    if (!state) return 0;
    return Math.min(100, Math.round(state.players[i].score / CHICAGO_TARGET_SCORE * 100));
  };

  // Pré-calcul des props du WinOverlay (lisibilité)
  $: winTrophy = winOutcome?.kind === 'draw' ? '🤝' : '🏆';
  $: winName   = winOutcome?.kind === 'draw' ? 'Égalité !' : winOutcome?.winner?.name ?? '';
  $: winSub    = winOutcome?.kind === 'draw'
                   ? `Les deux joueurs finissent à ${winOutcome.score} points`
                   : 'Félicitations !';
</script>

<!-- ===== PHASE SETUP ===== -->
{#if phase === 'setup'}
  <div class="setup">
    <h1>
      <img src="/assets/3_billes_americain.png" alt="" class="icon-title" />
      Chicago
    </h1>
    <div class="setup-sub">Premier à 61 points</div>

    <div class="popup-box setup-box">
      <div class="name-input-wrap">
        <span class="player-emoji">🟡</span>
        <input
          type="text"
          maxlength="16"
          placeholder="Joueur 1..."
          bind:value={name1}
          on:keydown={(e) => e.key === 'Enter' && startGame()} />
      </div>
      <div class="name-input-wrap">
        <span class="player-emoji">🔵</span>
        <input
          type="text"
          maxlength="16"
          placeholder="Joueur 2..."
          bind:value={name2}
          on:keydown={(e) => e.key === 'Enter' && startGame()} />
      </div>

      <div class="setup-tip">🎲 Le joueur qui commence sera tiré au sort.</div>

      <button class="btn-main btn-gold" on:click={startGame}>🎱 Lancer la partie !</button>
      <button class="btn-main btn-gray" on:click={() => goto(base || '/')}>← Retour</button>
    </div>
  </div>
{/if}

<!-- ===== PHASE GAME ===== -->
{#if phase === 'game' && state}
  <div class="game">
    <GameHeader
      title="CHICAGO"
      icon="/assets/3_billes_americain.png"
      gameId="chicago"
      canUndo={state.history.length > 0}
      on:home={confirmGoHome}
      on:undo={onUndo}
      on:rules={() => rulesOpen = true} />

    <!-- Cartes de score -->
    <div class="chicago-scores">
      {#each state.players as player, i}
        <div class="chicago-score-card" class:active-card={state.currentIndex === i}>
          <div class="chicago-player-name" class:chicago-active={state.currentIndex === i}>
            {player.name}
          </div>
          <div class="chicago-score" class:chicago-active={state.currentIndex === i}>
            {player.score}
          </div>
          <div class="chicago-progress-bar">
            <div class="chicago-progress-fill" style="width: {progressPct(i)}%"></div>
          </div>
          <div class="chicago-target">/ 61</div>
        </div>
      {/each}
    </div>

    <!-- Triangle de billes : utilise le composant BallButton partagé -->
    <div class="chicago-triangle-wrap">
      <div class="chicago-triangle">
        {#each CHICAGO_TRIANGLE as row}
          <div class="chicago-row">
            {#each row as n}
              <BallButton
                src={`/assets/bille_${n}.png`}
                alt={`Bille ${n}`}
                pocketed={state.pocketedBalls.has(n)}
                on:click={() => onPocketBall(n)} />
            {/each}
          </div>
        {/each}
      </div>
    </div>

    <div class="game-bottombar">
      <button class="btn-next" on:click={onEndTurn}>Suivant →</button>
    </div>
  </div>
{/if}

<!-- ===== OVERLAY VICTOIRE / ÉGALITÉ ===== -->
<WinOverlay
  open={phase === 'win' && winOutcome !== null}
  trophy={winTrophy}
  name={winName}
  sub={winSub}
  canUndo={state?.history?.length > 0}
  on:undo={onUndoFromWin}
  on:replay={replay}
  on:newGame={newGame} />

<!-- ===== OVERLAY RÈGLES ===== -->
<RulesViewer gameId="chicago" open={rulesOpen} on:close={() => rulesOpen = false} />


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
    font-size: 13px;
    color: rgba(var(--color-gold-rgb), 0.85);
    margin: 12px 0 4px;
    font-style: italic;
  }

  .name-input-wrap {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
  }

  .name-input-wrap input {
    flex: 1;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 10px;
    color: #fff;
    font-family: inherit;
    font-size: 15px;
    padding: 10px 14px;
    outline: none;
    transition: border-color 0.2s;
  }
  .name-input-wrap input:focus {
    border-color: rgba(var(--color-gold-rgb), 0.6);
  }
  .name-input-wrap input::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }
  .player-emoji {
    font-size: 22px;
    width: 30px;
    text-align: center;
    flex-shrink: 0;
  }

  /* ===== Cartes de score ===== */
  .chicago-scores {
    display: flex;
    justify-content: space-between;
    align-items: stretch;
    gap: 12px;
    margin-bottom: 16px;
  }

  .chicago-score-card {
    flex: 1;
    background: rgba(0, 0, 0, 0.25);
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 14px 10px 10px;
    text-align: center;
    transition: border-color .3s;
  }

  .chicago-score-card.active-card {
    border-color: var(--color-gold);
    box-shadow: 0 0 16px rgba(var(--color-gold-rgb), 0.25);
  }

  .chicago-player-name {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.6);
    margin-bottom: 6px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .chicago-player-name.chicago-active {
    color: var(--color-gold);
    font-weight: bold;
  }

  .chicago-score {
    font-size: 42px;
    font-weight: bold;
    color: white;
    line-height: 1;
  }
  .chicago-score.chicago-active {
    color: var(--color-gold);
    text-shadow: 0 0 20px rgba(var(--color-gold-rgb), 0.5);
  }

  .chicago-target {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.3);
    margin-top: 4px;
  }

  .chicago-progress-bar {
    height: 4px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    margin-top: 8px;
    overflow: hidden;
  }
  .chicago-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--color-gold), #FFA500);
    border-radius: 4px;
    transition: width .4s ease;
  }

  /* ===== Triangle de billes ===== */
  .chicago-triangle-wrap {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 18px;
    padding: 18px 10px;
    margin-bottom: 14px;
    border: 1px solid rgba(255, 255, 255, 0.07);
  }

  .chicago-row {
    display: flex;
    justify-content: center;
    gap: 6px;
    margin-bottom: 6px;
  }

  /* ===== Barre du bas ===== */
  .game-bottombar {
    display: flex;
    gap: 10px;
  }

  .btn-next {
    flex: 1;
    width: 100%;
    padding: 15px;
    background: linear-gradient(145deg, #2196F3, #1565C0);
    color: white;
    border: none;
    border-radius: 50px;
    font-family: inherit;
    font-size: 16px;
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
