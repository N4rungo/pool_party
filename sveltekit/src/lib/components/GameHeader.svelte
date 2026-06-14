<!--
  En-tête commun à tous les écrans de jeu.

  Layout en 3 colonnes (1fr / auto / 1fr) :
    [🏠 Home]    [TITRE + ⓘ]    [empty]
                 [↩ Annuler à droite, sur sa propre ligne]

  Props :
   - title   : nom du jeu (string)
   - icon    : chemin vers l'icône du titre (optionnel)
   - gameId  : id du jeu (utilisé pour ouvrir les bonnes règles)
   - canUndo : booléen, désactive le bouton Annuler quand l'historique est vide

  Événements :
   - undo  : émis quand on clique sur Annuler
   - rules : émis quand on clique sur le ⓘ (le parent monte le RulesViewer)
   - home  : émis quand on clique sur 🏠 (le parent gère la confirmation)
-->
<script>
  import { base } from '$app/paths';
  import { createEventDispatcher } from 'svelte';
  import { t } from 'svelte-i18n';

  export let title;
  export let icon = null;
  export let gameId;
  export let canUndo = false;
  export let showMatchInfo = false;

  const dispatch = createEventDispatcher();
</script>

<div class="game-header">
  <button class="btn-home" on:click={() => dispatch('home')} aria-label={$t('header.home')}>
    <img src="{base}/assets/home.png" alt="" class="icon-img" />
  </button>
  <h1>
    {#if icon}<img src={icon} alt="" class="icon-title" />{/if}
    {title}<button
      class="rules-mark"
      on:click={() => dispatch('rules')}
      aria-label={$t('header.rules')}>i</button>
  </h1>
  {#if showMatchInfo}
    <button class="btn-match" on:click={() => dispatch('matchInfo')} aria-label={$t('header.matchInfo')}>
      🏆
    </button>
  {:else}
    <span></span>
  {/if}
</div>

<div class="game-actionbar">
  <button class="btn-undo" disabled={!canUndo} on:click={() => dispatch('undo')}>
    {$t('header.cancelUndo')}
  </button>
</div>

<style>
  .game-header {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  .game-header h1 {
    text-align: center;
    margin: 0;
    padding: 6px 0;
    font-size: clamp(16px, 5.5vw, 24px);
    letter-spacing: clamp(0px, 0.4vw, 2px);
    line-height: 1.1;
    white-space: nowrap;
  }

  .btn-home {
    margin: 0;
    white-space: nowrap;
    justify-self: start;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 12px;
    color: white;
    padding: 8px 10px;
    cursor: pointer;
    font-size: 14px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .btn-home img {
    height: 18px;
    width: 18px;
  }

  .btn-match {
    justify-self: end;
    background: rgba(var(--color-gold-rgb), 0.12);
    border: 1px solid rgba(var(--color-gold-rgb), 0.35);
    border-radius: 12px;
    color: var(--color-gold);
    padding: 8px 10px;
    cursor: pointer;
    font-size: 16px;
    line-height: 1;
    display: inline-flex;
    align-items: center;
    transition: background 0.15s;
  }
  .btn-match:hover {
    background: rgba(var(--color-gold-rgb), 0.22);
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
  }
  .rules-mark:hover,
  .rules-mark:focus-visible {
    opacity: 1;
    transform: scale(1.12);
    outline: none;
  }

  .game-actionbar {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 12px;
  }

  .btn-undo {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    padding: 8px 14px;
    cursor: pointer;
    font-family: inherit;
    font-size: 14px;
  }
  .btn-undo:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
  .btn-undo:not(:disabled):hover {
    background: rgba(255, 255, 255, 0.15);
  }
</style>
