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
 * Voir static/rules/en/rds.md pour le détail des règles, et le PDF source
 * (static/rules/en/rds_system.pdf) pour les schémas de rack officiels dont
 * SHAPES/LEVELS ci-dessous sont une transcription fidèle.
 */

// ── Formes de rack ────────────────────────────────────────────────────────
// Chaque forme est une liste d'emplacements (dans l'ordre "apex en premier").
// centerIndex / frontIndex pointent vers les emplacements clés utilisés pour
// placer des billes précises (8, 9, 1, catégorie...).
export const SHAPES = {
  // Triangle de 6 billes (rangées 1-2-3)
  triangle6:  { slotCount: 6,  frontIndex: 0, centerIndex: 4 },
  // "Flèche" de 7 billes (rangées 1-2-3-1) — niveau 6
  arrow7:     { slotCount: 7,  frontIndex: 0, centerIndex: 4 },
  // Losange de 9 billes (rangées 1-2-3-2-1)
  diamond9:   { slotCount: 9,  frontIndex: 0, centerIndex: 4 },
  // Triangle complet de 15 billes (rangées 1-2-3-4-5)
  triangle15: { slotCount: 15, frontIndex: 0, centerIndex: 4 },
};

// Billes représentatives utilisées pour illustrer "une pleine" / "une rayée"
// dans les racks 8-ball (le PDF ne fixe pas de numéro précis, seulement la
// catégorie : on choisit une bille de chaque).
export const SOLID_SAMPLE = 1;
export const STRIPE_SAMPLE = 9;

// bihMode : 'none' (niveau 1, pas de bille de touche) | 'everyShot' | nombre de BIH
//           supplémentaires autorisés pendant la remontée (en plus de celle après la casse)
//
// special : { [slotIndex]: '8' | 'solid' | 'stripe' | <numéro de bille> }
//           emplacements dont la bille est imposée par les règles ; tous les
//           autres emplacements sont remplis avec une bille grise neutre
//           (la position exacte n'a pas d'importance pour ces niveaux).
export const LEVELS = [
  { level: 1,  ballCount: 6,  shape: 'triangle6',  special: {},                                          bihMode: 'none',     inOrder: false, eightBallRules: false, nineBallRules: false, remainingInOrder: false, noCueBall: true  },
  { level: 2,  ballCount: 6,  shape: 'triangle6',  special: {},                                          bihMode: 'everyShot', inOrder: false, eightBallRules: false, nineBallRules: false, remainingInOrder: false, noCueBall: false },
  { level: 3,  ballCount: 6,  shape: 'triangle6',  special: {},                                          bihMode: 3,           inOrder: false, eightBallRules: false, nineBallRules: false, remainingInOrder: false, noCueBall: false },
  { level: 4,  ballCount: 6,  shape: 'triangle6',  special: {},                                          bihMode: 2,           inOrder: false, eightBallRules: false, nineBallRules: false, remainingInOrder: false, noCueBall: false },
  { level: 5,  ballCount: 6,  shape: 'triangle6',  special: {},                                          bihMode: 1,           inOrder: false, eightBallRules: false, nineBallRules: false, remainingInOrder: false, noCueBall: false },
  { level: 6,  ballCount: 7,  shape: 'arrow7',     special: { 4: '8', 3: 'stripe', 5: 'solid' },          bihMode: 1,           inOrder: false, eightBallRules: true,  nineBallRules: false, remainingInOrder: false, noCueBall: false },
  { level: 7,  ballCount: 9,  shape: 'diamond9',   special: {},                                          bihMode: 1,           inOrder: false, eightBallRules: false, nineBallRules: false, remainingInOrder: false, noCueBall: false },
  { level: 8,  ballCount: 9,  shape: 'diamond9',   special: { 4: '8', 3: 'stripe', 5: 'solid' },          bihMode: 1,           inOrder: false, eightBallRules: true,  nineBallRules: false, remainingInOrder: false, noCueBall: false },
  { level: 9,  ballCount: 15, shape: 'triangle15', special: {},                                          bihMode: 2,           inOrder: false, eightBallRules: false, nineBallRules: false, remainingInOrder: false, noCueBall: false },
  { level: 10, ballCount: 6,  shape: 'triangle6',  special: { 0: 1, 4: 6 },                               bihMode: 0,           inOrder: true,  eightBallRules: false, nineBallRules: false, remainingInOrder: false, noCueBall: false },
  { level: 11, ballCount: 15, shape: 'triangle15', special: {},                                          bihMode: 0,           inOrder: false, eightBallRules: false, nineBallRules: false, remainingInOrder: false, noCueBall: false },
  { level: 12, ballCount: 15, shape: 'triangle15', special: { 4: '8', 10: 'stripe', 14: 'solid' },        bihMode: 0,           inOrder: false, eightBallRules: true,  nineBallRules: false, remainingInOrder: false, noCueBall: false },
  { level: 13, ballCount: 9,  shape: 'diamond9',   special: { 4: '8', 3: 'stripe', 5: 'solid' },          bihMode: 0,           inOrder: false, eightBallRules: true,  nineBallRules: false, remainingInOrder: true,  noCueBall: false },
  { level: 14, ballCount: 9,  shape: 'diamond9',   special: { 0: 1, 4: 9 },                               bihMode: 0,           inOrder: false, eightBallRules: false, nineBallRules: true,  remainingInOrder: false, noCueBall: false },
  { level: 15, ballCount: 15, shape: 'triangle15', special: { 4: '8', 10: 'stripe', 14: 'solid' },        bihMode: 0,           inOrder: false, eightBallRules: true,  nineBallRules: false, remainingInOrder: true,  noCueBall: false },
  { level: 16, ballCount: 15, shape: 'triangle15', special: { 0: 1 },                                     bihMode: 0,           inOrder: true,  eightBallRules: false, nineBallRules: false, remainingInOrder: false, noCueBall: false },
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
 *   canFinishEarly: boolean,    // "continuer" (jouer le 3e rack) n'a de sens qu'ici
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
