import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://hub.alice001.top',
  devToolbar: { enabled: false },
  vite: { plugins: [tailwindcss()] },
});
