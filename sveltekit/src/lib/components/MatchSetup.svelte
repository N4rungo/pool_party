<!--
  MatchSetup — section d'options de partie (ordre aléatoire + mode match).
  À placer entre la liste des joueurs et le bouton "Lancer la partie".

  Props bindables :
    - randomizeOrder (boolean|undefined) : si défini, affiche le toggle "Ordre aléatoire"
    - matchMode      (boolean)           : activer ou non le mode match
    - totalGames     (number)            : nombre de parties (2-10, défaut 3)

  Usage :
    <MatchSetup bind:randomizeOrder bind:matchMode bind:totalGames />
    <MatchSetup bind:matchMode bind:totalGames />   ← sans ordre aléatoire
-->
<script>
  import NumberSelector from './NumberSelector.svelte';

  export let randomizeOrder = undefined;
  export let matchMode = false;
  export let totalGames = 3;
</script>

<div class="match-setup-section">
  <div class="sep"></div>

  {#if randomizeOrder !== undefined}
    <label class="option-row">
      <span class="option-label">🔀 Ordre aléatoire</span>
      <div
        class="toggle-track"
        class:on={randomizeOrder}
        on:click={() => randomizeOrder = !randomizeOrder}
        role="switch"
        aria-checked={randomizeOrder}
        tabindex="0"
        on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && (randomizeOrder = !randomizeOrder)}
      >
        <div class="toggle-thumb"></div>
      </div>
    </label>
  {/if}

  <label class="option-row">
    <span class="option-label">🏆 Mode match</span>
    <div
      class="toggle-track"
      class:on={matchMode}
      on:click={() => matchMode = !matchMode}
      role="switch"
      aria-checked={matchMode}
      tabindex="0"
      on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && (matchMode = !matchMode)}
    >
      <div class="toggle-thumb"></div>
    </div>
  </label>

  {#if matchMode}
    <div class="match-options">
      <NumberSelector
        bind:value={totalGames}
        min={2}
        max={10}
        step={1}
        label="Nombre de parties" />
    </div>
  {/if}
</div>

<style>
  .match-setup-section {
    width: 100%;
  }

  .sep {
    height: 1px;
    background: rgba(255, 255, 255, 0.1);
    margin: 16px 0;
  }

  .option-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    cursor: pointer;
    padding: 6px 0;
  }

  .option-label {
    font-size: 14px;
    font-weight: bold;
    color: rgba(255, 255, 255, 0.85);
  }

  /* Toggle switch */
  .toggle-track {
    width: 46px;
    height: 26px;
    border-radius: 13px;
    background: rgba(255, 255, 255, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.25);
    position: relative;
    flex-shrink: 0;
    cursor: pointer;
    transition: background 0.2s, border-color 0.2s;
  }

  .toggle-track.on {
    background: linear-gradient(145deg, var(--color-gold-light), var(--color-gold));
    border-color: var(--color-gold);
  }

  .toggle-thumb {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: white;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
    transition: transform 0.2s;
  }

  .toggle-track.on .toggle-thumb {
    transform: translateX(20px);
  }

  .match-options {
    margin-top: 14px;
  }
</style>
