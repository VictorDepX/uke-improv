/**
 * Geradores de "samples" sintetizados de ukulele para os testes de áudio.
 * Determinísticos (PRNG com semente) para que os testes nunca oscilem.
 */
import { midiToFreq } from '@/core/music';

export const SAMPLE_RATE = 44100;

export function prng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface PluckOptions {
  duration?: number;
  amplitude?: number;
  /** Constante de decaimento da fundamental, em segundos. */
  decay?: number;
  seed?: number;
  detuneCents?: number;
}

/** Corda dedilhada por síntese aditiva: harmônicos 1/h com decaimento mais rápido nos agudos. */
export function pluck(midi: number, opts: PluckOptions = {}): Float32Array {
  const { duration = 1, amplitude = 0.3, decay = 0.8, seed = midi, detuneCents = 0 } = opts;
  const f0 = midiToFreq(midi) * 2 ** (detuneCents / 1200);
  const n = Math.round(duration * SAMPLE_RATE);
  const out = new Float32Array(n);
  const rand = prng(seed);
  const attack = Math.round(0.003 * SAMPLE_RATE);
  for (let h = 1; h * f0 < SAMPLE_RATE * 0.45 && h <= 16; h++) {
    const amp = amplitude / h ** 1.2;
    const tau = decay / (1 + 0.6 * (h - 1));
    const phase = rand() * 2 * Math.PI;
    const w = (2 * Math.PI * h * f0) / SAMPLE_RATE;
    for (let i = 0; i < n; i++) {
      const env = Math.exp(-i / (tau * SAMPLE_RATE)) * Math.min(1, i / attack);
      out[i]! += amp * env * Math.sin(w * i + phase);
    }
  }
  return out;
}

/** Corda dedilhada por Karplus-Strong (timbre mais realista, afinação aproximada). */
export function karplusStrong(midi: number, duration = 1, seed = 7): Float32Array {
  const n = Math.round(duration * SAMPLE_RATE);
  // O filtro de média encurta o laço em meio período de amostra; compensamos no comprimento.
  const len = Math.round(SAMPLE_RATE / midiToFreq(midi) + 0.5);
  const rand = prng(seed);
  const delay = Float32Array.from({ length: len }, () => rand() * 2 - 1);
  const mean = delay.reduce((s, x) => s + x, 0) / len;
  for (let i = 0; i < len; i++) delay[i]! -= mean; // sem componente DC, como uma corda real
  const out = new Float32Array(n);
  for (let i = 0, p = 0; i < n; i++, p = (p + 1) % len) {
    const next = (p + 1) % len;
    const y = 0.4995 * (delay[p]! + delay[next]!);
    out[i] = delay[p]! * 0.3;
    delay[p] = y;
  }
  return out;
}

/** Soma sinais, cada um a partir de um deslocamento em segundos. */
export function mix(total: number, parts: { signal: Float32Array; at: number }[]): Float32Array {
  const out = new Float32Array(Math.round(total * SAMPLE_RATE));
  for (const { signal, at } of parts) {
    const start = Math.round(at * SAMPLE_RATE);
    for (let i = 0; i < signal.length && start + i < out.length; i++) out[start + i]! += signal[i]!;
  }
  return out;
}

/** Batida de acorde: cordas da 4ª para a 1ª com 12 ms entre elas. */
export function strum(
  midis: number[],
  duration = 1,
  at = 0,
  seed = 1,
): { signal: Float32Array; at: number }[] {
  return midis.map((m, i) => ({
    signal: pluck(m, { duration, amplitude: 0.18, seed: seed * 31 + i }),
    at: at + i * 0.012,
  }));
}

export function addNoise(signal: Float32Array, level: number, seed = 99): Float32Array {
  const rand = prng(seed);
  return signal.map((x) => x + (rand() * 2 - 1) * level);
}

/** Percorre o sinal como o loop de análise do app: janelas de `size` amostras a cada `hop`. */
export function* frames(
  signal: Float32Array,
  size: number,
  hop: number,
): Generator<{ frame: Float32Array; time: number }> {
  for (let end = size; end <= signal.length; end += hop) {
    yield { frame: signal.subarray(end - size, end), time: end / SAMPLE_RATE };
  }
}

/** Como `frames`, mas começando antes do sinal encher a janela (preenche com silêncio), igual ao AnalyserNode. */
export function* framesFromStart(
  signal: Float32Array,
  size: number,
  hop: number,
): Generator<{ frame: Float32Array; time: number }> {
  for (let end = hop; end <= signal.length; end += hop) {
    const frame = new Float32Array(size);
    const start = Math.max(0, end - size);
    frame.set(signal.subarray(start, end), size - (end - start));
    yield { frame, time: end / SAMPLE_RATE };
  }
}
