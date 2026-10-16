import { memo, useMemo, type CSSProperties } from 'react';
import { classifyNote, type NoteContext } from '@/core/classify';
import { FRET_COUNT, INLAY_FRETS, STRING_NAMES, fretPositions } from '@/core/fretboard';
import { chordInfo, midiName, prefersFlats } from '@/core/music';
import type {
  FretPosition,
  KeyContext,
  LabelMode,
  NoteClass,
  NoteSuggestion,
  TuningName,
} from '@/core/types';
import { CLASS_SHORT, noteLabel } from '../format';
import { useMediaQuery } from '../hooks/useMediaQuery';

export interface FretboardProps {
  ctx: NoteContext;
  keyContext: KeyContext;
  tuning: TuningName;
  labels: LabelMode;
  fretWindow: number | null;
  suggestions?: readonly NoteSuggestion[];
  lastMidi?: number | null;
  /** Acorde seguinte (modo jam): suas notas aparecem contornadas. */
  previewChord?: string | null;
  onPlay?: (pos: FretPosition) => void;
}

/**
 * Braço do uke como grade de botões (acessível por teclado e leitor de tela).
 * Horizontal em telas largas; vertical no celular, como um diagrama de acorde.
 */
export const Fretboard = memo(function Fretboard({
  ctx,
  keyContext,
  tuning,
  labels,
  fretWindow,
  suggestions = [],
  lastMidi = null,
  previewChord = null,
  onPlay,
}: FretboardProps) {
  const vertical = useMediaQuery('(max-width: 640px)');
  const flats = prefersFlats(keyContext);

  const frets = useMemo(() => {
    const all = Array.from({ length: FRET_COUNT + 1 }, (_, f) => f);
    if (fretWindow === null) return all;
    return [
      0,
      ...all.filter((f) => f >= Math.max(1, fretWindow) && f < Math.max(1, fretWindow) + 5),
    ];
  }, [fretWindow]);

  const rank = useMemo(() => {
    const m = new Map<number, number>();
    suggestions.forEach((s, i) => m.set(s.midi, i + 1));
    return m;
  }, [suggestions]);

  const preview = useMemo(() => {
    if (!previewChord) return null;
    return new Set(chordInfo(previewChord).stable);
  }, [previewChord]);

  const byString = useMemo(() => {
    const positions = fretPositions(tuning);
    return [0, 1, 2, 3].map((s) => positions.filter((p) => p.string === s));
  }, [tuning]);

  // Horizontal: 1ª corda (A) em cima, como tablatura. Vertical: G à esquerda, como diagrama.
  const strings = vertical ? [0, 1, 2, 3] : [3, 2, 1, 0];

  const cell = (pos: FretPosition) => {
    const cls: NoteClass = classifyNote(pos.chroma, ctx);
    const r = rank.get(pos.midi);
    const isLast = pos.midi === lastMidi;
    const inPreview = preview?.has(pos.chroma) ?? false;
    const common = inPreview && ctx.chord.stable.includes(pos.chroma);
    const label = noteLabel(pos.chroma, labels, keyContext, ctx.chord);
    const name = midiName(pos.midi, flats);
    const style = vertical
      ? ({ gridColumn: pos.string + 2, gridRow: frets.indexOf(pos.fret) + 2 } as CSSProperties)
      : ({
          gridRow: strings.indexOf(pos.string) + 2,
          gridColumn: frets.indexOf(pos.fret) + 2,
        } as CSSProperties);
    return (
      <button
        key={`${pos.string}-${pos.fret}`}
        type="button"
        className="fb-cell"
        data-fret={pos.fret === 0 ? 'open' : undefined}
        style={style}
        onClick={() => onPlay?.(pos)}
        aria-label={`${name}, corda ${STRING_NAMES[pos.string]}, casa ${pos.fret}: ${CLASS_SHORT[cls]}${r ? `, sugestão ${r}` : ''}`}
      >
        <span
          className="fb-dot"
          data-cls={cls}
          data-last={isLast || undefined}
          data-preview={inPreview ? (common ? 'common' : 'next') : undefined}
        >
          {cls !== 'fora' || isLast || r ? label : ''}
        </span>
        {r ? <span className="fb-rank">{r}</span> : null}
      </button>
    );
  };

  return (
    <div className="fb-scroll">
      <div
        className="fb"
        data-orientation={vertical ? 'vertical' : 'horizontal'}
        style={
          vertical
            ? { gridTemplateRows: `auto repeat(${frets.length}, var(--fb-cell-v))` }
            : { gridTemplateColumns: `auto repeat(${frets.length}, minmax(var(--fb-cell-h), 1fr))` }
        }
        role="group"
        aria-label="Braço do ukulele"
      >
        <div
          className="fb-wood"
          aria-hidden="true"
          style={
            vertical
              ? { gridRow: `3 / span ${frets.length - 1}`, gridColumn: '2 / span 4' }
              : { gridColumn: `3 / span ${frets.length - 1}`, gridRow: '2 / span 4' }
          }
        />
        {strings.map((s, i) => (
          <span
            key={`name-${s}`}
            className="fb-string-name"
            style={vertical ? { gridColumn: s + 2, gridRow: 1 } : { gridRow: i + 2, gridColumn: 1 }}
          >
            {STRING_NAMES[s]}
          </span>
        ))}
        {frets.map((f, i) => (
          <span
            key={`fret-${f}`}
            className="fb-fret-num"
            data-inlay={INLAY_FRETS.has(f) || undefined}
            style={vertical ? { gridRow: i + 2, gridColumn: 1 } : { gridColumn: i + 2, gridRow: 1 }}
          >
            {f === 0 ? '' : f}
          </span>
        ))}
        {strings.flatMap((s) => byString[s]!.filter((p) => frets.includes(p.fret)).map(cell))}
      </div>
    </div>
  );
});
