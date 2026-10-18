import { describe, expect, it } from 'vitest';
import {
  DEFAULT_GROOVES,
  STYLE_GROOVES,
  groovesFor,
  outOfRangeSteps,
  resolveGroove,
} from '../grooves';
import { PROGRESSIONS, makeCustomProgression, progressionBars } from '../progressions';
import { buildTimeline, parseBar, splitBar, stepsPerBar, upcoming } from '../rhythm';
import { stepEvents } from '../sequencer';

const C = { tonic: 'C', scale: 'major' } as const;

describe('compassos', () => {
  it('cada fórmula tem sua grade de semicolcheias', () => {
    expect(stepsPerBar('4/4')).toBe(16);
    expect(stepsPerBar('3/4')).toBe(12);
    expect(stepsPerBar('6/8')).toBe(12);
  });

  it('dois acordes dividem o compasso: 2+2, 2+1 e 3+3', () => {
    expect(splitBar('4/4', 2)).toEqual([2, 2]);
    expect(splitBar('3/4', 2)).toEqual([2, 1]);
    expect(splitBar('6/8', 2)).toEqual([3, 3]);
    expect(splitBar('3/4', 1)).toEqual([3]);
  });

  it('um compasso escrito com espaço tem dois acordes, no máximo', () => {
    expect(parseBar('ii  V7')).toEqual(['ii', 'V7']);
    expect(parseBar('I IV V')).toEqual(['I', 'IV']);
  });

  it('o turnaround tem dois acordes por compasso, no tom', () => {
    const p = PROGRESSIONS.find((x) => x.id === 'turnaround')!;
    expect(progressionBars(p, C)).toEqual([
      ['C', 'Am'],
      ['Dm', 'G7'],
    ]);
  });

  it('progressão própria guarda compasso e divisões', () => {
    const p = makeCustomProgression([['ii', 'V7'], ['I']], 'major', '3/4');
    expect(p.numerals).toEqual(['ii V7', 'I']);
    expect(p.meter).toBe('3/4');
    expect(p.name).toBe('ii V7 – I (3/4)');
    expect(makeCustomProgression([['I'], ['V']], 'major').meter).toBeUndefined();
  });
});

describe('linha do tempo e antecipação', () => {
  const timeline = buildTimeline(
    [
      ['C', 'Am'],
      ['Dm', 'G7'],
    ],
    '4/4',
  );

  it('acordes de 2 tempos entram nos tempos 1 e 3', () => {
    expect(timeline.map((s) => [s.chord, s.bar, s.startBeat, s.beats])).toEqual([
      ['C', 0, 0, 2],
      ['Am', 0, 2, 2],
      ['Dm', 1, 0, 2],
      ['G7', 1, 2, 2],
    ]);
  });

  it('o próximo acorde aparece no último tempo antes de cada troca', () => {
    expect(upcoming(timeline, '4/4', 0, 0)).toEqual({ current: 'C', next: 'Am', preview: false });
    expect(upcoming(timeline, '4/4', 0, 1)).toEqual({ current: 'C', next: 'Am', preview: true });
    expect(upcoming(timeline, '4/4', 1, 3)).toEqual({ current: 'G7', next: 'C', preview: true });
    // Segundo ciclo.
    expect(upcoming(timeline, '4/4', 2, 2).current).toBe('Am');
  });

  it('na contagem, mostra o primeiro acorde', () => {
    expect(upcoming(timeline, '4/4', -1, 2)).toEqual({ current: null, next: 'C', preview: true });
  });

  it('no 6/8 antecipa nas duas últimas colcheias', () => {
    const t = buildTimeline([['C'], ['G']], '6/8');
    expect(upcoming(t, '6/8', 0, 3).preview).toBe(false);
    expect(upcoming(t, '6/8', 0, 4).preview).toBe(true);
  });
});

