import { describe, expect, it } from 'vitest';
import { buildNoteContext, classifyNote } from '../classify';
import { diatonicChords } from '../harmony';
import { chromaOf } from '../music';
import { PRESETS } from '../presets';
import { PROGRESSIONS, progressionChords } from '../progressions';
import { suggestNextChords } from '../suggestChords';

const symbols = (tonic: string, scale: Parameters<typeof diatonicChords>[0]['scale']) =>
  diatonicChords({ tonic, scale }).map((d) => d.symbol);

describe('campos harmônicos dos modos', () => {
  it('dórico em D tem o IV maior (G)', () => {
    expect(symbols('D', 'dorian')).toEqual(['Dm', 'Em', 'F', 'G', 'Am', 'C']);
  });

  it('mixolídio em G tem o bVII maior (F) e o v menor (Dm)', () => {
    expect(symbols('G', 'mixolydian')).toEqual(['G', 'Am', 'C', 'Dm', 'Em', 'F']);
  });

  it('menor harmônica em A tem E, E7 e G#dim', () => {
    expect(symbols('A', 'harmonicMinor')).toEqual(['Am', 'Bdim', 'Dm', 'E', 'E7', 'F', 'G#dim']);
  });
});

describe('sugestões nos modos', () => {
  it('no dórico, Dm sugere o G maior característico', () => {
    const top = suggestNextChords('Dm', { tonic: 'D', scale: 'dorian' }).map((s) => s.symbol);
    expect(top.slice(0, 2)).toContain('G');
  });

  it('no mixolídio, F (bVII) resolve em G', () => {
    const [first] = suggestNextChords('F', { tonic: 'G', scale: 'mixolydian' });
    expect(first!.symbol).toBe('G');
    expect(first!.reason).toMatch(/mixolídia/);
  });

  it('na menor harmônica, G#dim resolve em Am', () => {
    expect(suggestNextChords('G#dim', { tonic: 'A', scale: 'harmonicMinor' })[0]!.symbol).toBe(
      'Am',
    );
  });
});

describe('classificação nos modos e no arpejo', () => {
  it('na menor harmônica, G# sobre Am é a sensível (tensão)', () => {
    const ctx = buildNoteContext({ tonic: 'A', scale: 'harmonicMinor' }, 'Am');
    expect(classifyNote(chromaOf('G#'), ctx)).toBe('tensao');
    expect(classifyNote(chromaOf('G'), ctx)).toBe('fora');
  });

  it('no dórico, B (6ª maior) é passagem sobre Dm', () => {
    const ctx = buildNoteContext({ tonic: 'D', scale: 'dorian' }, 'Dm');
    expect(classifyNote(chromaOf('B'), ctx)).toBe('passagem');
  });

  it('só arpejo: fora do acorde tudo é cromatismo; a sétima continua tensão', () => {
    const ctx = buildNoteContext({ tonic: 'C', scale: 'major' }, 'G7', true);
    expect(classifyNote(chromaOf('G'), ctx)).toBe('repouso');
    expect(classifyNote(chromaOf('F'), ctx)).toBe('tensao');
    expect(classifyNote(chromaOf('A'), ctx)).toBe('fora');
    expect(classifyNote(chromaOf('C'), ctx)).toBe('fora');
  });
});

describe('presets modais', () => {
  it('geram os vamps esperados', () => {
    const chordsOf = (id: string) => {
      const p = PRESETS.find((x) => x.id === id)!;
      const prog = PROGRESSIONS.find((x) => x.id === p.progressionId)!;
      return progressionChords(prog, { tonic: p.tonic, scale: p.scale });
    };
    expect(chordsOf('dorico-dm')).toEqual(['Dm', 'G']);
    expect(chordsOf('mixo-g')).toEqual(['G', 'F', 'C', 'G']);
  });
});
