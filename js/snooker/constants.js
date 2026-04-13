const SNOOKER_BALLS = {
  red:    { id: 'red',    points: 1,  icon: 'assets/rouge.png',   label: 'Rouge'  },
  yellow: { id: 'yellow', points: 2,  icon: 'assets/jaune.png',   label: 'Jaune'  },
  green:  { id: 'green',  points: 3,  icon: 'assets/verte.png',   label: 'Verte'  },
  brown:  { id: 'brown',  points: 4,  icon: 'assets/marron.png',  label: 'Marron' },
  blue:   { id: 'blue',   points: 5,  icon: 'assets/bleue.png',   label: 'Bleue'  },
  pink:   { id: 'pink',   points: 6,  icon: 'assets/rose.png',    label: 'Rose'   },
  black:  { id: 'black',  points: 7,  icon: 'assets/noire.png',   label: 'Noire'  },
};

const SNOOKER_COLORS_ORDER = ['yellow', 'green', 'brown', 'blue', 'pink', 'black'];

const SNOOKER_TOTAL_REDS   = 15;
const SNOOKER_MAX_HISTORY  = 5;
const SNOOKER_MIN_PLAYERS  = 2;
const SNOOKER_MAX_PLAYERS  = 4;
const SNOOKER_DEFAULT_PLAYERS = 2;

// Valeur minimale d'une faute (règle snooker)
const SNOOKER_MIN_FAULT = 4;
