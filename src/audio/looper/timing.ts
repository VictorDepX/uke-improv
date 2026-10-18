import { METERS, type Meter } from '@/core/rhythm';

/**
 * Contas do looper, sem Web Audio: duração do loop, recorte da captura
 * e forma de onda para a tela.
 */

/** Duração de um compasso, em segundos, no BPM do usuário (no 6/8, pulso de semínima pontuada). */
export function barSeconds(bpm: number, meter: Meter): number {
  const { beats, stepsPerBeat, bpmFactor } = METERS[meter];
  const quarter = 60 / (bpm * bpmFactor);
  return (beats * stepsPerBeat * quarter) / 4;
}

export const loopSeconds = (bpm: number, meter: Meter, bars: number): number =>
  barSeconds(bpm, meter) * bars;

/** Primeiro instante ≥ `now` que cai num começo de ciclo (a partir de `origin`). */
export function nextBoundary(now: number, origin: number, period: number): number {
  if (now <= origin) return origin;
  const k = Math.ceil((now - origin) / period - 1e-9);
  return origin + k * period;
}

/** Um bloco capturado: amostras e o instante (tempo do AudioContext) da primeira delas. */
export interface CaptureChunk {
  t: number;
  data: Float32Array;
}

/**
 * Copia de `chunks` exatamente `duration` segundos a partir de `start`. Trechos sem captura
 * viram silêncio. Usado para cortar o loop no compasso exato, já descontada a latência.
 */
export function sliceCapture(
  chunks: readonly CaptureChunk[],
  sampleRate: number,
  start: number,
  duration: number,
): Float32Array {
  const length = Math.round(duration * sampleRate);
  const out = new Float32Array(length);
  for (const c of chunks) {
    const offset = Math.round((c.t - start) * sampleRate);
    for (let i = 0; i < c.data.length; i++) {
      const j = offset + i;
      if (j >= 0 && j < length) out[j] = c.data[i]!;
    }
  }
  return out;
}

/** Suaviza começo e fim (ms) para o loop não estalar na emenda. */
export function fadeEdges(samples: Float32Array, sampleRate: number, ms = 5): Float32Array {
  const n = Math.min(Math.round((ms / 1000) * sampleRate), Math.floor(samples.length / 2));
  for (let i = 0; i < n; i++) {
    const g = i / n;
    samples[i]! *= g;
    samples[samples.length - 1 - i]! *= g;
  }
  return samples;
}

/** Picos por faixa (0–1), para desenhar a forma de onda. */
export function waveform(samples: Float32Array, buckets: number): number[] {
  const size = Math.max(1, Math.floor(samples.length / buckets));
  const out: number[] = [];
  for (let b = 0; b < buckets; b++) {
    let peak = 0;
    for (let i = b * size; i < Math.min(samples.length, (b + 1) * size); i++)
      peak = Math.max(peak, Math.abs(samples[i]!));
    out.push(Math.min(1, peak));
  }
  return out;
}

/**
 * Atraso da captura em relação ao que se ouve: o som sai da caixa `output` segundos depois
 * de agendado e o toque chega ao microfone `input` segundos depois de tocado.
 */
export function defaultLatency(
  outputLatency: number | undefined,
  baseLatency: number | undefined,
): number {
  const INPUT_ESTIMATE = 0.015;
  return (outputLatency ?? 0) + (baseLatency ?? 0) + INPUT_ESTIMATE;
}
