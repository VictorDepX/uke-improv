import type { ComponentType } from 'react';
import type { KeyContext } from '@/core/types';
import { ImproviseEn } from './en/Improvise';
import { ScalesEn } from './en/Scales';
import { ImprovisePt } from './pt/Improvise';
import { ScalesPt } from './pt/Scales';

export type GuideLang = 'pt' | 'en';

export interface Guide {
  /** Mesmo id nas duas línguas: liga a página à sua tradução (hreflang). */
  id: 'improvise' | 'scales';
  lang: GuideLang;
  path: string;
  title: string;
  description: string;
  /** Data da última revisão do conteúdo (AAAA-MM-DD). */
  updated: string;
  Body: ComponentType;
}

/** Tom usado nos exemplos de braço dos guias. */
export const EXAMPLE_KEY: KeyContext = { tonic: 'C', scale: 'major' };

export const GUIDES: readonly Guide[] = [
  {
    id: 'improvise',
    lang: 'pt',
    path: '/guias/como-improvisar-no-ukulele',
    title: 'Como improvisar no ukulele',
    description:
      'Um método em 6 passos para improvisar no ukulele: notas do acorde, escala, tensão e resolução, ritmo e a pentatônica como atalho.',
    updated: '2026-10-28',
    Body: ImprovisePt,
  },
  {
    id: 'scales',
    lang: 'pt',
    path: '/guias/escalas-no-ukulele',
    title: 'Escalas no ukulele',
    description:
      'Escala maior, menor, pentatônica e blues no braço do ukulele (GCEA), casa por casa, e quando usar cada uma.',
    updated: '2026-10-28',
    Body: ScalesPt,
  },
  {
    id: 'improvise',
    lang: 'en',
    path: '/en/guides/how-to-improvise-on-ukulele',
    title: 'How to improvise on the ukulele',
    description:
      'A 6-step method to improvise on the ukulele: chord tones, the scale, tension and resolution, rhythm, and the pentatonic shortcut.',
    updated: '2026-10-28',
    Body: ImproviseEn,
  },
  {
    id: 'scales',
    lang: 'en',
    path: '/en/guides/ukulele-scales',
    title: 'Ukulele scales',
    description:
      'Major, minor, pentatonic and blues scales on the ukulele fretboard (GCEA), fret by fret, and when to use each one.',
    updated: '2026-10-28',
    Body: ScalesEn,
  },
];

export const translationOf = (g: Guide): Guide | undefined =>
  GUIDES.find((x) => x.id === g.id && x.lang !== g.lang);
