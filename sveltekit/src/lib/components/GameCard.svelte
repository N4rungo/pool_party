<!--
  Composant GameCard : carte de jeu sur le launcher.

  Usage :
    <GameCard {game} isFavorite={bool} on:rules={(e) => openRules(e.detail)} on:favorite={(e) => toggle(e.detail)} />

  - prop `game`       : objet { id, name, tagline, icon, ... } provenant de games.js
  - prop `isFavorite` : si le jeu est dans les favoris
  - événement `rules`    : émis avec l'id du jeu quand on clique sur 📖
  - événement `favorite` : émis avec l'id du jeu quand on clique sur ☆/★
  - le bouton ▶ Jouer fait directement la navigation via SvelteKit
-->
<script>
  import { base } from '$app/paths';
  import { createEventDispatcher } from 'svelte';

  export let game;
  export let isFavorite = false;

  const dispatch = createEventDispatcher();

  function openRules() {
    dispatch('rules', game.id);
  }

  function toggleFavorite() {
    dispatch('favorite', game.id);
  }
</script>

<div class="game-card available">
  <!-- Étoile favoris : coin haut-droit -->
  <button
    class="star-btn"
    class:is-favorite={isFavorite}
    on:click={toggleFavorite}
    aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}>
    {isFavorite ? '★' : '☆'}
  </button>

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
    position: relative;
    background: linear-gradient(145deg, rgba(255, 255, 255, 0.07), rgba(0, 0, 0, 0.2));
    border: 1px solid rgba(var(--color-gold-rgb), 0.3);
    border-radius: 20px;
    /* padding-right élargi pour laisser la zone de l'étoile sans chevaucher les actions */
    padding: 20px 40px 20px 22px;
    display: flex;
    align-items: center;
    gap: 18px;
    transition: border-color .15s, box-shadow .15s;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  }

  /* ── Étoile favoris ── */
  .star-btn {
    position: absolute;
    top: 8px;
    right: 10px;
    width: 26px;
    height: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    font-size: 16px;
    color: rgba(255, 255, 255, 0.2);
    cursor: pointer;
    padding: 0;
    line-height: 1;
    transition: color .15s, transform .1s;
    -webkit-tap-highlight-color: transparent;
  }
  .star-btn:hover {
    color: rgba(var(--color-gold-rgb), 0.7);
    transform: scale(1.15);
  }
  .star-btn.is-favorite {
    color: var(--color-gold);
  }
  .star-btn.is-favorite:hover {
    color: rgba(var(--color-gold-rgb), 0.7);
  }
  .star-btn:active { transform: scale(0.9); }

  /* ── Icône ── */
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

  /* ── Infos ── */
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

  /* ── Actions ── */
  .game-card-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  /* ── Tablette / Desktop ── */
  @media (min-width: 700px) {
    .game-card {
      padding: 22px 46px 22px 26px;
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
    .star-btn {
      top: 10px;
      right: 12px;
      font-size: 17px;
      width: 28px;
      height: 28px;
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
    box-shadow: 0 3px 0 rgba(0, 0, 0, 0.3);
    padding: 0 12px;
  }
  .btn-card-rules:hover { background: rgba(255, 255, 255, 0.14); }
  .btn-card-rules:active {
    transform: translateY(3px);
    box-shadow: none;
  }

  .btn-card-play {
    background: linear-gradient(145deg, var(--color-gold-light), var(--color-gold));
    border: 1px solid transparent;
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
