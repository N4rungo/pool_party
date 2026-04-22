let casinSetup = {
  count:   CASIN_MIN_PLAYERS,
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
