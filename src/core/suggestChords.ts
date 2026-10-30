import { nm, tx, type Txt } from '@/i18n/lang';
import { diatonicChords, findDiatonic, sameChord } from './harmony';
import { chordInfo, chromaName, chromaOf, mod12, modeOf, prefersFlats } from './music';
import type {
  ChordExtras,
  ChordSuggestion,
  DiatonicChord,
  HarmonicFunction,
  KeyContext,
  Mode,
} from './types';

type Matrix = Record<string, Record<string, number>>;

/** Pesos de transição grau → grau, extraídos das progressões mais comuns do pop. */
const MAJOR_MATRIX: Matrix = {
  I: { ii: 0.5, iii: 0.3, IV: 0.9, V: 0.9, vi: 0.8, 'vii°': 0.1, bVII: 0.7, v: 0.4 },
  ii: { V: 1, IV: 0.3, 'vii°': 0.4, I: 0.3, vi: 0.2, iii: 0.1, bVII: 0.3, v: 0.4 },
  iii: { vi: 0.9, IV: 0.7, ii: 0.4, I: 0.2, V: 0.2 },
  IV: { V: 0.9, I: 0.8, ii: 0.4, vi: 0.5, iii: 0.2, 'vii°': 0.3, bVII: 0.5, v: 0.3 },
  V: { I: 1, vi: 0.7, IV: 0.4, iii: 0.2, ii: 0.1 },
  vi: { IV: 0.9, ii: 0.7, V: 0.6, iii: 0.4, I: 0.3, bVII: 0.3 },
  'vii°': { I: 1, iii: 0.4, vi: 0.2 },
  // Mixolídio
  v: { I: 0.7, IV: 0.6, bVII: 0.4, vi: 0.3 },
  bVII: { I: 0.9, IV: 0.6, v: 0.3 },
};

const MINOR_MATRIX: Matrix = {
  i: {
    iv: 0.8,
    VI: 0.8,
    VII: 0.7,
    V: 0.7,
    III: 0.6,
    v: 0.4,
    'ii°': 0.3,
    IV: 0.8,
    ii: 0.4,
    'vii°': 0.3,
  },
  'ii°': { V: 0.9, i: 0.4, III: 0.2 },
  III: { VI: 0.8, iv: 0.6, VII: 0.6, i: 0.4, IV: 0.5 },
  iv: { V: 0.8, i: 0.7, VII: 0.7, VI: 0.4, v: 0.4 },
  v: { i: 0.8, VI: 0.6, iv: 0.4, IV: 0.5 },
  V: { i: 1, VI: 0.6 },
  VI: { VII: 0.8, iv: 0.6, V: 0.5, III: 0.5, i: 0.5, 'ii°': 0.3, 'vii°': 0.3 },
  VII: { III: 0.8, i: 0.8, VI: 0.5, IV: 0.4 },
  // Dórico e menor harmônica
  ii: { v: 0.6, IV: 0.5, i: 0.4, VII: 0.4 },
  IV: { i: 0.8, VII: 0.6, v: 0.4, ii: 0.3 },
  'vii°': { i: 1, VI: 0.3 },
};

interface BorrowedSpec {
  numeral: string;
  semis: number;
  quality: string;
  func: HarmonicFunction;
  /** Peso de chegada a partir de cada grau diatônico. */
  from: Record<string, number>;
  /** Peso de saída para cada grau diatônico. */
  to: Record<string, number>;
}

const BORROWED: Record<Mode, BorrowedSpec[]> = {
  major: [
    {
      numeral: 'iv',
      semis: 5,
      quality: 'm',
      func: 'S',
      from: { I: 0.5, IV: 0.7, ii: 0.3 },
      to: { I: 0.9, V: 0.5 },
    },
    {
      numeral: 'bVII',
      semis: 10,
      quality: '',
      func: 'D',
      from: { I: 0.5, IV: 0.4, ii: 0.3 },
      to: { I: 0.85, IV: 0.5 },
    },
    {
      numeral: 'bVI',
      semis: 8,
      quality: '',
      func: 'S',
      from: { I: 0.4, vi: 0.3, IV: 0.3 },
      to: { V: 0.5, I: 0.5 },
    },
  ],
  minor: [
    {
      numeral: 'IV',
      semis: 5,
      quality: '',
      func: 'S',
      from: { i: 0.5, III: 0.3 },
      to: { i: 0.6, VII: 0.6, V: 0.5 },
    },
  ],
};

const DIATONIC_REASON: Record<string, Txt> = {
  'V>I': tx('resolução forte (V → I)', 'strong resolution (V → I)'),
  'V>i': tx('resolução forte (V → i)', 'strong resolution (V → i)'),
  'V>vi': tx('cadência de engano (V → vi)', 'deceptive cadence (V → vi)'),
  'IV>I': tx('cadência plagal (IV → I)', 'plagal cadence (IV → I)'),
  'ii>V': tx('preparação clássica (ii → V)', 'classic setup (ii → V)'),
  'vii°>I': tx('resolve a tensão na tônica', 'resolves the tension to the tonic'),
  'vii°>i': tx('resolve a tensão na tônica', 'resolves the tension to the tonic'),
  'bVII>I': tx('cadência mixolídia (bVII → I)', 'Mixolydian cadence (bVII → I)'),
  'IV>i': tx('IV maior do dórico de volta à tônica', 'Dorian major IV back to the tonic'),
  'VII>i': tx('subtônica voltando para casa', 'subtonic heading home'),
};

