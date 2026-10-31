import type { ComponentType } from 'react';
import type { KeyContext } from '@/core/types';
import { ImproviseEn } from './en/Improvise';
import { ScalesEn } from './en/Scales';
import { HubBody, ProgressionsBody } from './extra';
import { LIBRARY } from './library';
import { ARTICLES, HUB_PATH, type GuideLang, type GuideMeta } from './links';
import { ImprovisePt } from './pt/Improvise';
import { ScalesPt } from './pt/Scales';

export type { GuideLang } from './links';

export interface Guide extends GuideMeta {
  /** Artigo escrito à mão, página gerada (escala, campo harmônico) ou índice. */
  kind: 'article' | 'scale' | 'key' | 'hub';
  Body: ComponentType;
}

/** Tom usado nos exemplos de braço dos guias. */
export const EXAMPLE_KEY: KeyContext = { tonic: 'C', scale: 'major' };

const BODIES: Record<string, Record<GuideLang, ComponentType>> = {
  improvise: { pt: ImprovisePt, en: ImproviseEn },
  scales: { pt: ScalesPt, en: ScalesEn },
  progressions: {
    pt: () => ProgressionsBody({ lang: 'pt' }),
    en: () => ProgressionsBody({ lang: 'en' }),
  },
};

const HUBS: Guide[] = [
  {
    id: 'hub',
    kind: 'hub',
    lang: 'pt',
    path: HUB_PATH.pt,
    title: 'Guias de ukulele: improviso, escalas e acordes por tom',
    description:
      'Todos os guias do Uke Improv: como improvisar, escalas por tom, campo harmônico de cada tom e progressões, com diagramas para ukulele.',
    updated: '2026-10-31',
    Body: () => HubBody({ lang: 'pt' }),
  },
  {
    id: 'hub',
    kind: 'hub',
    lang: 'en',
    path: HUB_PATH.en,
    title: 'Ukulele guides: improvising, scales and chords by key',
    description:
      'All Uke Improv guides: how to improvise, scales in every key, the chords of each key and progressions, with ukulele diagrams.',
    updated: '2026-10-31',
    Body: () => HubBody({ lang: 'en' }),
  },
];

export const GUIDES: readonly Guide[] = [
  ...ARTICLES.map((a) => ({ ...a, kind: 'article' as const, Body: BODIES[a.id]![a.lang] })),
  ...HUBS,
  ...LIBRARY,
];

export const translationOf = (g: Guide): Guide | undefined =>
  GUIDES.find((x) => x.id === g.id && x.lang !== g.lang);
