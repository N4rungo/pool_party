/**
 * Profiles store — gestion des profils joueurs.
 *
 * Un profil est persisté dans localStorage sous 'pool_party_profiles'.
 * Les joueurs invités ne créent pas de profil : profileId = null dans l'historique.
 */

import { writable, get } from 'svelte/store';

const STORAGE_KEY = 'pool_party_profiles';

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

function saveToStorage(profiles) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  } catch {}
}

const _store = writable(loadFromStorage());
_store.subscribe(saveToStorage);

export const profilesStore = _store;

/**
 * Crée un nouveau profil et le retourne.
 * @param {string} name
 * @returns {{ id: string, name: string, createdAt: number }}
 */
export function createProfile(name) {
  const profile = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Date.now().toString(36) + Math.random().toString(36).slice(2),
    name: name.trim(),
    createdAt: Date.now(),
  };
  _store.update(list => [...list, profile]);
  return profile;
}

/**
 * Renomme un profil.
 * Note : le nom dans l'historique existant n'est PAS modifié (les entrées gardent
 * le nom qu'elles avaient au moment de l'enregistrement).
 */
export function renameProfile(id, newName) {
  _store.update(list =>
    list.map(p => p.id === id ? { ...p, name: newName.trim() } : p)
  );
}

/**
 * Supprime un profil.
 * Les entrées d'historique qui le référencent auront profileId = null
 * (géré dans history.js via unlinkProfile).
 */
export function deleteProfile(id) {
  _store.update(list => list.filter(p => p.id !== id));
}

/**
 * Retourne un profil par son id, ou null.
 */
export function getProfile(id) {
  return get(_store).find(p => p.id === id) ?? null;
}

/**
 * Retourne un profil par son nom (insensible à la casse), ou null.
 */
export function findProfileByName(name) {
  const lower = name.trim().toLowerCase();
  return get(_store).find(p => p.name.toLowerCase() === lower) ?? null;
}
