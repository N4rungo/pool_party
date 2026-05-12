/**
 * Logique métier du Snooker.
 *
 * 3 phases de jeu :
 *  - 'red'     → le joueur doit jouer une rouge (ou multi-rouges).
 *  - 'color'   → le joueur doit jouer une couleur (la couleur empochée
 *                est remise sur sa case).
 *  - 'endgame' → toutes les rouges sont sorties, on joue les couleurs
 *                dans l'ordre (jaune→verte→marron→bleue→rose→noire).
 *                Cette fois, les couleurs ne sont PAS remises.
 *
 * Faute : valeur minimale 4, sinon valeur de la bille concernée
 * (jusqu'à 7 pour la noire).
 *
 * Modes :
 *  - 'simple' : les autres joueurs reçoivent automatiquement les points.
 *  - 'expert' : le joueur lésé peut choisir entre prendre les points ou
 *               faire rejouer le fautif. En phase 'red' ou 'endgame',
 *               on lui propose aussi la free ball.
 */

export const SNOOKER_BALLS = {
  red:    { id: 'red',    points: 1,  icon: '/assets/rouge.png',   label: 'Rouge'  },
  yellow: { id: 'yellow', points: 2,  icon: '/assets/jaune.png',   label: 'Jaune'  },
  green:  { id: 'green',  points: 3,  icon: '/assets/verte.png',   label: 'Verte'  },
  brown:  { id: 'brown',  points: 4,  icon: '/assets/marron.png',  label: 'Marron' },
  blue:   { id: 'blue',   points: 5,  icon: '/assets/bleue.png',   label: 'Bleue'  },
  pink:   { id: 'pink',   points: 6,  icon: '/assets/rose.png',    label: 'Rose'   },
  black:  { id: 'black',  points: 7,  icon: '/assets/noire.png',   label: 'Noire'  },
};

export const SNOOKER_COLORS_ORDER = ['yellow', 'green', 'brown', 'blue', 'pink', 'black'];

export const SNOOKER_TOTAL_REDS    = 15;
export const SNOOKER_MIN_PLAYERS   = 2;
export const SNOOKER_MAX_PLAYERS   = 6;
export const SNOOKER_DEFAULT_PLAYERS = 2;

export const SNOOKER_MIN_FAULT     = 4;
export const SNOOKER_HISTORY_MAX   = 10;

/**
 * Crée l'état initial à partir des joueurs configurés et du mode.
 */
export function createInitialState(setupPlayers, mode) {
  return {
    players: setupPlayers.map(p => ({
      name:         p.name || 'Joueur',
      score:        0,
      currentBreak: 0,
      bestBreak:    0,
    })),
    currentIndex:    0,
    redsRemaining:   SNOOKER_TOTAL_REDS,
    phase:           'red',           // 'red' | 'color' | 'endgame'
    endgameColorIdx: 0,               // 0 → jaune, ..., 5 → noire
    mode,                             // 'simple' | 'expert'

    // États transitoires d'expertise / free ball
    freeBallActive:  false,           // true = le bouton « Free Ball » est dispo
    mustReplay:      false,           // true = on affiche « X rejoue (faute) »

    history: [],
  };
}

// ── Snapshot / undo ─────────────────────────────────────
function snapshot(state) {
  return JSON.stringify({
    players:         state.players,
    currentIndex:    state.currentIndex,
    redsRemaining:   state.redsRemaining,
    phase:           state.phase,
    endgameColorIdx: state.endgameColorIdx,
    freeBallActive:  state.freeBallActive,
    mustReplay:      state.mustReplay,
  });
}

function pushHistory(history, snap) {
  const next = [...history, snap];
  if (next.length > SNOOKER_HISTORY_MAX) next.shift();
  return next;
}

export function undo(state) {
  if (state.history.length === 0) return state;
  const newHistory = [...state.history];
  const prev = JSON.parse(newHistory.pop());
  return {
    ...state,
    players:         prev.players,
    currentIndex:    prev.currentIndex,
    redsRemaining:   prev.redsRemaining,
    phase:           prev.phase,
    endgameColorIdx: prev.endgameColorIdx,
    freeBallActive:  prev.freeBallActive,
    mustReplay:      prev.mustReplay,
    history:         newHistory,
  };
}

// ── Helpers ─────────────────────────────────────────────
function bumpBestBreak(player) {
  if (player.currentBreak > player.bestBreak) {
    return { ...player, bestBreak: player.currentBreak };
  }
  return player;
}

