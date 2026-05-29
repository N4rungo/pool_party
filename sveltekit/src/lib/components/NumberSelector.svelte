<!--
  Sélecteur numérique générique : [− valeur +]

  Utilisé partout où il faut choisir un nombre :
   - nombre de joueurs (5 jeux)
   - score cible (3 jeux)
   - nombre de vies (Killer)
   - X global (Casin)
   - manches gagnantes (futur)

  Props :
   - value : nombre courant (utiliser bind:value pour la liaison 2-way)
   - min   : borne basse (incluse)
   - max   : borne haute (incluse)
   - step  : incrément à chaque clic (1 par défaut)
   - label : optionnel — texte affiché en gras au-dessus du contrôle

  Événement :
   - change : émis avec la nouvelle valeur (utile si on préfère pas le bind)

  Exemple :
    <NumberSelector bind:value={count} min={2} max={6} label="Nombre de joueurs" />
    <NumberSelector bind:value={target} min={21} max={300} step={10} />
-->
<script>
  import { createEventDispatcher } from 'svelte';

  export let value;
  export let min = 0;
  export let max = Infinity;
  export let step = 1;
  export let label = null;

  const dispatch = createEventDispatcher();

  function change(delta) {
    const next = Math.min(max, Math.max(min, value + delta * step));
    if (next !== value) {
      value = next;
      dispatch('change', next);
    }
  }
</script>

<div class="number-selector-wrap">
  {#if label}<div class="ns-label">{label}</div>{/if}
  <div class="number-selector">
    <button class="btn-round" on:click={() => change(-1)} disabled={value <= min}>−</button>
    <span class="ns-value">{value}</span>
    <button class="btn-round" on:click={() => change(+1)} disabled={value >= max}>+</button>
  </div>
</div>

<style>
  .number-selector-wrap {
    text-align: center;
  }

  .ns-label {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 8px;
  }

  .number-selector {
    display: inline-flex;
    align-items: center;
    gap: clamp(10px, 4vw, 16px);
    margin: 4px 0;
  }

  .ns-value {
    font-size: clamp(24px, 8vw, 32px);
    font-weight: bold;
    color: var(--color-gold);
    text-shadow: 0 0 16px rgba(var(--color-gold-rgb), 0.4);
    min-width: clamp(44px, 14vw, 56px);
    text-align: center;
  }

  .btn-round {
    width: clamp(36px, 11vw, 44px);
    height: clamp(36px, 11vw, 44px);
    border-radius: 50%;
    border: none;
    background: linear-gradient(145deg, var(--color-gold-light), var(--color-gold));
    color: var(--color-pool);
    font-size: clamp(18px, 5.5vw, 22px);
    font-weight: bold;
    cursor: pointer;
    box-shadow: 0 3px 0 var(--color-gold-dark);
    transition: transform .1s, box-shadow .1s, opacity .15s;
    line-height: 1;
  }

  .btn-round:active:not(:disabled) {
    transform: translateY(2px);
    box-shadow: none;
  }

  .btn-round:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
</style>
