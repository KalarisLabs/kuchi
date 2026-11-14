// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';

import react from '@astrojs/react';

export default defineConfig({
  site: 'https://kuchi.kalarislabs.com',
  output: 'server',
  adapter: cloudflare({ imageService: 'passthrough' }),
  // Emit privacy.html, terms.html, support.html (not privacy/index.html), the same
  // file names the old static site deployed, so /privacy and /privacy.html keep working.
  build: { format: 'file' },

  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [react()],
});