<script>
  import Overlay from './Overlay.svelte';
  import { t } from 'svelte-i18n';

  export let gameNumber = 1;
  export let totalGames = 3;
  export let winners = [];
  export let matchScores = {};
  export let isLastGame = false;
  export let onNext = () => {};
  export let onViewFinal = () => {};
  export let onAbandon = () => {};
  export let onUndo = null;
  export let canUndo = false;

  $: sortedPlayers = Object.entries(matchScores)
    .map(([name, pts]) => ({ name, pts }))
    .sort((a, b) => b.pts - a.pts);

  $: winnerText = winners.length === 1
    ? winners[0]
    : winners.join(' & ');
</script>

<Overlay open={true} dismissOnBackdrop={false} showClose={false}>
  <div class="recap-content">
    <div class="recap-header">
      {$t('match.gameFinished', { values: { n: gameNumber, total: totalGames } })}
    </div>

    <div class="recap-winner-row">
      <span class="recap-winner-trophy">🏆</span>
      <span class="recap-winner-name">{winnerText}</span>
    </div>
    <div class="recap-winner-sub">{$t('match.winsGame')}</div>

    <div class="recap-standings-label">{$t('match.standingsLabel')}</div>
    <div class="standings-table">
      {#each sortedPlayers as player, i}
        <div class="standings-row" class:leader={i === 0 && player.pts > 0}>
          <span class="standings-rank">{i + 1}</span>
          <span class="standings-name">{player.name}</span>
          <span class="standings-pts">{$t('match.wins', { values: { count: player.pts } })}</span>
        </div>
      {/each}
    </div>
  </div>

  <svelte:fragment slot="footer">
    {#if onUndo && canUndo}
      <button class="btn-undo" on:click={onUndo}>
        {$t('win.undo')}
      </button>
    {/if}

    {#if isLastGame}
      <button class="btn-main btn-gold" on:click={onViewFinal}>
        {$t('match.viewFinal')}
      </button>
    {:else}
      <button class="btn-main btn-gold" on:click={onNext}>
        {$t('match.nextGame')}
      </button>
    {/if}

    <button class="btn-abandon" on:click={onAbandon}>
      {$t('match.abandon')}
    </button>
  </svelte:fragment>
</Overlay>

<style>
  .recap-content {
    text-align: center;
  }

  .recap-header {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.55);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 10px;
  }

  .recap-winner-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-bottom: 4px;
  }

  .recap-winner-trophy {
    font-size: 28px;
    line-height: 1;
  }

  .recap-winner-name {
    font-size: 22px;
    font-weight: bold;
    color: var(--color-gold);
    text-shadow: 0 0 16px rgba(var(--color-gold-rgb), 0.4);
  }

  .recap-winner-sub {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.5);
    margin-bottom: 14px;
  }

  .recap-standings-label {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.4);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 6px;
  }

  .standings-table {
    display: flex;
    flex-direction: column;
    gap: 5px;
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

  .btn-undo {
    display: block;
    width: 100%;
    background: rgba(255, 255, 255, 0.07);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 12px;
    color: rgba(255, 255, 255, 0.65);
    font-family: inherit;
    font-size: 14px;
    cursor: pointer;
    padding: 10px;
    margin-bottom: 10px;
    transition: background 0.15s, color 0.15s;
  }

  .btn-undo:hover {
    background: rgba(255, 255, 255, 0.12);
    color: white;
  }

  .btn-abandon {
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.35);
    font-family: inherit;
    font-size: 13px;
    cursor: pointer;
    padding: 6px 8px 0;
    text-decoration: underline;
    text-underline-offset: 3px;
    transition: color 0.15s;
  }

  .btn-abandon:hover {
    color: rgba(255, 255, 255, 0.6);
  }
</style>
