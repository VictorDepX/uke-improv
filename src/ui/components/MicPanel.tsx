import { useNoteContext } from '@/store/selectors';
import { useMusicStore } from '@/store/useMusicStore';
import { classifyNote } from '@/core/classify';
import { midiName, prefersFlats } from '@/core/music';
import { CLASS_SHORT } from '../format';
import { useMicControl } from '../hooks/useMicControl';
import { Panel, Toggle } from './controls';
import { RecordingAnalyzer } from './RecordingAnalyzer';

/** Módulo 2: escuta em tempo real, com afinador e indicador da classe da nota tocada. */
export function MicPanel() {
  const { status, start, stop } = useMicControl();
  const mic = useMusicStore((s) => s.mic);
  const key = useMusicStore((s) => s.key);
  const setMic = useMusicStore((s) => s.setMic);
  const ctx = useNoteContext();
  const flats = prefersFlats(key);
  const on = status === 'on';
  const cls = mic.note ? classifyNote(mic.note.midi, ctx) : null;
  const cents = mic.note?.cents ?? 0;

  return (
    <Panel
      title="Escuta"
      className="mic-panel"
      aside={
        <button
          type="button"
          className="mic-button"
          data-on={on || undefined}
          aria-pressed={on}
          disabled={status === 'starting'}
          onClick={() => (on ? stop() : void start())}
        >
          <span className="mic-button-dot" aria-hidden="true" />
          {on ? 'Desligar microfone' : status === 'starting' ? 'Abrindo…' : 'Ligar microfone'}
        </button>
      }
    >
      {on ? (
        <div className="mic-live">
          <div className="meter" aria-hidden="true">
            <span style={{ transform: `scaleX(${Math.min(1, mic.level * 8)})` }} />
          </div>
          <div className="mic-readout">
            <div>
              <span className="eyebrow">Nota</span>
              <span className="mic-note" data-cls={cls ?? undefined}>
                {mic.note ? midiName(mic.note.midi, flats) : '—'}
              </span>
              {cls ? <span className="mono muted">{CLASS_SHORT[cls]}</span> : null}
            </div>
            <div>
              <span className="eyebrow">Acorde</span>
              <span className="mic-note">{mic.chord?.symbol ?? '—'}</span>
              {mic.chord ? (
                <span className="mono muted">{Math.round(mic.chord.score * 100)}%</span>
              ) : null}
            </div>
          </div>
          <div
            className="tuner"
            role="meter"
            aria-label="Afinação"
            aria-valuemin={-50}
            aria-valuemax={50}
            aria-valuenow={cents}
          >
            <span className="tuner-center" aria-hidden="true" />
            <span
              className="tuner-needle"
              style={{ left: `${50 + cents}%` }}
              data-in-tune={Math.abs(cents) <= 5 || undefined}
            />
            <span className="tuner-scale mono" aria-hidden="true">
              <span>−50</span>
              <span>0</span>
              <span>+50 cents</span>
            </span>
          </div>
          <Toggle
            id="mic-follow"
            label="Acorde detectado vira o acorde atual"
            checked={mic.followChords}
            onChange={(v) => setMic({ followChords: v })}
          />
        </div>
      ) : (
        <div className="mic-off">
          {status === 'denied' || status === 'error' ? (
            <p className="notice" role="status">
              {mic.error} Verifique a permissão do microfone no navegador. Enquanto isso, analise
              uma gravação:
            </p>
          ) : (
            <p className="empty">
              Toque no uke perto do celular: a nota vira entrada para as sugestões e o acorde
              detectado pode virar o acorde atual.
            </p>
          )}
          <RecordingAnalyzer />
        </div>
      )}
    </Panel>
  );
}
