import { tx, type Txt } from '@/i18n/lang';
import { classifyNote, isAvoidFourth, isLeadingTone, type NoteContext } from './classify';
import { mod12 } from './music';
import type { NoteClass, NoteSuggestion, ScoreWeights } from './types';

export const DEFAULT_WEIGHTS: ScoreWeights = {
  cls: 0.4,
  proximity: 0.3,
  resolution: 0.2,
  contour: 0.1,
};

const CLASS_VALUE: Record<NoteClass, number> = {
  repouso: 1,
  passagem: 0.7,
  tensao: 0.5,
  fora: 0.1,
};

/** Passos de 1–2 semitons são os mais cantáveis; repetir a nota vale menos que andar. */
export function proximityValue(distance: number): number {
  const d = Math.abs(distance);
  if (d === 0) return 0.6;
  if (d <= 2) return 1;
  if (d <= 4) return 0.8;
  if (d === 5) return 0.6;
  if (d <= 7) return 0.4;
  return 0.2;
}

export interface Tendency {
  targets: number[];
  reason: Txt;
}

/** Para onde a última nota "quer" ir, conforme sua função no tom e no acorde. */
export function tendencyOf(midi: number, ctx: NoteContext): Tendency | null {
  const c = mod12(midi);
  if (isLeadingTone(c, ctx))
    return {
      targets: [midi + 1],
      reason: tx('resolve a sensível na tônica', 'resolves the leading tone to the tonic'),
    };
  if (ctx.chord.seventh === c) {
    const down = [midi - 1, midi - 2].filter((m) => ctx.scale.has(mod12(m)));
    return {
      targets: down.slice(0, 1),
      reason: tx('resolve a sétima descendo', 'resolves the seventh downward'),
    };
  }
  if (isAvoidFourth(c, ctx))
    return {
      targets: [midi - 1],
      reason: tx('resolve a quarta na terça', 'resolves the fourth to the third'),
    };
  if (!ctx.scale.has(c)) {
    const steps = [midi + 1, midi - 1].filter((m) => ctx.scale.has(mod12(m)));
    return { targets: steps, reason: tx('resolve o cromatismo', 'resolves the chromatic note') };
  }
  return null;
}

export interface SuggestOptions {
  range: { min: number; max: number };
  weights?: ScoreWeights;
  count?: number;
  /** Maior salto considerado, em semitons. */
  span?: number;
}

/**
 * Ranqueia as próximas notas a partir das últimas tocadas (mais recente por último).
 * Retorna vazio se nenhuma nota foi tocada ainda.
 */
export function suggestNextNotes(
  lastNotes: readonly number[],
  ctx: NoteContext,
  { range, weights = DEFAULT_WEIGHTS, count = 3, span = 12 }: SuggestOptions,
): NoteSuggestion[] {
  const last = lastNotes.at(-1);
  if (last === undefined) return [];
  const prev = lastNotes.at(-2);
  const tendency = tendencyOf(last, ctx);
  const leap = prev !== undefined ? last - prev : 0;
  const recovering = Math.abs(leap) >= 5;

  const results: NoteSuggestion[] = [];
  const lo = Math.max(range.min, last - span);
  const hi = Math.min(range.max, last + span);
  for (let midi = lo; midi <= hi; midi++) {
    const chroma = mod12(midi);
    const cls = classifyNote(chroma, ctx);
    const move = midi - last;
    const resolves = tendency?.targets.includes(midi) ?? false;
    const recovers =
      recovering && Math.abs(move) <= 2 && move !== 0 && Math.sign(move) !== Math.sign(leap);
    const score =
      weights.cls * CLASS_VALUE[cls] +
      weights.proximity * proximityValue(move) +
      weights.resolution * (resolves ? 1 : 0) +
      weights.contour * (recovers ? 1 : 0.5);
    results.push({
      midi,
      chroma,
      cls,
      score,
      reason: reasonFor(cls, move, resolves, recovers, tendency),
    });
  }
  return results
    .sort((a, b) => b.score - a.score || Math.abs(a.midi - last) - Math.abs(b.midi - last))
    .slice(0, count);
}

function reasonFor(
  cls: NoteClass,
  move: number,
  resolves: boolean,
  recovers: boolean,
  tendency: Tendency | null,
): Txt {
  if (resolves && tendency) return tendency.reason;
  if (recovers) return tx('volta em passo depois do salto', 'steps back after the leap');
  if (cls === 'repouso')
    return move === 0
      ? tx('repete a nota do acorde', 'repeats the chord tone')
      : tx('nota do acorde: soa estável', 'chord tone: sounds stable');
  if (cls === 'passagem')
    return Math.abs(move) <= 2
      ? tx('passo suave dentro da escala', 'smooth step within the scale')
      : tx('nota de passagem', 'passing note');
  if (cls === 'tensao')
    return tx('cria tensão que pede resolução', 'creates tension that wants to resolve');
  return tx(
    'cromatismo: resolva meio tom acima ou abaixo',
    'chromatic: resolve a half step up or down',
  );
}
