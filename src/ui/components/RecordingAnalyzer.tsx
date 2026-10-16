import { useId, useState } from 'react';
import { analyzeRecording, toMono, type RecordingEvent } from '@/audio/analysis/offline';
import { diatonicChords } from '@/core/harmony';
import { midiName, prefersFlats } from '@/core/music';
import { useMusicStore } from '@/store/useMusicStore';

type State =
  | { phase: 'idle' }
  | { phase: 'working'; name: string }
  | { phase: 'done'; name: string; events: RecordingEvent[] }
  | { phase: 'error'; message: string };

/** Analisa um arquivo de áudio com os mesmos detectores do microfone. */
export function RecordingAnalyzer() {
  const inputId = useId();
  const [state, setState] = useState<State>({ phase: 'idle' });
  const key = useMusicStore((s) => s.key);
  const setChord = useMusicStore((s) => s.setChord);
  const registerNote = useMusicStore((s) => s.registerNote);
  const flats = prefersFlats(key);

  async function analyze(file: File) {
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
        message: 'Não consegui ler esse arquivo. Tente um .wav, .mp3 ou .m4a.',
      });
    }
  }

  const chords = state.phase === 'done' ? state.events.filter((e) => e.kind === 'chord') : [];
  const notes = state.phase === 'done' ? state.events.filter((e) => e.kind === 'note') : [];

  return (
    <div className="recording">
      <label htmlFor={inputId} className="file-button">
        Analisar gravação
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
      <span className="muted small">Até 60 s. Fica tudo no seu aparelho.</span>

      {state.phase === 'working' ? <p role="status">Analisando {state.name}…</p> : null}
      {state.phase === 'error' ? (
        <p className="notice" role="alert">
          {state.message}
        </p>
      ) : null}
      {state.phase === 'done' ? (
        <div className="recording-result" role="status">
          <p className="small muted">
            {state.name}: {chords.length} acordes, {notes.length} notas (no tom de {key.tonic}).
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
                  <span className="mono muted">{e.time.toFixed(1)}s</span> {e.symbol}
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
                  {midiName(e.midi!, flats)}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
