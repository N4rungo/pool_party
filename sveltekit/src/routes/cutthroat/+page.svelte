<!--
  Page complète du Cutthroat.

  Phases :
   - 'setup1'        → nb joueurs
   - 'setup2'        → noms (page unique, ordre du débutant à l'expert)
   - 'setup3'        → recap avec distribution des billes
   - 'game'          → liste joueurs avec billes cliquables + bouton Faute
   - 'win'           → WinOverlay

  Overlays modaux superposés à 'game' :
   - faultSelectOpen : choisir le fautif
   - faultResultOpen : récap des billes remises en jeu
-->
<script>
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import GameHeader from '$lib/components/GameHeader.svelte';
  import RulesViewer from '$lib/components/RulesViewer.svelte';
  import WinOverlay from '$lib/components/WinOverlay.svelte';
  import Overlay from '$lib/components/Overlay.svelte';
  import BallButton from '$lib/components/BallButton.svelte';
  import NumberSelector from '$lib/components/NumberSelector.svelte';
  import PlayerNameInputs from '$lib/components/PlayerNameInputs.svelte';
  import { showToast } from '$lib/stores/toast.js';
  import { askConfirm } from '$lib/stores/confirm.js';
  import {
    CT_MIN_PLAYERS,
    CT_MAX_PLAYERS,
    CT_DEFAULT_PLAYERS,
    computeDistribution,
    cornerBalls,
    createInitialState,
    pocketBall,
    applyFault,
    undo
  } from '$lib/games/cutthroat.js';

  const EMOJIS = ['🟡', '🔵', '🔴', '⚪', '🟠', '🟣', '🟤', '🟢',
                  '🟦', '🟥', '🟨', '🟩', '🟧', '🟪', '🟫'];

  // ── Phase courante ────────────────────────────────────
  let phase = 'setup1';

  // ── Setup ─────────────────────────────────────────────
  let count = CT_DEFAULT_PLAYERS;
  let setupPlayers = [];

  // Distribution prévisionnelle pour le récap (étape 3)
  $: previewDistribution = computeDistribution(count);
  $: previewCorners      = cornerBalls(previewDistribution);

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

  // ── État de partie ────────────────────────────────────
  let state = null;
  let winnerName = null;

  function startGame() {
    state = createInitialState(setupPlayers);
    winnerName = null;
    phase = 'game';
    showToast(`🎯 ${state.players[0].name} commence !`);
  }

  // ── Empocher une bille ────────────────────────────────
  function onPocketBall(n) {
    const { newState, outcome } = pocketBall(state, n);
    state = newState;
    if (outcome.kind === 'win') {
      winnerName = outcome.winner.name;
      phase = 'win';
    } else if (outcome.kind === 'continue') {
      // Vérifier si on vient d'éliminer quelqu'un (toast d'info)
      // (sinon le bruit de toast à chaque bille est inutile)
      showToast(`🎱 Bille ${n} empochée`);
    }
  }

  // ── Faute ─────────────────────────────────────────────
  let faultSelectOpen = false;
  let faultResultOpen = false;
  let faultResult     = null;

  function openFaultMenu() {
    faultSelectOpen = true;
  }

  function selectFaulter(faulterIdx) {
    faultSelectOpen = false;
    const { newState, returns } = applyFault(state, faulterIdx);
    state = newState;
    faultResult = {
      faulterIdx,
      faulterName: state.players[faulterIdx].name,
      returns,
    };
    faultResultOpen = true;
  }

  function closeFaultResult() {
    faultResultOpen = false;
    faultResult = null;
  }

  // ── Annuler ───────────────────────────────────────────
  function onUndo() {
    state = undo(state);
    showToast('↩ Action annulée');
  }

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
      iconImage:    '/assets/home.png'
    });
    if (ok) goto(base || '/');
  }

  // ── Overlay règles ────────────────────────────────────
  let rulesOpen = false;
</script>

