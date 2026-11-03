import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { preloadAudioWhenIdle } from '@/audio/engine/sound';
import { startSync } from '@/sync/sync';
import { SCALES } from '@/core/music';
import { useMusicStore } from '@/store/useMusicStore';
import { Icon } from './components/Icon';
import { MicToggle } from './components/MicToggle';
import { useJamSync } from './hooks/useJamSync';
import { useWakeLock } from './hooks/useWakeLock';
import { ExplorePage } from './pages/ExplorePage';
import { AppFooter } from './components/AppFooter';
import { ChartPage, EarPage, JamPage, SettingsPage, TunerPage } from './pageLoaders';
import { Toaster } from './components/Toaster';
import { HTML_LANG, LangProvider, makeT, noteNamer, setCurrentLang, useT, type Lang } from '@/i18n';
import { LangHint } from './components/LangHint';
import {
  TABS,
  TAB_PATHS,
  USE_PATHS,
  hrefFor,
  routeFromLocation,
  type Route,
  type TabDef,
  type TabId,
} from './routes';
import { useAccountToasts } from './hooks/useAccountToasts';
import { useA11ySettings } from './hooks/useA11ySettings';
import { HUB_PATH } from '@/guides/links';
import { useShortcuts } from './hooks/useShortcuts';
import { useSharedLink } from './hooks/useSharedLink';
import { Welcome } from './components/Welcome';

// Abas fora da inicial e o modo prática vêm em pacotes separados, baixados ao abrir.
const PracticeMode = lazy(() =>
  import('./components/practice/PracticeMode').then((m) => ({ default: m.PracticeMode })),
);

// Ordem do menu: tocar (Explorar, Jam, Cifra), ferramentas (Afinador, Ouvido), Ajustes.
const NAV_ORDER: TabId[] = ['explorar', 'jam', 'cifra', 'afinador', 'ouvido', 'ajustes'];
const NAV_TABS = NAV_ORDER.map((id) => TABS.find((t) => t.id === id)!);

function PageSkeleton() {
  const t = useT();
  return (
    <div className="page-skeleton" role="status" aria-label={t('Carregando', 'Loading')}>
      <div className="skeleton skeleton-bar" />
      <div className="skeleton skeleton-board" />
      <div className="skeleton-row">
        <div className="skeleton skeleton-card" />
        <div className="skeleton skeleton-card" />
      </div>
    </div>
  );
}

