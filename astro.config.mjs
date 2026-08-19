import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.low-quality-image-maker.com',
  trailingSlash: 'always',
  integrations: [tailwind(), sitemap()],
  build: {
    format: 'directory',
  },
});
