<!--
  Page complète du Snooker.

  Phases setup :
   - 'setup1' → nb joueurs + mode (simple / expert)
   - 'setup2' → noms
   - 'setup3' → recap
   - 'game'   → 3 phases internes (red / color / endgame)
   - 'win'    → WinOverlay avec ranking final

  Overlays modaux superposés à 'game' :
   - multiShotOpen   : empocher plusieurs rouges + couleurs en un coup
   - faultOpen       : sélecteur de valeur de faute
   - expertChoiceOpen: choix prendre points / faire rejouer (mode expert)
   - freeBallAskOpen : proposer la free ball (mode expert, après faute)
-->
<script>
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import GameLayout from '$lib/components/GameLayout.svelte';
  import RulesViewer from '$lib/components/RulesViewer.svelte';
  import WinOverlay from '$lib/components/WinOverlay.svelte';
  import Overlay from '$lib/components/Overlay.svelte';
  import NumberSelector from '$lib/components/NumberSelector.svelte';
  import PlayerNameInputs from '$lib/components/PlayerNameInputs.svelte';
  import { showToast } from '$lib/stores/toast.js';
  import { askConfirm } from '$lib/stores/confirm.js';
  import {
    SNOOKER_BALLS,
    SNOOKER_COLORS_ORDER,
    SNOOKER_TOTAL_REDS,
    SNOOKER_MIN_PLAYERS,
    SNOOKER_MAX_PLAYERS,
    SNOOKER_DEFAULT_PLAYERS,
    SNOOKER_MIN_FAULT,
    createInitialState,
    pocketBall,
    multiShotPoints,
    applyMultiShot,
    getMinFault,
    applyFaultSimple,
    applyFaultExpert,
    setFreeBall,
    playFreeBall,
    endTurn,
    phaseLabel,
    rankedPlayers,
    undo
  } from '$lib/games/snooker.js';

  const EMOJIS = ['🟡', '🔵', '🔴', '⚪'];

  let phase = 'setup1';

  // Setup
  let count = SNOOKER_DEFAULT_PLAYERS;
  let mode = 'simple';
  let setupPlayers = [];

  function gotoSetup2() {
    setupPlayers = Array.from({ length: count }, (_, i) => ({
      name: setupPlayers[i]?.name ?? '',
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

  // Game state
  let state = null;
  let winnerName = null;
  let winnerScore = 0;
  let winnerBreak = 0;
  let finalRanking = [];

  function startGame() {
    state = createInitialState(setupPlayers, mode);
    winnerName = null;
    finalRanking = [];
    phase = 'game';
    showToast(`🎯 ${state.players[0].name} commence !`);
  }

  // ── Empocher une bille ────────────────────────────────
  function onPocketBall(ballId) {
    const { newState, outcome } = pocketBall(state, ballId);
    state = newState;
    if (outcome.kind === 'win') {
      finishWin(outcome.winner);
    } else {
      const b = SNOOKER_BALLS[ballId];
      showToast(`🎱 ${b.label} : +${b.points} pts`);
    }
  }

  function finishWin(winner) {
    winnerName = winner.name;
    winnerScore = winner.score;
    winnerBreak = winner.bestBreak;
    finalRanking = rankedPlayers(state);
    phase = 'win';
  }

  // ── Multi-shot overlay ────────────────────────────────
  let multiShotOpen = false;
  let multiShot = null;

  function openMultiShot() {
    multiShot = {
      reds:   Math.min(1, state.redsRemaining),
      colors: Object.fromEntries(SNOOKER_COLORS_ORDER.map(c => [c, false])),
    };
    multiShotOpen = true;
  }

  function multiShotChangeReds(delta) {
    const next = Math.min(state.redsRemaining, Math.max(1, multiShot.reds + delta));
    multiShot = { ...multiShot, reds: next };
  }

  function multiShotToggleColor(colorId) {
    multiShot = {
      ...multiShot,
      colors: { ...multiShot.colors, [colorId]: !multiShot.colors[colorId] },
    };
  }

  function confirmMultiShot() {
    const { newState, points } = applyMultiShot(state, multiShot);
    state = newState;
    multiShotOpen = false;
    showToast(`🔴×${multiShot.reds} + couleurs : +${points} pts`);
  }

  // ── Faute ──────────────────────────────────────────────
  let faultOpen = false;
  let faultValue = SNOOKER_MIN_FAULT;
  let pendingFaultValue = 0;

  let expertChoiceOpen = false;
  let freeBallAskOpen  = false;

  function openFault() {
    faultValue = getMinFault(state);
    faultOpen = true;
  }

  function changeFaultValue(delta) {
    const min = getMinFault(state);
    faultValue = Math.max(min, Math.min(7, faultValue + delta));
  }

  function confirmFault() {
    faultOpen = false;
    if (state.mode === 'simple') {
      const { newState } = applyFaultSimple(state, faultValue);
      state = newState;
      showToast(`⚠️ Faute (+${faultValue} pts pour les autres)`);
    } else {
      // Mode expert : on attend le choix
      pendingFaultValue = faultValue;
      expertChoiceOpen = true;
    }
  }

  function expertChoice(replay) {
    expertChoiceOpen = false;
    const { newState, askFreeBall } = applyFaultExpert(state, pendingFaultValue, replay);
    state = newState;
    if (replay) {
      showToast(`⚠️ Faute (+${pendingFaultValue} pts) — ${state.players[state.currentIndex].name} rejoue`);
    } else {
      showToast(`⚠️ Faute (+${pendingFaultValue} pts) — main passe`);
      if (askFreeBall) {
        freeBallAskOpen = true;
      }
    }
  }

  function freeBallChoice(useFreeBall) {
    freeBallAskOpen = false;
    state = setFreeBall(state, useFreeBall);
    if (useFreeBall) {
      showToast(`🎱 Free ball activée pour ${state.players[state.currentIndex].name}`);
    }
  }

  function onPlayFreeBall() {
    state = playFreeBall(state);
    showToast('🎱 Free ball jouée');
  }

  // ── Suivant volontaire / Annuler ──────────────────────
  function onEndTurn() {
    state = endTurn(state);
    showToast(`👤 Tour de ${state.players[state.currentIndex].name}`);
  }

  function onUndo() {
    state = undo(state);
    showToast('↩ Action annulée');
  }

  function onUndoFromWin() {
    state = undo(state);
    winnerName = null;
    finalRanking = [];
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
      iconImage:    '/assets/home.png'
    });
    if (ok) goto(base || '/');
  }

  let rulesOpen = false;

  // Helpers réactifs
  $: activePlayer = state ? state.players[state.currentIndex] : null;
  $: phaseLabelText = state ? phaseLabel(state) : '';
  $: msPoints = multiShot ? multiShotPoints(multiShot) : null;
</script>

<!-- ============== SETUP 1 ============== -->
{#if phase === 'setup1'}
  <div class="setup">
    <h1>
      <img src="{base}/assets/3_billes_snooker.png" alt="" class="icon-title" />
      Snooker
    </h1>
    <div class="setup-sub">Étape 1 / 3</div>

    <div class="popup-box setup-box">
      <NumberSelector
        bind:value={count}
        min={SNOOKER_MIN_PLAYERS}
        max={SNOOKER_MAX_PLAYERS}
        label="Nombre de joueurs" />

      <div class="sep"></div>

      <div class="ns-label" style="margin-bottom:10px;">Mode de jeu</div>
      <div class="toggle-group">
        <button class="toggle-btn" class:active={mode === 'simple'} on:click={() => mode = 'simple'}>
          🟢 Simple
        </button>
        <button class="toggle-btn" class:active={mode === 'expert'} on:click={() => mode = 'expert'}>
          🔴 Expert
        </button>
      </div>
      <div class="setup-tip">
        {#if mode === 'simple'}
          Faute : les autres joueurs reçoivent les points automatiquement.
        {:else}
          Faute : le joueur lésé choisit (prendre les points / faire rejouer).
          Free ball disponible.
        {/if}
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
      <img src="{base}/assets/3_billes_snooker.png" alt="" class="icon-title" />
      Snooker
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
      <img src="{base}/assets/3_billes_snooker.png" alt="" class="icon-title" />
      Snooker
    </h1>
    <div class="setup-sub">Étape 3 / 3 — Récapitulatif</div>

    <div class="popup-box setup-box">
      <div class="setup-tip" style="margin-bottom:10px;">
        Mode : {mode === 'simple' ? '🟢 Simple' : '🔴 Expert'}
      </div>
      <div class="recap-list">
        {#each setupPlayers as p, i (i)}
          <div class="recap-row">
            <span class="recap-emoji">{EMOJIS[i % EMOJIS.length]}</span>
            <span class="recap-name">{p.name}</span>
          </div>
        {/each}
      </div>

      <button class="btn-main btn-gold" on:click={startGame}>🎱 Lancer la partie !</button>
      <button class="btn-main btn-gray" on:click={() => phase = 'setup2'}>← Retour</button>
    </div>
  </div>
{/if}

<!-- ============== GAME ============== -->
{#if phase === 'game' && state}
  <div class="game">
    <GameLayout
      title="SNOOKER"
      icon="{base}/assets/3_billes_snooker.png"
      gameId="snooker"
      canUndo={state.history.length > 0}
      on:home={confirmGoHome}
      on:undo={onUndo}
      on:rules={() => rulesOpen = true}>

      <!-- Scoreboard -->
      <div class="snk-scoreboard">
      {#each state.players as player, i (i)}
        <div class="snk-score-card" class:active={i === state.currentIndex}>
          <span class="snk-score-emoji">{EMOJIS[i % EMOJIS.length]}</span>
          <span class="snk-score-name">{player.name}</span>
          <span class="snk-score-pts">{player.score}</span>
          <span class="snk-best-break" title="Meilleur break">🏆 {player.bestBreak}</span>
        </div>
      {/each}
    </div>

    <!-- Bandeau actif -->
    <div class="snk-active-info">
      <div class="snk-active-name">{activePlayer.name}</div>
      <div class="snk-break-now">
        {#if state.mustReplay}
          {activePlayer.name} rejoue (suite à une faute)
        {:else}
          Break : {activePlayer.currentBreak}
        {/if}
      </div>
      <div class="snk-phase-label">
        🔢 Rouges restantes : {state.redsRemaining} — {phaseLabelText}
      </div>
    </div>

    <!-- Action zone selon la phase -->
    <div class="snk-action-zone">
      {#if state.phase === 'red'}
        <div class="snk-red-wrap">
          <button class="snk-ball-btn" on:click={() => onPocketBall('red')}>
            <img src={SNOOKER_BALLS.red.icon} alt="Rouge" />
            <span>1 pt</span>
          </button>
          <button class="btn-multired" on:click={openMultiShot}
                  disabled={state.redsRemaining < 1}>
            🔴🔴 Coup multiple
          </button>
        </div>
      {:else if state.phase === 'color'}
        <div class="snk-colors-grid">
          {#each SNOOKER_COLORS_ORDER as colorId (colorId)}
            {@const b = SNOOKER_BALLS[colorId]}
            <button class="snk-ball-btn" on:click={() => onPocketBall(colorId)}>
              <img src={b.icon} alt={b.label} />
              <span>{b.points} pts</span>
            </button>
          {/each}
        </div>
      {:else if state.phase === 'endgame'}
        <div class="snk-colors-grid">
          {#each SNOOKER_COLORS_ORDER as colorId, idx (colorId)}
            {@const b = SNOOKER_BALLS[colorId]}
            {@const isNext = idx === state.endgameColorIdx}
            <button
              class="snk-ball-btn"
              class:snk-btn-inactive={!isNext}
              class:snk-btn-next={isNext}
              disabled={!isNext}
              on:click={() => onPocketBall(colorId)}>
              <img src={b.icon} alt={b.label} />
              <span>{b.points} pts</span>
            </button>
          {/each}
        </div>
      {/if}

      {#if state.freeBallActive && state.mode === 'expert'}
        <button class="btn-main btn-gold snk-freeball-btn" on:click={onPlayFreeBall}>
          🎱 Free Ball
        </button>
      {/if}
    </div>

      <svelte:fragment slot="footer">
        <div class="game-bottombar">
          <button class="btn-fault" on:click={openFault}>⚠️ Faute</button>
          <button class="btn-next" on:click={onEndTurn}>Suivant →</button>
        </div>
      </svelte:fragment>
    </GameLayout>
  </div>
{/if}

<!-- ============== OVERLAY MULTI-SHOT ============== -->
<Overlay open={multiShotOpen} on:close={() => multiShotOpen = false}>
  {#if multiShot}
    <h2 style="text-align:center;margin-bottom:6px;">🔴 Coup multiple</h2>
    <div style="text-align:center;font-size:13px;color:rgba(255,255,255,0.55);margin-bottom:14px;">
      Combien de rouges + quelles couleurs en un coup ?
    </div>

    <div class="snk-multi-section">
      <div class="snk-multi-label">Rouges empochées</div>
      <div class="snk-multi-red-stepper">
        <button class="btn-round-sm" on:click={() => multiShotChangeReds(-1)}
                disabled={multiShot.reds <= 1}>−</button>
        <span class="snk-multi-red-value">{multiShot.reds}</span>
        <button class="btn-round-sm" on:click={() => multiShotChangeReds(+1)}
                disabled={multiShot.reds >= state.redsRemaining}>+</button>
      </div>
    </div>

    <div class="snk-multi-section">
      <div class="snk-multi-label">Couleurs (toggle)</div>
      <div class="snk-colors-grid">
        {#each SNOOKER_COLORS_ORDER as colorId (colorId)}
          {@const b = SNOOKER_BALLS[colorId]}
          <button
            class="snk-ball-btn"
            class:selected={multiShot.colors[colorId]}
            on:click={() => multiShotToggleColor(colorId)}>
            <img src={b.icon} alt={b.label} />
            <span>{b.points} pts</span>
          </button>
        {/each}
      </div>
    </div>

    <div class="snk-multi-total">
      Total : <strong>{msPoints?.total ?? 0} pts</strong>
    </div>

    <button class="btn-main btn-gold" on:click={confirmMultiShot}>Valider</button>
    <button class="btn-main btn-gray" on:click={() => multiShotOpen = false}>Annuler</button>
  {/if}
</Overlay>

<!-- ============== OVERLAY FAUTE ============== -->
<Overlay open={faultOpen} on:close={() => faultOpen = false}>
  {#if state}
    <h2 style="text-align:center;margin-bottom:6px;">⚠️ Faute</h2>
    <div style="text-align:center;font-size:13px;color:rgba(255,255,255,0.55);margin-bottom:14px;">
      Valeur de la pénalité (min {getMinFault(state)}, max 7)
    </div>
    <div class="snk-fault-stepper">
      <button class="btn-round-sm" on:click={() => changeFaultValue(-1)}
              disabled={faultValue <= getMinFault(state)}>−</button>
      <span class="snk-fault-value">{faultValue}</span>
      <button class="btn-round-sm" on:click={() => changeFaultValue(+1)}
              disabled={faultValue >= 7}>+</button>
    </div>
    <button class="btn-main btn-gold" on:click={confirmFault}>Valider</button>
    <button class="btn-main btn-gray" on:click={() => faultOpen = false}>Annuler</button>
  {/if}
</Overlay>

<!-- ============== OVERLAY EXPERT — choix après faute ============== -->
<Overlay open={expertChoiceOpen} on:close={() => expertChoiceOpen = false}>
  {#if state}
    <h2 style="text-align:center;margin-bottom:6px;">⚖️ Faute — choix expert</h2>
    <div style="text-align:center;font-size:13px;color:rgba(255,255,255,0.65);margin-bottom:14px;">
      +{pendingFaultValue} pts attribués au lésé.
      <br>Que veux-tu faire ?
    </div>
    <button class="btn-main btn-gold" on:click={() => expertChoice(false)}>
      Prendre les points et jouer
    </button>
    <button class="btn-main btn-gray" on:click={() => expertChoice(true)}>
      Faire rejouer le fautif
    </button>
  {/if}
</Overlay>

<!-- ============== OVERLAY FREE BALL ============== -->
<Overlay open={freeBallAskOpen} on:close={() => freeBallAskOpen = false}
         dismissOnBackdrop={false}>
  <h2 style="text-align:center;margin-bottom:6px;">🎱 Free Ball ?</h2>
  <div style="text-align:center;font-size:13px;color:rgba(255,255,255,0.65);
              line-height:1.6;margin-bottom:14px;">
    Suite à la faute, le joueur est snookered.<br>
    Il peut désigner une bille libre qui vaudra les points de la bille
    normalement visée.
  </div>
  <button class="btn-main btn-gold" on:click={() => freeBallChoice(true)}>
    ✅ Utiliser la free ball
  </button>
  <button class="btn-main btn-gray" on:click={() => freeBallChoice(false)}>
    ✖️ Non merci
  </button>
</Overlay>

<!-- ============== WIN avec ranking ============== -->
<WinOverlay
  open={phase === 'win'}
  trophy="🏆"
  name={winnerName}
  sub={`${winnerScore} points • Meilleur break : ${winnerBreak}`}
  canUndo={state?.history?.length > 0}
  on:undo={onUndoFromWin}
  on:replay={replay}
  on:newGame={newGame}>
  {#if finalRanking.length > 0}
    <div class="snk-final-ranking">
      {#each finalRanking as p, i (p.name)}
        <div class="snk-ranking-row" class:winner={i === 0}>
          <span>{i === 0 ? '🏆' : EMOJIS[state.players.indexOf(p) % EMOJIS.length]}</span>
          <span class="snk-rank-name">{p.name}</span>
          <span class="snk-rank-score">{p.score} pts</span>
          <span class="snk-rank-break">🏅 {p.bestBreak}</span>
        </div>
      {/each}
    </div>
  {/if}
</WinOverlay>

<!-- ============== RULES ============== -->
<RulesViewer gameId="snooker" open={rulesOpen} on:close={() => rulesOpen = false} />


<style>
  .setup, .game {
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

  .sep {
    height: 1px;
    background: rgba(255, 255, 255, 0.1);
    margin: 16px 0;
  }

  .ns-label {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  /* Toggle mode (simple/expert) */
  .toggle-group {
    display: flex;
    gap: 8px;
    background: rgba(0, 0, 0, 0.25);
    border-radius: 50px;
    padding: 4px;
    margin-bottom: 10px;
  }
  .toggle-btn {
    flex: 1;
    border: none;
    background: transparent;
    color: rgba(255, 255, 255, 0.6);
    padding: 10px 12px;
    border-radius: 50px;
    cursor: pointer;
    font-family: inherit;
    font-size: 13px;
    font-weight: bold;
    transition: background .15s, color .15s;
  }
  .toggle-btn.active {
    background: linear-gradient(145deg, var(--color-gold-light), var(--color-gold));
    color: var(--color-pool);
  }

  .recap-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 12px;
  }
  .recap-row {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 10px;
    padding: 8px 12px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
  }
  .recap-emoji { font-size: 18px; width: 26px; text-align: center; }
  .recap-name { flex: 1; text-align: left; color: white; }

  /* ===== Scoreboard ===== */
  .snk-scoreboard {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 10px;
  }

  .snk-score-card {
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

  .snk-score-card.active {
    border-color: var(--color-gold);
    box-shadow: 0 0 12px rgba(var(--color-gold-rgb), 0.2);
  }

  .snk-score-emoji {
    font-size: 16px;
    width: 22px;
    text-align: center;
  }

  .snk-score-name {
    flex: 1;
    color: rgba(255, 255, 255, 0.85);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .snk-score-card.active .snk-score-name {
    color: var(--color-gold);
    font-weight: bold;
  }

  .snk-score-pts {
    font-weight: bold;
    color: white;
    font-size: 18px;
  }

  .snk-score-card.active .snk-score-pts {
    color: var(--color-gold);
  }

  .snk-best-break {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.5);
  }

  /* ===== Bandeau actif ===== */
  .snk-active-info {
    background: rgba(var(--color-gold-rgb), 0.08);
    border: 1px solid rgba(var(--color-gold-rgb), 0.35);
    border-radius: 14px;
    padding: 10px 14px;
    margin-bottom: 12px;
    text-align: center;
  }

  .snk-active-name {
    font-size: 16px;
    font-weight: bold;
    color: var(--color-gold);
  }

  .snk-break-now {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.85);
    margin-top: 2px;
  }

  .snk-phase-label {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.55);
    margin-top: 4px;
  }

  /* ===== Action zone ===== */
  .snk-action-zone {
    background: rgba(0, 0, 0, 0.25);
    border-radius: 16px;
    padding: 14px;
    margin-bottom: 12px;
    border: 1px solid rgba(255, 255, 255, 0.07);
  }

  .snk-red-wrap {
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-items: center;
  }

  .snk-colors-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .snk-ball-btn {
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 14px;
    padding: 8px 4px;
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

  .snk-ball-btn img {
    width: 42px;
    height: 42px;
    object-fit: contain;
  }

  .snk-ball-btn span {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.7);
    font-weight: bold;
  }

  .snk-ball-btn:active:not(:disabled) {
    transform: scale(0.97);
  }

  .snk-ball-btn:not(:disabled):hover {
    border-color: rgba(var(--color-gold-rgb), 0.6);
    box-shadow: 0 0 10px rgba(var(--color-gold-rgb), 0.15);
  }

  .snk-ball-btn.selected {
    border-color: var(--color-gold);
    background: rgba(var(--color-gold-rgb), 0.12);
  }

  .snk-btn-inactive {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .snk-btn-next {
    border-color: var(--color-gold);
    box-shadow: 0 0 12px rgba(var(--color-gold-rgb), 0.3);
  }

  .btn-multired {
    width: 100%;
    padding: 12px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    color: white;
    font-family: inherit;
    font-size: 14px;
    cursor: pointer;
    transition: background .15s;
  }
  .btn-multired:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.15);
  }
  .btn-multired:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .snk-freeball-btn {
    margin-top: 10px;
  }

  /* ===== Multi-shot overlay ===== */
  .snk-multi-section {
    margin-bottom: 14px;
  }
  .snk-multi-label {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.55);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 6px;
  }
  .snk-multi-red-stepper {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
  }
  .snk-multi-red-value {
    font-size: 28px;
    font-weight: bold;
    color: var(--color-gold);
    min-width: 40px;
    text-align: center;
  }
  .snk-multi-total {
    text-align: center;
    font-size: 16px;
    margin: 12px 0;
    color: rgba(255, 255, 255, 0.85);
  }
  .snk-multi-total strong {
    color: var(--color-gold);
    font-size: 22px;
  }

  /* ===== Faute overlay ===== */
  .snk-fault-stepper {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    margin: 8px 0 14px;
  }
  .snk-fault-value {
    font-size: 36px;
    font-weight: bold;
    color: var(--color-gold);
    min-width: 50px;
    text-align: center;
  }

  /* btn-round-sm pour stepper */
  :global(.btn-round-sm) {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    border: none;
    background: linear-gradient(145deg, var(--color-gold-light), var(--color-gold));
    color: var(--color-pool);
    font-size: 18px;
    font-weight: bold;
    cursor: pointer;
    box-shadow: 0 3px 0 var(--color-gold-dark);
    transition: transform .1s, box-shadow .1s, opacity .15s;
    line-height: 1;
  }
  :global(.btn-round-sm:active:not(:disabled)) {
    transform: translateY(2px);
    box-shadow: none;
  }
  :global(.btn-round-sm:disabled) {
    opacity: 0.35;
    cursor: not-allowed;
  }

  /* ===== Bottombar ===== */
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

  /* ===== Final ranking ===== */
  .snk-final-ranking {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 16px;
  }
  .snk-ranking-row {
    background: rgba(0, 0, 0, 0.25);
    border-radius: 10px;
    padding: 8px 12px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
  }
  .snk-ranking-row.winner {
    background: rgba(var(--color-gold-rgb), 0.15);
    border: 1px solid var(--color-gold);
  }
  .snk-rank-name {
    flex: 1;
    text-align: left;
    color: white;
  }
  .snk-rank-score {
    font-weight: bold;
    color: var(--color-gold);
  }
  .snk-rank-break {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.6);
  }
</style>
