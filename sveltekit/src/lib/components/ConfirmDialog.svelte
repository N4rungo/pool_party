<!--
  Boîte de dialogue de confirmation globale.

  À monter une seule fois (dans +layout.svelte) ; consommé via le helper
  `askConfirm` du store `lib/stores/confirm.js`.

  N'a pas de props : tout passe par le store. Affiche un Overlay quand
  un appel `askConfirm` est en cours et résout la promesse selon le clic
  (Confirmer / Annuler / clic backdrop = annuler).
-->
<script>
  import Overlay from './Overlay.svelte';
  import { confirmState, _resolveConfirm } from '$lib/stores/confirm.js';

  function confirm() {
    _resolveConfirm(true);
  }

  function cancel() {
    _resolveConfirm(false);
  }
</script>

<Overlay open={$confirmState !== null} on:close={cancel}>
  {#if $confirmState}
    <div class="confirm-content">
      <div class="confirm-icon">
        {#if $confirmState.iconImage}
          <img src={$confirmState.iconImage} alt="" />
        {:else}
          {$confirmState.icon}
        {/if}
      </div>
      <div class="confirm-message">{$confirmState.message}</div>
      <button class="btn-main btn-gold" on:click={confirm}>
        {$confirmState.confirmLabel}
      </button>
      <button class="btn-main btn-gray" on:click={cancel}>
        {$confirmState.cancelLabel}
      </button>
    </div>
  {/if}
</Overlay>

<style>
  .confirm-content {
    text-align: center;
    padding: 4px 0;
  }

  .confirm-icon {
    font-size: 48px;
    margin-bottom: 12px;
    line-height: 1;
  }
  .confirm-icon img {
    width: 56px;
    height: 56px;
    object-fit: contain;
    display: inline-block;
  }

  .confirm-message {
    font-size: 16px;
    color: rgba(var(--color-text-rgb), 0.9);
    line-height: 1.5;
    margin-bottom: 18px;
  }
</style>
