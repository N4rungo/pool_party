<script>
  import { base } from '$app/paths';
  import { goto } from '$app/navigation';
  import { profilesStore, createProfile, renameProfile, deleteProfile } from '$lib/stores/profiles.js';
  import {
    historyStore, PERIODS, filterByPeriod,
    deleteHistoryForProfile, unlinkProfile,
    clearAllHistory, deleteHistoryBefore, deleteHistoryForGame,
  } from '$lib/stores/history.js';
  import {
    globalLeaderboard, gameLeaderboard,
    GAME_SORT_OPTIONS, SORT_LABELS,
  } from '$lib/utils/stats.js';
  import { GAMES } from '$lib/games.js';
  import { askConfirm } from '$lib/stores/confirm.js';

  const MAX_NAME = 16;

  let tab = 'global';

  // ── Global tab ──────────────────────────────────────────────────────────
  let globalPeriodId = 'all';
  let globalSortBy = 'won';

  $: globalHistory = filterByPeriod($historyStore, globalPeriodId);
  $: globalBoard   = globalLeaderboard(globalHistory, $profilesStore, globalSortBy);

  // ── Jeux tab ────────────────────────────────────────────────────────────
  let jeuPeriodId   = 'all';
  let selectedGameId = GAMES[0].id;
  let gameSortBy    = 'won';

  $: jeuHistory      = filterByPeriod($historyStore, jeuPeriodId);
  $: gameBoard       = gameLeaderboard(jeuHistory, $profilesStore, selectedGameId, gameSortBy);
  $: gameSortOptions = GAME_SORT_OPTIONS[selectedGameId] ?? ['won', 'played', 'winRate'];
  $: { if (!gameSortOptions.includes(gameSortBy)) gameSortBy = gameSortOptions[0]; }

  // ── Gérer tab — création ────────────────────────────────────────────────
  let newProfileName = '';

  function addProfile() {
    const name = newProfileName.trim();
    if (!name) return;
    createProfile(name);
    newProfileName = '';
  }

  // ── Gérer tab — renommage inline ────────────────────────────────────────
  let editingId   = null;
  let editingName = '';

  function startEdit(profile) {
    editingId   = profile.id;
    editingName = profile.name;
  }

  function commitEdit() {
    if (editingName.trim()) renameProfile(editingId, editingName.trim());
    editingId = null;
  }

  function cancelEdit() { editingId = null; }

  // ── Gérer tab — suppression profil ─────────────────────────────────────
  async function handleDeleteProfile(profile) {
    const hasHistory = $historyStore.some(e => e.players.some(p => p.profileId === profile.id));
    const suffix = hasHistory ? '\nL\'historique sera conservé (joueur anonymisé).' : '';
    if (await askConfirm(`Supprimer "${profile.name}" ?${suffix}`, {
      icon: '🗑️', confirmLabel: 'Supprimer', cancelLabel: 'Annuler',
    })) {
      unlinkProfile(profile.id);
      deleteProfile(profile.id);
    }
  }

  // ── Gérer tab — nettoyage données ──────────────────────────────────────
  let cleanPeriodId = '30d';
  let cleanGameId   = GAMES[0].id;

  async function handleClearBefore() {
    const period = PERIODS.find(p => p.id === cleanPeriodId);
    if (!period?.days) return;
    const cutoff = Date.now() - period.days * 24 * 60 * 60 * 1000;
    const count = $historyStore.filter(e => e.playedAt < cutoff).length;
    if (!count) return;
    if (await askConfirm(`Supprimer ${count} partie(s) datant de plus de ${period.label.toLowerCase()} ?`, {
      icon: '📅', confirmLabel: 'Supprimer', cancelLabel: 'Annuler',
    })) {
      deleteHistoryBefore(cutoff);
    }
  }

  async function handleClearGame() {
    const game  = GAMES.find(g => g.id === cleanGameId);
    const count = $historyStore.filter(e => e.gameId === cleanGameId).length;
    if (!count) return;
    if (await askConfirm(`Supprimer ${count} partie(s) de ${game?.name} ?`, {
      icon: '🎱', confirmLabel: 'Supprimer', cancelLabel: 'Annuler',
    })) {
      deleteHistoryForGame(cleanGameId);
    }
  }

  async function handleClearAll() {
    const count = $historyStore.length;
    if (!count) return;
    if (await askConfirm(`Effacer tout l'historique (${count} partie${count > 1 ? 's' : ''}) ?`, {
      icon: '💥', confirmLabel: 'Tout effacer', cancelLabel: 'Annuler',
    })) {
      clearAllHistory();
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────────────
  function statLabel(sortBy, stats) {
    if (sortBy === 'winRate') return `${stats.winRate} %`;
    if (sortBy === 'won')     return `${stats.won} victoire${stats.won !== 1 ? 's' : ''}`;
    if (sortBy === 'played')  return `${stats.played} partie${stats.played !== 1 ? 's' : ''}`;
    const v = stats[sortBy];
    return v !== null && v !== undefined ? String(v) : '—';
  }

  const PERIOD_SHORT = { '7d': '7j', '30d': '30j', '6m': '6m', 'all': 'Tout' };
</script>

<div id="players-page">
  <div class="page-header">
    <button class="btn-back" on:click={() => goto(`${base}/`)}>‹</button>
    <span class="page-title">Joueurs</span>
  </div>

  <div class="tabs-bar">
    <button class="tab-btn" class:active={tab === 'global'} on:click={() => tab = 'global'}>Global</button>
    <button class="tab-btn" class:active={tab === 'jeux'}   on:click={() => tab = 'jeux'}>Par jeu</button>
    <button class="tab-btn" class:active={tab === 'gerer'}  on:click={() => tab = 'gerer'}>Gérer</button>
  </div>

  <!-- ══ GLOBAL ══ -->
  {#if tab === 'global'}
    <div class="tab-content">
      <div class="filters-row">
        <div class="pill-group">
          {#each PERIODS as p}
            <button class="pill" class:active={globalPeriodId === p.id}
              on:click={() => globalPeriodId = p.id}>{PERIOD_SHORT[p.id]}</button>
          {/each}
        </div>
        <div class="pill-group">
          {#each ['won', 'played', 'winRate'] as s}
            <button class="pill" class:active={globalSortBy === s}
              on:click={() => globalSortBy = s}>{SORT_LABELS[s]}</button>
          {/each}
        </div>
      </div>

      {#if globalBoard.length === 0}
        <div class="empty-state">Aucune statistique disponible</div>
      {:else}
        <div class="leaderboard">
          {#each globalBoard as row, i}
            <button class="lb-row" on:click={() => goto(`${base}/players/${row.profile.id}`)}>
              <span class="lb-rank" class:lb-rank-top={i < 3}>{i + 1}</span>
              <span class="lb-name">{row.profile.name}</span>
              <span class="lb-stat">{statLabel(globalSortBy, row.stats)}</span>
              <span class="lb-arrow">›</span>
            </button>
          {/each}
        </div>
      {/if}
    </div>

  <!-- ══ JEUX ══ -->
  {:else if tab === 'jeux'}
    <div class="tab-content">
      <div class="filters-row">
        <div class="pill-group wrap">
          {#each GAMES as g}
            <button class="pill" class:active={selectedGameId === g.id}
              on:click={() => selectedGameId = g.id}>{g.name}</button>
          {/each}
        </div>
        <div class="pill-group">
          {#each PERIODS as p}
            <button class="pill" class:active={jeuPeriodId === p.id}
              on:click={() => jeuPeriodId = p.id}>{PERIOD_SHORT[p.id]}</button>
          {/each}
        </div>
        <div class="pill-group wrap">
          {#each gameSortOptions as s}
            <button class="pill" class:active={gameSortBy === s}
              on:click={() => gameSortBy = s}>{SORT_LABELS[s]}</button>
          {/each}
        </div>
      </div>

      {#if gameBoard.length === 0}
        <div class="empty-state">Aucune statistique pour ce jeu</div>
      {:else}
        <div class="leaderboard">
          {#each gameBoard as row, i}
            <button class="lb-row" on:click={() => goto(`${base}/players/${row.profile.id}`)}>
              <span class="lb-rank" class:lb-rank-top={i < 3}>{i + 1}</span>
              <span class="lb-name">{row.profile.name}</span>
              <span class="lb-stat">{statLabel(gameSortBy, row.stats)}</span>
              <span class="lb-arrow">›</span>
            </button>
          {/each}
        </div>
      {/if}
    </div>

  <!-- ══ GÉRER ══ -->
  {:else}
    <div class="tab-content">
      <!-- Créer -->
      <div class="section-label">Nouveau profil</div>
      <div class="create-row">
        <input
          type="text"
          bind:value={newProfileName}
          placeholder="Nom du joueur"
          maxlength={MAX_NAME}
          class="text-input"
          on:keydown={e => e.key === 'Enter' && addProfile()}
        />
        <button class="btn-add" on:click={addProfile} disabled={!newProfileName.trim()}>Créer</button>
      </div>

      <!-- Liste profils -->
      {#if $profilesStore.length === 0}
        <div class="empty-state" style="margin-top:20px">Aucun profil créé</div>
      {:else}
        <div class="section-label" style="margin-top:24px">Profils ({$profilesStore.length})</div>
        <div class="profile-list">
          {#each $profilesStore as profile (profile.id)}
            {#if editingId === profile.id}
              <div class="profile-row">
                <input
                  type="text"
                  bind:value={editingName}
                  maxlength={MAX_NAME}
                  class="text-input text-input-inline"
                  on:keydown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') cancelEdit(); }}
                />
                <button class="icon-btn icon-btn-green" on:click={commitEdit} title="Valider">✓</button>
                <button class="icon-btn" on:click={cancelEdit} title="Annuler">✕</button>
              </div>
            {:else}
              <div class="profile-row">
                <button class="profile-name-btn" on:click={() => goto(`${base}/players/${profile.id}`)}>
                  {profile.name}
                </button>
                <button class="icon-btn" on:click={() => startEdit(profile)} title="Renommer">✏️</button>
                <button class="icon-btn icon-btn-red" on:click={() => handleDeleteProfile(profile)} title="Supprimer">🗑️</button>
              </div>
            {/if}
          {/each}
        </div>
      {/if}

      <!-- Nettoyage -->
      <div class="section-label" style="margin-top:32px">Nettoyage</div>

      <div class="cleanup-block">
        <div class="cleanup-desc">Supprimer les parties datant de plus de&nbsp;:</div>
        <div class="pill-group">
          {#each PERIODS.filter(p => p.days) as p}
            <button class="pill" class:active={cleanPeriodId === p.id}
              on:click={() => cleanPeriodId = p.id}>{PERIOD_SHORT[p.id]}</button>
          {/each}
        </div>
        <button class="btn-cleanup" on:click={handleClearBefore}>Supprimer</button>
      </div>

      <div class="cleanup-block">
        <div class="cleanup-desc">Supprimer tout l'historique d'un jeu&nbsp;:</div>
        <div class="pill-group wrap">
          {#each GAMES as g}
            <button class="pill" class:active={cleanGameId === g.id}
              on:click={() => cleanGameId = g.id}>{g.name}</button>
          {/each}
        </div>
        <button class="btn-cleanup" on:click={handleClearGame}>Supprimer</button>
      </div>

      <div class="cleanup-block cleanup-block-danger">
        <button class="btn-danger" on:click={handleClearAll}>💥 Effacer tout l'historique</button>
      </div>
    </div>
  {/if}
</div>

<style>
  #players-page {
    width: var(--content-w, 92%);
    max-width: var(--content-max, 480px);
    padding-top: 10px;
    padding-bottom: 20px;
  }

  /* ── Header ── */
  .page-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 4px 8px;
  }

  .btn-back {
    background: none;
    border: none;
    color: var(--color-gold);
    font-size: 28px;
    line-height: 1;
    cursor: pointer;
    padding: 4px 8px 4px 0;
    -webkit-tap-highlight-color: transparent;
  }

  .page-title {
    font-size: 22px;
    font-weight: bold;
    color: var(--color-gold);
    letter-spacing: 2px;
    text-transform: uppercase;
    text-shadow: 0 0 16px rgba(var(--color-gold-rgb), 0.4);
  }

  /* ── Tabs ── */
  .tabs-bar {
    display: flex;
    gap: 6px;
    margin-bottom: 18px;
  }

  .tab-btn {
    flex: 1;
    padding: 10px 6px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 12px;
    background: rgba(0, 0, 0, 0.2);
    color: rgba(255, 255, 255, 0.55);
    font-family: inherit;
    font-size: 13px;
    font-weight: bold;
    cursor: pointer;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    transition: background 0.15s, color 0.15s, border-color 0.15s;
    -webkit-tap-highlight-color: transparent;
  }

  .tab-btn.active {
    background: rgba(var(--color-gold-rgb), 0.15);
    border-color: rgba(var(--color-gold-rgb), 0.5);
    color: var(--color-gold);
  }

  /* ── Tab content ── */
  .tab-content {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  /* ── Filters ── */
  .filters-row {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .pill-group {
    display: flex;
    gap: 6px;
  }

  .pill-group.wrap {
    flex-wrap: wrap;
  }

  .pill {
    padding: 6px 10px;
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    background: rgba(0, 0, 0, 0.25);
    color: rgba(255, 255, 255, 0.6);
    font-family: inherit;
    font-size: 12px;
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.12s, border-color 0.12s, color 0.12s;
    -webkit-tap-highlight-color: transparent;
  }

  .pill.active {
    background: rgba(var(--color-gold-rgb), 0.2);
    border-color: rgba(var(--color-gold-rgb), 0.6);
    color: var(--color-gold);
    font-weight: bold;
  }

  /* ── Leaderboard ── */
  .leaderboard {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 4px;
  }

  .lb-row {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 12px;
    padding: 12px 14px;
    cursor: pointer;
    text-align: left;
    font-family: inherit;
    color: white;
    transition: background 0.12s;
    -webkit-tap-highlight-color: transparent;
  }

  .lb-row:active {
    background: rgba(0, 0, 0, 0.35);
  }

  .lb-rank {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.35);
    width: 20px;
    text-align: center;
    flex-shrink: 0;
  }

  .lb-rank.lb-rank-top {
    color: var(--color-gold);
    font-weight: bold;
  }

  .lb-name {
    flex: 1;
    font-size: 15px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .lb-stat {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.6);
    white-space: nowrap;
  }

  .lb-arrow {
    font-size: 16px;
    color: rgba(255, 255, 255, 0.25);
    flex-shrink: 0;
  }

  /* ── Empty state ── */
  .empty-state {
    text-align: center;
    color: rgba(255, 255, 255, 0.35);
    font-size: 14px;
    padding: 32px 0;
    font-style: italic;
  }

  /* ── Section labels ── */
  .section-label {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.4);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 2px;
  }

  /* ── Create row ── */
  .create-row {
    display: flex;
    gap: 8px;
  }

  .text-input {
    flex: 1;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 10px;
    color: white;
    font-family: inherit;
    font-size: 15px;
    padding: 10px 12px;
    outline: none;
    min-width: 0;
  }

  .text-input:focus {
    border-color: rgba(var(--color-gold-rgb), 0.5);
  }

  .text-input-inline {
    flex: 1;
    min-width: 0;
  }

  .btn-add {
    background: rgba(var(--color-gold-rgb), 0.2);
    border: 1px solid rgba(var(--color-gold-rgb), 0.4);
    border-radius: 10px;
    color: var(--color-gold);
    font-family: inherit;
    font-size: 14px;
    font-weight: bold;
    padding: 10px 16px;
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.12s;
    -webkit-tap-highlight-color: transparent;
  }

  .btn-add:disabled {
    opacity: 0.35;
    cursor: default;
  }

  /* ── Profile list ── */
  .profile-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .profile-row {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 12px;
    padding: 10px 12px;
  }

  .profile-name-btn {
    flex: 1;
    text-align: left;
    background: none;
    border: none;
    color: white;
    font-family: inherit;
    font-size: 15px;
    cursor: pointer;
    padding: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    -webkit-tap-highlight-color: transparent;
  }

  .profile-name-btn:hover { text-decoration: underline; }

  .icon-btn {
    background: none;
    border: none;
    font-size: 16px;
    cursor: pointer;
    padding: 4px;
    border-radius: 6px;
    opacity: 0.65;
    transition: opacity 0.12s;
    -webkit-tap-highlight-color: transparent;
    flex-shrink: 0;
  }

  .icon-btn:hover, .icon-btn:active { opacity: 1; }
  .icon-btn-red   { color: #ff6b6b; }
  .icon-btn-green { color: #69db7c; }

  /* ── Cleanup ── */
  .cleanup-block {
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 14px;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .cleanup-block-danger {
    border-color: rgba(255, 80, 80, 0.2);
    background: rgba(255, 80, 80, 0.05);
  }

  .cleanup-desc {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.6);
  }

  .btn-cleanup {
    align-self: flex-start;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 10px;
    color: rgba(255, 255, 255, 0.7);
    font-family: inherit;
    font-size: 13px;
    padding: 8px 16px;
    cursor: pointer;
    transition: background 0.12s;
    -webkit-tap-highlight-color: transparent;
  }

  .btn-cleanup:hover { background: rgba(255, 255, 255, 0.12); }

  .btn-danger {
    width: 100%;
    background: rgba(255, 80, 80, 0.15);
    border: 1px solid rgba(255, 80, 80, 0.35);
    border-radius: 10px;
    color: #ff6b6b;
    font-family: inherit;
    font-size: 14px;
    font-weight: bold;
    padding: 12px;
    cursor: pointer;
    transition: background 0.12s;
    -webkit-tap-highlight-color: transparent;
  }

  .btn-danger:hover { background: rgba(255, 80, 80, 0.22); }
</style>
