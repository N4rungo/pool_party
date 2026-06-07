<!--
  Composant GameCard : carte de jeu sur le launcher.

  Usage :
    <GameCard {game} on:rules={(e) => openRules(e.detail)} />

  - prop `game` : objet { id, name, tagline, icon } provenant de games.js
  - événement `rules` : émis avec l'id du jeu quand on clique sur 📖
  - le bouton ▶ Jouer fait directement la navigation via SvelteKit
-->
<script>
  import { base } from '$app/paths';
  import { createEventDispatcher } from 'svelte';

  export let game;

  const dispatch = createEventDispatcher();

  function openRules() {
    dispatch('rules', game.id);
  }
</script>

<div class="game-card available">
  <div class="game-icon">
    <img src="{base}{game.icon}" alt={game.name} />
  </div>
  <div class="game-info">
    <div class="game-name">{game.name}</div>
    <div class="game-tagline">{game.tagline}</div>
  </div>
  <div class="game-card-actions">
    <button class="btn-card-rules" on:click={openRules} aria-label="Règles">📖</button>
    <a class="btn-card-play" href="{base}/{game.id}">▶</a>
  </div>
</div>

<style>
  .game-card {
    background: linear-gradient(145deg, rgba(255, 255, 255, 0.07), rgba(0, 0, 0, 0.2));
    border: 1px solid rgba(var(--color-gold-rgb), 0.3);
    border-radius: 20px;
    padding: 20px 22px;
    display: flex;
    align-items: center;
    gap: 18px;
    transition: border-color .15s, box-shadow .15s;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  }

  .game-icon {
    width: clamp(44px, 13vw, 56px);
    height: clamp(44px, 13vw, 56px);
    display: flex;
    align-items: center;
    justify-content: center;
    filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.4));
    flex-shrink: 0;
  }

  .game-icon img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .game-info {
    flex: 1;
    min-width: 0;
  }

  .game-name {
    font-size: clamp(14px, 4.8vw, 20px);
    font-weight: bold;
    color: var(--color-gold);
    text-shadow: 0 0 10px rgba(var(--color-gold-rgb), 0.3);
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .game-tagline {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.5);
    font-style: italic;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .game-card-actions {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
  }

  /* ── Tablette / Desktop : les cartes s'élargissent avec le launcher ── */
  @media (min-width: 700px) {
    .game-card {
      padding: 22px 26px;
      gap: 20px;
    }
    .game-icon img {
      width: clamp(50px, 5vw, 64px);
      height: clamp(50px, 5vw, 64px);
    }
    .game-name {
      font-size: clamp(16px, 1.8vw, 22px);
    }
    .btn-card-rules,
    .btn-card-play {
      height: 48px;
      min-width: 48px;
      font-size: 17px;
    }
  }

  .btn-card-rules,
  .btn-card-play {
    height: 44px;
    min-width: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    font-family: inherit;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    text-decoration: none;
    transition: transform .1s, box-shadow .1s, opacity .15s;
    -webkit-tap-highlight-color: transparent;
  }

  .btn-card-rules {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: rgba(255, 255, 255, 0.85);
    padding: 0 12px;
  }
  .btn-card-rules:hover { background: rgba(255, 255, 255, 0.14); }

  .btn-card-play {
    background: linear-gradient(145deg, var(--color-gold-light), var(--color-gold));
    border: none;
    color: var(--color-pool);
    box-shadow: 0 3px 0 var(--color-gold-dark);
    padding: 0 16px;
  }
  .btn-card-play:active {
    transform: translateY(3px);
    box-shadow: none;
  }
  .btn-card-play:visited {
    color: var(--color-pool);
  }
</style>
