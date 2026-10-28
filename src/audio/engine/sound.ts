import type * as ToneNS from 'tone';
import type { Layer } from '@/store/useMusicStore';

type ToneModule = typeof ToneNS;

export interface Instruments {
  Tone: ToneModule;
  uke: ToneNS.PolySynth;
  bass: ToneNS.MonoSynth;
  kick: ToneNS.MembraneSynth;
  snare: ToneNS.NoiseSynth;
  hat: ToneNS.MetalSynth;
  click: ToneNS.Synth;
  buses: Record<Layer, ToneNS.Volume>;
}

let instruments: Promise<Instruments> | null = null;
let toneModule: ToneModule | null = null;
const loadTone = () =>
  import('tone').then((m) => {
    toneModule = m;
    return m;
  });

/** Baixa o Tone.js em segundo plano, para que o primeiro toque já consiga ligar o áudio. */
export function preloadAudio(): void {
  void loadTone();
}

/**
 * Baixa o Tone.js sem atrasar a abertura: quando o navegador fica ocioso depois de carregar
 * a página, ou no primeiro toque/tecla, o que vier antes. Assim o play ainda liga o áudio
 * dentro do gesto (iOS exige) e a primeira tela não espera 330 KB de áudio.
 */
export function preloadAudioWhenIdle(): () => void {
  let done = false;
  const run = () => {
    if (done) return;
    done = true;
    cleanup();
    preloadAudio();
  };
  const idle = window.requestIdleCallback
    ? window.requestIdleCallback(run, { timeout: 4000 })
    : window.setTimeout(run, 2000);
  const events = ['pointerdown', 'keydown'] as const;
  events.forEach((e) => window.addEventListener(e, run, { once: true, passive: true }));
  function cleanup() {
    if (window.cancelIdleCallback) window.cancelIdleCallback(idle);
    else window.clearTimeout(idle);
    events.forEach((e) => window.removeEventListener(e, run));
  }
  return cleanup;
}

/**
 * Liga o áudio e cria os instrumentos (uma vez). Precisa ser chamado dentro de um gesto
 * do usuário: com o Tone.js pré-carregado, `Tone.start()` roda de forma síncrona no toque,
 * como exigem iOS e Chrome.
 */
export function ensureAudio(): Promise<Instruments> {
  instruments ??= (async () => {
    const Tone = toneModule ?? (await loadTone());
    await Tone.start();
    Tone.getContext().lookAhead = 0.05;

    const buses: Record<Layer, ToneNS.Volume> = {
      chords: new Tone.Volume(-6).toDestination(),
      bass: new Tone.Volume(-8).toDestination(),
      drums: new Tone.Volume(-10).toDestination(),
    };

    // Timbre de uke sintetizado: triângulo com ataque curto, passa-baixa para tirar o "chiado".
    const ukeFilter = new Tone.Filter({ frequency: 2800, type: 'lowpass', rolloff: -12 }).connect(
      buses.chords,
    );
    const uke = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'fattriangle', count: 2, spread: 12 },
      envelope: { attack: 0.003, decay: 0.9, sustain: 0.05, release: 0.6 },
    }).connect(ukeFilter);
    uke.maxPolyphony = 16;

    const bass = new Tone.MonoSynth({
      oscillator: { type: 'triangle' },
      filter: { Q: 1, type: 'lowpass', rolloff: -24 },
      envelope: { attack: 0.01, decay: 0.3, sustain: 0.4, release: 0.4 },
      filterEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.3, baseFrequency: 180, octaves: 2.5 },
    }).connect(buses.bass);

    const kick = new Tone.MembraneSynth({ pitchDecay: 0.03, octaves: 6 }).connect(buses.drums);
    const snare = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.13, sustain: 0 },
    }).connect(new Tone.Filter(1800, 'highpass').connect(buses.drums));
    const hat = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.05, release: 0.01 },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5,
    }).connect(buses.drums);
    hat.volume.value = -18;
    const click = new Tone.Synth({
      oscillator: { type: 'square' },
      envelope: { attack: 0.001, decay: 0.04, sustain: 0, release: 0.01 },
    }).connect(buses.drums);

    return { Tone, uke, bass, kick, snare, hat, click, buses };
  })();
  instruments.catch(() => {
    instruments = null;
  });
  return instruments;
}

export async function playNote(midi: number): Promise<void> {
  const { Tone, uke } = await ensureAudio();
  uke.triggerAttackRelease(Tone.Frequency(midi, 'midi').toFrequency(), '4n', undefined, 0.8);
}

/** Toca as cordas em sequência, como uma batida (para baixo: 4ª → 1ª). */
export function strum(
  inst: Instruments,
  midis: readonly number[],
  time: number,
  direction: 'down' | 'up' = 'down',
  velocity = 0.7,
  /** Abafado: notas curtas e cordas quase juntas (chop do reggae). */
  muted = false,
): void {
  const order = direction === 'down' ? midis : [...midis].reverse();
  order.forEach((m, i) => {
    inst.uke.triggerAttackRelease(
      inst.Tone.Frequency(m, 'midi').toFrequency(),
      muted ? '32n' : '8n',
      time + i * (muted ? 0.006 : 0.014),
      velocity,
    );
  });
}

export async function playChord(midis: readonly number[]): Promise<void> {
  const inst = await ensureAudio();
  strum(inst, midis, inst.Tone.now(), 'down', 0.8);
}

export function setLayerVolume(inst: Instruments, layer: Layer, value: number): void {
  inst.buses[layer].mute = value <= 0;
  inst.buses[layer].volume.rampTo(value > 0 ? inst.Tone.gainToDb(value) - 4 : -Infinity, 0.05);
}

/** Toca uma sequência de notas/acordes a partir de agora (treino de ouvido). */
export async function playSequence(
  events: readonly { midis: readonly number[]; at: number; dur: number; strum?: boolean }[],
): Promise<void> {
  const inst = await ensureAudio();
  const start = inst.Tone.now() + 0.05;
  for (const e of events) {
    if (e.strum) {
      strum(inst, e.midis, start + e.at, 'down', 0.75);
      continue;
    }
    for (const m of e.midis)
      inst.uke.triggerAttackRelease(
        inst.Tone.Frequency(m, 'midi').toFrequency(),
        e.dur,
        start + e.at,
        0.8,
      );
  }
}
