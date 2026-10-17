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
  reason: string;
}

export type ChordSuggestionKind = 'diatonic' | 'secondary' | 'borrowed';

export interface ChordSuggestion {
  symbol: string;
  numeral: string;
  func: HarmonicFunction;
  kind: ChordSuggestionKind;
  score: number;
  reason: string;
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
  name: string;
  mode: Mode;
  /** Numerais relativos à tônica, com intervalos da escala maior ("i bVI bIII bVII"). */
  numerals: string[];
  custom?: boolean;
  /** Soa bem sobre escalas dos dois modos (ex.: blues com pentatônica menor). */
  anyScale?: boolean;
}
