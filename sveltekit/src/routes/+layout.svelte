<!--
  Layout racine de l'application.

  Tout ce qu'on met ici entoure CHAQUE page (launcher, jeux, etc.).
  Le <slot /> est l'emplacement où SvelteKit injecte la page courante.

  C'est ici qu'on importe le CSS global (app.css) avec ses design tokens.
-->
<script>
  import '../app.css';
</script>

<slot />
