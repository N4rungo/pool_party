/**
 * RDS progress store — persistance de la progression d'entraînement RDS.
 *
 * Clé localStorage : 'pool_party_rds_progress'
 * Structure : { [profileId]: { lastLevel: number, maxLevel: number } }
 *
 * Les joueurs invités (profileId = null) ne sont jamais persistés : leur
 * progression vit uniquement en mémoire le temps de la session.
 */

import { writable, get } from 'svelte/store';

const STORAGE_KEY = 'pool_party_rds_progress';

function loadFromStorage() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return parsed;
  } catch {
    return {};
  }
}

function saveToStorage(progress) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {}
}

const _store = writable(loadFromStorage());
_store.subscribe(saveToStorage);

export const rdsProgressStore = _store;

/**
 * Retourne la progression sauvegardée d'un profil, ou null.
 * @param {string|null} profileId
 */
export function getProgress(profileId) {
  if (!profileId) return null;
  return get(_store)[profileId] ?? null;
}

/**
 * Sauvegarde la progression d'un profil (pas d'effet pour un invité).
 * @param {string|null} profileId
 * @param {{ lastLevel: number, maxLevel: number }} progress
 */
export function saveProgress(profileId, progress) {
  if (!profileId) return;
  _store.update(all => ({ ...all, [profileId]: progress }));
}

/**
 * Supprime la progression d'un profil (utile si le profil est supprimé).
 */
export function deleteProgress(profileId) {
  _store.update(all => {
    const { [profileId]: _removed, ...rest } = all;
    return rest;
  });
}
