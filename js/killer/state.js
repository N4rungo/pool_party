// ============================================================
//  CONSTANTS
// ============================================================

export const JOKER_TYPES = [
  { id: 'pass', icon: '⏭️', label: 'Passe ton tour', desc: 'La main passe directement au joueur suivant' },
  { id: 'hand', icon: '✋', label: 'Bille en main', desc: 'Pose la blanche où tu veux avant de jouer' },
  { id: 'target', icon: '🎯', label: 'Choisir un joueur', desc: 'Ce joueur joue immédiatement un tour forcé' },
];

export const EMOJIS = ['🟡', '🔵', '🔴', '⚪', '🟠', '🟣', '🟤', '🟢'];
export const MAX_LIVES = 5;
export const DEFAULT_LIVES = 3;
export const MAX_JOKERS = 3;

// ============================================================
//  SETUP STATE
// ============================================================

export let setup = {
  count: 4,
  jokerMode: 'random',
  currentPlayerSetup: 0,
  players: [],
};

// ============================================================
//  GAME STATE
// ============================================================

export let state = {
  players: [],
  currentIndex: 0,
  jokerMode: 'random',
  pool: [],
  forcedTurnFor: null,
  forcedTurnBack: null,
  history: [],
  savedConfig: [],
};
