<!--
  Page du jeu RDS (Runout Drill System) — entraînement solo à 16 niveaux.

  Phases :
   - 'setup' → nom du joueur (profil ou invité) + niveau de départ
   - 'game'  → rack du niveau courant, tentatives (X/3), validation/échec

  Logique : $lib/games/rds.js (LEVELS, buildRestrictionKeys, evaluateAttempts)
  Persistance (joueurs enregistrés uniquement) : $lib/stores/rds.js
-->
<script>
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import GameLayout from '$lib/components/GameLayout.svelte';
  import Overlay from '$lib/components/Overlay.svelte';
  import RulesViewer from '$lib/components/RulesViewer.svelte';
  import RackLayout from '$lib/components/RackLayout.svelte';
  import NumberSelector from '$lib/components/NumberSelector.svelte';
  import PlayerPicker from '$lib/components/PlayerPicker.svelte';
  import { askConfirm } from '$lib/stores/confirm.js';
  import { t } from 'svelte-i18n';
  import { get } from 'svelte/store';
  import { getLevel, buildRestrictionKeys, evaluateAttempts, MIN_LEVEL, MAX_LEVEL } from '$lib/games/rds.js';
  import { getProgress, saveProgress } from '$lib/stores/rds.js';

  // ── Phase courante ─────────────────────────────────────
  let phase = 'setup';
  $: phase, typeof window !== 'undefined' && window.scrollTo({ top: 0, behavior: 'instant' });

  // ── Setup ──────────────────────────────────────────────
  let pick = { name: '', profileId: null };
  let startLevel = MIN_LEVEL;
  let hasStartLevelChoice = false; // évite d'écraser le choix manuel du joueur

  $: isGuestPick = !!pick.name.trim() && !pick.profileId;

  $: if (!hasStartLevelChoice && pick.profileId) {
    const prog = getProgress(pick.profileId);
    startLevel = prog ? prog.lastLevel : MIN_LEVEL;
  }

  // ── État de partie ─────────────────────────────────────
  let playerName = '';
  let profileId = null;
  let level = MIN_LEVEL;
  let maxLevel = MIN_LEVEL;
  let attempts = [];

  $: levelDef = getLevel(level);
  $: restrictionKeys = buildRestrictionKeys(levelDef);
  $: ratingLabel = $t('rds.ratings.' + level);

  // ── Overlays de résultat ────────────────────────────────
  let outcomeOpen = null; // 'levelUp' | 'stay' | 'levelDown'
  let canContinue = false;

  // ── Historique (annulation) ─────────────────────────────
  const RDS_MAX_HISTORY = 50;
  let history = [];

  function snapshot() {
    return { level, maxLevel, attempts: [...attempts], outcomeOpen, canContinue };
  }

  function pushHistory() {
    history = [...history, snapshot()].slice(-RDS_MAX_HISTORY);
  }

  function onUndo() {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    history = history.slice(0, -1);
    level       = prev.level;
    maxLevel    = prev.maxLevel;
    attempts    = prev.attempts;
    outcomeOpen = prev.outcomeOpen;
    canContinue = prev.canContinue;
    persist();
  }

  function persist() {
    if (!profileId) return;
    saveProgress(profileId, { lastLevel: level, maxLevel });
  }

  function handleLaunch() {
    const _t = get(t);
    playerName = pick.name.trim() || _t('setup.defaultPlayer', { values: { n: 1 } });
    profileId  = pick.profileId;
    level      = startLevel;
    const prog = profileId ? getProgress(profileId) : null;
    maxLevel   = prog ? Math.max(prog.maxLevel, level) : level;
    attempts   = [];
    outcomeOpen = null;
    history = [];
    phase = 'game';
  }

  function recordAttempt(success) {
    if (outcomeOpen) return;
    pushHistory();
    attempts = [...attempts, success];
    const result = evaluateAttempts(attempts);
    if (!result.decided) return;

    if (result.outcome === 'levelUp') {
      maxLevel = Math.max(maxLevel, level);
      canContinue = result.canFinishEarly;
      persist();
      outcomeOpen = 'levelUp';
    } else if (result.outcome === 'stay') {
      persist();
      outcomeOpen = 'stay';
    } else {
      outcomeOpen = 'levelDown';
    }
  }

  // ── Choix après un niveau réussi ────────────────────────
  function onNextLevel() {
    pushHistory();
    level = Math.min(MAX_LEVEL, level + 1);
    maxLevel = Math.max(maxLevel, level);
    attempts = [];
    outcomeOpen = null;
    persist();
  }

  // "Continuer" : joue le 3ème rack au lieu de valider tout de suite le
  // passage de niveau — la décision (suivant / rejouer) sera reproposée une
  // fois les 3 tentatives épuisées.
  function onContinueLevel() {
    pushHistory();
    outcomeOpen = null;
  }

  function onReplayLevel() {
    pushHistory();
    attempts = [];
    outcomeOpen = null;
    persist();
  }

  // ── Acquittement "reste au niveau" ──────────────────────
  function onAcknowledgeStay() {
    pushHistory();
    attempts = [];
    outcomeOpen = null;
    persist();
  }

  // ── Choix après un niveau raté ───────────────────────────
  function onAcceptLevelDown() {
    pushHistory();
    level = Math.max(MIN_LEVEL, level - 1);
    attempts = [];
    outcomeOpen = null;
    persist();
  }

  function onStayAnyway() {
    pushHistory();
    attempts = [];
    outcomeOpen = null;
    persist();
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
      persist();
      goto(base || '/');
    }
  }

  // ── Règles ─────────────────────────────────────────────
  let rulesOpen = false;
