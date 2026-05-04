<!--
  Page d'accueil = Launcher.

  Affiche le titre, les 7 cartes de jeu (générées par boucle depuis games.js)
  et gère l'overlay des règles (un seul, partagé entre toutes les cartes).
-->
<script>
  import GameCard from '$lib/components/GameCard.svelte';
  import RulesViewer from '$lib/components/RulesViewer.svelte';
  import { GAMES } from '$lib/games.js';

  // État local : règles ouvertes ou non, et pour quel jeu
  let rulesOpen = false;
  let rulesGameId = null;

  function showRules(event) {
    rulesGameId = event.detail;
    rulesOpen = true;
  }

  function closeRules() {
    rulesOpen = false;
  }
</script>

<div id="launcher">
  <h1>
    <img src="/assets/pool_party.png" alt="" class="icon-title" />
    POOL PARTY
  </h1>
  <div class="launcher-subtitle">Choisissez votre jeu</div>

  <div class="games-list">
    {#each GAMES as game (game.id)}
      <GameCard {game} on:rules={showRules} />
    {/each}

    <div class="game-card unavailable">
      <div class="game-icon">🚧</div>
      <div class="game-info">
        <div class="game-name">Soon</div>
        <div class="game-tagline">Please wait...</div>
      </div>
      <div class="game-arrow">Bientôt</div>
    </div>
  </div>
</div>

<RulesViewer gameId={rulesGameId} open={rulesOpen} on:close={closeRules} />

<style>
  #launcher {
    width: 92%;
    max-width: 480px;
    padding-top: 10px;
  }

  .launcher-subtitle {
    text-align: center;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.4);
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-bottom: 28px;
  }

  .games-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  /* Carte "Soon" — non cliquable, simple visuel */
  .game-card.unavailable {
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

  .game-card.unavailable .game-info {
    flex: 1;
  }

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
