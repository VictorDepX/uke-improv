import { nm, tx, type Txt } from '@/i18n/lang';
import type { ScaleName } from './types';

export interface Preset {
  id: string;
  name: Txt;
  tonic: string;
  scale: ScaleName;
  progressionId: string;
  bpm: number;
  /** Estilo da base; sem ele, a batida padrão do compasso. */
  grooveId?: string;
}

/** Combinações prontas para começar a tocar com um toque. */
export const PRESETS: readonly Preset[] = [
  {
    id: 'pop-c',
    name: tx(`Pop em ${nm('C')}`, `Pop in ${nm('C')}`),
    tonic: 'C',
    scale: 'major',
    progressionId: 'pop',
    bpm: 90,
  },
  {
    id: 'blues-a',
    name: tx(`Blues em ${nm('A')}`, `Blues in ${nm('A')}`),
    tonic: 'A',
    scale: 'blues',
    progressionId: 'blues',
    bpm: 96,
  },
  {
    id: 'balada-g',
    name: tx(`Balada em ${nm('G')}`, `Ballad in ${nm('G')}`),
    tonic: 'G',
    scale: 'majorPentatonic',
    progressionId: 'doo-wop',
    bpm: 72,
  },
  {
    id: 'epica-am',
    name: tx(`Menor épica em ${nm('Am')}`, `Epic minor in ${nm('Am')}`),
    tonic: 'A',
    scale: 'minorPentatonic',
    progressionId: 'minor',
    bpm: 84,
  },
  {
    id: 'jazz-f',
    name: tx(`ii–V–I em ${nm('F')}`, `ii–V–I in ${nm('F')}`),
    tonic: 'F',
    scale: 'major',
    progressionId: 'jazz',
    bpm: 132,
    grooveId: 'swing',
  },
  {
    id: 'andaluza-em',
    name: tx(`Andaluza em ${nm('Em')}`, `Andalusian in ${nm('Em')}`),
    tonic: 'E',
    scale: 'minor',
    progressionId: 'andaluz',
    bpm: 100,
  },
  {
    id: 'dorico-dm',
    name: tx(`Groove dórico em ${nm('Dm')}`, `Dorian groove in ${nm('Dm')}`),
    tonic: 'D',
    scale: 'dorian',
    progressionId: 'dorian-vamp',
    bpm: 92,
  },
  {
    id: 'mixo-g',
    name: tx(`Mixolídio em ${nm('G')}`, `Mixolydian in ${nm('G')}`),
    tonic: 'G',
    scale: 'mixolydian',
    progressionId: 'mixo-vamp',
    bpm: 104,
  },
  {
    id: 'reggae-g',
    name: tx(`Reggae em ${nm('G')}`, `Reggae in ${nm('G')}`),
    tonic: 'G',
    scale: 'major',
    progressionId: 'pop',
    bpm: 76,
    grooveId: 'reggae',
  },
  {
    id: 'bossa-c',
    name: tx(`Bossa em ${nm('C')}`, `Bossa in ${nm('C')}`),
    tonic: 'C',
    scale: 'major',
    progressionId: 'turnaround',
    bpm: 120,
    grooveId: 'bossa',
  },
  {
    id: 'valsa-d',
    name: tx(`Valsa em ${nm('D')}`, `Waltz in ${nm('D')}`),
    tonic: 'D',
    scale: 'major',
    progressionId: 'valsa',
    bpm: 132,
    grooveId: 'valsa',
  },
  {
    id: 'balada-68-c',
    name: tx(`Balada 6/8 em ${nm('C')}`, `6/8 ballad in ${nm('C')}`),
    tonic: 'C',
    scale: 'majorPentatonic',
    progressionId: 'balada-68',
    bpm: 60,
  },
];

export interface PresetState {
  key: { tonic: string; scale: ScaleName };
  progressionId: string;
  bpm: number;
  grooveId?: string | null;
}

/** O preset que descreve exatamente o estado atual, se houver. */
export function matchPreset(state: PresetState): Preset | undefined {
  return PRESETS.find(
    (p) =>
      p.tonic === state.key.tonic &&
      p.scale === state.key.scale &&
      p.progressionId === state.progressionId &&
      p.bpm === state.bpm &&
      (p.grooveId ?? null) === (state.grooveId ?? null),
  );
}
