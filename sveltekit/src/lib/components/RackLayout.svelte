<!--
  RackLayout — dispose des billes en triangle/losange/flèche pour représenter
  visuellement un rack RDS, fidèle aux schémas du PDF source (rds_system.pdf).

  Props :
   - shape   : 'triangle6' | 'arrow7' | 'diamond9' | 'triangle15'
   - special : { [slotIndex]: '8' | 'solid' | 'stripe' | number }
               billes imposées par les règles (voir $lib/games/rds.js).
               Tous les autres emplacements affichent une bille grise neutre.

  Les billes sont positionnées et dimensionnées en % du conteneur (et non en
  px) : leur taille s'adapte donc à la fois à la largeur disponible et au
  nombre de billes du rack (un rack de 6 billes affiche des billes bien plus
  grosses qu'un rack de 15, à zone de jeu égale).
-->
<script>
  import { base } from '$app/paths';
  import { SOLID_SAMPLE, STRIPE_SAMPLE } from '$lib/games/rds.js';

  export let shape;
  export let special = {};

  // Coordonnées en % (x, y) de chaque emplacement (apex en premier, ligne de
  // casse en haut) + diamètre en % du conteneur — calculés pour que les
  // billes se touchent et remplissent au maximum le conteneur carré, quelle
  // que soit la forme.
  const SHAPES = {
    triangle6: {
      diameter: 32,
      positions: [[50, 22.3], [34, 50], [66, 50], [18, 77.7], [50, 77.7], [82, 77.7]],
    },
    // "Flèche" : rangée 1 - 2 - 3 - 1 (tête large au milieu, pointe en bas)
    arrow7: {
      diameter: 26.7,
      positions: [[50, 15.3], [36.7, 38.4], [63.3, 38.4], [23.3, 61.6], [50, 61.6], [76.7, 61.6], [50, 84.7]],
    },
    diamond9: {
      diameter: 21.5,
      positions: [[50, 12.8], [39.2, 31.4], [60.8, 31.4], [28.5, 50], [50, 50], [71.5, 50], [39.2, 68.6], [60.8, 68.6], [50, 87.2]],
    },
    triangle15: {
      diameter: 19.2,
      positions: [
        [50, 16.7], [40.4, 33.4], [59.6, 33.4],
        [30.8, 50], [50, 50], [69.2, 50],
        [21.2, 66.6], [40.4, 66.6], [59.6, 66.6], [78.8, 66.6],
        [11.6, 83.3], [30.8, 83.3], [50, 83.3], [69.2, 83.3], [88.4, 83.3],
      ],
    },
  };

  function assetFor(value) {
    if (value === '8') return `${base}/assets/bille_8.png`;
    if (value === 'solid') return `${base}/assets/bille_${SOLID_SAMPLE}.png`;
    if (value === 'stripe') return `${base}/assets/bille_${STRIPE_SAMPLE}.png`;
    if (typeof value === 'number') return `${base}/assets/bille_${value}.png`;
    return `${base}/assets/grise.png`;
  }

  $: shapeDef = SHAPES[shape] ?? { diameter: 20, positions: [] };
</script>

<div class="rack-layout">
  {#each shapeDef.positions as pos, i}
    <img
      class="rack-ball"
      src={assetFor(special[i])}
      alt=""
      style="width:{shapeDef.diameter}%; height:{shapeDef.diameter}%; left:{pos[0]}%; top:{pos[1]}%;"
    />
  {/each}
</div>

<style>
  .rack-layout {
    position: relative;
    width: 100%;
    max-width: 380px;
    aspect-ratio: 1 / 1;
    margin: 0 auto;
  }

  .rack-ball {
    position: absolute;
    transform: translate(-50%, -50%);
    object-fit: contain;
  }
</style>
