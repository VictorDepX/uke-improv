// Depois do build: escreve um HTML por página com o conteúdo já renderizado e gera o sitemap.
// Roda com `node scripts/prerender.mjs` (o package.json chama no `npm run build`).
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const SITE = 'https://uke-improv.vercel.app';
const template = readFileSync(join(dist, 'index.html'), 'utf8');
const { renderPages } = await import(pathToFileURL(join(root, '.ssr', 'entry-server.js')).href);

const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const urlOf = (path) => `${SITE}${path === '/' ? '/' : path}`;
const hreflang = (lang) => (lang === 'pt' ? 'pt-BR' : 'en');

function setMeta(html, attr, key, value) {
  const re = new RegExp(`(<meta\\s+${attr}="${key}"\\s+content=")[^"]*(")`);
  if (!re.test(html)) throw new Error(`meta ${key} não encontrada no index.html`);
  return html.replace(re, `$1${esc(value)}$2`);
}

function pageHtml(page) {
  let html = template;
  html = html.replace(/<html lang="[^"]*">/, `<html lang="${hreflang(page.lang)}">`);
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(page.title)}</title>`);
  html = setMeta(html, 'name', 'description', page.description);
  html = setMeta(html, 'property', 'og:url', urlOf(page.path));
  html = setMeta(html, 'property', 'og:title', page.title);
  html = setMeta(html, 'property', 'og:description', page.description);
  html = setMeta(html, 'property', 'og:locale', page.lang === 'pt' ? 'pt_BR' : 'en_US');
  html = setMeta(html, 'name', 'twitter:title', page.title);
  html = setMeta(html, 'name', 'twitter:description', page.description);
  html = html.replace(
    /<link rel="canonical" href="[^"]*"/,
    `<link rel="canonical" href="${urlOf(page.path)}"`,
  );

  let extraHead = '';
  if (page.noindex) extraHead += '    <meta name="robots" content="noindex" />\n';
  if (page.alternate) {
    const pt = page.lang === 'pt' ? page.path : page.alternate;
    const en = page.lang === 'en' ? page.path : page.alternate;
    extraHead +=
      `    <link rel="alternate" hreflang="pt-BR" href="${urlOf(pt)}" />\n` +
      `    <link rel="alternate" hreflang="en" href="${urlOf(en)}" />\n` +
      `    <link rel="alternate" hreflang="x-default" href="${urlOf(pt)}" />\n`;
  }

  if (page.static) {
    // Guias: só conteúdo. Sem o JS do app; com o analytics (mesmo domínio, sem cookies).
    html = html.replace(/\s*<script type="module"[^>]*><\/script>/g, '');
    html = html.replace(/\s*<link rel="modulepreload"[^>]*>/g, '');
    extraHead += '    <script defer src="/_vercel/insights/script.js"></script>\n';
    const article = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: page.title.replace(/ · Uke Improv$/, ''),
      description: page.description,
      inLanguage: hreflang(page.lang),
      dateModified: page.updated,
      mainEntityOfPage: urlOf(page.path),
      image: `${SITE}/og.png`,
      publisher: { '@type': 'Organization', name: 'Uke Improv', url: `${SITE}/` },
    };
    html = html.replace(
      /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
      `<script type="application/ld+json">${JSON.stringify(article)}</script>`,
    );
  }

  html = html.replace('</head>', `${extraHead}</head>`);
  if (!html.includes('<div id="root"></div>')) throw new Error('#root vazio não encontrado');
  return html.replace('<div id="root"></div>', `<div id="root">${page.html}</div>`);
}

const pages = await renderPages();
for (const page of pages) {
  const file = page.path === '/' ? join(dist, 'index.html') : join(dist, `${page.path}.html`);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, pageHtml(page));
}

const today = new Date().toISOString().slice(0, 10);
const urls = pages
  .filter((p) => !p.noindex)
  .map((p) => {
    const alt = p.alternate
      ? ['pt', 'en']
          .map((l) => {
            const href = urlOf(l === p.lang ? p.path : p.alternate);
            return `\n    <xhtml:link rel="alternate" hreflang="${hreflang(l)}" href="${href}" />`;
          })
          .join('')
      : '';
    return `  <url>\n    <loc>${urlOf(p.path)}</loc>\n    <lastmod>${p.updated ?? today}</lastmod>${alt}\n  </url>`;
  });
writeFileSync(
  join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`,
);
rmSync(join(root, '.ssr'), { recursive: true, force: true });
console.log(`pré-render: ${pages.length} páginas, sitemap com ${urls.length} endereços`);
