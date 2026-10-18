import { describe, expect, it } from 'vitest';
import {
  BASIC_INTERVALS,
  EMPTY_SCORE,
  functionDegrees,
  makeQuestion,
  scoreAnswer,
  seededRng,
  type EarSettings,
} from '../ear';
import { voicingFor } from '../chordShapes';

const C = { tonic: 'C', scale: 'major' } as const;
const settings = (over: Partial<EarSettings> = {}): EarSettings => ({
  intervalLevel: 'basic',
  direction: 'up',
  qualityLevel: 'basic',
  voicing: (s) => voicingFor(s).midis,
  ...over,
});

describe('treino de ouvido', () => {
  it('intervalos: a distância tocada é a resposta, na direção pedida', () => {
    const rng = seededRng(7);
    for (let i = 0; i < 40; i++) {
      const up = makeQuestion('interval', C, settings(), rng);
      const [a, b] = up.play.map((e) => e.midis[0]!);
      expect(b! - a!).toBe(Number(up.answer));
      expect(BASIC_INTERVALS).toContain(Number(up.answer));
      expect(up.options.map((o) => o.id)).toContain(up.answer);

      const down = makeQuestion(
        'interval',
        C,
        settings({ direction: 'down', intervalLevel: 'all' }),
        rng,
      );
      const [x, y] = down.play.map((e) => e.midis[0]!);
      expect(x! - y!).toBe(Number(down.answer));
      expect(down.options).toHaveLength(12);
    }
  });

  it('intervalo harmônico toca as duas notas juntas', () => {
    const q = makeQuestion('interval', C, settings({ direction: 'harmonic' }), seededRng(1));
    expect(q.play).toHaveLength(1);
    expect(q.play[0]!.midis).toHaveLength(2);
  });

  it('a explicação diz o nome, os semitons e as notas', () => {
    const q = makeQuestion('interval', C, settings(), seededRng(3));
    expect(q.explain).toMatch(/^(3ª|4ª|5ª|Oitava).*\d+ semitons \([A-G]#? → [A-G]#?\)\.$/);
  });

  it('maior × menor: a terça tocada define a resposta', () => {
    const rng = seededRng(11);
    const seen = new Set<string>();
    for (let i = 0; i < 30; i++) {
      const q = makeQuestion('quality', C, settings(), rng);
      const chord = q.play.at(-1)!.midis;
      const third = chord[1]! - chord[0]!;
      expect(q.answer).toBe(third === 4 ? 'maj' : 'min');
      seen.add(q.answer);
    }
    expect(seen).toEqual(new Set(['maj', 'min']));
  });

  it('no nível completo entram diminuto e aumentado', () => {
    const rng = seededRng(5);
    const seen = new Set<string>();
    for (let i = 0; i < 60; i++)
      seen.add(makeQuestion('quality', C, settings({ qualityLevel: 'all' }), rng).answer);
    expect(seen).toEqual(new Set(['maj', 'min', 'dim', 'aug']));
  });

  it('função: cadência I–IV–V7–I e depois um grau do tom', () => {
    const q = makeQuestion('function', C, settings(), seededRng(2));
    expect(q.play).toHaveLength(5);
    expect(q.play.slice(0, 4).map((e) => e.midis)).toEqual(
      ['C', 'F', 'G7', 'C'].map((c) => voicingFor(c).midis),
    );
    expect(q.options.map((o) => o.id)).toEqual(['I', 'ii', 'iii', 'IV', 'V', 'vi']);
    const target = functionDegrees(C).find((d) => d.numeral === q.answer)!;
    expect(q.play[4]!.midis).toEqual(voicingFor(target.symbol).midis);
    expect(q.explain).toContain(target.symbol);
  });

  it('em tom menor a cadência usa iv e V7', () => {
    const Am = { tonic: 'A', scale: 'minor' } as const;
    const q = makeQuestion('function', Am, settings(), seededRng(4));
    expect(q.play.slice(0, 4).map((e) => e.midis)).toEqual(
      ['Am', 'Dm', 'E7', 'Am'].map((c) => voicingFor(c).midis),
    );
    expect(q.options.some((o) => o.id.includes('°'))).toBe(false);
  });

  it('placar conta acertos e a melhor sequência', () => {
    let s = EMPTY_SCORE;
    for (const r of [true, true, false, true]) s = scoreAnswer(s, r);
    expect(s).toEqual({ correct: 3, total: 4, streak: 1, best: 2 });
  });
});
