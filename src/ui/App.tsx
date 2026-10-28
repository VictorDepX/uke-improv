import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { preloadAudioWhenIdle } from '@/audio/engine/sound';
import { startSync } from '@/sync/sync';
import { SCALES } from '@/core/music';
import { useMusicStore } from '@/store/useMusicStore';
import { KeyPicker } from './components/KeyPicker';
import { useJamSync } from './hooks/useJamSync';
import { useWakeLock } from './hooks/useWakeLock';
import { ExplorePage } from './pages/ExplorePage';
import { Toaster } from './components/Toaster';
import { useAccountToasts } from './hooks/useAccountToasts';

// Abas fora da inicial e o modo prática vêm em pacotes separados, baixados ao abrir.
const JamPage = lazy(() => import('./pages/JamPage').then((m) => ({ default: m.JamPage })));
const EarPage = lazy(() => import('./pages/EarPage').then((m) => ({ default: m.EarPage })));
const SettingsPage = lazy(() =>
  import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })),
);
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

const TABS = [
  {
    id: 'explorar',
    label: 'Explorar',
    title: 'Uke Improv — improvise no ukulele sabendo a próxima nota',
    description:
      'Escolha o tom e o acorde: o braço do ukulele mostra quais notas soam bem a seguir e quais acordes combinam. Grátis, funciona offline.',
  },
  {
    id: 'jam',
    label: 'Jam',
    title: 'Jam — base em loop para improvisar · Uke Improv',
    description:
      'Base de acordes, baixo e bateria em 4/4, 3/4 e 6/8, em pop, reggae, bossa nova, swing e valsa, com looper e analisador de cifra.',
  },
  {
    id: 'ouvido',
    label: 'Ouvido',
    title: 'Treino de ouvido · Uke Improv',
    description: 'Treine intervalos, maior × menor e função harmônica tocando no ukulele.',
  },
  {
    id: 'ajustes',
    label: 'Ajustes',
    title: 'Ajustes · Uke Improv',
    description: 'Afinação, capotraste, calibração do microfone e conta para sincronizar.',
  },
] as const;
type TabId = (typeof TABS)[number]['id'];

function initialTab(): TabId {
  const hash = window.location.hash.slice(1);
  return TABS.some((t) => t.id === hash) ? (hash as TabId) : 'explorar';
}

export function App() {
  const [tab, setTab] = useState<TabId>(initialTab);
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

  // Título e descrição por aba (o app é uma página só, com as abas no #).
  useEffect(() => {
    const t = TABS.find((x) => x.id === tab)!;
    document.title = t.title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', t.description);
    // A aba fica no endereço: dá para compartilhar ou favoritar direto o Jam, por exemplo.
    const hash = tab === 'explorar' ? '' : `#${tab}`;
    if (window.location.hash !== hash)
      history.replaceState(null, '', `${window.location.pathname}${window.location.search}${hash}`);
  }, [tab]);

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
                href={`#${t.id}`}
                className="tab"
                aria-current={tab === t.id ? 'page' : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  setTab(t.id);
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
      {practiceOpen ? (
        <Suspense fallback={null}>
          <PracticeMode onClose={closePractice} />
        </Suspense>
      ) : null}
      <Toaster />
    </div>
  );
}
