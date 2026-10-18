import { describe, expect, it } from 'vitest';
import { mergeSnapshots, rowToSnapshot, snapshotToRow } from '../sync';

describe('sincronização por blocos', () => {
  it('a versão mais nova vence, bloco a bloco', () => {
    const { pull, push } = mergeSnapshots(
      { settings: { value: 'local', at: 200 }, progressions: { value: 'L', at: 100 } },
      { settings: { value: 'remoto', at: 150 }, progressions: { value: 'R', at: 300 } },
    );
    expect(push).toEqual({ settings: { value: 'local', at: 200 } });
    expect(pull).toEqual({ progressions: { value: 'R', at: 300 } });
  });

  it('bloco que só existe de um lado vai para o outro; empate não mexe', () => {
    const { pull, push } = mergeSnapshots(
      { settings: { value: 1, at: 10 }, progress: { value: 'p', at: 5 } },
      { progressions: { value: [], at: 7 }, progress: { value: 'q', at: 5 } },
    );
    expect(push).toEqual({ settings: { value: 1, at: 10 } });
    expect(pull).toEqual({ progressions: { value: [], at: 7 } });
  });

  it('primeiro login num aparelho novo: tudo vem do servidor', () => {
    const remote = { settings: { value: { capo: 2 }, at: 1 } };
    expect(mergeSnapshots({}, remote)).toEqual({ pull: remote, push: {} });
  });

  it('converte de e para a linha da tabela', () => {
    const snap = { settings: { value: { capo: 2 }, at: Date.parse('2026-10-18T12:00:00.000Z') } };
    const row = snapshotToRow(snap);
    expect(row).toEqual({ settings: { capo: 2 }, settings_at: '2026-10-18T12:00:00.000Z' });
    expect(rowToSnapshot(row)).toEqual(snap);
    expect(rowToSnapshot(null)).toEqual({});
    expect(rowToSnapshot({ settings: null, settings_at: null })).toEqual({});
  });
});
