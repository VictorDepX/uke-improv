import { createHash } from 'node:crypto';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { Plugin } from 'vite';

/**
 * Gera `sw.js` no build com a lista exata de arquivos para guardar offline.
 * Sem dependências: o service worker é pequeno e o cache troca a cada build.
 */
export function serviceWorker(publicDir: string): Plugin {
  return {
    name: 'uke-service-worker',
    apply: 'build',
    generateBundle(_options, bundle) {
      // .woff é só reserva de navegadores antigos; todos que têm service worker usam .woff2.
      const built = Object.keys(bundle).filter((f) => !f.endsWith('.woff'));
      const statics = readdirSync(publicDir).filter((f) => !f.startsWith('.'));
      const files = ['./', ...[...built, ...statics].sort().map((f) => `./${f}`)];
      const version = createHash('sha1').update(files.join('|')).digest('hex').slice(0, 10);
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: SW_TEMPLATE.replace('__VERSION__', version).replace(
          '__FILES__',
          JSON.stringify(files),
        ),
      });
    },
  };
}

export const publicDirOf = (root: string): string => join(root, 'public');

const SW_TEMPLATE = `// Gerado no build. Guarda o app inteiro para funcionar sem internet.
const CACHE = 'uke-improv-__VERSION__';
const FILES = __FILES__;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(FILES))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  // Páginas: rede primeiro (pega versões novas), cache se estiver offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('./', copy));
          return res;
        })
        .catch(() => caches.match('./')),
    );
    return;
  }

  // Arquivos com hash no nome: cache primeiro.
  event.respondWith(caches.match(req).then((hit) => hit || fetch(req)));
});
`;
