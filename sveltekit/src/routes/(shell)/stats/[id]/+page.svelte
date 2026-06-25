<script>
  import { page } from '$app/stores';
  import { base } from '$app/paths';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { profilesStore, renameProfile } from '$lib/stores/profiles.js';
  import { historyStore } from '$lib/stores/history.js';
  import {
    globalStats, gameStats, playedGameIds,
  } from '$lib/utils/stats.js';
  import { GAMES } from '$lib/games.js';
  import { t } from 'svelte-i18n';

  const MAX_NAME = 16;

  $: profileId = $page.params.id;
  $: profile   = $profilesStore.find(p => p.id === profileId) ?? null;

  // Redirect if profile not found (e.g., deleted)
  $: if (typeof window !== 'undefined' && $profilesStore.length > 0 && !profile) {
    goto(`${base}/stats`);
  }

  $: gStats    = globalStats($historyStore, profileId);
  $: gameIds   = playedGameIds($historyStore, profileId);
  $: games     = GAMES.filter(g => gameIds.includes(g.id));

  // Default tab: first game played, or 'historique'
  let tab = 'historique';
  $: if (games.length > 0 && tab === 'historique' && gameIds.length > 0) {
    // keep tab as-is after first assignment so user can navigate freely
  }

  // Set initial tab once games are known
  let initialTabSet = false;
  $: if (!initialTabSet && games.length > 0) {
    tab = games[0].id;
    initialTabSet = true;
  }

  $: currentGameStats = (tab !== 'historique' && gameIds.includes(tab))
    ? gameStats($historyStore, profileId, tab)
    : null;

  // History for this profile, newest first
  $: history = $historyStore
    .filter(e => e.players.some(p => p.profileId === profileId))
    .sort((a, b) => b.playedAt - a.playedAt);

  // ── Rename ───────────────────────────────────────────────────────────────
  let editing  = false;
  let editName = '';

  function startRename() {
    if (!profile) return;
    editName = profile.name;
    editing  = true;
  }

  function commitRename() {
    if (editName.trim()) renameProfile(profileId, editName.trim());
    editing = false;
  }

  function cancelRename() { editing = false; }

  // ── Helpers ──────────────────────────────────────────────────────────────
  $: locale = $t('nav.games') === 'Games' ? 'en-GB' : 'fr-FR';

  function fmtDate(ts) {
    return new Date(ts).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: '2-digit' });
  }

  function gameName(id) { return GAMES.find(g => g.id === id)?.name ?? id; }

  function playerNameInEntry(entry) {
    return entry.players.find(p => p.profileId === profileId)?.name ?? null;
  }

  function isWinner(entry) {
    const name = playerNameInEntry(entry);
    return name !== null && entry.winners.includes(name);
  }

  function entryScore(entry) {
    const name = playerNameInEntry(entry);
    if (!name) return null;
    const v = entry.scores?.[name];
    return v !== null && v !== undefined ? v : null;
  }
</script>

