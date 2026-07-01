<!--
  MatchInfoOverlay — affiche le classement du match en cours, accessible
  depuis le bouton 🏆 dans l'en-tête du jeu.

  Props :
    - open       : boolean — contrôle la visibilité
    - gameId     : string
    - currentGame: numéro de la partie en cours
    - totalGames : nombre total de parties
    - matchScores: { playerName: matchPoints }
    - results    : tableau des résultats déjà joués
-->
<script>
  import Overlay from './Overlay.svelte';
  import { t } from 'svelte-i18n';

  export let open = false;
  export let gameId = '';
  export let currentGame = 1;
  export let totalGames = 3;
  export let matchScores = {};
  export let results = [];

  $: sortedPlayers = Object.entries(matchScores)
    .map(([name, pts]) => ({ name, pts }))
    .sort((a, b) => b.pts - a.pts);

  $: maxPts = sortedPlayers.length > 0 ? sortedPlayers[0].pts : 0;

  function wonGame(playerName, gameNumber) {
    const result = results.find(r => r.gameNumber === gameNumber);
    return result ? result.winners.includes(playerName) : false;
  }
</script>

<Overlay {open} on:close>
  <div class="info-content">
    <div class="info-header">{$t('match.inProgress')}</div>
    <div class="info-progress">{$t('match.game', { values: { n: currentGame, total: totalGames } })}</div>

    <div class="section-label">{$t('match.ranking')}</div>
    <div class="standings-table">
      {#each sortedPlayers as player, i}
        <div class="standings-row" class:leader={player.pts === maxPts && player.pts > 0}>
          <span class="standings-rank">{i + 1}</span>
          <span class="standings-name">{player.name}</span>
          <span class="standings-pts">{player.pts} / {totalGames - 1}</span>
        </div>
      {/each}
    </div>

    {#if results.length > 0}
      <div class="section-label">{$t('match.gamesPlayed')}</div>
      <div class="game-grid">
        <div class="grid-header">
          <div class="grid-name-cell"></div>
          {#each Array(results.length) as _, g}
            <div class="grid-game-cell">P{g + 1}</div>
          {/each}
        </div>
        {#each sortedPlayers as player}
          <div class="grid-row">
            <div class="grid-name-cell">{player.name}</div>
            {#each Array(results.length) as _, g}
              <div class="grid-game-cell" class:win-cell={wonGame(player.name, g + 1)}>
                {wonGame(player.name, g + 1) ? '✓' : '·'}
              </div>
            {/each}
          </div>
        {/each}
      </div>
    {/if}
  </div>
</Overlay>

<style>
  .info-content {
    text-align: center;
    padding: 4px 0 8px;
  }

  .info-header {
    font-size: 13px;
    color: rgba(var(--color-text-rgb), 0.55);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 4px;
  }

  .info-progress {
    font-size: 22px;
    font-weight: bold;
    color: var(--color-gold);
    margin-bottom: 20px;
  }

  .section-label {
    font-size: 11px;
    color: rgba(var(--color-text-rgb), 0.4);
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
    border: 1px solid rgba(var(--color-text-rgb), 0.06);
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
    color: rgba(var(--color-text-rgb), 0.4);
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
    color: rgba(var(--color-text-rgb), 0.7);
    white-space: nowrap;
  }

  .standings-row.leader .standings-pts {
    color: var(--color-gold);
    font-weight: bold;
  }

  /* Grille parties jouées */
  .game-grid {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 8px;
    font-size: 13px;
  }

  .grid-header, .grid-row {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .grid-name-cell {
    flex: 1;
    text-align: left;
    color: rgba(var(--color-text-rgb), 0.6);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding: 4px 0;
  }

  .grid-game-cell {
    width: 28px;
    text-align: center;
    color: rgba(var(--color-text-rgb), 0.4);
    flex-shrink: 0;
  }

  .grid-header .grid-game-cell {
    font-size: 11px;
    color: rgba(var(--color-text-rgb), 0.35);
  }

  .win-cell {
    color: var(--color-gold);
    font-weight: bold;
  }
</style>
