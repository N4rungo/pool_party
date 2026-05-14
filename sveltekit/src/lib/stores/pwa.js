import { writable } from 'svelte/store';

// Stocke l'event beforeinstallprompt pour le déclencher plus tard
export const installPrompt = writable(null);

// Indique si l'app tourne déjà en mode standalone (déjà installée)
export const isStandalone = writable(
  typeof window !== 'undefined'
    ? window.matchMedia('(display-mode: standalone)').matches
    : false
);
