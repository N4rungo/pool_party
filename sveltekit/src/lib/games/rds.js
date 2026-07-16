/**
 * RDS (Runout Drill System) — logique de jeu.
 *
 * Entraînement solo à 16 niveaux progressifs (Dr. Dave Alciatore / Bob Jewett).
 * Chaque niveau définit un rack (nombre de billes + disposition) et des
 * restrictions (bille en main, ordre de jeu, règles 8-ball/9-ball). Le joueur
 * tente 3 racks par niveau :
 *  - 2 ou 3 racks réussis → monte de niveau
 *  - 1 rack réussi        → reste au niveau
 *  - 0 rack réussi         → descend de niveau
 *
 * Voir static/rules/en/rds.md pour le détail des règles.
 */

// ── Formes de rack ────────────────────────────────────────────────────────
// slotCount : nombre d'emplacements (dans l'ordre "apex en premier")
// centerIndex : emplacement central (où placer la bille 8/9 quand imposé), ou null
// frontIndex  : emplacement de l'apex (où placer la bille 1 quand imposé)
export const SHAPES = {
  triangle6:  { slotCount: 6,  centerIndex: null, frontIndex: 0 },
  hex7:       { slotCount: 7,  centerIndex: 6,    frontIndex: 0 },
  diamond9:   { slotCount: 9,  centerIndex: 4,    frontIndex: 0 },
  triangle15: { slotCount: 15, centerIndex: 4,    frontIndex: 0 },
};

const SIX  = [1, 2, 3, 4, 5, 6];
const FIFTEEN_SEQ = Array.from({ length: 15 }, (_, i) => i + 1);

// 9 billes, 1 à l'apex, 9 au centre, 2-8 dans les autres emplacements (diamond9)
const NINEBALL_RACK = [1, 2, 3, 4, 9, 5, 6, 7, 8];

// 9 billes, 4 pleines + 4 rayées + la 8 au centre (diamond9)
const EIGHTBALL_9_RACK = [1, 9, 2, 10, 8, 3, 11, 4, 12];

// 15 billes, 7 pleines + 7 rayées + la 8 au centre (triangle15)
const EIGHTBALL_15_RACK = [1, 9, 2, 10, 8, 3, 11, 4, 12, 5, 13, 6, 14, 7, 15];

// bihMode : 'none' (niveau 1, pas de bille de touche) | 'everyShot' | nombre de BIH
//           supplémentaires autorisés pendant la remontée (en plus de celle après la casse)
export const LEVELS = [
  { level: 1,  ballCount: 6,  shape: 'triangle6',  balls: SIX,               bihMode: 'none',      inOrder: false, eightBallRules: false, nineBallRules: false, remainingInOrder: false, noCueBall: true  },
  { level: 2,  ballCount: 6,  shape: 'triangle6',  balls: SIX,               bihMode: 'everyShot',  inOrder: false, eightBallRules: false, nineBallRules: false, remainingInOrder: false, noCueBall: false },
  { level: 3,  ballCount: 6,  shape: 'triangle6',  balls: SIX,               bihMode: 3,            inOrder: false, eightBallRules: false, nineBallRules: false, remainingInOrder: false, noCueBall: false },
  { level: 4,  ballCount: 6,  shape: 'triangle6',  balls: SIX,               bihMode: 2,            inOrder: false, eightBallRules: false, nineBallRules: false, remainingInOrder: false, noCueBall: false },
  { level: 5,  ballCount: 6,  shape: 'triangle6',  balls: SIX,               bihMode: 1,            inOrder: false, eightBallRules: false, nineBallRules: false, remainingInOrder: false, noCueBall: false },
  { level: 6,  ballCount: 7,  shape: 'hex7',       balls: [1, 2, 3, 9, 10, 11, 8], bihMode: 1,       inOrder: false, eightBallRules: true,  nineBallRules: false, remainingInOrder: false, noCueBall: false },
  { level: 7,  ballCount: 9,  shape: 'diamond9',   balls: NINEBALL_RACK,     bihMode: 1,            inOrder: false, eightBallRules: false, nineBallRules: false, remainingInOrder: false, noCueBall: false },
  { level: 8,  ballCount: 9,  shape: 'diamond9',   balls: EIGHTBALL_9_RACK,  bihMode: 1,            inOrder: false, eightBallRules: true,  nineBallRules: false, remainingInOrder: false, noCueBall: false },
  { level: 9,  ballCount: 15, shape: 'triangle15', balls: FIFTEEN_SEQ,       bihMode: 2,            inOrder: false, eightBallRules: false, nineBallRules: false, remainingInOrder: false, noCueBall: false },
  { level: 10, ballCount: 6,  shape: 'triangle6',  balls: SIX,               bihMode: 0,            inOrder: true,  eightBallRules: false, nineBallRules: false, remainingInOrder: false, noCueBall: false },
  { level: 11, ballCount: 15, shape: 'triangle15', balls: FIFTEEN_SEQ,       bihMode: 0,            inOrder: false, eightBallRules: false, nineBallRules: false, remainingInOrder: false, noCueBall: false },
  { level: 12, ballCount: 15, shape: 'triangle15', balls: EIGHTBALL_15_RACK, bihMode: 0,            inOrder: false, eightBallRules: true,  nineBallRules: false, remainingInOrder: false, noCueBall: false },
  { level: 13, ballCount: 9,  shape: 'diamond9',   balls: EIGHTBALL_9_RACK,  bihMode: 0,            inOrder: false, eightBallRules: true,  nineBallRules: false, remainingInOrder: true,  noCueBall: false },
  { level: 14, ballCount: 9,  shape: 'diamond9',   balls: NINEBALL_RACK,     bihMode: 0,            inOrder: false, eightBallRules: false, nineBallRules: true,  remainingInOrder: false, noCueBall: false },
  { level: 15, ballCount: 15, shape: 'triangle15', balls: EIGHTBALL_15_RACK, bihMode: 0,            inOrder: false, eightBallRules: true,  nineBallRules: false, remainingInOrder: true,  noCueBall: false },
  { level: 16, ballCount: 15, shape: 'triangle15', balls: FIFTEEN_SEQ,       bihMode: 0,            inOrder: true,  eightBallRules: false, nineBallRules: false, remainingInOrder: false, noCueBall: false },
];