const FUNC_REASON: Record<HarmonicFunction, Txt> = {
  T: tx('volta para casa', 'brings it home'),
  S: tx('afasta da tônica', 'moves away from the tonic'),
  D: tx('cria tensão para resolver', 'builds tension to resolve'),
};

const normalizeNumeral = (n: string): string => (n === 'V7' ? 'V' : n);

export interface ChordSuggestOptions {
  extras?: ChordExtras;
  history?: readonly string[];
  count?: number;
}

export function suggestNextChords(
  current: string,
  key: KeyContext,
  {
    extras = { secondaryDominants: false, modalBorrowing: false },
    history = [],
    count = 5,
  }: ChordSuggestOptions = {},
): ChordSuggestion[] {
  const mode = modeOf(key.scale);
  const matrix = mode === 'major' ? MAJOR_MATRIX : MINOR_MATRIX;
  const tonicNumeral = mode === 'major' ? 'I' : 'i';
  const diatonic = diatonicChords(key);
  const tonic = chromaOf(key.tonic);
  const flats = prefersFlats(key);
  const cur = chordInfo(current);

  const curDiatonic = findDiatonic(current, key);
  const borrowedSpecs = BORROWED[mode];
  const curBorrowed = curDiatonic
    ? undefined
    : borrowedSpecs.find((b) => sameChord(chromaName(tonic + b.semis, flats) + b.quality, current));
  const secondaryTarget = curDiatonic ? undefined : resolveSecondary(current, diatonic);

  const fromRow: Record<string, number> = curDiatonic
    ? (matrix[normalizeNumeral(curDiatonic.numeral)] ?? {})
    : curBorrowed
      ? curBorrowed.to
      : secondaryTarget
        ? scaleRow(matrix[tonicNumeral] ?? {}, 0.3)
        : (matrix[tonicNumeral] ?? {});

  const out: ChordSuggestion[] = [];
  const fromNumeral = curDiatonic ? normalizeNumeral(curDiatonic.numeral) : '';

  for (const d of diatonic) {
    if (chordInfo(d.symbol).root === cur.root) continue;
    let score = fromRow[normalizeNumeral(d.numeral)] ?? 0;
    if (d.numeral === 'V7') score *= 0.95;
    let reason =
      DIATONIC_REASON[`${fromNumeral}>${normalizeNumeral(d.numeral)}`] ?? FUNC_REASON[d.func];
    if (secondaryTarget && sameChord(secondaryTarget.symbol, d.symbol)) {
      score = 1;
      reason = tx(
        'resolve a dominante secundária no alvo',
        'resolves the secondary dominant to its target',
      );
    }
    if (score > 0) out.push({ ...d, kind: 'diatonic', score, reason });
  }

  if (extras.secondaryDominants) {
    for (const target of diatonic) {
      if (
        target.numeral === tonicNumeral ||
        target.symbol.includes('dim') ||
        target.numeral === 'V7'
      )
        continue;
      const root = mod12(chordInfo(target.symbol).root + 7);
      if (root === cur.root) continue;
      const symbol = `${chromaName(root, flats)}7`;
      if (diatonic.some((d) => sameChord(d.symbol, symbol))) continue;
      const toTarget = fromRow[normalizeNumeral(target.numeral)] ?? 0;
      if (toTarget <= 0) continue;
      out.push({
        symbol,
        numeral: `V7/${target.numeral}`,
        func: 'D',
        kind: 'secondary',
        score: 0.6 * toTarget,
        reason: tx(
          `prepara ${nm(target.symbol)} (dominante secundária)`,
          `sets up ${nm(target.symbol)} (secondary dominant)`,
        ),
      });
    }
  }

  if (extras.modalBorrowing) {
    for (const b of borrowedSpecs) {
      const symbol = chromaName(tonic + b.semis, flats) + b.quality;
      if (sameChord(symbol, current)) continue;
      const score = curDiatonic ? (b.from[normalizeNumeral(curDiatonic.numeral)] ?? 0) : 0;
      if (score <= 0) continue;
      out.push({
        symbol,
        numeral: b.numeral,
        func: b.func,
        kind: 'borrowed',
        score: score * 0.8,
        reason:
          mode === 'major'
            ? tx('emprestado do tom menor', 'borrowed from the parallel minor')
            : tx('emprestado do modo dórico', 'borrowed from Dorian'),
      });
    }
  }

  const recent = history.slice(-2);
  for (const s of out) {
    if (recent.some((h) => sameChord(h, s.symbol))) s.score *= 0.85;
  }

  return dedupeByRoot(out)
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
}

function scaleRow(row: Record<string, number>, factor: number): Record<string, number> {
  return Object.fromEntries(Object.entries(row).map(([k, v]) => [k, v * factor]));
}

/** Se o acorde é dominante com sétima fora do tom, devolve o diatônico uma quinta abaixo. */
function resolveSecondary(symbol: string, diatonic: DiatonicChord[]): DiatonicChord | undefined {
  const info = chordInfo(symbol);
  if (!info.isMajor || info.seventh === null || mod12(info.seventh - info.root) !== 10)
    return undefined;
  const targetRoot = mod12(info.root + 5);
  return diatonic.find(
    (d) =>
      chordInfo(d.symbol).root === targetRoot && !d.symbol.includes('dim') && d.numeral !== 'V7',
  );
}

function dedupeByRoot(list: ChordSuggestion[]): ChordSuggestion[] {
  const best = new Map<string, ChordSuggestion>();
  for (const s of list) {
    const info = chordInfo(s.symbol);
    const k = `${info.root}:${info.isMajor}`;
    const prev = best.get(k);
    if (!prev || s.score > prev.score) best.set(k, s);
  }
  return [...best.values()];
}
