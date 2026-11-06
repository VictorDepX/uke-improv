import { useEffect, useId, useRef, useSyncExternalStore } from 'react';
import { useT, type Lang } from '@/i18n';
import { useLangSuggestion } from '../hooks/useLangSuggestion';
import { WelcomeLang } from './LangHint';
import { useMusicStore } from '@/store/useMusicStore';

const noop = () => () => undefined;

/**
 * Boas-vindas na primeira visita: três passos e os atalhos, num diálogo sobre o app. Só no
 * navegador: o HTML pré-renderizado não sabe se a pessoa já viu.
 */
export function Welcome({ lang, onSwitchLang }: { lang: Lang; onSwitchLang: (l: Lang) => void }) {
  const t = useT();
  const id = useId();
  const start = useRef<HTMLButtonElement>(null);
  const onboarded = useMusicStore((s) => s.settings.onboarded);
  const update = useMusicStore((s) => s.updateSettings);
  const client = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
  const open = client && !onboarded;
  const suggestLang = useLangSuggestion(lang);
  // Começar sem trocar de idioma conta como escolha: a faixa de idioma não volta depois.
  const close = () => update(suggestLang ? { onboarded: true, lang } : { onboarded: true });

  useEffect(() => {
    if (open) start.current?.focus();
  }, [open]);

  if (!open) return null;
  const steps = [
    t(
      'Escolha o tom (no botão com o tom atual, como "C maior") e um acorde na faixa de acordes.',
      'Pick the key (on the button that shows the current key, like "C major") and a chord in the chord strip.',
    ),
    t(
      'Toque uma casa: o círculo repousa, o quadrado passa, o losango pede resolução. Os números são as melhores próximas notas.',
      'Tap a fret: the circle rests, the square passes, the diamond wants to resolve. The numbers are the best next notes.',
    ),
    t(
      'Na aba Jam, ligue a base e improvise. Com o microfone, o app ouve o seu uke.',
      'In the Jam tab, start the backing track and improvise. With the microphone, the app hears your uke.',
    ),
  ];
  const keys: [string, string][] = [
    [t('espaço', 'space'), t('toca ou para a base', 'plays or stops the backing track')],
    ['P', t('abre o modo prática', 'opens practice mode')],
    [
      t('1 a 7', '1 to 7'),
      t('escolhem o acorde pelo grau (5 = V)', 'pick the chord by degree (5 = V)'),
    ],
    ['?', t('mostra a lista', 'shows the list')],
  ];
  return (
    <div className="welcome-layer">
      <div className="shell-scrim" aria-hidden="true" onClick={close} />
      <section
        className="welcome"
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        onKeyDown={(e) => {
          if (e.key === 'Escape') close();
        }}
      >
        <h2 id={id}>{t('Bem-vindo ao Uke Improv', 'Welcome to Uke Improv')}</h2>
        <WelcomeLang lang={lang} onSwitch={onSwitchLang} />
        <ol className="welcome-steps">
          {steps.map((s, i) => (
            <li key={i}>
              <span className="welcome-num mono" aria-hidden="true">
                {i + 1}
              </span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
        <div className="welcome-keys">
          <span className="field-label">{t('Atalhos de teclado', 'Keyboard shortcuts')}</span>
          <dl>
            {keys.map(([k, v]) => (
              <div key={k}>
                <dt>
                  <kbd>{k}</kbd>
                </dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div>
          <button ref={start} type="button" className="button button-primary" onClick={close}>
            {t('Começar', 'Get started')}
          </button>
        </div>
      </section>
    </div>
  );
}
