import { beforeEach, describe, expect, it } from 'vitest';
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
