import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeT, noteNamer, tx } from '@/i18n';
import { useMusicStore } from '@/store/useMusicStore';
import { App } from '../App';
import { TABS, TAB_PATHS, hrefFor, routeFromLocation } from '../routes';

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

function setBrowserLanguages(langs: string[]) {
  vi.spyOn(navigator, 'languages', 'get').mockReturnValue(langs);
}

describe('t()', () => {
  it('escolhe o texto do idioma e aceita Txt pronto', () => {
    expect(makeT('pt')('Salvar', 'Save')).toBe('Salvar');
    expect(makeT('en')('Salvar', 'Save')).toBe('Save');
    expect(makeT('en')(tx('Tônica', 'Tonic'))).toBe('Tonic');
    expect(makeT('en')('C7')).toBe('C7');
  });
});

describe('rotas por idioma', () => {
  it('cada aba tem um caminho em cada idioma, todos diferentes', () => {
    const all = [...Object.values(TAB_PATHS.pt), ...Object.values(TAB_PATHS.en)];
    expect(new Set(all).size).toBe(TABS.length * 2);
    expect(hrefFor('ouvido', 'en')).toBe('/en/ear');
  });

  it('o endereço diz a aba e o idioma; o # antigo ainda abre a aba', () => {
    expect(routeFromLocation('/en/settings', '')).toEqual({ tab: 'ajustes', lang: 'en' });
    expect(routeFromLocation('/en/', '')).toEqual({ tab: 'explorar', lang: 'en' });
    expect(routeFromLocation('/jam', '')).toEqual({ tab: 'jam', lang: 'pt' });
    expect(routeFromLocation('/', '#ouvido')).toEqual({ tab: 'ouvido', lang: 'pt' });
  });
});

describe('App em dois idiomas', () => {
  beforeEach(() => {
    useMusicStore.setState(initial, true);
    window.history.replaceState(null, '', '/');
    setBrowserLanguages(['pt-BR']);
  });
  afterEach(() => vi.restoreAllMocks());

  it('/en abre em inglês, com o atributo lang e o título em inglês', () => {
    window.history.replaceState(null, '', '/en');
    render(<App />);
    expect(screen.getByRole('link', { name: 'Explore' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Ear' })).toHaveAttribute('href', '/en/ear');
    expect(document.documentElement.lang).toBe('en');
    expect(document.title).toMatch(/improvise on ukulele/);
  });

  it('o botão EN troca o idioma, o endereço e guarda a escolha', async () => {
    const user = userEvent.setup();
    window.history.replaceState(null, '', '/jam');
    render(<App />);
    await user.click(screen.getByRole('link', { name: 'Switch to English' }));
    expect(screen.getByRole('link', { name: 'Settings' })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/en/jam');
    expect(useMusicStore.getState().settings.lang).toBe('en');
    await user.click(screen.getByRole('link', { name: 'Mudar para português' }));
    expect(window.location.pathname).toBe('/jam');
  });

  it('quem escolheu inglês e abre um link em português vê o app em inglês', () => {
    useMusicStore.getState().updateSettings({ lang: 'en' });
    window.history.replaceState(null, '', '/ouvido');
    render(<App />);
    expect(screen.getByRole('link', { name: 'Ear' })).toHaveAttribute('aria-current', 'page');
    expect(window.location.pathname).toBe('/en/ear');
  });

  it('navegador em inglês numa página em português: oferece trocar, sem redirecionar', async () => {
    const user = userEvent.setup();
    setBrowserLanguages(['en-US', 'en']);
    render(<App />);
    expect(screen.getByText('Uke Improv is also available in English.')).toBeInTheDocument();
    expect(window.location.pathname).toBe('/');
    await user.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByText('Uke Improv is also available in English.')).toBeNull();
    expect(useMusicStore.getState().settings.lang).toBe('pt');
  });

  it('navegador em português numa página em português: nenhuma faixa', () => {
    render(<App />);
    expect(screen.queryByRole('region', { name: /English/ })).toBeNull();
  });
});

describe('nomes Dó Ré Mi', () => {
  it('troca só as letras da fundamental e do baixo', () => {
    const pt = noteNamer('solfege', 'pt');
    expect(['C', 'C#m7', 'Bb4', 'F#', 'G7', 'Bdim', 'D/F#', 'Ebmaj7'].map(pt)).toEqual([
      'Dó',
      'Dó#m7',
      'Sib4',
      'Fá#',
      'Sol7',
      'Sidim',
      'Ré/Fá#',
      'Mibmaj7',
    ]);
    expect(noteNamer('solfege', 'en')('A7')).toBe('La7');
    expect(noteNamer('letters', 'pt')('A7')).toBe('A7');
  });

  it('com Dó Ré Mi, braço, campo harmônico e explicações usam os nomes', async () => {
    const user = userEvent.setup();
    useMusicStore.setState(initial, true);
    useMusicStore.getState().updateSettings({ noteNames: 'solfege' });
    window.history.replaceState(null, '', '/');
    render(<App />);
    const strip = screen.getByRole('radiogroup', { name: 'Acorde atual' });
    expect(strip).toHaveTextContent('Sol7');
    expect(strip).toHaveTextContent('Lám');
    // a casa ainda é encontrada pelo nome novo; o estado guarda letras
    await user.click(screen.getByRole('radio', { name: /Sol7/ }));
    expect(useMusicStore.getState().currentChord).toBe('G7');
    await user.click(screen.getByRole('button', { name: /^Si4, corda Lá, casa 2/ }));
    const first = screen.getAllByRole('listitem').find((li) => li.querySelector('.suggestion'))!;
    expect(first).toHaveTextContent('Dó5');
  });
});
