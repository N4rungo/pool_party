<!--
  RackLayout — dispose des billes en triangle/losange/flèche pour représenter
  visuellement un rack RDS, fidèle aux schémas du PDF source (rds_system.pdf).

  Props :
   - shape   : 'triangle6' | 'arrow7' | 'diamond9' | 'triangle15'
   - special : { [slotIndex]: '8' | 'solid' | 'stripe' | number }
               billes imposées par les règles (voir $lib/games/rds.js).
               Tous les autres emplacements affichent une bille grise neutre.

  Chaque forme a une taille de bille "naturelle" (en px, plus grosse pour un
  petit rack que pour un grand — 6 billes se voient donc bien plus gros que
  15) et le conteneur est dimensionné en conséquence. Sur un écran plus
  étroit que cette taille naturelle, le conteneur (et donc les billes)
  rétrécit proportionnellement pour ne jamais déborder ni forcer de scroll.
-->
<script>
  import { base } from '$app/paths';
  import { SOLID_SAMPLE, STRIPE_SAMPLE } from '$lib/games/rds.js';

  export let shape;
  export let special = {};

  // widthPx/heightPx : dimensions naturelles du rack (billes qui se
  // touchent, à la taille cible ballPx). positions : [x%, y%] de chaque
  // emplacement (apex en premier). dPctX/dPctY : diamètre d'une bille en %
  // de la largeur/hauteur du conteneur (le conteneur n'étant pas toujours
  // carré, les deux diffèrent).
  const SHAPES = {
    triangle6: {
      widthPx: 144, heightPx: 131, dPctX: 33.3, dPctY: 36.6,
      positions: [[50, 18.3], [33.3, 50], [66.7, 50], [16.7, 81.7], [50, 81.7], [83.3, 81.7]],
    },
    // "Flèche" : rangée 1 - 2 - 3 - 1 (tête large au milieu, pointe en bas)
    arrow7: {
      widthPx: 126, heightPx: 151, dPctX: 33.3, dPctY: 27.8,
      positions: [[50, 13.9], [33.3, 38], [66.7, 38], [16.7, 62], [50, 62], [83.3, 62], [50, 86.1]],
    },
    diamond9: {
      widthPx: 114, heightPx: 170, dPctX: 33.3, dPctY: 22.4,
      positions: [[50, 11.2], [33.3, 30.6], [66.7, 30.6], [16.7, 50], [50, 50], [83.3, 50], [33.3, 69.4], [66.7, 69.4], [50, 88.8]],
    },
    triangle15: {
      widthPx: 150, heightPx: 134, dPctX: 20, dPctY: 22.4,
      positions: [
        [50, 11.2], [40, 30.6], [60, 30.6],
        [30, 50], [50, 50], [70, 50],
        [20, 69.4], [40, 69.4], [60, 69.4], [80, 69.4],
        [10, 88.8], [30, 88.8], [50, 88.8], [70, 88.8], [90, 88.8],
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

  $: shapeDef = SHAPES[shape] ?? { widthPx: 150, heightPx: 150, dPctX: 20, dPctY: 20, positions: [] };
</script>

<div
  class="rack-layout"
  style="width:min(100%, {shapeDef.widthPx}px); aspect-ratio:{shapeDef.widthPx} / {shapeDef.heightPx};"
>
  {#each shapeDef.positions as pos, i}
    <img
      class="rack-ball"
      src={assetFor(special[i])}
      alt=""
      style="width:{shapeDef.dPctX}%; height:{shapeDef.dPctY}%; left:{pos[0]}%; top:{pos[1]}%;"
    />
  {/each}
</div>

<style>
  .rack-layout {
    position: relative;
    margin: 0 auto;
  }

  .rack-ball {
    position: absolute;
    transform: translate(-50%, -50%);
    object-fit: contain;
  }
</style>
