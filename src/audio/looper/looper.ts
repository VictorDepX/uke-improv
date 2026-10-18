import type * as ToneNS from 'tone';
import { METERS, type Meter } from '@/core/rhythm';
import { micInput } from '../engine/mic';
import { ensureAudio, type Instruments } from '../engine/sound';
import {
  barSeconds,
  defaultLatency,
  fadeEdges,
  loopSeconds,
  nextBoundary,
  sliceCapture,
  waveform,
  type CaptureChunk,
} from './timing';

export type LooperStatus = 'idle' | 'count' | 'recording' | 'playing';

export interface LooperLayerView {
  id: string;
  peaks: number[];
  volume: number;
  muted: boolean;
}

export interface LooperView {
  status: LooperStatus;
  /** Gravando por cima de um loop que já toca. */
  overdub: boolean;
  layers: LooperLayerView[];
  /** Tempo atual do compasso (−1 parado) e compasso dentro do ciclo. */
  beat: number;
  bar: number;
  /** Tempos que faltam na contagem. */
  countLeft: number;
  /** Latência usada para alinhar a gravação, em segundos. */
  latency: number;
}

export interface LooperConfig {
  bpm: number;
  meter: Meter;
  bars: number;
  metronome: boolean;
  /** Ajuste fino (s) somado à latência estimada. */
  latencyOffset: number;
}

export const MAX_LAYERS = 4;
const PEAKS = 96;

/**
 * Captura o microfone no mesmo AudioContext do Tone, bloco a bloco, com o instante exato
 * de cada bloco (`currentTime` do worklet). Assim o loop é cortado no compasso certo.
 */
const CAPTURE_WORKLET = `
class UkeCapture extends AudioWorkletProcessor {
  constructor() {
    super();
    this.on = true;
    this.buf = new Float32Array(1024);
    this.n = 0;
    this.t = 0;
    this.port.onmessage = (e) => { if (e.data === 'stop') this.on = false; };
  }
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (!this.on) return false;
    if (!ch) return true;
    if (this.n === 0) this.t = currentTime;
    this.buf.set(ch, this.n);
    this.n += ch.length;
    if (this.n >= this.buf.length) {
      this.port.postMessage({ t: this.t, data: this.buf.slice(0, this.n) });
      this.n = 0;
    }
    return true;
  }
}
registerProcessor('uke-capture', UkeCapture);
`;

interface Layer {
  id: string;
  samples: Float32Array;
  buffer: ToneNS.ToneAudioBuffer;
  player: ToneNS.Player;
  gain: ToneNS.Gain;
  volume: number;
  muted: boolean;
  peaks: number[];
}

type Listener = (v: LooperView) => void;

