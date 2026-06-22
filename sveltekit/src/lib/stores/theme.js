import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export const THEMES = [
  {
    id: 'green',
    pool:       '#1a472a',
    mid:        '#1e5c34',
    dark:       '#143d24',
    darkRgb:    '16, 50, 28',
  },
  {
    id: 'red',
    pool:       '#4a1820',
    mid:        '#5e1f28',
    dark:       '#3a0e18',
    darkRgb:    '35, 10, 14',
  },
  {
    id: 'blue',
    pool:       '#0f2d4a',
    mid:        '#143a5e',
    dark:       '#0a2038',
    darkRgb:    '8, 20, 36',
  },
  {
    id: 'gray',
    pool:       '#2a2d35',
    mid:        '#35394a',
    dark:       '#1e2130',
    darkRgb:    '18, 20, 26',
  },
  {
    id: 'burgundy',
    pool:       '#3c0d1a',
    mid:        '#4d1225',
    dark:       '#2e0812',
    darkRgb:    '28, 6, 12',
  },
  {
    id: 'black',
    pool:       '#141414',
    mid:        '#1e1e1e',
    dark:       '#0d0d0d',
    darkRgb:    '8, 8, 8',
  },
  {
    id: 'camel',
    pool:       '#4a3520',
    mid:        '#5c4428',
    dark:       '#3a2a16',
    darkRgb:    '35, 24, 12',
  },
];

const STORAGE_KEY = 'pool_party_theme';
const DEFAULT_ID  = 'green';

export function applyTheme(id) {
  const theme = THEMES.find(t => t.id === id) ?? THEMES[0];
  const r = document.documentElement;
  r.style.setProperty('--color-pool',         theme.pool);
  r.style.setProperty('--color-pool-mid',      theme.mid);
  r.style.setProperty('--color-pool-dark',     theme.dark);
  r.style.setProperty('--color-pool-dark-rgb', theme.darkRgb);
}

function createThemeStore() {
  const initial = browser
    ? (localStorage.getItem(STORAGE_KEY) ?? DEFAULT_ID)
    : DEFAULT_ID;

  const { subscribe, set } = writable(initial);

  return {
    subscribe,
    set(id) {
      set(id);
      if (browser) {
        localStorage.setItem(STORAGE_KEY, id);
        applyTheme(id);
      }
    },
  };
}

export const themeStore = createThemeStore();
