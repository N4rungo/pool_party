<!--
  MatchSetup — section de configuration du mode match, intégrée dans l'écran
  de setup d'un jeu.

  Props bindables :
    - matchMode   (boolean) : activer ou non le mode match
    - totalGames  (number)  : nombre de parties (2-10, défaut 3)

  Cette section s'affiche en bas du formulaire de setup.
  Quand matchMode est false : le bouton affiché est "Lancer la partie !".
  Quand matchMode est true  : on affiche le sélecteur de parties + "Lancer le match !".

  Le parent gère l'action au clic (startGame / startMatch) via la prop onLaunch.

  Usage :
    <MatchSetup bind:matchMode bind:totalGames onLaunch={handleLaunch} />
-->
<script>
  import NumberSelector from './NumberSelector.svelte';

  export let matchMode = false;
  export let totalGames = 3;
</script>

<div class="match-setup-section">
  <div class="sep"></div>

  <label class="match-toggle-row">
    <span class="match-toggle-label">🏆 Mode match</span>
    <div class="toggle-track" class:on={matchMode} on:click={() => matchMode = !matchMode} role="switch" aria-checked={matchMode} tabindex="0" on:keydown={(e) => e.key === 'Enter' || e.key === ' ' ? matchMode = !matchMode : null}>
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

  .match-toggle-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    cursor: pointer;
    padding: 4px 0;
  }

  .match-toggle-label {
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
