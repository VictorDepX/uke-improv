import type { ScaleName } from './types';

export interface Preset {
  id: string;
  name: string;
  tonic: string;
  scale: ScaleName;
  progressionId: string;
  bpm: number;
  /** Estilo da base; sem ele, a batida padrão do compasso. */
  grooveId?: string;
}

/** Combinações prontas para começar a tocar com um toque. */
export const PRESETS: readonly Preset[] = [
  { id: 'pop-c', name: 'Pop em C', tonic: 'C', scale: 'major', progressionId: 'pop', bpm: 90 },
  {
    id: 'blues-a',
    name: 'Blues em A',
    tonic: 'A',
    scale: 'blues',
    progressionId: 'blues',
    bpm: 96,
  },
  {
    id: 'balada-g',
    name: 'Balada em G',
    tonic: 'G',
    scale: 'majorPentatonic',
    progressionId: 'doo-wop',
    bpm: 72,
  },
  {
    id: 'epica-am',
    name: 'Menor épica em Am',
    tonic: 'A',
    scale: 'minorPentatonic',
    progressionId: 'minor',
    bpm: 84,
  },
  {
    id: 'jazz-f',
    name: 'ii–V–I em F',
    tonic: 'F',
    scale: 'major',
    progressionId: 'jazz',
    bpm: 132,
    grooveId: 'swing',
  },
  {
    id: 'andaluza-em',
    name: 'Andaluza em Em',
    tonic: 'E',
    scale: 'minor',
    progressionId: 'andaluz',
    bpm: 100,
  },
  {
    id: 'dorico-dm',
    name: 'Groove dórico em Dm',
    tonic: 'D',
    scale: 'dorian',
    progressionId: 'dorian-vamp',
    bpm: 92,
  },
  {
    id: 'mixo-g',
    name: 'Mixolídio em G',
    tonic: 'G',
    scale: 'mixolydian',
    progressionId: 'mixo-vamp',
    bpm: 104,
  },
  {
    id: 'reggae-g',
    name: 'Reggae em G',
    tonic: 'G',
    scale: 'major',
    progressionId: 'pop',
    bpm: 76,
    grooveId: 'reggae',
  },
  {
    id: 'bossa-c',
    name: 'Bossa em C',
    tonic: 'C',
    scale: 'major',
    progressionId: 'turnaround',
    bpm: 120,
    grooveId: 'bossa',
  },
  {
    id: 'valsa-d',
    name: 'Valsa em D',
    tonic: 'D',
    scale: 'major',
    progressionId: 'valsa',
    bpm: 132,
    grooveId: 'valsa',
  },
  {
    id: 'balada-68-c',
    name: 'Balada 6/8 em C',
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
