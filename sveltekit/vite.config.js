import { sveltekit } from '@sveltejs/kit/vite';
import { VitePWA } from 'vite-plugin-pwa';

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
        start_url: '/pool_party/',
        icons: [
          {
            src: '/assets/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/assets/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/assets/icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },

      workbox: {
        globPatterns: ['**/*.{js,css,html,png,webmanifest,svg,ico}'],
        // Ne pas mettre en cache les routes de dev
        navigateFallback: 'index.html'
      },

      // En dev, on active le SW pour pouvoir tester
      devOptions: {
        enabled: false
      }
    })
  ]
};

export default config;
