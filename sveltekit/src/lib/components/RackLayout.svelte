<!--
  RackLayout — dispose des billes (bille_N.png) en triangle/losange/hexagone
  pour représenter visuellement un rack RDS.

  Props :
   - shape : 'triangle6' | 'hex7' | 'diamond9' | 'triangle15'
   - balls : number[] — billes à placer, dans l'ordre des emplacements de la forme
             (voir POSITIONS ci-dessous, apex en premier)
   - size  : taille d'une bille en px (34 par défaut)
-->
<script>
  import { base } from '$app/paths';

  export let shape;
  export let balls = [];
  export let size = 34;

  // Coordonnées en % (x, y) de chaque emplacement, apex de la forme en premier.
  // Les triangles pointent vers le haut (apex = ligne de casse).
  const POSITIONS = {
    triangle6: [
      [50, 6],
      [38, 34], [62, 34],
      [26, 62], [50, 62], [74, 62],
    ],
    hex7: [
      [50, 6],
      [26, 30], [74, 30],
      [16, 62], [84, 62],
      [38, 90], [62, 90],
      // centre ajouté après les 6 emplacements extérieurs
    ].concat([[50, 45]]),
    diamond9: [
      [50, 6],
      [35, 27], [65, 27],
      [20, 48], [50, 48], [80, 48],
      [35, 69], [65, 69],
      [50, 92],
    ],
    triangle15: [
      [50, 4],
      [41, 22], [59, 22],
      [32, 40], [50, 40], [68, 40],
      [23, 58], [41, 58], [59, 58], [77, 58],
      [14, 76], [32, 76], [50, 76], [68, 76], [86, 76],
    ],
  };

  $: positions = POSITIONS[shape] ?? [];
</script>

<div class="rack-layout">
  {#each balls as ballNum, i}
    {#if positions[i]}
      <img
        class="rack-ball"
        src="{base}/assets/bille_{ballNum}.png"
        alt="Bille {ballNum}"
        style="width:{size}px; height:{size}px; left:{positions[i][0]}%; top:{positions[i][1]}%;"
      />
    {/if}
  {/each}
</div>

<style>
  .rack-layout {
    position: relative;
    width: 100%;
    max-width: 260px;
    aspect-ratio: 1 / 1;
    margin: 0 auto;
  }

  .rack-ball {
    position: absolute;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
  }
</style>
