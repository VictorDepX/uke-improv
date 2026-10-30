import { toast } from '../toast';
import { useEffect, useMemo, useRef, useState } from 'react';
import { buildNoteContext } from '@/core/classify';
import { midiName, prefersFlats } from '@/core/music';
import { noteIndexAt, summarizeTake, takeAdvice } from '@/core/take';
import { useMusicStore } from '@/store/useMusicStore';
import { CLASS_SHORT } from '../format';
import { MAX_TAKE_SECONDS, useTakes, type Take } from '../hooks/useTakes';
import { Fretboard } from './Fretboard';
import { useNames, useT } from '@/i18n';

const clock = (s: number) => {
  const total = Math.max(0, Math.floor(s));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

const pct = (x: number) => `${Math.round(x * 100)}%`;

/** Ouve a gravação com a nota de cada momento marcada no braço e um resumo do que soou. */
function TakePlayer({ take, onRemove }: { take: Take; onRemove: () => void }) {
  const t = useT();
  const nn = useNames();
  const audio = useRef<HTMLAudioElement>(null);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const settings = useMusicStore((s) => s.settings);
  const flats = prefersFlats(take.key);
  const summary = useMemo(() => summarizeTake(take.notes), [take.notes]);
  const idx = noteIndexAt(take.notes, time);
  const note = idx >= 0 ? take.notes[idx]! : null;
  const chord = note?.chord ?? take.notes[0]?.chord ?? null;
  const ctx = useMemo(
    () => (chord ? buildNoteContext(take.key, chord, settings.arpeggio) : null),
    [chord, take.key, settings.arpeggio],
  );

  // Durante a reprodução, acompanha o tempo a cada quadro (timeupdate é lento demais).
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const tick = () => {
      if (audio.current) setTime(audio.current.currentTime);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  const seek = (at: number) => {
    if (audio.current) audio.current.currentTime = at;
    setTime(at);
  };

  const download = () => {
    const a = document.createElement('a');
    a.href = take.url;
    const ext = take.blob.type.includes('mp4')
      ? 'm4a'
      : take.blob.type.includes('ogg')
        ? 'ogg'
        : 'webm';
    a.download = `improviso-${new Date(take.createdAt).toISOString().slice(0, 16).replace(/[:T]/g, '-')}.${ext}`;
    a.click();
  };

  return (
    <div
      className="take"
      role="region"
      aria-label={t(`Gravação de ${clock(take.duration)}`, `${clock(take.duration)} recording`)}
    >
      <div className="take-head">
        <audio
          ref={audio}
          src={take.url}
          controls
          preload="auto"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onSeeked={(e) => setTime(e.currentTarget.currentTime)}
        />
        {__PWA__ ? (
          // A página avulsa (artifact) não pode oferecer download de arquivo.
          <button type="button" className="link-button" onClick={download}>
            {t('Baixar', 'Download')}
          </button>
        ) : null}
        <button type="button" className="link-button" onClick={onRemove}>
          {t('Apagar', 'Delete')}
        </button>
      </div>

      <div className="take-timeline" aria-label={t('Notas da gravação', 'Notes in the recording')}>
        {take.notes.map((n, i) => (
          <button
            key={`${n.t}-${i}`}
            type="button"
            className="take-note"
            data-cls={n.cls}
            data-current={i === idx || undefined}
            style={{ left: `${(n.t / Math.max(take.duration, 0.1)) * 100}%` }}
            onClick={() => seek(n.t)}
            aria-label={t(
              `${nn(midiName(n.midi, flats))} em ${clock(n.t)}: ${t(CLASS_SHORT[n.cls])} sobre ${nn(n.chord)}`,
              `${nn(midiName(n.midi, flats))} at ${clock(n.t)}: ${t(CLASS_SHORT[n.cls])} over ${nn(n.chord)}`,
            )}
            title={`${nn(midiName(n.midi, flats))} · ${nn(n.chord)}`}
          />
        ))}
        <span
          className="take-cursor"
          aria-hidden="true"
          style={{ left: `${Math.min(1, time / Math.max(take.duration, 0.1)) * 100}%` }}
        />
      </div>

      <p className="take-now small" aria-live="polite">
        {note ? (
          <>
            <strong>{nn(midiName(note.midi, flats))}</strong> {t('sobre', 'over')} {nn(note.chord)}:{' '}
            <span data-cls={note.cls} className="take-cls">
              {t(CLASS_SHORT[note.cls])}
            </span>
          </>
        ) : (
          <span className="muted">
            {t(
              'Dê play: a nota de cada momento aparece no braço.',
              'Press play: the note at each moment shows on the fretboard.',
            )}
          </span>
        )}
      </p>

      {ctx ? (
        <div className="take-board">
          <Fretboard
            ctx={ctx}
            keyContext={take.key}
            tuning={settings.tuning}
            capo={settings.capo}
            labels={settings.labels}
            fretWindow={null}
            last={
              note
                ? {
                    string: note.pos?.string ?? -1,
                    fret: note.pos?.fret ?? -1,
                    midi: note.midi,
                    heard: true,
                  }
                : null
            }
          />
        </div>
      ) : null}

      <div className="take-summary">
        <span>
          <strong>{summary.total}</strong> {t('notas', 'notes')}
        </span>
        <span data-cls="repouso">
          {pct(summary.chordTones)} {t('do acorde', 'chord tones')}
        </span>
        <span>
          {pct(summary.inScale)} {t('na escala', 'in the scale')}
        </span>
        <span data-cls="tensao">
          {summary.resolved}/{summary.tensions} {t('tensões resolvidas', 'tensions resolved')}
        </span>
        {summary.longestOut > 1 ? (
          <span data-cls="fora">
            {summary.longestOut} {t('fora seguidas', 'outside in a row')}
          </span>
        ) : null}
      </div>
      <p className="small">{t(takeAdvice(summary))}</p>
    </div>
  );
}

/** Gravar o improviso pelo microfone e reouvir com as notas marcadas. */
export function TakesPanel() {
  const t = useT();
  const { takes, recordingSince, start, stop, remove } = useTakes();
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (recordingSince === null) return;
    const id = window.setInterval(() => setElapsed((Date.now() - recordingSince) / 1000), 250);
    return () => window.clearInterval(id);
  }, [recordingSince]);

  return (
    <div className="takes">
      <div className="takes-head">
        <span className="eyebrow">{t('Gravar improviso', 'Record your improv')}</span>
        {recordingSince !== null ? (
          <button type="button" className="button take-rec" data-on onClick={() => void stop()}>
            <span className="take-rec-dot" aria-hidden="true" />
            {t('Parar', 'Stop')} · {clock(elapsed)}
          </button>
        ) : (
          <button
            type="button"
            className="button take-rec"
            onClick={() => {
              setElapsed(0);
              start();
            }}
          >
            <span className="take-rec-dot" aria-hidden="true" />
            {t('Gravar', 'Record')}
          </button>
        )}
        <span className="small muted">
          {t(
            `Até ${MAX_TAKE_SECONDS / 60} min. Grava o microfone e as notas detectadas; fica só neste aparelho.`,
            `Up to ${MAX_TAKE_SECONDS / 60} min. Records the microphone and the detected notes; stays on this device only.`,
          )}
        </span>
      </div>
      {takes.map((take) => (
        <TakePlayer
          key={take.id}
          take={take}
          onRemove={() => {
            remove(take.id);
            toast.info(t('Gravação apagada.', 'Recording deleted.'));
          }}
        />
      ))}
    </div>
  );
}