<!-- ============== SETUP 1 : nb joueurs ============== -->
{#if phase === 'setup1'}
  <div class="setup">
    <h1>
      <img src="/assets/bille_1_target.png" alt="" class="icon-title" />
      Cutthroat
    </h1>
    <div class="setup-sub">Étape 1 / 3</div>

    <div class="popup-box setup-box">
      <NumberSelector
        bind:value={count}
        min={CT_MIN_PLAYERS}
        max={CT_MAX_PLAYERS}
        label="Nombre de joueurs" />

      <div class="setup-tip">
        Du moins au plus expérimenté : l'expert recevra le dernier groupe de billes.
      </div>

      <button class="btn-main btn-gold" on:click={gotoSetup2}>Suivant →</button>
      <button class="btn-main btn-gray" on:click={() => goto(base || '/')}>← Retour</button>
    </div>
  </div>
{/if}

<!-- ============== SETUP 2 : noms ============== -->
{#if phase === 'setup2'}
  <div class="setup">
    <h1>
      <img src="/assets/bille_1_target.png" alt="" class="icon-title" />
      Cutthroat
    </h1>
    <div class="setup-sub">Étape 2 / 3 — Noms des joueurs</div>

    <div class="popup-box setup-box">
      <div class="setup-tip" style="margin-bottom:10px;">
        Du débutant (Joueur 1) à l'expert (dernier).
      </div>

      <PlayerNameInputs bind:players={setupPlayers} />

      <button class="btn-main btn-gold" on:click={gotoSetup3}>Suivant →</button>
      <button class="btn-main btn-gray" on:click={() => phase = 'setup1'}>← Retour</button>
    </div>
  </div>
{/if}

<!-- ============== SETUP 3 : recap distribution ============== -->
{#if phase === 'setup3'}
  <div class="setup">
    <h1>
      <img src="/assets/bille_1_target.png" alt="" class="icon-title" />
      Cutthroat
    </h1>
    <div class="setup-sub">Étape 3 / 3 — Récapitulatif</div>

    <div class="popup-box setup-box">
      <div class="ct-corners-section">
        <div class="ct-section-label">🔺 Aux 3 coins du triangle</div>
        <div class="ct-corners">
          {#each previewCorners as b}
            <img src="/assets/bille_{b}.png" alt="Bille {b}" class="ball-mini" />
          {/each}
        </div>
      </div>

      <div class="ct-section-label" style="margin-top:14px;">Billes par joueur</div>
      <div class="recap-list">
        {#each setupPlayers as player, i (i)}
          <div class="recap-row">
            <span class="recap-emoji">{EMOJIS[i % EMOJIS.length]}</span>
            <span class="recap-name">{player.name || `Joueur ${i + 1}`}</span>
            <span class="ct-balls-mini">
              {#each previewDistribution.groups[i] as b}
                <img src="/assets/bille_{b}.png" class="ball-mini" alt="{b}" />
              {/each}
            </span>
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
    <GameHeader
      title="CUTTHROAT"
      icon="/assets/bille_1_target.png"
      gameId="cutthroat"
      canUndo={state.history.length > 0}
      on:home={confirmGoHome}
      on:undo={onUndo}
      on:rules={() => rulesOpen = true} />

    <!-- Liste des joueurs avec leurs billes -->
    <div class="ct-players">
      {#each state.players as player, i (i)}
        <div class="ct-player-card" class:eliminated={player.eliminated}>
          <div class="ct-player-name">
            {EMOJIS[i % EMOJIS.length]} {player.name}
            {#if player.eliminated}
              <span class="ct-badge-eliminated">ÉLIMINÉ</span>
            {/if}
          </div>
          <div class="ct-balls-row">
            {#each state.distribution.groups[i] as b}
              {#if state.balls[b] !== undefined}
                <BallButton
                  src={`/assets/bille_${b}.png`}
                  alt={`Bille ${b}`}
                  size={42}
                  pocketed={state.balls[b] === 'out'}
                  on:click={() => onPocketBall(b)} />
              {/if}
            {/each}
          </div>
        </div>
      {/each}
    </div>

    <div class="game-bottombar">
      <button class="btn-fault" on:click={openFaultMenu}>⚠️ Faute</button>
    </div>
  </div>
{/if}

<!-- ============== OVERLAYS ============== -->
<!-- Sélection du fautif -->
<Overlay open={faultSelectOpen} on:close={() => faultSelectOpen = false}>
  {#if state}
    <h2 style="text-align:center;margin-bottom:14px;">⚠️ Qui a fait la faute ?</h2>
    <div class="ct-fault-list">
      {#each state.players as player, i (i)}
        {#if !player.eliminated}
          <button class="ct-fault-btn" on:click={() => selectFaulter(i)}>
            {EMOJIS[i % EMOJIS.length]} {player.name}
          </button>
        {/if}
      {/each}
    </div>
  {/if}
</Overlay>

<!-- Résultat de la faute -->
<Overlay open={faultResultOpen} on:close={closeFaultResult}>
  {#if faultResult}
    <h2 style="text-align:center;margin-bottom:6px;">Faute de {faultResult.faulterName}</h2>
    <div style="font-size:13px;color:rgba(255,255,255,0.55);text-align:center;margin-bottom:14px;">
      Remise en jeu des billes (dans l'ordre) :
    </div>
    {#if faultResult.returns.length}
      <div class="recap-list">
        {#each faultResult.returns as r (r.ball)}
          <div class="recap-row">
            <span class="recap-emoji">{EMOJIS[r.playerIdx % EMOJIS.length]}</span>
            <span class="recap-name">{state.players[r.playerIdx].name}</span>
            <span style="font-size:13px;color:rgba(255,255,255,0.5);">remet la</span>
            <img src="/assets/bille_{r.ball}.png" class="ball-mini" alt={String(r.ball)} />
          </div>
        {/each}
      </div>
    {:else}
      <div style="text-align:center;color:rgba(255,255,255,0.5);font-size:14px;padding:14px 0;">
        Aucune bille à remettre en jeu.
      </div>
    {/if}
    <button class="btn-main btn-gold" on:click={closeFaultResult}>OK</button>
  {/if}
</Overlay>

<!-- ============== WIN ============== -->
<WinOverlay
  open={phase === 'win'}
  trophy="🏆"
  name={winnerName}
  sub="Dernier joueur en lice !"
  canUndo={state?.history?.length > 0}
  on:undo={onUndoFromWin}
  on:replay={replay}
  on:newGame={newGame} />

<!-- ============== RULES ============== -->
<RulesViewer gameId="cutthroat" open={rulesOpen} on:close={() => rulesOpen = false} />


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
    color: rgba(var(--color-gold-rgb), 0.85);
    margin: 6px 0 4px;
    font-style: italic;
  }

  /* ===== Setup3 : récap ===== */
  .ct-section-label {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 8px;
    text-align: left;
  }

  .ct-corners-section {
    text-align: center;
  }

  .ct-corners {
    display: flex;
    justify-content: center;
    gap: 8px;
  }

  .recap-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 12px 0;
  }

  .recap-row {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 12px;
    padding: 8px 12px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
  }

  .recap-emoji {
    font-size: 18px;
    width: 24px;
    flex-shrink: 0;
    text-align: center;
  }

  .recap-name {
    flex: 1;
    color: #fff;
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .ct-balls-mini {
    display: flex;
    gap: 2px;
    flex-shrink: 0;
    flex-wrap: wrap;
    max-width: 50%;
    justify-content: flex-end;
  }

  .ball-mini {
    width: 22px;
    height: 22px;
    object-fit: contain;
  }

  /* ===== Game : cartes joueurs ===== */
  .ct-players {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 14px;
  }

  .ct-player-card {
    background: rgba(0, 0, 0, 0.25);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 14px;
    padding: 10px 14px;
    transition: opacity .3s, border-color .2s;
  }

  .ct-player-card.eliminated {
    opacity: 0.4;
  }

  .ct-player-name {
    font-size: 15px;
    color: rgba(255, 255, 255, 0.9);
    font-weight: bold;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .ct-badge-eliminated {
    margin-left: auto;
    font-size: 11px;
    background: rgba(255, 100, 100, 0.2);
    color: #ff8080;
    padding: 2px 8px;
    border-radius: 8px;
    letter-spacing: 1px;
  }

  .ct-balls-row {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  /* ===== Bouton Faute ===== */
  .game-bottombar {
    display: flex;
  }

  .btn-fault {
    flex: 1;
    width: 100%;
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

  /* ===== Overlay sélection fautif ===== */
  .ct-fault-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 12px;
  }

  .ct-fault-btn {
    width: 100%;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: white;
    padding: 12px 14px;
    border-radius: 12px;
    font-family: inherit;
    font-size: 15px;
    cursor: pointer;
    text-align: left;
    transition: background .15s, border-color .15s;
  }
  .ct-fault-btn:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(var(--color-gold-rgb), 0.5);
  }
</style>
