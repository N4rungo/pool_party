<!--
  Overlay de fin de partie standardisé pour tous les jeux.

  Affiche un trophée + nom + sous-texte, et 3 boutons :
    - ↩ Annuler  : revient en jeu et annule la dernière action (au cas où on
                   se trompe sur le coup décisif). Toujours présent, désactivé
                   si l'historique est vide (canUndo = false).
    - 🔄 Rejouer  : nouvelle partie avec les mêmes joueurs.
    - ⚙️ Nouveau jeu : retour au launcher.

  Slot optionnel pour insérer du contenu custom au-dessus des boutons
  (ex. un récap de scores final pour Snooker, 14-1, etc.).

  Props :
   - open    : booléen
   - trophy  : emoji (🏆 par défaut, 🤝 pour égalité)
   - name    : nom du gagnant (ou 'Égalité !')
   - sub     : sous-texte (ex. 'Félicitations !' ou détail du score)
   - canUndo : booléen — désactive le bouton Annuler si false

  Événements :
   - undo, replay, newGame
-->
<script>
  import { createEventDispatcher } from 'svelte';
  import Overlay from './Overlay.svelte';

  export let open = false;
  export let trophy = '🏆';
  export let name = '';
  export let sub = '';
  export let canUndo = true;

  const dispatch = createEventDispatcher();
</script>

<Overlay {open} dismissOnBackdrop={false} on:close={() => dispatch('replay')}>
  <div class="win-content">
    <div class="win-trophy">{trophy}</div>
    <div class="win-name">{name}</div>
    {#if sub}<div class="win-sub">{sub}</div>{/if}

    <slot />

    <button
      class="btn-main btn-gray win-undo"
      disabled={!canUndo}
      on:click={() => dispatch('undo')}>
      ↩ Annuler le dernier coup
    </button>
    <button class="btn-main btn-gold" on:click={() => dispatch('replay')}>🔄 Rejouer</button>
    <button class="btn-main btn-gray" on:click={() => dispatch('newGame')}>⚙️ Nouveau jeu</button>
  </div>
</Overlay>

<style>
  .win-content {
    text-align: center;
    padding: 8px 0;
  }
  .win-trophy {
    font-size: 64px;
    line-height: 1;
    margin-bottom: 12px;
  }
  .win-name {
    font-size: 28px;
    font-weight: bold;
    color: var(--color-gold);
    margin-bottom: 4px;
  }
  .win-sub {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 20px;
  }
  .win-undo:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .win-undo {
    /* Visuellement plus discret que Rejouer (qui est l'action principale),
       mais bien visible quand même — il sauve une fin de partie ratée. */
    margin-bottom: 16px;
  }
</style>