{#if profile}
<div id="player-detail">

  <!-- Header -->
  <div class="page-header">
    <button class="btn-back" on:click={() => goto(`${base}/stats`)}>‹</button>
    {#if editing}
      <input
        type="text"
        bind:value={editName}
        maxlength={MAX_NAME}
        class="name-input"
        on:keydown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') cancelRename(); }}
      />
      <button class="icon-btn icon-btn-green" on:click={commitRename} title={$t('players.validate')}>✓</button>
      <button class="icon-btn" on:click={cancelRename} title={$t('players.cancel')}>✕</button>
    {:else}
      <span class="player-name">{profile.name}</span>
      <button class="icon-btn" on:click={startRename} title={$t('players.rename')}>✏️</button>
    {/if}
  </div>

  <!-- Global summary -->
  <div class="summary-bar">
    <div class="summary-item">
      <div class="summary-value">{gStats.played}</div>
      <div class="summary-label">{$t('stats.detail.games')}</div>
    </div>
    <div class="summary-sep"></div>
    <div class="summary-item">
      <div class="summary-value">{gStats.won}</div>
      <div class="summary-label">{$t('stats.detail.wins')}</div>
    </div>
    <div class="summary-sep"></div>
    <div class="summary-item">
      <div class="summary-value">{gStats.winRate} %</div>
      <div class="summary-label">{$t('stats.detail.winRateBar')}</div>
    </div>
  </div>

  <!-- Tabs: one per game + Historique -->
  {#if games.length > 0}
    <div class="tabs-bar">
      {#each games as g}
        <button class="tab-btn" class:active={tab === g.id} on:click={() => tab = g.id}>
          {g.name}
        </button>
      {/each}
      <button class="tab-btn" class:active={tab === 'historique'} on:click={() => tab = 'historique'}>
        {$t('stats.detail.historyTab')}
      </button>
    </div>
  {/if}

  <!-- ── Historique ── -->
  {#if tab === 'historique'}
    <div class="tab-content">
      {#if history.length === 0}
        <div class="empty-state">{$t('stats.detail.noGames')}</div>
      {:else}
        <div class="history-list">
          {#each history as entry}
            {@const win = isWinner(entry)}
            {@const score = entryScore(entry)}
            <div class="history-row" class:win-row={win}>
              <span class="history-date">{fmtDate(entry.playedAt)}</span>
              <span class="history-game">{gameName(entry.gameId)}</span>
              {#if score !== null}
                <span class="history-score">{score}</span>
              {/if}
              <span class="history-result" class:result-win={win} class:result-loss={!win}>
                {win ? '✓' : '·'}
              </span>
            </div>
          {/each}
        </div>
      {/if}
    </div>

  <!-- ── Stats par jeu ── -->
  {:else if currentGameStats}
    <div class="tab-content">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">{currentGameStats.played}</div>
          <div class="stat-label">{$t('stats.detail.games')}</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{currentGameStats.won}</div>
          <div class="stat-label">{$t('stats.detail.wins')}</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{currentGameStats.lost}</div>
          <div class="stat-label">{$t('stats.detail.losses')}</div>
        </div>
        <div class="stat-card stat-card-wide">
          <div class="stat-value">{currentGameStats.winRate} %</div>
          <div class="stat-label">{$t('stats.detail.winRate')}</div>
        </div>
        {#if currentGameStats.maxScore !== null}
          <div class="stat-card">
            <div class="stat-value">{currentGameStats.maxScore}</div>
            <div class="stat-label">{$t('stats.gameScore.' + tab, { default: $t('stats.gameScore.default') })} {$t('stats.detail.max')}</div>
          </div>
        {/if}
        {#if currentGameStats.avgScore !== null}
          <div class="stat-card">
            <div class="stat-value">{currentGameStats.avgScore}</div>
            <div class="stat-label">{$t('stats.gameScore.' + tab, { default: $t('stats.gameScore.default') })} {$t('stats.detail.avg')}</div>
          </div>
        {/if}
        {#if currentGameStats.maxBreak !== null}
          <div class="stat-card">
            <div class="stat-value">{currentGameStats.maxBreak}</div>
            <div class="stat-label">{$t('stats.sort.maxBreak')}</div>
          </div>
        {/if}
        {#if currentGameStats.avgBreak !== null}
          <div class="stat-card">
            <div class="stat-value">{currentGameStats.avgBreak}</div>
            <div class="stat-label">{$t('stats.sort.avgBreak')}</div>
          </div>
        {/if}
      </div>
    </div>
  {/if}

</div>
{/if}

<style>
  #player-detail {
    width: var(--content-w, 92%);
    max-width: var(--content-max, 480px);
    padding-top: 10px;
    padding-bottom: 20px;
  }

  /* ── Header ── */
  .page-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 16px 4px 12px;
  }

  .btn-back {
    background: none;
    border: none;
    color: var(--color-gold);
    font-size: 28px;
    line-height: 1;
    cursor: pointer;
    padding: 4px 8px 4px 0;
    flex-shrink: 0;
    -webkit-tap-highlight-color: transparent;
  }

  .player-name {
    flex: 1;
    font-size: 22px;
    font-weight: bold;
    color: var(--color-gold);
    text-shadow: 0 0 14px rgba(var(--color-gold-rgb), 0.35);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .name-input {
    flex: 1;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(var(--color-gold-rgb), 0.5);
    border-radius: 10px;
    color: var(--color-gold);
    font-family: inherit;
    font-size: 18px;
    font-weight: bold;
    padding: 8px 12px;
    outline: none;
    min-width: 0;
  }

  .icon-btn {
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    padding: 4px;
    border-radius: 6px;
    opacity: 0.65;
    flex-shrink: 0;
    -webkit-tap-highlight-color: transparent;
    transition: opacity 0.12s;
  }

  .icon-btn:hover, .icon-btn:active { opacity: 1; }
  .icon-btn-green { color: #69db7c; }

  /* ── Summary bar ── */
  .summary-bar {
    display: flex;
    align-items: center;
    background: rgba(0, 0, 0, 0.25);
    border: 1px solid rgba(var(--color-text-rgb), 0.08);
    border-radius: 16px;
    padding: 14px 20px;
    margin-bottom: 18px;
    gap: 0;
  }

  .summary-item {
    flex: 1;
    text-align: center;
  }

  .summary-value {
    font-size: 22px;
    font-weight: bold;
    color: var(--color-gold);
    line-height: 1;
    margin-bottom: 4px;
  }

  .summary-label {
    font-size: 11px;
    color: rgba(var(--color-text-rgb), 0.45);
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }

  .summary-sep {
    width: 1px;
    height: 36px;
    background: rgba(var(--color-text-rgb), 0.1);
    flex-shrink: 0;
  }

  /* ── Tabs ── */
  .tabs-bar {
    display: flex;
    gap: 6px;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }

  .tab-btn {
    flex: 1;
    min-width: fit-content;
    padding: 9px 8px;
    border: 1px solid rgba(var(--color-text-rgb), 0.12);
    border-radius: 12px;
    background: rgba(0, 0, 0, 0.2);
    color: rgba(var(--color-text-rgb), 0.5);
    font-family: inherit;
    font-size: 12px;
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
  .tab-content { }

  /* ── Stats grid ── */
  .stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .stat-card {
    background: rgba(0, 0, 0, 0.25);
    border: 1px solid rgba(var(--color-text-rgb), 0.07);
    border-radius: 14px;
    padding: 14px 12px;
    text-align: center;
  }

  .stat-card-wide {
    grid-column: span 2;
  }

  .stat-value {
    font-size: 26px;
    font-weight: bold;
    color: var(--color-gold);
    line-height: 1;
    margin-bottom: 6px;
  }

  .stat-label {
    font-size: 11px;
    color: rgba(var(--color-text-rgb), 0.45);
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }

  /* ── History ── */
  .history-list {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .history-row {
    display: flex;
    align-items: center;
    gap: 10px;
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(var(--color-text-rgb), 0.06);
    border-radius: 10px;
    padding: 9px 12px;
    font-size: 13px;
  }

  .history-row.win-row {
    border-color: rgba(var(--color-gold-rgb), 0.2);
    background: rgba(var(--color-gold-rgb), 0.04);
  }

  .history-date {
    color: rgba(var(--color-text-rgb), 0.4);
    font-size: 11px;
    white-space: nowrap;
    flex-shrink: 0;
    min-width: 60px;
  }

  .history-game {
    flex: 1;
    color: rgba(var(--color-text-rgb), 0.8);
  }

  .history-score {
    color: rgba(var(--color-text-rgb), 0.5);
    font-size: 12px;
  }

  .history-result {
    font-size: 16px;
    flex-shrink: 0;
    width: 20px;
    text-align: center;
  }

  .result-win  { color: var(--color-gold); font-weight: bold; }
  .result-loss { color: rgba(var(--color-text-rgb), 0.2); }

  /* ── Empty state ── */
  .empty-state {
    text-align: center;
    color: rgba(var(--color-text-rgb), 0.35);
    font-size: 14px;
    padding: 32px 0;
    font-style: italic;
  }
</style>
