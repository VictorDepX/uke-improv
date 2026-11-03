import { chromaName, prefersFlats } from '@/core/music';
import { useNames, useT } from '@/i18n';
import { useChordSuggestions, useNoteSuggestions } from '@/store/selectors';
import { useMusicStore } from '@/store/useMusicStore';
import { NoteMark } from './NoteSuggestions';

/**
 * Resumo sob o braço no celular deitado: as 3 saídas da última nota e os 3 próximos acordes,
 * numa linha. O detalhe de cada um continua nos painéis abaixo.
 */
export function ExitsBar() {
  const t = useT();
  const n = useNames();
  const key = useMusicStore((s) => s.key);
  const lastNotes = useMusicStore((s) => s.lastNotes);
  const current = useMusicStore((s) => s.currentChord);
  const notes = useNoteSuggestions().slice(0, 3);
  const chords = useChordSuggestions(3);
  const flats = prefersFlats(key);
  const last = lastNotes.at(-1);
  return (
    <div className="exits-bar">
      <div className="exits-bar-part">
        <span className="field-label">
          {last === undefined
            ? t('Toque uma casa', 'Tap a fret')
            : t(
                `Depois de ${n(chromaName(last % 12, flats))}`,
                `After ${n(chromaName(last % 12, flats))}`,
              )}
        </span>
        {notes.map((s, i) => (
          <span key={s.midi} className="exits-bar-note">
            <span className="suggestion-rank mono">{i + 1}</span>
            <NoteMark cls={s.cls} label={n(chromaName(s.chroma, flats))} />
          </span>
        ))}
      </div>
      <div className="exits-bar-part">
        <span className="field-label">{t(`Depois de ${n(current)}`, `After ${n(current)}`)}</span>
        {chords.map((c) => (
          <span key={c.symbol} className="exits-bar-chord">
            <strong>{n(c.symbol)}</strong>
            <span className="mono">{c.numeral}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
