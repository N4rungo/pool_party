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
  import { onMount } from 'svelte';
  import GameLayout from '$lib/components/GameLayout.svelte';
  import RulesViewer from '$lib/components/RulesViewer.svelte';
  import WinOverlay from '$lib/components/WinOverlay.svelte';
  import Overlay from '$lib/components/Overlay.svelte';
  import BallButton from '$lib/components/BallButton.svelte';
  import NumberSelector from '$lib/components/NumberSelector.svelte';
  import PlayerSetupList from '$lib/components/PlayerSetupList.svelte';
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
    if ($matchStore.isActive && $matchStore.gameId === 'cutthroat') {
      const p = $matchStore.players;
      count = p.length;
      setupPlayers = p.map(name => ({ name }));
      matchMode = true;
      matchTotalGames = $matchStore.totalGames;
      picks = p.map(name => ({ name, profileId: null }));
      startGame();
    }
  });

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

  // ── État de partie ────────────────────────────────────
  let state = null;
  let winnerName = null;

  function startGame() {
    picksMap = Object.fromEntries(picks.map(p => [p.name.trim() || p.name, p.profileId]));
    state = createInitialState(setupPlayers);
    winnerName = null;
    phase = 'game';
    showToast(get(t)('toast.starts', { values: { name: state.players[0].name } }));
  }

  // ── Empocher une bille ────────────────────────────────
  function onPocketBall(n) {
    const { newState, outcome } = pocketBall(state, n);
    state = newState;
    if (outcome.kind === 'win') {
      winnerName = outcome.winner.name;
      recordHistory({
        gameId: 'cutthroat',
        players: state.players.map(p => ({ name: p.name, profileId: picksMap[p.name] ?? null })),
        winners: [outcome.winner.name],
        scores: {},
      });
      if ($matchStore.isActive) {
        const allScores = state.players.map(p => ({
          name: p.name,
          score: state.distribution.groups[state.players.indexOf(p)]
            .filter(b => state.balls[b] !== 'out').length
        }));
        recordResult([outcome.winner.name], allScores);
        showMatchRecap = true;
      } else {
        phase = 'win';
      }
    } else if (outcome.kind === 'continue') {
      // Vérifier si on vient d'éliminer quelqu'un (toast d'info)
      // (sinon le bruit de toast à chaque bille est inutile)
      showToast(get(t)('cutthroat.toast.ball', { values: { n } }));
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
    showToast(get(t)('toast.actionCancelled'));
  }

  function onUndoFromWin() {
    state = undo(state);
    winnerName = null;
    phase = 'game';
    showToast(get(t)('toast.finalShotCancelled'));
  }

  // ── Rejouer / Nouveau jeu / Accueil ───────────────────
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

  // ── Overlay règles ────────────────────────────────────
  let rulesOpen = false;

  // ── Handlers match recap ──────────────────────────────
  function onMatchNext() {
    showMatchRecap = false;
    winnerName = null;
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
    startMatch('cutthroat', savedPlayers, savedTotal);
    matchAbandoned = false;
    showMatchSummary = false;
    winnerName = null;
    startGame();
  }
  function onMatchNewGame() {
    endMatch();
    matchAbandoned = false;
    showMatchSummary = false;
    goto(base || '/');
  }

  // ── Layout adaptatif ──────────────────────────────────
  let innerWidth = 480;
  onMount(() => { innerWidth = window.innerWidth; });

  $: perPlayer = state?.distribution?.perPlayer ?? 0;
  $: tabCols   = state ? (state.players.length >= 5 ? 3 : 2) : 2;
  $: ballSize  = innerWidth >= 700
    ? (perPlayer >= 5 ? 54 : perPlayer >= 3 ? 50 : perPlayer === 2 ? 44 : 64)
    : (perPlayer >= 5 ? 42 : perPlayer === 3 ? 36 : perPlayer === 2 ? 32 : 28);
  $: matchRecapGameNumber = $matchStore.currentGame - 1;
  $: matchRecapWinners = $matchStore.results?.[$matchStore.results.length - 1]?.winners ?? [];
</script>

<!-- ============== SETUP 1 : nb joueurs ============== -->
{#if phase === 'setup1'}
  <div class="setup">
    <h1>
      <img src="{base}/assets/bille_1_target.png" alt="" class="icon-title" />
      Cutthroat
    </h1>
    <div class="setup-sub">{$t('setup.step', { values: { n: 1, total: 3 } })}</div>

    <div class="popup-box setup-box">
      <NumberSelector
        bind:value={count}
        min={CT_MIN_PLAYERS}
        max={CT_MAX_PLAYERS}
        label={$t('setup.playerCount')} />

      <button class="btn-main btn-gold" on:click={gotoSetup2}>{$t('setup.next')}</button>
      <button class="btn-main btn-gray" on:click={() => goto(base || '/')}>{$t('setup.back')}</button>
    </div>
  </div>
{/if}

<!-- ============== SETUP 2 : noms ============== -->
{#if phase === 'setup2'}
  <div class="setup">
    <h1>
      <img src="{base}/assets/bille_1_target.png" alt="" class="icon-title" />
      Cutthroat
    </h1>
    <div class="setup-sub">{$t('setup.step', { values: { n: 2, total: 3 } })} — {$t('setup.playerNames')}</div>

    <div class="popup-box setup-box">
      <div class="setup-tip" style="margin-bottom:10px;">
        {$t('cutthroat.skillTip')}
      </div>

      <PlayerSetupList bind:picks count={setupPlayers.length} />

      <button class="btn-main btn-gold" on:click={gotoSetup3}>{$t('setup.next')}</button>
      <button class="btn-main btn-gray" on:click={() => phase = 'setup1'}>{$t('setup.back')}</button>
    </div>
  </div>
{/if}

<!-- ============== SETUP 3 : recap distribution ============== -->
{#if phase === 'setup3'}
  <div class="setup">
    <h1>
      <img src="{base}/assets/bille_1_target.png" alt="" class="icon-title" />
      Cutthroat
    </h1>
    <div class="setup-sub">{$t('setup.step', { values: { n: 3, total: 3 } })} — {$t('setup.recap')}</div>

    <div class="popup-box setup-box">
      <div class="ct-corners-section">
        <div class="ct-triangle-title">Formation du triangle</div>
        <div class="ct-section-label" style="text-align:center;">Dans les 3 coins</div>
        <div class="ct-corners">
          {#each previewCorners as b}
            <img src="{base}/assets/bille_{b}.png" alt="Bille {b}" class="ball-corner" />
          {/each}
        </div>
      </div>

      <div class="ct-section-label" style="margin-top:14px;">{$t('cutthroat.ballsPerPlayer')}</div>
      <div class="recap-list">
        {#each setupPlayers as player, i (i)}
          <div class="recap-row">
            <span class="recap-emoji">{EMOJIS[i % EMOJIS.length]}</span>
            <span class="recap-name">{player.name || $t('setup.defaultPlayer', { values: { n: i + 1 } })}</span>
            <div class="ct-balls-row-recap">
              {#each previewDistribution.groups[i] as b}
                <img src="{base}/assets/bille_{b}.png" class="ball-player" alt="{b}" />
              {/each}
            </div>
          </div>
        {/each}
      </div>

      <MatchSetup bind:matchMode bind:totalGames={matchTotalGames} />

      <button class="btn-main btn-gold" on:click={() => { if (matchMode) startMatch('cutthroat', setupPlayers.map(p => p.name), matchTotalGames); startGame(); }}>
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
      title="CUTTHROAT"
      icon="{base}/assets/bille_1_target.png"
      gameId="cutthroat"
      canUndo={state.history.length > 0}
      on:home={confirmGoHome}
      on:undo={onUndo}
      on:rules={() => rulesOpen = true}>

      <!-- Liste des joueurs avec leurs billes -->
      <div class="ct-players"
           class:compact={perPlayer <= 3}
           class:two-col={perPlayer <= 2}
           style="--tab-cols: {tabCols}">
        {#each state.players as player, i (i)}
          <div class="ct-player-card" class:eliminated={player.eliminated}>
            <div class="ct-player-name">
              <span class="ct-player-emoji">{EMOJIS[i % EMOJIS.length]}</span>
              <span class="ct-name-text">{player.name}</span>
              {#if player.eliminated}
                <span class="ct-badge-eliminated">{$t('cutthroat.eliminated')}</span>
              {/if}
            </div>
            <div class="ct-balls-row">
              {#each state.distribution.groups[i] as b}
                {#if state.balls[b] !== undefined}
                  <BallButton
                    src={`${base}/assets/bille_${b}.png`}
                    alt={`Bille ${b}`}
                    size={ballSize}
                    pocketed={state.balls[b] === 'out'}
                    on:click={() => onPocketBall(b)} />
                {/if}
              {/each}
            </div>
          </div>
        {/each}
      </div>

      <svelte:fragment slot="footer">
        <div class="game-bottombar">
          <button class="btn-fault" on:click={openFaultMenu}>{$t('cutthroat.faultBtn')}</button>
        </div>
      </svelte:fragment>
    </GameLayout>
  </div>
{/if}

<!-- ============== OVERLAYS ============== -->
<!-- Sélection du fautif -->
<Overlay open={faultSelectOpen} on:close={() => faultSelectOpen = false}>
  {#if state}
    <h2 style="text-align:center;margin-bottom:14px;">{$t('cutthroat.faultWho')}</h2>
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
    <h2 style="text-align:center;margin-bottom:6px;">{$t('cutthroat.faultOf', { values: { name: faultResult.faulterName } })}</h2>
    <div style="font-size:13px;color:rgba(255,255,255,0.55);text-align:center;margin-bottom:14px;">
      {$t('cutthroat.faultReturns')}
    </div>
    {#if faultResult.returns.length}
      <div class="recap-list">
        {#each faultResult.returns as r (r.ball)}
          <div class="recap-row">
            <span class="recap-emoji">{EMOJIS[r.playerIdx % EMOJIS.length]}</span>
            <span class="recap-name">{state.players[r.playerIdx].name}</span>
            <span style="font-size:13px;color:rgba(255,255,255,0.5);">{$t('cutthroat.faultPutsBack')}</span>
            <img src="{base}/assets/bille_{r.ball}.png" class="ball-mini" alt={String(r.ball)} />
          </div>
        {/each}
      </div>
    {:else}
      <div style="text-align:center;color:rgba(255,255,255,0.5);font-size:14px;padding:14px 0;">
        {$t('cutthroat.faultNone')}
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
  sub={$t('cutthroat.winSub')}
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
    gameId="cutthroat"
    totalGames={$matchStore.totalGames}
    abandoned={matchAbandoned}
    onPlayAgain={onMatchPlayAgain}
    onNewGame={onMatchNewGame} />
{/if}

<!-- ============== RULES ============== -->
<RulesViewer gameId="cutthroat" open={rulesOpen} on:close={() => rulesOpen = false} />


<style>
  /* ===== Layout général ===== */
  .setup,
  .game {
    width: var(--content-w, 92%);
    max-width: var(--content-max, 480px);
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
  .ct-triangle-title {
    font-size: 22px;
    color: var(--color-gold);
    text-shadow: 0 0 10px rgba(var(--color-gold-rgb), 0.4);
    text-align: center;
    margin-bottom: 4px;
  }

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

  /* ===== Récap setup3 — billes plus visibles ===== */
  /* Billes des coins du triangle : grosses, bien visibles */
  .ball-corner {
    width: 48px;
    height: 48px;
    object-fit: contain;
  }

  .ball-player {
    width: 28px;
    height: 28px;
    object-fit: contain;
  }

  .ct-balls-row-recap {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    flex-shrink: 0;
    justify-content: flex-end;
  }

  /* ===== Game : cartes joueurs ===== */
  .ct-players {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 14px;
    /* Espace sous les cartes pour que le footer sticky ne masque pas
       la dernière carte quand la liste dépasse la hauteur du viewport. */
    padding-bottom: 80px;
  }

  /* 4-5 joueurs (3 billes) : 1 col, nom + billes sur la même ligne */
  .ct-players.compact .ct-player-card {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
  }
  .ct-players.compact .ct-player-name {
    flex: 1;
    font-size: 14px;
    margin-bottom: 0;
    min-width: 0;
  }
  .ct-players.compact .ct-balls-row {
    flex-shrink: 0;
  }

  /* 6-15 joueurs (1-2 billes) : 2 colonnes, tout sur une ligne */
  .ct-players.two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }
  .ct-players.two-col .ct-player-card {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 10px;
  }
  .ct-players.two-col .ct-player-name {
    flex: 1;
    font-size: 13px;
    margin-bottom: 0;
    min-width: 0;
  }
  .ct-players.two-col .ct-name-text {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
  }
  .ct-players.two-col .ct-badge-eliminated {
    display: none; /* opacity suffit en 2-col */
  }
  .ct-players.two-col .ct-balls-row {
    flex-shrink: 0;
    gap: 3px;
  }

  /* ── Tablette : tuiles 2 ou 3 colonnes ── */
  @media (min-width: 700px) {
    .ct-players {
      display: grid !important;
      grid-template-columns: repeat(var(--tab-cols, 2), 1fr);
      gap: 12px;
    }
    .ct-players .ct-player-card {
      display: block !important;
      padding: 14px 14px !important;
    }
    .ct-players .ct-player-name {
      flex: unset !important;
      font-size: 14px !important;
      margin-bottom: 8px !important;
      min-width: unset !important;
    }
    .ct-players .ct-balls-row {
      flex-shrink: unset !important;
      flex-wrap: nowrap !important;
      justify-content: center;
      gap: 6px !important;
    }
    .ct-players .ct-badge-eliminated {
      display: inline !important;
    }
  }

  .ct-player-card {
    background: rgba(0, 0, 0, 0.25);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 14px;
    padding: 10px 14px;
    transition: opacity .3s, border-color .2s;
    /* Permet aux @container queries enfants de réagir à la largeur de la carte */
    container-type: inline-size;
  }

  /* Quand la carte est trop étroite, l'emoji cède la place au nom
     plutôt que de forcer la troncature du texte. */
  @container (max-width: 165px) {
    .ct-player-emoji {
      display: none;
    }
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
    gap: 6px;
  }

  .ct-player-emoji {
    flex-shrink: 0;
  }

  .ct-name-text {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
    flex: 1;
  }

  .ct-badge-eliminated {
    flex-shrink: 0;
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
