/**
 * Logique métier du jeu Chicago — extraite du composant Svelte pour rester
 * testable et lisible. Que des fonctions pures (sauf le random initial) ;
 * la réactivité est gérée côté .svelte.
 */

export const CHICAGO_TARGET_SCORE = 61;
export const CHICAGO_MAX_HISTORY  = 5;

// Triangle : numéros des billes par rangée (1 en haut, 11-15 en bas)
export const CHICAGO_TRIANGLE = [
  [1],
  [2, 3],
  [4, 5, 6],
  [7, 8, 9, 10],
  [11, 12, 13, 14, 15],
];

/**
 * Crée l'état initial de la partie à partir des noms de joueurs.
 * Tirage au sort de qui commence (currentIndex = 0 ou 1).
 */
export function createInitialState(player0Name, player1Name) {
  return {
    players: [
      { name: player0Name || 'Joueur 1', score: 0 },
      { name: player1Name || 'Joueur 2', score: 0 },
    ],
    currentIndex: Math.random() < 0.5 ? 0 : 1,
    pocketedBalls: new Set(),
    history: [],
  };
}

/**
 * Renvoie un snapshot deep-copy de l'état (pour pousser dans l'historique).
 */
function snapshot(state) {
  return {
    players:       state.players.map(p => ({ ...p })),
    currentIndex:  state.currentIndex,
    pocketedBalls: [...state.pocketedBalls],
  };
}

/**
 * Pousse un snapshot dans l'historique, avec rotation si plein.
 * Retourne le nouvel historique.
 */
function pushHistory(history, snap) {
  const next = [...history, snap];
  if (next.length > CHICAGO_MAX_HISTORY) next.shift();
  return next;
}

/**
 * Empoche une bille pour le joueur actif.
 * Retourne { newState, outcome } où outcome est :
 *   - { kind: 'continue' }
 *   - { kind: 'win', winner: player }
 *   - { kind: 'draw', score: number }
 *   - { kind: 'noop' } si la bille était déjà empochée
 */
export function pocketBall(state, ballNumber) {
  if (state.pocketedBalls.has(ballNumber)) {
    return { newState: state, outcome: { kind: 'noop' } };
  }

  const newState = {
    players:       state.players.map(p => ({ ...p })),
    currentIndex:  state.currentIndex,
    pocketedBalls: new Set(state.pocketedBalls),
    history:       pushHistory(state.history, snapshot(state)),
  };
  newState.pocketedBalls.add(ballNumber);
  newState.players[newState.currentIndex].score += ballNumber;

  const [p0, p1] = newState.players;

  // Victoire au score
  if (p0.score >= CHICAGO_TARGET_SCORE || p1.score >= CHICAGO_TARGET_SCORE) {
    return { newState, outcome: { kind: 'win', winner: p0.score > p1.score ? p0 : p1 } };
  }

  // Toutes les billes empochées
  if (newState.pocketedBalls.size === 15) {
    if (p0.score === p1.score) {
      return { newState, outcome: { kind: 'draw', score: p0.score } };
    }
    return { newState, outcome: { kind: 'win', winner: p0.score > p1.score ? p0 : p1 } };
  }

  return { newState, outcome: { kind: 'continue' } };
}

/**
 * Passe la main à l'autre joueur.
 */
export function endTurn(state) {
  return {
    ...state,
    history:      pushHistory(state.history, snapshot(state)),
    currentIndex: state.currentIndex === 0 ? 1 : 0,
  };
}

/**
 * Annule la dernière action. Renvoie l'état précédent (ou state inchangé si rien à annuler).
 */
export function undo(state) {
  if (state.history.length === 0) return state;
  const newHistory = [...state.history];
  const prev = newHistory.pop();
  return {
    players:       prev.players,
    currentIndex:  prev.currentIndex,
    pocketedBalls: new Set(prev.pocketedBalls),
    history:       newHistory,
  };
}
