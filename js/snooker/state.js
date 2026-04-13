let snookerSetup = {
  count:   SNOOKER_DEFAULT_PLAYERS,
  players: [],       // [{ name }]
  currentSetup: 0,
  mode: 'simple',    // 'simple' | 'expert'
};

let snookerState = {
  players: [],       // [{ name, score, currentBreak, bestBreak }]
  currentIndex: 0,

  redsRemaining: SNOOKER_TOTAL_REDS,   // rouges encore sur la table
  redsOnTable: SNOOKER_TOTAL_REDS,     // rouges non empochées (remise en jeu faute)

  // Phase de jeu
  // 'red'        → doit jouer une rouge (ou multi-rouges)
  // 'color'      → doit jouer une couleur (remise en jeu)
  // 'endgame'    → couleurs finales dans l'ordre
  // 'endgame_color' → attend la couleur spécifique
  phase: 'red',
  endgameColorIdx: 0,   // index dans SNOOKER_COLORS_ORDER, phase finale

  // Free ball (mode expert)
  freeBall: false,
  freeBallActive: false,

  // Rejouer (mode expert)
  mustReplay: false,

  // Multi-rouges overlay
  multiRedCount: 1,

  mode: 'simple',    // copié depuis setup au lancement

  history: [],       // snapshots JSON pour undo
};
