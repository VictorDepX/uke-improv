/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
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

/**
 * Pré-carrega as fontes do primeiro desenho (corpo, títulos e visor): sem isso, a troca da
 * fonte de reserva pela Plex desloca o layout quando elas chegam.
 */
const FIRST_PAINT_FONTS = [
  'ibm-plex-sans-latin-400-normal',
  'ibm-plex-sans-latin-500-normal',
  'ibm-plex-sans-condensed-latin-600-normal',
  'ibm-plex-mono-latin-500-normal',
];
const preloadFonts = (): Plugin => ({
  name: 'preload-fonts',
  apply: 'build',
  transformIndexHtml: {
    order: 'post',
    handler(_html, ctx) {
      const files = Object.keys(ctx.bundle ?? {}).filter(
        (f) => f.endsWith('.woff2') && FIRST_PAINT_FONTS.some((n) => f.includes(`/${n}-`)),
      );
      return files.map((f) => ({
        tag: 'link',
        attrs: { rel: 'preload', as: 'font', type: 'font/woff2', href: `/${f}`, crossorigin: '' },
        injectTo: 'head' as const,
      }));
    },
  },
});

export default defineConfig(({ isSsrBuild }) => ({
  // Raiz do domínio: as abas têm caminho próprio (/jam). A página única usa caminhos relativos.
  base: singleFile ? './' : '/',
  plugins: [
    react(),
    // O build de servidor (pré-render) só gera o HTML: sem service worker nem página única.
    ...(isSsrBuild
      ? []
      : singleFile
        ? [viteSingleFile()]
        : [
            serviceWorker(publicDirOf(fileURLToPath(new URL('.', import.meta.url)))),
            preloadFonts(),
          ]),
  ],
  build: {
    copyPublicDir: !isSsrBuild,
    // Source maps públicos: o código já é aberto (MIT) e o Sentry os usa para mostrar o
    // erro na linha original. A página única não precisa deles.
    sourcemap: !singleFile,
  },
  define: {
    // Página avulsa (artifact) não pode registrar service worker nem tem o proxy de /api.
    __PWA__: JSON.stringify(!singleFile),
    __ACCOUNTS__: JSON.stringify(!singleFile),
    // Versão publicada (commit), para agrupar erros por deploy no Sentry.
    __RELEASE__: JSON.stringify(process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'local'),
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
}));
