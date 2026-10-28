import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
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
import { TABS, TAB_PATHS, USE_PATHS, hrefFor, tabFromLocation, type TabId } from './routes';
import { useAccountToasts } from './hooks/useAccountToasts';

// Abas fora da inicial e o modo prática vêm em pacotes separados, baixados ao abrir.
const PracticeMode = lazy(() =>
  import('./components/practice/PracticeMode').then((m) => ({ default: m.PracticeMode })),
);

function PageSkeleton() {
  return (
    <div className="page-skeleton" role="status" aria-label="Carregando">
      <div className="skeleton skeleton-bar" />
      <div className="skeleton skeleton-board" />
      <div className="skeleton-row">
        <div className="skeleton skeleton-card" />
        <div className="skeleton skeleton-card" />
      </div>
    </div>
  );
}

export function App({ initialTab }: { initialTab?: TabId } = {}) {
  const [tab, setTab] = useState<TabId>(
    () =>
      initialTab ??
      (typeof window === 'undefined'
        ? 'explorar'
        : tabFromLocation(window.location.pathname, window.location.hash)),
  );
  const [keyOpen, setKeyOpen] = useState(false);
  const [practiceOpen, setPracticeOpen] = useState(false);
  const closePractice = useCallback(() => setPracticeOpen(false), []);
  const key = useMusicStore((s) => s.key);
  const jamPlaying = useMusicStore((s) => s.jam.playing);
  const shapes = useMusicStore((s) => s.settings.shapes);
  useJamSync();
  useAccountToasts();
  // Tocando, a tela não pode apagar: celular na estante, mãos no uke.
  useWakeLock(practiceOpen || jamPlaying);

  // Título e descrição por aba; o endereço acompanha (link antigo com # vira o caminho novo).
  useEffect(() => {
    const t = TABS.find((x) => x.id === tab)!;
    document.title = t.title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', t.description);
    const { pathname, search, hash } = window.location;
    if (USE_PATHS) {
      if (pathname !== TAB_PATHS[tab] || hash)
        history.replaceState(null, '', `${TAB_PATHS[tab]}${search}`);
    } else {
      const want = tab === 'explorar' ? '' : `#${tab}`;
      if (hash !== want) history.replaceState(null, '', `${pathname}${search}${want}`);
    }
  }, [tab]);

  // Voltar e avançar do navegador trocam de aba.
  useEffect(() => {
    const onPop = () => setTab(tabFromLocation(window.location.pathname, window.location.hash));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const openTab = (id: TabId) => {
    if (id === tab) return;
    if (USE_PATHS) history.pushState(null, '', `${TAB_PATHS[id]}${window.location.search}`);
    setTab(id);
  };

  useEffect(() => {
    const cancel = preloadAudioWhenIdle();
    if (__ACCOUNTS__) void startSync();
    return cancel;
  }, []);

  return (
    <div className="app" data-shapes={shapes || undefined}>
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
            <span className="key-toggle-scale">{SCALES[key.scale].label}</span>
            <span className="key-toggle-caret" aria-hidden="true" />
          </button>
          <div id="key-picker" className="key-picker-slot" data-open={keyOpen || undefined}>
            <KeyPicker />
          </div>
          <button
            type="button"
            className="practice-open"
            onClick={() => setPracticeOpen(true)}
            aria-label="Abrir modo prática"
          >
            <span className="practice-open-icon" aria-hidden="true" />
            <span className="practice-open-label">Praticar</span>
          </button>
          <nav className="tabs" aria-label="Seções">
            {TABS.map((t) => (
              <a
                key={t.id}
                href={hrefFor(t.id)}
                className="tab"
                aria-current={tab === t.id ? 'page' : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  openTab(t.id);
                }}
              >
                {t.label}
              </a>
            ))}
          </nav>
        </div>
      </header>
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
  );
}
