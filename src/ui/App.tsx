import { useEffect, useState } from 'react';
import { preloadAudio } from '@/audio/engine/sound';
import { SCALES } from '@/core/music';
import { useMusicStore } from '@/store/useMusicStore';
import { KeyPicker } from './components/KeyPicker';
import { useJamSync } from './hooks/useJamSync';
import { ExplorePage } from './pages/ExplorePage';
import { JamPage } from './pages/JamPage';
import { SettingsPage } from './pages/SettingsPage';

const TABS = [
  { id: 'explorar', label: 'Explorar' },
  { id: 'jam', label: 'Jam' },
  { id: 'ajustes', label: 'Ajustes' },
] as const;
type TabId = (typeof TABS)[number]['id'];

function initialTab(): TabId {
  const hash = window.location.hash.slice(1);
  return TABS.some((t) => t.id === hash) ? (hash as TabId) : 'explorar';
}

export function App() {
  const [tab, setTab] = useState<TabId>(initialTab);
  const [keyOpen, setKeyOpen] = useState(false);
  const key = useMusicStore((s) => s.key);
  useJamSync();

  useEffect(() => {
    preloadAudio();
  }, []);

  return (
    <div className="app">
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
        {tab === 'explorar' ? <ExplorePage /> : tab === 'jam' ? <JamPage /> : <SettingsPage />}
      </main>
    </div>
  );
}
