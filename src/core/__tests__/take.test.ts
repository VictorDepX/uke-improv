import { describe, expect, it } from 'vitest';
import { noteIndexAt, summarizeTake, takeAdvice, takeNote } from '../take';
import { pickMimeType } from '@/audio/engine/recorder';
import { makeT } from '@/i18n/lang';

const pt = makeT('pt');

const C = { tonic: 'C', scale: 'major' } as const;
const take = (pairs: [number, number, string][]) =>
  pairs.map(([t, m, ch]) => takeNote(t, m, C, ch));

describe('gravação do improviso', () => {
  it('classifica cada nota pelo acorde daquele momento', () => {
    const notes = take([
      [0.1, 64, 'C'], // E sobre C: repouso
      [0.6, 65, 'G7'], // F sobre G7: tensão (7ª)
      [1.1, 64, 'C'], // E: resolveu
      [1.6, 61, 'C'], // C#: fora
    ]);
    expect(notes.map((n) => n.cls)).toEqual(['repouso', 'tensao', 'repouso', 'fora']);
  });

  it('acha a nota de cada instante', () => {
    const notes = take([
      [0.5, 60, 'C'],
      [1, 62, 'C'],
      [2, 64, 'C'],
    ]);
    expect(noteIndexAt(notes, 0.2)).toBe(-1);
    expect(noteIndexAt(notes, 0.5)).toBe(0);
    expect(noteIndexAt(notes, 1.9)).toBe(1);
    expect(noteIndexAt(notes, 99)).toBe(2);
    expect(noteIndexAt([], 1)).toBe(-1);
  });

  it('resume: notas do acorde, na escala, tensões resolvidas e fora seguidas', () => {
    const s = summarizeTake(
      take([
        [0, 64, 'C'],
        [0.5, 65, 'G7'],
        [1, 64, 'C'],
        [1.5, 71, 'C'], // B: tensão (sensível) sem resolver
        [2, 61, 'C'],
        [2.5, 63, 'C'],
        [3, 60, 'C'],
      ]),
    );
    expect(s).toMatchObject({ total: 7, tensions: 2, resolved: 1, longestOut: 2 });
    expect(s.chordTones).toBeCloseTo(3 / 7);
    expect(s.inScale).toBeCloseTo(5 / 7);
    expect(pt(takeAdvice(s))).toMatch(/fora da escala/);
  });

  it('o conselho aponta o ponto mais útil', () => {
    expect(pt(takeAdvice(summarizeTake([])))).toMatch(/Nenhuma nota/);
    const unresolved = summarizeTake(
      take([
        [0, 71, 'C'],
        [0.5, 69, 'C'],
        [1, 71, 'C'],
        [1.5, 67, 'C'],
      ]),
    );
    expect(pt(takeAdvice(unresolved))).toMatch(/tensões ficou sem resolver/);
    const good = summarizeTake(
      take([
        [0, 71, 'C'],
        [0.5, 72, 'C'],
        [1, 64, 'C'],
        [1.5, 67, 'C'],
      ]),
    );
    expect(pt(takeAdvice(good))).toMatch(/dentro do tom/);
  });

  it('escolhe o formato de gravação suportado', () => {
    expect(pickMimeType((t) => t === 'audio/mp4')).toBe('audio/mp4');
    expect(pickMimeType((t) => t.startsWith('audio/webm'))).toBe('audio/webm;codecs=opus');
    expect(pickMimeType(() => false)).toBeUndefined();
  });
});
