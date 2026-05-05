/**
 * Store des toasts éphémères.
 *
 * Usage :
 *   import { showToast } from '$lib/stores/toast.js';
 *   showToast('🎱 +5 pts pour Léa !');
 *
 * Le composant Toast.svelte (monté dans le layout) écoute ce store
 * et affiche le toast pendant `duration` ms puis le retire.
 */
import { writable } from 'svelte/store';

// Liste des toasts actifs : [{ id, message, duration }]
export const toasts = writable([]);

let nextId = 1;

/**
 * Affiche un toast. Renvoie l'id (utile si on veut le fermer manuellement).
 */
export function showToast(message, duration = 3000) {
  const id = nextId++;
  toasts.update(list => [...list, { id, message, duration }]);

  // Auto-dismiss
  setTimeout(() => dismissToast(id), duration);

  return id;
}

export function dismissToast(id) {
  toasts.update(list => list.filter(t => t.id !== id));
}
