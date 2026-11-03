import { useCallback } from 'react';
import { playChord } from '@/audio/engine/sound';
import { chordToNumeral } from '@/core/harmony';
import { useChordSuggestions, useVoicing } from '@/store/selectors';
import { useMusicStore } from '@/store/useMusicStore';
import { tx, useLang, useNames, useT, type Txt } from '@/i18n';
import { FUNC_LABEL, sentence } from '../format';
import { navigateTo } from '../routes';
import { ChordDiagram } from './ChordDiagram';
import { Toggle } from './controls';

/** Rótulo de função das sugestões fora do campo harmônico. */
const KIND_FUNC: Record<'secondary' | 'borrowed', Txt> = {
  secondary: tx('Dominante secundária', 'Secondary dominant'),
  borrowed: tx('Empréstimo modal', 'Borrowed chord'),
};

/**
 * Próximo acorde (lateral do Explorar): os 4 melhores a partir do atual, com diagrama, grau,
 * função e o motivo. Tocar uma opção faz dela o acorde atual.
 */
export function ChordSuggestions() {
  const t = useT();
  const n = useNames();
  const lang = useLang();
  const suggestions = useChordSuggestions(4);
  const current = useMusicStore((s) => s.currentChord);
  const key = useMusicStore((s) => s.key);
  const capo = useMusicStore((s) => s.settings.capo);
  const voicing = useVoicing();
  const extras = useMusicStore((s) => s.settings.extras);
  const setExtras = useMusicStore((s) => s.setExtras);
  const setChord = useMusicStore((s) => s.setChord);
  const loadChart = useMusicStore((s) => s.loadChart);

  const play = useCallback((symbol: string) => void playChord(voicing(symbol).midis), [voicing]);
  const numeral = chordToNumeral(current, key);

  // Volta curta para tocar no Jam: o atual, as duas primeiras saídas e de volta ao atual.
  const loop = [current, ...suggestions.slice(0, 2).map((s) => s.symbol), current];
  const loopLabel = loop.map(n).join(' → ');
  const toJam = () => {
    loadChart({ key, bars: loop.map((c) => [c]), name: loopLabel });
    navigateTo('jam', lang);
  };

  return (
    <section className="chord-next" aria-labelledby="chord-next-title">
      <h2 id="chord-next-title">{t('Próximo acorde', 'Next chord')}</h2>
      <p className="chord-next-lead">
        {t(
          `Agora em ${n(current)}, o ${numeral}. Toque um destes para ele virar o atual.`,
          `Now on ${n(current)}, the ${numeral}. Tap one of these to make it the current chord.`,
        )}
      </p>

      <ol className="chord-suggestions">
        {suggestions.map((s) => {
          const v = voicing(s.symbol);
          const shape = v.shapes[0];
          const kind = s.kind === 'diatonic' ? null : s.kind;
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
                {shape ? <ChordDiagram shape={shape} label={n(s.symbol)} /> : null}
                <span className="chord-suggestion-body">
                  <span className="chord-suggestion-head">
                    <strong>{n(s.symbol)}</strong>
                    <span className="mono">{s.numeral}</span>
                  </span>
                  <span className="func-label" data-func={s.func}>
                    {t(kind ? KIND_FUNC[kind] : FUNC_LABEL[s.func])}
                  </span>
                  <span className="chord-suggestion-reason">
                    {sentence(t(s.reason))}
                    {capo ? ` ${t('Forma de', 'Shape of')} ${n(v.shapeName)}.` : ''}
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
          label={t('Dominantes secundárias', 'Secondary dominants')}
          hint={t(`ex.: ${n('E7')} antes de ${n('Am')}`, `e.g. ${n('E7')} before ${n('Am')}`)}
          checked={extras.secondaryDominants}
          onChange={(v) => setExtras({ secondaryDominants: v })}
        />
        <Toggle
          id="extra-borrowed"
          label={t('Empréstimo modal', 'Modal borrowing')}
          hint={t(
            `ex.: ${n('Fm')} ou ${n('Bb')} em ${n('C')} maior`,
            `e.g. ${n('Fm')} or ${n('Bb')} in ${n('C')} major`,
          )}
          checked={extras.modalBorrowing}
          onChange={(v) => setExtras({ modalBorrowing: v })}
        />
      </div>

      {suggestions.length >= 2 ? (
        <button type="button" className="button chord-next-jam" onClick={toJam}>
          {t(`Levar ${loopLabel} para o Jam`, `Take ${loopLabel} to the Jam`)}
        </button>
      ) : null}
    </section>
  );
}
