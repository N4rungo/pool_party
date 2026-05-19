/**
 * Logique métier du Killer.
 *
 * Concept :
 *  - Chaque joueur démarre avec un nombre de vies (1-5).
 *  - À son tour : tir réussi (rien) / raté (-1 vie) / noire (+1 vie capé à 5).
 *  - 0 vie = éliminé. Dernier en vie = vainqueur.
 *  - Jokers : 3 utilisations max par joueur. Deux modes :
 *     • 'random' : pool commun mélangé, on tire au hasard.
 *     • 'choice' : 1 de chaque type par joueur, libre.
 *  - 3 jokers : ⏭️ pass, ✋ hand, 🎯 target.
 *  - Joker target : le joueur ciblé joue immédiatement un tour 'forcé'
 *    (sans pouvoir utiliser de joker), puis la partie reprend après
 *    le joueur d'origine.
 */

export const JOKER_TYPES = [
  { id: 'pass',   icon: '⏭️', label: 'Passez votre tour',   desc: 'La main passe directement au joueur suivant' },
  { id: 'hand',   icon: '✋',  label: 'Bille en main',      desc: 'Posez la blanche où vous voulez avant de jouer' },
  { id: 'target', icon: '🎯', label: 'Choisir un joueur', desc: 'Ce joueur joue immédiatement un tour forcé' },
];

export const KILLER_MIN_PLAYERS     = 2;
export const KILLER_MAX_PLAYERS     = 16;
export const KILLER_DEFAULT_PLAYERS = 4;

export const KILLER_MIN_LIVES     = 1;
export const KILLER_MAX_LIVES     = 5;
export const KILLER_DEFAULT_LIVES = 3;

export const KILLER_MAX_JOKERS    = 3;
export const KILLER_HISTORY_MAX   = 10;

