<script>
  import { createEventDispatcher } from 'svelte';
  import Overlay from './Overlay.svelte';
  import { t } from 'svelte-i18n';

  export let open = false;
  export let trophy = '🏆';
  export let name = '';
  export let sub = '';
  export let canUndo = true;

  const dispatch = createEventDispatcher();
</script>

<Overlay {open} dismissOnBackdrop={false} showClose={false}>
  <div class="win-content">
    <div class="win-trophy">{trophy}</div>
    <div class="win-name">{name}</div>
    {#if sub}<div class="win-sub">{sub}</div>{/if}

    <slot />
  </div>

  <svelte:fragment slot="footer">
    <button
      class="btn-main btn-gray win-undo"
      disabled={!canUndo}
      on:click={() => dispatch('undo')}>
      {$t('win.undo')}
    </button>
    <button class="btn-main btn-gold" on:click={() => dispatch('replay')}>{$t('win.replay')}</button>
    <button class="btn-main btn-gray" on:click={() => dispatch('newGame')}>{$t('win.newGame')}</button>
  </svelte:fragment>
</Overlay>

<style>
  .win-content {
    text-align: center;
  }
  .win-trophy {
    font-size: 48px;
    line-height: 1;
    margin-bottom: 8px;
  }
  .win-name {
    font-size: 26px;
    font-weight: bold;
    color: var(--color-gold);
    margin-bottom: 4px;
  }
  .win-sub {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 16px;
  }
  .win-undo:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .win-undo {
    margin-bottom: 16px;
  }
</style>
