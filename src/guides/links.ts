/**
 * Metadados dos guias escritos à mão, sem o conteúdo: o rodapé do app usa esta lista para ligar
 * aos guias sem carregar as páginas inteiras no pacote do app.
 */
export type GuideLang = 'pt' | 'en';

export interface GuideMeta {
  /** Mesmo id nas duas línguas: liga a página à sua tradução (hreflang). */
  id: string;
  lang: GuideLang;
  path: string;
  title: string;
  description: string;
  /** Data da última revisão do conteúdo (AAAA-MM-DD). */
  updated: string;
}

export const HUB_PATH: Record<GuideLang, string> = { pt: '/guias', en: '/en/guides' };

export const ARTICLES: readonly GuideMeta[] = [
  {
    id: 'improvise',
    lang: 'pt',
    path: '/guias/como-improvisar-no-ukulele',
    title: 'Como improvisar no ukulele: método em 6 passos',
    description:
      'Um método em 6 passos para improvisar no ukulele: notas do acorde, escala, tensão e resolução, ritmo e a pentatônica como atalho.',
    updated: '2026-10-31',
  },
  {
    id: 'scales',
    lang: 'pt',
    path: '/guias/escalas-no-ukulele',
    title: 'Escalas no ukulele: maior, menor, pentatônica e blues',
    description:
      'Escala maior, menor, pentatônica e blues no braço do ukulele (GCEA), casa por casa, e quando usar cada uma.',
    updated: '2026-10-31',
  },
  {
    id: 'progressions',
    lang: 'pt',
    path: '/guias/progressoes-de-acordes-para-ukulele',
    title: 'Progressões de acordes para ukulele: 11 voltas para tocar e improvisar',
    description:
      'As progressões mais usadas (pop, anos 50, ii–V–I, blues, andaluza, valsa) com os acordes em dó, sol e lá menor, e como improvisar sobre cada uma.',
    updated: '2026-10-31',
  },
  {
    id: 'improvise',
    lang: 'en',
    path: '/en/guides/how-to-improvise-on-ukulele',
    title: 'How to improvise on the ukulele: a 6-step method',
    description:
      'A 6-step method to improvise on the ukulele: chord tones, the scale, tension and resolution, rhythm, and the pentatonic shortcut.',
    updated: '2026-10-31',
  },
  {
    id: 'scales',
    lang: 'en',
    path: '/en/guides/ukulele-scales',
    title: 'Ukulele scales: major, minor, pentatonic and blues',
    description:
      'Major, minor, pentatonic and blues scales on the ukulele fretboard (GCEA), fret by fret, and when to use each one.',
    updated: '2026-10-31',
  },
  {
    id: 'progressions',
    lang: 'en',
    path: '/en/guides/ukulele-chord-progressions',
    title: 'Ukulele chord progressions: 11 loops to play and improvise over',
    description:
      'The most used progressions (pop, 50s, ii–V–I, blues, Andalusian, waltz) with the chords in C, G and A minor, and how to improvise over each one.',
    updated: '2026-10-31',
  },
];