export function App({ initialTab, initialLang }: { initialTab?: TabId; initialLang?: Lang } = {}) {
  const [route, setRoute] = useState<Route>(() => {
    if (initialTab) return { tab: initialTab, lang: initialLang ?? 'pt' };
    if (typeof window === 'undefined') return { tab: 'explorar', lang: 'pt' };
    const r = routeFromLocation(window.location.pathname, window.location.hash);
    return { tab: r.tab, lang: r.lang ?? 'pt' };
  });
  // Quem escolheu um idioma (aqui, nos Ajustes ou em outro aparelho, pela sincronização) vê o
  // app nele mesmo vindo por um link do outro; sem escolha, vale o do endereço.
  const chosenLang = useMusicStore((s) => s.settings.lang);
  const tab = route.tab;
  const current: TabDef = TABS.find((x) => x.id === tab)!;
  const lang = chosenLang ?? route.lang;
  const noteNames = useMusicStore((s) => s.settings.noteNames);
  const names = useMemo(() => noteNamer(noteNames, lang), [noteNames, lang]);
  const t = useMemo(() => makeT(lang, names), [lang, names]);
  const [keyOpen, setKeyOpen] = useState(false);
  const [practiceOpen, setPracticeOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const menuClose = useRef<HTMLButtonElement>(null);
  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    menuButton.current?.focus();
  }, []);
  // Gaveta aberta: o foco entra nela (o botão de fechar) e Esc fecha.
  useEffect(() => {
    if (menuOpen) menuClose.current?.focus();
  }, [menuOpen]);
  const closePractice = useCallback(() => setPracticeOpen(false), []);
  const key = useMusicStore((s) => s.key);
  const jamPlaying = useMusicStore((s) => s.jam.playing);
  const shapes = useMusicStore((s) => s.settings.shapes);
  const updateSettings = useMusicStore((s) => s.updateSettings);
  useJamSync();
  useSharedLink();
  useShortcuts(useCallback(() => setPracticeOpen(true), []));
  useAccountToasts();
  // Tocando, a tela não pode apagar: celular na estante, mãos no uke.
  useWakeLock(practiceOpen || jamPlaying);
  useA11ySettings();
  const pulse = useMusicStore((s) => s.settings.pulse);

  // Título, descrição e idioma da página; o endereço acompanha (link antigo com # vira o
  // caminho novo, e trocar de idioma troca o caminho).
  useEffect(() => {
    setCurrentLang(lang, names);
    const def = TABS.find((x) => x.id === tab)!;
    document.documentElement.lang = HTML_LANG[lang];
    document.title = def.title[lang];
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute('content', def.description[lang]);
    const { pathname, search, hash } = window.location;
    if (USE_PATHS) {
      const want = TAB_PATHS[lang][tab];
      if (pathname !== want || hash) history.replaceState(null, '', `${want}${search}`);
    } else {
      const want = tab === 'explorar' ? '' : `#${tab}`;
      if (hash !== want) history.replaceState(null, '', `${pathname}${search}${want}`);
    }
  }, [tab, lang, names]);

  // Voltar e avançar do navegador trocam de aba (e de idioma, se o endereço mudar).
  useEffect(() => {
    const onPop = () => {
      const r = routeFromLocation(window.location.pathname, window.location.hash);
      setRoute((cur) => ({ tab: r.tab, lang: r.lang ?? cur.lang }));
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const openTab = (id: TabId) => {
    setMenuOpen(false);
    if (id === tab) return;
    if (USE_PATHS) history.pushState(null, '', `${TAB_PATHS[lang][id]}${window.location.search}`);
    setRoute({ tab: id, lang });
  };
  const otherLang: Lang = lang === 'pt' ? 'en' : 'pt';
  const switchLang = (next: Lang) => {
    updateSettings({ lang: next });
    setRoute((r) => ({ ...r, lang: next }));
  };

  useEffect(() => {
    const cancel = preloadAudioWhenIdle();
    if (__ACCOUNTS__) void startSync();
    return cancel;
  }, []);

  return (
    <LangProvider value={lang}>
      <div
        className="app"
        data-shapes={shapes || undefined}
        data-tab={tab}
        data-key-open={keyOpen || undefined}
        lang={HTML_LANG[lang]}
      >
        {/*
         * Uma estrutura só para os dois tamanhos: no desktop é o trilho lateral (marca, abas,
         * idioma e Praticar); no celular é a barra do topo, e as abas abrem numa gaveta.
         */}
        <header className="shell">
          <a className="shell-brand" href={hrefFor('explorar', lang)} onClick={(e) => {
            e.preventDefault();
            openTab('explorar');
          }}>
            Uke Improv
          </a>
          <button
            ref={menuButton}
            type="button"
            className="shell-menu icon-button"
            aria-expanded={menuOpen}
            aria-controls="site-menu"
            aria-label={t('Abrir menu', 'Open menu')}
            onClick={() => setMenuOpen(true)}
          >
            <Icon name="menu" />
          </button>
          <div className="shell-title">
            {tab === 'explorar' ? (
              <button
                type="button"
                className="key-toggle"
                aria-expanded={keyOpen}
                aria-controls="key-picker"
                onClick={() => setKeyOpen((o) => !o)}
              >
                <span className="key-toggle-tonic">{names(key.tonic)}</span>
                <span className="key-toggle-scale">{t(SCALES[key.scale].label)}</span>
                <span className="key-toggle-caret" aria-hidden="true" />
              </button>
            ) : (
              <span className="shell-page" aria-hidden="true">
                {current.label[lang]}
              </span>
            )}
          </div>
          <div
            id="site-menu"
            className="shell-panel"
            data-open={menuOpen || undefined}
            onKeyDown={(e) => {
              if (e.key === 'Escape') closeMenu();
            }}
          >
            <div className="shell-panel-head">
              <button
                ref={menuClose}
                type="button"
                className="icon-button"
                aria-label={t('Fechar menu', 'Close menu')}
                onClick={closeMenu}
              >
                <Icon name="close" />
              </button>
              <span className="shell-panel-brand">Uke Improv</span>
            </div>
            <nav className="tabs" aria-label={t('Seções', 'Sections')}>
              {NAV_TABS.map((def) => (
                <a
                  key={def.id}
                  href={hrefFor(def.id, lang)}
                  className="tab"
                  aria-current={tab === def.id ? 'page' : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    openTab(def.id);
                  }}
                >
                  {def.label[lang]}
                </a>
              ))}
              <a className="tab" href={HUB_PATH[lang]}>
                {t('Guias', 'Guides')}
              </a>
            </nav>
            <div className="shell-panel-foot">
              <a
                className="lang-switch"
                href={hrefFor(tab, otherLang)}
                hrefLang={HTML_LANG[otherLang]}
                lang={HTML_LANG[otherLang]}
                aria-label={otherLang === 'en' ? 'Switch to English' : 'Mudar para português'}
                onClick={(e) => {
                  e.preventDefault();
                  switchLang(otherLang);
                }}
              >
                {otherLang === 'en' ? 'English' : 'Português'}
              </a>
              <p className="shell-code">
                {t('Código aberto (MIT)', 'Open source (MIT)')} ·{' '}
                <a href="https://github.com/VictorDepX/uke-improv">GitHub</a>
              </p>
            </div>
          </div>
          {menuOpen ? (
            <div className="shell-scrim" aria-hidden="true" onClick={closeMenu} />
          ) : null}
          {tab === 'explorar' ? <MicToggle /> : null}
          <button
            type="button"
            className="practice-open button button-primary"
            onClick={() => setPracticeOpen(true)}
            aria-label={t('Abrir modo prática', 'Open practice mode')}
          >
            {t('Praticar', 'Practice')}
          </button>
        </header>
        <div className="content">
          <LangHint lang={lang} onSwitch={switchLang} />
          <main className="main" id="main">
            <h1 className="sr-only">{current.h1[lang]}</h1>
            <Suspense fallback={<PageSkeleton />}>
              {tab === 'explorar' ? (
                <ExplorePage />
              ) : tab === 'jam' ? (
                <JamPage />
              ) : tab === 'ouvido' ? (
                <EarPage />
              ) : tab === 'afinador' ? (
                <TunerPage />
              ) : tab === 'cifra' ? (
                <ChartPage />
              ) : (
                <SettingsPage />
              )}
            </Suspense>
          </main>
          <AppFooter title={current.h1[lang]} about={current.about[lang]} />
        </div>
        {practiceOpen ? (
          <Suspense fallback={null}>
            <PracticeMode onClose={closePractice} />
          </Suspense>
        ) : null}
        <Toaster />
        <Welcome />
        {pulse ? <div id="pulse" className="pulse" aria-hidden="true" /> : null}
      </div>
    </LangProvider>
  );
}
