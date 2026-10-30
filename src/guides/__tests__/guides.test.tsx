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
      expect(g.path.startsWith(g.lang === 'pt' ? '/guias/' : '/en/guides/')).toBe(true);
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
});
