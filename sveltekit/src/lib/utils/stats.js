/**
 * Calcul des statistiques à partir de l'historique.
 * Fonctions pures — aucune dépendance aux stores.
 */

// ── Helpers ────────────────────────────────────────────────────────────────

/** Entrées où le joueur (par profileId) a participé. */
export function entriesForProfile(history, profileId) {
  return history.filter(e => e.players.some(p => p.profileId === profileId));
}

/** Entrées où le joueur (par profileId) a participé + filtre par jeu. */
export function entriesForProfileAndGame(history, profileId, gameId) {
  return entriesForProfile(history, profileId).filter(e => e.gameId === gameId);
}

/** Nom du joueur dans une entrée, à partir de son profileId. */
function playerName(entry, profileId) {
  return entry.players.find(p => p.profileId === profileId)?.name ?? null;
}

// ── Stats globales ─────────────────────────────────────────────────────────

/**
 * Stats globales tous jeux confondus pour un profil.
 * @returns {{ played, won, lost, winRate }}
 */
export function globalStats(history, profileId) {
  const entries = entriesForProfile(history, profileId);
  if (entries.length === 0) {
    return { played: 0, won: 0, lost: 0, winRate: 0 };
  }
  const won = entries.filter(e => {
    const name = playerName(e, profileId);
    return name && e.winners.includes(name);
  }).length;
  return {
    played:  entries.length,
    won,
    lost:    entries.length - won,
    winRate: Math.round((won / entries.length) * 100),
  };
}

// ── Stats par jeu ──────────────────────────────────────────────────────────

/**
 * Jeux pour lesquels un profil a au moins une entrée d'historique.
 * @returns {string[]} tableau de gameId
 */
export function playedGameIds(history, profileId) {
  const ids = new Set(
    entriesForProfile(history, profileId).map(e => e.gameId)
  );
  return [...ids];
}

/**
 * Stats spécifiques à un jeu pour un profil.
 *
 * Retourne : { played, won, lost, winRate, avgScore, maxScore, avgBreak, maxBreak }
 * Les champs score/break sont null si non applicable au jeu.
 */
export function gameStats(history, profileId, gameId) {
  const entries = entriesForProfileAndGame(history, profileId, gameId);
  if (entries.length === 0) {
    return emptyGameStats();
  }

  const won = entries.filter(e => {
    const name = playerName(e, profileId);
    return name && e.winners.includes(name);
  }).length;

  // Scores
  const scoreValues = entries
    .map(e => {
      const name = playerName(e, profileId);
      return name ? (e.scores?.[name] ?? null) : null;
    })
    .filter(v => v !== null);

  const avgScore = scoreValues.length
    ? Math.round(scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length)
    : null;
  const maxScore = scoreValues.length ? Math.max(...scoreValues) : null;

  // Breaks (Snooker + Straight Pool)
  const breakValues = entries
    .map(e => {
      const name = playerName(e, profileId);
      return name ? (e.extras?.[name]?.breakMax ?? null) : null;
    })
    .filter(v => v !== null && v > 0);

  const avgBreak = breakValues.length
    ? Math.round(breakValues.reduce((a, b) => a + b, 0) / breakValues.length)
    : null;
  const maxBreak = breakValues.length ? Math.max(...breakValues) : null;

  return {
    played: entries.length,
    won,
    lost: entries.length - won,
    winRate: Math.round((won / entries.length) * 100),
    avgScore,
    maxScore,
    avgBreak,
    maxBreak,
  };
}

function emptyGameStats() {
  return { played: 0, won: 0, lost: 0, winRate: 0, avgScore: null, maxScore: null, avgBreak: null, maxBreak: null };
}

// ── Classements ────────────────────────────────────────────────────────────

/**
 * Classement global : tous les profils triés par critère.
 *
 * @param {object[]} history
 * @param {object[]} profiles   — liste complète des profils
 * @param {'won'|'played'|'winRate'} sortBy
 * @returns {{ profile, stats }[]} trié par sortBy desc
 */
export function globalLeaderboard(history, profiles, sortBy = 'won') {
  const rows = profiles.map(profile => ({
    profile,
    stats: globalStats(history, profile.id),
  }));
  return rows.sort((a, b) => b.stats[sortBy] - a.stats[sortBy]);
}

/**
 * Classement pour un jeu donné : tous les profils ayant joué ce jeu.
 *
 * @param {object[]} history
 * @param {object[]} profiles
 * @param {string}   gameId
 * @param {'won'|'played'|'winRate'|'maxScore'|'avgScore'|'maxBreak'|'avgBreak'} sortBy
 * @returns {{ profile, stats }[]} trié par sortBy desc, uniquement les joueurs actifs
 */
export function gameLeaderboard(history, profiles, gameId, sortBy = 'won') {
  const rows = profiles
    .map(profile => ({
      profile,
      stats: gameStats(history, profile.id, gameId),
    }))
    .filter(r => r.stats.played > 0);

  return rows.sort((a, b) => {
    const va = a.stats[sortBy] ?? -1;
    const vb = b.stats[sortBy] ?? -1;
    return vb - va;
  });
}

// ── Méta par jeu ───────────────────────────────────────────────────────────

/**
 * Colonnes de tri disponibles pour chaque jeu.
 * Utilisé pour afficher les bons filtres dans le leaderboard par jeu.
 */
export const GAME_SORT_OPTIONS = {
  chicago:     ['won', 'played', 'winRate', 'maxScore', 'avgScore'],
  killer:      ['won', 'played', 'winRate', 'maxScore', 'avgScore'],
  cutthroat:   ['won', 'played', 'winRate'],
  straightpool:['won', 'played', 'winRate', 'maxScore', 'avgScore', 'maxBreak', 'avgBreak'],
  snooker:     ['won', 'played', 'winRate', 'maxScore', 'avgScore', 'maxBreak', 'avgBreak'],
  casin:       ['won', 'played', 'winRate', 'maxScore', 'avgScore'],
  fiveball:    ['won', 'played', 'winRate', 'maxScore', 'avgScore'],
};

export const SORT_LABELS = {
  won:     'Victoires',
  played:  'Parties jouées',
  lost:    'Défaites',
  winRate: 'Taux de victoire',
  maxScore:'Score max',
  avgScore:'Score moyen',
  maxBreak:'Break max',
  avgBreak:'Break moyen',
};

/** Label du score brut selon le jeu (pour l'affichage). */
export const GAME_SCORE_LABEL = {
  chicago:      'Points',
  killer:       'Vies restantes',
  cutthroat:    null,
  straightpool: 'Billes empochées',
  snooker:      'Points de frame',
  casin:        'Score',
  fiveball:     'Score',
};
