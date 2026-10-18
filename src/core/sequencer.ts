import { BASS_INTERVAL, type Groove, type StrumDir } from './grooves';
import { chordInfo } from './music';
import { METERS, type Meter, type Segment, segmentIndexAt, stepsPerBar } from './rhythm';

/** Tudo o que soa (e o que a tela precisa saber) numa semicolcheia da base. */
export interface StepEvents {
  /** Compasso absoluto desde o início; −1 na contagem. */
  bar: number;
  /** Tempo, quando a semicolcheia cai num tempo. */
  beat: number | null;
  /** Índice absoluto do acorde desde o início (−1 na contagem). */
  segment: number;
  /** Índice do acorde dentro do ciclo. */
  segmentIndex: number;
  /** Um acorde começa nesta semicolcheia. */
  chordStart: boolean;
  click?: 'accent' | 'normal';
  strum?: { dir: StrumDir; vel: number };
  /** MIDI do baixo. */
  bass?: { midi: number; vel: number };
  kick: boolean;
  snare: boolean;
  hat?: number;
  /** Atraso desta semicolcheia, em frações de semicolcheia (swing). */
  delay: number;
}

const BASS_OCTAVE = 36; // C2

/**
 * O que acontece na semicolcheia `step` (absoluta, 0 = começo da contagem de 1 compasso).
 * Função pura: o motor de áudio só traduz isto em notas.
 */
export function stepEvents(
  step: number,
  timeline: readonly Segment[],
  meter: Meter,
  groove: Groove,
): StepEvents {
  const info = METERS[meter];
  const perBar = stepsPerBar(meter);
  const barAbs = Math.floor(step / perBar);
  const inBar = step % perBar;
  const beat = inBar % info.stepsPerBeat === 0 ? inBar / info.stepsPerBeat : null;
  const swingable = groove.swing && inBar % 4 === 2 && info.stepsPerBeat === 4;
  const delay = swingable ? groove.swing! * 2 : 0;

  if (barAbs === 0) {
    // Contagem: um clique por tempo.
    return {
      bar: -1,
      beat,
      segment: -1,
      segmentIndex: -1,
      chordStart: false,
      click: beat === null ? undefined : info.accents.includes(beat) ? 'accent' : 'normal',
      kick: false,
      snare: false,
      delay: 0,
    };
  }

  const bar = barAbs - 1;
  const cycle = timeline.at(-1)!.bar + 1;
  const beatPos = inBar / info.stepsPerBeat;
  const segmentIndex = segmentIndexAt(timeline, bar, beatPos);
  const seg = timeline[segmentIndex]!;
  const chordStart = beat !== null && seg.startBeat === beat;
  // A linha do tempo está em ordem, então o índice no ciclo já conta os acordes anteriores.
  const segment = Math.floor(bar / cycle) * timeline.length + segmentIndex;

  // Um acorde que entra no meio do compasso (2 tempos) ganha a própria batida.
  const segStartStep = seg.startBeat * info.stepsPerBeat;
  const rel = inBar - segStartStep;
  const s = groove.strum[inBar] ?? (rel === 0 && segStartStep > 0 ? groove.strum[0] : undefined);

  const root = chordInfo(seg.chord).root;
  const b =
    groove.bass.find((x) => x.step === inBar) ??
    (rel === 0 && segStartStep > 0 ? groove.bass[0] : undefined);

  return {
    bar,
    beat,
    segment,
    segmentIndex,
    chordStart,
    strum: s ? { dir: s[0], vel: s[1] } : undefined,
    bass: b ? { midi: BASS_OCTAVE + root + BASS_INTERVAL[b.tone], vel: b.vel ?? 0.8 } : undefined,
    kick: groove.kick.includes(inBar),
    snare: groove.snare.includes(inBar),
    hat: groove.hat[inBar],
    delay,
  };
}
