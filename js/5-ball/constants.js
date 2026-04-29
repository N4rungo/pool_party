const FIVE_BALL_MIN_PLAYERS     = 2;
const FIVE_BALL_MAX_PLAYERS     = 6;
const FIVE_BALL_DEFAULT_PLAYERS = 2;

const FIVE_BALL_DEFAULT_TARGET  = 51;
const FIVE_BALL_MIN_TARGET      = 21;
const FIVE_BALL_TARGET_STEP     = 10;

// Scores restants impossibles à clore en un coup à 2+ carambolages
// (toute combinaison de 2 billes parmi {1,2,4,4,6} donne ≥ 3, et 1/2/4 ne sont pas atteignables).
const FIVE_BALL_BUST_REMAINING  = [1, 2, 4];

// Définition des 5 billes (id -> { value, label, asset })
const FIVE_BALL_BALLS = {
  red:    { id: 'red',    value: 2, label: 'Rouge',   asset: 'rouge_2.png'   },
  green:  { id: 'green',  value: 1, label: 'Verte',   asset: 'verte_1.png'   },
  blue:   { id: 'blue',   value: 6, label: 'Bleue',   asset: 'bleue_6.png'   },
  white:  { id: 'white',  value: 4, label: 'Blanche', asset: 'blanche_4.png' },
  yellow: { id: 'yellow', value: 4, label: 'Jaune',   asset: 'jaune_4.png'   },
};
