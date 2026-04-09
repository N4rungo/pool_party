const CT_TOTAL_BALLS = 15;

// Calcule la répartition des billes par joueur
function ctComputeDistribution(playerCount) {
  if (playerCount === 2) {
    // Cas spécial : on retire la 8, J1 = 1-7, J2 = 9-15
    return {
      perPlayer: 7,
      removed: [8],
      groups: [
        [1,2,3,4,5,6,7],
        [9,10,11,12,13,14,15],
      ],
    };
  }

  const perPlayer = Math.floor(CT_TOTAL_BALLS / playerCount);
  const used      = perPlayer * playerCount;
  const removed   = Array.from({ length: CT_TOTAL_BALLS - used },
                      (_, i) => used + i + 1); // dernières billes

  const groups = Array.from({ length: playerCount }, (_, p) =>
    Array.from({ length: perPlayer }, (_, b) => p * perPlayer + b + 1)
  );

  return { perPlayer, removed, groups };
}

// Retourne les 3 billes à placer dans les coins du triangle
function ctCornerBalls(removed, groups) {
  if (removed.length >= 3) {
    return removed.slice(0, 3);
  }
  const corners = [...removed];
  // Complète avec 1 bille du meilleur joueur (dernier groupe), puis avant-dernier, etc.
  for (let i = groups.length - 1; i >= 0 && corners.length < 3; i--) {
    corners.push(groups[i][0]);
  }
  return corners;
}
