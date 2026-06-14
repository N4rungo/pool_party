<script>
  import { base } from '$app/paths';
  import GameCard from '$lib/components/GameCard.svelte';
  import RulesViewer from '$lib/components/RulesViewer.svelte';
  import { GAMES, CATEGORIES, TABLE_TYPES } from '$lib/games.js';
  import { favorites } from '$lib/stores/favorites.js';

  let rulesOpen = false;
  let rulesGameId = null;

  // ── Filtres ───────────────────────────────────────────
  let playerFilter = 0;     // 0 = tous
  let tableFilter  = null;  // null = tous
  let filterOpen   = false;

  $: isFilterActive = playerFilter > 0 || tableFilter !== null;

  function openFilter() {
    filterOpen = true;
  }

  function closeFilter() {
    filterOpen = false;
  }

  function resetFilter() {
    playerFilter = 0;
    tableFilter  = null;
    filterOpen   = false;
  }

  function decFilter() {
    if (playerFilter === 0) return;
    playerFilter = playerFilter <= 2 ? 0 : playerFilter - 1;
  }
  function incFilter() {
    playerFilter = playerFilter === 0 ? 2 : Math.min(15, playerFilter + 1);
  }

  // ── Jeux filtrés & sections ───────────────────────────
  $: favIds = $favorites;

  $: visibleGames = GAMES.filter(g => {
    if (playerFilter > 0 && (g.minPlayers > playerFilter || g.maxPlayers < playerFilter)) return false;
    if (tableFilter !== null && !g.tableTypes.includes(tableFilter)) return false;
    return true;
  });

  $: favGames = visibleGames.filter(g => favIds.includes(g.id));

  $: sections = CATEGORIES.map(cat => ({
    ...cat,
    games: visibleGames.filter(g => g.category === cat.id && !favIds.includes(g.id)),
  })).filter(s => s.games.length > 0);

  function showRules(event) {
    rulesGameId = event.detail;
    rulesOpen = true;
  }

  function onFavorite(event) {
    favorites.toggle(event.detail);
  }
</script>

