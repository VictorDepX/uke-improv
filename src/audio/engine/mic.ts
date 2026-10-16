import {
  ChordTracker,
  computeChroma,
  dbToLinear,
  matchChord,
  type ChordMatch,
} from '../analysis/chroma';
import { PitchTracker, freqToNote } from '../analysis/pitch';

export interface MicCallbacks {
  onNote: (midi: number, cents: number) => void;
  onNoteOff: () => void;
  onChord: (match: ChordMatch) => void;
  /** Nível e afinação contínuos, para o medidor e o afinador (~15 vezes por segundo). */
  onLevel: (rms: number, tuning: { midi: number; cents: number } | null) => void;
}

const FFT_SIZE = 8192;
const PITCH_WINDOW = 2048;
const CHROMA_EVERY = 3;
const LEVEL_EVERY = 4;

export class MicError extends Error {
  constructor(
    message: string,
    readonly kind: 'denied' | 'unsupported' | 'other',
  ) {
    super(message);
  }
}

/**
 * Liga o microfone e roda a análise a cada quadro de animação.
 * Supressão de ruído, cancelamento de eco e ganho automático ficam desligados:
 * eles foram feitos para voz e distorcem o sinal do instrumento.
 */
export class MicInput {
  private ctx: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private raf = 0;
  private readonly pitch = new PitchTracker();
  private readonly chords = new ChordTracker();

  get active(): boolean {
    return this.ctx !== null;
  }

  async start(getCandidates: () => readonly string[], cb: MicCallbacks): Promise<void> {
    if (this.ctx) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new MicError('Este navegador não dá acesso ao microfone.', 'unsupported');
    }
    // Criado antes de qualquer await, ainda dentro do gesto do usuário (exigência do iOS).
    const ctx = new AudioContext();
    void ctx.resume();
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
    } catch (err) {
      void ctx.close();
      const denied =
        err instanceof DOMException &&
        (err.name === 'NotAllowedError' || err.name === 'SecurityError');
      throw new MicError(
        denied ? 'Permissão do microfone negada.' : 'Não foi possível abrir o microfone.',
        denied ? 'denied' : 'other',
      );
    }

    this.ctx = ctx;
    await ctx.resume();
    const source = ctx.createMediaStreamSource(this.stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = FFT_SIZE;
    analyser.smoothingTimeConstant = 0.2;
    source.connect(analyser);

    const time = new Float32Array(FFT_SIZE);
    const freq = new Float32Array(FFT_SIZE / 2);
    this.pitch.reset();
    this.chords.reset();
    let frame = 0;

    const loop = () => {
      this.raf = requestAnimationFrame(loop);
      frame += 1;
      analyser.getFloatTimeDomainData(time);
      const window = time.subarray(FFT_SIZE - PITCH_WINDOW);
      const { reading, events } = this.pitch.process(window, ctx.sampleRate);
      for (const e of events) {
        if (e.type === 'noteOn') cb.onNote(e.midi, e.cents);
        else cb.onNoteOff();
      }
      if (frame % LEVEL_EVERY === 0) {
        const tuned = reading.clarity >= 0.9 && reading.freq > 0 ? freqToNote(reading.freq) : null;
        cb.onLevel(reading.rms, tuned);
      }
      if (frame % CHROMA_EVERY === 0 && reading.rms > 0.01) {
        analyser.getFloatFrequencyData(freq);
        const chroma = computeChroma(dbToLinear(freq), ctx.sampleRate);
        const hit = this.chords.process(matchChord(chroma, getCandidates())[0]);
        if (hit) cb.onChord(hit);
      }
    };
    loop();
  }

  stop(): void {
    cancelAnimationFrame(this.raf);
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    void this.ctx?.close();
    this.ctx = null;
  }
}

export const micInput = new MicInput();
