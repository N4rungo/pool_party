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
  import LangPicker from '$lib/components/LangPicker.svelte';
  import { waitLocale } from 'svelte-i18n';
  import { setLang, hasChosenLang } from '$lib/i18n/index.js';
  import { browser } from '$app/environment';

  afterNavigate(() => window.scrollTo({ top: 0, behavior: 'instant' }));

  let langPickerOpen = browser && !hasChosenLang();

  function handleLangPick(e) {
    setLang(e.detail);
    langPickerOpen = false;
  }
</script>

{#await waitLocale()}
  <!-- traductions en cours de chargement -->
{:then}
  <slot />
  <Toast />
  <ConfirmDialog />
  <LangPicker open={langPickerOpen} on:pick={handleLangPick} />
{/await}

