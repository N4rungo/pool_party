const NINEBALL_MAX_HISTORY = 5;

/**
 * @param {Array<{name: string, profileId: string|null}>} players - ordre de jeu établi
 * @param {'alternate'|'winner'} breakOrder
 * @param {number|null} initialBreakerIndex - null = aléatoire
 */
export function createInitialState(players, breakOrder, initialBreakerIndex = null) {
  const n = players.length;
  const breakerIndex = initialBreakerIndex !== null
    ? initialBreakerIndex
    : Math.floor(Math.random() * n);
  return { players, breakOrder, breakerIndex, history: [] };
}

export function declareWinner(state, winnerIndex) {
  const snapshot = {
    players: state.players,
    breakOrder: state.breakOrder,
    breakerIndex: state.breakerIndex,
  };
  const n = state.players.length;
  const newBreakerIndex = state.breakOrder === 'winner'
    ? winnerIndex
    : (state.breakerIndex + 1) % n;
  const newState = {
    ...state,
    breakerIndex: newBreakerIndex,
    history: [...state.history.slice(-(NINEBALL_MAX_HISTORY - 1)), snapshot],
  };
  return {
    newState,
    outcome: { kind: 'win', winnerIndex, winner: state.players[winnerIndex] },
  };
}

export function undo(state) {
  if (!state.history.length) return state;
  const prev = state.history[state.history.length - 1];
  return { ...prev, history: state.history.slice(0, -1) };
}
