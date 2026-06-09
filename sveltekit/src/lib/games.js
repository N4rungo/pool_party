/**
 * Registre central des jeux disponibles.
 *
 * Chaque entrée : { id, name, tagline, icon, category, minPlayers, maxPlayers }
 *  - id         : utilisé dans l'URL (/<id>) et le nom du fichier rules/<id>.md
 *  - name       : affiché sur la carte du launcher
 *  - tagline    : phrase d'accroche sous le nom
 *  - icon       : chemin vers l'image (depuis static/, donc /assets/...)
 *  - category   : 'americain' | 'francais' | 'snooker'
 *  - minPlayers : nombre minimum de joueurs
 *  - maxPlayers : nombre maximum de joueurs
 *
 * Pour ajouter un jeu, on l'ajoute dans cette liste, on crée la route
 * src/routes/<id>/+page.svelte et le fichier static/rules/<id>.md.
 */

export const CATEGORIES = [
  { id: 'americain', label: 'Billard américain' },
  { id: 'francais',  label: 'Billard français'  },
  { id: 'snooker',   label: 'Snooker'           },
];

export const GAMES = [
  {
    id: 'killer',
    name: 'Killer',
    tagline: "Il ne peut en rester qu'un",
    icon: '/assets/bille_8_killer.png',
    category: 'americain',
    minPlayers: 2,
    maxPlayers: 15,
  },
  {
    id: 'cutthroat',
    name: 'Cutthroat',
    tagline: 'Éliminez-les tous',
    icon: '/assets/bille_1_target.png',
    category: 'americain',
    minPlayers: 2,
    maxPlayers: 15,
  },
  {
    id: 'chicago',
    name: 'Chicago',
    tagline: 'Premier à 61 points',
    icon: '/assets/3_billes_americain.png',
    category: 'americain',
    minPlayers: 2,
    maxPlayers: 4,
  },
  {
    id: 'straightpool',
    name: '14-1',
    tagline: 'Comptez vos points, pas vos billes',
    icon: '/assets/triangle_14-1.png',
    category: 'americain',
    minPlayers: 2,
    maxPlayers: 6,
  },
  {
    id: 'casin',
    name: 'Casin',
    tagline: 'Le français revisité',
    icon: '/assets/3_billes.png',
    category: 'francais',
    minPlayers: 2,
    maxPlayers: 6,
  },
  {
    id: 'fiveball',
    name: '5-Ball',
    tagline: 'Atteignez 0 pile, comme aux fléchettes',
    icon: '/assets/5-ball.png',
    category: 'francais',
    minPlayers: 2,
    maxPlayers: 6,
  },
  {
    id: 'snooker',
    name: 'Snooker',
    tagline: 'Objectif : 147 points',
    icon: '/assets/3_billes_snooker.png',
    category: 'snooker',
    minPlayers: 2,
    maxPlayers: 6,
  },
];
