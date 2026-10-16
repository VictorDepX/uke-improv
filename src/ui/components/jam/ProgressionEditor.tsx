import { useState } from 'react';
import { toAbsoluteNumeral } from '@/core/harmony';
import { modeOf } from '@/core/music';
import { makeCustomProgression } from '@/core/progressions';
import { suggestNextChords } from '@/core/suggestChords';
import { useDiatonicChords } from '@/store/selectors';
import { useMusicStore } from '@/store/useMusicStore';

const MAX_BARS = 16;

/** Monta uma progressão própria; pode usar o sugeridor para escolher cada próximo acorde. */
export function ProgressionEditor() {
  const [draft, setDraft] = useState<string[]>([]);
  const diatonic = useDiatonicChords();
  const key = useMusicStore((s) => s.key);
  const extras = useMusicStore((s) => s.settings.extras);
  const add = useMusicStore((s) => s.addCustomProgression);

  const last = draft.at(-1);
  const suggested = last
    ? suggestNextChords(last, key, { extras, history: draft.slice(0, -1), count: 3 })
    : [];
  const push = (symbol: string) => setDraft((d) => (d.length < MAX_BARS ? [...d, symbol] : d));

  const save = () => {
    if (draft.length < 2) return;
    add(
      makeCustomProgression(
        draft.map((c) => toAbsoluteNumeral(c, key)),
        modeOf(key.scale),
      ),
    );
    setDraft([]);
  };

  return (
    <div className="editor">
      <div className="editor-draft" aria-live="polite">
        {draft.length === 0 ? (
          <span className="muted">Escolha os acordes na ordem dos compassos.</span>
        ) : (
          draft.map((c, i) => (
            <span key={`${c}-${i}`} className="pill">
              {c}
            </span>
          ))
        )}
      </div>

      {suggested.length > 0 ? (
        <div className="editor-row">
          <span className="eyebrow">Sugeridos</span>
          {suggested.map((s) => (
            <button
              key={s.symbol}
              type="button"
              className="pill pill-suggested"
              onClick={() => push(s.symbol)}
            >
              {s.symbol}
            </button>
          ))}
        </div>
      ) : null}

      <div className="editor-row">
        <span className="eyebrow">Campo</span>
        {diatonic.map((d) => (
          <button key={d.numeral} type="button" className="pill" onClick={() => push(d.symbol)}>
            {d.symbol}
          </button>
        ))}
      </div>

      <div className="editor-actions">
        <button
          type="button"
          className="button"
          onClick={() => setDraft((d) => d.slice(0, -1))}
          disabled={!draft.length}
        >
          Desfazer
        </button>
        <button
          type="button"
          className="button button-primary"
          onClick={save}
          disabled={draft.length < 2}
        >
          Salvar progressão
        </button>
      </div>
    </div>
  );
}
