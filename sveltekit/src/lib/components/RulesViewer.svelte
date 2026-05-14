<!--
  Composant RulesViewer : ouvre les règles d'un jeu dans un Overlay,
  en chargeant le fichier markdown correspondant et en le rendant via marked.

  Usage :
    <RulesViewer gameId="killer" open={showRules} on:close={() => showRules = false} />
-->
<script>
  import { onMount } from 'svelte';
  import { marked } from 'marked';
  import { base } from '$app/paths';
  import Overlay from './Overlay.svelte';

  export let gameId = null;
  export let open = false;

  let html = '';
  let loading = false;
  let error = null;

  // À chaque changement de gameId pendant que l'overlay est ouvert,
  // on (re)charge le fichier markdown correspondant.
  $: if (open && gameId) loadRules(gameId);

  async function loadRules(id) {
    loading = true;
    error = null;
    html = '';
    try {
      const r = await fetch(`${base}/rules/${id}.md`);
      if (!r.ok) throw new Error(`Règles ${id} non trouvées (${r.status})`);
      const md = await r.text();
      html = marked.parse(md);
    } catch (e) {
      error = e.message;
    } finally {
      loading = false;
    }
  }
</script>

<Overlay {open} on:close>
  <div class="rules-content">
    {#if loading}
      <div class="rules-loading">⏳ Chargement…</div>
    {:else if error}
      <div class="rules-error">⚠️ {error}</div>
    {:else}
      <!-- @html : injecte le HTML rendu par marked. Le contenu vient
           de fichiers .md qu'on contrôle, pas d'entrée utilisateur ↦ pas de risque XSS. -->
      {@html html}
    {/if}
  </div>
</Overlay>

<style>
  .rules-loading,
  .rules-error {
    text-align: center;
    padding: 40px 12px;
    color: rgba(255, 255, 255, 0.6);
  }
  .rules-error { color: #ff8a8a; }

  /* Styles markdown — :global() est nécessaire car le HTML est injecté
     dynamiquement (Svelte ne voit pas les balises rendues par marked). */
  .rules-content :global(h1) {
    text-align: left;
    font-size: 24px;
    letter-spacing: 1px;
    padding: 0;
    margin: 0 0 4px;
    color: var(--color-gold);
  }
  .rules-content :global(blockquote) {
    border-left: 3px solid var(--color-gold);
    padding: 4px 0 4px 12px;
    margin: 8px 0 16px;
    color: rgba(255, 255, 255, 0.7);
    font-style: italic;
  }
  .rules-content :global(h2) {
    font-size: 17px;
    margin: 18px 0 8px;
    color: var(--color-gold-light);
    letter-spacing: 0.5px;
  }
  .rules-content :global(h3) {
    font-size: 15px;
    margin: 14px 0 6px;
    color: rgba(255, 255, 255, 0.95);
  }
  .rules-content :global(p) {
    font-size: 14px;
    line-height: 1.5;
    margin: 6px 0;
    color: rgba(255, 255, 255, 0.85);
  }
  .rules-content :global(ul),
  .rules-content :global(ol) {
    padding-left: 22px;
    margin: 6px 0;
  }
  .rules-content :global(li) {
    font-size: 14px;
    line-height: 1.5;
    margin: 4px 0;
    color: rgba(255, 255, 255, 0.85);
  }
  .rules-content :global(strong) { color: white; }
  .rules-content :global(em)     { color: rgba(255, 255, 255, 0.7); }
  .rules-content :global(code) {
    background: rgba(0, 0, 0, 0.35);
    padding: 1px 6px;
    border-radius: 4px;
    font-size: 13px;
  }
  .rules-content :global(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0;
    font-size: 13px;
  }
  .rules-content :global(th),
  .rules-content :global(td) {
    padding: 6px 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);
    text-align: left;
    vertical-align: top;
  }
  .rules-content :global(th) {
    color: var(--color-gold);
    font-weight: bold;
    background: rgba(0, 0, 0, 0.2);
  }
  .rules-content :global(tr:last-child td) { border-bottom: none; }
</style>
