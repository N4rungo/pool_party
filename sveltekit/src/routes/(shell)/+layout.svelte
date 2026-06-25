<script>
  import { page } from '$app/stores';
  import { base } from '$app/paths';
  import { goto } from '$app/navigation';
  import Overlay from '$lib/components/Overlay.svelte';
  import { t } from 'svelte-i18n';

  const version = __APP_VERSION__;

  $: NAV = [
    { id: 'jeux',     path: '/',         label: $t('nav.games'),    title: $t('nav.games'),       icon: '🎱' },
    { id: 'joueurs',  path: '/players',  label: $t('nav.players'),  title: $t('nav.players'),     icon: '👥' },
    { id: 'stats',    path: '/stats',    label: $t('nav.stats'),    title: $t('nav.statsTitle'),  icon: '🥇' },
    { id: 'reglages', path: '/settings', label: $t('nav.settings'), title: $t('nav.settings'),    icon: '⚙️' },
  ];

  $: rawPath = $page.url.pathname.replace(base, '') || '/';

  $: activeId = (() => {
    if (rawPath === '/' || rawPath === '') return 'jeux';
    if (rawPath.startsWith('/players'))  return 'joueurs';
    if (rawPath.startsWith('/stats'))    return 'stats';
    if (rawPath.startsWith('/settings')) return 'reglages';
    return 'jeux';
  })();

  $: isHome = activeId === 'jeux';

  // ── Info overlay ────────────────────────────────────────────────────────
  let infoOpen = false;

  // Hauteur du header : 80px sur l'accueil, 52px sur les autres sections
  $: headerH = isHome ? 80 : 52;
</script>

<!-- ══ HEADER ══ -->
<header
  class="shell-header"
  class:expanded={isHome}
  class:compact={!isHome}
