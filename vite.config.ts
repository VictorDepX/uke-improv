/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `SINGLE_FILE=1 npm run build` gera um único index.html (útil para hospedar como página avulsa).
const singleFile = process.env.SINGLE_FILE === '1';

export default defineConfig({
  // Caminhos relativos: o build funciona na raiz de um domínio ou numa subpasta (GitHub Pages).
  base: './',
  plugins: [react(), ...(singleFile ? [viteSingleFile()] : [])],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
});
