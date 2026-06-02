<!--
  MatchSummaryOverlay — récap final du match, affiché après la dernière partie.

  Props :
    - matchScores : { playerName: matchPoints }
    - results     : tableau complet des résultats de chaque partie
    - gameId      : string
    - totalGames  : number
    - onPlayAgain : callback → rejouer un match avec les mêmes paramètres
    - onNewGame   : callback → retour à l'accueil
-->
<script>
  import Overlay from './Overlay.svelte';

  export let matchScores = {};
  export let results = [];
  export let gameId = '';
  export let totalGames = 3;
  export let onPlayAgain = () => {};
  export let onNewGame = () => {};

  // Classement final trié
  $: sortedPlayers = Object.entries(matchScores)
    .map(([name, pts]) => ({ name, pts }))
    .sort((a, b) => b.pts - a.pts);

  // Déterminer le(s) vainqueur(s) du match
  $: maxPts = sortedPlayers.length > 0 ? sortedPlayers[0].pts : 0;
  $: matchWinners = sortedPlayers.filter(p => p.pts === maxPts).map(p => p.name);
  $: isTie = matchWinners.length > 1;

  $: winnerText = isTie
    ? matchWinners.join(' & ')
    : matchWinners[0] ?? '—';

  // Pour la grille per-game : liste des noms de joueurs
  $: players = sortedPlayers.map(p => p.name);

  // Vérifie si un joueur a gagné une partie donnée
  function wonGame(playerName, gameNumber) {
    const result = results.find(r => r.gameNumber === gameNumber);
    if (!result) return false;
    return result.winners.includes(playerName);
  }
</script>

<Overlay open={true} dismissOnBackdrop={false}>
  <div class="summary-content">
    <div class="summary-header">Match terminé !</div>

    <div class="summary-trophy">🏆</div>
    <div class="summary-winner-label">
      {#if isTie}Égalité :{:else}Vainqueur du match :{/if}
    </div>
    <div class="summary-winner-name">{winnerText}</div>

    <!-- Classement final -->
    <div class="section-label">Classement final</div>
    <div class="standings-table">
      {#each sortedPlayers as player, i}
        <div class="standings-row" class:winner={i === 0 && !isTie || (isTie && player.pts === maxPts)}>
          <span class="standings-rank">{i + 1}</span>
          <span class="standings-name">{player.name}</span>
          <span class="standings-pts">
            {player.pts} / {totalGames}
            <span class="standings-pts-label"> victoire{player.pts !== 1 ? 's' : ''}</span>
          </span>
        </div>
      {/each}
    </div>

    <!-- Grille par partie -->
    {#if results.length > 0 && players.length > 0}
      <div class="section-label">Détail des parties</div>
      <div class="game-grid">
        <!-- En-tête -->
        <div class="grid-header">
          <div class="grid-name-cell"></div>
          {#each Array(totalGames) as _, g}
            <div class="grid-game-cell">P{g + 1}</div>
          {/each}
        </div>
        <!-- Lignes joueurs -->
        {#each players as name}
          <div class="grid-row">
            <div class="grid-name-cell">{name}</div>
            {#each Array(totalGames) as _, g}
              <div class="grid-game-cell" class:win-cell={wonGame(name, g + 1)}>
                {wonGame(name, g + 1) ? '✓' : '·'}
              </div>
            {/each}
          </div>
        {/each}
      </div>
    {/if}

    <button class="btn-main btn-gold" on:click={onPlayAgain}>
      🔄 Rejouer un match
    </button>
    <button class="btn-main btn-gray" on:click={onNewGame}>
      ⚙️ Nouvelle partie
    </button>
  </div>
</Overlay>

<style>
  .summary-content {
    text-align: center;
    padding: 4px 0 8px;
  }

  .summary-header {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.55);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 12px;
  }

  .summary-trophy {
    font-size: 52px;
    line-height: 1;
    margin-bottom: 8px;
  }

  .summary-winner-label {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 4px;
  }

  .summary-winner-name {
    font-size: 26px;
    font-weight: bold;
    color: var(--color-gold);
    text-shadow: 0 0 16px rgba(var(--color-gold-rgb), 0.4);
    margin-bottom: 20px;
  }

  .section-label {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.4);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 8px;
    text-align: left;
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

  .standings-row.winner {
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

  .standings-row.winner .standings-name {
    color: var(--color-gold);
    font-weight: bold;
  }

  .standings-pts {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.7);
    white-space: nowrap;
    font-weight: bold;
  }

  .standings-row.winner .standings-pts {
    color: var(--color-gold);
  }

  .standings-pts-label {
    font-weight: normal;
    font-size: 11px;
  }

  /* Grille par partie */
  .game-grid {
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    overflow: hidden;
    margin-bottom: 20px;
    font-size: 13px;
  }

  .grid-header,
  .grid-row {
    display: flex;
    align-items: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }

  .grid-row:last-child {
    border-bottom: none;
  }

  .grid-header {
    background: rgba(0, 0, 0, 0.15);
  }

  .grid-name-cell {
    flex: 1;
    padding: 8px 10px;
    text-align: left;
    color: rgba(255, 255, 255, 0.6);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
  }

  .grid-header .grid-name-cell {
    color: rgba(255, 255, 255, 0.35);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .grid-game-cell {
    width: 36px;
    flex-shrink: 0;
    padding: 8px 4px;
    text-align: center;
    color: rgba(255, 255, 255, 0.25);
    font-size: 12px;
  }

  .grid-header .grid-game-cell {
    color: rgba(255, 255, 255, 0.35);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .grid-game-cell.win-cell {
    color: var(--color-gold);
    font-weight: bold;
    font-size: 15px;
  }
</style>
