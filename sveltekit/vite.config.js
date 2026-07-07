import { sveltekit } from '@sveltejs/kit/vite';
import { VitePWA } from 'vite-plugin-pwa';

const isProd = process.env.NODE_ENV === 'production';
const base = isProd ? '/pool_party' : '';

// Revision unique à chaque build pour forcer le rechargement de index.html par le SW.
const BUILD_REVISION = Date.now().toString(36);

/** @type {import('vite').UserConfig} */
const config = {
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? '0.0.0'),
  },
  plugins: [
    sveltekit(),
    VitePWA({
      registerType: 'autoUpdate',

      manifest: {
        id: '/pool_party/',
        name: 'Pool Party',
        short_name: 'Pool Party',
        description: 'Application de scoring pour soirées billard entre amis. Supporte 12 variantes : Killer, 8-Ball, 9-Ball, 10-Ball, 14-1, Cutthroat, Chicago, Blackball, Carambole, Casin, 5-Ball et Snooker. Fonctionne entièrement hors ligne, sans compte ni publicité.',
        theme_color: '#1a472a',
        background_color: '#1a472a',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/pool_party/',
        start_url: '/pool_party/',
        categories: ['games', 'sports'],
        lang: 'fr',
        icons: [
          {
            src: '/pool_party/assets/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pool_party/assets/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pool_party/assets/icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        screenshots: [
          {
            src: '/pool_party/assets/screenshots/home.webp',
            sizes: '390x844',
            type: 'image/webp',
            form_factor: 'narrow',
            label: 'Accueil — sélection du jeu'
          },
          {
            src: '/pool_party/assets/screenshots/players.webp',
            sizes: '390x844',
            type: 'image/webp',
            form_factor: 'narrow',
            label: 'Gestion des joueurs'
          },
          {
            src: '/pool_party/assets/screenshots/game.webp',
            sizes: '390x844',
            type: 'image/webp',
            form_factor: 'narrow',
            label: 'Partie en cours'
          },
          {
            src: '/pool_party/assets/screenshots/stats.webp',
            sizes: '390x844',
            type: 'image/webp',
            form_factor: 'narrow',
            label: 'Statistiques'
          }
        ]
      },

      workbox: {
        // Nouveau SW prend le contrôle immédiatement (y compris les onglets déjà ouverts).
        skipWaiting: true,
        clientsClaim: true,

        // Tous les assets statiques
        globPatterns: ['**/*.{js,css,html,png,webmanifest,svg,ico,md}'],

        // index.html est généré par adapter-static APRÈS que Vite ait tourné,
        // donc il n'est pas dans .svelte-kit/output/client/ et ne matche pas le glob.
        // BUILD_REVISION change à chaque build → Workbox sait qu'il faut le re-fetcher.
        additionalManifestEntries: [
          { url: `${base}/index.html`, revision: BUILD_REVISION }
        ],

        // Sert index.html pour toute navigation vers une route inconnue du cache
        navigateFallback: `${base}/index.html`,
        navigateFallbackAllowlist: [new RegExp(`^${base}/`)],
      },

      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ]
};

export default config;
