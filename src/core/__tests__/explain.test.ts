import { describe, expect, it } from 'vitest';
import { buildNoteContext } from '../classify';
import { explainNote } from '../explain';
import { chromaOf } from '../music';

const C = { tonic: 'C', scale: 'major' as const };
const opts = (chordSymbol: string) => ({ chordSymbol, keyLabel: 'C maior', flats: false });

describe('explainNote', () => {
  it('nota do acorde: diz o intervalo e que é estável', () => {
    const e = explainNote(chromaOf('B'), buildNoteContext(C, 'G7'), opts('G7'));
    expect(e.cls).toBe('repouso');
    expect(e.interval).toBe('3ª maior');
    expect(e.degree).toBe('sensível');
    expect(e.why).toMatch(/3ª maior de G7/);
  });

  it('sétima do acorde: tensão que desce', () => {
    const e = explainNote(chromaOf('F'), buildNoteContext(C, 'G7'), opts('G7'));
    expect(e.cls).toBe('tensao');
    expect(e.why).toMatch(/7ª menor de G7/);
    expect(e.goesTo).toBe('E');
  });

  it('sensível sobre o acorde da tônica: puxa para a tônica', () => {
    const e = explainNote(chromaOf('B'), buildNoteContext(C, 'C'), opts('C'));
    expect(e.cls).toBe('tensao');
    expect(e.why).toMatch(/sensível/);
    expect(e.goesTo).toBe('C');
  });

  it('quarta sobre acorde maior: choca com a terça', () => {
    const e = explainNote(chromaOf('F'), buildNoteContext(C, 'C'), opts('C'));
    expect(e.why).toMatch(/choca com a 3ª \(E\)/);
    expect(e.goesTo).toBe('E');
  });

  it('passagem: aponta as notas do acorde vizinhas', () => {
    const e = explainNote(chromaOf('D'), buildNoteContext(C, 'C'), opts('C'));
    expect(e.cls).toBe('passagem');
    expect(e.why).toMatch(/a caminho de C ou E/);
  });

  it('fora da escala: sugere a saída cromática', () => {
    const e = explainNote(chromaOf('C#'), buildNoteContext(C, 'C'), opts('C'));
    expect(e.cls).toBe('fora');
    expect(e.why).toMatch(/para D ou C/);
  });
});
