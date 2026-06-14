import { browser } from '$app/environment';
import { init, register, locale } from 'svelte-i18n';

const STORAGE_KEY = 'pool_party_lang';
const SUPPORTED   = ['fr', 'en'];
const FALLBACK    = 'fr';

register('fr', () => import('./fr.json'));
register('en', () => import('./en.json'));

export function setupI18n() {
  const saved    = browser ? localStorage.getItem(STORAGE_KEY) : null;
  const detected = browser ? (navigator.language || '').slice(0, 2) : null;
  const initial  = SUPPORTED.includes(saved)
    ? saved
    : SUPPORTED.includes(detected) ? detected : FALLBACK;

  init({
    fallbackLocale: FALLBACK,
    initialLocale:  initial,
  });
}

export function setLang(lang) {
  if (!SUPPORTED.includes(lang)) return;
  locale.set(lang);
  if (browser) localStorage.setItem(STORAGE_KEY, lang);
}

export function hasChosenLang() {
  if (!browser) return true;
  return localStorage.getItem(STORAGE_KEY) !== null;
}

export { locale };