<div id="launcher">

  <!-- Bouton filtre -->
  <div class="filter-row">
    <button
      class="filter-chip"
      class:active={isFilterActive}
      on:click={openFilter}
      aria-label="Filtres">
      <!-- Icône sliders -->
      <svg width="14" height="14" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="flex-shrink:0">
        <rect x="1"  y="1"  width="1.8" height="13" rx="0.9" fill="currentColor"/>
        <rect x="6.1" y="1" width="1.8" height="13" rx="0.9" fill="currentColor"/>
        <rect x="11.2" y="1" width="1.8" height="13" rx="0.9" fill="currentColor"/>
        <circle cx="1.9"  cy="9"  r="2.4" fill="currentColor"/>
        <circle cx="7"    cy="5"  r="2.4" fill="currentColor"/>
        <circle cx="12.1" cy="10.5" r="2.4" fill="currentColor"/>
      </svg>
      <span class="filter-label">On joue à quoi ?</span>
      {#if isFilterActive}
        <span class="filter-dot"></span>
      {/if}
    </button>
  </div>

  <!-- Section Favoris -->
  {#if favGames.length > 0}
    <div class="section-header">
      <span class="section-icon">★</span>
      <span class="section-label">Favoris</span>
    </div>
    <div class="games-list">
      {#each favGames as game (game.id)}
        <GameCard {game} isFavorite={true} on:rules={showRules} on:favorite={onFavorite} />
      {/each}
    </div>
  {/if}

  <!-- Sections par catégorie -->
  {#each sections as section, si (section.id)}
    <div class="section-header" class:first={favGames.length === 0 && si === 0}>
      <span class="section-label">{section.label}</span>
    </div>
    <div class="games-list">
      {#each section.games as game (game.id)}
        <GameCard {game} isFavorite={favIds.includes(game.id)} on:rules={showRules} on:favorite={onFavorite} />
      {/each}
    </div>
  {/each}

  <!-- Carte "Bientôt" -->
  {#if !isFilterActive}
    <div class="game-card unavailable">
      <div class="game-icon">🚧</div>
      <div class="game-info">
        <div class="game-name">Bientôt</div>
        <div class="game-tagline">Soyez patient...</div>
      </div>
      <div class="game-arrow">Bientôt</div>
    </div>
  {/if}

</div>

<!-- ── Overlay filtres ── -->
{#if filterOpen}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="filter-overlay" on:click|self={closeFilter}>
    <div class="filter-panel">

      <!-- Nombre de joueurs -->
      <div class="fp-section-title">Nombre de joueurs</div>
      <div class="fp-control">
        <button class="fp-btn" on:click={decFilter} disabled={playerFilter === 0}>−</button>
        <span class="fp-value" class:muted={playerFilter === 0}>{playerFilter === 0 ? '—' : playerFilter}</span>
        <button class="fp-btn" on:click={incFilter} disabled={playerFilter >= 15}>+</button>
      </div>

      <div class="fp-divider"></div>

      <!-- Type de table -->
      <div class="fp-section-title">Type de table</div>
      <div class="fp-chips">
        {#each TABLE_TYPES as tt}
          <button
            class="fp-type-chip"
            class:active={tableFilter === tt.id}
            on:click={() => tableFilter = tableFilter === tt.id ? null : tt.id}>
            {tt.label}
          </button>
        {/each}
      </div>

      <button class="fp-reset" on:click={resetFilter}>Tous les jeux</button>
      <button class="fp-confirm" on:click={closeFilter}>Voir les jeux</button>
    </div>
  </div>
{/if}

<RulesViewer gameId={rulesGameId} open={rulesOpen} on:close={() => rulesOpen = false} />

<style>
  #launcher {
    width: var(--content-w, 92%);
    max-width: var(--content-max, 480px);
    padding-top: 16px;
    padding-bottom: 8px;
  }

  /* ── Filtre chip ── */
  .filter-row {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 20px;
  }

  .filter-chip {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    height: 32px;
    padding: 0 12px 0 10px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: rgba(255, 255, 255, 0.35);
    border-radius: 20px;
    cursor: pointer;
    transition: background .15s, color .15s, border-color .15s;
    -webkit-tap-highlight-color: transparent;
  }

  .filter-label {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.3px;
    white-space: nowrap;
  }
  .filter-chip:hover {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.65);
  }
  .filter-chip.active {
    background: rgba(var(--color-gold-rgb), 0.1);
    border-color: rgba(var(--color-gold-rgb), 0.5);
    color: var(--color-gold);
  }

  /* Indicateur point actif */
  .filter-dot {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--color-gold);
  }

  /* ── En-têtes de section ── */
  .section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 24px;
    margin-bottom: 12px;
  }
  .section-header.first { margin-top: 0; }

  .section-icon {
    font-size: 13px;
    color: var(--color-gold);
    opacity: 0.8;
  }

  .section-label {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.35);
    text-transform: uppercase;
    letter-spacing: 2px;
    font-weight: 600;
  }

  .section-header::after {
    content: '';
    flex: 1;
    height: 1px;
    background: rgba(255, 255, 255, 0.07);
  }

  /* ── Liste de jeux ── */
  .games-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  @media (min-width: 700px) {
    .games-list {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
  }

  /* ── Carte "Bientôt" ── */
  .game-card.unavailable {
    margin-top: 24px;
    background: linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(0, 0, 0, 0.2));
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    padding: 20px 22px;
    display: flex;
    align-items: center;
    gap: 18px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
    opacity: 0.5;
  }

  .game-card.unavailable .game-icon {
    font-size: 42px;
    min-width: 52px;
    text-align: center;
  }

  .game-card.unavailable .game-info { flex: 1; }

  .game-card.unavailable .game-name {
    font-size: 20px;
    font-weight: bold;
    color: rgba(255, 255, 255, 0.6);
    margin-bottom: 4px;
  }

  .game-card.unavailable .game-tagline {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.4);
    font-style: italic;
  }

  .game-card.unavailable .game-arrow {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.25);
    font-style: italic;
  }

  /* ── Overlay filtres ── */
  .filter-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.55);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
  }

  .filter-panel {
    background: linear-gradient(160deg, #1e5c34, #143d24);
    border: 1px solid rgba(var(--color-gold-rgb), 0.5);
    border-radius: 20px;
    padding: 24px 28px;
    text-align: center;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    min-width: 240px;
  }

  .fp-section-title {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.45);
    text-transform: uppercase;
    letter-spacing: 1.5px;
    font-weight: 600;
  }

  /* Nombre de joueurs */
  .fp-control {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .fp-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: none;
    background: linear-gradient(145deg, var(--color-gold-light), var(--color-gold));
    color: var(--color-pool);
    font-size: 22px;
    font-weight: bold;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    box-shadow: 0 3px 0 var(--color-gold-dark);
    transition: transform .1s, box-shadow .1s, opacity .15s;
    -webkit-tap-highlight-color: transparent;
  }
  .fp-btn:active:not(:disabled) {
    transform: translateY(2px);
    box-shadow: none;
  }
  .fp-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .fp-value {
    font-size: 40px;
    font-weight: bold;
    color: var(--color-gold);
    text-shadow: 0 0 20px rgba(var(--color-gold-rgb), 0.4);
    min-width: 52px;
    text-align: center;
    line-height: 1;
    transition: color .15s;
  }
  .fp-value.muted {
    color: rgba(255, 255, 255, 0.25);
    text-shadow: none;
  }

  /* Séparateur */
  .fp-divider {
    width: 100%;
    height: 1px;
    background: rgba(255, 255, 255, 0.08);
  }

  /* Type de table */
  .fp-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
  }

  .fp-type-chip {
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.14);
    color: rgba(255, 255, 255, 0.55);
    border-radius: 20px;
    padding: 6px 14px;
    cursor: pointer;
    transition: background .15s, color .15s, border-color .15s;
    -webkit-tap-highlight-color: transparent;
  }
  .fp-type-chip:hover {
    background: rgba(255, 255, 255, 0.12);
    color: rgba(255, 255, 255, 0.85);
  }
  .fp-type-chip.active {
    background: rgba(var(--color-gold-rgb), 0.15);
    border-color: rgba(var(--color-gold-rgb), 0.6);
    color: var(--color-gold);
  }

  /* Reset */
  .fp-confirm {
    width: 100%;
    font-family: inherit;
    font-size: 15px;
    font-weight: bold;
    background: linear-gradient(145deg, var(--color-gold-light), var(--color-gold));
    border: none;
    color: var(--color-pool);
    border-radius: 14px;
    padding: 12px 0;
    cursor: pointer;
    box-shadow: 0 3px 0 var(--color-gold-dark);
    transition: transform .1s, box-shadow .1s;
    -webkit-tap-highlight-color: transparent;
  }
  .fp-confirm:active {
    transform: translateY(2px);
    box-shadow: none;
  }

  .fp-reset {
    font-family: inherit;
    font-size: 12px;
    background: none;
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: rgba(255, 255, 255, 0.4);
    border-radius: 20px;
    padding: 5px 16px;
    cursor: pointer;
    transition: background .15s, color .15s;
    -webkit-tap-highlight-color: transparent;
  }
  .fp-reset:hover {
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.7);
  }
</style>
