import { useCallback } from 'react';
import { playNote } from '@/audio/engine/sound';
import { chromaName, midiName, prefersFlats } from '@/core/music';
import { useNames, useT } from '@/i18n';
import { useNoteSuggestions } from '@/store/selectors';
import { useMusicStore } from '@/store/useMusicStore';
import { CLASS_TITLE, sentence } from '../../format';
import { NoteMark } from '../NoteSuggestions';

/**
 * Guia do modo prática, embaixo do braço: as 3 melhores próximas notas a partir da última,
 * sempre outra nota (o motor não sugere repetir). Tocar uma sugestão faz soar e conta como
 * a nota tocada, como uma casa do braço.
 */
export function PracticeNext() {
  const t = useT();
  const n = useNames();
  const suggestions = useNoteSuggestions().slice(0, 3);
  const last = useMusicStore((s) => s.lastNotes.at(-1));
  const key = useMusicStore((s) => s.key);
  const registerNote = useMusicStore((s) => s.registerNote);
  const flats = prefersFlats(key);
  const play = useCallback(
    (midi: number) => {
      registerNote(midi);
      void playNote(midi);
    },
    [registerNote],
  );
  const lastName = last === undefined ? '' : n(chromaName(last % 12, flats));

  return (
    <section
      className="practice-next"
      aria-label={
        last === undefined
          ? t('Próximas notas', 'Next notes')
          : t(`Próximas notas depois de ${lastName}`, `Next notes after ${lastName}`)
      }
    >
      <span className="practice-next-label" aria-hidden="true">
        {last === undefined
          ? t('Próximas', 'Next')
          : t(`Depois de ${lastName}`, `After ${lastName}`)}
      </span>
      {last === undefined ? (
        <p className="practice-next-empty">
          {t(
            'Toque uma casa: aqui aparecem as 3 melhores próximas notas.',
            'Tap a fret: the 3 best next notes show up here.',
          )}
        </p>
      ) : (
        <ol className="practice-next-list" aria-live="polite">
          {suggestions.map((s, i) => {
            const up = s.midi > last;
            return (
              <li key={s.midi}>
                <button type="button" className="practice-next-item" onClick={() => play(s.midi)}>
                  <span className="practice-next-rank mono" aria-hidden="true">
                    {i + 1}
                  </span>
                  <NoteMark cls={s.cls} label={n(chromaName(s.chroma, flats))} />
                  <span className="practice-next-body">
                    <span className="practice-next-title">
                      {t(CLASS_TITLE[s.cls])}
                      <span className="practice-next-move">
                        {' · '}
                        {up ? t('sobe', 'up') : t('desce', 'down')}
                      </span>
                      <span className="sr-only">: {n(midiName(s.midi, flats))}</span>
                    </span>
                    <span className="practice-next-reason">{sentence(t(s.reason))}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
