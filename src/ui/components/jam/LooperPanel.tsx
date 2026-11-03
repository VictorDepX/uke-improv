import { useEffect, useState } from 'react';
import { MAX_LAYERS, looper } from '@/audio/looper/looper';
import { useActiveProgression } from '@/store/selectors';
import { useMusicStore } from '@/store/useMusicStore';
import { useLooper } from '../../hooks/useLooper';
import { Select, Slider, Toggle } from '../controls';
import { useT } from '@/i18n';
import { Icon } from '../Icon';

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
  const t = useT();
  const barOptions = [1, 2, 4, 8].map((n) => ({
    value: String(n),
    label: t(`${n} ${n === 1 ? 'compasso' : 'compassos'}`, `${n} ${n === 1 ? 'bar' : 'bars'}`),
  }));
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
      setError(
        t(
          'Não consegui abrir o microfone para gravar. Verifique a permissão do navegador.',
          "Couldn't open the microphone to record. Check the browser permission.",
        ),
      );
      looper.clear();
    }
  };

  const busy = view.status === 'count' || view.status === 'recording';
  const full = view.layers.length >= MAX_LAYERS;
  const barOf = t(
    `compasso ${Math.max(0, view.bar) + 1} de ${bars}`,
    `bar ${Math.max(0, view.bar) + 1} of ${bars}`,
  );
  const status =
    view.status === 'count'
      ? `${t('Contagem…', 'Count-in…')}${view.countLeft ? ` ${view.countLeft}` : ''}`
      : view.status === 'recording'
        ? `${view.overdub ? t('Gravando camada', 'Recording layer') : t('Gravando', 'Recording')} · ${barOf}`
        : view.status === 'playing'
          ? view.overdub
            ? t('A camada começa no próximo ciclo…', 'The layer starts on the next cycle…')
            : `${t('Tocando', 'Playing')} · ${barOf}`
          : t('Parado', 'Stopped');

  return (
    <section className="side-block looper" aria-labelledby="looper-title">
      <h2 id="looper-title">Looper</h2>
      <div className="field-row looper-config">
        <Select
          id="looper-bars"
          label={t('Tamanho', 'Length')}
          value={String(bars)}
          options={barOptions}
          onChange={(v) => setBars(Number(v))}
        />
      </div>
      <Toggle
        id="looper-metronome"
        label={t('Metrônomo na gravação', 'Metronome while recording')}
        checked={metronome}
        onChange={setMetronome}
      />

      <button
        type="button"
        className="button take-rec looper-record"
        data-on={busy || undefined}
        onClick={() => void record()}
        disabled={busy || full}
      >
        <Icon name="record" />
        {empty
          ? t('Gravar loop', 'Record loop')
          : full
            ? t('Camadas cheias', 'Layers full')
            : t(
                `Gravar camada ${view.layers.length + 1}`,
                `Record layer ${view.layers.length + 1}`,
              )}
      </button>
      {!empty ? (
        <div className="looper-transport">
          <span
            className="looper-status mono"
            role="status"
            aria-live="polite"
            data-status={view.status}
          >
            {status}
          </span>
          <button type="button" className="button button-ghost" onClick={() => looper.clear()}>
            {t('Parar e apagar', 'Stop and clear')}
          </button>
        </div>
      ) : (
        <span className="sr-only" role="status" aria-live="polite">
          {busy ? status : ''}
        </span>
      )}
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
        <ul className="loop-layers" aria-label={t('Camadas do loop', 'Loop layers')}>
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
                className="button button-ghost"
                aria-pressed={l.muted}
                onClick={() => looper.setLayer(l.id, { muted: !l.muted })}
              >
                {t('Silenciar', 'Mute')}
              </button>
              <button
                type="button"
                className="icon-button"
                aria-label={t(`Apagar camada ${i + 1}`, `Delete layer ${i + 1}`)}
                onClick={() => looper.removeLayer(l.id)}
              >
                <Icon name="close" size={20} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <Slider
        id="looper-latency"
        label={t('Ajuste de atraso', 'Latency adjustment')}
        min={-100}
        max={200}
        value={offsetMs}
        display={`${Math.round(view.latency * 1000) + offsetMs} ms`}
        onChange={setOffsetMs}
      />
      <p className="side-hint">
        {t(
          'Use fones de ouvido: assim o microfone não grava a base junto. Se a camada soar atrasada, aumente o ajuste; adiantada, diminua.',
          "Use headphones so the microphone doesn't record the backing track too. If the layer sounds late, raise the adjustment; early, lower it.",
        )}
      </p>
    </section>
  );
}
