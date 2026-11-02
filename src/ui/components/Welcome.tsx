import { useId, useSyncExternalStore } from 'react';
import { useT } from '@/i18n';
import { useMusicStore } from '@/store/useMusicStore';

const noop = () => () => undefined;

/**
 * Boas-vindas na primeira visita: três passos e os atalhos. Fica por cima (posição fixa), para
 * não empurrar o braço quando some, e só no navegador: o HTML pré-renderizado não sabe se a
 * pessoa já viu.
 */
export function Welcome() {
  const t = useT();
  const id = useId();
  const onboarded = useMusicStore((s) => s.settings.onboarded);
  const update = useMusicStore((s) => s.updateSettings);
  const client = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
  if (!client || onboarded) return null;
  return (
    <section className="welcome" role="dialog" aria-labelledby={id}>
      <h2 id={id}>{t('Bem-vindo ao Uke Improv', 'Welcome to Uke Improv')}</h2>
      <ol>
        <li>
          {t(
            'Escolha o tom no topo e um acorde na faixa de acordes.',
            'Pick the key at the top and a chord in the chord strip.',
          )}
        </li>
        <li>
          {t(
            'Toque uma casa: o círculo repousa, o quadrado passa, o losango pede resolução. Os números são as melhores próximas notas.',
            'Tap a fret: the circle rests, the square passes, the diamond wants to resolve. The numbers are the best next notes.',
          )}
        </li>
        <li>
          {t(
            'Na aba Jam, ligue a base e improvise. Com o microfone, o app ouve o seu uke.',
            'In the Jam tab, start the backing track and improvise. With the microphone, the app hears your uke.',
          )}
        </li>
      </ol>
      <p className="small muted">
        {t(
          'Atalhos: espaço toca a base, P abre o modo prática, 1 a 7 escolhem o acorde, ? mostra a lista.',
          'Shortcuts: space plays the backing track, P opens practice mode, 1 to 7 pick the chord, ? shows the list.',
        )}
      </p>
      <button
        type="button"
        className="button button-primary"
        onClick={() => update({ onboarded: true })}
      >
        {t('Começar', 'Get started')}
      </button>
    </section>
  );
}
