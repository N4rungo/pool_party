<!--
  Bille cliquable réutilisable.

  Affiche une image de bille (depuis /assets/) et gère 3 états :
   - normal      : cliquable, légèrement scale au :active
   - pocketed    : grisée et désactivée (cas Chicago, 14-1, Cutthroat)
   - selected    : halo doré (futur 5-Ball, Snooker)
   - disabled    : grisée mais sans le filtre (différent de pocketed)

  Props :
   - src      : chemin vers l'image (ex. '/assets/bille_8.png')
   - alt      : texte alternatif
   - size     : taille en px (52 par défaut)
   - pocketed : booléen
   - selected : booléen
   - disabled : booléen (autre raison qu'empochée)

  Événement :
   - click
-->
<script>
  import { createEventDispatcher } from 'svelte';

  export let src;
  export let alt = '';
  export let size = 52;
  export let pocketed = false;
  export let selected = false;
  export let disabled = false;
  export let hint = false;

  const dispatch = createEventDispatcher();

  // L'image est inactive si elle est empochée OU désactivée explicitement
  $: isInactive = pocketed || disabled;
</script>

<button
  class="ball"
  class:pocketed
  class:selected
  class:disabled
  class:hint
  disabled={isInactive}
  on:click={() => dispatch('click')}
  aria-label={alt}>
  <img {src} {alt} style="width: {size}px; height: {size}px;" />
</button>

<style>
  .ball {
    background: none;
    border: none;
    cursor: pointer;
    padding: 2px;
    border-radius: 50%;
    transition: transform .15s, opacity .3s, box-shadow .15s, filter .2s;
    -webkit-tap-highlight-color: transparent;
  }

  .ball img {
    display: block;
    pointer-events: none;
    border-radius: 50%;
  }

  .ball:active:not(:disabled) {
    transform: scale(1.15);
  }

  .ball.pocketed {
    opacity: 0.2;
    cursor: default;
    filter: grayscale(100%);
  }

  .ball.disabled {
    opacity: 0.35;
    cursor: not-allowed;
    filter: grayscale(70%);
  }

  .ball.selected {
    transform: scale(1.05);
  }
  .ball.selected img {
    filter: drop-shadow(0 0 4px var(--color-gold))
            drop-shadow(0 0 2px var(--color-gold));
  }

  @keyframes hint-pulse {
    0%, 100% { filter: drop-shadow(0 0 3px rgba(255, 255, 255, 0.55)); opacity: 1; }
    50%       { filter: drop-shadow(0 0 9px rgba(255, 255, 255, 0.9)) drop-shadow(0 0 4px rgba(200, 220, 255, 0.6)); opacity: 0.82; }
  }

  .ball.hint:not(.disabled):not(.pocketed) img {
    animation: hint-pulse 1.3s ease-in-out infinite;
  }
</style>
