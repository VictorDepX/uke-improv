import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sendFeedback } from '@/monitoring';
import { useMusicStore } from '@/store/useMusicStore';
import { useToasts } from '../toast';
import { useFeedback } from '../feedback';
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
vi.mock('@/monitoring', () => ({
  feedbackAvailable: true,
  reportError: vi.fn(),
  sendFeedback: vi.fn(() => Promise.resolve(true)),
}));

const initial = useMusicStore.getState();

describe('feedback', () => {
  beforeEach(() => {
    useMusicStore.setState(initial, true);
    useMusicStore.getState().updateSettings({ onboarded: true });
    window.history.replaceState(null, '', '/');
    vi.mocked(sendFeedback).mockClear();
    useFeedback.getState().hide();
  });

  it('o menu e o rodapé abrem o mesmo diálogo, que só envia com texto', async () => {
    const user = userEvent.setup();
    render(<App />);
    const links = screen.getAllByRole('button', { name: 'Enviar feedback' });
    expect(links).toHaveLength(2);
    await user.click(links[0]!);
    const dialog = screen.getByRole('dialog', { name: 'Enviar feedback' });
    const send = within(dialog).getByRole('button', { name: 'Enviar' });
    expect(send).toBeDisabled();
    await user.type(within(dialog).getByLabelText('Sua mensagem'), '   ');
    expect(send).toBeDisabled();
  });

  it('envia a mensagem sem e-mail, fecha e confirma', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getAllByRole('button', { name: 'Enviar feedback' })[1]!);
    const dialog = screen.getByRole('dialog', { name: 'Enviar feedback' });
    await user.type(within(dialog).getByLabelText('Sua mensagem'), ' Falta o modo canhoto ');
    await user.click(within(dialog).getByRole('button', { name: 'Enviar' }));
    expect(sendFeedback).toHaveBeenCalledWith('Falta o modo canhoto', undefined);
    expect(screen.queryByRole('dialog', { name: 'Enviar feedback' })).toBeNull();
    expect(useToasts.getState().toasts.at(-1)?.kind).toBe('success');
  });

  it('falha no envio mantém o texto no campo e avisa', async () => {
    vi.mocked(sendFeedback).mockResolvedValueOnce(false);
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getAllByRole('button', { name: 'Enviar feedback' })[0]!);
    const dialog = screen.getByRole('dialog', { name: 'Enviar feedback' });
    await user.type(within(dialog).getByLabelText('Sua mensagem'), 'oi');
    await user.type(within(dialog).getByLabelText('E-mail (opcional)'), 'a@b.co');
    await user.click(within(dialog).getByRole('button', { name: 'Enviar' }));
    expect(sendFeedback).toHaveBeenCalledWith('oi', 'a@b.co');
    expect(within(dialog).getByLabelText('Sua mensagem')).toHaveValue('oi');
    expect(useToasts.getState().toasts.at(-1)?.kind).toBe('error');
  });

  it('Esc fecha o diálogo sem enviar', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getAllByRole('button', { name: 'Enviar feedback' })[0]!);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Enviar feedback' })).toBeNull();
    expect(sendFeedback).not.toHaveBeenCalled();
  });
});
