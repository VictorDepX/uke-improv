import type * as ToneNS from 'tone';
import { shapesFor, shapeToMidis } from '@/core/chordShapes';
import { chordInfo } from '@/core/music';
import type { TuningName } from '@/core/types';
import { ensureAudio, strum, type Instruments } from './sound';

export interface JamConfig {
  chords: readonly string[];
  bpm: number;
  tuning: TuningName;
  /** Chamado no tempo exato de cada batida, sincronizado com o áudio. bar = -1 na contagem. */
  onPosition: (bar: number, beat: number) => void;
}

/** Batida "baixo, baixo-cima, cima-baixo-cima" em colcheias (0–7). */
const STRUM_PATTERN: Record<number, 'down' | 'up'> = {
  0: 'down',
  2: 'down',
  3: 'up',
  5: 'up',
  6: 'down',
  7: 'up',
};

/**
 * Motor da base: um loop de colcheias no Transport do Tone.js.
 * Independente do React e do store; quem usa passa os acordes e recebe as posições.
 */
export class JamEngine {
  private loop: ToneNS.Loop | null = null;
  private inst: Instruments | null = null;
  private config: JamConfig | null = null;
  private voicings: number[][] = [];
  private step = 0;

  get running(): boolean {
    return this.loop !== null;
  }

  async start(config: JamConfig): Promise<void> {
    this.stop();
    const inst = await ensureAudio();
    this.inst = inst;
    this.config = config;
    this.voicings = this.buildVoicings(config.chords, config.tuning);
    this.step = 0;

    const { Tone } = inst;
    const transport = Tone.getTransport();
    transport.cancel();
    transport.bpm.value = config.bpm;
    transport.position = 0;

    this.loop = new Tone.Loop((time) => this.tick(time), '8n').start(0);
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
    this.inst?.Tone.getTransport().bpm.rampTo(bpm, 0.2);
  }

  /** Troca a progressão sem parar (vale a partir do próximo compasso). */
  updateChords(chords: readonly string[], tuning: TuningName): void {
    if (!this.config) return;
    this.config = { ...this.config, chords, tuning };
    this.voicings = this.buildVoicings(chords, tuning);
  }

  private buildVoicings(chords: readonly string[], tuning: TuningName): number[][] {
    return chords.map((c) => shapeToMidis(shapesFor(c, tuning)[0] ?? [0, 0, 0, 0], tuning));
  }

  private tick(time: number): void {
    const inst = this.inst;
    const cfg = this.config;
    if (!inst || !cfg || cfg.chords.length === 0) return;
    const eighth = this.step % 8;
    const barAbs = Math.floor(this.step / 8);
    this.step += 1;
    const onBeat = eighth % 2 === 0;
    const beat = eighth / 2;

    if (barAbs === 0) {
      // Contagem de 1 compasso.
      if (onBeat) {
        inst.click.triggerAttackRelease(beat === 0 ? 'C6' : 'G5', '32n', time, 0.6);
        inst.Tone.getDraw().schedule(() => cfg.onPosition(-1, beat), time);
      }
      return;
    }

    const bar = barAbs - 1;
    const idx = bar % cfg.chords.length;
    const voicing = this.voicings[idx]!;
    const direction = STRUM_PATTERN[eighth];
    if (direction) strum(inst, voicing, time, direction, direction === 'down' ? 0.65 : 0.45);

    if (eighth === 0 || eighth === 4) {
      const root = chordInfo(cfg.chords[idx]!).root;
      inst.bass.triggerAttackRelease(
        inst.Tone.Frequency(36 + root, 'midi').toFrequency(),
        '4n',
        time,
        0.8,
      );
      inst.kick.triggerAttackRelease('C1', '8n', time, 0.8);
    }
    if (eighth === 2 || eighth === 6) inst.snare.triggerAttackRelease('16n', time, 0.4);
    inst.hat.triggerAttackRelease('C6', '32n', time, onBeat ? 0.5 : 0.3);

    if (onBeat) inst.Tone.getDraw().schedule(() => cfg.onPosition(bar, beat), time);
  }
}

export const jamEngine = new JamEngine();
