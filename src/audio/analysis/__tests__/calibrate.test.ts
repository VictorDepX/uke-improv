// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { DEFAULT_CALIBRATION, calibrate, percentile, toDb } from '../calibrate';
import { PitchTracker, rms, type PitchEvent } from '../pitch';
import { SAMPLE_RATE, addNoise, framesFromStart, mix, pluck } from '@/test/signals';

const SIZE = 2048;
const HOP = 1024;

/** Ruído rosa-ish de ambiente: branco filtrado por média móvel (mais grave que o branco). */
function roomNoise(seconds: number, level: number, seed = 5): Float32Array {
  const white = addNoise(new Float32Array(Math.round(seconds * SAMPLE_RATE)), level * 3, seed);
  const out = new Float32Array(white.length);
  let acc = 0;
  for (let i = 0; i < white.length; i++) {
    acc = acc * 0.9 + white[i]! * 0.1;
    out[i] = acc;
  }
  return out;
}

const levels = (signal: Float32Array) =>
  [...framesFromStart(signal, SIZE, HOP)].map(({ frame }) => rms(frame));

const scale = (s: Float32Array, g: number) => s.map((x) => x * g);

function noteOns(signal: Float32Array, tracker: PitchTracker): number[] {
  const out: number[] = [];
  for (const { frame } of framesFromStart(signal, SIZE, HOP))
    for (const e of tracker.process(frame, SAMPLE_RATE).events as PitchEvent[])
      if (e.type === 'noteOn') out.push(e.midi);
  return out;
}

/** Uke baixinho (longe do celular): C4, E4, G4, C5 a cada 0,7 s. */
const quietPhrase = (amp: number) =>
  mix(
    3,
    [60, 64, 67, 72].map((m, i) => ({
      signal: pluck(m, { duration: 0.65, amplitude: amp }),
      at: i * 0.7,
    })),
  );

describe('calibração do microfone', () => {
  it('percentil e dB', () => {
    expect(percentile([1, 2, 3, 4, 5], 50)).toBe(3);
    expect(percentile([], 95)).toBe(0);
    expect(toDb(0.1)).toBeCloseTo(-20);
  });

  it('uke baixo: ganho sobe e o limiar fica entre o ruído e o toque', () => {
    const noise = levels(roomNoise(2, 0.0008));
    const play = levels(addNoise(quietPhrase(0.012), 0.0008));
    const { calibration, issue } = calibrate(noise, play);
    expect(issue).toBeNull();
    expect(calibration.gain).toBeGreaterThan(2);
    expect(calibration.minRms).toBeGreaterThan(calibration.noiseRms * calibration.gain);
    expect(calibration.minRms).toBeLessThan(calibration.playRms * calibration.gain);
  });

  it('com a calibração, notas que o padrão perdia passam a ser detectadas', () => {
    const phrase = addNoise(quietPhrase(0.012), 0.0008, 3);
    // Padrão de fábrica: o toque fica abaixo de 0,01 RMS e nada é detectado.
    expect(noteOns(phrase, new PitchTracker())).toEqual([]);

    const { calibration } = calibrate(levels(roomNoise(2, 0.0008)), levels(phrase));
    const tracker = new PitchTracker({ minRms: calibration.minRms });
    expect(noteOns(scale(phrase, calibration.gain), tracker)).toEqual([60, 64, 67, 72]);
  });

  it('ambiente barulhento: o limiar sobe acima do ruído', () => {
    const noise = levels(roomNoise(2, 0.02));
    const play = levels(addNoise(quietPhrase(0.3), 0.02));
    const { calibration } = calibrate(noise, play);
    expect(calibration.minRms).toBeGreaterThan(DEFAULT_CALIBRATION.minRms);
    expect(calibration.minRms).toBeGreaterThan(calibration.noiseRms * calibration.gain);
  });

  it('toque que não se destaca do ruído é recusado', () => {
    const noise = levels(roomNoise(2, 0.02));
    const play = levels(roomNoise(3, 0.021, 9));
    const r = calibrate(noise, play);
    expect(r.issue).toBe('too-noisy');
    expect(r.calibration.gain).toBe(1);
    expect(calibrate(levels(roomNoise(2, 0.0001)), levels(roomNoise(3, 0.0001, 8))).issue).toBe(
      'too-quiet',
    );
  });
});
