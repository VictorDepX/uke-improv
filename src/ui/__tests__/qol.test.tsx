import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { encodeShare } from '@/core/share';
import { useMusicStore } from '@/store/useMusicStore';
import { App } from '../App';

vi.mock('@/audio/engine/sound', () => ({
  preloadAudio: vi.fn(),
  preloadAudioWhenIdle: vi.fn(() => () => undefined),
  ensureAudio: vi.fn(() => new Promise(() => undefined)),
  playNote: vi.fn(() => Promise.resolve()),
  playChord: vi.fn(() => Promise.resolve()),
  setLayerVolume: vi.fn(),
  strum: vi.fn(),
  playSequence: vi.fn(() => Promise.resolve()),
}));
vi.mock('@/sync/api', () => ({
  ApiError: class extends Error {},
  getSessionUser: vi.fn(() => Promise.resolve(null)),
}));

const initial = useMusicStore.getState();

describe('qualidade de vida', () => {
  beforeEach(() => {
    useMusicStore.setState(initial, true);
    window.history.replaceState(null, '', '/');
  });

  it('boas-vindas aparecem na primeira visita e somem para sempre ao começar', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Começar' }));
    expect(screen.queryByRole('dialog', { name: 'Bem-vindo ao Uke Improv' })).toBeNull();
    expect(useMusicStore.getState().settings.onboarded).toBe(true);
  });

  it('atalhos: 2 escolhe o ii do campo, P abre o modo prática, ? lista os atalhos', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.keyboard('2');
    expect(useMusicStore.getState().currentChord).toBe('Dm');
    await user.keyboard('?');
    expect(screen.getByText(/espaço toca\/para a base/)).toBeInTheDocument();
    await user.keyboard('p');
    expect(await screen.findByRole('dialog', { name: 'Modo prática' })).toBeInTheDocument();
  });

  it('link compartilhado carrega tom, progressão e andamento, sem duplicar ao abrir de novo', () => {
    const code = encodeShare({
      key: { tonic: 'D', scale: 'major' },
      progression: {
        id: 'x',
        name: 'Valsa',
        mode: 'major',
        numerals: ['I', 'IV', 'V7', 'I'],
        meter: '3/4',
      },
      bpm: 126,
      grooveId: 'valsa',
    });
    window.history.replaceState(null, '', `/jam?s=${code}`);
    const { unmount } = render(<App />);
    const s = useMusicStore.getState();
    expect(s.key).toEqual({ tonic: 'D', scale: 'major' });
    expect(s.jam).toMatchObject({ bpm: 126, grooveId: 'valsa' });
    expect(s.customProgressions).toHaveLength(1);
    expect(s.jam.progressionId).toBe(s.customProgressions[0]!.id);
    expect(window.location.search).toBe('');
    unmount();
    window.history.replaceState(null, '', `/jam?s=${code}`);
    act(() => void render(<App />));
    expect(useMusicStore.getState().customProgressions).toHaveLength(1);
  });

  it('link adulterado não muda nada e avisa', () => {
    window.history.replaceState(null, '', '/jam?s=bm9wZQ');
    render(<App />);
    expect(useMusicStore.getState().customProgressions).toHaveLength(0);
    expect(screen.getByText('Link de progressão inválido.')).toBeInTheDocument();
  });
});
