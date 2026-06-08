<script>
  import { base } from '$app/paths';
  import GameCard from '$lib/components/GameCard.svelte';
  import RulesViewer from '$lib/components/RulesViewer.svelte';
  import { GAMES } from '$lib/games.js';

  let rulesOpen = false;
  let rulesGameId = null;

  function showRules(event) {
    rulesGameId = event.detail;
    rulesOpen = true;
  }
</script>

<div id="launcher">
  <div class="launcher-header">
    <span class="launcher-subtitle">Choisissez votre jeu</span>
  </div>

  <div class="games-list">
    {#each GAMES as game (game.id)}
      <GameCard {game} on:rules={showRules} />
    {/each}

    <div class="game-card unavailable">
      <div class="game-icon">🚧</div>
      <div class="game-info">
        <div class="game-name">Bientôt</div>
        <div class="game-tagline">Soyez patient...</div>
      </div>
      <div class="game-arrow">Bientôt</div>
    </div>
  </div>
</div>

<RulesViewer gameId={rulesGameId} open={rulesOpen} on:close={() => rulesOpen = false} />

<style>
  #launcher {
    width: var(--content-w, 92%);
    max-width: var(--content-max, 480px);
    padding-top: 16px;
  }

  /* Ligne sous-titre + bouton info */
  .launcher-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-bottom: 20px;
  }

  .launcher-subtitle {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.4);
    letter-spacing: 2px;
    text-transform: uppercase;
  }

  .games-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  @media (min-width: 700px) {
    .games-list {
      display: grid;
      grid-template-columns: 1fr 1fr;
    }
  }

  /* Carte "Soon" */
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

  /* Overlay info */
  .info-content { padding: 4px 0; }

  .info-content h2 {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 22px;
    color: var(--color-gold);
    margin-bottom: 8px;
  }

  .info-logo {
    width: 36px;
    height: 36px;
    object-fit: contain;
  }

  .info-version {
    margin-left: auto;
    font-size: 12px;
    font-weight: normal;
    color: rgba(255, 255, 255, 0.3);
    letter-spacing: 0.5px;
    font-family: monospace;
    align-self: center;
  }

  .info-tagline {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.65);
    line-height: 1.5;
    margin-bottom: 20px;
    font-style: italic;
  }

  .info-section {
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding-top: 16px;
  }

  .info-section-title {
    font-size: 15px;
    font-weight: bold;
    color: var(--color-gold-light);
    margin-bottom: 8px;
  }

  .info-section p {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.6);
    line-height: 1.5;
    margin-bottom: 14px;
  }

  .install-step {
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 12px 14px;
    margin-bottom: 8px;
  }

  .install-platform {
    font-size: 13px;
    font-weight: bold;
    color: rgba(255, 255, 255, 0.5);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 4px;
  }

  .install-instructions {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.85);
    line-height: 1.5;
  }

  .install-instructions strong { color: white; }
</style>
