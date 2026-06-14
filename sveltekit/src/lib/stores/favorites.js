import { writable } from 'svelte/store';

const STORAGE_KEY = 'pool_party_favorites';

function load() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function save(ids) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(ids)); } catch {}
}

function createFavorites() {
  const { subscribe, update } = writable(load());
  return {
    subscribe,
    toggle(gameId) {
      update(ids => {
        const next = ids.includes(gameId)
          ? ids.filter(id => id !== gameId)
          : [...ids, gameId];
        save(next);
        return next;
      });
    },
  };
}

export const favorites = createFavorites();
