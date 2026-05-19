<!--
  Composant GameCard : carte de jeu sur le launcher.

  Usage :
    <GameCard {game} on:rules={(e) => openRules(e.detail)} />

  - prop `game` : objet { id, name, tagline, icon } provenant de games.js
  - événement `rules` : émis avec l'id du jeu quand on clique sur 📖
  - le bouton ▶ Jouer fait directement la navigation via SvelteKit
-->
<script>
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { createEventDispatcher } from 'svelte';

  export let game;

  const dispatch = createEventDispatcher();

  function play() {
    goto(`${base}/${game.id}`);
  }

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
    <button class="btn-card-play" on:click={play}>▶ Jouer</button>
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

  .game-card.available:hover {
    border-color: var(--color-gold);
    box-shadow: 0 0 24px rgba(var(--color-gold-rgb), 0.15),
                0 4px 16px rgba(0, 0, 0, 0.3);
  }

  .game-icon {
    font-size: 42px;
    min-width: clamp(38px, 11vw, 52px);
    text-align: center;
    filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.4));
    flex-shrink: 0;
  }

  .game-icon img {
    width: clamp(40px, 12vw, 54px);
    height: clamp(40px, 12vw, 54px);
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

  /* ── Tablette (colonnes étroites ~310px) ── */
  @media (min-width: 700px) and (max-width: 1099px) {
    .game-card {
      flex-wrap: wrap;
      column-gap: 12px;
      row-gap: 8px;
      padding: 14px 16px;
      align-items: flex-start;
    }
    .game-icon {
      min-width: 36px;
    }
    .game-icon img {
      width: 36px;
      height: 36px;
    }
    .game-info {
      /* Prend toute la largeur restante de la première ligne */
      flex: 1;
    }
    .game-name {
      white-space: normal;
      font-size: 15px;
      line-height: 1.25;
      overflow: visible;
      text-overflow: unset;
    }
    .game-tagline {
      font-size: 12px;
      -webkit-line-clamp: 1;
    }
    .game-card-actions {
      /* Passe sur une nouvelle ligne, aligné à droite */
      flex-basis: 100%;
      justify-content: flex-end;
    }
  }

  .btn-card-rules,
  .btn-card-play {
    border: none;
    border-radius: 12px;
    font-family: inherit;
    font-weight: bold;
    cursor: pointer;
    transition: transform .1s, box-shadow .1s, opacity .15s;
    -webkit-tap-highlight-color: transparent;
  }

  .btn-card-rules {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: rgba(255, 255, 255, 0.85);
    padding: 10px 12px;
    font-size: 16px;
    line-height: 1;
  }
  .btn-card-rules:hover { background: rgba(255, 255, 255, 0.14); }

  .btn-card-play {
    background: linear-gradient(145deg, var(--color-gold-light), var(--color-gold));
    color: var(--color-pool);
    box-shadow: 0 3px 0 var(--color-gold-dark);
    padding: 10px 14px;
    font-size: 14px;
    letter-spacing: 0.5px;
  }
  .btn-card-play:active {
    transform: translateY(2px);
    box-shadow: none;
  }
</style>
