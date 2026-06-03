<!--
  PlayerSetupList — remplace PlayerNameInputs avec support profils.

  Gère un tableau de picks { name, profileId } pour N joueurs.
  La liste de picks est distincte des données jeu-spécifiques (lives, target, etc.)
  qui restent dans setupPlayers de la page parente.

  Usage :
    <PlayerSetupList bind:picks count={3} />

  Props :
    picks  : { name: string, profileId: string|null }[]  (bind)
    count  : number — nombre de slots joueurs
-->
<script>
  import PlayerPicker from './PlayerPicker.svelte';

  export let picks = [];
  export let count = 2;

  // Synchronise la longueur de picks avec count
  $: {
    if (picks.length !== count) {
      picks = Array.from({ length: count }, (_, i) => ({
        name:      picks[i]?.name      ?? '',
        profileId: picks[i]?.profileId ?? null,
      }));
    }
  }

  // profileIds déjà sélectionnés (pour exclure des autres pickers)
  $: selectedIds = picks.map(p => p.profileId).filter(Boolean);
</script>

<div class="player-setup-list">
  {#each picks as pick, i}
    <PlayerPicker
      bind:value={picks[i]}
      index={i}
      exclude={selectedIds.filter(id => id !== pick.profileId)}
    />
  {/each}
</div>

<style>
  .player-setup-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
</style>
