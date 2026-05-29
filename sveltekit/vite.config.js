import { sveltekit } from '@sveltejs/kit/vite';
import { VitePWA } from 'vite-plugin-pwa';

const isProd = process.env.NODE_ENV === 'production';
const base = isProd ? '/pool_party' : '';

/** @type {import('vite').UserConfig} */
const config = {
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
        // Inclut les .md (règles des jeux) en plus des assets habituels
        globPatterns: ['**/*.{js,css,html,png,webmanifest,svg,ico,md}'],
        // Chemin absolu avec le base path correct pour que le SW sache quoi servir offline
        navigateFallback: `${base}/index.html`,
        // Limite le fallback aux routes de l'app (évite les faux positifs)
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
