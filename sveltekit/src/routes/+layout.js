// Active le prérendu pour toutes les routes (nécessaire pour que
// les pages de jeux soient incluses dans le précache du service worker)
export const prerender = true;

import { setupI18n } from '$lib/i18n/index.js';
setupI18n();
