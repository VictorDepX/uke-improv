import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useMusicStore } from '@/store/useMusicStore';
import { App } from '../App';
import { TAB_PATHS } from '../routes';

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

describe('acessibilidade (axe)', () => {
  beforeEach(() => useMusicStore.setState(initial, true));

  // jsdom não calcula cores nem layout: contraste e alvos de toque ficam para o Lighthouse.
  const options: axe.RunOptions = {
    rules: { 'color-contrast': { enabled: false }, 'target-size': { enabled: false } },
  };

  for (const lang of ['pt', 'en'] as const)
    for (const [tab, path] of Object.entries(TAB_PATHS[lang]))
      it(`${path} (${tab}) sem violações`, async () => {
        window.history.replaceState(null, '', path);
        const { container } = render(<App />);
        await waitFor(() =>
          expect(screen.queryByRole('status', { name: /Carregando|Loading/ })).toBeNull(),
        );
        const { violations, passes } = await axe.run(container, options);
        expect(passes.length).toBeGreaterThan(10);
        expect(
          violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`),
        ).toEqual([]);
      });
});

describe('braço pelo teclado', () => {
  beforeEach(() => {
    useMusicStore.setState(initial, true);
    window.history.replaceState(null, '', '/');
  });

  it('uma parada no Tab; setas andam pelas casas; Enter toca; I explica', async () => {
    const user = userEvent.setup();
    render(<App />);
    const board = screen.getByRole('group', { name: 'Braço do ukulele' });
    const stops = board.querySelectorAll('.fb-cell[tabindex="0"]');
    expect(stops).toHaveLength(1);
    (stops[0] as HTMLElement).focus();
    // horizontal: começa na corda A, casa solta; → anda uma casa, ↓ desce para a corda E
    await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(document.activeElement).toHaveAccessibleName(/^B4, corda A, casa 2/);
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toHaveAccessibleName(/^F#4, corda E, casa 2/);
    await user.keyboard('{Enter}');
    expect(useMusicStore.getState().lastNotes.at(-1)).toBe(66);
    await user.keyboard('i');
    expect(screen.getByRole('dialog', { name: /Por que F#/ })).toBeInTheDocument();
  });
});
