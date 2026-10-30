import { describe, expect, it } from 'vitest';
import { buildNoteContext, classifyNote } from '../classify';
import {
  exerciseDef,
  exerciseProgress,
  startExercise,
  stepExercise,
  type ExerciseId,
  type ExerciseState,
} from '../exercises';
import { chromaName, mod12 } from '../music';
import { makeT } from '@/i18n/lang';

const pt = makeT('pt');

const C_MAJOR = { tonic: 'C', scale: 'major' } as const;

/** Toca uma sequência de MIDIs sobre um acorde de C maior, como o store faria. */
function play(
  id: ExerciseId,
  notes: readonly number[],
  chord = 'C',
  bars?: readonly (number | null)[],
): ExerciseState {
  const ctx = buildNoteContext(C_MAJOR, chord);
  return notes.reduce(
    (s, midi, i) =>
      stepExercise(s, {
        midi,
        name: chromaName(mod12(midi)),
        cls: classifyNote(mod12(midi), ctx),
        chord,
        bar: bars ? (bars[i] ?? null) : null,
      }),
    startExercise(id),
  );
}

describe('só repouso', () => {
  it('conta notas do acorde e erra nas outras', () => {
    const s = play('repouso', [60, 64, 62, 67]); // C E D G
    expect(s.hits).toBe(3);
    expect(s.misses).toBe(1);
    expect(s.feedback?.kind).toBe('hit');
    expect(pt(s.feedback!.text)).toBe('G é do acorde C.');
  });

  it('a nota errada diz a classe', () => {
    const s = play('repouso', [61]);
    expect(s.feedback?.kind).toBe('miss');
    expect(pt(s.feedback!.text)).toBe('C# está fora da escala. Procure uma verde.');
  });

  it('conclui na meta e ignora o que vem depois', () => {
    const target = exerciseDef('repouso').target;
    const s = play('repouso', [...Array(target).fill(60), 61]);
    expect(s.done).toBe(true);
    expect(s.misses).toBe(0);
    expect(pt(s.feedback!.text)).toMatch(/^Concluído: 8 acertos, 0 erros/);
  });
});

describe('resolva a tensão', () => {
  it('tensão seguida de nota do acorde por passo é acerto', () => {
    // Sobre C, B é a sensível (tensão) e C, meio tom acima, é do acorde.
    const s = play('resolva', [71, 72]);
    expect(s.hits).toBe(1);
    expect(s.feedback?.kind).toBe('hit');
    expect(pt(s.feedback!.text)).toBe('Resolveu: B → C.');
  });

  it('a 7ª do G7 resolvendo na 3ª do C, acorde a acorde', () => {
    const g7 = buildNoteContext(C_MAJOR, 'G7');
    let s = startExercise('resolva');
    s = stepExercise(s, { midi: 65, name: 'F', cls: classifyNote(5, g7), chord: 'G7', bar: null });
    expect(s.pending).toBe(true);
    const c = buildNoteContext(C_MAJOR, 'C');
    s = stepExercise(s, { midi: 64, name: 'E', cls: classifyNote(4, c), chord: 'C', bar: null });
    expect(s.hits).toBe(1);
  });

  it('salto ou nota que não é do acorde depois da tensão é erro', () => {
    expect(play('resolva', [71, 76]).misses).toBe(1); // B → E: longe
    expect(play('resolva', [71, 69]).misses).toBe(1); // B → A: passagem
  });

  it('sem tensão antes, só orienta', () => {
    const s = play('resolva', [60, 62]);
    expect(s.hits + s.misses).toBe(0);
    expect(s.feedback?.kind).toBe('info');
  });
});

describe('passo a passo', () => {
  it('a escala subindo conta notas seguidas', () => {
    const s = play('passo', [60, 62, 64, 65, 67]);
    expect(exerciseProgress(s)).toBe(5);
    expect(s.misses).toBe(0);
  });

  it('um salto recomeça a frase a partir da nota nova', () => {
    const s = play('passo', [60, 62, 64, 72, 71]);
    expect(s.misses).toBe(1);
    expect(s.streak).toBe(2);
    expect(pt(play('passo', [60, 67]).feedback!.text)).toBe(
      'Salto de 7 semitons. A frase recomeça em G.',
    );
  });

  it('nota fora da escala zera; repetir a nota não conta nem quebra', () => {
    expect(play('passo', [60, 62, 63]).streak).toBe(0);
    expect(play('passo', [60, 62, 62, 64]).streak).toBe(3);
  });

  it('conclui com 8 notas seguidas', () => {
    const s = play('passo', [60, 62, 64, 65, 67, 69, 71, 72]);
    expect(s.done).toBe(true);
  });
});

describe('alvo na troca', () => {
  it('pede a base ligada', () => {
    expect(pt(play('alvo', [60]).feedback!.text)).toBe('Ligue a base para este exercício.');
  });

  it('só a primeira nota de cada compasso conta', () => {
    const s = play('alvo', [60, 61, 62, 62, 64], 'C', [-1, 0, 0, 1, 2]);
    // bar −1: contagem; bar 0: C# (erro), D ignorado; bar 1: D (erro); bar 2: E (acerto)
    expect(s.hits).toBe(1);
    expect(s.misses).toBe(2);
    expect(s.feedback?.kind).toBe('hit');
    expect(pt(s.feedback!.text)).toBe('Alvo certo: E em C.');
  });
});
