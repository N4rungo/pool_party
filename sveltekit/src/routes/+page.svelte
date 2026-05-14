<!--
  Page d'accueil = Launcher.

  Affiche le titre, les 7 cartes de jeu (générées par boucle depuis games.js)
  et gère l'overlay des règles (un seul, partagé entre toutes les cartes).
-->
<script>
  import { base } from '$app/paths';
  import GameCard from '$lib/components/GameCard.svelte';
  import RulesViewer from '$lib/components/RulesViewer.svelte';
  import Overlay from '$lib/components/Overlay.svelte';
  import { GAMES } from '$lib/games.js';

  let rulesOpen = false;
  let rulesGameId = null;
  let infoOpen = false;

  function showRules(event) {
    rulesGameId = event.detail;
    rulesOpen = true;
  }
</script>

<div id="launcher">
  <div class="launcher-header">
    <h1>
      <img src="{base}/assets/pool_party.png" alt="" class="icon-title" />
      POOL PARTY
    </h1>
    <button class="btn-info" on:click={() => infoOpen = true} aria-label="Infos & installation">ℹ</button>
  </div>
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

<RulesViewer gameId={rulesGameId} open={rulesOpen} on:close={() => rulesOpen = false} />

<Overlay open={infoOpen} on:close={() => infoOpen = false}>
  <div class="info-content">
    <h2>
      <img src="{base}/assets/pool_party.png" alt="" class="info-logo" />
      Pool Party
    </h2>
    <p class="info-tagline">Scores de billard pour soirées — fonctionne sans connexion, même au fond d'un bar.</p>

    <div class="info-section">
      <div class="info-section-title">📲 Installer l'app</div>
      <p>Ajoutez Pool Party à votre écran d'accueil pour un accès direct, sans barre de navigateur.</p>

      <div class="install-step">
        <div class="install-platform">🤖 Android</div>
        <div class="install-instructions">Menu <strong>⋮</strong> → <strong>Ajouter à l'écran d'accueil</strong></div>
      </div>

      <div class="install-step">
        <div class="install-platform">🍎 iPhone / iPad</div>
        <div class="install-instructions">Bouton <strong>Partager ⬆</strong> → <strong>Sur l'écran d'accueil</strong></div>
      </div>
    </div>
  </div>
</Overlay>

<style>
  #launcher {
    width: 92%;
    max-width: 480px;
    padding-top: 10px;
  }

  .launcher-header {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }

  .btn-info {
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 50%;
    color: rgba(255, 255, 255, 0.5);
    font-size: 16px;
    width: 32px;
    height: 32px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s, color 0.15s;
    -webkit-tap-highlight-color: transparent;
  }

  .btn-info:hover,
  .btn-info:active {
    background: rgba(255, 255, 255, 0.15);
    color: rgba(255, 255, 255, 0.85);
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
  .info-content {
    padding: 4px 0;
  }

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

  .install-instructions strong {
    color: white;
  }
</style>
