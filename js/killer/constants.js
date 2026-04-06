const JOKER_TYPES = [
  { id: 'pass',   icon: '⏭️', label: 'Passe ton tour',    desc: 'La main passe directement au joueur suivant' },
  { id: 'hand',   icon: '✋', label: 'Bille en main',      desc: 'Pose la blanche où tu veux avant de jouer' },
  { id: 'target', icon: '🎯', label: 'Choisir un joueur', desc: 'Ce joueur joue immédiatement un tour forcé' },
];
const EMOJIS       = ['🟡','🔵','🔴','⚪','🟠','🟣','🟤','🟢'];
const MAX_LIVES    = 5;
const DEFAULT_LIVES = 3;
const MAX_JOKERS   = 3;
