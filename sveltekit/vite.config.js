import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

const isProd = process.env.NODE_ENV === 'production';
const base = isProd ? '/pool_party' : '';

/** @type {import('vite').UserConfig} */
const config = {
  plugins: [
    sveltekit(),
    SvelteKitPWA({
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

      // SvelteKitPWA s'exécute APRÈS adapter-static, donc globDirectory pointe
      // sur le bon dossier final (build/) qui contient tout : HTML prérendus,
      // assets statiques (PNG, MD...) et bundles JS/CSS.
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,webmanifest,svg,ico,md}'],
        navigateFallback: `${base}/index.html`,
        navigateFallbackAllowlist: [new RegExp(`^${base}/`)],
      },

      devOptions: {
        enabled: true,
        type: 'module',
        navigateTo: '/'
      }
    })
  ]
};

export default config;
