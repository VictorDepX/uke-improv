import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveGroove } from '@/core/grooves';

/**
 * Tone falso: guarda cada disparo com instrumento, tempo e parâmetros.
 * O loop não roda sozinho; o teste chama o callback passo a passo.
 */
interface Hit {
  inst: string;
  time: number;
  note?: unknown;
  dur?: unknown;
  vel?: unknown;
}
const hits: Hit[] = [];
let loopCb: ((time: number) => void) | null = null;
const transport = {
  bpm: { value: 0, rampTo: vi.fn() },
  position: 0,
  start: vi.fn(),
  stop: vi.fn(),
  cancel: vi.fn(),
};
const SIXTEENTH = 0.125; // 120 BPM

const synth = (inst: string) => ({
  triggerAttackRelease: (a: unknown, b: unknown, c?: unknown, d?: unknown) => {
    // NoiseSynth (caixa) não recebe nota: (duração, tempo, vel).
    if (inst === 'snare') hits.push({ inst, dur: a, time: b as number, vel: c });
    else hits.push({ inst, note: a, dur: b, time: c as number, vel: d });
  },
});

const fakeInst = {
  Tone: {
    getTransport: () => transport,
    getDraw: () => ({ schedule: (fn: () => void) => fn() }),
    Loop: class {
      constructor(cb: (t: number) => void) {
        loopCb = cb;
      }
      start() {
        return this;
      }
      dispose() {}
    },
    Time: () => ({ toSeconds: () => SIXTEENTH }),
    Frequency: (m: number) => ({ toFrequency: () => m }),
  },
  uke: synth('uke'),
  bass: synth('bass'),
  kick: synth('kick'),
  snare: synth('snare'),
  hat: synth('hat'),
  click: synth('click'),
};

vi.mock('@/audio/engine/sound', () => ({
  ensureAudio: () => Promise.resolve(fakeInst),
  strum: (
    _inst: unknown,
    midis: number[],
    time: number,
    dir: string,
    vel: number,
    muted?: boolean,
  ) =>
    hits.push({
      inst: 'strum',
      time,
      note: [...midis],
      dur: muted ? 'muted' : 'open',
      vel: { dir, vel },
    }),
}));

const { JamEngine } = await import('../engine/jam');

/** Roda `n` semicolcheias a partir do tempo 0. */
function run(n: number) {
  for (let i = 0; i < n; i++) loopCb!(i * SIXTEENTH);
}
const stepsOf = (inst: string, fromStep = 0) =>
  hits
    .filter((h) => h.inst === inst && h.time >= fromStep * SIXTEENTH - 1e-9)
    .map((h) => Math.round((h.time / SIXTEENTH - fromStep) * 100) / 100);

describe('motor da base', () => {
  beforeEach(() => {
    hits.length = 0;
    loopCb = null;
  });

  async function start(over: Partial<Parameters<InstanceType<typeof JamEngine>['start']>[0]> = {}) {
    const engine = new JamEngine();
    const chords: string[] = [];
    const positions: { bar: number; beat: number; segment: number }[] = [];
    await engine.start({
      bars: [['C'], ['F']],
      meter: '4/4',
      tuning: 'GCEA',
      bpm: 120,
      onChord: (c) => chords.push(c),
      onPosition: (p) => positions.push(p),
      ...over,
    });
    return { engine, chords, positions };
  }

  it('conta um compasso e depois toca a batida pop, acorde a acorde', async () => {
    const { chords, positions } = await start();
    run(16 * 3);
    expect(stepsOf('click')).toEqual([0, 4, 8, 12]);
    expect(stepsOf('strum', 16).slice(0, 6)).toEqual([0, 4, 6, 10, 12, 14]);
    expect(chords).toEqual(['C', 'F']);
    expect(positions[0]).toEqual({ bar: -1, beat: 0, segment: -1 });
    expect(positions[4]).toEqual({ bar: 0, beat: 0, segment: 0 });
    // Formas do uke: C = 0003, F = 2010.
    const strums = hits.filter((h) => h.inst === 'strum');
    expect(strums[0]!.note).toEqual([67, 60, 64, 72]);
    expect(strums[6]!.note).toEqual([69, 60, 65, 69]);
  });

  it('swing atrasa só as colcheias fracas, em tercina', async () => {
    await start({ groove: resolveGroove('swing', '4/4') });
    run(32);
    expect(stepsOf('hat', 16)).toEqual([0, 4, 6.66, 8, 12, 14.66]);
    expect(stepsOf('strum', 16)).toEqual([0, 4, 8, 12]);
    expect(hits.filter((h) => h.inst === 'strum').every((h) => h.dur === 'muted')).toBe(true);
  });

  it('acorde de 2 tempos troca no tempo 3, com baixo na fundamental', async () => {
    const { chords } = await start({ bars: [['C', 'G7']], groove: resolveGroove('bossa', '4/4') });
    run(32);
    expect(chords).toEqual(['C', 'G7']);
    const bass = hits.filter((h) => h.inst === 'bass');
    expect(bass.map((b) => [Math.round(b.time / SIXTEENTH) - 16, b.note])).toEqual([
      [0, 36],
      [6, 36],
      [8, 43],
      [14, 50],
    ]);
  });

  it('valsa em 3/4: contagem de 3 e tum-pá-pá', async () => {
    await start({ bars: [['D']], meter: '3/4', groove: resolveGroove('valsa', '3/4') });
    run(24);
    expect(stepsOf('click')).toEqual([0, 4, 8]);
    expect(stepsOf('bass', 12)).toEqual([0]);
    expect(stepsOf('strum', 12)).toEqual([4, 8]);
  });

  it('6/8 usa a semínima pontuada como pulso', async () => {
    await start({ bars: [['C']], meter: '6/8', bpm: 60 });
    expect(transport.bpm.value).toBe(90);
  });

  it('troca de progressão vale no próximo compasso', async () => {
    const { engine, chords } = await start({ bars: [['C']] });
    run(16 + 5);
    engine.update({ bars: [['Am']], meter: '4/4', tuning: 'GCEA' });
    for (let i = 21; i < 48; i++) loopCb!(i * SIXTEENTH);
    // Compasso 1 ainda em C (já começou); Am entra no compasso 2.
    expect(chords).toEqual(['C', 'Am']);
  });
});