function endgameLabel(state) {
  const ball = SNOOKER_COLORS_ORDER[state.endgameColorIdx];
  return SNOOKER_BALLS[ball];
}

export function phaseLabel(state) {
  if (state.phase === 'red')   return '🔴 Jouer une rouge';
  if (state.phase === 'color') return '🎱 Jouer une couleur';
  if (state.phase === 'endgame') {
    const b = endgameLabel(state);
    return `Phase finale — jouer : ${b.label} (${b.points} pts)`;
  }
  return '';
}

export function rankedPlayers(state) {
  return [...state.players].sort((a, b) => b.score - a.score);
}

// ── Empocher une bille ──────────────────────────────────
/**
 * Renvoie { newState, outcome } où outcome est :
 *  - { kind: 'continue' }
 *  - { kind: 'win', winner }
 */
export function pocketBall(state, ballId) {
  const newHistory = pushHistory(state.history, snapshot(state));
  const pts = SNOOKER_BALLS[ballId].points;
  let players = state.players.map((p, i) => {
    if (i !== state.currentIndex) return p;
    let np = { ...p, score: p.score + pts, currentBreak: p.currentBreak + pts };
    return bumpBestBreak(np);
  });

  let phase = state.phase;
  let redsRemaining = state.redsRemaining;
  let endgameColorIdx = state.endgameColorIdx;
  let freeBallActive = false;  // toute action consomme la free ball
  let mustReplay = false;

  if (ballId === 'red') {
    redsRemaining--;
    phase = redsRemaining > 0 ? 'color' : 'color'; // après une rouge, on joue une couleur
    // Note : si redsRemaining = 0, après la couleur suivante on bascule en endgame
  } else {
    // Couleur empochée
    if (state.phase === 'color') {
      // Remise en jeu de la couleur, retour à 'red' (ou endgame si plus de rouges)
      phase = redsRemaining > 0 ? 'red' : 'endgame';
    } else if (state.phase === 'endgame') {
      endgameColorIdx++;
      if (endgameColorIdx >= SNOOKER_COLORS_ORDER.length) {
        // Plus de couleurs → fin de partie
        const newState = {
          ...state,
          players,
          history: newHistory,
          freeBallActive: false,
          mustReplay: false,
        };
        const winner = rankedPlayers(newState)[0];
        return { newState, outcome: { kind: 'win', winner } };
      }
      phase = 'endgame';
    }
  }

  return {
    newState: {
      ...state,
      players,
      history: newHistory,
      phase,
      redsRemaining,
      endgameColorIdx,
      freeBallActive,
      mustReplay,
    },
    outcome: { kind: 'continue' },
  };
}

// ── Multi-shot (plusieurs rouges + couleurs en un coup) ─
/**
 * Calcule les points d'un multi-shot { reds, colors: { [colorId]: bool } }.
 */
export function multiShotPoints(multiShot) {
  const redPts = multiShot.reds * SNOOKER_BALLS.red.points;
  const colorPts = SNOOKER_COLORS_ORDER
    .filter(c => multiShot.colors[c])
    .reduce((sum, c) => sum + SNOOKER_BALLS[c].points, 0);
  return { redPts, colorPts, total: redPts + colorPts };
}

/**
 * Applique un multi-shot. Reds sont soustraites, points ajoutés, phase passée
 * à 'color' (la couleur du dernier coup est remise en jeu pour le coup suivant).
 */
export function applyMultiShot(state, multiShot) {
  const newHistory = pushHistory(state.history, snapshot(state));
  const { total } = multiShotPoints(multiShot);

  let players = state.players.map((p, i) => {
    if (i !== state.currentIndex) return p;
    let np = { ...p, score: p.score + total, currentBreak: p.currentBreak + total };
    return bumpBestBreak(np);
  });

  return {
    newState: {
      ...state,
      players,
      history:        newHistory,
      redsRemaining:  state.redsRemaining - multiShot.reds,
      phase:          'color',  // après un multi-shot, on est en phase couleur (cf. règle)
      freeBallActive: false,
      mustReplay:     false,
    },
    points: total,
  };
}

// ── Faute ────────────────────────────────────────────────
/**
 * Valeur minimale d'une faute selon la phase.
 */
export function getMinFault(state) {
  if (state.phase === 'red') return SNOOKER_MIN_FAULT;
  if (state.phase === 'color') return SNOOKER_MIN_FAULT;
  if (state.phase === 'endgame') {
    return Math.max(SNOOKER_MIN_FAULT, endgameLabel(state).points);
  }
  return SNOOKER_MIN_FAULT;
}

