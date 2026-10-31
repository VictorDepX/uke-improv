import { ARTICLES, HUB_PATH } from '@/guides/links';
import { TAB_PATHS } from '../routes';
import { useT, useLang } from '@/i18n';

/**
 * Rodapé das páginas do app: diz em texto o que o app faz (para quem chega pela busca e para os
 * buscadores) e liga aos guias do idioma da tela. Fica abaixo do conteúdo, fora do caminho de
 * quem está tocando.
 */
export function AppFooter({ title, about }: { title: string; about: string }) {
  const t = useT();
  const lang = useLang();
  const guides = ARTICLES.filter((g) => g.lang === lang);
  return (
    <footer className="app-footer">
      <div className="app-footer-inner">
        <section aria-labelledby="about-title">
          <h2 id="about-title">{title}</h2>
          {/* Parágrafos separados por linha em branco no texto da página. */}
          {about.split('\n\n').map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
        </section>
        <nav aria-labelledby="guides-title">
          <h2 id="guides-title">{t('Guias', 'Guides')}</h2>
          <ul>
            {guides.map((g) => (
              <li key={g.path}>
                <a href={g.path}>{g.title}</a>
              </li>
            ))}
            <li>
              <a href={HUB_PATH[lang]}>
                {t('Todos os guias, escalas e tons', 'All guides, scales and keys')}
              </a>
            </li>
            <li>
              <a href={TAB_PATHS[lang].afinador}>{t('Afinador de ukulele', 'Ukulele tuner')}</a>
            </li>
            <li>
              <a href={TAB_PATHS[lang].cifra}>
                {t('Descobrir o tom pela cifra', 'Find the key from a chord chart')}
              </a>
            </li>
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
