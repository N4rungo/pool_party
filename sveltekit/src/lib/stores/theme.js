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
    pool:       '#6b1219',
    mid:        '#8a1820',
    dark:       '#520e14',
    darkRgb:    '82, 14, 20',
  },
  {
    id: 'blue',
    pool:       '#1252a0',
    mid:        '#1a68c8',
    dark:       '#0d3d78',
    darkRgb:    '13, 61, 120',
  },
  {
    id: 'gray',
    pool:       '#2a2d35',
    mid:        '#35394a',
    dark:       '#1e2130',
    darkRgb:    '18, 20, 26',
  },
  {
    id: 'violet',
    pool:       '#2d1260',
    mid:        '#3d1878',
    dark:       '#1e0c46',
    darkRgb:    '30, 12, 70',
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
    pool:       '#D0BA91',
    mid:        '#DECDA9',
    dark:       '#B8A074',
    darkRgb:    '140, 116, 72',
    textRgb:    '56, 36, 10',
    gold:       '#7a4e0a',
    goldLight:  '#9a6218',
    goldDark:   '#5a3808',
    goldRgb:    '122, 78, 10',
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
  r.style.setProperty('--color-text-rgb',      theme.textRgb    ?? '255, 255, 255');
  r.style.setProperty('--color-gold',          theme.gold       ?? '#FFD700');
  r.style.setProperty('--color-gold-light',    theme.goldLight  ?? '#FFE44D');
  r.style.setProperty('--color-gold-dark',     theme.goldDark   ?? '#B8960C');
  r.style.setProperty('--color-gold-rgb',      theme.goldRgb    ?? '255, 215, 0');
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
