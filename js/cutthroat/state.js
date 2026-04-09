let ctSetup = {
  count: 3,
  players: [],          // [{ name }] du débutant à l'expert
  currentSetup: 0,
};

let ctState = {
  players: [],          // [{ name, balls: Set, eliminated }]
  distribution: null,   // { perPlayer, removed, groups }
  balls: {},            // { 1: 'in'|'out', ... } pour les billes actives
  currentIndex: 0,
  history: [],          // snapshots pour undo (max 5)
};
