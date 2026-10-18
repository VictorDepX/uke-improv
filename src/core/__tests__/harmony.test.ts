import { describe, expect, it } from 'vitest';
import {
  chordToNumeral,
  diatonicChords,
  numeralToChord,
  parseNumeral,
  sameChord,
  toAbsoluteNumeral,
} from '../harmony';
import { PROGRESSIONS, progressionChords } from '../progressions';
import { parseBar } from '../rhythm';

describe('campo harmônico', () => {
  it('gera o campo de C maior', () => {
    expect(diatonicChords({ tonic: 'C', scale: 'major' }).map((d) => d.symbol)).toEqual([
      'C',
      'Dm',
      'Em',
      'F',
      'G',
      'G7',
      'Am',
      'Bdim',
    ]);
  });

  it('usa bemóis em tons de bemol', () => {
    const symbols = diatonicChords({ tonic: 'F', scale: 'major' }).map((d) => d.symbol);
    expect(symbols).toContain('Bb');
  });

  it('inclui o V harmônico no menor', () => {
    const symbols = diatonicChords({ tonic: 'A', scale: 'minor' }).map((d) => d.symbol);
    expect(symbols).toEqual(expect.arrayContaining(['Am', 'Dm', 'E', 'E7', 'F', 'G']));
  });

  it('pentatônica usa o campo do tom pai', () => {
    const pent = diatonicChords({ tonic: 'A', scale: 'minorPentatonic' }).map((d) => d.symbol);
    const minor = diatonicChords({ tonic: 'A', scale: 'minor' }).map((d) => d.symbol);
    expect(pent).toEqual(minor);
  });
});

describe('numerais', () => {
  it('interpreta qualidade pelo caso e pelos sufixos', () => {
    expect(parseNumeral('vi')).toEqual({ semis: 9, quality: 'm' });
    expect(parseNumeral('bVII')).toEqual({ semis: 10, quality: '' });
    expect(parseNumeral('V7')).toEqual({ semis: 7, quality: '7' });
    expect(parseNumeral('vii°')).toEqual({ semis: 11, quality: 'dim' });
  });

  it('transpõe para qualquer tom', () => {
    expect(numeralToChord('IV', { tonic: 'G', scale: 'major' })).toBe('C');
    expect(numeralToChord('bVI', { tonic: 'A', scale: 'minor' })).toBe('F');
  });

  it('ida e volta de numeral absoluto preserva o acorde', () => {
    const key = { tonic: 'A', scale: 'minor' as const };
    for (const d of diatonicChords(key)) {
      const back = numeralToChord(toAbsoluteNumeral(d.symbol, key), key);
      expect(sameChord(back, d.symbol)).toBe(true);
    }
  });

  it('exibe numeral diatônico quando existe', () => {
    expect(chordToNumeral('F', { tonic: 'A', scale: 'minor' })).toBe('VI');
    expect(chordToNumeral('Bb', { tonic: 'C', scale: 'major' })).toBe('bVII');
  });

  it('todas as progressões da biblioteca geram acordes válidos', () => {
    for (const p of PROGRESSIONS) {
      const chords = progressionChords(p, {
        tonic: 'D',
        scale: p.mode === 'major' ? 'major' : 'minor',
      });
      expect(chords).toHaveLength(p.numerals.flatMap(parseBar).length);
      for (const c of chords) expect(c).toMatch(/^[A-G][#b]?/);
    }
    expect(progressionChords(PROGRESSIONS[0]!, { tonic: 'C', scale: 'major' })).toEqual([
      'C',
      'G',
      'Am',
      'F',
    ]);
  });

  it('sameChord ignora grafia enarmônica', () => {
    expect(sameChord('C#m', 'Dbm')).toBe(true);
    expect(sameChord('C', 'Cm')).toBe(false);
  });
});

describe('numeral explícito', () => {
  const C = { tonic: 'C', scale: 'major' } as const;
  it('qualidades fora da grafia romana voltam iguais', () => {
    for (const s of ['Bm7b5', 'Gsus4', 'F6', 'Am6', 'G7sus4', 'Caug', 'Ebmaj7', 'Dm7', 'Bdim7']) {
      const n = toAbsoluteNumeral(s, C);
      expect(sameChord(numeralToChord(n, C), s)).toBe(true);
    }
    expect(toAbsoluteNumeral('Bm7b5', C)).toBe('VII:m7b5');
    expect(toAbsoluteNumeral('Dm7', C)).toBe('ii7');
    // Transpõe junto com o tom.
    expect(numeralToChord('VII:m7b5', { tonic: 'F', scale: 'major' })).toBe('Em7b5');
  });
});
