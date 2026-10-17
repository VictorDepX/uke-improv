import type { ScaleName } from './types';

export interface Preset {
  id: string;
  name: string;
  tonic: string;
  scale: ScaleName;
  progressionId: string;
  bpm: number;
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
    bpm: 110,
  },
  {
    id: 'andaluza-em',
    name: 'Andaluza em Em',
    tonic: 'E',
    scale: 'minor',
    progressionId: 'andaluz',
    bpm: 100,
  },
];

export interface PresetState {
  key: { tonic: string; scale: ScaleName };
  progressionId: string;
  bpm: number;
}

/** O preset que descreve exatamente o estado atual, se houver. */
export function matchPreset(state: PresetState): Preset | undefined {
  return PRESETS.find(
    (p) =>
      p.tonic === state.key.tonic &&
      p.scale === state.key.scale &&
      p.progressionId === state.progressionId &&
      p.bpm === state.bpm,
  );
}