export const MIN_LEVEL = 1;
export const MAX_LEVEL = LEVELS.length;

/** Retourne la définition d'un niveau (bornée à [1, 16]). */
export function getLevel(n) {
  const clamped = Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, n));
  return LEVELS[clamped - 1];
}

/**
 * Construit la liste ordonnée des restrictions d'un niveau, sous forme de
 * fragments i18n ({ key, values }) à afficher en liste à puces.
 */
export function buildRestrictionKeys(levelDef) {
  const keys = [];
  keys.push({ key: 'rds.rule.breakRack', values: { count: levelDef.ballCount } });

  if (levelDef.noCueBall) {
    keys.push({ key: 'rds.rule.noCueBall' });
  } else if (levelDef.bihMode === 'everyShot') {
    keys.push({ key: 'rds.rule.bihEveryShot' });
  } else if (levelDef.bihMode > 0) {
    keys.push({ key: 'rds.rule.bihExtra', values: { count: levelDef.bihMode } });
  } else {
    keys.push({ key: 'rds.rule.bihBreakOnly' });
  }

  if (levelDef.inOrder) {
    keys.push({ key: 'rds.rule.inOrder' });
  } else if (!levelDef.eightBallRules && !levelDef.nineBallRules) {
    keys.push({ key: 'rds.rule.anyOrder' });
  }

  if (levelDef.eightBallRules) keys.push({ key: 'rds.rule.eightBallGroups' });
  if (levelDef.nineBallRules) keys.push({ key: 'rds.rule.nineBallRules' });
  if (levelDef.remainingInOrder) keys.push({ key: 'rds.rule.remainingInOrder' });

  return keys;
}

/**
 * Évalue une série d'essais (booléens, true = rack réussi) pour un niveau.
 *
 * @param {boolean[]} attempts
 * @returns {{
 *   successes: number,
 *   decided: boolean,           // une décision doit être proposée au joueur
 *   canFinishEarly: boolean,    // "terminer le niveau" n'a de sens qu'ici
 *   outcome: 'levelUp' | 'stay' | 'levelDown' | null,
 * }}
 */
export function evaluateAttempts(attempts) {
  const successes = attempts.filter(Boolean).length;
  const done = attempts.length >= 3;

  if (!done) {
    if (successes === 2) {
      return { successes, decided: true, canFinishEarly: true, outcome: 'levelUp' };
    }
    return { successes, decided: false, canFinishEarly: false, outcome: null };
  }

  if (successes >= 2) {
    return { successes, decided: true, canFinishEarly: false, outcome: 'levelUp' };
  }
  if (successes === 1) {
    return { successes, decided: true, canFinishEarly: false, outcome: 'stay' };
  }
  return { successes, decided: true, canFinishEarly: false, outcome: 'levelDown' };
}
