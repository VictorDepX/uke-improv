/**
 * Pré-render (roda só no build, em Node): gera o HTML de cada página com o app já desenhado,
 * para buscadores lerem o texto sem executar JavaScript e para a primeira tela aparecer antes
 * do JS chegar. No navegador, main.tsx monta o app por cima desse HTML.
 */
import { Writable } from 'node:stream';
import type { ReactNode } from 'react';
import { renderToPipeableStream } from 'react-dom/server';
import { App } from './ui/App';
import { GUIDES, translationOf } from './guides';
import { GuidePage } from './guides/GuidePage';
import { TABS, TAB_PATHS, type TabId } from './ui/routes';

function renderToString(node: ReactNode): Promise<string> {
  return new Promise((resolve, reject) => {
    let html = '';
    const sink = new Writable({
      write(chunk: Buffer, _enc, done) {
        html += chunk.toString();
        done();
      },
    });
    sink.on('finish', () => resolve(html));
    // onAllReady espera as abas carregadas sob demanda, para o HTML vir completo.
    const stream = renderToPipeableStream(node, {
      onAllReady: () => stream.pipe(sink),
      onError: (err) => reject(err),
    });
  });
}

export interface PageMeta {
  path: string;
  title: string;
  description: string;
  /** Sai do índice do Google (ex.: Ajustes, que não responde a nenhuma busca). */
  noindex?: boolean;
  /** Página só de conteúdo, sem o JS do app. */
  static?: boolean;
  lang: 'pt' | 'en';
  /** Mesma página no outro idioma (hreflang). */
  alternate?: string;
  /** Última mudança do conteúdo, para o sitemap (AAAA-MM-DD). */
  updated?: string;
}

export interface RenderedPage extends PageMeta {
  html: string;
}

export async function renderPages(): Promise<RenderedPage[]> {
  const tabs = await Promise.all(
    TABS.map(async (t) => ({
      path: TAB_PATHS[t.id as TabId],
      title: t.title,
      description: t.description,
      noindex: t.id === 'ajustes',
      lang: 'pt' as const,
      html: await renderToString(<App initialTab={t.id} />),
    })),
  );
  const guides = await Promise.all(
    GUIDES.map(async (g) => ({
      path: g.path,
      title: `${g.title} · Uke Improv`,
      description: g.description,
      static: true,
      lang: g.lang,
      alternate: translationOf(g)?.path,
      updated: g.updated,
      html: await renderToString(<GuidePage guide={g} />),
    })),
  );
  return [...tabs, ...guides];
}
