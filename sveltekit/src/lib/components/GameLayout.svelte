<!--
  Layout commun pour les écrans de jeu (pattern A — UX phase 3.11).

  Structure :
    1. GameHeader fixe en haut
    2. Contenu principal (scoreboard, plateau, etc.) — scrolle si trop long
    3. Footer sticky en bas du viewport (banniere actif + actions)

  Le footer utilise `position: sticky; bottom: 0`. Il reste collé au bas
  du viewport tant qu'il y a du contenu à scroller au-dessus ; sinon il
  est simplement à la fin de la page (comportement naturel).

  Usage : passer le contenu principal dans le slot par défaut, et les
  actions à fixer en bas dans le slot nommé `footer`.

  Le slot 'footer' est optionnel : sans lui, le layout se comporte
  comme un simple wrapper avec GameHeader.

  Le bouton 🏆 (infos match) apparaît automatiquement dans l'en-tête
  lorsqu'un match est actif, sans nécessiter de props supplémentaires
  dans les pages de jeu.
-->
<script>
  import GameHeader from './GameHeader.svelte';
  import MatchInfoOverlay from './MatchInfoOverlay.svelte';
  import { matchStore } from '$lib/stores/match.js';

  export let title;
  export let icon = null;
  export let gameId;
  export let canUndo = false;

  let matchInfoOpen = false;
</script>

<div class="game-layout">
  <GameHeader {title} {icon} {gameId} {canUndo}
              showMatchInfo={$matchStore.isActive}
              on:home on:undo on:rules
              on:matchInfo={() => (matchInfoOpen = true)} />

  <div class="game-layout-body">
    <slot />
  </div>

  {#if $$slots.footer}
    <div class="game-layout-footer">
      <slot name="footer" />
    </div>
  {/if}
</div>

{#if $matchStore.isActive}
  <MatchInfoOverlay
    open={matchInfoOpen}
    {gameId}
    currentGame={$matchStore.currentGame}
    totalGames={$matchStore.totalGames}
    matchScores={$matchStore.matchScores}
    results={$matchStore.results}
    on:close={() => (matchInfoOpen = false)} />
{/if}

<style>
  .game-layout {
    width: 100%;
  }

  .game-layout-body {
    /* Pas de scroll spécifique : le scroll global du body suffit.
       Cette section pousse simplement le footer en sticky. */
  }

  .game-layout-footer {
    /* Reste collé au bas du viewport tant qu'on n'est pas tout en bas
       de la page. Quand le contenu tient sur l'écran, le footer est
       simplement à la fin (comportement naturel). */
    position: sticky;
    bottom: 0;
    z-index: 2;

    /* Fond opaque pour masquer le contenu qui passe en dessous au scroll.
       Reprend la couleur du body (var --color-pool) avec un fondu en haut
       pour adoucir la transition visuelle. */
    background: var(--color-pool);
    margin-top: 12px;
    padding: 12px 0 8px;

    /* Léger fondu au-dessus du footer pour adoucir l'apparition du contenu
       qui passe en dessous au scroll. */
  }
</style>
