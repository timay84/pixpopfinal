import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  publicDir: false,
  plugins: [react()],
  build: {
    outDir: resolve(fileURLToPath(new URL('.', import.meta.url)), '../../boo-overlay-build'),
    emptyOutDir: true,
    rollupOptions: {
      input: fileURLToPath(new URL('./overlay.html', import.meta.url))
    }
  }
});
