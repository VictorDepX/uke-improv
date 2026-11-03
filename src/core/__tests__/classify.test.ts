import { describe, expect, it } from 'vitest';
import { buildNoteContext, classifyNote } from '../classify';
import { TONICS, chromaName, chromaOf, scaleChromas, SCALES } from '../music';
import { diatonicChords } from '../harmony';
import type { ScaleName } from '../types';

const c = chromaOf;

describe('classifyNote', () => {
  it('classifica as notas de C maior sobre G7', () => {
    const ctx = buildNoteContext({ tonic: 'C', scale: 'major' }, 'G7');
    expect(classifyNote(c('G'), ctx)).toBe('repouso');
    expect(classifyNote(c('B'), ctx)).toBe('repouso');
    expect(classifyNote(c('D'), ctx)).toBe('repouso');
    expect(classifyNote(c('F'), ctx)).toBe('tensao'); // sétima do acorde
    expect(classifyNote(c('C'), ctx)).toBe('tensao'); // quarta sobre acorde maior
    expect(classifyNote(c('A'), ctx)).toBe('passagem');
    expect(classifyNote(c('Eb'), ctx)).toBe('fora');
  });

  it('marca a quarta sobre acorde maior e a sensível como tensão', () => {
    const ctx = buildNoteContext({ tonic: 'C', scale: 'major' }, 'C');
    expect(classifyNote(c('F'), ctx)).toBe('tensao');
    expect(classifyNote(c('B'), ctx)).toBe('tensao');
    expect(classifyNote(c('D'), ctx)).toBe('passagem');
  });

  it('em lá menor pentatônica sobre Am, nada fora da escala recebe cor', () => {
    const key = { tonic: 'A', scale: 'minorPentatonic' as const };
    const ctx = buildNoteContext(key, 'Am');
    const scale = new Set(scaleChromas(key));
    for (let ch = 0; ch < 12; ch++) {
      const cls = classifyNote(ch, ctx);
      if (!scale.has(ch)) expect(cls).toBe('fora');
      else expect(cls).not.toBe('fora');
    }
  });

  it('notas do acorde são sempre repouso, mesmo fora da escala (E7 em lá menor)', () => {
    const ctx = buildNoteContext({ tonic: 'A', scale: 'minor' }, 'E7');
    expect(classifyNote(c('G#'), ctx)).toBe('repouso');
  });

  it('em 12 tons × 5 escalas, fundamental, terça e quinta do I são repouso', () => {
    const scales = Object.keys(SCALES) as ScaleName[];
    for (const tonic of TONICS) {
      for (const scale of scales) {
        const minor = SCALES[scale].mode === 'minor';
        const chord = `${tonic}${minor ? 'm' : ''}`;
        const ctx = buildNoteContext({ tonic, scale }, chord);
        for (const tone of ctx.chord.stable) expect(classifyNote(tone, ctx)).toBe('repouso');
      }
    }
  });
});

describe('nota a evitar (meio tom acima de uma nota do acorde)', () => {
  const tensions = (tonic: string, scale: ScaleName, chord: string) => {
    const ctx = buildNoteContext({ tonic, scale }, chord);
    return Array.from({ length: 12 }, (_, c) => c)
      .filter((c) => classifyNote(c, ctx) === 'tensao')
      .map((c) => chromaName(c, true));
  };

  it('Em e Bdim em dó maior têm tensão (F e C, meio tom acima de E, B e C)', () => {
    expect(tensions('C', 'major', 'Em')).toEqual(['C', 'F']);
    expect(tensions('C', 'major', 'Bdim')).toEqual(['C']);
  });

  it('em lá menor, o próprio Am tem tensão: F, meio tom acima de E', () => {
    expect(tensions('A', 'minor', 'Am')).toEqual(['F']);
  });

  it('no maior e nos menores natural e harmônico, o acorde do I/i sempre tem tensão', () => {
    const scales: ScaleName[] = ['major', 'minor', 'harmonicMinor'];
    for (const scale of scales)
      for (const tonic of TONICS) {
        const tonicChord = diatonicChords({ tonic, scale })[0]!.symbol;
        expect(tensions(tonic, scale, tonicChord).length, `${tonic} ${scale}`).toBeGreaterThan(0);
      }
  });

  it('acorde dórico (ii no maior, i no dórico) não tem nota a evitar', () => {
    expect(tensions('C', 'major', 'Dm')).toEqual(['B']); // só a sensível do tom
    expect(tensions('A', 'dorian', 'Am')).toEqual([]);
  });

  it('pentatônicas não têm meio tom: sem sétima no acorde, nenhuma tensão (é por isso que soam seguras)', () => {
    expect(tensions('C', 'majorPentatonic', 'C')).toEqual([]);
    expect(tensions('A', 'minorPentatonic', 'Am')).toEqual([]);
  });
});
