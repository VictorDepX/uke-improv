// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { ChordTracker, computeChroma, dbToLinear, matchChord } from '../chroma';
import { magnitudeSpectrum } from '../fft';
import { shapesFor, shapeToMidis } from '@/core/chordShapes';
import { diatonicChords } from '@/core/harmony';
import { chromaOf } from '@/core/music';
import { addNoise, framesFromStart, mix, pluck, SAMPLE_RATE, strum } from '@/test/signals';

const FFT = 8192;
const HOP = 2048;

function strummed(symbol: string, duration = 1, seed = 1): Float32Array {
  const midis = shapeToMidis(shapesFor(symbol)[0]!);
  return mix(duration, strum(midis, duration, 0, seed));
}

function chromaAt(signal: Float32Array, at: number): number[] {
  const start = Math.round(at * SAMPLE_RATE);
  return computeChroma(magnitudeSpectrum(signal.subarray(start, start + FFT)), SAMPLE_RATE);
}

const C_MAJOR = diatonicChords({ tonic: 'C', scale: 'major' }).map((d) => d.symbol);

describe('computeChroma', () => {
  it('uma nota isolada concentra energia na sua classe de pitch', () => {
    const chroma = chromaAt(pluck(69, { duration: 0.5 }), 0.05);
    const top = chroma.indexOf(Math.max(...chroma));
    expect(top).toBe(chromaOf('A'));
  });

  it('dbToLinear trata -Infinity como silêncio', () => {
    expect(Array.from(dbToLinear(new Float32Array([0, -20, -Infinity])))).toEqual(
      [1, 0.10000000149011612, 0].map((v) => Math.fround(v)),
    );
  });
});

describe('matchChord com batidas sintetizadas', () => {
  it.each(['C', 'F', 'G', 'Am', 'Dm', 'Em', 'G7'])('reconhece %s no campo de C maior', (symbol) => {
    const [best] = matchChord(chromaAt(strummed(symbol), 0.08), C_MAJOR);
    expect(best!.symbol).toBe(symbol);
    expect(best!.score).toBeGreaterThan(0.75);
  });

  it('reconhece acordes em lá menor, incluindo o E7 harmônico', () => {
    const candidates = diatonicChords({ tonic: 'A', scale: 'minor' }).map((d) => d.symbol);
    for (const symbol of ['Am', 'Dm', 'E7', 'F', 'G']) {
      expect(matchChord(chromaAt(strummed(symbol), 0.08), candidates)[0]!.symbol).toBe(symbol);
    }
  });

  it('continua certo com ruído', () => {
    const noisy = addNoise(strummed('F'), 0.01);
    expect(matchChord(chromaAt(noisy, 0.08), C_MAJOR)[0]!.symbol).toBe('F');
  });
});

describe('ChordTracker', () => {
  function timeToDetect(symbol: string): number | null {
    const tracker = new ChordTracker();
    const signal = strummed(symbol, 1);
    for (const { frame, time } of framesFromStart(signal, FFT, HOP)) {
      const best = matchChord(computeChroma(magnitudeSpectrum(frame), SAMPLE_RATE), C_MAJOR)[0];
      const hit = tracker.process(best);
      if (hit) return hit.symbol === symbol ? time : null;
    }
    return null;
  }

  it.each(['C', 'F', 'G', 'Am'])('confirma %s em até 300 ms (meta do doc)', (symbol) => {
    const t = timeToDetect(symbol);
    expect(t).not.toBeNull();
    expect(t!).toBeLessThanOrEqual(0.3);
  });

  it('exige leituras estáveis e similaridade mínima', () => {
    const tracker = new ChordTracker({ stableReads: 3, minScore: 0.75 });
    expect(tracker.process({ symbol: 'C', score: 0.9 })).toBeNull();
    expect(tracker.process({ symbol: 'C', score: 0.9 })).toBeNull();
    expect(tracker.process({ symbol: 'C', score: 0.9 })).toEqual({ symbol: 'C', score: 0.9 });
    expect(tracker.process({ symbol: 'C', score: 0.9 })).toBeNull(); // já confirmado
    expect(tracker.process({ symbol: 'G', score: 0.5 })).toBeNull(); // abaixo do mínimo
  });
});
