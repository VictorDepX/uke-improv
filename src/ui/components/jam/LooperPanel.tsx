import { useEffect, useState } from 'react';
import { MAX_LAYERS, looper } from '@/audio/looper/looper';
import { METERS } from '@/core/rhythm';
import { useActiveProgression } from '@/store/selectors';
import { useMusicStore } from '@/store/useMusicStore';
import { useLooper } from '../../hooks/useLooper';
import { Select, Slider, Toggle } from '../controls';

const BAR_OPTIONS = [1, 2, 4, 8].map((n) => ({
  value: String(n),
  label: `${n} ${n === 1 ? 'compasso' : 'compassos'}`,
}));

function Wave({ peaks }: { peaks: number[] }) {
  const w = peaks.length;
  return (
    <svg
      className="loop-wave"
      viewBox={`0 0 ${w} 20`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {peaks.map((p, i) => (
        <rect
          key={i}
          x={i + 0.15}
          width={0.7}
          y={10 - Math.max(0.5, p * 10)}
          height={Math.max(1, p * 20)}
        />
      ))}
    </svg>
  );
}

/** Looper: grave a própria base em camadas, no compasso, e solte o improviso por cima. */
export function LooperPanel() {
  const view = useLooper();
  const bpm = useMusicStore((s) => s.jam.bpm);
  const jamPlaying = useMusicStore((s) => s.jam.playing);
  const setJamPlaying = useMusicStore((s) => s.setJamPlaying);
  const { meter } = useActiveProgression();
  const [bars, setBars] = useState(4);
  const [metronome, setMetronome] = useState(true);
  const [offsetMs, setOffsetMs] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const empty = view.layers.length === 0 && view.status === 'idle';

  useEffect(() => {
    looper.configure({ bpm, meter, bars, metronome, latencyOffset: offsetMs / 1000 });
  }, [bpm, meter, bars, metronome, offsetMs]);

  const record = async () => {
    setError(null);
    if (jamPlaying) {
      // A base e o looper usam o mesmo relógio: a base para antes.
      setJamPlaying(false);
      await new Promise((r) => setTimeout(r, 80));
    }
    try {
      await looper.record();
    } catch {
      setError('Não consegui abrir o microfone para gravar. Verifique a permissão do navegador.');
      looper.clear();
    }
  };

  const busy = view.status === 'count' || view.status === 'recording';
  const full = view.layers.length >= MAX_LAYERS;
  const status =
    view.status === 'count'
      ? `Contagem…${view.countLeft ? ` ${view.countLeft}` : ''}`
      : view.status === 'recording'
        ? `${view.overdub ? 'Gravando camada' : 'Gravando'} · compasso ${Math.max(0, view.bar) + 1} de ${bars}`
        : view.status === 'playing'
          ? view.overdub
            ? 'A camada começa no próximo ciclo…'
            : `Tocando · compasso ${Math.max(0, view.bar) + 1} de ${bars}`
          : 'Parado';

  return (
    <div className="looper">
      <div className="looper-config">
        <Select
          id="looper-bars"
          label="Tamanho"
          value={String(bars)}
          options={BAR_OPTIONS}
          onChange={(v) => setBars(Number(v))}
        />
        <span className="small muted looper-tempo">
          {bpm} BPM · {METERS[meter].label}
          {empty ? ' (os da base)' : ''}
        </span>
        <Toggle
          id="looper-metronome"
          label="Metrônomo"
          hint="A contagem toca sempre."
          checked={metronome}
          onChange={setMetronome}
        />
      </div>

      <div className="looper-transport">
        <button
          type="button"
          className="button button-primary take-rec"
          data-on={busy || undefined}
          onClick={() => void record()}
          disabled={busy || full}
        >
          <span className="take-rec-dot" aria-hidden="true" />
          {empty
            ? 'Gravar loop'
            : full
              ? 'Camadas cheias'
              : `Gravar camada ${view.layers.length + 1}`}
        </button>
        {!empty ? (
          <button type="button" className="button" onClick={() => looper.clear()}>
            Parar e apagar
          </button>
        ) : null}
        <span
          className="looper-status mono"
          role="status"
          aria-live="polite"
          data-status={view.status}
        >
          {status}
        </span>
      </div>
      {!empty ? (
        <div className="beats looper-beats" aria-hidden="true">
          {Array.from({ length: bars }, (_, b) => (
            <span
              key={b}
              className="beat"
              data-on={(view.bar === b && view.status !== 'count') || undefined}
            />
          ))}
        </div>
      ) : null}

      {error ? (
        <p className="notice" role="alert">
          {error}
        </p>
      ) : null}

      {view.layers.length ? (
        <ul className="loop-layers" aria-label="Camadas do loop">
          {view.layers.map((l, i) => (
            <li key={l.id} className="loop-layer" data-muted={l.muted || undefined}>
              <span className="mono small">{i + 1}</span>
              <Wave peaks={l.peaks} />
              <Slider
                id={`${l.id}-vol`}
                label="Volume"
                min={0}
                max={100}
                value={Math.round(l.volume * 100)}
                display={`${Math.round(l.volume * 100)}%`}
                onChange={(v) => looper.setLayer(l.id, { volume: v / 100 })}
              />
              <button
                type="button"
                className="button"
                aria-pressed={l.muted}
                onClick={() => looper.setLayer(l.id, { muted: !l.muted })}
              >
                Silenciar
              </button>
              <button
                type="button"
                className="icon-button"
                aria-label={`Apagar camada ${i + 1}`}
                onClick={() => looper.removeLayer(l.id)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <details className="looper-latency">
        <summary className="small">Ajuste de atraso ({Math.round(view.latency * 1000)} ms)</summary>
        <Slider
          id="looper-latency"
          label="Ajuste fino"
          min={-100}
          max={200}
          value={offsetMs}
          display={`${offsetMs > 0 ? '+' : ''}${offsetMs} ms`}
          onChange={setOffsetMs}
        />
        <p className="small muted">
          Se a camada gravada soar atrasada em relação ao metrônomo, aumente; adiantada, diminua.
        </p>
      </details>
      <p className="small muted">
        Use fones: sem eles, o loop que toca entra no microfone quando você grava a próxima camada.
      </p>
    </div>
  );
}
