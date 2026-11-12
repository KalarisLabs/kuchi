// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://kuchi.kalarislabs.com',
  output: 'server',
  adapter: cloudflare({ imageService: 'passthrough' }),
  vite: {
    plugins: [tailwindcss()],
  },
});
