import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),

  kit: {
    // adapter-static : génère un site statique pur (pas besoin de Node sur le serveur).
    // Compatible GitHub Pages, Netlify, Vercel statique, Capacitor, etc.
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: 'index.html', // SPA-like : toute route inconnue retombe sur index.html
      precompress: false,
      strict: true
    }),

    paths: {
      base: process.env.NODE_ENV === 'production' ? '/pool_party' : ''
    }
  }
};

export default config;
