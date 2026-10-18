/**
 * Tempo musical da base: fórmulas de compasso, divisão do compasso entre acordes
 * e a linha do tempo de um ciclo da progressão. Tudo em uma grade de semicolcheias.
 */

export type Meter = '4/4' | '3/4' | '6/8';

export interface MeterInfo {
  label: string;
  /** Tempos contados por compasso (no 6/8, as 6 colcheias). */
  beats: number;
  /** Semicolcheias por tempo. */
  stepsPerBeat: number;
  /** Tempos com acento (o 1, e o 4 no 6/8). */
  accents: readonly number[];
  /** BPM do usuário × fator = BPM de semínima do Transport. No 6/8 o pulso é a semínima pontuada. */
  bpmFactor: number;
  /** Quantos tempos antes da troca o próximo acorde aparece no braço. */
  previewBeats: number;
}

export const METERS: Record<Meter, MeterInfo> = {
  '4/4': { label: '4/4', beats: 4, stepsPerBeat: 4, accents: [0], bpmFactor: 1, previewBeats: 1 },
  '3/4': { label: '3/4', beats: 3, stepsPerBeat: 4, accents: [0], bpmFactor: 1, previewBeats: 1 },
  '6/8': {
    label: '6/8',
    beats: 6,
    stepsPerBeat: 2,
    accents: [0, 3],
    bpmFactor: 1.5,
    previewBeats: 2,
  },
};

export const stepsPerBar = (meter: Meter): number =>
  METERS[meter].beats * METERS[meter].stepsPerBeat;

/** Até 2 acordes por compasso. */
export const MAX_CHORDS_PER_BAR = 2;

/** Tempos de cada acorde quando o compasso tem `count` acordes. */
export function splitBar(meter: Meter, count: number): number[] {
  const { beats } = METERS[meter];
  if (count <= 1) return [beats];
  // 4/4: 2+2 · 3/4: 2+1 · 6/8: 3+3
  const first = Math.ceil(beats / 2);
  return [first, beats - first];
}

/** Um compasso escrito "ii V7" vira dois acordes. */
export const parseBar = (bar: string): string[] =>
  bar.trim().split(/\s+/).filter(Boolean).slice(0, MAX_CHORDS_PER_BAR);

export interface Segment {
  chord: string;
  /** Compasso dentro do ciclo. */
  bar: number;
  /** Tempo em que o acorde entra. */
  startBeat: number;
  beats: number;
}

/** Um ciclo da progressão, acorde a acorde. */
export function buildTimeline(bars: readonly (readonly string[])[], meter: Meter): Segment[] {
  const out: Segment[] = [];
  bars.forEach((chords, bar) => {
    const lengths = splitBar(meter, chords.length);
    let start = 0;
    chords.slice(0, MAX_CHORDS_PER_BAR).forEach((chord, i) => {
      out.push({ chord, bar, startBeat: start, beats: lengths[i]! });
      start += lengths[i]!;
    });
  });
  return out;
}

/** Índice do acorde que soa no compasso `bar` (absoluto) e tempo `beat`. */
export function segmentIndexAt(timeline: readonly Segment[], bar: number, beat: number): number {
  const cycle = timeline.at(-1)!.bar + 1;
  const b = ((bar % cycle) + cycle) % cycle;
  let idx = 0;
  timeline.forEach((s, i) => {
    if (s.bar === b && s.startBeat <= beat) idx = i;
  });
  return idx;
}

export interface Upcoming {
  current: string | null;
  next: string | null;
  /** Hora de mostrar o próximo acorde no braço. */
  preview: boolean;
}

/** Acorde atual, próximo e se já é hora de antecipá-lo. bar < 0 = contagem. */
export function upcoming(
  timeline: readonly Segment[],
  meter: Meter,
  bar: number,
  beat: number,
): Upcoming {
  if (timeline.length === 0) return { current: null, next: null, preview: false };
  if (bar < 0) return { current: null, next: timeline[0]!.chord, preview: true };
  const i = segmentIndexAt(timeline, bar, beat);
  const seg = timeline[i]!;
  const next = timeline[(i + 1) % timeline.length]!;
  const left = seg.startBeat + seg.beats - beat;
  return {
    current: seg.chord,
    next: next.chord,
    preview: left <= Math.min(METERS[meter].previewBeats, seg.beats),
  };
}
