import type { Txt } from '@/i18n/lang';
import type { Meter } from './rhythm';
/** Classe de pitch como inteiro 0–11 (C = 0, C# = 1, … B = 11). */
export type Chroma = number;

export type ScaleName =
  | 'major'
  | 'minor'
  | 'majorPentatonic'
  | 'minorPentatonic'
  | 'blues'
  | 'dorian'
  | 'mixolydian'
  | 'harmonicMinor';

export type Mode = 'major' | 'minor';

export type NoteClass = 'repouso' | 'passagem' | 'tensao' | 'fora';

export type HarmonicFunction = 'T' | 'S' | 'D';

export type TuningName = 'GCEA' | 'GCEA-lowG';

export type LabelMode = 'note' | 'degree' | 'interval';
export type NoteNames = 'letters' | 'solfege';

export interface KeyContext {
  tonic: string;
  scale: ScaleName;
}

export interface ChordInfo {
  symbol: string;
  root: Chroma;
  /** Todas as classes de pitch do acorde. */
  chromas: Chroma[];
  /** Classes de pitch de repouso: fundamental, terça e quinta. */
  stable: Chroma[];
  /** Sétima do acorde, se houver (tensão que tende a descer). */
  seventh: Chroma | null;
  isMajor: boolean;
}

export interface FretPosition {
  /** 0 = 4ª corda (G) … 3 = 1ª corda (A). */
  string: number;
  fret: number;
  midi: number;
  chroma: Chroma;
}

export interface DiatonicChord {
  symbol: string;
  numeral: string;
  func: HarmonicFunction;
}

export interface NoteSuggestion {
  midi: number;
  chroma: Chroma;
  cls: NoteClass;
  score: number;
  reason: Txt;
}

export type ChordSuggestionKind = 'diatonic' | 'secondary' | 'borrowed';

export interface ChordSuggestion {
  symbol: string;
  numeral: string;
  func: HarmonicFunction;
  kind: ChordSuggestionKind;
  score: number;
  reason: Txt;
}

export interface ScoreWeights {
  cls: number;
  proximity: number;
  resolution: number;
  contour: number;
}

export interface ChordExtras {
  secondaryDominants: boolean;
  modalBorrowing: boolean;
}

export interface Progression {
  id: string;
  /** Prontas: nos dois idiomas. Próprias: o texto que a pessoa (ou a cifra) deu. */
  name: Txt | string;
  mode: Mode;
  /**
   * Um item por compasso, com numerais relativos à tônica e intervalos da escala maior
   * ("i", "bVI"). Dois acordes no mesmo compasso vão separados por espaço ("ii V7").
   */
  numerals: string[];
  /** Fórmula de compasso; padrão 4/4. */
  meter?: Meter;
  custom?: boolean;
  /** Soa bem sobre escalas dos dois modos (ex.: blues com pentatônica menor). */
  anyScale?: boolean;
}
