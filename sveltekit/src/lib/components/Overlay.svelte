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
    <div class="popup-box">
      <div class="popup-body">
        {#if showClose}
          <button class="overlay-close" on:click={close} aria-label="Fermer">✕</button>
        {/if}
        <slot />
      </div>
      {#if $$slots.footer}
        <div class="popup-footer">
          <slot name="footer" />
        </div>
      {/if}
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
    width: min(92vw, 520px);
    max-height: min(94vh, calc(100vh - 40px));
    overflow: hidden;
    position: relative;
    text-align: left;
    display: flex;
    flex-direction: column;
  }

  .popup-body {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
    padding: 22px;
  }

  .overlay-close {
    position: sticky;
    top: 0;
    margin-left: auto;
    margin-bottom: 8px;
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

  .popup-footer {
    flex-shrink: 0;
    padding: 12px 22px 22px;
    background: #143d24;
    position: relative;
    z-index: 1;
  }

  .popup-footer::before {
    content: '';
    position: absolute;
    top: -24px;
    left: 0;
    right: 0;
    height: 24px;
    background: linear-gradient(to bottom, transparent, #143d24);
    pointer-events: none;
  }
</style>
