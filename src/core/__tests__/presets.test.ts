import { describe, expect, it } from 'vitest';
import { PRESETS, matchPreset } from '../presets';
import { PROGRESSIONS, progressionChords } from '../progressions';

describe('presets', () => {
  it('todos apontam para progressões existentes e geram acordes', () => {
    for (const p of PRESETS) {
      const prog = PROGRESSIONS.find((x) => x.id === p.progressionId);
      expect(prog, p.id).toBeDefined();
      expect(progressionChords(prog!, { tonic: p.tonic, scale: p.scale }).length).toBeGreaterThan(
        0,
      );
    }
  });

  it('blues em A usa A7, D7 e E7 sobre a escala blues', () => {
    const p = PRESETS.find((x) => x.id === 'blues-a')!;
    const prog = PROGRESSIONS.find((x) => x.id === 'blues')!;
    expect(new Set(progressionChords(prog, { tonic: p.tonic, scale: p.scale }))).toEqual(
      new Set(['A7', 'D7', 'E7']),
    );
  });

  it('reconhece o preset ativo só quando tudo bate', () => {
    expect(
      matchPreset({ key: { tonic: 'C', scale: 'major' }, progressionId: 'pop', bpm: 90 })?.id,
    ).toBe('pop-c');
    expect(
      matchPreset({ key: { tonic: 'C', scale: 'major' }, progressionId: 'pop', bpm: 95 }),
    ).toBeUndefined();
  });
});
