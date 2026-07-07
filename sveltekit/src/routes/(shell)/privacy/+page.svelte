<script>
  import { t } from 'svelte-i18n';
  import { base } from '$app/paths';
  import { goto } from '$app/navigation';
</script>

<div class="page">
  <button class="back-btn" on:click={() => goto(`${base}/settings`)}>
    {$t('privacy.backToSettings')}
  </button>

  <h1 class="page-title">{$t('privacy.title')}</h1>
  <p class="last-updated">{$t('privacy.lastUpdated')}</p>

  <p class="intro">{$t('privacy.intro')}</p>

  <div class="section">
    <h2>{$t('privacy.s1title')}</h2>
    <p>{$t('privacy.s1body')}</p>
  </div>

  <div class="section">
    <h2>{$t('privacy.s2title')}</h2>
    <p>{$t('privacy.s2body')}</p>
  </div>

  <div class="section">
    <h2>{$t('privacy.s3title')}</h2>
    <p>{$t('privacy.s3body')}</p>
  </div>

  <div class="section">
    <h2>{$t('privacy.s4title')}</h2>
    <p>{$t('privacy.s4body')}</p>
  </div>

  <div class="section">
    <h2>{$t('privacy.s5title')}</h2>
    <p>{$t('privacy.s5body')}</p>
  </div>
</div>

<style>
  .page {
    width: var(--content-w, 92%);
    max-width: var(--content-max, 480px);
    padding-top: 20px;
    padding-bottom: 40px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .back-btn {
    align-self: flex-start;
    background: none;
    border: none;
    color: var(--color-gold);
    font-family: inherit;
    font-size: 14px;
    cursor: pointer;
    padding: 0;
    margin-bottom: 16px;
    opacity: 0.8;
    -webkit-tap-highlight-color: transparent;
  }
  .back-btn:hover { opacity: 1; }

  .page-title {
    font-size: 20px;
    font-weight: bold;
    color: var(--color-gold);
    margin: 0 0 4px;
  }

  .last-updated {
    font-size: 11px;
    color: rgba(var(--color-text-rgb), 0.35);
    margin: 0 0 20px;
    letter-spacing: 0.3px;
  }

  .intro {
    font-size: 14px;
    color: rgba(var(--color-text-rgb), 0.75);
    line-height: 1.6;
    margin: 0 0 20px;
    font-style: italic;
  }

  .section {
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(var(--color-text-rgb), 0.07);
    border-radius: 14px;
    padding: 14px 16px;
    margin-bottom: 8px;
  }

  .section h2 {
    font-size: 13px;
    font-weight: bold;
    color: rgba(var(--color-text-rgb), 0.9);
    margin: 0 0 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .section p {
    font-size: 13px;
    color: rgba(var(--color-text-rgb), 0.6);
    line-height: 1.6;
    margin: 0;
  }
</style>
