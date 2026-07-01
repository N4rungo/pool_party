<script>
  import { createEventDispatcher } from 'svelte';
  import FlagIcon from './FlagIcon.svelte';

  export let open = false;

  const dispatch = createEventDispatcher();

  function pick(lang) {
    dispatch('pick', lang);
  }
</script>

{#if open}
  <div class="backdrop">
    <div class="modal" role="dialog" aria-modal="true">
      <div class="title">
        <span class="line-fr">Choisissez votre langue</span>
        <span class="line-en">Choose your language</span>
      </div>

      <div class="flags-row">
        <button class="flag-btn" on:click={() => pick('fr')} aria-label="Français">
          <FlagIcon lang="fr" size={72} />
          <span class="flag-label">Français</span>
        </button>

        <button class="flag-btn" on:click={() => pick('en')} aria-label="English">
          <FlagIcon lang="en" size={72} />
          <span class="flag-label">English</span>
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 1000;
    background: rgba(0, 0, 0, 0.65);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .modal {
    background: rgba(20, 58, 34, 0.97);
    border: 1px solid rgba(var(--color-text-rgb), 0.1);
    border-radius: 20px;
    padding: 28px 24px 24px;
    width: min(320px, 88vw);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
  }

  .title {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    text-align: center;
  }

  .line-fr {
    font-size: 15px;
    font-weight: bold;
    color: var(--color-gold);
    letter-spacing: 0.5px;
  }

  .line-en {
    font-size: 13px;
    color: rgba(var(--color-text-rgb), 0.45);
    font-style: italic;
  }

  .flags-row {
    display: flex;
    gap: 16px;
    justify-content: center;
  }

  .flag-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    background: rgba(0, 0, 0, 0.2);
    border: 2px solid rgba(var(--color-text-rgb), 0.1);
    border-radius: 14px;
    padding: 16px 20px;
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s, transform 0.12s;
    -webkit-tap-highlight-color: transparent;
  }

  .flag-btn:hover,
  .flag-btn:active {
    border-color: rgba(var(--color-gold-rgb), 0.7);
    background: rgba(var(--color-gold-rgb), 0.08);
    transform: scale(1.04);
  }

  .flag-label {
    font-size: 13px;
    font-weight: bold;
    color: rgba(var(--color-text-rgb), 0.85);
    letter-spacing: 0.5px;
  }
</style>
