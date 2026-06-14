<script>
  export let lang;   // 'fr' | 'en'
  export let size = 48; // largeur en px (hauteur = size * 2/3)
</script>

{#if lang === 'fr'}
  <svg
    class="flag"
    width={size}
    height={Math.round(size * 2 / 3)}
    viewBox="0 0 60 40"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <rect width="20" height="40" fill="#002395"/>
    <rect x="20" width="20" height="40" fill="#EDEDED"/>
    <rect x="40" width="20" height="40" fill="#ED2939"/>
  </svg>
{:else if lang === 'en'}
  <svg
    class="flag"
    width={size}
    height={Math.round(size * 2 / 3)}
    viewBox="0 0 60 40"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <rect width="60" height="40" fill="#012169"/>
    <line x1="0" y1="0"  x2="60" y2="40" stroke="white"   stroke-width="8"/>
    <line x1="60" y1="0" x2="0"  y2="40" stroke="white"   stroke-width="8"/>
    <line x1="0" y1="0"  x2="60" y2="40" stroke="#C8102E" stroke-width="4.5"/>
    <line x1="60" y1="0" x2="0"  y2="40" stroke="#C8102E" stroke-width="4.5"/>
    <rect x="22"   y="0"    width="16" height="40" fill="white"/>
    <rect x="0"    y="14"   width="60" height="12" fill="white"/>
    <rect x="24.5" y="0"    width="11" height="40" fill="#C8102E"/>
    <rect x="0"    y="15.5" width="60" height="9"  fill="#C8102E"/>
  </svg>
{/if}

<style>
  .flag {
    display: block;
    border-radius: 3px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
    flex-shrink: 0;
  }
</style>
