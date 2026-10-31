import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { GUIDES, translationOf } from '../index';
import { GuidePage } from '../GuidePage';
import { TAB_PATHS } from '@/ui/routes';

describe('guias', () => {
  it('cada guia tem tradução, endereço único e descrição curta para a busca', () => {
    const paths = GUIDES.map((g) => g.path);
    expect(new Set(paths).size).toBe(paths.length);
    for (const g of GUIDES) {
      expect(translationOf(g)?.lang).toBe(g.lang === 'pt' ? 'en' : 'pt');
      expect(g.description.length).toBeLessThanOrEqual(160);
      expect(g.path.startsWith(g.lang === 'pt' ? '/' : '/en/')).toBe(true);
      expect(g.path.startsWith('/en/')).toBe(g.lang === 'en');
    }
  });

  const validPaths = [
    ...Object.values(TAB_PATHS.pt),
    ...Object.values(TAB_PATHS.en),
    ...GUIDES.map((x) => x.path),
  ];

  it('renderiza como HTML estático, com título, figura e links entre idiomas', () => {
    for (const g of GUIDES) {
      const html = renderToStaticMarkup(<GuidePage guide={g} />);
      expect(html).toContain(`<h1>${g.title}</h1>`);
      if (g.kind === 'scale' || g.id === 'improvise' || g.id === 'scales')
        expect(html).toContain('<figure class="guide-board">');
      expect(html).toContain(`href="${translationOf(g)!.path}"`);
      // os links internos apontam para páginas que existem
      const internal = [...html.matchAll(/href="(\/[^"#]*)"/g)].map((m) => m[1]!);
      for (const href of internal) expect(validPaths).toContain(href);
    }
  });

  it('guia em inglês leva ao app em inglês', () => {
    const en = GUIDES.find((g) => g.lang === 'en')!;
    const html = renderToStaticMarkup(<GuidePage guide={en} />);
    expect(html).toContain('href="/en/jam"');
    expect(html).not.toContain('Portuguese for now');
  });

  it('páginas geradas: escala com as notas certas e campo harmônico com o relativo', () => {
    const pent = GUIDES.find((g) => g.path === '/escalas/pentatonica-menor-de-la')!;
    const html = renderToStaticMarkup(<GuidePage guide={pent} />);
    expect(html).toContain('as notas A C D E G');
    expect(translationOf(pent)!.path).toBe('/en/scales/a-minor-pentatonic');
    const g = GUIDES.find((x) => x.path === '/en/keys/g-major')!;
    const keyHtml = renderToStaticMarkup(<GuidePage guide={g} />);
    expect(keyHtml).toContain('G, Am, Bm, C, D, Em, F#dim');
    expect(keyHtml).toContain('href="/en/keys/e-minor"');
  });

  it('o índice liga todas as páginas de conteúdo do idioma', () => {
    for (const lang of ['pt', 'en'] as const) {
      const hub = GUIDES.find((g) => g.kind === 'hub' && g.lang === lang)!;
      const html = renderToStaticMarkup(<GuidePage guide={hub} />);
      for (const g of GUIDES.filter((x) => x.lang === lang && x !== hub))
        expect(html).toContain(`href="${g.path}"`);
    }
  });
});
