import { sveltekit } from '@sveltejs/kit/vite';
import { VitePWA } from 'vite-plugin-pwa';

const isProd = process.env.NODE_ENV === 'production';
const base = isProd ? '/pool_party' : '';

// Revision unique à chaque build pour forcer le rechargement de index.html par le SW.
const BUILD_REVISION = Date.now().toString(36);

/** @type {import('vite').UserConfig} */
const config = {
  define: {
    // Injecté au build depuis package.json via la variable npm_package_version.
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? '0.0.0'),
  },
  plugins: [
    sveltekit(),
    VitePWA({
      registerType: 'autoUpdate',

      manifest: {
        name: 'Pool Party',
        short_name: 'Pool Party',
        description: 'Scores de billard pour soirées',
        theme_color: '#1a472a',
        background_color: '#1a472a',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/pool_party/',
        start_url: '/pool_party/',
        icons: [
          {
            src: '/pool_party/assets/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pool_party/assets/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/pool_party/assets/icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
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
