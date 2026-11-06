import { useEffect, useState } from 'react';
import { applyDevDataset, type DevDataset } from './fixtures';

const OPTIONS: { id: DevDataset; label: string }[] = [
  { id: 'demo', label: 'Demo data' },
  { id: 'worst', label: 'Worst case' },
  { id: 'one', label: 'One' },
];

function fromUrl(): DevDataset {
  const v = new URLSearchParams(window.location.search).get('data');
  return v === 'worst' || v === 'one' ? v : 'demo';
}

/**
 * Chave de dados de teste, só em desenvolvimento (?data=worst | one). Fica no rodapé, fora do
 * caminho do app; troca na hora e guarda a escolha no endereço, para o recarregar manter.
 */
export function DevDataToggle() {
  const [current, setCurrent] = useState<DevDataset>(fromUrl);

  useEffect(() => {
    if (current !== 'demo') applyDevDataset(current);
  }, [current]);

  const choose = (id: DevDataset) => {
    const url = new URL(window.location.href);
    if (id === 'demo') url.searchParams.delete('data');
    else url.searchParams.set('data', id);
    window.history.replaceState(window.history.state, '', url);
    if (id === 'demo') applyDevDataset('demo');
    setCurrent(id);
  };

  return (
    <div
      role="radiogroup"
      aria-label="Dev data"
      style={{
        position: 'fixed',
        left: '50%',
        bottom: 'calc(8px + env(safe-area-inset-bottom, 0px))',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        display: 'flex',
        gap: 2,
        padding: 3,
        borderRadius: 999,
        background: '#d4d4d4',
        font: '12px/1 system-ui, sans-serif',
        boxShadow: '0 2px 8px rgb(0 0 0 / 0.2)',
      }}
    >
      {OPTIONS.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={current === o.id}
          onClick={() => choose(o.id)}
          style={{
            border: 0,
            borderRadius: 999,
            padding: '6px 10px',
            background: current === o.id ? '#fff' : 'transparent',
            color: '#111',
            font: 'inherit',
            cursor: 'pointer',
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
