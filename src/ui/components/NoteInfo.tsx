import { useEffect, useRef } from 'react';
import type { NoteContext } from '@/core/classify';
import { explainNote } from '@/core/explain';
import { STRING_NAMES } from '@/core/fretboard';
import { midiName, prefersFlats } from '@/core/music';
import type { FretPosition, KeyContext } from '@/core/types';
import { tx, useNames, useT, type Txt } from '@/i18n';
import { CLASS_SHORT, keyLabelOf } from '../format';

interface NoteInfoProps {
  pos: FretPosition;
  ctx: NoteContext;
  keyContext: KeyContext;
  chordSymbol: string;
  /** Rótulo da escala usada; padrão: o tom atual. */
  scaleLabel?: Txt;
  /** Casa do capotraste, para mostrar a casa física. */
  capo?: number;
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
  capo = 0,
  onPlay,
  onClose,
}: NoteInfoProps) {
  const t = useT();
  const n = useNames();
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
      aria-label={t(
        `Por que ${n(e.name)} é ${t(CLASS_SHORT[e.cls])}`,
        `Why ${n(e.name)} is ${t(CLASS_SHORT[e.cls])}`,
      )}
    >
      <div className="note-info-head">
        <span className="note-info-badge fb-dot" data-cls={e.cls} aria-hidden="true">
          {n(e.name)}
        </span>
        <div className="note-info-title">
          <strong>
            {n(midiName(pos.midi, flats))} · {t(CLASS_SHORT[e.cls])}
          </strong>
          <span className="muted small">
            {t(
              tx(
                `corda ${n(STRING_NAMES[pos.string]!)}, casa ${pos.fret + capo} · ${e.degree.pt} em ${keyLabelOf(keyContext).pt} · ${e.interval.pt} de ${n(chordSymbol)}`,
                `${n(STRING_NAMES[pos.string]!)} string, fret ${pos.fret + capo} · ${e.degree.en} in ${keyLabelOf(keyContext).en} · ${e.interval.en} of ${n(chordSymbol)}`,
              ),
            )}
          </span>
        </div>
        <button
          ref={closeRef}
          type="button"
          className="practice-close note-info-close"
          onClick={onClose}
          aria-label={t('Fechar explicação', 'Close explanation')}
        >
          <span aria-hidden="true" />
        </button>
      </div>
      <p className="note-info-why">{t(e.why)}</p>
      <div className="note-info-actions">
        {e.goesTo ? (
          <span className="small">
            {t('Tende a ir para', 'Tends to go to')} <strong>{t(e.goesTo)}</strong>
          </span>
        ) : (
          <span />
        )}
        <button type="button" className="button" onClick={onPlay}>
          {t('Tocar', 'Play')} {n(e.name)}
        </button>
      </div>
    </div>
  );
}
