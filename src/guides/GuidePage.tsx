import { LangProvider } from '@/i18n';
import { GUIDES, translationOf, type Guide } from './index';

const TEXT = {
  pt: {
    home: 'Uke Improv',
    homeLabel: 'Uke Improv, página inicial do app',
    open: 'Abrir o app',
    langSwitch: 'Read in English',
    updated: 'Atualizado em',
    ctaTitle: 'Pratique com uma base tocando',
    ctaBody:
      'O Uke Improv mostra no braço quais notas soam bem sobre cada acorde, toca a base e escuta o que você toca pelo microfone. É grátis e funciona no celular.',
    ctaButton: 'Tocar com a base',
    more: 'Outros guias',
    footer: 'Uke Improv é gratuito e de código aberto.',
    code: 'Código no GitHub',
    homePath: '/',
    appPath: '/jam',
  },
  en: {
    home: 'Uke Improv',
    homeLabel: 'Uke Improv, app home page',
    open: 'Open the app',
    langSwitch: 'Ler em português',
    updated: 'Updated',
    ctaTitle: 'Practice with a backing track',
    ctaBody:
      'Uke Improv shows on the fretboard which notes sound good over each chord, plays the backing track and listens to you through the microphone. It is free and works on your phone.',
    ctaButton: 'Play along',
    more: 'More guides',
    footer: 'Uke Improv is free and open source.',
    code: 'Code on GitHub',
    homePath: '/en',
    appPath: '/en/jam',
  },
} as const;

const formatDate = (iso: string, lang: Guide['lang']) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString(lang === 'pt' ? 'pt-BR' : 'en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

/** Página de guia: conteúdo estático, sem o JavaScript do app. */
export function GuidePage({ guide }: { guide: Guide }) {
  const t = TEXT[guide.lang];
  const other = translationOf(guide);
  const related = GUIDES.filter((g) => g.lang === guide.lang && g.id !== guide.id);
  const { Body } = guide;
  return (
    <LangProvider value={guide.lang}>
      <div className="guide">
        <header className="guide-top">
          <a className="brand" href={t.homePath} aria-label={t.homeLabel}>
            <span className="brand-mark" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </span>
            <span className="brand-name">{t.home}</span>
          </a>
          <nav className="guide-nav" aria-label={guide.lang === 'pt' ? 'Navegação' : 'Navigation'}>
            {other ? (
              <a
                href={other.path}
                hrefLang={other.lang === 'pt' ? 'pt-BR' : 'en'}
                lang={other.lang === 'pt' ? 'pt-BR' : 'en'}
              >
                {t.langSwitch}
              </a>
            ) : null}
            <a className="button button-primary" href={t.homePath}>
              {t.open}
            </a>
          </nav>
        </header>

        <main className="guide-main">
          <article className="guide-article">
            <h1>{guide.title}</h1>
            <p className="guide-meta">
              {t.updated}{' '}
              <time dateTime={guide.updated}>{formatDate(guide.updated, guide.lang)}</time>
            </p>
            <Body />
          </article>

          <aside className="guide-cta" aria-labelledby="guide-cta-title">
            <h2 id="guide-cta-title">{t.ctaTitle}</h2>
            <p>{t.ctaBody}</p>
            <a className="button button-primary" href={t.appPath}>
              {t.ctaButton}
            </a>
          </aside>

          {related.length ? (
            <nav className="guide-related" aria-labelledby="guide-related-title">
              <h2 id="guide-related-title">{t.more}</h2>
              <ul>
                {related.map((g) => (
                  <li key={g.path}>
                    <a href={g.path}>{g.title}</a>
                    <span>{g.description}</span>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}
        </main>

        <footer className="guide-footer">
          <p>
            {t.footer} <a href="https://github.com/VictorDepX/uke-improv">{t.code}</a>
          </p>
        </footer>
      </div>
    </LangProvider>
  );
}
