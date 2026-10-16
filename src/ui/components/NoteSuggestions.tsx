import { degreeLabel, chromaOf, midiName, prefersFlats } from '@/core/music';
import { useNoteSuggestions } from '@/store/selectors';
import { useMusicStore } from '@/store/useMusicStore';
import { CLASS_SHORT } from '../format';
import { Panel } from './controls';

export function NoteSuggestions({ onPlayMidi }: { onPlayMidi: (midi: number) => void }) {
  const suggestions = useNoteSuggestions();
  const lastNotes = useMusicStore((s) => s.lastNotes);
  const key = useMusicStore((s) => s.key);
  const clearNotes = useMusicStore((s) => s.clearNotes);
  const flats = prefersFlats(key);
  const tonic = chromaOf(key.tonic);

  return (
    <Panel
      title="Próxima nota"
      aside={
        lastNotes.length > 0 ? (
          <button type="button" className="link-button" onClick={clearNotes}>
            Limpar
          </button>
        ) : null
      }
    >
      {lastNotes.length === 0 ? (
        <p className="empty">
          Toque uma casa no braço (ou no uke, com o microfone) para ver as melhores próximas notas.
        </p>
      ) : (
        <>
          <p className="trail" aria-label="Últimas notas tocadas">
            {lastNotes.map((m, i) => (
              <span
                key={`${m}-${i}`}
                className="trail-note mono"
                data-latest={i === lastNotes.length - 1 || undefined}
              >
                {midiName(m, flats)}
              </span>
            ))}
            <span className="trail-next mono" aria-hidden="true">
              ?
            </span>
          </p>
          <ol className="suggestions">
            {suggestions.map((s, i) => (
              <li key={s.midi}>
                <button type="button" className="suggestion" onClick={() => onPlayMidi(s.midi)}>
                  <span className="suggestion-rank mono">{i + 1}</span>
                  <span className="suggestion-note" data-cls={s.cls}>
                    {midiName(s.midi, flats)}
                  </span>
                  <span className="suggestion-body">
                    <span className="suggestion-reason">{s.reason}</span>
                    <span className="suggestion-meta mono">
                      grau {degreeLabel(s.chroma, tonic)} · {CLASS_SHORT[s.cls]}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </>
      )}
    </Panel>
  );
}
