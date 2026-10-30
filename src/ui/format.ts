import {
  SCALES,
  chromaName,
  degreeLabel,
  intervalLabel,
  prefersFlats,
  chromaOf,
} from '@/core/music';
import type { ChordInfo, Chroma, KeyContext, LabelMode, NoteClass } from '@/core/types';
import { nm, tx, type Txt } from '@/i18n/lang';

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

export const CLASS_SHORT: Record<NoteClass, Txt> = {
  repouso: tx('repouso', 'rest'),
  passagem: tx('passagem', 'passing'),
  tensao: tx('tensão', 'tension'),
  fora: tx('fora', 'outside'),
};

export const FUNC_LABEL: Record<'T' | 'S' | 'D', Txt> = {
  T: tx('Tônica', 'Tonic'),
  S: tx('Subdominante', 'Subdominant'),
  D: tx('Dominante', 'Dominant'),
};

/** Tom por extenso ("C maior" / "C major"), com a tônica marcada para o formato de nomes. */
export const keyLabelOf = (key: KeyContext): Txt => {
  const scale = SCALES[key.scale].label;
  return tx(
    `${nm(key.tonic)} ${scale.pt.toLowerCase()}`,
    `${nm(key.tonic)} ${scale.en.toLowerCase()}`,
  );
};
