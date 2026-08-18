import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://low-quality-image-maker.com',
  trailingSlash: 'never',
  integrations: [tailwind(), sitemap()],
  build: {
    format: 'directory',
  },
});
