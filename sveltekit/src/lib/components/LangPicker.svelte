<script>
  import { createEventDispatcher } from 'svelte';

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
        <!-- France -->
        <button class="flag-btn" on:click={() => pick('fr')} aria-label="Français">
          <svg class="flag" viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect width="20" height="40" fill="#002395"/>
            <rect x="20" width="20" height="40" fill="#EDEDED"/>
            <rect x="40" width="20" height="40" fill="#ED2939"/>
          </svg>
          <span class="flag-label">Français</span>
        </button>

        <!-- United Kingdom -->
        <button class="flag-btn" on:click={() => pick('en')} aria-label="English">
          <svg class="flag" viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <!-- Fond bleu -->
            <rect width="60" height="40" fill="#012169"/>
            <!-- Diagonales blanches (X de Saint-André) -->
            <line x1="0" y1="0"  x2="60" y2="40" stroke="white" stroke-width="8"/>
            <line x1="60" y1="0" x2="0"  y2="40" stroke="white" stroke-width="8"/>
            <!-- Diagonales rouges (X de Saint-Patrick, filets) -->
            <line x1="0" y1="0"  x2="60" y2="40" stroke="#C8102E" stroke-width="4.5"/>
            <line x1="60" y1="0" x2="0"  y2="40" stroke="#C8102E" stroke-width="4.5"/>
            <!-- Croix blanche (Saint-Georges) -->
            <rect x="22" y="0"  width="16" height="40" fill="white"/>
            <rect x="0"  y="14" width="60" height="12" fill="white"/>
            <!-- Croix rouge (Saint-Georges) -->
            <rect x="24.5" y="0"  width="11" height="40" fill="#C8102E"/>
            <rect x="0"    y="15.5" width="60" height="9" fill="#C8102E"/>
          </svg>
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
    border: 1px solid rgba(255, 255, 255, 0.1);
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
    color: rgba(255, 255, 255, 0.45);
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
    border: 2px solid rgba(255, 255, 255, 0.1);
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

  .flag {
    width: 72px;
    height: 48px;
    border-radius: 5px;
    display: block;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  }

  .flag-label {
    font-size: 13px;
    font-weight: bold;
    color: rgba(255, 255, 255, 0.85);
    letter-spacing: 0.5px;
  }
</style>
