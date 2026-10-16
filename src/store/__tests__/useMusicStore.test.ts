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
