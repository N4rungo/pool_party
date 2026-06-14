<script>
  import { historyStore, PERIODS, deleteHistoryBefore, deleteHistoryForGame, clearAllHistory } from '$lib/stores/history.js';
  import { GAMES } from '$lib/games.js';
  import { askConfirm } from '$lib/stores/confirm.js';
  import FlagIcon from '$lib/components/FlagIcon.svelte';
  import { t, locale } from 'svelte-i18n';
  import { get } from 'svelte/store';
  import { setLang } from '$lib/i18n/index.js';

  const LANGS = [
    { id: 'fr', label: 'Français' },
    { id: 'en', label: 'English'  },
  ];

  // ── Nettoyage par ancienneté ─────────────────────────────────────────
  let cleanPeriodId = '30d';

  async function handleClearBefore() {
    const $t = get(t);
    const period = PERIODS.find(p => p.id === cleanPeriodId);
    if (!period?.days) return;
    const cutoff = Date.now() - period.days * 24 * 60 * 60 * 1000;
    const count = $historyStore.filter(e => e.playedAt < cutoff).length;
    if (!count) return;
    if (await askConfirm($t('settings.confirmDeleteBefore', { values: { count, period: period.label.toLowerCase() } }), {
      icon: '📅', confirmLabel: $t('settings.delete'), cancelLabel: $t('common.cancel'),
    })) {
      deleteHistoryBefore(cutoff);
    }
  }

  // ── Nettoyage par jeu ────────────────────────────────────────────────
  let cleanGameId = GAMES[0].id;

  async function handleClearGame() {
    const $t = get(t);
    const game  = GAMES.find(g => g.id === cleanGameId);
    const count = $historyStore.filter(e => e.gameId === cleanGameId).length;
    if (!count) return;
    if (await askConfirm($t('settings.confirmDeleteGame', { values: { count, game: game?.name } }), {
      icon: '🎱', confirmLabel: $t('settings.delete'), cancelLabel: $t('common.cancel'),
    })) {
      deleteHistoryForGame(cleanGameId);
    }
  }

  // ── Tout effacer ─────────────────────────────────────────────────────
  async function handleClearAll() {
    const $t = get(t);
    const count = $historyStore.length;
    if (!count) return;
    if (await askConfirm($t('settings.confirmDeleteAll', { values: { count, s: count > 1 ? 's' : '' } }), {
      icon: '💥', confirmLabel: $t('settings.confirmDeleteAllBtn'), cancelLabel: $t('common.cancel'),
    })) {
      clearAllHistory();
    }
  }

  $: PERIOD_SHORT = {
    '7d': $t('stats.periods.7d'), '30d': $t('stats.periods.30d'),
    '6m': $t('stats.periods.6m'), 'all': $t('stats.periods.all'),
  };
</script>

<div class="page">

  <!-- ── Historique ── -->
  <div class="section-label">{$t('settings.history')}</div>

  <div class="setting-block">
    <div class="setting-desc">{$t('settings.deleteOlderThan')}</div>
    <div class="pill-group">
      {#each PERIODS.filter(p => p.days) as p}
        <button class="pill" class:active={cleanPeriodId === p.id}
          on:click={() => cleanPeriodId = p.id}>{PERIOD_SHORT[p.id]}</button>
      {/each}
    </div>
    <button class="btn-action" on:click={handleClearBefore}>{$t('settings.delete')}</button>
  </div>

  <div class="setting-block">
    <div class="setting-desc">{$t('settings.deleteByGame')}</div>
    <div class="pill-group wrap">
      {#each GAMES as g}
        <button class="pill" class:active={cleanGameId === g.id}
          on:click={() => cleanGameId = g.id}>{g.name}</button>
      {/each}
    </div>
    <button class="btn-action" on:click={handleClearGame}>{$t('settings.delete')}</button>
  </div>

  <div class="setting-block setting-block-danger">
    <button class="btn-danger" on:click={handleClearAll}>{$t('settings.deleteAll')}</button>
  </div>

  <!-- ── Thèmes ── -->
  <div class="section-label" style="margin-top: 12px">{$t('settings.themes')}</div>
  <div class="setting-block setting-block-soon">
    <span class="soon-icon">🎨</span>
    <span class="soon-text">{$t('settings.comingSoon')}</span>
  </div>

  <!-- ── Langue ── -->
  <div class="section-label">{$t('settings.language')}</div>
  <div class="setting-block setting-block-lang">
    {#each LANGS as lang}
      <button
        class="lang-row"
        class:active={$locale === lang.id}
        on:click={() => setLang(lang.id)}
        aria-pressed={$locale === lang.id}
      >
        <FlagIcon lang={lang.id} size={40} />
        <span class="lang-name">{lang.label}</span>
        {#if $locale === lang.id}
          <span class="lang-check">✓</span>
        {/if}
      </button>
    {/each}
  </div>

</div>

<style>
  .page {
    width: var(--content-w, 92%);
    max-width: var(--content-max, 480px);
    padding-top: 20px;
    padding-bottom: 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .section-label {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.4);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-top: 4px;
  }

  .setting-block {
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 14px;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .setting-block-danger {
    border-color: rgba(255, 80, 80, 0.2);
    background: rgba(255, 80, 80, 0.05);
  }

  .setting-block-soon {
    flex-direction: row;
    align-items: center;
    gap: 10px;
    opacity: 0.5;
  }

  .setting-desc {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.6);
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

  .btn-action {
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

  .btn-action:hover { background: rgba(255, 255, 255, 0.12); }

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

  .soon-icon { font-size: 20px; }
  .soon-text {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.5);
    font-style: italic;
  }

  /* ── Langue ── */
  .setting-block-lang {
    gap: 6px;
    padding: 10px;
  }

  .lang-row {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    background: rgba(0, 0, 0, 0.15);
    border: 1.5px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    padding: 10px 12px;
    cursor: pointer;
    font-family: inherit;
    color: rgba(255, 255, 255, 0.6);
    transition: background 0.12s, border-color 0.12s, color 0.12s;
    -webkit-tap-highlight-color: transparent;
    text-align: left;
  }

  .lang-row.active {
    background: rgba(var(--color-gold-rgb), 0.12);
    border-color: rgba(var(--color-gold-rgb), 0.5);
    color: var(--color-gold);
  }

  .lang-row:not(.active):hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.15);
    color: rgba(255, 255, 255, 0.85);
  }

  .lang-name {
    flex: 1;
    font-size: 15px;
    font-weight: 600;
  }

  .lang-check {
    font-size: 16px;
    color: var(--color-gold);
  }
</style>
