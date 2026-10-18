import { type Meter, stepsPerBar } from './rhythm';

export type StrumDir = 'down' | 'up';

/** Nota do baixo relativa ao acorde. */
export type BassTone = 'root' | 'fifth' | 'octave';

/**
 * Uma batida: o que cada camada toca em cada semicolcheia do compasso.
 * Os passos vão de 0 a stepsPerBar(meter) − 1.
 */
export interface Groove {
  id: string;
  name: string;
  meter: Meter;
  /** Palhetadas do uke: passo → direção e intensidade (0–1). */
  strum: Readonly<Record<number, readonly [StrumDir, number]>>;
  /** Strum curto e abafado (chop do reggae, levada da bossa). */
  muted?: boolean;
  bass: readonly { step: number; tone: BassTone; vel?: number }[];
  kick: readonly number[];
  snare: readonly number[];
  /** Aro em vez de caixa (bossa). */
  rim?: boolean;
  hat: Readonly<Record<number, number>>;
  /** 0 = reto; 0.33 ≈ tercina (swing). Atrasa as colcheias fracas. */
  swing?: number;
}

const every = (n: number, total: number, vel: number, accent?: number): Record<number, number> =>
  Object.fromEntries(
    Array.from({ length: total / n }, (_, i) => [i * n, i === 0 && accent ? accent : vel]),
  );

/** Batida padrão de cada compasso: a mesma "baixo, baixo-cima, cima-baixo-cima" de antes no 4/4. */
export const DEFAULT_GROOVES: Record<Meter, Groove> = {
  '4/4': {
    id: 'pop',
    name: 'Pop',
    meter: '4/4',
    strum: {
      0: ['down', 0.65],
      4: ['down', 0.65],
      6: ['up', 0.45],
      10: ['up', 0.45],
      12: ['down', 0.65],
      14: ['up', 0.45],
    },
    bass: [
      { step: 0, tone: 'root' },
      { step: 8, tone: 'root' },
    ],
    kick: [0, 8],
    snare: [4, 12],
    hat: Object.fromEntries(Array.from({ length: 8 }, (_, i) => [i * 2, i % 2 ? 0.3 : 0.5])),
  },
  '3/4': {
    id: 'tres',
    name: 'Três por quatro',
    meter: '3/4',
    strum: { 0: ['down', 0.6], 4: ['down', 0.5], 6: ['up', 0.35], 8: ['down', 0.5] },
    bass: [{ step: 0, tone: 'root' }],
    kick: [0],
    snare: [4, 8],
    hat: every(2, 12, 0.3, 0.5),
  },
  '6/8': {
    id: 'seis-oito',
    name: 'Seis por oito',
    meter: '6/8',
    // D d u D d u, em colcheias.
    strum: {
      0: ['down', 0.65],
      2: ['down', 0.4],
      4: ['up', 0.4],
      6: ['down', 0.6],
      8: ['down', 0.4],
      10: ['up', 0.4],
    },
    bass: [
      { step: 0, tone: 'root' },
      { step: 6, tone: 'fifth', vel: 0.6 },
    ],
    kick: [0],
    snare: [6],
    hat: every(2, 12, 0.3, 0.5),
  },
};

/** Passos fora do compasso (deve ser vazio; usado nos testes). */
export function outOfRangeSteps(g: Groove): number[] {
  return [
    ...Object.keys(g.strum).map(Number),
    ...g.bass.map((b) => b.step),
    ...g.kick,
    ...g.snare,
    ...Object.keys(g.hat).map(Number),
  ].filter((s) => s < 0 || s >= stepsPerBar(g.meter));
}

/** Semitons do baixo acima da fundamental. */
export const BASS_INTERVAL: Record<BassTone, number> = { root: 0, fifth: 7, octave: 12 };
