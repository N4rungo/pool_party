<!--
  Composant utilitaire pour les routes de jeu pas encore portées.
  Affiche une page "à venir" avec un retour vers le launcher.

  Sera remplacé jeu par jeu lors des phases 3.3 → 3.5.
-->
<script>
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';

  export let name;
  export let icon = null;

  function goHome() {
    goto(base || '/');
  }
</script>

<div class="game-stub">
  <h1>
    {#if icon}<img src={icon} alt="" class="icon-title" />{/if}
    {name}
  </h1>
  <div class="stub-msg">
    🚧 Ce jeu n'est pas encore migré vers SvelteKit.
    <br />
    Revenez bientôt — il sera porté dans une prochaine phase.
  </div>
  <button class="btn-main btn-gold" on:click={goHome}>← Retour à l'accueil</button>
</div>

<style>
  .game-stub {
    width: var(--content-w, 92%);
    max-width: var(--content-max, 480px);
    text-align: center;
    padding-top: 10px;
  }

  .stub-msg {
    background: rgba(0, 0, 0, 0.25);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 24px;
    color: rgba(255, 255, 255, 0.7);
    line-height: 1.6;
    margin-bottom: 20px;
  }
</style>
