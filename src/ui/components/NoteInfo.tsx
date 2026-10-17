import { useEffect, useRef } from 'react';
import type { NoteContext } from '@/core/classify';
import { explainNote } from '@/core/explain';
import { STRING_NAMES } from '@/core/fretboard';
import { midiName, prefersFlats } from '@/core/music';
import type { FretPosition, KeyContext } from '@/core/types';
import { CLASS_SHORT, keyLabelOf } from '../format';

interface NoteInfoProps {
  pos: FretPosition;
  ctx: NoteContext;
  keyContext: KeyContext;
  chordSymbol: string;
  /** Rótulo da escala usada; padrão: o tom atual. */
  scaleLabel?: string;
  onPlay: () => void;
  onClose: () => void;
}

/** Painel "por que essa cor?": explica a classe de uma casa do braço. */
export function NoteInfo({
  pos,
  ctx,
  keyContext,
  chordSymbol,
  scaleLabel,
  onPlay,
  onClose,
}: NoteInfoProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const flats = prefersFlats(keyContext);
  const e = explainNote(pos.chroma, ctx, {
    chordSymbol,
    keyLabel: scaleLabel ?? keyLabelOf(keyContext),
    flats,
  });

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        ev.stopImmediatePropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  return (
    <div
      className="note-info"
      role="dialog"
      aria-label={`Por que ${e.name} é ${CLASS_SHORT[e.cls]}`}
    >
      <div className="note-info-head">
        <span className="note-info-badge fb-dot" data-cls={e.cls} aria-hidden="true">
          {e.name}
        </span>
        <div className="note-info-title">
          <strong>
            {midiName(pos.midi, flats)} · {CLASS_SHORT[e.cls]}
          </strong>
          <span className="muted small">
            corda {STRING_NAMES[pos.string]}, casa {pos.fret} · {e.degree} em{' '}
            {keyLabelOf(keyContext)} · {e.interval} de {chordSymbol}
          </span>
        </div>
        <button
          ref={closeRef}
          type="button"
          className="practice-close note-info-close"
          onClick={onClose}
          aria-label="Fechar explicação"
        >
          <span aria-hidden="true" />
        </button>
      </div>
      <p className="note-info-why">{e.why}</p>
      <div className="note-info-actions">
        {e.goesTo ? (
          <span className="small">
            Tende a ir para <strong>{e.goesTo}</strong>
          </span>
        ) : (
          <span />
        )}
        <button type="button" className="button" onClick={onPlay}>
          Tocar {e.name}
        </button>
      </div>
    </div>
  );
}
