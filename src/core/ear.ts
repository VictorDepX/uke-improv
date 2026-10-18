import { diatonicChords } from './harmony';
import { chordInfo, chromaName, mod12, modeOf, prefersFlats } from './music';
import type { HarmonicFunction, KeyContext } from './types';

/**
 * Treino de ouvido: gera perguntas (o que tocar e as opções) e confere respostas.
 * Puro e com sorteio injetável, para testar sem áudio.
 */

export type EarMode = 'interval' | 'quality' | 'function';
export type Rng = () => number;

/** O que tocar: grupos de notas MIDI em instantes relativos (segundos). */
export interface PlayEvent {
  midis: number[];
  at: number;
  dur: number;
  /** Acorde: toca as notas como batida, não juntas. */
  strum?: boolean;
}

export interface EarOption {
  id: string;
  label: string;
}

export interface EarQuestion {
  mode: EarMode;
  prompt: string;
  play: PlayEvent[];
  options: EarOption[];
  answer: string;
  /** Mostrado depois da resposta. */
  explain: string;
}

export const INTERVALS = [
  { semis: 1, label: '2ª menor' },
  { semis: 2, label: '2ª maior' },
  { semis: 3, label: '3ª menor' },
  { semis: 4, label: '3ª maior' },
  { semis: 5, label: '4ª justa' },
  { semis: 6, label: 'Trítono' },
  { semis: 7, label: '5ª justa' },
  { semis: 8, label: '6ª menor' },
  { semis: 9, label: '6ª maior' },
  { semis: 10, label: '7ª menor' },
  { semis: 11, label: '7ª maior' },
  { semis: 12, label: 'Oitava' },
] as const;

export type IntervalLevel = 'basic' | 'all';
export const BASIC_INTERVALS = [3, 4, 5, 7, 12];
export type Direction = 'up' | 'down' | 'harmonic';

export type QualityLevel = 'basic' | 'all';
const QUALITIES = [
  {
    id: 'maj',
    suffix: '',
    label: 'Maior',
    semis: [0, 4, 7],
    why: 'terça maior (4 semitons) e quinta justa',
  },
  {
    id: 'min',
    suffix: 'm',
    label: 'Menor',
    semis: [0, 3, 7],
    why: 'terça menor (3 semitons) e quinta justa',
  },
  {
    id: 'dim',
    suffix: 'dim',
    label: 'Diminuto',
    semis: [0, 3, 6],
    why: 'duas terças menores: a quinta é diminuta',
  },
  {
    id: 'aug',
    suffix: 'aug',
    label: 'Aumentado',
    semis: [0, 4, 8],
    why: 'duas terças maiores: a quinta é aumentada',
  },
] as const;

export interface EarSettings {
  intervalLevel: IntervalLevel;
  direction: Direction;
  qualityLevel: QualityLevel;
  /** Voicing de uke para os acordes (função): MIDIs da forma principal. */
  voicing: (symbol: string) => number[];
}

/** Região confortável para o ouvido e para o uke: C4 a A4 como nota de partida. */
const LOW = 60;
const HIGH = 69;

const pick = <T>(arr: readonly T[], rng: Rng): T => arr[Math.floor(rng() * arr.length)]!;

const FUNC_LABEL: Record<HarmonicFunction, string> = {
  T: 'tônica',
  S: 'subdominante',
  D: 'dominante',
};

function intervalQuestion(s: EarSettings, rng: Rng): EarQuestion {
  const pool = INTERVALS.filter(
    (i) => s.intervalLevel === 'all' || BASIC_INTERVALS.includes(i.semis),
  );
  const ivl = pick(pool, rng);
  const base = LOW + Math.floor(rng() * (HIGH - LOW + 1));
  const [first, second] =
    s.direction === 'down' ? [base + ivl.semis, base] : [base, base + ivl.semis];
  const play: PlayEvent[] =
    s.direction === 'harmonic'
      ? [{ midis: [base, base + ivl.semis], at: 0, dur: 1.4 }]
      : [
          { midis: [first], at: 0, dur: 0.8 },
          { midis: [second], at: 0.85, dur: 1 },
        ];
  const names = `${chromaName(mod12(first))} → ${chromaName(mod12(second))}`;
  return {
    mode: 'interval',
    prompt: s.direction === 'harmonic' ? 'Que intervalo soa junto?' : 'Que intervalo você ouviu?',
    play,
    options: pool.map((i) => ({ id: String(i.semis), label: i.label })),
    answer: String(ivl.semis),
    explain: `${ivl.label}: ${ivl.semis} ${ivl.semis === 1 ? 'semitom' : 'semitons'} (${names}).`,
  };
}

