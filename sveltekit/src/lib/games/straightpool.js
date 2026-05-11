/**
 * Logique métier du 14-1 Continu (straight pool).
 *
 * Concept clé :
 *  - Le jeu se joue par BREAKS : à son tour, on empoche autant de billes
 *    que possible d'affilée. À chaque bille empochée → +1 dans le break
 *    courant ET +1 dans le score total.
 *  - Quand on rate, on passe la main (Suivant). Le break courant est
 *    "validé" : si > bestBreak, il devient le nouveau bestBreak.
 *  - Faute : −1 point, passe la main. Le bestBreak validé est
 *    (break - 1) (sans le point retiré).
 *  - Victoire : un joueur atteint son score cible.
 *
 *  L'historique snapshote les +1 et les passages de main / fautes
 *  (pas les -1 qui sont des corrections).
 */

export const STRAIGHTPOOL_MIN_PLAYERS    = 2;
export const STRAIGHTPOOL_MAX_PLAYERS    = 6;
export const STRAIGHTPOOL_DEFAULT_TARGET = 50;
export const STRAIGHTPOOL_MIN_TARGET     = 10;
export const STRAIGHTPOOL_MAX_TARGET     = 300;
export const STRAIGHTPOOL_TARGET_STEP    = 10;

export const STRAIGHTPOOL_HISTORY_MAX    = 10;

/**
 * Crée l'état initial à partir de la liste des joueurs configurés.
 * `setupPlayers` est un tableau [{ name, target }].
 */
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

// ── Snapshot / undo ─────────────────────────────────────
function snapshot(state) {
  return JSON.stringify({
    players:      state.players,
    currentIndex: state.currentIndex,
    currentBreak: state.currentBreak,
  });
}

function pushHistory(history, snap) {
  const next = [...history, snap];
  if (next.length > STRAIGHTPOOL_HISTORY_MAX) next.shift();
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

// ── Actions ─────────────────────────────────────────────
/**
 * Augmente le break courant de 1 (et le score total).
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
    // Victoire — on valide le bestBreak final
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
 * Diminue le break courant de 1 (correction). NE sauvegarde PAS dans
 * l'historique (c'est une simple correction). Refuse si break = 0.
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
 * Passe la main. Valide le bestBreak du joueur courant si > ancien max.
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

/**
 * Faute : −1 point, passe la main. bestBreak validé sur (break - 1).
 */
export function fault(state) {
  const newHistory = pushHistory(state.history, snapshot(state));
  const effectiveBreak = Math.max(0, state.currentBreak - 1);
  const newPlayers = state.players.map((p, i) => {
    if (i !== state.currentIndex) return p;
    return {
      ...p,
      score:     Math.max(0, p.score - 1),
      bestBreak: Math.max(p.bestBreak, effectiveBreak),
    };
  });
  return {
    ...state,
    players:      newPlayers,
    currentBreak: 0,
    currentIndex: (state.currentIndex + 1) % state.players.length,
    history:      newHistory,
  };
}

/**
 * Renvoie les joueurs triés par score décroissant (pour le ranking final).
 */
export function rankedPlayers(state) {
  return [...state.players].sort((a, b) => b.score - a.score);
}
