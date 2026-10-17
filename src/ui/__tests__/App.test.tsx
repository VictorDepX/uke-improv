import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useMusicStore } from '@/store/useMusicStore';
import { App } from '../App';

vi.mock('@/audio/engine/sound', () => ({
  preloadAudio: vi.fn(),
  ensureAudio: vi.fn(() => new Promise(() => undefined)),
  playNote: vi.fn(() => Promise.resolve()),
  playChord: vi.fn(() => Promise.resolve()),
  setLayerVolume: vi.fn(),
  strum: vi.fn(),
}));

const initial = useMusicStore.getState();

describe('App', () => {
  beforeEach(() => {
    useMusicStore.setState(initial, true);
    window.location.hash = '';
  });

  it('abre na aba Explorar com o braço e o campo harmônico de C maior', () => {
    render(<App />);
    expect(screen.getByRole('group', { name: 'Braço do ukulele' })).toBeInTheDocument();
    const strip = screen.getByRole('radiogroup', { name: 'Acorde atual' });
    expect(
      within(strip)
        .getAllByRole('radio')
        .map((r) => r.textContent),
    ).toEqual(['IC', 'iiDm', 'iiiEm', 'IVF', 'VG', 'V7G7', 'viAm', 'vii°Bdim']);
  });

  it('tocar B sobre G7 sugere C como próxima nota nº 1 (critério do Módulo 1)', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('radio', { name: /G7/ }));
    // B4 = corda A, casa 2
    await user.click(screen.getByRole('button', { name: /^B4, corda A, casa 2/ }));
    const list = screen.getAllByRole('listitem').filter((li) => li.querySelector('.suggestion'));
    expect(list[0]).toHaveTextContent('C5');
    expect(list[0]).toHaveTextContent('resolve a sensível');
  });

  it('as sugestões de acorde sobre G começam por C e Am (critério do Módulo 3)', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('radio', { name: /^VG$/ }));
    const items = document.querySelectorAll('.chord-suggestion strong');
    expect(
      Array.from(items)
        .slice(0, 2)
        .map((n) => n.textContent),
    ).toEqual(['C', 'Am']);
  });

  it('escolher um acorde sugerido o torna o acorde atual', async () => {
    const user = userEvent.setup();
    render(<App />);
    const first = document.querySelector<HTMLButtonElement>('.chord-suggestion')!;
    const symbol = first.querySelector('strong')!.textContent!;
    await user.click(first);
    expect(useMusicStore.getState().currentChord).toBe(symbol);
  });

  it('a aba Jam mostra a progressão pop transposta para o tom', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('link', { name: 'Jam' }));
    const bars = screen.getByRole('list', { name: 'Compassos da progressão' });
    expect(
      within(bars)
        .getAllByRole('listitem')
        .map((li) => li.querySelector('strong')!.textContent),
    ).toEqual(['C', 'G', 'Am', 'F']);
    await user.selectOptions(screen.getByLabelText('Tom'), 'G');
    expect(
      within(bars)
        .getAllByRole('listitem')
        .map((li) => li.querySelector('strong')!.textContent),
    ).toEqual(['G', 'D', 'Em', 'C']);
  });

  it('monta e salva uma progressão própria', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('link', { name: 'Jam' }));
    const editor = screen.getByRole('region', { name: 'Montar progressão' });
    await user.click(within(editor).getByRole('button', { name: 'Am' }));
    // Depois de Am, F aparece também entre os sugeridos; qualquer um serve.
    await user.click(within(editor).getAllByRole('button', { name: 'F' })[0]!);
    await user.click(within(editor).getByRole('button', { name: 'Salvar progressão' }));
    const saved = useMusicStore.getState().customProgressions;
    expect(saved).toHaveLength(1);
    expect(saved[0]!.numerals).toEqual(['vi', 'IV']);
  });

  it('o botão de tom resume o tom atual e abre o seletor recolhido', async () => {
    const user = userEvent.setup();
    render(<App />);
    const toggle = screen.getByRole('button', { name: /C\s*Maior/ });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(document.getElementById('key-picker')).toHaveAttribute('data-open', 'true');
    await user.selectOptions(screen.getByLabelText('Tom'), 'A');
    expect(screen.getByRole('button', { name: /A\s*Maior/ })).toBeInTheDocument();
  });

  it('em Ajustes, trocar rótulos para grau muda o texto das casas', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('link', { name: 'Ajustes' }));
    await user.click(screen.getByRole('radio', { name: 'Grau' }));
    expect(useMusicStore.getState().settings.labels).toBe('degree');
  });
});
