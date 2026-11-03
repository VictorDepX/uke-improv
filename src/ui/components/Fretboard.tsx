import {
  memo,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from 'react';
import { classifyNote, type NoteContext } from '@/core/classify';
import {
  FRET_COUNT,
  INLAY_FRETS,
  STRING_NAMES,
  WINDOW_SIZE,
  clampWindowStart,
  fretPositions,
} from '@/core/fretboard';
import { chordInfo, midiName, prefersFlats } from '@/core/music';
import type {
  FretPosition,
  KeyContext,
  LabelMode,
  NoteClass,
  NoteSuggestion,
  TuningName,
} from '@/core/types';
import { useNames, useT } from '@/i18n';
import { CLASS_SHORT, noteLabel } from '../format';
import { useMediaQuery } from '../hooks/useMediaQuery';

const LONG_PRESS_MS = 450;

export interface LastNote {
  string: number;
  fret: number;
  midi: number;
  heard: boolean;
}

export interface FretboardProps {
  ctx: NoteContext;
  keyContext: KeyContext;
  tuning: TuningName;
  /** Casa do capotraste (0 = sem). As casas do braço contam a partir dele. */
  capo?: number;
  labels: LabelMode;
  fretWindow: number | null;
  suggestions?: readonly NoteSuggestion[];
  /**
   * Última nota: a posição tocada. Com `heard` (só a altura veio, ex.: microfone), as outras
   * casas com a mesma nota ganham um contorno pontilhado, porque podem ter sido elas.
   */
  last?: LastNote | null;
  /** Acorde seguinte (modo jam): suas notas aparecem contornadas. */
  previewChord?: string | null;
  onPlay?: (pos: FretPosition) => void;
  /** Toque longo ou clique direito: pede a explicação da nota. */
  onInspect?: (pos: FretPosition) => void;
}

/**
 * Braço do uke como grade de botões (acessível por teclado e leitor de tela).
 * Horizontal em telas largas; vertical no celular, como um diagrama de acorde.
 */
export const Fretboard = memo(function Fretboard({
  ctx,
  keyContext,
  tuning,
  capo = 0,
  labels,
  fretWindow,
  suggestions = [],
  last = null,
  previewChord = null,
  onPlay,
  onInspect,
}: FretboardProps) {
  // Toque longo: um só ponteiro por vez, então um ref basta para o braço inteiro.
  const press = useRef<{ timer: number; x: number; y: number; fired: boolean } | null>(null);
  const cancelPress = () => {
    if (press.current) window.clearTimeout(press.current.timer);
  };
  const vertical = useMediaQuery('(max-width: 640px) and (min-height: 541px)');
  const flats = prefersFlats(keyContext);
  const t = useT();
  const n = useNames();

  const frets = useMemo(() => {
    const all = Array.from({ length: FRET_COUNT - capo + 1 }, (_, f) => f);
    if (fretWindow === null) return all;
    const start = clampWindowStart(fretWindow, capo);
    return [0, ...all.filter((f) => f >= start && f < start + WINDOW_SIZE)];
  }, [fretWindow, capo]);

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
    const positions = fretPositions(tuning, capo);
    return [0, 1, 2, 3].map((s) => positions.filter((p) => p.string === s));
  }, [tuning, capo]);

  // Horizontal: 1ª corda (A) em cima, como tablatura. Vertical: G à esquerda, como diagrama.
  const strings = vertical ? [0, 1, 2, 3] : [3, 2, 1, 0];

  // Teclado: o braço é uma parada só no Tab; as setas andam entre as casas (tabindex móvel).
  const [focusPos, setFocusPos] = useState({ string: strings[0]!, fret: frets[0]! });
  const tabStop = frets.includes(focusPos.fret)
    ? focusPos
    : { string: strings[0]!, fret: frets[0]! };
  const hintId = useId();
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const el = e.target as HTMLElement;
    const string = Number(el.dataset.string);
    const fret = Number(el.dataset.fretNum);
    if (Number.isNaN(string) || Number.isNaN(fret)) return;
    if (e.key === 'i' && onInspect) {
      e.preventDefault();
      const pos = byString[string]!.find((p) => p.fret === fret);
      if (pos) onInspect(pos);
      return;
    }
    // Passo em [casa, corda] por seta; no braço vertical as casas correm para baixo.
    // Canhoto (braço espelhado por direction: rtl): esquerda e direita trocam de sentido.
    const flip = getComputedStyle(e.currentTarget).direction === 'rtl' ? -1 : 1;
    const steps: Record<string, [number, number]> = vertical
      ? { ArrowDown: [1, 0], ArrowUp: [-1, 0], ArrowRight: [0, flip], ArrowLeft: [0, -flip] }
      : { ArrowRight: [flip, 0], ArrowLeft: [-flip, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] };
    const jump: Record<string, number> = { Home: -Infinity, End: Infinity };
    const step = steps[e.key];
    if (!step && !(e.key in jump)) return;
    e.preventDefault();
    const clamp = (i: number, len: number) => Math.max(0, Math.min(len - 1, i));
    const fi = step
      ? clamp(frets.indexOf(fret) + step[0], frets.length)
      : jump[e.key]! < 0
        ? 0
        : frets.length - 1;
    const si = step ? clamp(strings.indexOf(string) + step[1], 4) : strings.indexOf(string);
    const next = { string: strings[si]!, fret: frets[fi]! };
    setFocusPos(next);
    e.currentTarget
      .querySelector<HTMLElement>(`[data-string="${next.string}"][data-fret-num="${next.fret}"]`)
      ?.focus();
  };

  const cell = (pos: FretPosition) => {
    const cls: NoteClass = classifyNote(pos.chroma, ctx);
    const r = rank.get(pos.midi);
    const isLast = last !== null && pos.string === last.string && pos.fret === last.fret;
    const isAlt = !isLast && last !== null && last.heard && pos.midi === last.midi;
    const inPreview = preview?.has(pos.chroma) ?? false;
    const common = inPreview && ctx.chord.stable.includes(pos.chroma);
    const raw = noteLabel(pos.chroma, labels, keyContext, ctx.chord);
    const label = labels === 'note' ? n(raw) : raw;
    const name = n(midiName(pos.midi, flats));
    const stringName = n(STRING_NAMES[pos.string]!);
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
        data-string={pos.string}
        data-fret-num={pos.fret}
        tabIndex={pos.string === tabStop.string && pos.fret === tabStop.fret ? 0 : -1}
        onFocus={() => setFocusPos({ string: pos.string, fret: pos.fret })}
        style={style}
        onClick={() => {
          if (press.current?.fired) {
            press.current = null;
            return;
          }
          onPlay?.(pos);
        }}
        onPointerDown={(e) => {
          if (!onInspect) return;
          cancelPress();
          const timer = window.setTimeout(() => {
            if (press.current) press.current.fired = true;
            onInspect(pos);
          }, LONG_PRESS_MS);
          press.current = { timer, x: e.clientX, y: e.clientY, fired: false };
        }}
        onPointerMove={(e) => {
          const p = press.current;
          if (p && !p.fired && Math.hypot(e.clientX - p.x, e.clientY - p.y) > 10) cancelPress();
        }}
        onPointerUp={cancelPress}
        onPointerCancel={cancelPress}
        onPointerLeave={cancelPress}
        onContextMenu={(e) => {
          if (!onInspect) return;
          e.preventDefault();
          cancelPress();
          onInspect(pos);
        }}
        aria-label={t(
          `${name}, corda ${stringName}, ${pos.fret === 0 && capo ? `capo na casa ${capo}` : `casa ${pos.fret + capo}`}: ${t(CLASS_SHORT[cls])}${r ? `, sugestão ${r}` : ''}`,
          `${name}, ${stringName} string, ${pos.fret === 0 && capo ? `capo at fret ${capo}` : `fret ${pos.fret + capo}`}: ${t(CLASS_SHORT[cls])}${r ? `, suggestion ${r}` : ''}`,
        )}
      >
        <span
          className="fb-dot"
          data-cls={cls}
          data-last={isLast || undefined}
          data-alt={isAlt || undefined}
          data-preview={inPreview ? (common ? 'common' : 'next') : undefined}
        >
          {cls !== 'fora' || isLast || isAlt || r ? label : ''}
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
        data-windowed={(frets[1] ?? 1) > 1 || undefined}
        data-capo={capo || undefined}
        style={
          vertical
            ? { gridTemplateRows: `auto repeat(${frets.length}, var(--fb-cell-v))` }
            : {
                gridTemplateColumns: `34px 54px repeat(${frets.length - 1}, minmax(var(--fb-cell-h), 1fr))`,
              }
        }
        role="group"
        aria-label={t('Braço do ukulele', 'Ukulele fretboard')}
        aria-describedby={hintId}
        onKeyDown={onKeyDown}
      >
        <span id={hintId} className="sr-only">
          {t(
            'Setas andam entre as casas; Enter toca a nota; I explica a cor.',
            'Arrow keys move between frets; Enter plays the note; I explains the color.',
          )}
        </span>
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
            {n(STRING_NAMES[s]!)}
          </span>
        ))}
        {frets.map((f, i) => (
          <span
            key={`fret-${f}`}
            className="fb-fret-num"
            data-inlay={INLAY_FRETS.has(f + capo) || undefined}
            data-capo={(f === 0 && capo > 0) || undefined}
            style={vertical ? { gridRow: i + 2, gridColumn: 1 } : { gridColumn: i + 2, gridRow: 1 }}
          >
            {f === 0 ? (capo ? `C${capo}` : '') : f + capo}
          </span>
        ))}
        {frets.flatMap((f, i) => {
          if (f === 0 || !INLAY_FRETS.has(f + capo)) return [];
          // Uma marcação no meio do braço; na 12ª, duas (entre as cordas de fora).
          const spans = f + capo === 12 ? ['2 / span 2', '4 / span 2'] : ['3 / span 2'];
          return spans.map((span) => (
            <span
              key={`inlay-${f}-${span}`}
              className="fb-inlay"
              aria-hidden="true"
              style={
                vertical
                  ? { gridRow: i + 2, gridColumn: span }
                  : { gridColumn: i + 2, gridRow: span }
              }
            />
          ));
        })}
        {strings.flatMap((s) => byString[s]!.filter((p) => frets.includes(p.fret)).map(cell))}
      </div>
    </div>
  );
});
