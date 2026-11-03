import { LangProvider } from '@/i18n';
import { GUIDES, translationOf, type Guide } from './index';
import { HUB_PATH } from './links';
import { Icon } from '@/ui/components/Icon';
import { TAB_PATHS, type TabId } from '@/ui/routes';

const TEXT = {
  pt: {
    home: 'Uke Improv',
    homeLabel: 'Uke Improv, página inicial do app',
    open: 'Abrir o app',
    langSwitch: 'Read in English',
    updated: 'Atualizado em',
    ctaTitle: 'Pratique com uma base tocando',
    toc: 'Neste guia',
    practice: 'Praticar',
    ctaBody:
      'O braço mostra quais notas soam bem sobre cada acorde enquanto a base toca. Grátis, funciona no celular.',
    ctaButton: 'Tocar com a base',
    more: 'Outros guias',
    guides: 'Guias',
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
    toc: 'In this guide',
    practice: 'Practice',
    ctaBody:
      'The fretboard shows which notes sound good over each chord while the backing track plays. Free, works on your phone.',
    ctaButton: 'Play along',
    more: 'More guides',
    guides: 'Guides',
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

/** Abas do app, como no trilho do app (aqui são links simples: a página não tem JavaScript). */
const NAV: { pt: string; en: string; tab: TabId }[] = [
  { pt: 'Explorar', en: 'Explore', tab: 'explorar' },
  { pt: 'Jam', en: 'Jam', tab: 'jam' },
  { pt: 'Cifra', en: 'Chords', tab: 'cifra' },
  { pt: 'Afinador', en: 'Tuner', tab: 'afinador' },
  { pt: 'Ouvido', en: 'Ear', tab: 'ouvido' },
  { pt: 'Ajustes', en: 'Settings', tab: 'ajustes' },
];

function NavLinks({ lang }: { lang: Guide['lang'] }) {
  return (
    <>
      {NAV.map((item) => (
        <a key={item.tab} className="tab" href={TAB_PATHS[lang][item.tab]}>
          {item[lang]}
        </a>
      ))}
      <a className="tab" href={HUB_PATH[lang]} aria-current="page">
        {lang === 'pt' ? 'Guias' : 'Guides'}
      </a>
    </>
  );
}

/** Página de guia: conteúdo estático, sem o JavaScript do app. */
export function GuidePage({ guide }: { guide: Guide }) {
  const t = TEXT[guide.lang];
  const other = translationOf(guide);
  const related = GUIDES.filter(
    (g) => g.lang === guide.lang && g.kind === 'article' && g.id !== guide.id,
  );
  const { Body } = guide;
  const hub = guide.kind === 'hub';
  const crumb = guide.title.split(':')[0]!;
  const navLabel = guide.lang === 'pt' ? 'Seções' : 'Sections';
  const langLink = other ? (
    <a
      className="lang-switch"
      href={other.path}
      hrefLang={other.lang === 'pt' ? 'pt-BR' : 'en'}
      lang={other.lang === 'pt' ? 'pt-BR' : 'en'}
    >
      {t.langSwitch}
    </a>
  ) : null;
  return (
    <LangProvider value={guide.lang}>
      <div className="guide" data-shapes="">
        {/* Celular: barra com menu (details, funciona sem JavaScript) e o botão do app. */}
        <header className="guide-bar">
          <details className="guide-menu">
            <summary className="icon-button" aria-label={guide.lang === 'pt' ? 'Menu' : 'Menu'}>
              <Icon name="menu" />
            </summary>
            <div className="guide-menu-panel">
              <nav className="tabs" aria-label={navLabel}>
                <NavLinks lang={guide.lang} />
              </nav>
              {langLink}
            </div>
          </details>
          <span className="shell-page">{t.guides}</span>
          <a className="button button-primary" href={t.homePath}>
            {t.open}
          </a>
        </header>

        {/* Desktop: o mesmo trilho do app. */}
        <aside className="guide-rail">
          <a className="shell-brand" href={t.homePath} aria-label={t.homeLabel}>
            {t.home}
          </a>
          <nav className="tabs" aria-label={navLabel}>
            <NavLinks lang={guide.lang} />
          </nav>
          <div className="shell-panel-foot">
            {langLink}
            <a className="button button-primary" href={`${t.homePath}?praticar`}>
              {t.practice}
            </a>
          </div>
        </aside>

        <div className="guide-content">
          <main className="guide-main">
            {!hub ? (
              <div className="guide-crumbs">
                <nav aria-label={guide.lang === 'pt' ? 'Trilha' : 'Breadcrumb'}>
                  <a href={HUB_PATH[guide.lang]}>{t.guides}</a>
                  <span aria-hidden="true"> / </span>
                  <span aria-current="page">{crumb}</span>
                </nav>
                {langLink}
              </div>
            ) : null}
            <article className="guide-article" data-kind={guide.kind}>
              <h1>{guide.title}</h1>
              {!hub ? (
                <p className="guide-meta">
                  {t.updated}{' '}
                  <time dateTime={guide.updated}>{formatDate(guide.updated, guide.lang)}</time>
                </p>
              ) : null}
              <Body />
            </article>

            {!hub ? (
              <aside className="guide-cta" aria-labelledby="guide-cta-title">
                <div>
                  <h2 id="guide-cta-title">{t.ctaTitle}</h2>
                  <p>{t.ctaBody}</p>
                </div>
                <a className="button button-primary" href={t.appPath}>
                  {t.ctaButton}
                </a>
              </aside>
            ) : null}

            {!hub && related.length ? (
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

          {!hub ? (
            <nav className="guide-toc" aria-labelledby="guide-toc-title">
              <span id="guide-toc-title" className="field-label">
                {t.toc}
              </span>
              {/* O pré-render preenche com os H2 do artigo. */}
              <ol className="guide-toc-list" />
            </nav>
          ) : null}

          <footer className="guide-footer">
            <p>
              {t.footer} <a href="https://github.com/VictorDepX/uke-improv">{t.code}</a>
            </p>
          </footer>
        </div>
      </div>
    </LangProvider>
  );
}
