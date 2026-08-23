import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://blog.alice001.top',
  vite: { plugins: [tailwindcss()] },
});
