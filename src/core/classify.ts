import { chordInfo, chromaOf, mod12, scaleChromas } from './music';
import type { ChordInfo, Chroma, KeyContext, NoteClass } from './types';

export interface NoteContext {
  tonic: Chroma;
  scale: ReadonlySet<Chroma>;
  chord: ChordInfo;
}

export function buildNoteContext(key: KeyContext, chordSymbol: string): NoteContext {
  return {
    tonic: chromaOf(key.tonic),
    scale: new Set(scaleChromas(key)),
    chord: chordInfo(chordSymbol),
  };
}

/** Sensível: meio tom abaixo da tônica, quando pertence à escala. */
export function isLeadingTone(chroma: Chroma, ctx: NoteContext): boolean {
  const lt = mod12(ctx.tonic - 1);
  return chroma === lt && ctx.scale.has(lt);
}

/** Quarta justa sobre acorde maior: "nota a evitar" que puxa para a terça. */
export function isAvoidFourth(chroma: Chroma, ctx: NoteContext): boolean {
  return ctx.chord.isMajor && mod12(chroma - ctx.chord.root) === 5;
}

export function classifyNote(chroma: Chroma, ctx: NoteContext): NoteClass {
  const c = mod12(chroma);
  if (ctx.chord.stable.includes(c)) return 'repouso';
  if (ctx.chord.seventh === c) return 'tensao';
  if (!ctx.scale.has(c)) return 'fora';
  if (isLeadingTone(c, ctx) || isAvoidFourth(c, ctx)) return 'tensao';
  return 'passagem';
}

export const NOTE_CLASS_LABEL: Record<NoteClass, string> = {
  repouso: 'Repouso',
  passagem: 'Passagem',
  tensao: 'Tensão',
  fora: 'Fora da escala',
};
