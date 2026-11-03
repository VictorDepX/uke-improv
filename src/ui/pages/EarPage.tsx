import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { playSequence } from '@/audio/engine/sound';
import {
  EMPTY_SCORE,
  makeQuestion,
  type Direction,
  type EarMode,
  type EarQuestion,
  type IntervalLevel,
  type QualityLevel,
} from '@/core/ear';
import { useVoicing } from '@/store/selectors';
import { useMusicStore } from '@/store/useMusicStore';
import { Segmented } from '../components/controls';
import { Icon } from '../components/Icon';
import { PageHead } from '../components/PageHead';
import { keyLabelOf } from '../format';
import { tNow, tx, useT, type Txt } from '@/i18n';
import { toast } from '../toast';

const MODE_OPTIONS: { value: EarMode; label: Txt }[] = [
  { value: 'interval', label: tx('Intervalos', 'Intervals') },
  { value: 'quality', label: tx('Maior × menor', 'Major vs. minor') },
  { value: 'function', label: tx('Função', 'Function') },
];

const MODE_HINT: Record<EarMode, Txt> = {
  interval: tx(
    'Duas notas: diga a distância entre elas.',
    'Two notes: name the distance between them.',
  ),
  quality: tx(
    'Um acorde em arpejo e depois junto: maior soa aberto, menor soa mais escuro.',
    'A chord arpeggiated and then together: major sounds open, minor sounds darker.',
  ),
  function: tx(
    'Uma cadência firma o tom; depois soa um acorde. Diga o grau dele no tom.',
    'A cadence sets the key; then a chord plays. Name its degree in the key.',
  ),
};

