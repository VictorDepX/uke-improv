import {
  SCALES,
  chromaName,
  degreeLabel,
  intervalLabel,
  prefersFlats,
  chromaOf,
} from '@/core/music';
import type { ChordInfo, Chroma, KeyContext, LabelMode, NoteClass } from '@/core/types';

export function noteLabel(
  chroma: Chroma,
  mode: LabelMode,
  key: KeyContext,
  chord: ChordInfo,
): string {
  if (mode === 'degree') return degreeLabel(chroma, chromaOf(key.tonic));
  if (mode === 'interval') return intervalLabel(chroma, chord.root);
  return chromaName(chroma, prefersFlats(key));
}

export const CLASS_SHORT: Record<NoteClass, string> = {
  repouso: 'repouso',
  passagem: 'passagem',
  tensao: 'tensão',
  fora: 'fora',
};

export const FUNC_LABEL = { T: 'Tônica', S: 'Subdominante', D: 'Dominante' } as const;

export const keyLabelOf = (key: KeyContext): string =>
  `${key.tonic} ${SCALES[key.scale].label.toLowerCase()}`;
