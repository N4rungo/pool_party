<!--
  Liste d'inputs « nom du joueur » pour les setups en page unique.

  Utilisé en step2 par les jeux qui demandent les noms d'un coup
  (5-Ball, Casin, 14-1, Snooker).

  Props :
   - players : tableau d'objets { name, ... } (modifié in-place via bind)
   - maxLength : longueur max du nom (16 par défaut)
   - placeholder : placeholder commun (« Pseudo... » par défaut)

  Le composant ne fait que présenter et modifier `players[i].name` —
  les autres propriétés des joueurs (lives, target, etc.) sont préservées.

  Usage :
    <PlayerNameInputs bind:players={setup.players} />

  Note : il faut que `players` ait sa longueur connue à l'arrivée
  (ce composant ne crée pas le tableau ; il rend N inputs pour N joueurs).
-->
<script>
  import BallIcon from '$lib/components/BallIcon.svelte';
  import { BALL_COLORS } from '$lib/constants/balls.js';

  export let players = [];
  export let maxLength = 16;
  export let placeholder = null;
</script>

<div class="player-name-inputs">
  {#each players as player, i (i)}
    <div class="player-name-row">
      <span class="player-name-emoji"><BallIcon color={BALL_COLORS[i % BALL_COLORS.length]} size="22px" /></span>
      <input
        type="text"
        class="player-name-input"
        bind:value={player.name}
        {maxLength}
        placeholder={placeholder ?? `Joueur ${i + 1}...`} />
    </div>
  {/each}
</div>

<style>
  .player-name-inputs {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .player-name-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .player-name-emoji {
    width: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .player-name-input {
    flex: 1;
    background: rgba(var(--color-text-rgb), 0.08);
    border: 1px solid rgba(var(--color-text-rgb), 0.2);
    border-radius: 10px;
    color: #fff;
    font-family: inherit;
    font-size: 15px;
    padding: 10px 14px;
    outline: none;
    transition: border-color 0.2s;
  }

  .player-name-input:focus {
    border-color: rgba(var(--color-gold-rgb), 0.6);
  }

  .player-name-input::placeholder {
    color: rgba(var(--color-text-rgb), 0.3);
  }
</style>
