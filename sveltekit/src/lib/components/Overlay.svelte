<!--
  Composant Overlay générique.

  Usage :
    <Overlay open={isOpen} on:close={() => isOpen = false}>
      <h2>Titre</h2>
      <p>Contenu</p>
    </Overlay>

  - `open` : booléen contrôlant la visibilité (lié par le parent).
  - `on:close` : événement émis quand l'utilisateur veut fermer (clic backdrop
    ou bouton ✕). Au parent de réagir en mettant `open` à false.
  - Le contenu (slot par défaut) s'affiche dans la popup-box.
-->
<script>
  import { createEventDispatcher } from 'svelte';

  export let open = false;
  export let dismissOnBackdrop = true;
  export let showClose = true;

  const dispatch = createEventDispatcher();

  function close() {
    dispatch('close');
  }

  function onBackdropClick(e) {
    if (dismissOnBackdrop && e.target === e.currentTarget) close();
  }
</script>

{#if open}
  <div class="overlay" on:click={onBackdropClick} role="dialog" aria-modal="true">
    <div class="popup-box" class:popup-no-close={!showClose}>
      {#if showClose}
        <button class="overlay-close" on:click={close} aria-label="Fermer">✕</button>
      {/if}
      <slot />
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.82);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 300;
    backdrop-filter: blur(4px);
  }

  .popup-box {
    background: linear-gradient(160deg, #1e5c34, #143d24);
    border: 2px solid var(--color-gold);
    border-radius: 20px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    padding: 22px;
    width: min(92vw, 520px);
    max-height: min(94vh, calc(100vh - 40px));
    overflow-y: auto;
    position: relative;
    text-align: left;
  }

  .overlay-close {
    position: sticky;
    top: 0;
    margin-left: auto;
    display: block;
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    font-size: 16px;
    cursor: pointer;
    line-height: 1;
    z-index: 1;
  }
  .overlay-close:hover { background: rgba(0, 0, 0, 0.6); }
</style>
