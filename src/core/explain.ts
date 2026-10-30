import { nm, tx, type Txt } from '@/i18n/lang';
import { classifyNote, isAvoidFourth, isLeadingTone, type NoteContext } from './classify';
import { chromaName, mod12 } from './music';
import { tendencyOf } from './suggestNotes';
import type { Chroma, NoteClass } from './types';

const INTERVAL_NAMES: readonly Txt[] = [
  tx('fundamental', 'root'),
  tx('2ª menor', 'minor 2nd'),
  tx('2ª maior', 'major 2nd'),
  tx('3ª menor', 'minor 3rd'),
  tx('3ª maior', 'major 3rd'),
  tx('4ª justa', 'perfect 4th'),
  tx('5ª diminuta', 'diminished 5th'),
  tx('5ª justa', 'perfect 5th'),
  tx('6ª menor', 'minor 6th'),
  tx('6ª maior', 'major 6th'),
  tx('7ª menor', 'minor 7th'),
  tx('7ª maior', 'major 7th'),
];

const DEGREE_NAMES: readonly Txt[] = [
  tx('tônica', 'tonic'),
  tx('2º grau abaixado', 'flat 2nd degree'),
  tx('2º grau', '2nd degree'),
  tx('3º grau menor', 'minor 3rd degree'),
  tx('3º grau', '3rd degree'),
  tx('4º grau', '4th degree'),
  tx('4º grau aumentado', 'augmented 4th degree'),
  tx('5º grau', '5th degree'),
  tx('6º grau menor', 'minor 6th degree'),
  tx('6º grau', '6th degree'),
  tx('7º grau menor', 'minor 7th degree'),
  tx('sensível', 'leading tone'),
];

export interface NoteExplanation {
  name: string;
  cls: NoteClass;
  /** Grau no tom, por extenso. */
  degree: Txt;
  /** Intervalo em relação à fundamental do acorde. */
  interval: Txt;
  /** Por que a nota recebeu essa cor. */
  why: Txt;
  /** Para onde a nota tende a ir, se tiver tendência. */
  goesTo: Txt | null;
}

export interface ExplainOptions {
  chordSymbol: string;
  /** Tom por extenso (ex.: "C maior"), com o nome da tônica marcado por `nm`. */
  keyLabel: Txt;
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

const joinOr = (items: string[]): Txt => tx(items.join(' ou '), items.join(' or '));

/** Explica, em linguagem simples, a cor que uma nota recebe no braço. */
export function explainNote(
  chroma: Chroma,
  ctx: NoteContext,
  { chordSymbol, keyLabel, flats }: ExplainOptions,
): NoteExplanation {
  const c = mod12(chroma);
  const name = chromaName(c, flats);
  const n = (x: Chroma) => nm(chromaName(x, flats));
  const chord = nm(chordSymbol);
  const cls = classifyNote(c, ctx);
  const interval = INTERVAL_NAMES[mod12(c - ctx.chord.root)]!;
  const degree = DEGREE_NAMES[mod12(c - ctx.tonic)]!;
  const targets = tendencyOf(60 + c, ctx)?.targets.map((m) => n(m)) ?? [];
  const goesTo = targets.length ? joinOr(targets) : null;

  let why: Txt;
  if (cls === 'repouso') {
    why = tx(
      `É a ${interval.pt} de ${chord}: nota do acorde, soa estável. Bom lugar para terminar uma frase.`,
      `It is the ${interval.en} of ${chord}: a chord tone, it sounds stable. A good place to end a phrase.`,
    );
  } else if (ctx.chord.seventh === c) {
    why = tx(
      `É a ${interval.pt} de ${chord}: faz parte do acorde, mas cria tensão e quer descer.`,
      `It is the ${interval.en} of ${chord}: part of the chord, but it creates tension and wants to fall.`,
    );
  } else if (isLeadingTone(c, ctx)) {
    const tonic = n(ctx.tonic);
    why = tx(
      `É a sensível do tom: fica meio tom abaixo da tônica (${tonic}) e puxa forte para ela.`,
      `It is the leading tone of the key: a half step below the tonic (${tonic}) and pulls hard toward it.`,
    );
  } else if (isAvoidFourth(c, ctx)) {
    const third = n(mod12(ctx.chord.root + 4));
    why = tx(
      `É a 4ª sobre um acorde maior: choca com a 3ª (${third}). Use de passagem e resolva descendo.`,
      `It is the 4th over a major chord: it clashes with the 3rd (${third}). Use it in passing and resolve down.`,
    );
  } else if (cls === 'passagem') {
    const down = n(nearestChordTone(c, ctx, -1));
    const up = n(nearestChordTone(c, ctx, 1));
    why = tx(
      `Está na escala de ${keyLabel.pt}, mas fora do acorde: soa bem de passagem, a caminho de ${down} ou ${up}.`,
      `It is in the ${keyLabel.en} scale but outside the chord: it works in passing, on the way to ${down} or ${up}.`,
    );
  } else {
    const up = nearestInScale(c, ctx, 1);
    const down = nearestInScale(c, ctx, -1);
    const exits = joinOr([up, down].filter((x): x is Chroma => x !== null).map(n));
    why = tx(
      `Fora da escala de ${keyLabel.pt}. Funciona como cromatismo: resolva meio tom para ${exits.pt}.`,
      `Outside the ${keyLabel.en} scale. It works as a chromatic note: resolve a half step to ${exits.en}.`,
    );
  }

  return { name, cls, degree, interval, why, goesTo };
}
