<script>
  import { page } from '$app/stores';
  import { base } from '$app/paths';
</script>

<div class="error-page">
  <div class="error-box">
    <div class="error-icon">🎱</div>
    <h1 class="error-code">{$page.status}</h1>
    <p class="error-message">
      {#if $page.status === 404}
        Cette page n'existe pas.
      {:else}
        Une erreur est survenue.
      {/if}
    </p>
    <a href="{base}/" class="btn-home">← Retour à l'accueil</a>
  </div>
</div>

<style>
  .error-page {
    min-height: 100dvh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-bg, #0f2417);
    padding: 24px;
  }

  .error-box {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }

  .error-icon {
    font-size: 56px;
  }

  .error-code {
    font-size: 72px;
    font-weight: 800;
    color: var(--color-gold, #d4af37);
    margin: 0;
    line-height: 1;
  }

  .error-message {
    font-size: 18px;
    color: rgba(var(--color-text-rgb), 0.7);
    margin: 0;
  }

  .btn-home {
    margin-top: 8px;
    display: inline-block;
    padding: 12px 24px;
    background: var(--color-gold, #d4af37);
    color: #000;
    font-weight: 700;
    font-size: 16px;
    border-radius: 12px;
    text-decoration: none;
  }

  .btn-home:active {
    opacity: 0.85;
  }
</style>
