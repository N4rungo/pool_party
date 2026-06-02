<!--
  MatchRecapOverlay — affiché après chaque partie dans un match.

  Props :
    - gameNumber  : numéro de la partie qui vient de se terminer
    - totalGames  : nombre total de parties dans le match
    - winners     : string[] — vainqueur(s) de cette partie
    - matchScores : { playerName: matchPoints } — score de match en cours
    - isLastGame  : boolean — true si c'est la dernière partie
    - onNext      : callback → lancer la partie suivante
    - onViewFinal : callback → voir le récap final (seulement si isLastGame)
    - onAbandon   : callback → abandonner le match
-->
<script>
  import Overlay from './Overlay.svelte';

  export let gameNumber = 1;
  export let totalGames = 3;
  export let winners = [];
  export let matchScores = {};
  export let isLastGame = false;
  export let onNext = () => {};
  export let onViewFinal = () => {};
  export let onAbandon = () => {};

  // Classement trié par score de match décroissant
  $: sortedPlayers = Object.entries(matchScores)
    .map(([name, pts]) => ({ name, pts }))
    .sort((a, b) => b.pts - a.pts);

  $: winnerText = winners.length === 1
    ? winners[0]
    : winners.join(' & ');
</script>

<Overlay open={true} dismissOnBackdrop={false}>
  <div class="recap-content">
    <div class="recap-header">
      Partie {gameNumber}/{totalGames} terminée
    </div>

    <div class="recap-winner-row">
      <span class="recap-winner-trophy">🏆</span>
      <span class="recap-winner-name">{winnerText}</span>
    </div>
    <div class="recap-winner-sub">remporte cette partie</div>

    <!-- Classement du match -->
    <div class="recap-standings-label">Classement du match</div>
    <div class="standings-table">
      {#each sortedPlayers as player, i}
        <div class="standings-row" class:leader={i === 0 && player.pts > 0}>
          <span class="standings-rank">{i + 1}</span>
          <span class="standings-name">{player.name}</span>
          <span class="standings-pts">{player.pts} victoire{player.pts !== 1 ? 's' : ''}</span>
        </div>
      {/each}
    </div>

    <!-- Actions -->
    {#if isLastGame}
      <button class="btn-main btn-gold" on:click={onViewFinal}>
        Voir le récap final →
      </button>
    {:else}
      <button class="btn-main btn-gold" on:click={onNext}>
        Partie suivante →
      </button>
    {/if}

    <button class="btn-abandon" on:click={onAbandon}>
      Abandonner le match
    </button>
  </div>
</Overlay>

<style>
  .recap-content {
    text-align: center;
    padding: 4px 0 8px;
  }

  .recap-header {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.55);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 16px;
  }

  .recap-winner-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-bottom: 4px;
  }

  .recap-winner-trophy {
    font-size: 36px;
    line-height: 1;
  }

  .recap-winner-name {
    font-size: 26px;
    font-weight: bold;
    color: var(--color-gold);
    text-shadow: 0 0 16px rgba(var(--color-gold-rgb), 0.4);
  }

  .recap-winner-sub {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.5);
    margin-bottom: 20px;
  }

  .recap-standings-label {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.4);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 8px;
  }

  .standings-table {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 20px;
  }

  .standings-row {
    display: flex;
    align-items: center;
    gap: 10px;
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 10px;
    padding: 8px 12px;
    font-size: 14px;
  }

  .standings-row.leader {
    background: rgba(var(--color-gold-rgb), 0.1);
    border-color: rgba(var(--color-gold-rgb), 0.4);
  }

  .standings-rank {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.4);
    width: 18px;
    text-align: center;
    flex-shrink: 0;
  }

  .standings-name {
    flex: 1;
    text-align: left;
    color: white;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .standings-row.leader .standings-name {
    color: var(--color-gold);
    font-weight: bold;
  }

  .standings-pts {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.7);
    white-space: nowrap;
  }

  .standings-row.leader .standings-pts {
    color: var(--color-gold);
    font-weight: bold;
  }

  .btn-abandon {
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.35);
    font-family: inherit;
    font-size: 13px;
    cursor: pointer;
    padding: 8px;
    text-decoration: underline;
    text-underline-offset: 3px;
    transition: color 0.15s;
  }

  .btn-abandon:hover {
    color: rgba(255, 255, 255, 0.6);
  }
</style>
