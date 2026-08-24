<!--
  MatchSetup — section d'options de partie (ordre aléatoire + mode match).
  À placer entre la liste des joueurs et le bouton "Lancer la partie".

  Props bindables :
    - extraToggle      (boolean|undefined) : si défini, affiche un toggle générique
                                              avant "Ordre aléatoire" (label via extraToggleLabel)
    - extraToggleLabel (string)            : libellé du toggle générique
    - randomizeOrder (boolean|undefined) : si défini, affiche le toggle "Ordre aléatoire"
    - matchMode      (boolean)           : activer ou non le mode match
    - totalGames     (number)            : nombre de parties (2-10, défaut 3)
    - breakOrder     (string|undefined)  : si défini, affiche le choix de casse en mode match

  Usage :
    <MatchSetup bind:randomizeOrder bind:matchMode bind:totalGames bind:breakOrder />
    <MatchSetup bind:matchMode bind:totalGames />   ← sans ordre aléatoire ni casse
    <MatchSetup bind:extraToggle={shortMode} extraToggleLabel={$t('snooker.shortMode')}
                bind:randomizeOrder bind:matchMode bind:totalGames />
-->
<script>
  import { t } from 'svelte-i18n';

  export let extraToggle = undefined;
  export let extraToggleLabel = '';
  export let randomizeOrder = undefined;
  export let matchMode = false;
  export let totalGames = 3;
  export let breakOrder = undefined;
</script>

<div class="match-setup-section">
  <div class="sep"></div>

  {#if extraToggle !== undefined}
    <label class="option-row">
      <span class="option-label">{extraToggleLabel}</span>
      <div
        class="toggle-track"
        class:on={extraToggle}
        on:click={() => extraToggle = !extraToggle}
        role="switch"
        aria-checked={extraToggle}
        tabindex="0"
        on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && (extraToggle = !extraToggle)}
      >
        <div class="toggle-thumb"></div>
      </div>
    </label>
  {/if}

  {#if randomizeOrder !== undefined}
    <label class="option-row">
      <span class="option-label">{$t('match.randomOrder')}</span>
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
    <span class="option-label">{$t('match.matchMode')}</span>
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
    <div class="match-options" class:two-col={breakOrder !== undefined}>

      <div class="match-col">
        <div class="match-col-label">{$t('match.boFormat')}</div>
        <div class="match-stepper">
          <button class="stepper-btn" on:click={() => totalGames = Math.max(3, totalGames - 2)}>−</button>
          <span class="stepper-val">{totalGames} {$t('match.boUnit')}</span>
          <button class="stepper-btn" on:click={() => totalGames = Math.min(9, totalGames + 2)}>+</button>
        </div>
      </div>

      {#if breakOrder !== undefined}
        <div class="match-col-sep"></div>
        <div class="match-col">
          <div class="match-col-label">{$t('match.breakOrder')}</div>
          <div class="break-chips">
            <button
              class="break-chip"
              class:active={breakOrder === 'alternate'}
              on:click={() => breakOrder = 'alternate'}
            >{$t('match.breakAlternate')}</button>
            <button
              class="break-chip"
              class:active={breakOrder === 'winner'}
              on:click={() => breakOrder = 'winner'}
            >{$t('match.breakWinner')}</button>
          </div>
        </div>
      {/if}

    </div>
  {/if}
</div>

<style>
  .match-setup-section {
    width: 100%;
  }

  .sep {
    height: 1px;
    background: rgba(var(--color-text-rgb), 0.1);
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
    color: rgba(var(--color-text-rgb), 0.85);
  }

  /* Toggle switch */
  .toggle-track {
    width: 46px;
    height: 26px;
    border-radius: 13px;
    background: rgba(var(--color-text-rgb), 0.15);
    border: 1px solid rgba(var(--color-text-rgb), 0.25);
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

  /* ── Options match compactes ── */
  .match-options {
    margin-top: 12px;
    display: flex;
    align-items: stretch;
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(var(--color-text-rgb), 0.07);
    border-radius: 14px;
    padding: 10px 12px;
  }

  .match-col {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .match-col-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: rgba(var(--color-text-rgb), 0.35);
  }

  .match-col-sep {
    width: 1px;
    background: rgba(var(--color-text-rgb), 0.1);
    margin: 0 10px;
    align-self: stretch;
    flex-shrink: 0;
  }

  /* Stepper +/− */
  .match-stepper {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .stepper-btn {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    border: 1px solid rgba(var(--color-gold-rgb), 0.45);
    background: rgba(var(--color-gold-rgb), 0.12);
    color: var(--color-gold);
    font-size: 18px;
    font-weight: bold;
    font-family: inherit;
    cursor: pointer;
    transition: background 0.15s;
    -webkit-tap-highlight-color: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    padding: 0;
  }

  .stepper-btn:active {
    background: rgba(var(--color-gold-rgb), 0.28);
  }

  .stepper-val {
    font-size: 20px;
    font-weight: bold;
    color: white;
    min-width: 22px;
    text-align: center;
  }

  /* Chips ordre de casse */
  .break-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    width: 100%;
  }

  .break-chip {
    flex: 1 1 auto;
    min-width: 0;
    padding: 6px 4px;
    border-radius: 8px;
    border: 1px solid rgba(var(--color-text-rgb), 0.15);
    background: rgba(0, 0, 0, 0.25);
    color: rgba(var(--color-text-rgb), 0.5);
    font-family: inherit;
    font-size: 11px;
    cursor: pointer;
    transition: background 0.12s, border-color 0.12s, color 0.12s;
    -webkit-tap-highlight-color: transparent;
    white-space: nowrap;
  }

  .break-chip.active {
    background: rgba(var(--color-gold-rgb), 0.15);
    border-color: rgba(var(--color-gold-rgb), 0.5);
    color: var(--color-gold);
    font-weight: bold;
  }
</style>
