<!--
  Page d'accueil = Launcher.

  Affiche le titre, les 7 cartes de jeu (générées par boucle depuis games.js)
  et gère l'overlay des règles (un seul, partagé entre toutes les cartes).
-->
<script>
  import { base } from '$app/paths';
  import { goto } from '$app/navigation';
  import GameCard from '$lib/components/GameCard.svelte';
  import RulesViewer from '$lib/components/RulesViewer.svelte';
  import Overlay from '$lib/components/Overlay.svelte';
  import { GAMES } from '$lib/games.js';
  import { profilesStore } from '$lib/stores/profiles.js';
  import { historyStore } from '$lib/stores/history.js';

  let rulesOpen = false;
  let rulesGameId = null;
  let infoOpen = false;

  function showRules(event) {
    rulesGameId = event.detail;
    rulesOpen = true;
  }
</script>

<div id="launcher">
  <h1>
    <img src="{base}/assets/pool_party.png" alt="" class="icon-title" />
    POOL PARTY<button class="rules-mark" on:click={() => infoOpen = true} aria-label="Infos & installation">i</button>
  </h1>
  <div class="launcher-subtitle">Choisissez votre jeu</div>

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

  <!-- Players zone -->
  <button class="players-btn" on:click={() => goto(`${base}/players`)}>
    <span class="players-icon">👤</span>
    <span class="players-info">
      <span class="players-title">Joueurs & Statistiques</span>
      <span class="players-sub">
        {$profilesStore.length} profil{$profilesStore.length !== 1 ? 's' : ''}
        · {$historyStore.length} partie{$historyStore.length !== 1 ? 's' : ''} enregistrée{$historyStore.length !== 1 ? 's' : ''}
      </span>
    </span>
    <span class="players-arrow">›</span>
  </button>
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
    width: var(--content-w, 92%);
    max-width: var(--content-max, 480px);
    padding-top: 10px;
  }

  /* Titre principal : taille et espacement s'adaptent en deçà de ~380px,
     inchangés au-dessus. white-space: nowrap évite le retour à la ligne
     entre le texte et le bouton info. */
  h1 {
    font-size: clamp(20px, 7vw, 28px);
    letter-spacing: clamp(1px, 0.5vw, 3px);
    white-space: nowrap;
    padding: 16px 20px 4px;
  }

  /* Icône launcher plus grande que l'icon-title globale (48px),
     adaptative avec l'écran. margin-right réduit pour rester serré. */
  h1 .icon-title {
    width: clamp(52px, 17vw, 72px);
    height: clamp(52px, 17vw, 72px);
    margin-right: 4px;
  }

  .rules-mark {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    vertical-align: super;
    font-size: 0.42em;
    width: 1.7em;
    height: 1.7em;
    border: 1.5px solid currentColor;
    border-radius: 50%;
    font-family: 'Times New Roman', Georgia, serif;
    font-style: italic;
    font-weight: 700;
    line-height: 1;
    background: none;
    cursor: pointer;
    color: inherit;
    padding: 0;
    margin-left: 0.25em;
    opacity: 0.65;
    transition: opacity .2s, transform .15s;
    -webkit-tap-highlight-color: transparent;
  }

  .rules-mark:hover,
  .rules-mark:active {
    opacity: 1;
    transform: scale(1.12);
  }

  .launcher-subtitle {
    text-align: center;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.4);
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-top: 2px;
    margin-bottom: 20px;
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

  /* Players zone */
  .players-btn {
    display: flex;
    align-items: center;
    gap: 16px;
    width: 100%;
    margin-top: 20px;
    background: rgba(0, 0, 0, 0.25);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    padding: 16px 20px;
    cursor: pointer;
    font-family: inherit;
    color: white;
    text-align: left;
    transition: background 0.15s, border-color 0.15s;
    -webkit-tap-highlight-color: transparent;
  }

  .players-btn:hover,
  .players-btn:active {
    background: rgba(var(--color-gold-rgb), 0.07);
    border-color: rgba(var(--color-gold-rgb), 0.3);
  }

  .players-icon {
    font-size: 32px;
    flex-shrink: 0;
  }

  .players-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .players-title {
    font-size: 16px;
    font-weight: bold;
    color: rgba(255, 255, 255, 0.9);
  }

  .players-sub {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.4);
  }

  .players-arrow {
    font-size: 20px;
    color: rgba(255, 255, 255, 0.25);
    flex-shrink: 0;
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
