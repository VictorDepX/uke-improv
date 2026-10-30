import { useId, useState } from 'react';
import { analyzeRecording, toMono, type RecordingEvent } from '@/audio/analysis/offline';
import { diatonicChords } from '@/core/harmony';
import { midiName, prefersFlats } from '@/core/music';
import { useMusicStore } from '@/store/useMusicStore';
import { useNames, useT } from '@/i18n';

/** Só o primeiro minuto é analisado; arquivos maiores só gastariam memória ao decodificar. */
const MAX_RECORDING_BYTES = 50 * 1024 * 1024;

type State =
  | { phase: 'idle' }
  | { phase: 'working'; name: string }
  | { phase: 'done'; name: string; events: RecordingEvent[] }
  | { phase: 'error'; message: string };

/** Analisa um arquivo de áudio com os mesmos detectores do microfone. */
export function RecordingAnalyzer() {
  const t = useT();
  const n = useNames();
  const inputId = useId();
  const [state, setState] = useState<State>({ phase: 'idle' });
  const key = useMusicStore((s) => s.key);
  const setChord = useMusicStore((s) => s.setChord);
  const registerNote = useMusicStore((s) => s.registerNote);
  const flats = prefersFlats(key);

  async function analyze(file: File) {
    if (file.size > MAX_RECORDING_BYTES) {
      setState({
        phase: 'error',
        message: t(
          'Arquivo grande demais. Use uma gravação de até 50 MB (uns 5 minutos em .wav).',
          'File too large. Use a recording of up to 50 MB (about 5 minutes of .wav).',
        ),
      });
      return;
    }
    setState({ phase: 'working', name: file.name });
    try {
      const ctx = new OfflineAudioContext(1, 1, 44100);
      const buffer = await ctx.decodeAudioData(await file.arrayBuffer());
      const samples = toMono(buffer).subarray(0, buffer.sampleRate * 60);
      // Cede a vez ao navegador para a tela mostrar "Analisando…" antes do cálculo.
      await new Promise((r) => setTimeout(r, 30));
      const events = analyzeRecording(
        samples,
        buffer.sampleRate,
        diatonicChords(key).map((d) => d.symbol),
      );
      setState({ phase: 'done', name: file.name, events });
    } catch {
      setState({
        phase: 'error',
        message: t(
          'Não consegui ler esse arquivo. Tente um .wav, .mp3 ou .m4a.',
          "Couldn't read that file. Try a .wav, .mp3 or .m4a.",
        ),
      });
    }
  }

  const chords = state.phase === 'done' ? state.events.filter((e) => e.kind === 'chord') : [];
  const notes = state.phase === 'done' ? state.events.filter((e) => e.kind === 'note') : [];

  return (
    <div className="recording">
      <label htmlFor={inputId} className="file-button">
        {t('Analisar gravação', 'Analyze a recording')}
        <input
          id={inputId}
          type="file"
          accept="audio/*"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void analyze(f);
            e.target.value = '';
          }}
        />
      </label>
      <span className="muted small">
        {t('Até 60 s. Fica tudo no seu aparelho.', 'Up to 60 s. Everything stays on your device.')}
      </span>

      {state.phase === 'working' ? (
        <p role="status">
          {t('Analisando', 'Analyzing')} {state.name}…
        </p>
      ) : null}
      {state.phase === 'error' ? (
        <p className="notice" role="alert">
          {state.message}
        </p>
      ) : null}
      {state.phase === 'done' ? (
        <div className="recording-result" role="status">
          <p className="small muted">
            {t(
              `${state.name}: ${chords.length} acordes, ${notes.length} notas (no tom de ${n(key.tonic)}).`,
              `${state.name}: ${chords.length} chords, ${notes.length} notes (in the key of ${n(key.tonic)}).`,
            )}
          </p>
          {chords.length ? (
            <div className="recording-row">
              {chords.map((e, i) => (
                <button
                  key={`c${i}`}
                  type="button"
                  className="pill"
                  onClick={() => setChord(e.symbol!)}
                >
                  <span className="mono muted">{e.time.toFixed(1)}s</span> {n(e.symbol!)}
                </button>
              ))}
            </div>
          ) : null}
          {notes.length ? (
            <div className="recording-row">
              {notes.slice(0, 24).map((e, i) => (
                <button
                  key={`n${i}`}
                  type="button"
                  className="pill"
                  onClick={() => registerNote(e.midi!)}
                >
                  {n(midiName(e.midi!, flats))}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
