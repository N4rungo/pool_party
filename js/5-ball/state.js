let fiveBallSetup = {
  count: FIVE_BALL_DEFAULT_PLAYERS,
  defaultTarget: FIVE_BALL_DEFAULT_TARGET,
  players: [],          // [{ name, target }]
};

let fiveBallState = {
  players: [],          // [{ name, target, score }]
  currentIndex: 0,
  turnNumber: 0,        // s'incrémente à chaque main passée, sert à l'alternance cue ball
  isFirstTurn: true,    // engagement actif tant que vrai
  selected: [],         // ids des billes carambolées au tour en cours
  history: [],          // pour Annuler
};
