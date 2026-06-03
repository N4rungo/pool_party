<!--
  Page complète du Killer.

  Phases :
   - 'setup1' → nb joueurs + mode jokers
   - 'setup2' → noms (page unique)
   - 'setup3' → recap avec vies modifiables individuellement (HeartsPicker)
   - 'game'   → scoreboard + actions (Tir réussi/raté/Noire/Joker)
   - 'win'    → WinOverlay

  Overlays :
   - jokerOpen      : choix du joker (en mode choice) ou tirage (random)
   - targetOpen     : sélection de la cible pour le joker 🎯
-->
<script>
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { onMount } from 'svelte';
  import GameLayout from '$lib/components/GameLayout.svelte';
  import RulesViewer from '$lib/components/RulesViewer.svelte';
  import WinOverlay from '$lib/components/WinOverlay.svelte';
  import Overlay from '$lib/components/Overlay.svelte';
  import NumberSelector from '$lib/components/NumberSelector.svelte';
  import PlayerNameInputs from '$lib/components/PlayerNameInputs.svelte';
  import RecapList from '$lib/components/RecapList.svelte';
  import MatchSetup from '$lib/components/MatchSetup.svelte';
  import MatchRecapOverlay from '$lib/components/MatchRecapOverlay.svelte';
  import MatchSummaryOverlay from '$lib/components/MatchSummaryOverlay.svelte';
  import { showToast } from '$lib/stores/toast.js';
  import { askConfirm } from '$lib/stores/confirm.js';
  import { shuffle } from '$lib/utils.js';
  import { matchStore, startMatch, recordResult, endMatch, undoResult, isLastGame } from '$lib/stores/match.js';
  import {
    JOKER_TYPES,
    KILLER_MIN_PLAYERS,
    KILLER_MAX_PLAYERS,
    KILLER_DEFAULT_PLAYERS,
    KILLER_MIN_LIVES,
    KILLER_MAX_LIVES,
    KILLER_DEFAULT_LIVES,
    KILLER_MAX_JOKERS,
    createInitialState,
    activeIndex,
    canUseJoker,
    doAction,
    drawAndApplyRandomJoker,
    useJoker,
    applyTarget,
    targetCandidates,
    undo
  } from '$lib/games/killer.js';

  const EMOJIS = ['🟡', '🔵', '🔴', '⚪', '🟠', '🟣', '🟤', '🟢',
                  '🟦', '🟥', '🟨', '🟩', '🟧', '🟪', '🟫', '⚫'];

  // ── Phase courante ────────────────────────────────────
  let phase = 'setup1';
  $: phase, typeof window !== 'undefined' && window.scrollTo({ top: 0, behavior: 'instant' });

  // ── Mode match ────────────────────────────────────────
  let matchMode = false;
  let matchTotalGames = 3;
  let showMatchRecap = false;
  let showMatchSummary = false;
  let matchAbandoned = false;

  onMount(() => {
    if ($matchStore.isActive && $matchStore.gameId === 'killer') {
      const p = $matchStore.players;
      count = p.length;
      setupPlayers = p.map(name => ({ name, lives: KILLER_DEFAULT_LIVES }));
      matchMode = true;
      matchTotalGames = $matchStore.totalGames;
      startGame();
    }
  });

  // ── Setup ─────────────────────────────────────────────
  let count = KILLER_DEFAULT_PLAYERS;
  let jokerMode = 'random';
  let randomizeOrder = true;
  let setupPlayers = [];

  function gotoSetup2() {
    setupPlayers = Array.from({ length: count }, (_, i) => ({
      name:  setupPlayers[i]?.name  ?? '',
      lives: setupPlayers[i]?.lives ?? KILLER_DEFAULT_LIVES,
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

  function updatePlayerLives(i, newLives) {
    setupPlayers = setupPlayers.map((p, idx) =>
      idx === i ? { ...p, lives: newLives } : p
    );
  }

  // ── État de partie ────────────────────────────────────
  let state = null;
  let winnerName = null;

  function startGame() {
    const players = randomizeOrder ? shuffle(setupPlayers) : setupPlayers;
    state = createInitialState(players, jokerMode);
    winnerName = null;
    phase = 'game';
    showToast(`🎯 ${state.players[0].name} commence !`);
  }

  // ── Actions de tir ────────────────────────────────────
  let handActive = false;

  function onAction(type) {
    handActive = false;
    const { newState, outcome } = doAction(state, type);
    state = newState;

    if (outcome.kind === 'win') {
      winnerName = outcome.winner.name;
      if ($matchStore.isActive) {
        const allScores = state.players.map(p => ({ name: p.name, score: p.lives }));
        recordResult([outcome.winner.name], allScores);
        showMatchRecap = true;
      } else {
        phase = 'win';
      }
      return;
    }

    switch (outcome.kind) {
      case 'hit':
        showToast(`✅ ${outcome.name} a réussi son tir`);
        break;
      case 'miss':
        showToast(`⚪ ${outcome.name} a raté ! −1 vie (reste ${outcome.livesLeft})`);
        break;
      case 'eliminated':
        showToast(`💀 ${outcome.name} est éliminé !`);
        break;
      case 'black':
        if (outcome.gained) {
          showToast(`🎱 ${outcome.name} : noire empochée ! +1 vie (${outcome.newLives})`);
        } else {
          showToast(`🎱 ${outcome.name} : noire empochée (vies max)`);
        }
        break;
    }
  }

  // ── Jokers ────────────────────────────────────────────
  let jokerOpen = false;
  let pendingJokerId = null;  // après tirage random, on connaît le joker
  let targetOpen = false;

  function openJokerMenu() {
    pendingJokerId = null;
    jokerOpen = true;
  }

  function onDrawRandom() {
    const { newState, jokerId } = drawAndApplyRandomJoker(state);
    state = newState;
    jokerOpen = false;
    if (jokerId === null) return;

    handActive = false;
    const j = JOKER_TYPES.find(j => j.id === jokerId);
    showToast(`${j.icon} ${state.players[state.currentIndex].name} : ${j.label}`);
    if (jokerId === 'target') targetOpen = true;
    else if (jokerId === 'hand') handActive = true;
  }

  function onUseJoker(jokerId) {
    jokerOpen = false;
    applyJokerEffect(jokerId);
  }

  function applyJokerEffect(jokerId) {
    handActive = false;
    const { newState, action } = useJoker(state, jokerId);
    state = newState;
    const j = JOKER_TYPES.find(j => j.id === jokerId);
    showToast(`${j.icon} ${state.players[state.currentIndex].name} : ${j.label}`);

    if (action === 'target') {
      targetOpen = true;
    } else if (action === 'hand') {
      handActive = true;
    }
  }

  function onSelectTarget(targetIdx) {
    targetOpen = false;
    state = applyTarget(state, targetIdx);
    showToast(`🎯 ${state.players[targetIdx].name} doit jouer maintenant !`);
  }

  // ── Annuler ───────────────────────────────────────────
  function onUndo() {
    handActive = false;
    state = undo(state);
    showToast('↩ Action annulée');
  }

  function onUndoFromWin() {
    handActive = false;
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

  let rulesOpen = false;

  // ── Handlers match recap ──────────────────────────────
  function onMatchNext() {
    handActive = false;
    jokerOpen = false;
    targetOpen = false;
    showMatchRecap = false;
    startGame();
  }
  function onMatchViewFinal() {
    showMatchRecap = false;
    showMatchSummary = true;
  }
  function onMatchUndo() {
    handActive = false;
    undoResult();
    state = undo(state);
    winnerName = null;
    showMatchRecap = false;
    showToast('↩ Coup décisif annulé — on continue !');
  }
  async function onMatchAbandon() {
    const ok = await askConfirm('Abandonner le match en cours ?', {
      confirmLabel: 'Abandonner',
      cancelLabel:  'Continuer',
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
    startMatch('killer', savedPlayers, savedTotal);
    matchAbandoned = false;
    showMatchSummary = false;
    startGame();
  }
  function onMatchNewGame() {
    endMatch();
    matchAbandoned = false;
    showMatchSummary = false;
    goto(base || '/');
  }

  // Helpers réactifs
  $: activeIdx     = state ? activeIndex(state) : 0;
  $: activePlayer  = state ? state.players[activeIdx] : null;
  $: isForcedTurn  = state ? state.forcedTurnFor !== null : false;
  $: jokerEnabled  = state ? canUseJoker(state) : false;
  $: tabCols = state ? (state.players.length >= 5 ? 3 : 2) : 2;
  $: matchRecapGameNumber = $matchStore.currentGame - 1;
  $: matchRecapWinners = $matchStore.results?.[$matchStore.results.length - 1]?.winners ?? [];
</script>

<!-- ============== SETUP 1 ============== -->
{#if phase === 'setup1'}
  <div class="setup">
    <h1>
      <img src="{base}/assets/bille_8_killer.png" alt="" class="icon-title" />
      Killer
    </h1>
    <div class="setup-sub">Étape 1 / 3</div>

    <div class="popup-box setup-box">
      <NumberSelector
        bind:value={count}
        min={KILLER_MIN_PLAYERS}
        max={KILLER_MAX_PLAYERS}
        label="Nombre de joueurs" />

      <div class="sep"></div>

      <div class="ns-label" style="margin-bottom:10px;">Mode jokers</div>
      <div class="toggle-group">
        <button class="toggle-btn" class:active={jokerMode === 'random'} on:click={() => jokerMode = 'random'}>
          🎲 Aléatoire
        </button>
        <button class="toggle-btn" class:active={jokerMode === 'choice'} on:click={() => jokerMode = 'choice'}>
          🃏 Choix libre
        </button>
      </div>
      <div class="setup-tip">
        {#if jokerMode === 'random'}
          Un joker aléatoire est tiré depuis le pool commun.
        {:else}
          Chaque joueur démarre avec 1 joker de chaque type.
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
      <img src="{base}/assets/bille_8_killer.png" alt="" class="icon-title" />
      Killer
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
      <img src="{base}/assets/bille_8_killer.png" alt="" class="icon-title" />
      Killer
    </h1>
    <div class="setup-sub">Étape 3 / 3 — Récapitulatif</div>

    <div class="popup-box setup-box">
      <div class="setup-tip" style="margin-bottom:2px;">
        Mode {jokerMode === 'random' ? '🎲 Aléatoire' : '🃏 Choix libre'}
      </div>
      <div class="setup-tip" style="margin-bottom:8px;">
        Ajustez les vies par joueur si besoin.
      </div>

      <RecapList players={setupPlayers} let:player let:i>
        <div class="hearts-row">
          {#each Array(KILLER_MAX_LIVES) as _, h}
            <button
              class="heart-btn"
              class:filled={h < player.lives}
              on:click={() => updatePlayerLives(i, h + 1)}
              aria-label="{h + 1} vie{h > 0 ? 's' : ''}">
              {h < player.lives ? '❤️' : '🖤'}
            </button>
          {/each}
        </div>
      </RecapList>

      <MatchSetup bind:randomizeOrder bind:matchMode bind:totalGames={matchTotalGames} />

      <button class="btn-main btn-gold" on:click={() => { if (matchMode) startMatch('killer', setupPlayers.map(p => p.name), matchTotalGames); startGame(); }}>
        {matchMode ? '🏆 Lancer le match !' : '🎱 Lancer la partie !'}
      </button>
      <button class="btn-main btn-gray" on:click={() => phase = 'setup2'}>← Retour</button>
    </div>
  </div>
{/if}

<!-- ============== GAME ============== -->
{#if phase === 'game' && state && activePlayer}
  <div class="game">
    <GameLayout
      title="KILLER"
      icon="{base}/assets/bille_8_killer.png"
      gameId="killer"
      canUndo={state.history.length > 0}
      on:home={confirmGoHome}
      on:undo={onUndo}
      on:rules={() => rulesOpen = true}>

      <!-- Liste des joueurs -->
      <div class="killer-players" class:two-col={state.players.length >= 5} style="--tab-cols: {tabCols}">
      {#each state.players as player, i (i)}
        <div class="killer-player-card"
             class:active={i === activeIdx && !player.eliminated}
             class:eliminated={player.eliminated}>

          <div class="kp-top">
            <div class="kp-name">
              <span class="kp-emoji">{EMOJIS[i % EMOJIS.length]}</span>
              <span class="kp-name-text">{player.name}</span>
            </div>
            <div class="kp-hearts">
              {#if player.eliminated}
                💀
              {:else}
                {#each Array(KILLER_MAX_LIVES) as _, h}
                  <span>{h < player.lives ? '❤️' : '🖤'}</span>
                {/each}
              {/if}
            </div>
          </div>

          <div class="kp-bottom">
            {#if state.jokerMode === 'choice' && !player.eliminated}
              <div class="kp-joker-badges">
                {#each JOKER_TYPES as j (j.id)}
                  <span class="kp-joker-badge" class:used={player.jokers[j.id] === 0}>
                    {j.icon}
                  </span>
                {/each}
              </div>
            {:else if !player.eliminated && state.jokerMode === 'random'}
              <div class="kp-joker-counter" class:maxed={player.jokersUsed >= KILLER_MAX_JOKERS}>
                🃏 Jokers : {player.jokersUsed}/{KILLER_MAX_JOKERS}
                {#if player.jokersUsed >= KILLER_MAX_JOKERS} — épuisé{/if}
              </div>
            {/if}
            {#if i === activeIdx && isForcedTurn}
              <span class="kp-badge kp-badge-forced">TOUR FORCÉ</span>
            {:else if i === activeIdx && !player.eliminated}
              {#if handActive}
                <span class="kp-badge kp-badge-hand">BILLE EN MAIN</span>
              {:else}
                <span class="kp-badge kp-badge-active">EN JEU</span>
              {/if}
            {/if}
          </div>

        </div>
      {/each}
    </div>

      <svelte:fragment slot="footer">
        <div class="killer-action-section">
          <div class="killer-action-title">
            Tour de <strong>{activePlayer?.name}</strong>
            {#if isForcedTurn}
              <span class="kp-mini-badge kp-mini-badge-forced">Forcé</span>
            {:else if handActive}
              <span class="kp-mini-badge kp-mini-badge-hand">Bille en main</span>
            {/if}
          </div>
          <div class="killer-actions">
            <button class="btn-action btn-hit"   on:click={() => onAction('hit')}>✅ Tir réussi</button>
            <button class="btn-action btn-miss"  on:click={() => onAction('miss')}>❌ Tir raté</button>
            <button class="btn-action btn-black" on:click={() => onAction('black')}>
              <img src="{base}/assets/bille_8_killer.png" alt="" class="icon-img" /> Bille noire
            </button>
            <button class="btn-action btn-joker"
                    on:click={openJokerMenu}
                    disabled={!jokerEnabled}>
              🃏 Joker
              {#if isForcedTurn} (bloqué)
              {:else if (activePlayer?.jokersUsed ?? 0) >= KILLER_MAX_JOKERS} (épuisés)
              {/if}
            </button>
          </div>
        </div>
      </svelte:fragment>
    </GameLayout>
  </div>
{/if}

<!-- ============== OVERLAY JOKER ============== -->
<Overlay open={jokerOpen} on:close={() => jokerOpen = false}>
  {#if state && activePlayer}
    <h2 style="text-align:center;margin-bottom:6px;">🃏 Utiliser un joker</h2>
    <div style="text-align:center;font-size:13px;color:rgba(255,255,255,0.55);margin-bottom:14px;">
      {activePlayer.name}
    </div>
    {#if state.jokerMode === 'random'}
      <button class="joker-choice-btn" on:click={onDrawRandom}>
        <span class="jc-icon">🎲</span>
        <div>
          <div>Tirer un joker aléatoire</div>
          <div class="jc-desc">
            {state.pool.length} joker{state.pool.length > 1 ? 's' : ''} restant{state.pool.length > 1 ? 's' : ''} dans le pool
          </div>
        </div>
      </button>
    {:else}
      {#each JOKER_TYPES as j (j.id)}
        <button class="joker-choice-btn"
                disabled={activePlayer.jokers[j.id] === 0}
                on:click={() => onUseJoker(j.id)}>
          <span class="jc-icon">{j.icon}</span>
          <div>
            <div>{j.label}</div>
            <div class="jc-desc">{j.desc}</div>
          </div>
        </button>
      {/each}
    {/if}
  {/if}
</Overlay>

<!-- ============== OVERLAY CIBLE ============== -->
<Overlay open={targetOpen} on:close={() => targetOpen = false}>
  {#if state}
    <h2 style="text-align:center;margin-bottom:6px;">🎯 Choisir une cible</h2>
    <div style="text-align:center;font-size:13px;color:rgba(255,255,255,0.55);margin-bottom:14px;">
      Le joueur ciblé joue immédiatement un tour forcé.
    </div>
    <div class="target-list">
      {#each targetCandidates(state) as p (p.index)}
        <button class="target-btn" on:click={() => onSelectTarget(p.index)}>
          <span>{EMOJIS[p.index % EMOJIS.length]}</span>
          <span class="target-name">{p.name}</span>
          <span class="target-hearts">
            {#each Array(KILLER_MAX_LIVES) as _, h}
              <span>{h < p.lives ? '❤️' : '🖤'}</span>
            {/each}
          </span>
        </button>
      {/each}
    </div>
  {/if}
</Overlay>

<!-- ============== WIN ============== -->
<WinOverlay
  open={phase === 'win'}
  trophy="🏆"
  name={winnerName}
  sub="Dernier survivant !"
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
    gameId="killer"
    totalGames={$matchStore.totalGames}
    abandoned={matchAbandoned}
    onPlayAgain={onMatchPlayAgain}
    onNewGame={onMatchNewGame} />
{/if}

<!-- ============== RULES ============== -->
<RulesViewer gameId="killer" open={rulesOpen} on:close={() => rulesOpen = false} />


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

  /* Toggle mode jokers */
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

  /* Hearts picker (recap setup3) */
  .hearts-row {
    display: flex;
    gap: 4px;
  }
  .heart-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 2px;
    font-size: 18px;
    line-height: 1;
    -webkit-tap-highlight-color: transparent;
  }
  .heart-btn.filled {
    transform: scale(1.05);
  }

  /* ===== Cartes joueurs (game) ===== */
  .killer-players {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 14px;
  }

  /* Mobile : 2 colonnes dès 5 joueurs — disposition tuile */
  .killer-players.two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .killer-players.two-col .killer-player-card {
    padding: 10px 10px;
  }

  .killer-players.two-col .kp-top {
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    gap: 2px;
  }

  .killer-players.two-col .kp-name {
    flex-wrap: nowrap;
    overflow: hidden;
    gap: 4px;
    font-size: 13px;
    width: 100%;
    justify-content: center;
  }

  .killer-players.two-col .kp-name-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }

  .killer-players.two-col .kp-hearts {
    font-size: 14px;
    text-align: center;
    width: 100%;
    display: flex;
    justify-content: center;
    flex-wrap: nowrap;
  }

  .killer-players.two-col .kp-bottom {
    width: 100%;
  }

  .killer-players.two-col .kp-joker-badge {
    font-size: 13px;
  }

  .killer-players.two-col .kp-joker-counter {
    font-size: 10px;
  }

  /* Tablette : tuiles 2 ou 3 colonnes */
  @media (min-width: 700px) {
    .killer-players {
      display: grid;
      grid-template-columns: repeat(var(--tab-cols, 2), 1fr);
      gap: 12px;
    }
    .killer-player-card {
      padding: 16px;
    }
    .kp-top {
      flex-direction: column;
      align-items: center;
      gap: 6px;
      margin-bottom: 4px;
    }
    .kp-name {
      flex-wrap: nowrap;
      overflow: hidden;
      font-size: 15px;
      justify-content: center;
      width: 100%;
    }
    .kp-name-text {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      min-width: 0;
    }
    .kp-hearts {
      font-size: 20px;
      text-align: center;
      width: 100%;
      display: flex;
      justify-content: center;
      flex-wrap: nowrap;
    }
    .kp-bottom {
      width: 100%;
    }
    .kp-joker-badges {
      justify-content: flex-start;
    }
    .kp-joker-badge {
      font-size: 18px;
    }
    .kp-joker-counter {
      font-size: 12px;
    }
  }

  .killer-player-card {
    background: rgba(0, 0, 0, 0.25);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 14px;
    padding: 10px 14px;
    transition: border-color .2s, opacity .3s, box-shadow .2s;
    container-type: inline-size;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  /* Masque l'emoji quand la tuile est trop étroite (mobile 2-col ou tablette 3-col) */
  @container (max-width: 175px) {
    .kp-emoji { display: none; }
  }

  .killer-player-card.active {
    border-color: var(--color-gold);
    box-shadow: 0 0 16px rgba(var(--color-gold-rgb), 0.2);
  }

  .killer-player-card.eliminated {
    opacity: 0.4;
  }

  .kp-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 4px;
  }

  .kp-name {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.9);
    font-weight: bold;
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }

  .killer-player-card.active .kp-name {
    color: var(--color-gold);
  }

  .kp-badge {
    font-size: 9px;
    padding: 2px 6px;
    border-radius: 8px;
    letter-spacing: 1px;
  }
  .kp-badge-active {
    background: var(--color-gold);
    color: var(--color-pool);
  }
  .kp-badge-forced {
    background: rgba(255, 100, 100, 0.25);
    color: #ffb3b3;
    border: 1px solid #ff8080;
  }
  .kp-badge-hand {
    background: rgba(100, 180, 255, 0.2);
    color: #90caff;
    border: 1px solid #64b4ff;
  }

  .kp-hearts {
    font-size: 13px;
    line-height: 1;
    white-space: nowrap;
  }

  /* ── Ligne 3 : jokers + pastille ── */
  .kp-bottom {
    display: flex;
    align-items: center;
    gap: 6px;
    min-height: 0;
  }

  .kp-joker-badges {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
  }
  .kp-joker-badge {
    font-size: 14px;
    opacity: 1;
    transition: opacity .2s;
  }
  .kp-joker-badge.used {
    opacity: 0.25;
    filter: grayscale(80%);
  }

  .kp-joker-counter {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.5);
    flex-shrink: 0;
  }
  .kp-joker-counter.maxed {
    color: #ff8080;
  }

  /* Badge dans kp-bottom : poussé à droite, se réduit en premier */
  .kp-bottom .kp-badge {
    margin-left: auto;
    flex-shrink: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }

  /* ===== Section actions ===== */
  .killer-action-section {
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    padding: 14px;
  }

  .killer-action-title {
    text-align: center;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.85);
    margin-bottom: 10px;
  }

  .kp-mini-badge {
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 6px;
    margin-left: 6px;
    letter-spacing: 1px;
  }
  .kp-mini-badge-forced {
    background: rgba(255, 100, 100, 0.25);
    color: #ffb3b3;
    border: 1px solid #ff8080;
  }
  .kp-mini-badge-hand {
    background: rgba(100, 180, 255, 0.2);
    color: #90caff;
    border: 1px solid #64b4ff;
  }

  .killer-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .btn-action {
    border: none;
    border-radius: 14px;
    padding: 14px 8px;
    font-family: inherit;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    transition: transform .1s, box-shadow .1s, opacity .15s;
    color: white;
  }

  .btn-action:active:not(:disabled) {
    transform: translateY(2px);
  }

  .btn-action:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .btn-hit   { background: linear-gradient(145deg, #4caf50, #2e7d32); box-shadow: 0 4px 0 #1b5e20; }
  .btn-miss  { background: linear-gradient(145deg, #9e9e9e, #616161); box-shadow: 0 4px 0 #424242; }
  .btn-black { background: linear-gradient(145deg, #424242, #212121); box-shadow: 0 4px 0 #000;    color: var(--color-gold); }
  .btn-joker { background: linear-gradient(145deg, #ab47bc, #7b1fa2); box-shadow: 0 4px 0 #4a148c; }

  /* ===== Overlay joker ===== */
  .joker-choice-btn {
    width: 100%;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: white;
    padding: 12px 14px;
    border-radius: 14px;
    font-family: inherit;
    cursor: pointer;
    text-align: left;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 12px;
    transition: background .15s, border-color .15s;
  }
  .joker-choice-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(var(--color-gold-rgb), 0.5);
  }
  .joker-choice-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
  .jc-icon {
    font-size: 22px;
  }
  .jc-desc {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.55);
    margin-top: 2px;
  }

  /* ===== Overlay cible ===== */
  .target-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .target-btn {
    width: 100%;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: white;
    padding: 12px 14px;
    border-radius: 14px;
    font-family: inherit;
    font-size: 14px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 10px;
    transition: background .15s, border-color .15s;
  }
  .target-btn:hover {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(var(--color-gold-rgb), 0.5);
  }
  .target-name {
    flex: 1;
    text-align: left;
  }
  .target-hearts {
    font-size: 12px;
    white-space: nowrap;
  }
</style>
