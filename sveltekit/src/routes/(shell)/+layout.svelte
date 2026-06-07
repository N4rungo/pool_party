<script>
  import { page } from '$app/stores';
  import { base } from '$app/paths';
  import { goto } from '$app/navigation';

  const NAV = [
    { id: 'jeux',     path: '/',          label: 'Jeux',      icon: '🎱' },
    { id: 'joueurs',  path: '/players',   label: 'Joueurs',   icon: '👥' },
    { id: 'stats',    path: '/stats',     label: 'Stats',     icon: '📊' },
    { id: 'reglages', path: '/settings',  label: 'Réglages',  icon: '⚙️' },
  ];

  $: rawPath = $page.url.pathname.replace(base, '') || '/';

  $: activeId = (() => {
    if (rawPath === '/' || rawPath === '') return 'jeux';
    if (rawPath.startsWith('/players'))  return 'joueurs';
    if (rawPath.startsWith('/stats'))    return 'stats';
    if (rawPath.startsWith('/settings')) return 'reglages';
    return 'jeux';
  })();

  $: headerTitle = NAV.find(n => n.id === activeId)?.label ?? 'Pool Party';
</script>

<!-- Sticky header -->
<header class="shell-header">
  <img src="{base}/assets/pool_party.png" alt="" class="header-icon" />
  <span class="header-title">{headerTitle}</span>
</header>

<!-- Scrollable content -->
<div class="shell-content">
  <slot />
</div>

<!-- Bottom navigation -->
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

<style>
  /* Neutralise le padding-bottom du body géré ici */
  :global(body) {
    padding-bottom: 0 !important;
  }

  /* ── Header ── */
  .shell-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 200;
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    background: rgba(20, 60, 34, 0.92);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  }

  .header-icon {
    width: 28px;
    height: 28px;
    object-fit: contain;
  }

  .header-title {
    font-size: 15px;
    font-weight: bold;
    color: var(--color-gold);
    letter-spacing: 2px;
    text-transform: uppercase;
    text-shadow: 0 0 12px rgba(var(--color-gold-rgb), 0.35);
  }

  /* ── Content ── */
  .shell-content {
    padding-top: 52px;
    padding-bottom: calc(64px + env(safe-area-inset-bottom, 0px));
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
  }

  /* ── Bottom nav ── */
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
    background: rgba(16, 50, 28, 0.96);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-top: 1px solid rgba(255, 255, 255, 0.08);
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
    color: rgba(255, 255, 255, 0.4);
    font-family: inherit;
    transition: color 0.15s;
    -webkit-tap-highlight-color: transparent;
    padding: 0;
  }

  .nav-item.active {
    color: var(--color-gold);
  }

  .nav-icon {
    font-size: 22px;
    line-height: 1;
  }

  .nav-label {
    font-size: 10px;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
</style>