</script>


<!-- ===== PHASE SETUP ===== -->
{#if phase === 'setup'}
  <div class="setup">
    <h1>
      <img src="{base}/assets/rds.png" alt="" class="icon-title" />
      RDS
    </h1>
    <div class="setup-sub">{$t('rds.subtitle')}</div>

    <div class="popup-box setup-box">
      <PlayerPicker bind:value={pick} index={0} />

      {#if isGuestPick}
        <div class="guest-warning">{$t('rds.guestWarning')}</div>
      {/if}

      <NumberSelector
        bind:value={startLevel}
        min={MIN_LEVEL}
        max={MAX_LEVEL}
        step={1}
        label={$t('rds.levelSelect')}
        on:change={() => (hasStartLevelChoice = true)} />

      <button class="btn-main btn-gold" on:click={handleLaunch}>{$t('setup.launchGame')}</button>
      <button class="btn-main btn-gray" on:click={() => goto(base || '/')}>{$t('setup.back')}</button>
    </div>
  </div>
{/if}


<!-- ===== PHASE GAME ===== -->
{#if phase === 'game'}
  <div class="game">
    <GameLayout title="RDS" icon="{base}/assets/rds.png" gameId="rds" canUndo={history.length > 0}
                on:home={confirmGoHome} on:undo={onUndo} on:rules={() => (rulesOpen = true)}>

      <div class="zone player-card">
        <div class="player-card-col">
          <span class="player-name">{playerName}</span>
          <span class="level-max">🏆 {$t('rds.bestLevel')}: {maxLevel}</span>
        </div>
        <div class="player-card-col player-card-col-right">
          <span class="level-current">
            <span class="level-label">{$t('rds.currentLevel')}</span>
            <span class="level-num">{level}</span>
          </span>
          <span class="level-rating">{ratingLabel}</span>
        </div>
      </div>

      <div class="zone restrictions">
        {#each restrictionKeys as r}
          <div class="restriction-item">• {$t(r.key, r.values ? { values: r.values } : undefined)}</div>
        {/each}
      </div>

      <div class="zone rack-wrap">
        <div class="attempts-indicator">
          {#each [0, 1, 2] as i}
            <span class="attempt-box" class:success={attempts[i] === true} class:fail={attempts[i] === false}>
              {#if attempts[i] === true}
                <svg class="attempt-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <polyline points="3 8.5 6.5 12 13 4" />
                </svg>
              {:else if attempts[i] === false}
                <svg class="attempt-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
                  <line x1="4" y1="4" x2="12" y2="12" />
                  <line x1="12" y1="4" x2="4" y2="12" />
                </svg>
              {/if}
            </span>
          {/each}
        </div>
        <RackLayout shape={levelDef.shape} special={levelDef.special} />
      </div>

      <svelte:fragment slot="footer">
        <div class="victory-buttons">
          <button class="btn-victory btn-victory-a" on:click={() => recordAttempt(true)}>
            {$t('rds.validate')}
          </button>
          <button class="btn-victory btn-victory-b" on:click={() => recordAttempt(false)}>
            {$t('rds.miss')}
          </button>
        </div>
      </svelte:fragment>
    </GameLayout>
  </div>
{/if}


<!-- ===== OVERLAY : niveau réussi (2 ou 3 sur 3) ===== -->
<Overlay open={outcomeOpen === 'levelUp'} dismissOnBackdrop={false} showClose={false}>
  <div class="outcome-content">
    <div class="outcome-trophy">🏆</div>
    <div class="outcome-title">{$t('rds.outcome.levelUpTitle')}</div>
    {#if level < MAX_LEVEL}
      <div class="outcome-body">{$t('rds.outcome.levelUpBody', { values: { level: level + 1 } })}</div>
    {/if}
  </div>
  <svelte:fragment slot="footer">
    {#if level < MAX_LEVEL}
      <button class="btn-main btn-gold" on:click={onNextLevel}>{$t('rds.outcome.next')}</button>
    {/if}
    {#if canContinue}
      <button class="btn-main btn-gray" on:click={onContinueLevel}>{$t('rds.outcome.continueLevel')}</button>
    {/if}
    <button class="btn-main btn-gray" on:click={onReplayLevel}>{$t('rds.outcome.replay')}</button>
  </svelte:fragment>
</Overlay>


<!-- ===== OVERLAY : reste au niveau (1 sur 3) ===== -->
<Overlay open={outcomeOpen === 'stay'} dismissOnBackdrop={false} showClose={false}>
  <div class="outcome-content">
    <div class="outcome-trophy">🎯</div>
    <div class="outcome-title">{$t('rds.outcome.stayTitle')}</div>
    <div class="outcome-body">{$t('rds.outcome.stayBody')}</div>
  </div>
  <svelte:fragment slot="footer">
    <button class="btn-main btn-gold" on:click={onAcknowledgeStay}>{$t('rds.outcome.acknowledge')}</button>
  </svelte:fragment>
</Overlay>


<!-- ===== OVERLAY : descend d'un niveau (0 sur 3) ===== -->
<Overlay open={outcomeOpen === 'levelDown'} dismissOnBackdrop={false} showClose={false}>
  <div class="outcome-content">
    <div class="outcome-trophy">📉</div>
    <div class="outcome-title">{$t('rds.outcome.downTitle')}</div>
    <div class="outcome-body">{$t('rds.outcome.downBody', { values: { level: Math.max(MIN_LEVEL, level - 1) } })}</div>
  </div>
  <svelte:fragment slot="footer">
    <button class="btn-main btn-gold" on:click={onAcceptLevelDown}>{$t('rds.outcome.acceptDown')}</button>
    <button class="btn-small-link" on:click={onStayAnyway}>{$t('rds.outcome.stayAnyway')}</button>
  </svelte:fragment>
</Overlay>



<!-- ===== OVERLAY RÈGLES ===== -->
<RulesViewer gameId="rds" open={rulesOpen} on:close={() => (rulesOpen = false)} />


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
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .guest-warning {
    font-size: 12px;
    color: rgba(255, 180, 80, 0.9);
    background: rgba(255, 180, 80, 0.1);
    border: 1px solid rgba(255, 180, 80, 0.3);
    border-radius: 10px;
    padding: 8px 12px;
  }

  /* ── Zones délimitées (même traitement visuel que les autres jeux) ── */
  .zone {
    background: rgba(0, 0, 0, 0.25);
    border: 1px solid rgba(var(--color-text-rgb), 0.1);
    border-radius: 16px;
    margin-bottom: 12px;
  }

  /* ── Carte joueur : 2 colonnes (pseudo+meilleur à gauche, niveau+rang à droite) ── */
  .player-card {
    padding: 12px 16px;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  .player-card-col {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  .player-card-col-right {
    align-items: flex-end;
    text-align: right;
  }

  .player-name {
    font-size: 15px;
    font-weight: bold;
    color: white;
    text-transform: uppercase;
    letter-spacing: 1px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .level-max {
    font-size: 12px;
    color: rgba(var(--color-text-rgb), 0.4);
    white-space: nowrap;
  }

  .level-current {
    display: flex;
    align-items: baseline;
    gap: 8px;
  }

  .level-label {
    font-size: 13px;
    font-weight: bold;
    color: rgba(var(--color-text-rgb), 0.5);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .level-num {
    font-size: 30px;
    font-weight: bold;
    color: var(--color-gold);
    text-shadow: 0 0 16px rgba(var(--color-gold-rgb), 0.4);
    line-height: 1;
  }

  .level-rating {
    font-size: 13px;
    color: rgba(var(--color-text-rgb), 0.6);
    font-style: italic;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  /* ── Restrictions ── */
  .restrictions {
    padding: 12px 16px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .restriction-item {
    font-size: 13px;
    color: rgba(var(--color-text-rgb), 0.75);
    text-align: left;
    line-height: 1.5;
  }

  /* ── Rack ── */
  .rack-wrap {
    position: relative;
    padding: 7px 4px;
  }

  /* ── Tentatives : 3 cases en coin haut-droit du rack ── */
  .attempts-indicator {
    position: absolute;
    top: 8px;
    right: 8px;
    display: flex;
    gap: 5px;
    z-index: 1;
  }

  .attempt-box {
    width: 20px;
    height: 20px;
    border-radius: 5px;
    border: 1.5px solid rgba(var(--color-text-rgb), 0.25);
    background: rgba(0, 0, 0, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .attempt-box.success {
    border-color: rgba(76, 175, 80, 0.7);
    background: rgba(76, 175, 80, 0.18);
    color: #66bb6a;
  }

  .attempt-box.fail {
    border-color: rgba(229, 57, 53, 0.7);
    background: rgba(229, 57, 53, 0.18);
    color: #ef5350;
  }

  .attempt-icon {
    width: 13px;
    height: 13px;
  }

  /* ── Boutons victoire (réutilise le style commun) ── */
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

  .btn-victory-a {
    background: linear-gradient(145deg, #43a047, #2e7d32);
    color: white;
    box-shadow: 0 4px 0 #1b5e20;
  }

  .btn-victory-b {
    background: linear-gradient(145deg, #e53935, #b71c1c);
    color: white;
    box-shadow: 0 4px 0 #7f0000;
  }

  /* ── Overlays de résultat ── */
  .outcome-content {
    text-align: center;
  }
  .outcome-trophy {
    font-size: 48px;
    line-height: 1;
    margin-bottom: 8px;
  }
  .outcome-title {
    font-size: 22px;
    font-weight: bold;
    color: var(--color-gold);
    margin-bottom: 4px;
  }
  .outcome-body {
    font-size: 14px;
    color: rgba(var(--color-text-rgb), 0.7);
    margin-bottom: 4px;
  }

  .btn-small-link {
    display: block;
    margin: 8px auto 0;
    background: none;
    border: none;
    color: rgba(var(--color-text-rgb), 0.4);
    font-size: 12px;
    text-decoration: underline;
    cursor: pointer;
    font-family: inherit;
  }
</style>
