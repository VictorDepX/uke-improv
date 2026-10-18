import { beforeEach, describe, expect, it } from 'vitest';
import { PRESETS } from '@/core/presets';
import { useMusicStore } from '../useMusicStore';

const initial = useMusicStore.getState();

describe('useMusicStore', () => {
  beforeEach(() => useMusicStore.setState(initial, true));

  it('guarda só as 4 últimas notas', () => {
    const { registerNote } = useMusicStore.getState();
    [60, 62, 64, 65, 67].forEach(registerNote);
    expect(useMusicStore.getState().lastNotes).toEqual([62, 64, 65, 67]);
  });

  it('trocar de tom volta para o acorde da tônica e limpa o histórico', () => {
    const s = useMusicStore.getState();
    s.setChord('G');
    s.setTonic('A');
    expect(useMusicStore.getState().currentChord).toBe('A');
    expect(useMusicStore.getState().chordHistory).toEqual([]);
  });

  it('trocar para escala do mesmo modo mantém o acorde', () => {
    const s = useMusicStore.getState();
    s.setChord('F');
    s.setScale('majorPentatonic');
    expect(useMusicStore.getState().currentChord).toBe('F');
    s.setScale('minor');
    expect(useMusicStore.getState().currentChord).toBe('Cm');
  });

  it('escolher uma progressão menor muda a escala para menor', () => {
    useMusicStore.getState().selectProgression('minor');
    expect(useMusicStore.getState().key.scale).toBe('minor');
    expect(useMusicStore.getState().jam.progressionId).toBe('minor');
  });

  it('limita o andamento entre 60 e 160 BPM', () => {
    useMusicStore.getState().setBpm(400);
    expect(useMusicStore.getState().jam.bpm).toBe(160);
    useMusicStore.getState().setBpm(10);
    expect(useMusicStore.getState().jam.bpm).toBe(60);
  });

  it('registra o histórico de acordes ao trocar', () => {
    const s = useMusicStore.getState();
    s.setChord('F');
    s.setChord('G');
    expect(useMusicStore.getState().chordHistory).toEqual(['C', 'F']);
  });
});

describe('janela automática', () => {
  beforeEach(() => useMusicStore.setState(initial, true));

  it('segue a casa tocada na tela', () => {
    const s = useMusicStore.getState();
    s.updateSettings({ fretWindow: 'auto' });
    s.registerNote(74, 7); // D5 na corda G, casa 7
    expect(useMusicStore.getState().autoWindowStart).toBe(5);
    expect(useMusicStore.getState().lastFret).toBe(7);
  });

  it('nota do microfone usa a posição mais próxima da mão', () => {
    const s = useMusicStore.getState();
    s.registerNote(72, 12); // C5 na casa 12 (corda C)
    s.registerNote(76); // E5: a casa mais próxima de 12 é a 12 da corda E
    expect(useMusicStore.getState().lastFret).toBe(12);
  });

  it('as setas deslocam a janela fixa e a automática', () => {
    const s = useMusicStore.getState();
    s.updateSettings({ fretWindow: 3 });
    s.shiftWindow(1);
    expect(useMusicStore.getState().settings.fretWindow).toBe(4);
    s.updateSettings({ fretWindow: 'auto' });
    s.shiftWindow(-1);
    expect(useMusicStore.getState().autoWindowStart).toBe(1);
  });
});

describe('presets', () => {
  beforeEach(() => useMusicStore.setState(initial, true));

  it('aplica tom, escala, progressão, andamento e o primeiro acorde', () => {
    const blues = PRESETS.find((p) => p.id === 'blues-a')!;
    useMusicStore.getState().applyPreset(blues);
    const s = useMusicStore.getState();
    expect(s.key).toEqual({ tonic: 'A', scale: 'blues' });
    expect(s.jam.progressionId).toBe('blues');
    expect(s.jam.bpm).toBe(96);
    expect(s.currentChord).toBe('A7');
  });

  it('reescolher o blues não troca a escala blues por maior', () => {
    useMusicStore.getState().applyPreset(PRESETS.find((p) => p.id === 'blues-a')!);
    useMusicStore.getState().selectProgression('blues');
    expect(useMusicStore.getState().key.scale).toBe('blues');
  });
});

describe('capotraste', () => {
  beforeEach(() => useMusicStore.setState(initial, true));

  it('ao pôr o capo, a janela fica na mesma casa física', () => {
    const s = useMusicStore.getState();
    s.updateSettings({ fretWindow: 5 });
    s.updateSettings({ capo: 2 });
    expect(useMusicStore.getState().settings.fretWindow).toBe(3); // casa 5 física
    useMusicStore.getState().updateSettings({ capo: 0 });
    expect(useMusicStore.getState().settings.fretWindow).toBe(5);
  });

  it('a nota do microfone acha a posição a partir do capo', () => {
    useMusicStore.getState().updateSettings({ capo: 2, fretWindow: 'auto' });
    // A4 perto da mão (casa 3 a partir do capo): corda E, casa 3 do capo = 5 física.
    useMusicStore.getState().registerNote(69);
    expect(useMusicStore.getState().lastFret).toBe(3);
    useMusicStore.getState().registerNote(60); // C4 soa abaixo do capo: não há posição
    expect(useMusicStore.getState().lastFret).toBe(3);
    expect(useMusicStore.getState().lastNotes).toEqual([69, 60]);
  });
});

describe('exercícios', () => {
  beforeEach(() => useMusicStore.setState(initial, true));

  it('as notas tocadas são avaliadas pelo exercício em andamento', () => {
    const s = useMusicStore.getState();
    s.startExercise('repouso');
    s.registerNote(64); // E sobre C
    s.registerNote(62); // D sobre C: passagem
    const ex = useMusicStore.getState().exercise!;
    expect([ex.hits, ex.misses]).toEqual([1, 1]);
  });

  it('o alvo na troca avalia a primeira nota de cada acorde da base', () => {
    const s = useMusicStore.getState();
    s.startExercise('alvo');
    useMusicStore.setState((st) => ({ jam: { ...st.jam, playing: true, bar: 0, segment: 0 } }));
    s.registerNote(60);
    s.registerNote(61); // mesmo acorde: livre
    useMusicStore.setState((st) => ({ jam: { ...st.jam, segment: 1 } }));
    s.registerNote(62); // troca: D sobre C não é do acorde
    expect(useMusicStore.getState().exercise!.hits).toBe(1);
    expect(useMusicStore.getState().exercise!.misses).toBe(1);
  });

  it('o exercício não é salvo entre sessões', () => {
    useMusicStore.getState().startExercise('passo');
    const saved = JSON.parse(localStorage.getItem('uke-improv') ?? '{}');
    expect(saved.state.exercise).toBeUndefined();
  });
});
