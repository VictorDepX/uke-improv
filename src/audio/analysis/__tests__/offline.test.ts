// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { analyzeRecording, toMono } from '../offline';
import { shapesFor, shapeToMidis } from '@/core/chordShapes';
import { diatonicChords } from '@/core/harmony';
import { mix, pluck, SAMPLE_RATE, strum } from '@/test/signals';

const C_MAJOR = diatonicChords({ tonic: 'C', scale: 'major' }).map((d) => d.symbol);

describe('analyzeRecording', () => {
  it('encontra a sequência de acordes de uma gravação sintetizada (C – G – Am – F)', () => {
    const progression = ['C', 'G', 'Am', 'F'];
    const parts = progression.flatMap((symbol, i) =>
      strum(shapeToMidis(shapesFor(symbol)[0]!), 1, i, i + 1),
    );
    const events = analyzeRecording(mix(4, parts), SAMPLE_RATE, C_MAJOR);
    expect(events.filter((e) => e.kind === 'chord').map((e) => e.symbol)).toEqual(progression);
  });

  it('encontra as notas de uma frase dedilhada', () => {
    const melody = [67, 69, 72, 71];
    const signal = mix(
      2,
      melody.map((m, i) => ({
        signal: pluck(m, { duration: 0.5, decay: 0.25, seed: i }),
        at: i * 0.5,
      })),
    );
    const notes = analyzeRecording(signal, SAMPLE_RATE, C_MAJOR)
      .filter((e) => e.kind === 'note')
      .map((e) => e.midi);
    expect(notes).toEqual(melody);
  });

  it('mistura estéreo em mono', () => {
    const l = new Float32Array([1, 1]);
    const r = new Float32Array([0, -1]);
    const mono = toMono({
      numberOfChannels: 2,
      length: 2,
      getChannelData: (i) => (i === 0 ? l : r),
    });
    expect(Array.from(mono)).toEqual([0.5, 0]);
  });
});
