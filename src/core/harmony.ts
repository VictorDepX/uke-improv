import { chordInfo, chromaName, chromaOf, mod12, modeOf, prefersFlats } from './music';
import type { DiatonicChord, HarmonicFunction, KeyContext, Mode } from './types';

interface DegreeSpec {
  numeral: string;
  semis: number;
  quality: string;
  func: HarmonicFunction;
}

const MAJOR_DEGREES: DegreeSpec[] = [
  { numeral: 'I', semis: 0, quality: '', func: 'T' },
  { numeral: 'ii', semis: 2, quality: 'm', func: 'S' },
  { numeral: 'iii', semis: 4, quality: 'm', func: 'T' },
  { numeral: 'IV', semis: 5, quality: '', func: 'S' },
  { numeral: 'V', semis: 7, quality: '', func: 'D' },
  { numeral: 'V7', semis: 7, quality: '7', func: 'D' },
  { numeral: 'vi', semis: 9, quality: 'm', func: 'T' },
  { numeral: 'vii°', semis: 11, quality: 'dim', func: 'D' },
];

const MINOR_DEGREES: DegreeSpec[] = [
  { numeral: 'i', semis: 0, quality: 'm', func: 'T' },
  { numeral: 'ii°', semis: 2, quality: 'dim', func: 'S' },
  { numeral: 'III', semis: 3, quality: '', func: 'T' },
  { numeral: 'iv', semis: 5, quality: 'm', func: 'S' },
  { numeral: 'v', semis: 7, quality: 'm', func: 'D' },
  { numeral: 'V', semis: 7, quality: '', func: 'D' },
  { numeral: 'V7', semis: 7, quality: '7', func: 'D' },
  { numeral: 'VI', semis: 8, quality: '', func: 'S' },
  { numeral: 'VII', semis: 10, quality: '', func: 'D' },
];

export function degreesFor(mode: Mode): readonly DegreeSpec[] {
  return mode === 'major' ? MAJOR_DEGREES : MINOR_DEGREES;
}

/** Campo harmônico do tom (tríades + dominante com sétima; no menor inclui o V harmônico). */
export function diatonicChords(key: KeyContext): DiatonicChord[] {
  const tonic = chromaOf(key.tonic);
  const flats = prefersFlats(key);
  return degreesFor(modeOf(key.scale)).map((d) => ({
    symbol: chromaName(tonic + d.semis, flats) + d.quality,
    numeral: d.numeral,
    func: d.func,
  }));
}

/** Compara acordes por fundamental e notas, ignorando grafia (C#m = Dbm). */
export function sameChord(a: string, b: string): boolean {
  if (a === b) return true;
  const ca = chordInfo(a);
  const cb = chordInfo(b);
  if (ca.root !== cb.root || ca.chromas.length !== cb.chromas.length) return false;
  const set = new Set(ca.chromas);
  return cb.chromas.every((c) => set.has(c));
}

export function findDiatonic(symbol: string, key: KeyContext): DiatonicChord | undefined {
  return diatonicChords(key).find((d) => sameChord(d.symbol, symbol));
}

const ROMAN_SEMIS: Record<string, number> = { I: 0, II: 2, III: 4, IV: 5, V: 7, VI: 9, VII: 11 };
const NUMERAL_RE = /^(b|#)?(VII|VI|V|IV|III|II|I|vii|vi|v|iv|iii|ii|i)(°|dim)?(maj7|7)?$/;

export interface ParsedNumeral {
  semis: number;
  quality: string;
}

export function parseNumeral(numeral: string): ParsedNumeral {
  const m = NUMERAL_RE.exec(numeral.trim());
  if (!m) throw new Error(`Numeral inválido: ${numeral}`);
  const [, acc, roman = 'I', dim, ext] = m;
  const upper = roman.toUpperCase();
  const semis = mod12((ROMAN_SEMIS[upper] ?? 0) + (acc === 'b' ? -1 : acc === '#' ? 1 : 0));
  const isMajor = roman === upper;
  let quality: string;
  if (dim) quality = ext === '7' ? 'dim7' : 'dim';
  else if (isMajor) quality = ext ?? '';
  else quality = ext === '7' ? 'm7' : ext === 'maj7' ? 'mMaj7' : 'm';
  return { semis, quality };
}

export function numeralToChord(numeral: string, key: KeyContext): string {
  const { semis, quality } = parseNumeral(numeral);
  return chromaName(chromaOf(key.tonic) + semis, prefersFlats(key)) + quality;
}

const SEMIS_TO_ROMAN = [
  'I',
  'bII',
  'II',
  'bIII',
  'III',
  'IV',
  '#IV',
  'V',
  'bVI',
  'VI',
  'bVII',
  'VII',
];

/**
 * Numeral relativo à escala maior da tônica (formato aceito por `parseNumeral`).
 * Ex.: F em lá menor → "bVI". Usado para guardar progressões transponíveis.
 */
export function toAbsoluteNumeral(symbol: string, key: KeyContext): string {
  const info = chordInfo(symbol);
  const roman = SEMIS_TO_ROMAN[mod12(info.root - chromaOf(key.tonic))]!;
  const quality = symbol.replace(/^[A-G][#b]*/, '');
  const dim = quality.startsWith('dim');
  const base = info.isMajor ? roman : roman.replace(/[IV]+/, (r) => r.toLowerCase());
  const suffix = dim
    ? quality === 'dim7'
      ? '°7'
      : '°'
    : quality.endsWith('maj7')
      ? 'maj7'
      : quality.endsWith('7')
        ? '7'
        : '';
  return base + suffix;
}

/** Numeral para exibição: o diatônico quando possível, senão relativo à escala maior. */
export function chordToNumeral(symbol: string, key: KeyContext): string {
  return findDiatonic(symbol, key)?.numeral ?? toAbsoluteNumeral(symbol, key);
}
