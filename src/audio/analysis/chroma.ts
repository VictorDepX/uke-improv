import { chordInfo, mod12 } from '@/core/music';
import { freqToMidiFloat } from './pitch';

export type ChromaVector = number[];

export interface ChromaOptions {
  minHz: number;
  maxHz: number;
  /** Picos abaixo desta fração do maior pico são ignorados. */
  peakThreshold: number;
}

export const DEFAULT_CHROMA_OPTIONS: ChromaOptions = {
  minHz: 180,
  maxHz: 2600,
  peakThreshold: 0.04,
};

/** Converte a saída de `AnalyserNode.getFloatFrequencyData` (dB) para magnitude linear. */
export function dbToLinear(db: Float32Array): Float32Array {
  const out = new Float32Array(db.length);
  for (let i = 0; i < db.length; i++) out[i] = Number.isFinite(db[i]!) ? 10 ** (db[i]! / 20) : 0;
  return out;
}

/**
 * Cromagrama de 12 posições a partir de um espectro de magnitude linear.
 * Usa só picos locais, refinados por interpolação parabólica, pesados pela proximidade do semitom.
 */
export function computeChroma(
  magnitudes: Float32Array,
  sampleRate: number,
  options: Partial<ChromaOptions> = {},
): ChromaVector {
  const o = { ...DEFAULT_CHROMA_OPTIONS, ...options };
  const fftSize = magnitudes.length * 2;
  const binHz = sampleRate / fftSize;
  const lo = Math.max(1, Math.floor(o.minHz / binHz));
  const hi = Math.min(magnitudes.length - 2, Math.ceil(o.maxHz / binHz));

  let max = 0;
  for (let k = lo; k <= hi; k++) max = Math.max(max, magnitudes[k]!);
  const chroma = new Array<number>(12).fill(0);
  if (max === 0) return chroma;
  const threshold = max * o.peakThreshold;

  for (let k = lo; k <= hi; k++) {
    const m = magnitudes[k]!;
    if (m < threshold || m < magnitudes[k - 1]! || m < magnitudes[k + 1]!) continue;
    const a = magnitudes[k - 1]!;
    const b = m;
    const c = magnitudes[k + 1]!;
    const denom = a - 2 * b + c;
    const offset = denom === 0 ? 0 : (0.5 * (a - c)) / denom;
    const freq = (k + offset) * binHz;
    const midiFloat = freqToMidiFloat(freq);
    const nearest = Math.round(midiFloat);
    const deviation = Math.abs(midiFloat - nearest); // 0 … 0.5
    const tuningWeight = Math.max(0, 1 - 2.5 * deviation);
    chroma[mod12(nearest)]! += m * m * tuningWeight;
  }
  return normalize(chroma);
}

function normalize(v: number[]): number[] {
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
  return norm === 0 ? v : v.map((x) => x / norm);
}

const HARMONICS = [
  { semis: 0, w: 1 },
  { semis: 12, w: 0.5 },
  { semis: 19, w: 0.33 },
  { semis: 24, w: 0.25 },
];

const templateCache = new Map<string, ChromaVector>();

/** Modelo do acorde incluindo os primeiros harmônicos de cada nota (fica mais parecido com o real). */
export function chordTemplate(symbol: string): ChromaVector {
  const hit = templateCache.get(symbol);
  if (hit) return hit;
  const v = new Array<number>(12).fill(0);
  for (const pc of chordInfo(symbol).chromas) {
    for (const h of HARMONICS) v[mod12(pc + h.semis)]! += h.w * h.w;
  }
  const t = normalize(v);
  templateCache.set(symbol, t);
  return t;
}

export function cosine(a: ChromaVector, b: ChromaVector): number {
  let dot = 0;
  for (let i = 0; i < 12; i++) dot += a[i]! * b[i]!;
  return dot;
}

export interface ChordMatch {
  symbol: string;
  score: number;
}

export function matchChord(chroma: ChromaVector, candidates: readonly string[]): ChordMatch[] {
  return candidates
    .map((symbol) => ({ symbol, score: cosine(chroma, chordTemplate(symbol)) }))
    .sort((a, b) => b.score - a.score);
}

export interface ChordTrackerOptions {
  stableReads: number;
  minScore: number;
}

/** Confirma um acorde só depois de N leituras iguais com similaridade mínima. */
export class ChordTracker {
  private readonly opts: ChordTrackerOptions;
  private candidate: string | null = null;
  private count = 0;
  private current: string | null = null;

  constructor(options: Partial<ChordTrackerOptions> = {}) {
    this.opts = { stableReads: 3, minScore: 0.75, ...options };
  }

  get currentChord(): string | null {
    return this.current;
  }

  reset(): void {
    this.candidate = null;
    this.count = 0;
    this.current = null;
  }

  /** Recebe o melhor casamento da leitura; devolve o acorde quando ele é confirmado. */
  process(best: ChordMatch | undefined): ChordMatch | null {
    if (!best || best.score < this.opts.minScore) {
      this.count = 0;
      this.candidate = null;
      return null;
    }
    this.count = best.symbol === this.candidate ? this.count + 1 : 1;
    this.candidate = best.symbol;
    if (this.count >= this.opts.stableReads && best.symbol !== this.current) {
      this.current = best.symbol;
      return best;
    }
    return null;
  }
}