>
  {#if isHome}
    <!-- Section Jeux : branding complet -->
    <div class="header-home">
      <img src="{base}/assets/pool_party.png" alt="" class="header-logo" />
      <span class="header-pool-party">POOL PARTY<button
        class="header-info-btn"
        on:click={() => infoOpen = true}
        aria-label="Infos & installation"
      >i</button></span>
    </div>
  {:else}
    <!-- Autres sections : nom de la section -->
    <div class="header-section">
      <img src="{base}/assets/pool_party.png" alt="" class="header-icon-sm" />
      <span class="header-section-title">
        {NAV.find(n => n.id === activeId)?.title ?? ''}
      </span>
    </div>
  {/if}
</header>

<!-- ══ CONTENT ══ -->
<div class="shell-content" style="padding-top: {headerH}px">
  <slot />
</div>

<!-- ══ BOTTOM NAV ══ -->
<nav class="bottom-nav">
  {#each NAV as item}
    <button
      class="nav-item"
      class:active={activeId === item.id}
      on:click={() => goto(`${base}${item.path}`)}
      aria-label={item.label}
    >
      <span class="nav-icon">{item.icon}</span>
      <span class="nav-label">{item.label}</span>
    </button>
  {/each}
</nav>

<!-- ══ INFO OVERLAY (Pool Party) ══ -->
<Overlay open={infoOpen} on:close={() => infoOpen = false}>
  <div class="info-content">
    <h2>
      <img src="{base}/assets/pool_party.png" alt="" class="info-logo" />
      Pool Party
      <span class="info-version">v{version}</span>
    </h2>
    <p class="info-tagline">{$t('info.tagline')}</p>

    <div class="info-section">
      <div class="info-section-title">{$t('info.install')}</div>
      <p>{$t('info.installDesc')}</p>

      <div class="install-step">
        <div class="install-platform">{$t('info.android')}</div>
        <div class="install-instructions">{@html $t('info.androidInstructions')}</div>
      </div>

      <div class="install-step">
        <div class="install-platform">{$t('info.iphone')}</div>
        <div class="install-instructions">{@html $t('info.iphoneInstructions')}</div>
      </div>
    </div>
  </div>
</Overlay>

<style>
  /* ── Neutralise le padding-bottom body (géré ici) ── */
  :global(body) { padding-bottom: 0 !important; }

  /* ══ HEADER ══ */
  .shell-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 200;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(var(--color-pool-dark-rgb), 0.94);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(var(--color-text-rgb), 0.07);
    overflow: hidden;
  }

  .shell-header.expanded { height: 80px; }
  .shell-header.compact  { height: 52px; }

  /* ── Jeux (home) ── */
  .header-home {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
  }

  .header-logo {
    object-fit: contain;
  }

  .expanded .header-logo { width: 52px; height: 52px; }
  .compact  .header-logo { width: 32px; height: 32px; }

  .header-pool-party {
    color: var(--color-gold);
    font-weight: bold;
    text-shadow: 0 0 16px rgba(var(--color-gold-rgb), 0.45),
                 2px 2px 0 rgba(0, 0, 0, 0.4);
    letter-spacing: 3px;
    white-space: nowrap;
  }

  .expanded .header-pool-party { font-size: 26px; letter-spacing: 3px; }
  .compact  .header-pool-party { font-size: 16px; letter-spacing: 2px; }

  .header-info-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    vertical-align: super;
    font-size: 0.42em;
    width: 1.7em;
    height: 1.7em;
    border: 1.5px solid currentColor;
    border-radius: 50%;
    background: none;
    cursor: pointer;
    color: inherit;
    font-family: 'Times New Roman', Georgia, serif;
    font-style: italic;
    font-weight: 700;
    line-height: 1;
    padding: 0;
    margin-left: 0.25em;
    opacity: 0.65;
    transition: opacity 0.2s, transform 0.15s;
    -webkit-tap-highlight-color: transparent;
  }

  .header-info-btn:hover,
  .header-info-btn:active {
    opacity: 1;
    transform: scale(1.12);
  }

  /* ── Autres sections ── */
  .header-section {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }

  .header-icon-sm {
    width: 28px;
    height: 28px;
    object-fit: contain;
  }

  .header-section-title {
    font-size: 15px;
    font-weight: bold;
    color: var(--color-gold);
    letter-spacing: 2px;
    text-transform: uppercase;
    text-shadow: 0 0 12px rgba(var(--color-gold-rgb), 0.35);
  }

  /* ══ CONTENT ══ */
  .shell-content {
    padding-bottom: calc(64px + env(safe-area-inset-bottom, 0px));
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
  }

  /* ══ BOTTOM NAV ══ */
  .bottom-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 200;
    height: calc(60px + env(safe-area-inset-bottom, 0px));
    padding-bottom: env(safe-area-inset-bottom, 0px);
    display: flex;
    align-items: stretch;
    background: rgba(var(--color-pool-dark-rgb), 0.96);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-top: 1px solid rgba(var(--color-text-rgb), 0.08);
  }

  .nav-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    background: none;
    border: none;
    cursor: pointer;
    color: rgba(var(--color-text-rgb), 0.4);
    font-family: inherit;
    transition: color 0.15s;
    -webkit-tap-highlight-color: transparent;
    padding: 0;
  }

  .nav-item.active { color: var(--color-gold); }

  .nav-icon  { font-size: 22px; line-height: 1; }
  .nav-label {
    font-size: 10px;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* ══ INFO OVERLAY ══ */
  .info-content { padding: 4px 0; }

  .info-content h2 {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 22px;
    color: var(--color-gold);
    margin-bottom: 8px;
  }

  .info-logo { width: 36px; height: 36px; object-fit: contain; }

  .info-version {
    margin-left: auto;
    font-size: 12px;
    font-weight: normal;
    color: rgba(var(--color-text-rgb), 0.3);
    letter-spacing: 0.5px;
    font-family: monospace;
    align-self: center;
  }

  .info-tagline {
    font-size: 14px;
    color: rgba(var(--color-text-rgb), 0.65);
    line-height: 1.5;
    margin-bottom: 20px;
    font-style: italic;
  }

  .info-section {
    border-top: 1px solid rgba(var(--color-text-rgb), 0.1);
    padding-top: 16px;
  }

  .info-section-title {
    font-size: 15px;
    font-weight: bold;
    color: var(--color-gold-light);
    margin-bottom: 8px;
  }

  .info-section p {
    font-size: 13px;
    color: rgba(var(--color-text-rgb), 0.6);
    line-height: 1.5;
    margin-bottom: 14px;
  }

  .install-step {
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(var(--color-text-rgb), 0.08);
    border-radius: 12px;
    padding: 12px 14px;
    margin-bottom: 8px;
  }

  .install-platform {
    font-size: 13px;
    font-weight: bold;
    color: rgba(var(--color-text-rgb), 0.5);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 4px;
  }

  .install-instructions {
    font-size: 14px;
    color: rgba(var(--color-text-rgb), 0.85);
    line-height: 1.5;
  }

  .install-instructions strong { color: white; }
</style>
