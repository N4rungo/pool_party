/**
 * Match store — gestion d'un "match" (série de N parties du même jeu).
 *
 * Un match regroupe N parties avec les mêmes joueurs.
 * Après chaque partie, 1 point de match est attribué au(x) vainqueur(s).
 * Après toutes les parties, un écran récap final affiche le vainqueur du match.
 */

import { writable, derived } from 'svelte/store';

const STORAGE_KEY = 'pool_party_match';

const DEFAULT_STATE = {
  isActive: false,
  gameId: null,
  totalGames: 3,
  currentGame: 1,
  players: [],
  results: [],
  matchScores: {},
};

function loadFromStorage() {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    // Validation minimale
    if (
      typeof parsed !== 'object' ||
      typeof parsed.isActive !== 'boolean' ||
      !Array.isArray(parsed.players) ||
      !Array.isArray(parsed.results)
    ) {
      return DEFAULT_STATE;
    }
    return { ...DEFAULT_STATE, ...parsed };
  } catch {
    return DEFAULT_STATE;
  }
}

function saveToStorage(state) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors (private browsing, full storage, etc.)
  }
}

// Initialisation depuis localStorage
const initialState = loadFromStorage();

const _store = writable(initialState);

// Persist every update
_store.subscribe(saveToStorage);

export const matchStore = _store;

/**
 * Lance un nouveau match.
 * @param {string} gameId  - identifiant du jeu ('chicago', 'killer', etc.)
 * @param {string[]} players - tableau de noms de joueurs
 * @param {number} totalGames - nombre de parties dans le match
 */
export function startMatch(gameId, players, totalGames) {
  const matchScores = {};
  for (const name of players) {
    matchScores[name] = 0;
  }
  _store.set({
    isActive: true,
    gameId,
    totalGames,
    currentGame: 1,
    players,
    results: [],
    matchScores,
  });
}

/**
 * Enregistre le résultat d'une partie.
 * @param {string[]} winners  - noms du/des vainqueur(s)
 * @param {{ name: string, score: number }[]} allScores - scores de tous les joueurs
 */
export function recordResult(winners, allScores) {
  _store.update(s => {
    const newMatchScores = { ...s.matchScores };
    for (const name of winners) {
      if (name in newMatchScores) {
        newMatchScores[name] = (newMatchScores[name] || 0) + 1;
      }
    }
    const newResults = [
      ...s.results,
      {
        gameNumber: s.currentGame,
        winners: [...winners],
        allScores,
      },
    ];
    return {
      ...s,
      matchScores: newMatchScores,
      results: newResults,
      currentGame: s.currentGame + 1,
    };
  });
}

/**
 * Termine le match et remet l'état par défaut.
 */
export function endMatch() {
  _store.set({ ...DEFAULT_STATE });
}

/**
 * Store dérivé : true quand la partie en cours est la dernière du match.
 * Note : on compare currentGame au totalGames AVANT l'incrément de recordResult.
 */
export const isLastGame = derived(
  _store,
  $s => $s.isActive && $s.currentGame === $s.totalGames
);
