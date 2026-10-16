import { PitchDetector } from 'pitchy';

export interface PitchReading {
  freq: number;
  clarity: number;
  rms: number;
}

export interface PitchTrackerOptions {
  /** Clareza mínima do McLeod (0–1) para aceitar um quadro. */
  minClarity: number;
  /** Faixa de frequência aceita (uke: C4 a C6). */
  minHz: number;
  maxHz: number;
  /** Quadros seguidos com a mesma nota para confirmá-la. */
  stableFrames: number;
  /** RMS mínimo para considerar que há som. */
  minRms: number;
  /** Salto de RMS entre quadros que caracteriza um novo ataque. */
  onsetRatio: number;
  /** Quadros de silêncio até soltar a nota. */
  releaseFrames: number;
}

export const DEFAULT_PITCH_OPTIONS: PitchTrackerOptions = {
  minClarity: 0.9,
  minHz: 250,
  maxHz: 1100,
  stableFrames: 4,
  minRms: 0.01,
  onsetRatio: 1.4,
  releaseFrames: 6,
};

export type PitchEvent =
  { type: 'noteOn'; midi: number; freq: number; cents: number } | { type: 'noteOff' };

export function freqToMidiFloat(freq: number): number {
  return 69 + 12 * Math.log2(freq / 440);
}

export function freqToNote(freq: number): { midi: number; cents: number } {
  const exact = freqToMidiFloat(freq);
  const midi = Math.round(exact);
  return { midi, cents: Math.round((exact - midi) * 100) };
}

export function rms(frame: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < frame.length; i++) sum += frame[i]! * frame[i]!;
  return Math.sqrt(sum / frame.length);
}

/**
 * Transforma quadros de áudio em eventos de nota estáveis.
 * Puro em relação ao Web Audio: recebe Float32Array, então é testável com sinais sintetizados.
 */
export class PitchTracker {
  private readonly opts: PitchTrackerOptions;
  private detector: PitchDetector<Float32Array> | null = null;
  private candidate: number | null = null;
  private count = 0;
  private current: number | null = null;
  private pendingOnset = false;
  private prevRms = 0;
  private silentFrames = 0;

  constructor(options: Partial<PitchTrackerOptions> = {}) {
    this.opts = { ...DEFAULT_PITCH_OPTIONS, ...options };
  }

  get currentMidi(): number | null {
    return this.current;
  }

  reset(): void {
    this.candidate = null;
    this.count = 0;
    this.current = null;
    this.pendingOnset = false;
    this.prevRms = 0;
    this.silentFrames = 0;
  }

  /** Lê frequência e clareza de um quadro, sem estado. */
  read(frame: Float32Array, sampleRate: number): PitchReading {
    if (!this.detector || this.detector.inputLength !== frame.length) {
      this.detector = PitchDetector.forFloat32Array(frame.length);
    }
    const level = rms(frame);
    const [freq, clarity] = this.detector.findPitch(frame, sampleRate);
    return { freq, clarity, rms: level };
  }

  process(
    frame: Float32Array,
    sampleRate: number,
  ): { reading: PitchReading; events: PitchEvent[] } {
    const o = this.opts;
    const reading = this.read(frame, sampleRate);
    const events: PitchEvent[] = [];

    if (reading.rms < o.minRms) {
      this.silentFrames += 1;
      this.count = 0;
      this.candidate = null;
      if (this.current !== null && this.silentFrames >= o.releaseFrames) {
        this.current = null;
        events.push({ type: 'noteOff' });
      }
      this.prevRms = reading.rms;
      return { reading, events };
    }

    this.silentFrames = 0;
    if (reading.rms > this.prevRms * o.onsetRatio) {
      this.pendingOnset = true;
      this.count = 0;
    }
    this.prevRms = reading.rms;

    const valid =
      reading.clarity >= o.minClarity && reading.freq >= o.minHz && reading.freq <= o.maxHz;
    if (!valid) {
      this.count = 0;
      return { reading, events };
    }

    const { midi, cents } = freqToNote(reading.freq);
    this.count = midi === this.candidate ? this.count + 1 : 1;
    this.candidate = midi;

    if (this.count >= o.stableFrames && (midi !== this.current || this.pendingOnset)) {
      this.current = midi;
      this.pendingOnset = false;
      events.push({ type: 'noteOn', midi, freq: reading.freq, cents });
    }
    return { reading, events };
  }
}
