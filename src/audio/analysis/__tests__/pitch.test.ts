// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { PitchTracker, freqToNote, type PitchEvent } from '../pitch';
import { addNoise, framesFromStart, karplusStrong, mix, pluck, SAMPLE_RATE } from '@/test/signals';

const SIZE = 2048;
const HOP = 1024;

function track(signal: Float32Array, tracker = new PitchTracker()) {
  const events: (PitchEvent & { time: number })[] = [];
  for (const { frame, time } of framesFromStart(signal, SIZE, HOP)) {
    for (const e of tracker.process(frame, SAMPLE_RATE).events) events.push({ ...e, time });
  }
  return events;
}

type Timed = PitchEvent & { time: number };
const noteOns = (events: Timed[]) =>
  events.filter(
    (e): e is Extract<PitchEvent, { type: 'noteOn' }> & { time: number } => e.type === 'noteOn',
  );

describe('freqToNote', () => {
  it('converte Hz em MIDI e cents', () => {
    expect(freqToNote(440)).toEqual({ midi: 69, cents: 0 });
    expect(freqToNote(261.63).midi).toBe(60);
    expect(freqToNote(440 * 2 ** (20 / 1200)).cents).toBe(20);
  });
});

describe('PitchTracker com notas sintetizadas', () => {
  // Toda a extensão do uke em GCEA: C4 (60) a C6 (84).
  const allNotes = Array.from({ length: 25 }, (_, i) => 60 + i);

  it('reconhece cada nota do braço (meta do doc: 9 em 10)', () => {
    let correct = 0;
    for (const midi of allNotes) {
      const first = noteOns(track(pluck(midi, { duration: 0.6 })))[0];
      if (first?.midi === midi) correct++;
    }
    expect(correct / allNotes.length).toBeGreaterThanOrEqual(0.9);
  });

  it('também funciona com o timbre Karplus-Strong', () => {
    const sample = [60, 64, 67, 69, 72, 76, 79];
    let correct = 0;
    for (const midi of sample)
      if (noteOns(track(karplusStrong(midi, 0.6)))[0]?.midi === midi) correct++;
    expect(correct / sample.length).toBeGreaterThanOrEqual(0.9);
  });

  it('suporta ruído de fundo moderado', () => {
    const noisy = addNoise(pluck(67, { duration: 0.6 }), 0.01);
    expect(noteOns(track(noisy))[0]?.midi).toBe(67);
  });

  it('mede o desvio em cents (base para o afinador)', () => {
    const [on] = noteOns(track(pluck(69, { duration: 0.6, detuneCents: 25 })));
    expect(on?.midi).toBe(69);
    expect(Math.abs(on!.cents - 25)).toBeLessThanOrEqual(5);
  });

  it('confirma a nota em menos de 150 ms', () => {
    const [on] = noteOns(track(pluck(64, { duration: 0.6 })));
    expect(on!.time).toBeLessThan(0.15);
  });

  it('detecta a mesma nota tocada duas vezes (novo ataque)', () => {
    const signal = mix(1.2, [
      { signal: pluck(67, { duration: 0.6, seed: 1 }), at: 0 },
      { signal: pluck(67, { duration: 0.6, seed: 2 }), at: 0.6 },
    ]);
    expect(noteOns(track(signal)).map((e) => e.midi)).toEqual([67, 67]);
  });

  it('acompanha uma melodia de 4 notas', () => {
    const melody = [60, 64, 67, 72];
    const signal = mix(
      2,
      melody.map((m, i) => ({
        signal: pluck(m, { duration: 0.5, decay: 0.3, seed: i }),
        at: i * 0.5,
      })),
    );
    expect(noteOns(track(signal)).map((e) => e.midi)).toEqual(melody);
  });

  it('solta a nota no silêncio e ignora silêncio puro', () => {
    const signal = mix(1.5, [{ signal: pluck(69, { duration: 0.5, decay: 0.1 }), at: 0 }]);
    const events = track(signal);
    expect(events.at(-1)?.type).toBe('noteOff');
    expect(track(new Float32Array(SAMPLE_RATE))).toEqual([]);
  });
});
