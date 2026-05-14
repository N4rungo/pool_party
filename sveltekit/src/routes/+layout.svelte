<!--
  Layout racine de l'application.

  Tout ce qu'on met ici entoure CHAQUE page (launcher, jeux, etc.).
  Le <slot /> est l'emplacement où SvelteKit injecte la page courante.

  C'est ici qu'on importe le CSS global (app.css) avec ses design tokens
  et qu'on monte les composants globaux (Toast, ConfirmDialog).
-->
<script>
  import { onMount } from 'svelte';
  import '../app.css';
  import Toast from '$lib/components/Toast.svelte';
  import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
  import { installPrompt } from '$lib/stores/pwa.js';

  onMount(() => {
    const handler = (e) => {
      e.preventDefault();
      installPrompt.set(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  });
</script>

<slot />

<Toast />
<ConfirmDialog />
