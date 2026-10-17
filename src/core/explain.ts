import { classifyNote, isAvoidFourth, isLeadingTone, type NoteContext } from './classify';
import { chromaName, mod12 } from './music';
import { tendencyOf } from './suggestNotes';
import type { Chroma, NoteClass } from './types';

const INTERVAL_NAMES = [
  'fundamental',
  '2ª menor',
  '2ª maior',
  '3ª menor',
  '3ª maior',
  '4ª justa',
  '5ª diminuta',
  '5ª justa',
  '6ª menor',
  '6ª maior',
  '7ª menor',
  '7ª maior',
];

const DEGREE_NAMES = [
  'tônica',
  '2º grau abaixado',
  '2º grau',
  '3º grau menor',
  '3º grau',
  '4º grau',
  '4º grau aumentado',
  '5º grau',
  '6º grau menor',
  '6º grau',
  '7º grau menor',
  'sensível',
];

export interface NoteExplanation {
  name: string;
  cls: NoteClass;
  /** Grau no tom, por extenso. */
  degree: string;
  /** Intervalo em relação à fundamental do acorde. */
  interval: string;
  /** Por que a nota recebeu essa cor. */
  why: string;
  /** Para onde a nota tende a ir, se tiver tendência. */
  goesTo: string | null;
}

export interface ExplainOptions {
  chordSymbol: string;
  keyLabel: string;
  flats: boolean;
}

function nearestInScale(chroma: Chroma, ctx: NoteContext, dir: 1 | -1): Chroma | null {
  for (let step = 1; step <= 2; step++) {
    const c = mod12(chroma + dir * step);
    if (ctx.scale.has(c)) return c;
  }
  return null;
}

function nearestChordTone(chroma: Chroma, ctx: NoteContext, dir: 1 | -1): Chroma {
  for (let step = 1; step < 12; step++) {
    const c = mod12(chroma + dir * step);
    if (ctx.chord.stable.includes(c)) return c;
  }
  return ctx.chord.root;
}

/** Explica, em português simples, a cor que uma nota recebe no braço. */
export function explainNote(
  chroma: Chroma,
  ctx: NoteContext,
  { chordSymbol, keyLabel, flats }: ExplainOptions,
): NoteExplanation {
  const c = mod12(chroma);
  const name = chromaName(c, flats);
  const n = (x: Chroma) => chromaName(x, flats);
  const cls = classifyNote(c, ctx);
  const interval = INTERVAL_NAMES[mod12(c - ctx.chord.root)]!;
  const degree = DEGREE_NAMES[mod12(c - ctx.tonic)]!;
  const targets = tendencyOf(60 + c, ctx)?.targets.map((m) => n(m)) ?? [];
  const goesTo = targets.length ? targets.join(' ou ') : null;

  let why: string;
  if (cls === 'repouso') {
    why = `É a ${interval} de ${chordSymbol}: nota do acorde, soa estável. Bom lugar para terminar uma frase.`;
  } else if (ctx.chord.seventh === c) {
    why = `É a ${interval} de ${chordSymbol}: faz parte do acorde, mas cria tensão e quer descer.`;
  } else if (isLeadingTone(c, ctx)) {
    why = `É a sensível do tom: fica meio tom abaixo da tônica (${n(ctx.tonic)}) e puxa forte para ela.`;
  } else if (isAvoidFourth(c, ctx)) {
    const third = n(mod12(ctx.chord.root + 4));
    why = `É a 4ª sobre um acorde maior: choca com a 3ª (${third}). Use de passagem e resolva descendo.`;
  } else if (cls === 'passagem') {
    const down = n(nearestChordTone(c, ctx, -1));
    const up = n(nearestChordTone(c, ctx, 1));
    why = `Está na escala de ${keyLabel}, mas fora do acorde: soa bem de passagem, a caminho de ${down} ou ${up}.`;
  } else {
    const up = nearestInScale(c, ctx, 1);
    const down = nearestInScale(c, ctx, -1);
    const exits = [up, down].filter((x): x is Chroma => x !== null).map(n);
    why = `Fora da escala de ${keyLabel}. Funciona como cromatismo: resolva meio tom para ${exits.join(' ou ')}.`;
  }

  return { name, cls, degree, interval, why, goesTo };
}
