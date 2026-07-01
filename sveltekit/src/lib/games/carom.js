/**
 * Logique métier de la Carambole (billard français).
 *
 * Concept clé :
 *  - Le jeu se joue par BREAKS : à son tour, le joueur réussit autant de
 *    caramboles que possible d'affilée. Une carambole = la bille blanche
 *    touche les deux autres billes en un seul coup → +1 point.
 *  - Quand le joueur rate, il passe la main (Suivant). Le break courant
 *    est validé : si > bestBreak, il devient le nouveau bestBreak.
 *  - Pas de faute pénalisante en carambole classique.
 *  - Victoire : un joueur atteint son score cible.
 */

export const CAROM_MIN_PLAYERS    = 2;
export const CAROM_MAX_PLAYERS    = 6;
export const CAROM_DEFAULT_TARGET = 20;
export const CAROM_MIN_TARGET     = 5;
export const CAROM_MAX_TARGET     = 200;
export const CAROM_TARGET_STEP    = 5;

export const CAROM_HISTORY_MAX    = 10;

export function createInitialState(setupPlayers) {
  return {
    players: setupPlayers.map(p => ({
      name:      p.name || 'Joueur',
      target:    p.target,
      score:     0,
      bestBreak: 0,
    })),
    currentIndex: 0,
    currentBreak: 0,
    history:      [],
  };
}

function snapshot(state) {
  return JSON.stringify({
    players:      state.players,
    currentIndex: state.currentIndex,
    currentBreak: state.currentBreak,
  });
}

function pushHistory(history, snap) {
  const next = [...history, snap];
  if (next.length > CAROM_HISTORY_MAX) next.shift();
  return next;
}

export function undo(state) {
  if (state.history.length === 0) return state;
  const newHistory = [...state.history];
  const prev = JSON.parse(newHistory.pop());
  return {
    players:      prev.players,
    currentIndex: prev.currentIndex,
    currentBreak: prev.currentBreak,
    history:      newHistory,
  };
}

/**
 * Augmente le break courant de 1 (carambole réussie).
 * Renvoie { newState, outcome } où outcome est :
 *   - { kind: 'continue' }
 *   - { kind: 'win', winner }
 */
export function incBreak(state) {
  const newHistory = pushHistory(state.history, snapshot(state));
  const newPlayers = state.players.map((p, i) =>
    i === state.currentIndex ? { ...p, score: p.score + 1 } : p
  );
  const player = newPlayers[state.currentIndex];

  const newState = {
    ...state,
    players:      newPlayers,
    currentBreak: state.currentBreak + 1,
    history:      newHistory,
  };

  if (player.score >= player.target) {
    const finalPlayers = newPlayers.map((p, i) =>
      i === state.currentIndex
        ? { ...p, bestBreak: Math.max(p.bestBreak, newState.currentBreak) }
        : p
    );
    return {
      newState: { ...newState, players: finalPlayers, currentBreak: 0 },
      outcome:  { kind: 'win', winner: finalPlayers[state.currentIndex] }
    };
  }

  return { newState, outcome: { kind: 'continue' } };
}

/**
 * Diminue le break courant de 1 (correction). Refuse si break = 0.
 */
export function decBreak(state) {
  if (state.currentBreak === 0) return state;
  const newPlayers = state.players.map((p, i) =>
    i === state.currentIndex ? { ...p, score: Math.max(0, p.score - 1) } : p
  );
  return {
    ...state,
    players:      newPlayers,
    currentBreak: state.currentBreak - 1,
  };
}

/**
 * Passe la main. Valide le bestBreak du joueur courant.
 */
export function passTurn(state) {
  const newHistory = pushHistory(state.history, snapshot(state));
  const newPlayers = state.players.map((p, i) =>
    i === state.currentIndex
      ? { ...p, bestBreak: Math.max(p.bestBreak, state.currentBreak) }
      : p
  );
  return {
    ...state,
    players:      newPlayers,
    currentBreak: 0,
    currentIndex: (state.currentIndex + 1) % state.players.length,
    history:      newHistory,
  };
}

export function rankedPlayers(state) {
  return [...state.players].sort((a, b) => b.score - a.score);
}