describe('sequenciador', () => {
  it('as batidas padrão cabem no compasso', () => {
    for (const g of Object.values(DEFAULT_GROOVES)) expect(outOfRangeSteps(g)).toEqual([]);
  });

  it('o primeiro compasso é contagem, com acento no 1', () => {
    const t = buildTimeline([['C']], '3/4');
    const evs = Array.from({ length: 12 }, (_, s) =>
      stepEvents(s, t, '3/4', DEFAULT_GROOVES['3/4']),
    );
    expect(evs.filter((e) => e.click).map((e) => e.click)).toEqual(['accent', 'normal', 'normal']);
    expect(evs.every((e) => e.bar === -1 && !e.strum && !e.bass)).toBe(true);
  });

  it('acorde de 2 tempos começa com baixo e batida próprios', () => {
    const t = buildTimeline([['C', 'G7']], '4/4');
    const g = DEFAULT_GROOVES['4/4'];
    const at = (beat: number) => stepEvents(16 + beat * 4, t, '4/4', g);
    expect(at(0)).toMatchObject({ chordStart: true, segment: 0, bass: { midi: 36 } });
    expect(at(2)).toMatchObject({ chordStart: true, segment: 1, bass: { midi: 43 } }); // G2
    expect(at(2).strum).toBeDefined();
    // Próximo ciclo: o índice absoluto continua.
    expect(stepEvents(32, t, '4/4', g)).toMatchObject({ bar: 1, segment: 2, segmentIndex: 0 });
  });

  it('valsa: baixo no 1, acordes no 2 e no 3', () => {
    const t = buildTimeline([['C']], '3/4');
    const g = DEFAULT_GROOVES['3/4'];
    const bar = Array.from({ length: 12 }, (_, s) => stepEvents(12 + s, t, '3/4', g));
    expect(bar.flatMap((e, s) => (e.bass ? [s] : []))).toEqual([0]);
    expect(bar.flatMap((e, s) => (e.strum?.dir === 'down' ? [s] : []))).toEqual([0, 4, 8]);
  });
});

describe('estilos de base', () => {
  const bar = (chords: string[][], meter: '4/4' | '3/4', id: string) => {
    const t = buildTimeline(chords, meter);
    const g = resolveGroove(id, meter);
    const n = stepsPerBar(meter);
    return Array.from({ length: n }, (_, s) => stepEvents(n + s, t, meter, g));
  };

  it('todos os estilos cabem no compasso e aparecem só no compasso certo', () => {
    for (const g of STYLE_GROOVES) expect(outOfRangeSteps(g)).toEqual([]);
    expect(groovesFor('4/4').map((g) => g.id)).toEqual(['pop', 'reggae', 'bossa', 'swing']);
    expect(groovesFor('3/4').map((g) => g.id)).toEqual(['tres', 'valsa']);
    expect(groovesFor('6/8').map((g) => g.id)).toEqual(['seis-oito']);
  });

  it('estilo de outro compasso cai na batida padrão', () => {
    expect(resolveGroove('valsa', '4/4').id).toBe('pop');
    expect(resolveGroove(null, '3/4').id).toBe('tres');
  });

  it('reggae: acorde só nas colcheias fracas e one drop no 3', () => {
    const evs = bar([['C']], '4/4', 'reggae');
    expect(evs.flatMap((e, s) => (e.strum ? [s] : []))).toEqual([2, 6, 10, 14]);
    expect(evs.flatMap((e, s) => (e.kick ? [s] : []))).toEqual([8]);
  });

  it('swing: colcheias fracas atrasadas em tercina e baixo caminhante até o próximo acorde', () => {
    const evs = bar([['C'], ['F']], '4/4', 'swing');
    expect(evs[6]!.delay).toBeCloseTo(0.66);
    expect(evs[4]!.delay).toBe(0);
    // C2, E2, G2 e E2 (meio tom abaixo de F2).
    expect(evs.flatMap((e) => (e.bass ? [e.bass.midi] : []))).toEqual([36, 40, 43, 40]);
  });

  it('swing em acorde menor caminha pela terça menor', () => {
    const evs = bar([['Am'], ['Dm']], '4/4', 'swing');
    expect(evs[4]!.bass!.midi).toBe(36 + 9 + 3);
  });

  it('com 2 acordes no compasso, o segundo entra com a fundamental no baixo', () => {
    const evs = bar([['C', 'G7']], '4/4', 'bossa');
    expect(evs[8]!.bass!.midi).toBe(43); // G2, não a quinta de G
  });
});
