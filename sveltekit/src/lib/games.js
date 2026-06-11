/**
 * Registre central des jeux disponibles.
 *
 * Chaque entrée est un objet { id, name, tagline, icon } :
 *  - id     : utilisé dans l'URL (/<id>) et le nom du fichier rules/<id>.md
 *  - name   : affiché sur la carte du launcher
 *  - tagline: phrase d'accroche sous le nom
 *  - icon   : chemin vers l'image (depuis static/, donc /assets/...)
 *
 * Pour ajouter un jeu, on l'ajoute dans cette liste, on crée la route
 * src/routes/<id>/+page.svelte et le fichier static/rules/<id>.md.
 */
export const GAMES = [
  {
    id: 'killer',
    name: 'Killer',
    tagline: "Il ne peut en rester qu'un",
    icon: '/assets/bille_8_killer.png'
  },
  {
    id: 'cutthroat',
    name: 'Cutthroat',
    tagline: 'Éliminez-les tous',
    icon: '/assets/bille_1_target.png'
  },
  {
    id: 'chicago',
    name: 'Chicago',
    tagline: 'Premier à 61 points',
    icon: '/assets/3_billes_americain.png'
  },
  {
    id: 'pool',
    name: 'Pool',
    tagline: 'Pleines ou Rayées ?',
    icon: '/assets/bille_8.png'
  },
  {
    id: 'straightpool',
    name: '14-1',
    tagline: 'Empochez les toutes !',
    icon: '/assets/triangle_14-1.png'
  },
  {
    id: 'snooker',
    name: 'Snooker',
    tagline: 'Objectif : 147 points',
    icon: '/assets/3_billes_snooker.png'
  },
  {
    id: 'casin',
    name: 'Casin',
    tagline: 'Le français revisité',
    icon: '/assets/3_billes.png'
  },
  {
    id: 'fiveball',
    name: '5-Ball',
    tagline: 'On vise 0 pile !',
    icon: '/assets/5-ball.png'
  }
];
