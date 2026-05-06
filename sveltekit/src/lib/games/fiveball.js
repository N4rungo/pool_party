/**
 * Logique métier du 5-Ball — variante du billard français version fléchettes.
 *
 * Règles couvertes :
 *  - 2 à 6 joueurs
 *  - Score de départ par joueur (51 par défaut, ajustable individuellement)
 *  - 5 billes : verte (1), rouge (2), bleue (6), blanche/jaune (4) = cue balls
 *  - Cue ball alternée à chaque tour : tour pair = blanche, impair = jaune
 *  - À son tour, on doit caramboler ≥ 2 billes ; le score = somme des valeurs
 *  - Engagement (1er tour) : la rouge doit obligatoirement être touchée
 *  - Bust : si le score restant tombe sur 1, 2 ou 4 → tour annulé
 *  - Score négatif → tour annulé
 *  - 0 pile → victoire
 */

export const FIVE_BALL_MIN_PLAYERS     = 2;
export const FIVE_BALL_MAX_PLAYERS     = 6;
export const FIVE_BALL_DEFAULT_PLAYERS = 2;

export const FIVE_BALL_DEFAULT_TARGET  = 51;
export const FIVE_BALL_MIN_TARGET      = 21;
export const FIVE_BALL_TARGET_STEP     = 10;

// Scores restants impossibles à clore en un coup à 2+ carambolages
export const FIVE_BALL_BUST_REMAINING  = [1, 2, 4];

export const FIVE_BALL_HISTORY_MAX     = 10;

// id -> { value, label, asset }
export const FIVE_BALL_BALLS = {
  red:    { id: 'red',    value: 2, label: 'Rouge',   asset: 'rouge_2.png'   },
  green:  { id: 'green',  value: 1, label: 'Verte',   asset: 'verte_1.png'   },
  blue:   { id: 'blue',   value: 6, label: 'Bleue',   asset: 'bleue_6.png'   },
  white:  { id: 'white',  value: 4, label: 'Blanche', asset: 'blanche_4.png' },
  yellow: { id: 'yellow', value: 4, label: 'Jaune',   asset: 'jaune_4.png'   },
};

// Ordre d'affichage en T (utilisé par le composant pour positionner sur la grille)
export const FIVE_BALL_BOARD_LAYOUT = ['red', 'blue', 'white', 'green', 'yellow'];

/**
 * Crée l'état initial à partir de la liste des joueurs configurés.
 * `setupPlayers` est un tableau [{ name, target }].
 */
export function createInitialState(setupPlayers) {
  return {
    players: setupPlayers.map(p => ({
      name:   p.name || 'Joueur',
      target: p.target,
      score:  p.target,
    })),
    currentIndex: 0,
    turnNumber:   0,
    isFirstTurn:  true,
    selected:     [],
    history:      [],
  };
}

/**
 * Renvoie l'id de la cue ball du tour courant ('white' ou 'yellow').
 * Alternance stricte : tour pair = blanche, tour impair = jaune.
 */
export function activeCueBall(state) {
  return state.turnNumber % 2 === 0 ? 'white' : 'yellow';
}

/**
 * Somme des valeurs des billes actuellement sélectionnées.
 */
export function selectedTotal(state) {
  return state.selected.reduce(
    (sum, id) => sum + FIVE_BALL_BALLS[id].value, 0
  );
}

/**
 * Indique si un score restant donné serait un bust (impossible à clore).
 */
export function isBustRemaining(remaining) {
  return remaining < 0 || FIVE_BALL_BUST_REMAINING.includes(remaining);
}

/**
 * Toggle une bille dans la sélection courante. Renvoie un nouvel état.
 * Refuse de toggler la cue ball active.
 */
export function toggleBall(state, ballId) {
  if (ballId === activeCueBall(state)) return state;
  const selected = [...state.selected];
  const idx = selected.indexOf(ballId);
  if (idx >= 0) selected.splice(idx, 1);
  else          selected.push(ballId);
  return { ...state, selected };
}

/**
 * Renvoie un snapshot deep-copy pour l'historique.
 */
function snapshot(state) {
  return JSON.stringify({
    players:      state.players,
    currentIndex: state.currentIndex,
    turnNumber:   state.turnNumber,
    isFirstTurn:  state.isFirstTurn,
  });
}

/**
 * Push avec rotation si plein.
 */
function pushHistory(history, snap) {
  const next = [...history, snap];
  if (next.length > FIVE_BALL_HISTORY_MAX) next.shift();
  return next;
}

/**
 * Valide le tour courant. Renvoie { newState, outcome } où outcome est :
 *  - { kind: 'fault', reason: 'count' | 'engagement' | 'bust', detail }
 *  - { kind: 'scored', delta }
 *  - { kind: 'win', winner }
 */
export function validateTurn(state) {
  const selected  = state.selected;
  const player    = state.players[state.currentIndex];
  const total     = selectedTotal(state);
  const remaining = player.score - total;

  const validCount = selected.length >= 2;
  const hasRed     = selected.includes('red');
  const bust       = isBustRemaining(remaining);

  // Snapshot avant modification (pour permettre l'undo)
  const newHistory = pushHistory(state.history, snapshot(state));

  let outcome;
  let newPlayers = state.players;

  if (!validCount) {
    outcome = {
      kind:   'fault',
      reason: 'count',
      detail: selected.length === 1
        ? '1 seule bille touchée — tour passé.'
        : 'Aucune bille touchée — tour passé.',
    };
  } else if (state.isFirstTurn && !hasRed) {
    outcome = {
      kind:   'fault',
      reason: 'engagement',
      detail: 'Engagement raté : la rouge doit être touchée en premier.',
    };
  } else if (bust) {
    outcome = {
      kind:   'fault',
      reason: 'bust',
      detail: remaining < 0
        ? `Score négatif (${remaining}) — tour annulé.`
        : `Reste ${remaining} : score impossible à clore — tour annulé.`,
    };
  } else {
    // Coup légal et scorant
    newPlayers = state.players.map((p, i) =>
      i === state.currentIndex ? { ...p, score: remaining } : p
    );

    if (remaining === 0) {
      // Victoire
      const newState = {
        ...state,
        players:     newPlayers,
        history:     newHistory,
        isFirstTurn: false,
      };
      return { newState, outcome: { kind: 'win', winner: newPlayers[state.currentIndex] } };
    }

    outcome = { kind: 'scored', delta: total };
  }

  // Tour suivant (succès ou faute, on avance)
  const newState = {
    ...state,
    players:      newPlayers,
    history:      newHistory,
    isFirstTurn:  false,
    selected:     [],
    turnNumber:   state.turnNumber + 1,
    currentIndex: (state.currentIndex + 1) % state.players.length,
  };

  return { newState, outcome };
}

/**
 * Annule la dernière action. Renvoie l'état précédent (ou state inchangé).
 */
export function undo(state) {
  if (state.history.length === 0) return state;
  const newHistory = [...state.history];
  const prev = JSON.parse(newHistory.pop());
  return {
    players:      prev.players,
    currentIndex: prev.currentIndex,
    turnNumber:   prev.turnNumber,
    isFirstTurn:  prev.isFirstTurn,
    selected:     [],
    history:      newHistory,
  };
}
