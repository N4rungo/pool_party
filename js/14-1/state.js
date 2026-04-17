let spSetup = {
  count:               2,
  target:              STRAIGHTPOOL_DEFAULT_TARGET,
  players:             [], // { name, target }
  currentPlayerSetup:  0,
};

let spState = {
  players:      [], // { name, target, score, bestBreak }
  currentIndex: 0,
  currentBreak: 0,
  history:      [],
  winner:       null,
};
