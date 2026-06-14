<!--
  Layout racine de l'application.

  Tout ce qu'on met ici entoure CHAQUE page (launcher, jeux, etc.).
  Le <slot /> est l'emplacement où SvelteKit injecte la page courante.

  C'est ici qu'on importe le CSS global (app.css) avec ses design tokens
  et qu'on monte les composants globaux (Toast, ConfirmDialog).
-->
<script>
  import '../app.css';
  import { afterNavigate } from '$app/navigation';
  import Toast from '$lib/components/Toast.svelte';
  import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
  import { waitLocale } from 'svelte-i18n';

  // Remet la vue en haut à chaque navigation entre pages
  afterNavigate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
</script>

{#await waitLocale()}
  <!-- traductions en cours de chargement -->
{:then}
  <slot />
  <Toast />
  <ConfirmDialog />
{/await}

