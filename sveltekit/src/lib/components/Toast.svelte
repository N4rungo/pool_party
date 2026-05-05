<!--
  Affiche tous les toasts présents dans le store $toasts.

  À monter une seule fois, dans +layout.svelte. Les jeux appellent
  ensuite showToast('message') depuis n'importe où, et le toast apparaît
  ici grâce à la réactivité du store.

  Plusieurs toasts peuvent s'empiler (un seul est rare en pratique
  mais on gère le cas — utile si un toast traîne pendant qu'un autre
  arrive).
-->
<script>
  import { toasts } from '$lib/stores/toast.js';
  import { fade, fly } from 'svelte/transition';
</script>

<div class="toast-container" aria-live="polite" aria-atomic="true">
  {#each $toasts as toast (toast.id)}
    <div
      class="toast"
      in:fly={{ y: 20, duration: 200 }}
      out:fade={{ duration: 200 }}>
      {toast.message}
    </div>
  {/each}
</div>

<style>
  .toast-container {
    position: fixed;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 999;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    pointer-events: none;
  }

  .toast {
    background: rgba(0, 0, 0, 0.88);
    color: white;
    padding: 13px 22px;
    border-radius: 50px;
    font-size: 14px;
    font-weight: bold;
    border: 1px solid rgba(var(--color-gold-rgb), 0.35);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    max-width: 88vw;
    text-align: center;
  }
</style>