/** Treino de ouvido: intervalos, qualidade de acorde e função harmônica. */
export function EarPage() {
  const t = useT();
  const key = useMusicStore((s) => s.key);
  const voicing = useVoicing();
  const [mode, setMode] = useState<EarMode>('interval');
  const [intervalLevel, setIntervalLevel] = useState<IntervalLevel>('basic');
  const [direction, setDirection] = useState<Direction>('up');
  const [qualityLevel, setQualityLevel] = useState<QualityLevel>('basic');
  const [question, setQuestion] = useState<EarQuestion | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const score = useMusicStore((s) => s.progress.ear[mode] ?? EMPTY_SCORE);
  const recordEarAnswer = useMusicStore((s) => s.recordEarAnswer);

  const settings = useMemo(
    () => ({ intervalLevel, direction, qualityLevel, voicing: (s: string) => voicing(s).midis }),
    [intervalLevel, direction, qualityLevel, voicing],
  );

  const next = useCallback(() => {
    // Com a base tocando não dá para ouvir a pergunta: ela para antes.
    const jam = useMusicStore.getState();
    if (jam.jam.playing) {
      jam.setJamPlaying(false);
      toast.info(
        tNow(
          'Base parada para você ouvir a pergunta.',
          'Backing stopped so you can hear the question.',
        ),
      );
    }
    const q = makeQuestion(mode, key, settings);
    setQuestion(q);
    setPicked(null);
    void playSequence(q.play);
  }, [mode, key, settings]);

  const reset = (fn: () => void) => {
    fn();
    setQuestion(null);
    setPicked(null);
  };

  const answer = (id: string) => {
    if (!question || picked) return;
    setPicked(id);
    recordEarAnswer(mode, id === question.answer);
  };

  const right = picked !== null && question !== null && picked === question.answer;

  const field = (_id: string, control: ReactNode) => (
    <div className="field-row ear-row">{control}</div>
  );

  return (
    <div className="page page-ear">
      <PageHead
        tab="ouvido"
        lead={t(
          'Ouça, responda e confira. Cada pergunta toca de novo quantas vezes você quiser.',
          'Listen, answer and check. Each question plays again as many times as you like.',
        )}
      />
      <div className="transport-lcd ear-score" aria-label={t('Placar', 'Score')} role="group">
        <div className="visor-cell">
          <span className="visor-label">{t('Placar', 'Score')}</span>
          <span className="visor-value">
            <span className="visor-big">
              {score.correct}/{score.total}
            </span>
            <span className="visor-detail">{t('acertos', 'correct')}</span>
          </span>
        </div>
        <div className="visor-cell">
          <span className="visor-label">{t('Sequência', 'Streak')}</span>
          <span className="visor-value">
            <span className="visor-big">{score.streak}</span>
            <span className="visor-detail">{t('seguidas', 'in a row')}</span>
          </span>
        </div>
        <div className="visor-cell">
          <span className="visor-label">{t('Melhor', 'Best')}</span>
          <span className="visor-value">
            <span className="visor-big">{score.best}</span>
            <span className="visor-detail">{t('seguidas', 'in a row')}</span>
          </span>
        </div>
      </div>

      <div className="ear-options">
        {field(
          'mode',
          <Segmented
            label={t('Modo', 'Mode')}
            value={mode}
            options={MODE_OPTIONS.map((o) => ({ ...o, label: t(o.label) }))}
            onChange={(m) => reset(() => setMode(m))}
          />,
        )}
        {mode === 'interval' ? (
          <>
            {field(
              'level',
              <Segmented
                label={t('Intervalos', 'Intervals')}
                value={intervalLevel}
                options={[
                  { value: 'basic', label: t('Básicos', 'Basic') },
                  { value: 'all', label: t('Todos', 'All') },
                ]}
                onChange={(v) => reset(() => setIntervalLevel(v))}
              />,
            )}
            {field(
              'direction',
              <Segmented
                label={t('Como soam', 'How they sound')}
                value={direction}
                options={[
                  { value: 'up', label: t('Subindo', 'Rising') },
                  { value: 'down', label: t('Descendo', 'Falling') },
                  { value: 'harmonic', label: t('Juntas', 'Together') },
                ]}
                onChange={(v) => reset(() => setDirection(v))}
              />,
            )}
          </>
        ) : null}
        {mode === 'quality'
          ? field(
              'quality',
              <Segmented
                label={t('Acordes', 'Chords')}
                value={qualityLevel}
                options={[
                  { value: 'basic', label: t('Maior e menor', 'Major and minor') },
                  { value: 'all', label: t('+ dim. e aum.', '+ dim. and aug.') },
                ]}
                onChange={(v) => reset(() => setQualityLevel(v))}
              />,
            )
          : null}
      </div>

      <section className="panel ear-card" aria-labelledby="ear-q-title">
        <header className="ear-card-head">
          <div>
            <h2 id="ear-q-title">
              {question ? t(question.prompt) : t('Pronto para ouvir?', 'Ready to listen?')}
            </h2>
            <p className="ear-hint">
              {t(MODE_HINT[mode])}
              {mode === 'function'
                ? t(` Tom atual: ${t(keyLabelOf(key))}.`, ` Current key: ${t(keyLabelOf(key))}.`)
                : ''}
            </p>
          </div>
          <div className="ear-actions">
            {question ? (
              <button
                type="button"
                className="button"
                onClick={() => void playSequence(question.play)}
              >
                <Icon name="play" />
                {t('Repetir', 'Repeat')}
              </button>
            ) : null}
            <button type="button" className="button button-primary ear-play" onClick={next}>
              {question && !picked
                ? t('Nova pergunta', 'New question')
                : question
                  ? t('Próxima', 'Next')
                  : t('Ouvir', 'Listen')}
            </button>
          </div>
        </header>

        {question ? (
          <div className="ear-question" role="group" aria-label={t(question.prompt)}>
            <div className="ear-choices">
              {question.options.map((o) => {
                const state = picked
                  ? o.id === question.answer
                    ? 'right'
                    : o.id === picked
                      ? 'wrong'
                      : undefined
                  : undefined;
                return (
                  <button
                    key={o.id}
                    type="button"
                    className="ear-choice"
                    data-state={state}
                    aria-pressed={picked === o.id}
                    disabled={picked !== null}
                    onClick={() => answer(o.id)}
                  >
                    <span>{t(o.label)}</span>
                    {state ? (
                      <span className="ear-choice-state">
                        {state === 'right' ? t('certo', 'right') : t('errado', 'wrong')}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
            {picked ? (
              <p className="ear-feedback" data-kind={right ? 'hit' : 'miss'} role="status">
                <strong>{right ? t('Isso.', 'Correct.') : t('Não foi.', 'Not quite.')}</strong>{' '}
                {t(question.explain)}
              </p>
            ) : null}
          </div>
        ) : null}
      </section>
    </div>
  );
}
