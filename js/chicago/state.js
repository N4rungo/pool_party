let chicagoSetup = {
  players: [
    { name: '' },
    { name: '' },
  ],
};

let chicagoState = {
  players: [],      // [{ name, score }]
  currentIndex: 0,
  pocketedBalls: new Set(),
  history: [],      // max CHICAGO_MAX_HISTORY entrées
};
