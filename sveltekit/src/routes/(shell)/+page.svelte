<script>
  import { base } from '$app/paths';
  import GameCard from '$lib/components/GameCard.svelte';
  import RulesViewer from '$lib/components/RulesViewer.svelte';
  import { GAMES, CATEGORIES } from '$lib/games.js';
  import { favorites } from '$lib/stores/favorites.js';

  let rulesOpen = false;
  let rulesGameId = null;
  let playerFilter = 0;

  $: favIds = $favorites;

  $: visibleGames = playerFilter === 0
    ? GAMES
    : GAMES.filter(g => g.minPlayers <= playerFilter && g.maxPlayers >= playerFilter);

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

  function decFilter() {
    playerFilter = playerFilter <= 2 ? 0 : playerFilter - 1;
  }
  function incFilter() {
    playerFilter = playerFilter === 0 ? 2 : Math.min(15, playerFilter + 1);
  }
</script>

<div id="launcher">

  <!-- Filtre joueurs -->
  <div class="player-filter">
    <span class="pf-label">Joueurs</span>
    <div class="pf-control">
      <button class="pf-btn" on:click={decFilter} disabled={playerFilter === 0}>−</button>
      <span class="pf-value" class:active={playerFilter > 0}>
        {playerFilter === 0 ? '—' : playerFilter}
      </span>
      <button class="pf-btn" on:click={incFilter} disabled={playerFilter === 15}>+</button>
    </div>
    {#if playerFilter > 0}
      <button class="pf-reset" on:click={() => playerFilter = 0}>Tous</button>
    {/if}
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
  {#each sections as section (section.id)}
    <div class="section-header" class:first={favGames.length === 0 && section.id === sections[0]?.id}>
      <span class="section-label">{section.label}</span>
    </div>
    <div class="games-list">
      {#each section.games as game (game.id)}
        <GameCard {game} isFavorite={favIds.includes(game.id)} on:rules={showRules} on:favorite={onFavorite} />
      {/each}
    </div>
  {/each}

  <!-- Carte "Bientôt" -->
  {#if playerFilter === 0}
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

<RulesViewer gameId={rulesGameId} open={rulesOpen} on:close={() => rulesOpen = false} />

<style>
  #launcher {
    width: var(--content-w, 92%);
    max-width: var(--content-max, 480px);
    padding-top: 16px;
    padding-bottom: 8px;
  }

  /* ── Filtre joueurs ── */
  .player-filter {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-bottom: 24px;
    min-height: 36px;
  }

  .pf-label {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.35);
    text-transform: uppercase;
    letter-spacing: 1.5px;
  }

  .pf-control {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .pf-btn {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.15);
    background: rgba(255, 255, 255, 0.06);
    color: rgba(255, 255, 255, 0.7);
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    transition: background .15s, border-color .15s;
    -webkit-tap-highlight-color: transparent;
  }
  .pf-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(var(--color-gold-rgb), 0.5);
  }
  .pf-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .pf-value {
    font-size: 16px;
    font-weight: bold;
    color: rgba(255, 255, 255, 0.25);
    min-width: 24px;
    text-align: center;
    transition: color .15s;
  }
  .pf-value.active {
    color: var(--color-gold);
    text-shadow: 0 0 12px rgba(var(--color-gold-rgb), 0.4);
  }

  .pf-reset {
    font-size: 11px;
    background: none;
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: rgba(255, 255, 255, 0.45);
    border-radius: 20px;
    padding: 3px 10px;
    cursor: pointer;
    font-family: inherit;
    letter-spacing: 0.5px;
    transition: background .15s, color .15s;
    -webkit-tap-highlight-color: transparent;
  }
  .pf-reset:hover {
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.7);
  }

  /* ── En-têtes de section ── */
  .section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 24px;
    margin-bottom: 12px;
  }
  .section-header.first {
    margin-top: 0;
  }

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
</style>
