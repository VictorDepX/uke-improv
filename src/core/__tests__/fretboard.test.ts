import { describe, expect, it } from 'vitest';
import { canonicalEntries, generateShapes, isValidShape, shapesFor } from '../chordShapes';
import { FRET_COUNT, fretPositions, midiRange, nearestPosition } from '../fretboard';
import { chromaName } from '../music';

describe('braço', () => {
  it('tem 4 cordas × 16 posições (solta + 15 casas)', () => {
    expect(fretPositions('GCEA')).toHaveLength(4 * (FRET_COUNT + 1));
  });

  it('afinação reentrante: G4 é mais aguda que C4', () => {
    const open = fretPositions('GCEA')
      .filter((p) => p.fret === 0)
      .map((p) => p.midi);
    expect(open).toEqual([67, 60, 64, 69]);
    expect(midiRange('GCEA')).toEqual({ min: 60, max: 84 });
  });

  it('escolhe a posição mais próxima da última casa tocada', () => {
    expect(nearestPosition(69, 'GCEA', 0)).toMatchObject({ string: 3, fret: 0 });
    expect(nearestPosition(69, 'GCEA', 9)).toMatchObject({ string: 1, fret: 9 });
  });
});

describe('formas de acorde', () => {
  it('todas as formas consagradas são válidas', () => {
    for (const [key, shape] of canonicalEntries()) {
      const [root, quality] = key.split(':');
      const symbol = chromaName(Number(root)) + quality;
      expect(isValidShape(shape, symbol), `${symbol} ${shape.join('')}`).toBe(true);
    }
  });

  it('a forma principal de C, G7 e Am é a consagrada', () => {
    expect(shapesFor('C')[0]).toEqual([0, 0, 0, 3]);
    expect(shapesFor('G7')[0]).toEqual([0, 2, 1, 2]);
    expect(shapesFor('Am')[0]).toEqual([2, 0, 0, 0]);
  });

  it('o gerador encontra formas válidas para acordes sem forma cadastrada', () => {
    for (const symbol of ['F#dim', 'Cmaj7', 'Bbm7', 'Ebdim']) {
      const shapes = generateShapes(symbol);
      expect(shapes.length).toBeGreaterThan(0);
      for (const s of shapes) expect(isValidShape(s, symbol)).toBe(true);
    }
  });

  it('o gerador também funciona com G grave', () => {
    const [shape] = shapesFor('C', 'GCEA-lowG');
    expect(shape && isValidShape(shape, 'C', 'GCEA-lowG')).toBe(true);
  });
});
