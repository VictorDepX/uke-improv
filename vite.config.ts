/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { publicDirOf, serviceWorker } from './scripts/sw-plugin';

// `SINGLE_FILE=1 npm run build` gera um único index.html (útil para hospedar como página avulsa).
const singleFile = process.env.SINGLE_FILE === '1';

/**
 * Contas (Neon Auth + Data API) passam por /api no próprio domínio do app: assim o cookie
 * de sessão é primário em qualquer navegador (inclusive Safari). Na Vercel, isso é feito por
 * rewrites em vercel.json; aqui, pelo proxy do Vite (dev e preview).
 */
const NEON_AUTH =
  'https://ep-spring-river-b61bz03f.neonauth.c-2.sa-east-1.aws.neon.tech/neondb/auth';
const NEON_DATA =
  'https://ep-spring-river-b61bz03f.apirest.c-2.sa-east-1.aws.neon.tech/neondb/rest/v1';
// Em redes com proxy de saída (HTTPS_PROXY), o proxy do Vite precisa passar por ele.
const outbound = process.env.HTTPS_PROXY ? new HttpsProxyAgent(process.env.HTTPS_PROXY) : undefined;
const apiProxy = {
  '/api/auth': {
    target: NEON_AUTH,
    changeOrigin: true,
    agent: outbound,
    rewrite: (p: string) => p.replace(/^\/api\/auth/, ''),
  },
  '/api/data': {
    target: NEON_DATA,
    changeOrigin: true,
    agent: outbound,
    rewrite: (p: string) => p.replace(/^\/api\/data/, ''),
  },
};

export default defineConfig({
  // Caminhos relativos: o build funciona na raiz de um domínio ou numa subpasta (GitHub Pages).
  base: './',
  plugins: [
    react(),
    ...(singleFile
      ? [viteSingleFile()]
      : [serviceWorker(publicDirOf(fileURLToPath(new URL('.', import.meta.url))))]),
  ],
  define: {
    // Página avulsa (artifact) não pode registrar service worker nem tem o proxy de /api.
    __PWA__: JSON.stringify(!singleFile),
    __ACCOUNTS__: JSON.stringify(!singleFile),
  },
  server: { proxy: apiProxy },
  preview: { proxy: apiProxy },
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
