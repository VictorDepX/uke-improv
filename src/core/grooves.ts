import { tx, type Txt } from '@/i18n/lang';
import { type Meter, stepsPerBar } from './rhythm';

export type StrumDir = 'down' | 'up';

/**
 * Nota do baixo relativa ao acorde. `third` segue a qualidade (maior/menor);
 * `approach` é meio tom abaixo da fundamental do próximo acorde (baixo caminhante).
 */
export type BassTone = 'root' | 'third' | 'fifth' | 'octave' | 'approach';

/**
 * Uma batida: o que cada camada toca em cada semicolcheia do compasso.
 * Os passos vão de 0 a stepsPerBar(meter) − 1.
 */
export interface Groove {
  id: string;
  name: Txt;
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
    name: tx('Pop', 'Pop'),
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
    name: tx('Três por quatro', 'Three-four'),
    meter: '3/4',
    strum: { 0: ['down', 0.6], 4: ['down', 0.5], 6: ['up', 0.35], 8: ['down', 0.5] },
    bass: [{ step: 0, tone: 'root' }],
    kick: [0],
    snare: [4, 8],
    hat: every(2, 12, 0.3, 0.5),
  },
  '6/8': {
    id: 'seis-oito',
    name: tx('Seis por oito', 'Six-eight'),
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

/** Semitons fixos acima da fundamental (terça e aproximação dependem do acorde). */
export const BASS_INTERVAL: Record<'root' | 'fifth' | 'octave', number> = {
  root: 0,
  fifth: 7,
  octave: 12,
};

const eighths = (total: number, on: number, off: number): Record<number, number> =>
  Object.fromEntries(Array.from({ length: total / 2 }, (_, i) => [i * 2, i % 2 ? off : on]));

/** Estilos além das batidas padrão. Cada um vale para um compasso. */
export const STYLE_GROOVES: readonly Groove[] = [
  {
    id: 'reggae',
    name: tx('Reggae', 'Reggae'),
    meter: '4/4',
    // Skank: acorde curto nas colcheias fracas.
    strum: { 2: ['down', 0.55], 6: ['down', 0.6], 10: ['down', 0.55], 14: ['down', 0.6] },
    muted: true,
    bass: [
      { step: 0, tone: 'root' },
      { step: 6, tone: 'root', vel: 0.6 },
      { step: 10, tone: 'fifth', vel: 0.7 },
    ],
    // One drop: bumbo e aro juntos no 3.
    kick: [8],
    snare: [8],
    rim: true,
    hat: eighths(16, 0.25, 0.4),
  },
  {
    id: 'bossa',
    name: tx('Bossa nova', 'Bossa nova'),
    meter: '4/4',
    strum: {
      0: ['down', 0.5],
      3: ['down', 0.45],
      6: ['down', 0.45],
      10: ['down', 0.45],
      12: ['down', 0.5],
    },
    muted: true,
    bass: [
      { step: 0, tone: 'root' },
      { step: 6, tone: 'root', vel: 0.55 },
      { step: 8, tone: 'fifth' },
      { step: 14, tone: 'fifth', vel: 0.55 },
    ],
    kick: [0, 8],
    // Clave da bossa no aro.
    snare: [0, 3, 6, 10, 13],
    rim: true,
    hat: Object.fromEntries(Array.from({ length: 16 }, (_, i) => [i, i % 4 === 0 ? 0.3 : 0.15])),
  },
  {
    id: 'swing',
    name: tx('Swing', 'Swing'),
    meter: '4/4',
    // Quatro acordes curtos por compasso, à moda da guitarra de big band.
    strum: { 0: ['down', 0.5], 4: ['down', 0.4], 8: ['down', 0.5], 12: ['down', 0.4] },
    muted: true,
    bass: [
      { step: 0, tone: 'root' },
      { step: 4, tone: 'third', vel: 0.7 },
      { step: 8, tone: 'fifth', vel: 0.75 },
      { step: 12, tone: 'approach', vel: 0.7 },
    ],
    kick: [0, 8],
    snare: [4, 12],
    rim: true,
    // Prato de condução: 1, 2 e-, 3, 4 e-.
    hat: { 0: 0.4, 4: 0.45, 6: 0.25, 8: 0.4, 12: 0.45, 14: 0.25 },
    swing: 0.33,
  },
  {
    id: 'valsa',
    name: tx('Valsa', 'Waltz'),
    meter: '3/4',
    // Tum-pá-pá: baixo no 1, acorde curto no 2 e no 3.
    strum: { 4: ['down', 0.5], 8: ['down', 0.45] },
    muted: true,
    bass: [{ step: 0, tone: 'root', vel: 0.9 }],
    kick: [0],
    snare: [],
    hat: { 0: 0.3, 4: 0.2, 8: 0.2 },
  },
];

/** Estilos disponíveis para um compasso: o padrão primeiro. */
export function groovesFor(meter: Meter): Groove[] {
  return [DEFAULT_GROOVES[meter], ...STYLE_GROOVES.filter((g) => g.meter === meter)];
}

/** O estilo escolhido, se combinar com o compasso; senão, o padrão do compasso. */
export function resolveGroove(id: string | null | undefined, meter: Meter): Groove {
  return groovesFor(meter).find((g) => g.id === id) ?? DEFAULT_GROOVES[meter];
}
