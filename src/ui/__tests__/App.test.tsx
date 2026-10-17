import { act, render, screen, within } from '@testing-library/react';
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

  it('o modo prática abre em tela cheia com braço e sugestões, e fecha com Esc', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Abrir modo prática' }));
    const dialog = screen.getByRole('dialog', { name: 'Modo prática' });
    expect(within(dialog).getByRole('group', { name: 'Braço do ukulele' })).toBeInTheDocument();
    expect(within(dialog).getByText('Toque uma casa')).toBeInTheDocument();

    await user.click(within(dialog).getByRole('radio', { name: 'G7' }));
    await user.click(within(dialog).getByRole('button', { name: /^B4, corda A, casa 2/ }));
    const notes = within(dialog).getByRole('list', { name: 'Próximas notas sugeridas' });
    expect(within(notes).getAllByRole('button')[0]).toHaveTextContent('C5');

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('com a região automática, o braço mostra 5 casas e anda com as setas', async () => {
    const user = userEvent.setup();
    useMusicStore.getState().updateSettings({ fretWindow: 'auto' });
    render(<App />);
    expect(screen.getByText(/Casas 1–5/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /casa 6:/ })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Casas mais agudas' }));
    expect(screen.getByText(/Casas 2–6/)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /casa 6:/ })).toHaveLength(4);
  });

  it('um preset ajusta tom, progressão e andamento com um toque', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('link', { name: 'Jam' }));
    await user.click(screen.getByRole('radio', { name: /Blues em A/ }));
    expect(screen.getByRole('radio', { name: /Blues em A/ })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    const bars = screen.getByRole('list', { name: 'Compassos da progressão' });
    expect(within(bars).getAllByRole('listitem')).toHaveLength(12);
    expect(within(bars).getAllByRole('listitem')[0]).toHaveTextContent('A7');
    expect(useMusicStore.getState().jam.bpm).toBe(96);
    expect(screen.getByRole('button', { name: /A\s*Blues/ })).toBeInTheDocument();
  });

  it('as formas por classe vêm ligadas e podem ser desligadas em Ajustes', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    expect(container.querySelector('.app')).toHaveAttribute('data-shapes', 'true');
    await user.click(screen.getByRole('link', { name: 'Ajustes' }));
    await user.click(screen.getByRole('switch', { name: /Formas além da cor/ }));
    expect(container.querySelector('.app')).not.toHaveAttribute('data-shapes');
  });

  it('clique direito numa casa explica a cor sem tocar a nota', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('radio', { name: /G7/ }));
    const cell = screen.getByRole('button', { name: /^F4, corda E, casa 1/ });
    await user.pointer({ keys: '[MouseRight]', target: cell });
    const info = screen.getByRole('dialog', { name: /Por que F é tensão/ });
    expect(info).toHaveTextContent('7ª menor de G7');
    expect(info).toHaveTextContent('Tende a ir para E');
    expect(useMusicStore.getState().lastNotes).toEqual([]);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('o tap tempo define o andamento pelo pulso tocado', async () => {
    const user = userEvent.setup();
    let t = 1000;
    const now = vi.spyOn(performance, 'now').mockImplementation(() => t);
    render(<App />);
    await user.click(screen.getByRole('link', { name: 'Jam' }));
    const tap = screen.getByRole('button', { name: /Tap tempo/ });
    for (let i = 0; i < 4; i++) {
      await user.click(tap);
      t += 500; // 120 BPM
    }
    expect(useMusicStore.getState().jam.bpm).toBe(120);
    now.mockRestore();
  });

  it('com capo na casa 2, o braço começa no capo e D usa a forma de C', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('link', { name: 'Ajustes' }));
    await user.selectOptions(screen.getByLabelText('Capotraste'), '2');
    await user.click(screen.getByRole('link', { name: 'Explorar' }));
    expect(screen.getAllByText('Capo 2').length).toBeGreaterThan(0);
    // Corda G presa no capo soa A4; a 1ª casa depois dele é a casa 3 física.
    expect(
      screen.getByRole('button', { name: /^A4, corda G, capo na casa 2/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^A#4, corda G, casa 3:|^Bb4, corda G, casa 3:/ }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /corda G, casa 16/ })).not.toBeInTheDocument();
    act(() => useMusicStore.getState().setTonic('D'));
    expect(document.querySelector('.current-chord .chord-shape-of')).toHaveTextContent(
      'forma de C · capo 2',
    );
  });

  it('em Ajustes, trocar rótulos para grau muda o texto das casas', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('link', { name: 'Ajustes' }));
    await user.click(screen.getByRole('radio', { name: 'Grau' }));
    expect(useMusicStore.getState().settings.labels).toBe('degree');
  });
});
