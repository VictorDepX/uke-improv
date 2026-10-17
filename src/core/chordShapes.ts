import { TUNINGS } from './fretboard';
import { chordInfo, chromaName, mod12 } from './music';
import type { TuningName } from './types';

/** Casas por corda, da 4ª (G) para a 1ª (A). */
export type Shape = readonly [number, number, number, number];

/**
 * Formas consagradas para GCEA, indexadas por `fundamental:qualidade`.
 * Fundamental como classe de pitch (0 = C). Validadas em teste.
 */
const CANONICAL: Record<string, Shape> = {
  // Maiores
  '0:': [0, 0, 0, 3],
  '1:': [1, 1, 1, 4],
  '2:': [2, 2, 2, 0],
  '3:': [0, 3, 3, 1],
  '4:': [4, 4, 4, 2],
  '5:': [2, 0, 1, 0],
  '6:': [3, 1, 2, 1],
  '7:': [0, 2, 3, 2],
  '8:': [5, 3, 4, 3],
  '9:': [2, 1, 0, 0],
  '10:': [3, 2, 1, 1],
  '11:': [4, 3, 2, 2],
  // Menores
  '0:m': [0, 3, 3, 3],
  '1:m': [1, 1, 0, 4],
  '2:m': [2, 2, 1, 0],
  '3:m': [3, 3, 2, 1],
  '4:m': [0, 4, 3, 2],
  '5:m': [1, 0, 1, 3],
  '6:m': [2, 1, 2, 0],
  '7:m': [0, 2, 3, 1],
  '8:m': [1, 3, 4, 2],
  '9:m': [2, 0, 0, 0],
  '10:m': [3, 1, 1, 1],
  '11:m': [4, 2, 2, 2],
  // Dominantes com sétima
  '0:7': [0, 0, 0, 1],
  '1:7': [1, 1, 1, 2],
  '2:7': [2, 2, 2, 3],
  '3:7': [3, 3, 3, 4],
  '4:7': [1, 2, 0, 2],
  '5:7': [2, 3, 1, 3],
  '6:7': [3, 4, 2, 4],
  '7:7': [0, 2, 1, 2],
  '8:7': [1, 3, 2, 3],
  '9:7': [0, 1, 0, 0],
  '10:7': [1, 2, 1, 1],
  '11:7': [2, 3, 2, 2],
  // Diminutos e menores com sétima mais usados
  '11:dim': [4, 2, 1, 2],
  '9:m7': [0, 0, 0, 0],
  '2:m7': [2, 2, 1, 3],
  '4:m7': [0, 2, 0, 2],
};

const ROOT_RE = /^[A-G][#b]*/;

function qualityOf(symbol: string): string {
  return symbol.replace(ROOT_RE, '');
}

const MAX_FRET = 7;
const MAX_SPAN = 3;

/** Uma forma é válida se toda corda toca nota do acorde e as notas essenciais estão presentes. */
export function isValidShape(shape: Shape, symbol: string, tuning: TuningName = 'GCEA'): boolean {
  const info = chordInfo(symbol);
  const open = TUNINGS[tuning].open;
  const played = shape.map((f, i) => mod12(open[i]! + f));
  if (!played.every((c) => info.chromas.includes(c))) return false;
  const required = requiredChromas(symbol);
  return required.every((c) => played.includes(c));
}

/** Notas obrigatórias: todas, exceto a quinta justa em acordes de 4+ notas. */
function requiredChromas(symbol: string): number[] {
  const info = chordInfo(symbol);
  if (info.chromas.length <= 3) return info.chromas;
  const fifth = mod12(info.root + 7);
  return info.chromas.filter((c) => c !== fifth);
}

const generated = new Map<string, Shape[]>();

/** Busca exaustiva de formas tocáveis nas 7 primeiras casas, das mais simples para as mais difíceis. */
export function generateShapes(symbol: string, tuning: TuningName = 'GCEA', limit = 3): Shape[] {
  const cacheKey = `${tuning}|${symbol}`;
  const hit = generated.get(cacheKey);
  if (hit) return hit.slice(0, limit);
  const scored: { shape: Shape; cost: number }[] = [];
  for (let a = 0; a <= MAX_FRET; a++)
    for (let b = 0; b <= MAX_FRET; b++)
      for (let c = 0; c <= MAX_FRET; c++)
        for (let d = 0; d <= MAX_FRET; d++) {
          const shape: Shape = [a, b, c, d];
          const fretted = shape.filter((f) => f > 0);
          const span = fretted.length ? Math.max(...fretted) - Math.min(...fretted) : 0;
          if (span > MAX_SPAN) continue;
          if (!isValidShape(shape, symbol, tuning)) continue;
          const distinctFrets = new Set(fretted).size;
          const cost = fretted.reduce((s, f) => s + f, 0) + span * 2 + distinctFrets;
          scored.push({ shape, cost });
        }
  const shapes = scored.sort((x, y) => x.cost - y.cost).map((s) => s.shape);
  generated.set(cacheKey, shapes);
  return shapes.slice(0, limit);
}

/** Formas para exibir: a consagrada primeiro (se houver), depois as geradas. */
export function shapesFor(symbol: string, tuning: TuningName = 'GCEA', limit = 3): Shape[] {
  const info = chordInfo(symbol);
  const canonical = tuning === 'GCEA' ? CANONICAL[`${info.root}:${qualityOf(symbol)}`] : undefined;
  const rest = generateShapes(symbol, tuning, limit + 1).filter(
    (s) => !canonical || s.join() !== canonical.join(),
  );
  return (canonical ? [canonical, ...rest] : rest).slice(0, limit);
}

export function shapeToMidis(shape: Shape, tuning: TuningName = 'GCEA', capo = 0): number[] {
  const open = TUNINGS[tuning].open;
  return shape.map((f, i) => open[i]! + capo + f);
}

export interface Voicing {
  /** Acorde que soa. */
  symbol: string;
  /** Forma que a mão faz (a partir do capo). Igual a `symbol` sem capo. */
  shapeName: string;
  shapes: Shape[];
  /** Notas da forma principal, já com o capo. */
  midis: number[];
}

/**
 * Como tocar um acorde com capotraste: a mão faz a forma do acorde `capo`
 * semitons abaixo, e o capo leva o som ao acorde pedido.
 */
export function voicingFor(
  symbol: string,
  tuning: TuningName = 'GCEA',
  capo = 0,
  flats = false,
  limit = 3,
): Voicing {
  const info = chordInfo(symbol);
  const shapeName = capo ? chromaName(mod12(info.root - capo), flats) + qualityOf(symbol) : symbol;
  const shapes = shapesFor(shapeName, tuning, limit);
  const main = shapes[0] ?? ([0, 0, 0, 0] as const);
  return { symbol, shapeName, shapes, midis: shapeToMidis(main, tuning, capo) };
}

export const canonicalEntries = (): [string, Shape][] => Object.entries(CANONICAL);
