<script>
  import { historyStore, PERIODS, deleteHistoryBefore, deleteHistoryForGame, clearAllHistory } from '$lib/stores/history.js';
  import { GAMES } from '$lib/games.js';
  import { askConfirm } from '$lib/stores/confirm.js';
  import FlagIcon from '$lib/components/FlagIcon.svelte';
  import { t, locale } from 'svelte-i18n';
  import { get } from 'svelte/store';
  import { setLang } from '$lib/i18n/index.js';
  import { themeStore, THEMES } from '$lib/stores/theme.js';

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

  // ── Accordéons ───────────────────────────────────────────────────────
  let themeOpen = false;
  let langOpen  = false;

  function selectTheme(id) {
    themeStore.set(id);
    themeOpen = false;
  }

  function selectLang(id) {
    setLang(id);
    langOpen = false;
  }

  $: currentTheme = THEMES.find(t => t.id === $themeStore) ?? THEMES[0];
  $: currentLang  = LANGS.find(l => l.id === $locale) ?? LANGS[0];

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

  <div class="setting-block setting-block-picker" class:open={themeOpen}>
    {#if !themeOpen}
      <!-- Thème actif — clic pour ouvrir -->
      <button
        class="picker-current"
        on:click={() => themeOpen = true}
        aria-label="Changer de thème"
      >
        <span class="color-rect" style="background:{currentTheme.pool}"></span>
        <span class="picker-label">{$t(`settings.themeNames.${currentTheme.id}`)}</span>
        <span class="picker-chevron">›</span>
      </button>
    {:else}
      <!-- Grille de tous les thèmes -->
      <div class="color-grid">
        {#each THEMES as theme}
          <button
            class="color-tile"
            class:selected={theme.id === $themeStore}
            on:click={() => selectTheme(theme.id)}
            aria-label={$t(`settings.themeNames.${theme.id}`)}
            style="background:{theme.pool}"
          >
            {#if theme.id === $themeStore}
              <span class="tile-check">✓</span>
            {/if}
            <span class="tile-label">{$t(`settings.themeNames.${theme.id}`)}</span>
          </button>
        {/each}
      </div>
      <button class="btn-action close-btn" on:click={() => themeOpen = false}>✕</button>
    {/if}
  </div>

  <!-- ── Langue ── -->
  <div class="section-label">{$t('settings.language')}</div>

  <div class="setting-block setting-block-picker" class:open={langOpen}>
    {#if !langOpen}
      <!-- Langue active — clic pour ouvrir -->
      <button
        class="picker-current"
        on:click={() => langOpen = true}
        aria-label="Changer de langue"
      >
        <FlagIcon lang={currentLang.id} size={32} />
        <span class="picker-label">{currentLang.label}</span>
        <span class="picker-chevron">›</span>
      </button>
    {:else}
      <!-- Toutes les langues -->
      <div class="lang-list">
        {#each LANGS as lang}
          <button
            class="lang-row"
            class:active={$locale === lang.id}
            on:click={() => selectLang(lang.id)}
            aria-pressed={$locale === lang.id}
          >
            <FlagIcon lang={lang.id} size={36} />
            <span class="lang-name">{lang.label}</span>
            {#if $locale === lang.id}
              <span class="lang-check">✓</span>
            {/if}
          </button>
        {/each}
      </div>
      <button class="btn-action close-btn" on:click={() => langOpen = false}>✕</button>
    {/if}
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
    color: rgba(var(--color-text-rgb), 0.4);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-top: 4px;
  }

  .setting-block {
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(var(--color-text-rgb), 0.07);
    border-radius: 14px;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .setting-block-danger {
    border-color: rgba(255, 80, 80, 0.45);
    background: rgba(255, 80, 80, 0.15);
  }

  /* ── Picker (thèmes & langue) ── */
  .setting-block-picker {
    padding: 10px;
  }

  .picker-current {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    background: none;
    border: none;
    cursor: pointer;
    font-family: inherit;
    color: white;
    padding: 4px 2px;
    -webkit-tap-highlight-color: transparent;
    text-align: left;
  }

  .picker-label {
    flex: 1;
    font-size: 15px;
    font-weight: 600;
  }

  .picker-chevron {
    font-size: 20px;
    color: rgba(var(--color-text-rgb), 0.35);
    line-height: 1;
    transition: transform 0.2s;
  }

  /* ── Thèmes : rectangle de couleur unique (collapsed) ── */
  .color-rect {
    width: 48px;
    height: 32px;
    border-radius: 8px;
    border: 2px solid rgba(var(--color-text-rgb), 0.25);
    flex-shrink: 0;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
  }

  /* ── Thèmes : grille de tuiles (expanded) ── */
  .color-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .color-tile {
    position: relative;
    height: 64px;
    border-radius: 10px;
    border: 2px solid rgba(255, 255, 255, 0.15);
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    padding-bottom: 6px;
    overflow: hidden;
    transition: border-color 0.15s, transform 0.1s;
    -webkit-tap-highlight-color: transparent;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  }

  .color-tile.selected {
    border-color: var(--color-gold);
    border-width: 2.5px;
  }

  .color-tile:active { transform: scale(0.95); }

  .tile-check {
    position: absolute;
    top: 6px;
    right: 8px;
    font-size: 14px;
    font-weight: bold;
    color: white;
    text-shadow: 0 1px 4px rgba(0, 0, 0, 1);
  }

  .tile-label {
    font-size: 11px;
    font-weight: bold;
    color: rgba(255, 255, 255, 0.92);
    text-shadow: 0 1px 5px rgba(0, 0, 0, 1), 0 0 8px rgba(0, 0, 0, 0.8);
    letter-spacing: 0.3px;
    text-transform: uppercase;
  }

  /* ── Langue ── */
  .lang-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .lang-row {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    background: rgba(0, 0, 0, 0.15);
    border: 1.5px solid rgba(var(--color-text-rgb), 0.08);
    border-radius: 10px;
    padding: 10px 12px;
    cursor: pointer;
    font-family: inherit;
    color: rgba(var(--color-text-rgb), 0.6);
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
    background: rgba(var(--color-text-rgb), 0.05);
    border-color: rgba(var(--color-text-rgb), 0.15);
    color: rgba(var(--color-text-rgb), 0.85);
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

  /* ── Commun ── */
  .setting-desc {
    font-size: 13px;
    color: rgba(var(--color-text-rgb), 0.6);
  }

  .pill-group {
    display: flex;
    gap: 6px;
  }

  .pill-group.wrap { flex-wrap: wrap; }

  .pill {
    padding: 6px 10px;
    border-radius: 20px;
    border: 1px solid rgba(var(--color-text-rgb), 0.15);
    background: rgba(0, 0, 0, 0.25);
    color: rgba(var(--color-text-rgb), 0.6);
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
    background: rgba(var(--color-text-rgb), 0.08);
    border: 1px solid rgba(var(--color-text-rgb), 0.15);
    border-radius: 10px;
    color: rgba(var(--color-text-rgb), 0.7);
    font-family: inherit;
    font-size: 13px;
    padding: 8px 16px;
    cursor: pointer;
    transition: background 0.12s;
    -webkit-tap-highlight-color: transparent;
  }

  .btn-action:hover { background: rgba(var(--color-text-rgb), 0.12); }

  .close-btn {
    align-self: center;
    margin-top: 2px;
  }

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