export class Looper {
  private inst: Instruments | null = null;
  private layers: Layer[] = [];
  private status: LooperStatus = 'idle';
  private overdub = false;
  private config: LooperConfig = {
    bpm: 90,
    meter: '4/4',
    bars: 4,
    metronome: true,
    latencyOffset: 0,
  };
  /** Instante (tempo do contexto) do começo do primeiro ciclo. */
  private origin = 0;
  private loopLen = 0;
  private beat = -1;
  private bar = 0;
  private countLeft = 0;
  private clickId: number | null = null;
  private listeners = new Set<Listener>();
  private workletReady: Promise<void> | null = null;
  private ownStream: MediaStream | null = null;
  private timers: number[] = [];
  private counter = 0;

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    fn(this.view());
    return () => this.listeners.delete(fn);
  }

  configure(patch: Partial<LooperConfig>): void {
    // Tempo e tamanho só mudam com o looper vazio (o loop gravado tem duração fixa).
    const locked = this.layers.length > 0 || this.status !== 'idle';
    const next = { ...this.config };
    if (patch.metronome !== undefined) next.metronome = patch.metronome;
    if (patch.latencyOffset !== undefined) next.latencyOffset = patch.latencyOffset;
    if (!locked) {
      if (patch.bpm !== undefined) next.bpm = patch.bpm;
      if (patch.meter !== undefined) next.meter = patch.meter;
      if (patch.bars !== undefined) next.bars = patch.bars;
    }
    this.config = next;
    this.emit();
  }

  /** O looper está ocupando o Transport (contando, gravando ou tocando). */
  get active(): boolean {
    return this.status !== 'idle';
  }

  get latency(): number {
    const raw = this.inst?.Tone.getContext().rawContext as AudioContext | undefined;
    return Math.max(
      0,
      defaultLatency(raw?.outputLatency, raw?.baseLatency) + this.config.latencyOffset,
    );
  }

  view(): LooperView {
    return {
      status: this.status,
      overdub: this.overdub,
      layers: this.layers.map((l) => ({
        id: l.id,
        peaks: l.peaks,
        volume: l.volume,
        muted: l.muted,
      })),
      beat: this.beat,
      bar: this.bar,
      countLeft: this.countLeft,
      latency: this.latency,
    };
  }

  private emit(): void {
    const v = this.view();
    this.listeners.forEach((fn) => fn(v));
  }

  private async ready(): Promise<Instruments> {
    this.inst ??= await ensureAudio();
    const ctx = this.inst.Tone.getContext();
    this.workletReady ??= (async () => {
      const url = URL.createObjectURL(
        new Blob([CAPTURE_WORKLET], { type: 'application/javascript' }),
      );
      await ctx.addAudioWorkletModule(url);
      URL.revokeObjectURL(url);
    })();
    await this.workletReady;
    return this.inst;
  }

  private async micStream(): Promise<MediaStream> {
    if (micInput.mediaStream) return micInput.mediaStream;
    this.ownStream ??= await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });
    return this.ownStream;
  }

  /** Metrônomo e posição na tela, pelo Transport. */
  private startClock(inst: Instruments): void {
    const { Tone } = inst;
    const transport = Tone.getTransport();
    const { beats, accents } = METERS[this.config.meter];
    const beatSec = barSeconds(this.config.bpm, this.config.meter) / beats;
    let n = 0;
    this.clickId = transport.scheduleRepeat(
      (time) => {
        const beat = n % beats;
        const barAbs = Math.floor(n / beats);
        n += 1;
        const counting = barAbs === 0 && this.layers.length === 0;
        if (this.config.metronome || counting)
          inst.click.triggerAttackRelease(
            accents.includes(beat) ? 'C6' : 'G5',
            '32n',
            time,
            counting ? 0.6 : 0.35,
          );
        Tone.getDraw().schedule(() => {
          this.beat = beat;
          this.bar = counting ? -1 : (barAbs - 1) % this.config.bars;
          this.countLeft = counting ? beats - beat : 0;
          this.emit();
        }, time);
      },
      beatSec,
      0,
    );
  }

  /** Grava uma camada. Vazio: contagem de 1 compasso e grava. Tocando: grava no próximo ciclo. */
  async record(): Promise<void> {
    if (this.status === 'count' || this.status === 'recording') return;
    if (this.layers.length >= MAX_LAYERS) return;
    const inst = await this.ready();
    const { Tone } = inst;
    const ctx = Tone.getContext();
    const stream = await this.micStream();

    const first = this.layers.length === 0;
    const bar = barSeconds(this.config.bpm, this.config.meter);
    if (first) {
      this.loopLen = loopSeconds(this.config.bpm, this.config.meter, this.config.bars);
      const transport = Tone.getTransport();
      transport.stop();
      transport.cancel();
      transport.bpm.value = this.config.bpm * METERS[this.config.meter].bpmFactor;
      transport.position = 0;
      const start = Tone.now() + 0.1;
      this.origin = start + bar; // depois da contagem
      this.startClock(inst);
      transport.start(start);
    }
    const recStart = first
      ? this.origin
      : nextBoundary(Tone.now() + 0.05, this.origin, this.loopLen);
    const recEnd = recStart + this.loopLen;

    const source = ctx.createMediaStreamSource(stream);
    const node = ctx.createAudioWorkletNode('uke-capture', {
      numberOfInputs: 1,
      numberOfOutputs: 1,
    });
    // O worklet precisa estar ligado à saída para rodar; ganho zero evita microfonia.
    const sink = ctx.createGain();
    sink.gain.value = 0;
    source.connect(node);
    node.connect(sink);
    sink.connect(ctx.rawContext.destination as AudioNode);
    const chunks: CaptureChunk[] = [];
    node.port.onmessage = (e: MessageEvent<CaptureChunk>) => chunks.push(e.data);

    // Por cima: o loop segue tocando até o próximo ciclo, quando a gravação começa.
    this.status = first ? 'count' : 'playing';
    this.overdub = !first;
    this.emit();
    const wait = (at: number, fn: () => void) => {
      const id = window.setTimeout(fn, Math.max(0, (at - Tone.now()) * 1000));
      this.timers.push(id);
    };
    wait(recStart, () => {
      this.status = 'recording';
      this.bar = 0;
      this.emit();
    });

    await new Promise<void>((resolve) => wait(recEnd + this.latency + 0.15, resolve));
    node.port.postMessage('stop');
    source.disconnect();
    node.disconnect();
    sink.disconnect();
    // Limpo no meio da gravação (o status muda fora deste fluxo).
    if ((this.status as LooperStatus) === 'idle') return;

    const sr = ctx.sampleRate;
    const samples = fadeEdges(sliceCapture(chunks, sr, recStart + this.latency, this.loopLen), sr);
    this.addLayer(inst, samples);
    this.status = 'playing';
    this.overdub = false;
    this.emit();
  }

  private addLayer(inst: Instruments, samples: Float32Array): void {
    const { Tone } = inst;
    const ctx = Tone.getContext();
    const raw = ctx.createBuffer(1, samples.length, ctx.sampleRate);
    raw.copyToChannel(samples as Float32Array<ArrayBuffer>, 0);
    const buffer = new Tone.ToneAudioBuffer(raw);
    const gain = new Tone.Gain(1).toDestination();
    const player = new Tone.Player(buffer).connect(gain);
    player.loop = true;
    // Entra já no ponto certo do ciclo atual: o loop do buffer cuida do resto, no mesmo relógio.
    const when = Tone.now() + 0.05;
    const offset = (((when - this.origin) % this.loopLen) + this.loopLen) % this.loopLen;
    player.start(when, offset);
    this.counter += 1;
    this.layers.push({
      id: `layer-${this.counter}`,
      samples,
      buffer,
      player,
      gain,
      volume: 1,
      muted: false,
      peaks: waveform(samples, PEAKS),
    });
  }

  setLayer(id: string, patch: { volume?: number; muted?: boolean }): void {
    const l = this.layers.find((x) => x.id === id);
    if (!l) return;
    if (patch.volume !== undefined) l.volume = patch.volume;
    if (patch.muted !== undefined) l.muted = patch.muted;
    l.gain.gain.rampTo(l.muted ? 0 : l.volume, 0.05);
    this.emit();
  }

  removeLayer(id: string): void {
    const l = this.layers.find((x) => x.id === id);
    if (!l) return;
    l.player.stop();
    l.player.dispose();
    l.gain.dispose();
    l.buffer.dispose();
    this.layers = this.layers.filter((x) => x !== l);
    if (this.layers.length === 0) this.clear();
    else this.emit();
  }

  /** Para tudo e apaga as camadas. */
  clear(): void {
    this.timers.forEach((t) => window.clearTimeout(t));
    this.timers = [];
    for (const l of this.layers) {
      l.player.stop();
      l.player.dispose();
      l.gain.dispose();
      l.buffer.dispose();
    }
    this.layers = [];
    if (this.inst) {
      const transport = this.inst.Tone.getTransport();
      if (this.clickId !== null) transport.clear(this.clickId);
      transport.stop();
      transport.cancel();
    }
    this.clickId = null;
    this.ownStream?.getTracks().forEach((t) => t.stop());
    this.ownStream = null;
    this.status = 'idle';
    this.overdub = false;
    this.beat = -1;
    this.bar = 0;
    this.countLeft = 0;
    this.emit();
  }

  /** Amostras de uma camada (para testes e para exportar). */
  layerSamples(id: string): Float32Array | undefined {
    return this.layers.find((l) => l.id === id)?.samples;
  }

  get loopDuration(): number {
    return this.loopLen;
  }
}

export const looper = new Looper();
