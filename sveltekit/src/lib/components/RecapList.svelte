<!--
  Liste « récap joueurs » avec slot pour cellule custom à droite.

  Utilisé en step3 récap (5-Ball, Casin, 14-1) et potentiellement
  pour des scoreboards (Killer, 5-Ball en jeu).

  Pour chaque joueur, affiche : emoji + nom + (slot extra à droite).
  Le slot reçoit `player` et `index` pour personnaliser le contenu
  (ex. afficher des cœurs, un compteur, un sélecteur de target...).

  Usage simple (juste nom + emoji) :
    <RecapList {players} />

  Usage avec colonne extra (ex. score modifiable) :
    <RecapList {players} let:player let:i>
      <NumberSelector bind:value={player.target} min={21} step={10} />
    </RecapList>

  Props :
   - players : tableau [{ name, ... }]
   - colors : utilise BALL_COLORS par défaut (non configurable, SVG BallIcon)
-->
<script>
  import { t } from 'svelte-i18n';
  import BallIcon from '$lib/components/BallIcon.svelte';
  import { BALL_COLORS } from '$lib/constants/balls.js';

  export let players = [];
</script>

<div class="recap-list">
  {#each players as player, i (i)}
    <div class="recap-row">
      <span class="recap-emoji"><BallIcon color={BALL_COLORS[i % BALL_COLORS.length]} size="20px" /></span>
      <span class="recap-name">{player.name || $t('setup.defaultPlayer', { values: { n: i + 1 } })}</span>
      <div class="recap-extra">
        <slot {player} {i}>
          <!-- Slot par défaut : rien -->
        </slot>
      </div>
    </div>
  {/each}
</div>

<style>
  .recap-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 12px 0;
  }

  .recap-row {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 12px;
    padding: 10px 14px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 15px;
  }

  .recap-emoji {
    width: 28px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .recap-name {
    flex: 1;
    color: #fff;
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .recap-extra {
    flex-shrink: 0;
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 8px;
  }
</style>
