import { GUIDES } from '@/guides';
import { useT, useLang } from '@/i18n';

/**
 * Rodapé das páginas do app: diz em texto o que o app faz (para quem chega pela busca e para os
 * buscadores) e liga aos guias do idioma da tela. Fica abaixo do conteúdo, fora do caminho de
 * quem está tocando.
 */
export function AppFooter() {
  const t = useT();
  const lang = useLang();
  const guides = GUIDES.filter((g) => g.lang === lang);
  return (
    <footer className="app-footer">
      <div className="app-footer-inner">
        <section aria-labelledby="about-title">
          <h2 id="about-title">
            {t(
              'Improvise no ukulele sabendo a próxima nota',
              'Improvise on the ukulele knowing the next note',
            )}
          </h2>
          <p>
            {t(
              'Escolha o tom e o acorde: o braço mostra em cores quais notas repousam, quais servem de passagem e quais pedem resolução, e sugere os próximos acordes. Toque junto com bases em pop, reggae, bossa nova, swing e valsa, grave loops e treine o ouvido. O microfone reconhece o que você toca no seu ukulele. Grátis, sem anúncios e funciona offline.',
              'Pick the key and the chord: the fretboard shows in color which notes rest, which work as passing notes and which want to resolve, and suggests the next chords. Play along with backing tracks in pop, reggae, bossa nova, swing and waltz, record loops and train your ear. The microphone recognizes what you play on your ukulele. Free, no ads, and it works offline.',
            )}
          </p>
        </section>
        <nav aria-labelledby="guides-title">
          <h2 id="guides-title">{t('Guias', 'Guides')}</h2>
          <ul>
            {guides.map((g) => (
              <li key={g.path}>
                <a href={g.path}>{g.title}</a>
              </li>
            ))}
          </ul>
        </nav>
        <p className="app-footer-meta">
          {t('Código aberto (MIT)', 'Open source (MIT)')} ·{' '}
          <a href="https://github.com/VictorDepX/uke-improv">GitHub</a>
        </p>
      </div>
    </footer>
  );
}
