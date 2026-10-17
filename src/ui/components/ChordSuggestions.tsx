import { useCallback } from 'react';
import { playChord } from '@/audio/engine/sound';
import { chordToNumeral } from '@/core/harmony';
import { useChordSuggestions, useVoicing } from '@/store/selectors';
import { useMusicStore } from '@/store/useMusicStore';
import { FUNC_LABEL } from '../format';
import { ChordDiagram } from './ChordDiagram';
import { Panel, Toggle } from './controls';

const KIND_LABEL = { diatonic: null, secondary: 'secundária', borrowed: 'emprestado' } as const;

export function ChordSuggestions() {
  const suggestions = useChordSuggestions(5);
  const current = useMusicStore((s) => s.currentChord);
  const key = useMusicStore((s) => s.key);
  const capo = useMusicStore((s) => s.settings.capo);
  const voicing = useVoicing();
  const extras = useMusicStore((s) => s.settings.extras);
  const setExtras = useMusicStore((s) => s.setExtras);
  const setChord = useMusicStore((s) => s.setChord);

  const play = useCallback((symbol: string) => void playChord(voicing(symbol).midis), [voicing]);

  const currentVoicing = voicing(current);
  const currentShapes = currentVoicing.shapes;

  return (
    <Panel title="Próximo acorde">
      <div className="current-chord">
        <button
          type="button"
          className="current-chord-diagram"
          onClick={() => play(current)}
          aria-label={`Tocar ${current}`}
        >
          {currentShapes[0] ? <ChordDiagram shape={currentShapes[0]} label={current} /> : null}
        </button>
        <div className="current-chord-text">
          <span className="eyebrow">Agora</span>
          <span className="current-chord-symbol">{current}</span>
          <span className="mono muted">{chordToNumeral(current, key)}</span>
          {capo ? (
            <span className="chord-shape-of">
              forma de <strong>{currentVoicing.shapeName}</strong> · capo {capo}
            </span>
          ) : null}
          {currentShapes.length > 1 ? (
            <span className="alt-shapes" aria-label="Outras formas">
              {currentShapes.slice(1).map((s) => (
                <span key={s.join('')} className="mono">
                  {s.join('')}
                </span>
              ))}
            </span>
          ) : null}
        </div>
      </div>

      <ol className="chord-suggestions">
        {suggestions.map((s) => {
          const v = voicing(s.symbol);
          const shape = v.shapes[0];
          return (
            <li key={s.symbol}>
              <button
                type="button"
                className="chord-suggestion"
                data-func={s.func}
                onClick={() => {
                  setChord(s.symbol);
                  play(s.symbol);
                }}
              >
                {shape ? <ChordDiagram shape={shape} label={s.symbol} size="sm" /> : null}
                <span className="chord-suggestion-body">
                  <span className="chord-suggestion-head">
                    <strong>{s.symbol}</strong>
                    <span className="mono muted">{s.numeral}</span>
                    {KIND_LABEL[s.kind] ? <span className="tag">{KIND_LABEL[s.kind]}</span> : null}
                    {capo ? <span className="chord-shape-of">forma de {v.shapeName}</span> : null}
                  </span>
                  <span className="chord-suggestion-reason">{s.reason}</span>
                  <span className="func-label" data-func={s.func}>
                    {FUNC_LABEL[s.func]}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="extras">
        <Toggle
          id="extra-secondary"
          label="Dominantes secundárias"
          hint="ex.: E7 antes de Am"
          checked={extras.secondaryDominants}
          onChange={(v) => setExtras({ secondaryDominants: v })}
        />
        <Toggle
          id="extra-borrowed"
          label="Empréstimo modal"
          hint="ex.: Fm ou Bb em dó maior"
          checked={extras.modalBorrowing}
          onChange={(v) => setExtras({ modalBorrowing: v })}
        />
      </div>
    </Panel>
  );
}