/**
 * Applique une faute en MODE SIMPLE :
 * - reset le break du fautif
 * - les autres joueurs reçoivent `value` points
 * - passe la main au suivant
 */
export function applyFaultSimple(state, value) {
  const newHistory = pushHistory(state.history, snapshot(state));
  const faulterIdx = state.currentIndex;

  let players = state.players.map((p, i) => {
    if (i === faulterIdx) {
      return bumpBestBreak({ ...p, currentBreak: 0 });
    }
    return { ...p, score: p.score + value };
  });

  // Le break vient d'être validé pour le fautif via bumpBestBreak.
  // On passe la main avec recalcul de phase.
  let phase = state.phase;
  if (state.redsRemaining > 0) {
    phase = 'red';
  } else if (state.redsRemaining === 0 && state.phase === 'color') {
    phase = 'endgame';
  }

  return {
    newState: {
      ...state,
      players,
      history:        newHistory,
      phase,
      currentIndex:   (faulterIdx + 1) % state.players.length,
      mustReplay:     false,
      freeBallActive: false,
    }
  };
}

/**
 * Applique une faute en MODE EXPERT, choix `replay` :
 *  - Si replay = true  : le fautif rejoue (currentIndex inchangé), mustReplay = true.
 *    Les autres reçoivent quand même les points.
 *  - Si replay = false : le joueur suivant prend la main. Si phase 'red' ou
 *    'endgame', on signale qu'on peut proposer la free ball (askFreeBall = true).
 */
export function applyFaultExpert(state, value, replay) {
  const newHistory = pushHistory(state.history, snapshot(state));
  const faulterIdx = state.currentIndex;

  // Tous les non-fautifs prennent les points
  let players = state.players.map((p, i) => {
    if (i === faulterIdx) {
      return bumpBestBreak({ ...p, currentBreak: 0 });
    }
    return { ...p, score: p.score + value };
  });

  if (replay) {
    return {
      newState: {
        ...state,
        players,
        history: newHistory,
        mustReplay: true,
        freeBallActive: false,
      },
      askFreeBall: false,
    };
  }

  // Le joueur suivant prend la main
  const next = (faulterIdx + 1) % state.players.length;
  const askFreeBall = state.phase === 'red' || state.phase === 'endgame';

  return {
    newState: {
      ...state,
      players,
      history: newHistory,
      currentIndex: next,
      mustReplay: false,
      freeBallActive: false,
    },
    askFreeBall,
  };
}

/**
 * Active ou non la free ball après une faute expert.
 */
export function setFreeBall(state, useFreeBall) {
  return { ...state, freeBallActive: useFreeBall };
}

/**
 * Joue la free ball : ajoute des points (1 en phase red, sinon valeur de
 * la couleur courante en endgame). En endgame, la couleur courante reste
 * à jouer (endgameColorIdx ne change pas).
 */
export function playFreeBall(state) {
  const newHistory = pushHistory(state.history, snapshot(state));

  let pts = 0;
  let phase = state.phase;
  if (state.phase === 'red') {
    pts = 1;
    phase = 'color';  // après une free ball en phase rouge, on joue une couleur
  } else if (state.phase === 'endgame') {
    pts = endgameLabel(state).points;
    // phase reste 'endgame', endgameColorIdx ne bouge pas
  }

  let players = state.players.map((p, i) => {
    if (i !== state.currentIndex) return p;
    let np = { ...p, score: p.score + pts, currentBreak: p.currentBreak + pts };
    return bumpBestBreak(np);
  });

  return {
    ...state,
    players,
    history:        newHistory,
    phase,
    freeBallActive: false,
    mustReplay:     false,
  };
}

// ── Passer la main volontairement ───────────────────────
export function endTurn(state) {
  const newHistory = pushHistory(state.history, snapshot(state));
  return nextPlayerInternal({ ...state, history: newHistory });
}

/**
 * Helper interne : passe au joueur suivant, reset breaks et flags.
 * Recalcule la phase en fonction des rouges restantes.
 */
function nextPlayerInternal(state) {
  const cur = state.players[state.currentIndex];
  const players = state.players.map((p, i) =>
    i === state.currentIndex ? bumpBestBreak({ ...p, currentBreak: 0 }) : p
  );

  let phase = state.phase;
  if (state.redsRemaining > 0) {
    phase = 'red';
  } else if (state.redsRemaining === 0 && state.phase === 'color') {
    phase = 'endgame';
  }

  return {
    ...state,
    players,
    currentIndex:   (state.currentIndex + 1) % state.players.length,
    phase,
    mustReplay:     false,
    freeBallActive: false,
  };
}
