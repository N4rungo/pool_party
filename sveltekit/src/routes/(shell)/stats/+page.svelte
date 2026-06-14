<script>
  import { base } from '$app/paths';
  import { goto } from '$app/navigation';
  import { profilesStore } from '$lib/stores/profiles.js';
  import { historyStore, PERIODS, filterByPeriod } from '$lib/stores/history.js';
  import {
    globalLeaderboard, gameLeaderboard,
    GAME_SORT_OPTIONS,
  } from '$lib/utils/stats.js';
  import { GAMES } from '$lib/games.js';
  import { t } from 'svelte-i18n';

  let tab = 'global';

  // ── Global ──────────────────────────────────────────────────────────────
  let globalPeriodId = 'all';
  let globalSortBy   = 'won';

  $: globalHistory = filterByPeriod($historyStore, globalPeriodId);
  $: globalBoard   = globalLeaderboard(globalHistory, $profilesStore, globalSortBy);

  // ── Par jeu ─────────────────────────────────────────────────────────────
  let jeuPeriodId    = 'all';
  let selectedGameId = GAMES[0].id;
  let gameSortBy     = 'won';

  $: jeuHistory      = filterByPeriod($historyStore, jeuPeriodId);
  $: gameBoard       = gameLeaderboard(jeuHistory, $profilesStore, selectedGameId, gameSortBy);
  $: gameSortOptions = GAME_SORT_OPTIONS[selectedGameId] ?? ['won', 'played', 'winRate'];
  $: { if (!gameSortOptions.includes(gameSortBy)) gameSortBy = gameSortOptions[0]; }

  // ── Helpers ─────────────────────────────────────────────────────────────
  $: PERIOD_SHORT = {
    '7d': $t('stats.periods.7d'), '30d': $t('stats.periods.30d'),
    '6m': $t('stats.periods.6m'), 'all': $t('stats.periods.all'),
  };

  function statLabel(sortBy, stats) {
    if (sortBy === 'winRate') return $t('stats.statLabel.winRate', { values: { rate: stats.winRate } });
    if (sortBy === 'won')     return $t('stats.statLabel.won',     { values: { count: stats.won } });
    if (sortBy === 'played')  return $t('stats.statLabel.played',  { values: { count: stats.played } });
    const v = stats[sortBy];
    return v !== null && v !== undefined ? String(v) : '—';
  }
</script>

<div class="page">

  <div class="tabs-bar">
    <button class="tab-btn" class:active={tab === 'global'} on:click={() => tab = 'global'}>{$t('stats.global')}</button>
    <button class="tab-btn" class:active={tab === 'jeux'}   on:click={() => tab = 'jeux'}>{$t('stats.byGame')}</button>
  </div>

  <!-- ══ GLOBAL ══ -->
  {#if tab === 'global'}
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
            on:click={() => globalSortBy = s}>{$t('stats.sort.' + s)}</button>
        {/each}
      </div>
    </div>

    {#if globalBoard.length === 0}
      <div class="empty-state">{$t('stats.noStats')}</div>
    {:else}
      <div class="leaderboard">
        {#each globalBoard as row, i}
          <button class="lb-row" on:click={() => goto(`${base}/stats/${row.profile.id}`)}>
            <span class="lb-rank" class:lb-rank-top={i < 3}>{i + 1}</span>
            <span class="lb-name">{row.profile.name}</span>
            <span class="lb-stat">{statLabel(globalSortBy, row.stats)}</span>
            <span class="lb-arrow">›</span>
          </button>
        {/each}
      </div>
    {/if}

  <!-- ══ PAR JEU ══ -->
  {:else}
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
            on:click={() => gameSortBy = s}>{$t('stats.sort.' + s)}</button>
        {/each}
      </div>
    </div>

    {#if gameBoard.length === 0}
      <div class="empty-state">{$t('stats.noStatsGame')}</div>
    {:else}
      <div class="leaderboard">
        {#each gameBoard as row, i}
          <button class="lb-row" on:click={() => goto(`${base}/stats/${row.profile.id}`)}>
            <span class="lb-rank" class:lb-rank-top={i < 3}>{i + 1}</span>
            <span class="lb-name">{row.profile.name}</span>
            <span class="lb-stat">{statLabel(gameSortBy, row.stats)}</span>
            <span class="lb-arrow">›</span>
          </button>
        {/each}
      </div>
    {/if}
  {/if}

</div>

<style>
  .page {
    width: var(--content-w, 92%);
    max-width: var(--content-max, 480px);
    padding-top: 16px;
    padding-bottom: 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .tabs-bar {
    display: flex;
    gap: 6px;
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

  .filters-row {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .pill-group {
    display: flex;
    gap: 6px;
  }

  .pill-group.wrap { flex-wrap: wrap; }

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

  .leaderboard {
    display: flex;
    flex-direction: column;
    gap: 6px;
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
    -webkit-tap-highlight-color: transparent;
    transition: background 0.12s;
  }

  .lb-row:active { background: rgba(0, 0, 0, 0.35); }

  .lb-rank {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.35);
    width: 20px;
    text-align: center;
    flex-shrink: 0;
  }

  .lb-rank.lb-rank-top { color: var(--color-gold); font-weight: bold; }
  .lb-name  { flex: 1; font-size: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .lb-stat  { font-size: 13px; color: rgba(255, 255, 255, 0.6); white-space: nowrap; }
  .lb-arrow { font-size: 16px; color: rgba(255, 255, 255, 0.25); flex-shrink: 0; }

  .empty-state {
    text-align: center;
    color: rgba(255, 255, 255, 0.35);
    font-size: 14px;
    padding: 32px 0;
    font-style: italic;
  }
</style>
