/**
 * Logique métier du Casin.
 *
 * Concept :
 *  - 9 actions distinctes (Direct, Libre, Rouge, 1 bande, ..., Casin).
 *  - Chaque joueur doit réussir CHAQUE action X fois (X commun par défaut,
 *    ajustable individuellement).
 *  - À son tour, le joueur annonce l'action qu'il vise. S'il la réussit →
 *    coche +1, mais ne pourra PAS la ré-annoncer au tour suivant
 *    (interdiction de répéter la même action 2 fois d'affilée).
 *  - S'il rate l'action mais réalise un coup légal de billard (les 2 billes
 *    touchées) → il continue, peut ré-annoncer ce qu'il veut. C'est le
 *    "coup libre" / neutralShot.
 *  - S'il rate complètement → la main passe (et lastAction est reset).
 *  - Premier à compléter sa checklist (toutes les 9 actions × X) gagne.
 */

export const CASIN_ACTIONS = [
  { id: 'direct',      icon: '🎯',  label: 'Direct',      desc: 'Toucher les 2 billes sans toucher de bande' },
  { id: 'libre',       icon: '🔓',  label: 'Libre',       desc: 'Aucune restriction' },
  { id: 'rouge',       icon: '🔴',  label: 'Rouge',       desc: 'Toucher la bille rouge en premier' },
  { id: 'bande1',      icon: '1️⃣', label: '1 bande',     desc: '1 bande avant de toucher la 2e bille' },
  { id: 'bande2',      icon: '2️⃣', label: '2 bandes',    desc: '2 bandes avant de toucher la 2e bille' },
  { id: 'bande3',      icon: '3️⃣', label: '3 bandes',    desc: '3 bandes ou + avant de toucher la 2e bille' },
  { id: 'bande_avant', icon: '↩️',  label: 'Bande avant', desc: 'Au moins 1 bande avant de toucher les 2 billes' },
  { id: 'main_gauche', icon: '✋',  label: 'Main gauche',  desc: 'Coup légal avec la main non dominante' },
  { id: 'casin',       icon: '🌀',  label: 'Casin',       desc: 'Toucher la rouge qui touche la 2e bille via au moins 1 bande' },
];

export const CASIN_MIN_PLAYERS = 2;
export const CASIN_MAX_PLAYERS = 6;
export const CASIN_DEFAULT_X   = 2;
export const CASIN_MIN_X       = 1;
export const CASIN_MAX_X       = 5;

export const CASIN_HISTORY_MAX = 10;

/**
 * Crée l'état initial.
 */
export function createInitialState(setupPlayers) {
  return {
    players: setupPlayers.map(p => ({
      name: p.name || 'Joueur',
      x:    p.x,
      // Compteur initialisé à 0 pour chaque action
      scores: Object.fromEntries(CASIN_ACTIONS.map(a => [a.id, 0])),
      lastAction: null,
    })),
    currentIndex: 0,
    history:      [],
  };
}

// ── Snapshot / undo ─────────────────────────────────────
function snapshot(state) {
  return JSON.stringify({
    players:      state.players,
    currentIndex: state.currentIndex,
  });
}

function pushHistory(history, snap) {
  const next = [...history, snap];
  if (next.length > CASIN_HISTORY_MAX) next.shift();
  return next;
}

export function undo(state) {
  if (state.history.length === 0) return state;
  const newHistory = [...state.history];
  const prev = JSON.parse(newHistory.pop());
  return {
    ...state,
    players:      prev.players,
    currentIndex: prev.currentIndex,
    history:      newHistory,
  };
}

// ── Helpers ─────────────────────────────────────────────
/**
 * Renvoie le nb d'actions complétées pour un joueur (chacune ≥ x).
 */
export function doneCount(player) {
  return CASIN_ACTIONS.filter(a => player.scores[a.id] >= player.x).length;
}

/**
 * Vrai si toutes les actions sont complétées pour ce joueur.
 */
export function isComplete(player) {
  return CASIN_ACTIONS.every(a => player.scores[a.id] >= player.x);
}

// ── Actions ─────────────────────────────────────────────
/**
 * Le joueur valide une action (carambolage réussi correspondant à
 * l'action annoncée). Renvoie { newState, outcome } :
 *  - { kind: 'closed' }  : l'action était déjà complétée (no-op)
 *  - { kind: 'scored', actionId }
 *  - { kind: 'win', winner }
 */
export function doAction(state, actionId) {
  const player = state.players[state.currentIndex];

  if (player.scores[actionId] >= player.x) {
    return { newState: state, outcome: { kind: 'closed' } };
  }

  const newHistory = pushHistory(state.history, snapshot(state));
  const newPlayers = state.players.map((p, i) => {
    if (i !== state.currentIndex) return p;
    return {
      ...p,
      scores:     { ...p.scores, [actionId]: p.scores[actionId] + 1 },
      lastAction: actionId,
    };
  });

  const newState = {
    ...state,
    players: newPlayers,
    history: newHistory,
  };

  const updated = newPlayers[state.currentIndex];
  if (isComplete(updated)) {
    return { newState, outcome: { kind: 'win', winner: updated } };
  }
  return { newState, outcome: { kind: 'scored', actionId } };
}

/**
 * Coup libre : carambolage légal sans action validée. Reset
 * lastAction pour permettre de toutes les retenter au prochain coup
 * (même tour). No-op si lastAction est déjà null.
 */
export function neutralShot(state) {
  const player = state.players[state.currentIndex];
  if (player.lastAction === null) {
    return { newState: state, outcome: { kind: 'noop' } };
  }
  const newHistory = pushHistory(state.history, snapshot(state));
  const newPlayers = state.players.map((p, i) =>
    i === state.currentIndex ? { ...p, lastAction: null } : p
  );
  return {
    newState: { ...state, players: newPlayers, history: newHistory },
    outcome:  { kind: 'reset' },
  };
}

/**
 * Passe la main au joueur suivant. Reset lastAction du joueur courant.
 */
export function nextPlayer(state) {
  const newHistory = pushHistory(state.history, snapshot(state));
  const newPlayers = state.players.map((p, i) =>
    i === state.currentIndex ? { ...p, lastAction: null } : p
  );
  return {
    ...state,
    players:      newPlayers,
    history:      newHistory,
    currentIndex: (state.currentIndex + 1) % state.players.length,
  };
}
