let casinSetup = {
  count:   2,
  globalX: CASIN_DEFAULT_X,
  players: [], // { name, x }
  currentPlayerSetup: 0,
};

let casinState = {
  players:      [], // { name, x, scores: { [actionId]: count }, lastAction: Set }
  currentIndex: 0,
  history:      [], // max 5 snapshots JSON
  winner:       null,
};
