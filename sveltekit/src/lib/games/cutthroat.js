/**
 * Logique métier du Cutthroat.
 *
 * Règles :
 *  - 2 à 15 joueurs, ordre du débutant à l'expert
 *  - 15 billes réparties en groupes (cas spécial à 2j : la 8 est retirée)
 *  - À son tour, on doit empocher une bille (de préférence adverse)
 *  - Empocher = bille passe en 'out'
 *  - Faute : remet en jeu une bille de chaque adversaire (à partir du
 *    joueur suivant le fautif, dans l'ordre)
 *  - Élimination : un joueur sans bille en jeu est éliminé
 *  - Victoire : dernier joueur non éliminé
 *
 *  L'élimination n'est PAS définitive — une faute adverse peut remettre
 *  une bille en jeu et "ressusciter" un joueur.
 */

export const CT_TOTAL_BALLS = 15;

export const CT_MIN_PLAYERS     = 2;
export const CT_MAX_PLAYERS     = 15;
export const CT_DEFAULT_PLAYERS = 3;

export const CT_HISTORY_MAX     = 10;

/**
 * Calcule la répartition des billes selon le nombre de joueurs.
 * Retourne { perPlayer, removed, groups }.
 *  - perPlayer : nombre de billes par joueur
 *  - removed   : numéros de billes non distribuées (à retirer après la casse)
 *  - groups    : groupes[i] = liste des numéros de billes du joueur i
 */
export function computeDistribution(playerCount) {
  // Cas spécial : à 2 joueurs, on retire la 8 (J1 = 1-7, J2 = 9-15)
  if (playerCount === 2) {
    return {
      perPlayer: 7,
      removed:   [8],
      groups: [
        [1, 2, 3, 4, 5, 6, 7],
        [9, 10, 11, 12, 13, 14, 15],
      ],
    };
  }

  const perPlayer = Math.floor(CT_TOTAL_BALLS / playerCount);
  const used      = perPlayer * playerCount;
  const removed   = Array.from({ length: CT_TOTAL_BALLS - used },
                               (_, i) => used + i + 1);

  const groups = Array.from({ length: playerCount }, (_, p) =>
    Array.from({ length: perPlayer }, (_, b) => p * perPlayer + b + 1)
  );

  return { perPlayer, removed, groups };
}

/**
 * Renvoie les 3 billes à placer aux coins du triangle.
 * - D'abord les billes 'removed' (en surplus)
 * - Puis, si pas assez, une bille du dernier groupe (l'expert), puis avant-dernier, etc.
 */
export function cornerBalls(distribution) {
  const { removed, groups } = distribution;
  if (removed.length >= 3) return removed.slice(0, 3);

  const corners = [...removed];
  for (let i = groups.length - 1; i >= 0 && corners.length < 3; i--) {
    corners.push(groups[i][0]);
  }
  return corners;
}

/**
 * Crée l'état initial à partir de la liste des joueurs configurés.
 * Pas de shuffle pour Cutthroat : l'ordre des joueurs définit la
 * distribution (débutant = premier groupe, expert = dernier groupe).
 */
export function createInitialState(setupPlayers) {
  const distribution = computeDistribution(setupPlayers.length);

  // Table des billes actives : { 1: 'in', 2: 'in', ... }
  // Les billes 'removed' n'apparaissent pas dans cette table.
  const balls = {};
  distribution.groups.flat().forEach(b => { balls[b] = 'in'; });

  return {
    players: setupPlayers.map(p => ({
      name: p.name || 'Joueur',
      eliminated: false,
    })),
    distribution,
    balls,
    currentIndex: 0,
    history: [],
  };
}

// ── Snapshot / undo ─────────────────────────────────────
function snapshot(state) {
  return JSON.stringify({
    players:      state.players,
    balls:        state.balls,
    currentIndex: state.currentIndex,
  });
}

function pushHistory(history, snap) {
  const next = [...history, snap];
  if (next.length > CT_HISTORY_MAX) next.shift();
  return next;
}

export function undo(state) {
  if (state.history.length === 0) return state;
  const newHistory = [...state.history];
  const prev = JSON.parse(newHistory.pop());
  return {
    ...state,
    players:      prev.players,
    balls:        prev.balls,
    currentIndex: prev.currentIndex,
    history:      newHistory,
  };
}

// ── Helpers ─────────────────────────────────────────────
/**
 * Joueurs encore en lice (au moins une bille 'in').
 */
function recomputeEliminations(state) {
  return state.players.map((p, i) => {
    const hasAny = state.distribution.groups[i]
      .some(b => state.balls[b] === 'in');
    return { ...p, eliminated: !hasAny };
  });
}

// ── Actions ─────────────────────────────────────────────
/**
 * Empoche une bille. Renvoie { newState, outcome } où outcome est :
 *  - { kind: 'continue' }
 *  - { kind: 'win', winner }
 *  - { kind: 'noop' } si la bille était déjà empochée
 */
export function pocketBall(state, ballNum) {
  if (state.balls[ballNum] !== 'in') {
    return { newState: state, outcome: { kind: 'noop' } };
  }

  const newBalls = { ...state.balls, [ballNum]: 'out' };
  let players = state.players;
  const newHistory = pushHistory(state.history, snapshot(state));

  let newState = {
    ...state,
    balls:   newBalls,
    history: newHistory,
  };

  // Recalcule éliminations
  newState.players = recomputeEliminations(newState);

  // Victoire ?
  const alive = newState.players.filter(p => !p.eliminated);
  if (alive.length === 1) {
    return { newState, outcome: { kind: 'win', winner: alive[0] } };
  }

  return { newState, outcome: { kind: 'continue' } };
}

/**
 * Applique une faute du joueur d'index `faulterIdx`.
 * Pour chaque adversaire (en partant du joueur SUIVANT le fautif), si
 * ce joueur a au moins une bille empochée, on remet en jeu la première.
 *
 * Renvoie { newState, returns: [{ playerIdx, ball }, ...] }.
 */
export function applyFault(state, faulterIdx) {
  const newHistory = pushHistory(state.history, snapshot(state));
  const newBalls   = { ...state.balls };

  const n = state.players.length;
  const returns = [];

  for (let offset = 1; offset < n; offset++) {
    const idx = (faulterIdx + offset) % n;
    const pocketed = state.distribution.groups[idx]
      .filter(b => newBalls[b] === 'out');
    if (pocketed.length > 0) {
      const ball = pocketed[0];
      newBalls[ball] = 'in';
      returns.push({ playerIdx: idx, ball });
    }
  }

  let newState = {
    ...state,
    balls:   newBalls,
    history: newHistory,
  };
  newState.players = recomputeEliminations(newState);

  return { newState, returns };
}
