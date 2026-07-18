<!--
  RackLayout — dispose des billes en triangle/losange/flèche pour représenter
  visuellement un rack RDS, fidèle aux schémas du PDF source (rds_system.pdf).

  Props :
   - shape   : 'triangle6' | 'arrow7' | 'diamond9' | 'triangle15'
   - special : { [slotIndex]: '8' | 'solid' | 'stripe' | number }
               billes imposées par les règles (voir $lib/games/rds.js).
               Tous les autres emplacements affichent une bille grise neutre.
   - size    : taille d'une bille en px (34 par défaut)
-->
<script>
  import { base } from '$app/paths';
  import { SOLID_SAMPLE, STRIPE_SAMPLE } from '$lib/games/rds.js';

  export let shape;
  export let special = {};
  export let size = 34;

  // Coordonnées en % (x, y) de chaque emplacement, apex en premier (ligne de casse en haut).
  const POSITIONS = {
    triangle6: [
      [50, 8],
      [39, 34], [61, 34],
      [28, 60], [50, 60], [72, 60],
    ],
    // "Flèche" : rangée 1 - 2 - 3 - 1 (tête large au milieu, pointe en bas)
    arrow7: [
      [50, 6],
      [39, 28], [61, 28],
      [28, 50], [50, 50], [72, 50],
      [50, 72],
    ],
    diamond9: [
      [50, 5],
      [39, 24], [61, 24],
      [28, 43], [50, 43], [72, 43],
      [39, 62], [61, 62],
      [50, 81],
    ],
    triangle15: [
      [50, 4],
      [42, 20], [58, 20],
      [34, 36], [50, 36], [66, 36],
      [26, 52], [42, 52], [58, 52], [74, 52],
      [18, 68], [34, 68], [50, 68], [66, 68], [82, 68],
    ],
  };

  function assetFor(value) {
    if (value === '8') return `${base}/assets/bille_8.png`;
    if (value === 'solid') return `${base}/assets/bille_${SOLID_SAMPLE}.png`;
    if (value === 'stripe') return `${base}/assets/bille_${STRIPE_SAMPLE}.png`;
    if (typeof value === 'number') return `${base}/assets/bille_${value}.png`;
    return `${base}/assets/grise.png`;
  }

  $: positions = POSITIONS[shape] ?? [];
</script>

<div class="rack-layout">
  {#each positions as pos, i}
    <img
      class="rack-ball"
      src={assetFor(special[i])}
      alt=""
      style="width:{size}px; height:{size}px; left:{pos[0]}%; top:{pos[1]}%;"
    />
  {/each}
</div>

<style>
  .rack-layout {
    position: relative;
    width: 100%;
    max-width: 240px;
    aspect-ratio: 1 / 1;
    margin: 0 auto;
  }

  .rack-ball {
    position: absolute;
    transform: translate(-50%, -50%);
    object-fit: contain;
  }
</style>
