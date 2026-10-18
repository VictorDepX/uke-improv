import type * as ToneNS from 'tone';
import { voicingFor } from '@/core/chordShapes';
import { DEFAULT_GROOVES, type Groove } from '@/core/grooves';
import { METERS, type Meter, type Segment, buildTimeline } from '@/core/rhythm';
import { stepEvents } from '@/core/sequencer';
import type { TuningName } from '@/core/types';
import { ensureAudio, strum, type Instruments } from './sound';

export interface JamPosition {
  /** Compasso absoluto; −1 na contagem. */
  bar: number;
  beat: number;
  /** Índice absoluto do acorde (−1 na contagem). */
  segment: number;
}

export interface JamSong {
  /** Acordes de cada compasso (1 ou 2). */
  bars: readonly (readonly string[])[];
  meter: Meter;
  /** Batida; padrão: a do compasso. */
  groove?: Groove;
  tuning: TuningName;
  /** Casa do capotraste: a base toca as mesmas formas que a mão, soando no tom certo. */
  capo?: number;
}

export interface JamConfig extends JamSong {
  bpm: number;
  /** Chamado no tempo exato de cada tempo, sincronizado com o áudio. */
  onPosition: (pos: JamPosition) => void;
  /** Chamado quando um acorde começa a soar. */
  onChord: (chord: string) => void;
}

interface Prepared {
  timeline: Segment[];
  meter: Meter;
  groove: Groove;
  voicings: number[][];
}

function prepare(song: JamSong): Prepared {
  const timeline = buildTimeline(song.bars, song.meter);
  const groove =
    song.groove && song.groove.meter === song.meter ? song.groove : DEFAULT_GROOVES[song.meter];
  return {
    timeline,
    meter: song.meter,
    groove,
    voicings: timeline.map((s) => voicingFor(s.chord, song.tuning, song.capo ?? 0).midis),
  };
}

/**
 * Motor da base: um loop de semicolcheias no Transport do Tone.js. O que toca em cada
 * semicolcheia vem de `stepEvents` (puro, testado); aqui só vira som e chamadas de volta.
 */
export class JamEngine {
  private loop: ToneNS.Loop | null = null;
  private inst: Instruments | null = null;
  private config: JamConfig | null = null;
  private song: Prepared | null = null;
  /** Mudança pendente, aplicada no próximo começo de compasso. */
  private pending: Prepared | null = null;
  private step = 0;
  private bpm = 90;

  get running(): boolean {
    return this.loop !== null;
  }

  async start(config: JamConfig): Promise<void> {
    this.stop();
    const inst = await ensureAudio();
    this.inst = inst;
    this.config = config;
    this.song = prepare(config);
    this.pending = null;
    this.step = 0;
    this.bpm = config.bpm;

    const { Tone } = inst;
    const transport = Tone.getTransport();
    transport.cancel();
    transport.bpm.value = config.bpm * METERS[config.meter].bpmFactor;
    transport.position = 0;

    this.loop = new Tone.Loop((time) => this.tick(time), '16n').start(0);
    transport.start('+0.05');
  }

  stop(): void {
    if (!this.inst) return;
    const transport = this.inst.Tone.getTransport();
    transport.stop();
    transport.cancel();
    this.loop?.dispose();
    this.loop = null;
  }

  setBpm(bpm: number): void {
    this.bpm = bpm;
    const meter = this.song?.meter ?? '4/4';
    this.inst?.Tone.getTransport().bpm.rampTo(bpm * METERS[meter].bpmFactor, 0.2);
  }

  /** Troca a progressão sem parar; vale a partir do próximo compasso. */
  update(song: JamSong): void {
    if (!this.config) return;
    this.config = { ...this.config, ...song };
    this.pending = prepare(song);
  }

  private tick(time: number): void {
    const inst = this.inst;
    const cfg = this.config;
    let song = this.song;
    if (!inst || !cfg || !song || song.timeline.length === 0) return;

    const perBar = METERS[song.meter].beats * METERS[song.meter].stepsPerBeat;
    if (this.pending && this.step % perBar === 0) {
      const next = this.pending;
      if (next.meter !== song.meter) {
        // Fórmula nova: mantém o número do compasso e reposiciona a grade.
        const nextPerBar = METERS[next.meter].beats * METERS[next.meter].stepsPerBeat;
        this.step = (this.step / perBar) * nextPerBar;
        inst.Tone.getTransport().bpm.value = this.bpm * METERS[next.meter].bpmFactor;
      }
      song = this.song = next;
      this.pending = null;
    }

    const ev = stepEvents(this.step, song.timeline, song.meter, song.groove);
    this.step += 1;
    const sixteenth = inst.Tone.Time('16n').toSeconds();
    const t = time + ev.delay * sixteenth;

    if (ev.click)
      inst.click.triggerAttackRelease(ev.click === 'accent' ? 'C6' : 'G5', '32n', t, 0.6);

    if (ev.segmentIndex >= 0) {
      if (ev.strum)
        strum(
          inst,
          song.voicings[ev.segmentIndex]!,
          t,
          ev.strum.dir,
          ev.strum.vel,
          song.groove.muted,
        );
      if (ev.bass)
        inst.bass.triggerAttackRelease(
          inst.Tone.Frequency(ev.bass.midi, 'midi').toFrequency(),
          '8n',
          t,
          ev.bass.vel,
        );
      if (ev.kick) inst.kick.triggerAttackRelease('C1', '8n', t, 0.8);
      if (ev.snare)
        inst.snare.triggerAttackRelease(
          song.groove.rim ? '64n' : '16n',
          t,
          song.groove.rim ? 0.25 : 0.4,
        );
      if (ev.hat !== undefined) inst.hat.triggerAttackRelease('C6', '32n', t, ev.hat);
    }

    const draw = inst.Tone.getDraw();
    if (ev.chordStart) {
      const chord = song.timeline[ev.segmentIndex]!.chord;
      draw.schedule(() => cfg.onChord(chord), t);
    }
    if (ev.beat !== null) {
      const pos = { bar: ev.bar, beat: ev.beat, segment: ev.segment };
      draw.schedule(() => cfg.onPosition(pos), t);
    }
  }
}

export const jamEngine = new JamEngine();
