import { describe, expect, it } from 'vitest';
import { buildNoteContext } from '../classify';
import { midiRange } from '../fretboard';
import { chromaOf, midiName } from '../music';
import { proximityValue, suggestNextNotes, tendencyOf } from '../suggestNotes';

const range = midiRange('GCEA');
const C_MAJOR = { tonic: 'C', scale: 'major' as const };

describe('suggestNextNotes', () => {
  it('sem nota anterior, não sugere nada', () => {
    const ctx = buildNoteContext(C_MAJOR, 'C');
    expect(suggestNextNotes([], ctx, { range })).toEqual([]);
  });

  it('em C maior sobre G7, B (sensível) leva a C como sugestão nº 1', () => {
    const ctx = buildNoteContext(C_MAJOR, 'G7');
    const [first] = suggestNextNotes([71], ctx, { range });
    expect(first && midiName(first.midi)).toBe('C5');
    expect(first?.reason.pt).toMatch(/sensível/);
    expect(first?.reason.en).toMatch(/leading tone/);
  });

  it('a sétima do acorde (F sobre G7) resolve descendo para E', () => {
    const ctx = buildNoteContext(C_MAJOR, 'G7');
    expect(tendencyOf(65, ctx)?.targets).toEqual([64]);
    const top = suggestNextNotes([65], ctx, { range });
    expect(top.map((s) => s.midi)).toContain(64);
  });

  it('um cromatismo resolve meio tom para dentro da escala', () => {
    const ctx = buildNoteContext(C_MAJOR, 'C');
    const [first] = suggestNextNotes([63], ctx, { range }); // Eb4
    expect([62, 64]).toContain(first?.midi);
  });

  it('depois de um salto grande, prefere voltar em passo no sentido contrário', () => {
    const ctx = buildNoteContext(C_MAJOR, 'C');
    const top = suggestNextNotes([60, 69], ctx, { range, count: 5 }); // C4 → A4 (sobe 9)
    const recovery = top.find((s) => s.reason.pt.includes('salto'));
    expect(recovery).toBeDefined();
    expect(recovery!.midi).toBeLessThan(69);
  });

  it('respeita a extensão do instrumento e devolve notas distintas', () => {
    const ctx = buildNoteContext(C_MAJOR, 'C');
    const top = suggestNextNotes([range.max], ctx, { range, count: 5 });
    expect(top.every((s) => s.midi <= range.max && s.midi >= range.min)).toBe(true);
    expect(new Set(top.map((s) => s.midi)).size).toBe(top.length);
  });

  it('classifica a pontuação em ordem decrescente', () => {
    const ctx = buildNoteContext({ tonic: 'A', scale: 'minorPentatonic' }, 'Am');
    const top = suggestNextNotes([69], ctx, { range, count: 6 });
    for (let i = 1; i < top.length; i++)
      expect(top[i - 1]!.score).toBeGreaterThanOrEqual(top[i]!.score);
    expect(top.every((s) => s.cls !== 'fora')).toBe(true);
    expect(chromaOf('A')).toBe(9);
  });
});

describe('proximityValue', () => {
  it('premia passos e penaliza saltos', () => {
    expect(proximityValue(1)).toBe(1);
    expect(proximityValue(-2)).toBe(1);
    expect(proximityValue(9)).toBeLessThan(proximityValue(3));
  });
});