function qualityQuestion(s: EarSettings, rng: Rng): EarQuestion {
  const pool = QUALITIES.filter(
    (q) => s.qualityLevel === 'all' || q.id === 'maj' || q.id === 'min',
  );
  const q = pick(pool, rng);
  const root = LOW + Math.floor(rng() * (HIGH - LOW + 1));
  const midis = q.semis.map((x) => root + x);
  return {
    mode: 'quality',
    prompt: 'O acorde é…',
    // Arpejo e depois junto: ajuda a ouvir a terça.
    play: [
      ...midis.map((m, i) => ({ midis: [m], at: i * 0.35, dur: 0.5 })),
      { midis, at: 1.2, dur: 1.4 },
    ],
    options: pool.map((x) => ({ id: x.id, label: x.label })),
    answer: q.id,
    explain: `${chromaName(mod12(root))}${q.suffix}: ${q.why}.`,
  };
}

/** Graus que entram no treino de função: sem repetir o V7 e sem diminutos. */
export function functionDegrees(key: KeyContext) {
  return diatonicChords(key).filter((d) => d.numeral !== 'V7' && !d.symbol.includes('dim'));
}

function functionQuestion(key: KeyContext, s: EarSettings, rng: Rng): EarQuestion {
  const degrees = functionDegrees(key);
  const minor = modeOf(key.scale) === 'minor';
  const tonic = degrees[0]!;
  const sub = degrees.find((d) => d.numeral === (minor ? 'iv' : 'IV')) ?? degrees[0]!;
  // A dominante maior firma o tom mesmo no menor.
  const tonicRoot = chordInfo(tonic.symbol).root;
  const dom = `${chromaName(mod12(tonicRoot + 7), prefersFlats(key))}7`;
  const target = pick(degrees, rng);
  const cadence = [tonic.symbol, sub.symbol, dom, tonic.symbol];
  const play: PlayEvent[] = [
    ...cadence.map((c, i) => ({ midis: s.voicing(c), at: i * 0.7, dur: 0.65, strum: true })),
    { midis: s.voicing(target.symbol), at: cadence.length * 0.7 + 0.6, dur: 1.6, strum: true },
  ];
  return {
    mode: 'function',
    prompt: 'Depois da cadência, que grau soou?',
    play,
    options: degrees.map((d) => ({ id: d.numeral, label: d.numeral })),
    answer: target.numeral,
    explain: `${target.numeral} (${FUNC_LABEL[target.func]}): ${target.symbol}.`,
  };
}

export function makeQuestion(
  mode: EarMode,
  key: KeyContext,
  s: EarSettings,
  rng: Rng = Math.random,
): EarQuestion {
  if (mode === 'interval') return intervalQuestion(s, rng);
  if (mode === 'quality') return qualityQuestion(s, rng);
  return functionQuestion(key, s, rng);
}

/** Gerador determinístico (mulberry32), para testes e para sortear sem repetir em série. */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface EarScore {
  correct: number;
  total: number;
  streak: number;
  best: number;
}

export const EMPTY_SCORE: EarScore = { correct: 0, total: 0, streak: 0, best: 0 };

export function scoreAnswer(score: EarScore, right: boolean): EarScore {
  const streak = right ? score.streak + 1 : 0;
  return {
    correct: score.correct + (right ? 1 : 0),
    total: score.total + 1,
    streak,
    best: Math.max(score.best, streak),
  };
}
