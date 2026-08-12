import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://low-quality-image-maker.com',
  trailingSlash: 'never',
  integrations: [tailwind()],
  build: {
    format: 'directory',
  },
});