// Fisher-Yates shuffle
function shuffle(arr) {
  const r = [...arr];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

/**
 * Crée l'état initial à partir de la liste setup.
 *  - shuffle l'ordre des joueurs (l'ordre de jeu est tiré au sort)
 *  - en mode 'random', construit le pool : count × 3 jokers, mélangé
 */
export function createInitialState(setupPlayers, jokerMode) {
  const shuffled = shuffle(setupPlayers).map(p => ({
    name:       p.name || 'Joueur',
    lives:      p.lives,
    jokers:     jokerMode === 'choice'
                  ? { pass: 1, hand: 1, target: 1 }
                  : { pass: 0, hand: 0, target: 0 },
    jokersUsed: 0,
    eliminated: false,
  }));

  let pool = [];
  if (jokerMode === 'random') {
    JOKER_TYPES.forEach(j => {
      for (let i = 0; i < shuffled.length; i++) pool.push(j.id);
    });
    pool = shuffle(pool);
  }

  return {
    players:        shuffled,
    currentIndex:   0,
    jokerMode,
    pool,
    forcedTurnFor:  null,   // index du joueur en tour forcé, ou null
    forcedTurnBack: null,   // index où retourner après le tour forcé
    history:        [],
  };
}

// ── Snapshot / undo ─────────────────────────────────────
function snapshot(state) {
  return JSON.stringify({
    players:        state.players,
    currentIndex:   state.currentIndex,
    pool:           state.pool,
    forcedTurnFor:  state.forcedTurnFor,
    forcedTurnBack: state.forcedTurnBack,
  });
}

function pushHistory(history, snap) {
  const next = [...history, snap];
  if (next.length > KILLER_HISTORY_MAX) next.shift();
  return next;
}

export function undo(state) {
  if (state.history.length === 0) return state;
  const newHistory = [...state.history];
  const prev = JSON.parse(newHistory.pop());
  return {
    ...state,
    players:        prev.players,
    currentIndex:   prev.currentIndex,
    pool:           prev.pool,
    forcedTurnFor:  prev.forcedTurnFor,
    forcedTurnBack: prev.forcedTurnBack,
    history:        newHistory,
  };
}

// ── Helpers ─────────────────────────────────────────────
/**
 * Index du joueur dont c'est le tour (gère le tour forcé).
 */
export function activeIndex(state) {
  return state.forcedTurnFor !== null ? state.forcedTurnFor : state.currentIndex;
}

/**
 * Avance currentIndex au prochain joueur non éliminé.
 */
function nextAlive(state) {
  const total = state.players.length;
  let next = (state.currentIndex + 1) % total;
  let safety = 0;
  while (state.players[next].eliminated && safety++ < total) {
    next = (next + 1) % total;
  }
  return next;
}

/**
 * Fin d'un tour : si on était en tour forcé, on revient au currentIndex
 * d'origine ; sinon on passe au suivant.
 */
function endTurn(state) {
  if (state.forcedTurnFor !== null) {
    return {
      ...state,
      currentIndex:   state.forcedTurnBack,
      forcedTurnFor:  null,
      forcedTurnBack: null,
    };
  }
  return {
    ...state,
    currentIndex: nextAlive(state),
  };
}

/**
 * Le joueur actif peut-il utiliser un joker ?
 */
export function canUseJoker(state) {
  if (state.forcedTurnFor !== null) return false;  // pas pendant un tour forcé
  const player = state.players[state.currentIndex];
  if (player.jokersUsed >= KILLER_MAX_JOKERS) return false;
  if (state.jokerMode === 'random') return state.pool.length > 0;
  return Object.values(player.jokers).some(v => v > 0);
}

// ── Actions de tir ──────────────────────────────────────
/**
 * Action standard : 'hit' | 'miss' | 'black'.
 * Renvoie { newState, outcome } où outcome est :
 *  - { kind: 'hit' }
 *  - { kind: 'miss', livesLeft }
 *  - { kind: 'eliminated', name }
 *  - { kind: 'black', gained: bool, newLives }
 *  - { kind: 'win', winner }
 */
export function doAction(state, type) {
  const newHistory = pushHistory(state.history, snapshot(state));
  const idx = activeIndex(state);
  let players = state.players.map((p, i) => i === idx ? { ...p } : p);
  const player = players[idx];

  let outcome;

  if (type === 'hit') {
    outcome = { kind: 'hit', name: player.name };
  } else if (type === 'miss') {
    player.lives = Math.max(0, player.lives - 1);
    if (player.lives === 0) {
      player.eliminated = true;
      const alive = players.filter(p => !p.eliminated);
      if (alive.length === 1) {
        return {
          newState: { ...state, players, history: newHistory },
          outcome:  { kind: 'win', winner: alive[0] }
        };
      }
      outcome = { kind: 'eliminated', name: player.name };
    } else {
      outcome = { kind: 'miss', name: player.name, livesLeft: player.lives };
    }
  } else if (type === 'black') {
    if (player.lives < KILLER_MAX_LIVES) {
      player.lives++;
      outcome = { kind: 'black', name: player.name, gained: true, newLives: player.lives };
    } else {
      outcome = { kind: 'black', name: player.name, gained: false, newLives: player.lives };
    }
  } else {
    return { newState: state, outcome: { kind: 'noop' } };
  }

  // Avance le tour
  const newState = endTurn({ ...state, players, history: newHistory });
  return { newState, outcome };
}

// ── Jokers ──────────────────────────────────────────────
/**
 * En mode 'random' : tire un joker au hasard du pool. Renvoie
 * { newState, jokerId } (snapshote l'historique).
 */
export function drawRandomJoker(state) {
  if (state.pool.length === 0) return { newState: state, jokerId: null };
  const newHistory = pushHistory(state.history, snapshot(state));
  const idx = Math.floor(Math.random() * state.pool.length);
  const newPool = [...state.pool];
  const drawn = newPool.splice(idx, 1)[0];
  return {
    newState: { ...state, pool: newPool, history: newHistory },
    jokerId:  drawn,
  };
}

/**
 * Utilise un joker (mode 'choice' ou après un tirage random).
 * Renvoie { newState, action: 'pass'|'hand'|'target' }.
 *  - 'pass'   : la main passe immédiatement
 *  - 'hand'   : aucun changement immédiat (le joueur joue ensuite normalement)
 *  - 'target' : passer ensuite par applyTarget(state, targetIdx)
 *
 * Pour 'pass' et 'hand' : on snapshote AVANT et on applique l'effet.
 * Pour 'target' : on snapshote AVANT (le forced turn lui-même ne snapshote pas).
 */
export function useJoker(state, jokerId) {
  const newHistory = pushHistory(state.history, snapshot(state));
  const idx = state.currentIndex;
  const players = state.players.map((p, i) => {
    if (i !== idx) return p;
    return {
      ...p,
      jokersUsed: p.jokersUsed + 1,
      jokers:     state.jokerMode === 'choice'
                    ? { ...p.jokers, [jokerId]: Math.max(0, p.jokers[jokerId] - 1) }
                    : p.jokers,
    };
  });

  let newState = { ...state, players, history: newHistory };

  if (jokerId === 'pass') {
    newState = { ...newState, currentIndex: nextAlive(newState) };
  }
  // 'hand' : pas d'effet immédiat (juste consommé)
  // 'target' : c'est applyTarget qui finalisera

  return { newState, action: jokerId };
}

/**
 * Cible un joueur après l'usage du joker 'target'.
 * Le joueur cible joue un tour forcé.
 */
export function applyTarget(state, targetIdx) {
  return {
    ...state,
    forcedTurnFor:  targetIdx,
    forcedTurnBack: state.currentIndex,
  };
}

/**
 * Liste des cibles possibles pour le joker target (tous sauf actif et éliminés).
 */
export function targetCandidates(state) {
  return state.players
    .map((p, i) => ({ ...p, index: i }))
    .filter(p => !p.eliminated && p.index !== state.currentIndex);
}
