import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import { preloadAudioWhenIdle } from '@/audio/engine/sound';
import { startSync } from '@/sync/sync';
import { SCALES } from '@/core/music';
import { useMusicStore } from '@/store/useMusicStore';
import { KeyPicker } from './components/KeyPicker';
import { useJamSync } from './hooks/useJamSync';
import { useWakeLock } from './hooks/useWakeLock';
import { ExplorePage } from './pages/ExplorePage';
import { AppFooter } from './components/AppFooter';
import { EarPage, JamPage, SettingsPage } from './pageLoaders';
import { Toaster } from './components/Toaster';
import { HTML_LANG, LangProvider, makeT, setCurrentLang, useT, type Lang } from '@/i18n';
import { LangHint } from './components/LangHint';
import {
  TABS,
  TAB_PATHS,
  USE_PATHS,
  hrefFor,
  routeFromLocation,
  type Route,
  type TabId,
} from './routes';
import { useAccountToasts } from './hooks/useAccountToasts';

// Abas fora da inicial e o modo prática vêm em pacotes separados, baixados ao abrir.
const PracticeMode = lazy(() =>
  import('./components/practice/PracticeMode').then((m) => ({ default: m.PracticeMode })),
);

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
  const lang = chosenLang ?? route.lang;
  const t = useMemo(() => makeT(lang), [lang]);
  const [keyOpen, setKeyOpen] = useState(false);
  const [practiceOpen, setPracticeOpen] = useState(false);
  const closePractice = useCallback(() => setPracticeOpen(false), []);
  const key = useMusicStore((s) => s.key);
  const jamPlaying = useMusicStore((s) => s.jam.playing);
  const shapes = useMusicStore((s) => s.settings.shapes);
  const updateSettings = useMusicStore((s) => s.updateSettings);
  useJamSync();
  useAccountToasts();
  // Tocando, a tela não pode apagar: celular na estante, mãos no uke.
  useWakeLock(practiceOpen || jamPlaying);

  // Título, descrição e idioma da página; o endereço acompanha (link antigo com # vira o
  // caminho novo, e trocar de idioma troca o caminho).
  useEffect(() => {
    setCurrentLang(lang);
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
  }, [tab, lang]);

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
      <div className="app" data-shapes={shapes || undefined} lang={HTML_LANG[lang]}>
        <header className="topbar">
          <div className="topbar-inner">
            <div className="brand">
              <span className="brand-mark" aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
              </span>
              <span className="brand-name">Uke Improv</span>
            </div>
            {/* No celular o seletor de tom fica recolhido atrás deste botão. */}
            <button
              type="button"
              className="key-toggle"
              aria-expanded={keyOpen}
              aria-controls="key-picker"
              onClick={() => setKeyOpen((o) => !o)}
            >
              <span className="key-toggle-tonic">{key.tonic}</span>
              <span className="key-toggle-scale">{t(SCALES[key.scale].label)}</span>
              <span className="key-toggle-caret" aria-hidden="true" />
            </button>
            <div id="key-picker" className="key-picker-slot" data-open={keyOpen || undefined}>
              <KeyPicker />
            </div>
            <button
              type="button"
              className="practice-open"
              onClick={() => setPracticeOpen(true)}
              aria-label={t('Abrir modo prática', 'Open practice mode')}
            >
              <span className="practice-open-icon" aria-hidden="true" />
              <span className="practice-open-label">{t('Praticar', 'Practice')}</span>
            </button>
            <nav className="tabs" aria-label={t('Seções', 'Sections')}>
              {TABS.map((def) => (
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
            </nav>
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
              {otherLang.toUpperCase()}
            </a>
          </div>
        </header>
        <LangHint lang={lang} onSwitch={switchLang} />
        <main className="main">
          <Suspense fallback={<PageSkeleton />}>
            {tab === 'explorar' ? (
              <ExplorePage />
            ) : tab === 'jam' ? (
              <JamPage />
            ) : tab === 'ouvido' ? (
              <EarPage />
            ) : (
              <SettingsPage />
            )}
          </Suspense>
        </main>
        <AppFooter />
        {practiceOpen ? (
          <Suspense fallback={null}>
            <PracticeMode onClose={closePractice} />
          </Suspense>
        ) : null}
        <Toaster />
      </div>
    </LangProvider>
  );
}
