import { chromaName, midiName, prefersFlats } from '@/core/music';
import type { NoteClass } from '@/core/types';
import { useNames, useT } from '@/i18n';
import { CLASS_TITLE, sentence } from '../format';
import { useNoteSuggestions } from '@/store/selectors';
import { useMusicStore } from '@/store/useMusicStore';

/** Marcador de nota fora do braço: mesma cor e forma da casa. */
export function NoteMark({ cls, label }: { cls: NoteClass; label: string }) {
  return (
    <span className="note-mark" data-cls={cls} aria-hidden="true">
      <span>{label}</span>
    </span>
  );
}

/** "Saídas de E": as 3 melhores próximas notas a partir da última tocada. */
export function NoteSuggestions({ onPlayMidi }: { onPlayMidi: (midi: number) => void }) {
  const t = useT();
  const n = useNames();
  const suggestions = useNoteSuggestions().slice(0, 3);
  const lastNotes = useMusicStore((s) => s.lastNotes);
  const key = useMusicStore((s) => s.key);
  const clearNotes = useMusicStore((s) => s.clearNotes);
  const flats = prefersFlats(key);
  const last = lastNotes.at(-1);
  const lastName = last === undefined ? '' : n(chromaName(last % 12, flats));

  return (
    <section className="note-exits" aria-labelledby="note-exits-title">
      <div className="note-exits-head">
        <h2 id="note-exits-title">
          {last === undefined
            ? t('Saídas', 'Next notes')
            : t(`Saídas de ${lastName}`, `After ${lastName}`)}
        </h2>
        {lastNotes.length > 0 ? (
          <p className="trail" aria-label={t('Últimas notas tocadas', 'Last notes played')}>
            {lastNotes.map((m, i) => (
              <span
                key={`${m}-${i}`}
                className="trail-note mono"
                data-latest={i === lastNotes.length - 1 || undefined}
              >
                {n(midiName(m, flats))}
              </span>
            ))}
            <button type="button" className="link-button" onClick={clearNotes}>
              {t('Limpar', 'Clear')}
            </button>
          </p>
        ) : null}
      </div>
      {last === undefined ? (
        <p className="empty">
          {t(
            'Toque uma casa no braço (ou no uke, com o microfone) para ver as melhores próximas notas.',
            'Tap a fret on the fretboard (or play your uke, with the microphone) to see the best next notes.',
          )}
        </p>
      ) : (
        <ol className="suggestions">
          {suggestions.map((s, i) => (
            <li key={s.midi}>
              <button type="button" className="suggestion" onClick={() => onPlayMidi(s.midi)}>
                <span className="suggestion-rank mono">{i + 1}</span>
                <NoteMark cls={s.cls} label={n(chromaName(s.chroma, flats))} />
                <span className="suggestion-body">
                  <span className="suggestion-title">
                    {t(CLASS_TITLE[s.cls])}
                    <span className="sr-only">: {n(midiName(s.midi, flats))}</span>
                  </span>
                  <span className="suggestion-reason">{sentence(t(s.reason))}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
