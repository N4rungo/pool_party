/**
 * Registre central des jeux disponibles.
 *
 * Chaque entrée : { id, name, tagline, icon, category, tableTypes, minPlayers, maxPlayers }
 *  - id         : utilisé dans l'URL (/<id>) et le nom du fichier rules/<id>.md
 *  - name       : affiché sur la carte du launcher
 *  - tagline    : phrase d'accroche sous le nom
 *  - icon       : chemin vers l'image (depuis static/, donc /assets/...)
 *  - category   : 'americain' | 'francais' | 'snooker'  — used for section grouping
 *  - tableTypes : string[]  — types de table compatibles (filtre)
 *  - minPlayers : nombre minimum de joueurs
 *  - maxPlayers : nombre maximum de joueurs
 *
 * Pour ajouter un jeu, on l'ajoute dans cette liste, on crée la route
 * src/routes/<id>/+page.svelte et le fichier static/rules/<id>.md.
 */

export const CATEGORIES = [
  { id: 'americain', label: 'Billard américain' },
  { id: 'anglais',   label: 'Billard anglais'   },
  { id: 'francais',  label: 'Billard français'  },
  { id: 'snooker',   label: 'Snooker'           },
];

export const TABLE_TYPES = [
  { id: 'americain', label: 'Américain' },
  { id: 'anglais',   label: 'Anglais'   },
  { id: 'francais',  label: 'Français'  },
  { id: 'snooker',   label: 'Snooker'   },
];

export const GAMES = [
  {
    id: 'killer',
    name: 'Killer',
    tagline: "Il ne peut en rester qu'un",
    icon: '/assets/bille_8_killer.png',
    category: 'americain',
    tableTypes: ['americain', 'anglais'],
    minPlayers: 2,
    maxPlayers: 15,
  },
  {
    id: 'cutthroat',
    name: 'Cutthroat',
    tagline: 'Éliminez-les tous',
    icon: '/assets/bille_1_target.png',
    category: 'americain',
    tableTypes: ['americain'],
    minPlayers: 2,
    maxPlayers: 15,
  },
  {
    id: 'chicago',
    name: 'Chicago',
    tagline: 'Premier à 61 points',
    icon: '/assets/3_billes_americain.png',
    category: 'americain',
    tableTypes: ['americain'],
    minPlayers: 2,
    maxPlayers: 4,
  },
  {
    id: 'pool',
    name: 'Pool',
    tagline: 'Pleines ou Rayées ?',
    icon: '/assets/bille_8.png',
    category: 'americain',
    tableTypes: ['americain'],
    minPlayers: 2,
    maxPlayers: 8,
  },
  {
    id: 'nineball',
    name: '9 Ball',
    tagline: 'La 9 est ta seule cible',
    icon: '/assets/bille_9.png',
    category: 'americain',
    tableTypes: ['americain'],
    minPlayers: 2,
    maxPlayers: 6,
  },
  {
    id: 'tenball',
    name: '10 Ball',
    tagline: 'Un seul objectif : la 10 !',
    icon: '/assets/bille_10.png',
    category: 'americain',
    tableTypes: ['americain'],
    minPlayers: 2,
    maxPlayers: 6,
  },
  {
    id: 'straightpool',
    name: '14-1',
    tagline: 'Empochez les toutes !',
    icon: '/assets/triangle_14-1.png',
    category: 'americain',
    tableTypes: ['americain'],
    minPlayers: 2,
    maxPlayers: 6,
  },
  {
    id: 'blackball',
    name: 'Blackball',
    tagline: 'Jaunes ou Rouges ?',
    icon: '/assets/3_billes_blackball.png',
    category: 'anglais',
    tableTypes: ['anglais'],
    minPlayers: 2,
    maxPlayers: 8,
  },
  {
    id: 'carom',
    name: 'Carambole',
    tagline: 'Touchez les deux billes !',
    icon: '/assets/3_billes.png',
    category: 'francais',
    tableTypes: ['francais'],
    minPlayers: 2,
    maxPlayers: 6,
  },
  {
    id: 'casin',
    name: 'Casin',
    tagline: 'Le français revisité',
    icon: '/assets/3_billes_check.png',
    category: 'francais',
    tableTypes: ['francais'],
    minPlayers: 2,
    maxPlayers: 6,
  },
  {
    id: 'fiveball',
    name: '5-Ball',
    tagline: 'On vise 0 pile !',
    icon: '/assets/5-ball.png',
    category: 'francais',
    tableTypes: ['francais'],
    minPlayers: 2,
    maxPlayers: 6,
  },
  {
    id: 'snooker',
    name: 'Snooker',
    tagline: 'Objectif : 147 points',
    icon: '/assets/3_billes_snooker.png',
    category: 'snooker',
    tableTypes: ['snooker'],
    minPlayers: 2,
    maxPlayers: 6,
  },
];
