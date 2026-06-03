/**
 * History store — persistance de chaque partie terminée.
 *
 * Clé localStorage : 'pool_party_history'
 *
 * Structure d'une entrée :
 * {
 *   id          : string,
 *   gameId      : string,       // 'chicago' | 'killer' | ...
 *   playedAt    : number,       // timestamp ms
 *   players     : [{ name, profileId }],  // profileId = null si invité
 *   winners     : string[],    // noms des vainqueurs
 *   scores      : { [name]: number|null },
 *   extras      : { [name]: { breakMax?: number } },
 * }
 */

import { writable, get } from 'svelte/store';

const STORAGE_KEY = 'pool_party_history';

function loadFromStorage() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveToStorage(history) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {}
}

const _store = writable(loadFromStorage());
_store.subscribe(saveToStorage);

export const historyStore = _store;

/**
 * Enregistre une partie terminée.
 *
 * @param {{
 *   gameId   : string,
 *   players  : { name: string, profileId: string|null }[],
 *   winners  : string[],
 *   scores   : { [name]: number|null },
 *   extras?  : { [name]: { breakMax?: number } },
 * }} entry
 */
export function recordHistory({ gameId, players, winners, scores, extras = {} }) {
  const entry = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Date.now().toString(36) + Math.random().toString(36).slice(2),
    gameId,
    playedAt: Date.now(),
    players,
    winners,
    scores,
    extras,
  };
  _store.update(list => [...list, entry]);
  return entry;
}

// ── Cleanup ────────────────────────────────────────────────────────────────

/**
 * Supprime toutes les entrées d'historique d'un joueur (par profileId).
 * Utile avant/après deleteProfile si on veut aussi effacer les stats.
 */
export function deleteHistoryForProfile(profileId) {
  _store.update(list =>
    list.filter(e => !e.players.some(p => p.profileId === profileId))
  );
}

/**
 * Délie un profil supprimé : met profileId = null dans toutes les entrées
 * qui le référencent, sans supprimer les entrées elles-mêmes.
 */
export function unlinkProfile(profileId) {
  _store.update(list =>
    list.map(e => ({
      ...e,
      players: e.players.map(p =>
        p.profileId === profileId ? { ...p, profileId: null } : p
      ),
    }))
  );
}

/**
 * Supprime les entrées antérieures à un timestamp.
 * @param {number} beforeTimestamp
 */
export function deleteHistoryBefore(beforeTimestamp) {
  _store.update(list => list.filter(e => e.playedAt >= beforeTimestamp));
}

/**
 * Supprime toutes les entrées d'un jeu donné.
 */
export function deleteHistoryForGame(gameId) {
  _store.update(list => list.filter(e => e.gameId !== gameId));
}

/**
 * Supprime tout l'historique.
 */
export function clearAllHistory() {
  _store.set([]);
}

// ── Lecture ────────────────────────────────────────────────────────────────

/**
 * Retourne toutes les entrées d'un profil (par profileId).
 */
export function getHistoryForProfile(profileId) {
  return get(_store).filter(e =>
    e.players.some(p => p.profileId === profileId)
  );
}

/**
 * Constantes de période utilisées par filterByPeriod.
 */
export const PERIODS = [
  { id: '7d',  label: '7 derniers jours',  days: 7   },
  { id: '30d', label: '30 derniers jours', days: 30  },
  { id: '6m',  label: '6 derniers mois',   days: 183 },
  { id: 'all', label: 'Tout le temps',     days: null },
];

/**
 * Filtre un tableau d'entrées selon une période.
 * @param {object[]} entries
 * @param {'7d'|'30d'|'6m'|'all'} periodId
 */
export function filterByPeriod(entries, periodId) {
  const period = PERIODS.find(p => p.id === periodId);
  if (!period || period.days === null) return entries;
  const cutoff = Date.now() - period.days * 24 * 60 * 60 * 1000;
  return entries.filter(e => e.playedAt >= cutoff);
}
