/**
 * Logique métier du jeu Pool (8-ball américain).
 * Fonctions pures — la réactivité est gérée côté .svelte.
 */

export const POOL_MAX_HISTORY = 5;

/**
 * Crée l'état initial d'une partie.
 *
 * @param {{ label: string, players: { name: string, profileId: string|null }[] }[]} teams
 *   Tableau de 2 équipes
 * @param {'winner'|'alternate'} breakOrder
 *   Règle de casse entre les parties
 * @param {number|null} initialBreakerIndex
 *   Indice de l'équipe qui casse en premier (null = tirage aléatoire)
 */
export function createInitialState(teams, breakOrder, initialBreakerIndex = null) {
  return {
    teams,
    breakerTeamIndex: initialBreakerIndex !== null
      ? initialBreakerIndex
      : (Math.random() < 0.5 ? 0 : 1),
    breakOrder,
    history: [],
  };
}

function snapshot(state) {
  return { breakerTeamIndex: state.breakerTeamIndex };
}

function pushHistory(history, snap) {
  const next = [...history, snap];
  if (next.length > POOL_MAX_HISTORY) next.shift();
  return next;
}

/**
 * Déclare le vainqueur d'une partie.
 * Met à jour breakerTeamIndex pour la prochaine partie selon breakOrder.
 *
 * @param {object} state
 * @param {number} winnerTeamIndex  — 0 ou 1
 * @returns {{ newState: object, outcome: { kind: 'win', winnerTeamIndex: number, winnerTeam: object } }}
 */
export function declareWinner(state, winnerTeamIndex) {
  const nextBreakerTeamIndex = state.breakOrder === 'winner'
    ? winnerTeamIndex
    : 1 - state.breakerTeamIndex;

  const newState = {
    ...state,
    breakerTeamIndex: nextBreakerTeamIndex,
    history: pushHistory(state.history, snapshot(state)),
  };

  return {
    newState,
    outcome: {
      kind: 'win',
      winnerTeamIndex,
      winnerTeam: state.teams[winnerTeamIndex],
    },
  };
}

/**
 * Annule la dernière déclaration de victoire.
 */
export function undo(state) {
  if (state.history.length === 0) return state;
  const newHistory = [...state.history];
  const prev = newHistory.pop();
  return {
    ...state,
    breakerTeamIndex: prev.breakerTeamIndex,
    history: newHistory,
  };
}
