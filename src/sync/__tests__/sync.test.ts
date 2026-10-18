import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserDataRow } from '@/core/sync';
import { useMusicStore } from '@/store/useMusicStore';

/** Servidor falso em memória com a mesma semântica do upsert por blocos. */
let server: UserDataRow | null = null;
const calls: string[] = [];
let sessionUser: { id: string; name: string; email: string } | null = null;

vi.mock('../api', () => {
  class ApiError extends Error {
    constructor(
      message: string,
      readonly status: number,
      readonly code?: string,
    ) {
      super(message);
    }
  }
  return {
    ApiError,
    getSessionUser: vi.fn(async () => sessionUser),
    signIn: vi.fn(async (email: string, password: string) => {
      calls.push('signIn');
      if (password !== 'certa-123') throw new ApiError('x', 401, 'INVALID_EMAIL_OR_PASSWORD');
      sessionUser = { id: 'u1', name: 'Vi', email };
      return sessionUser;
    }),
    signUp: vi.fn(async () => {
      throw new ApiError('x', 422, 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL');
    }),
    signOut: vi.fn(async () => {
      sessionUser = null;
    }),
    fetchUserData: vi.fn(async () => {
      calls.push('fetch');
      return server;
    }),
    upsertUserData: vi.fn(async (_id: string, row: UserDataRow) => {
      calls.push(
        `push:${Object.keys(row)
          .filter((k) => !k.endsWith('_at'))
          .join(',')}`,
      );
      server = { ...server, ...row };
    }),
  };
});

const sync = await import('../sync');
const initial = useMusicStore.getState();

describe('sincronização com a conta', () => {
  beforeEach(() => {
    useMusicStore.setState(initial, true);
    server = null;
    sessionUser = null;
    calls.length = 0;
    sync.__resetSyncForTests();
  });
  afterEach(() => vi.useRealTimers());

  it('sem sessão, fica deslogado e não chama o servidor de dados', async () => {
    await sync.startSync();
    expect(useMusicStore.getState().account.status).toBe('signedOut');
    expect(calls).toEqual([]);
  });

  it('primeiro login: o servidor vazio recebe os três blocos do aparelho', async () => {
    await sync.startSync();
    expect(await sync.signIn('a@b.c', 'certa-123')).toBe(true);
    expect(calls).toEqual(['signIn', 'fetch', 'push:settings,progressions,progress']);
    expect(useMusicStore.getState().account).toMatchObject({ status: 'signedIn', sync: 'ok' });
    expect((server!.settings as { capo: number }).capo).toBe(0);
  });

  it('aparelho novo: ajustes e progresso do servidor chegam ao aparelho', async () => {
    server = {
      settings: { capo: 3, labels: 'degree' },
      settings_at: '2026-10-18T10:00:00Z',
      progress: { ear: { interval: { correct: 7, total: 9, streak: 2, best: 5 } }, exercises: {} },
      progress_at: '2026-10-18T10:00:00Z',
    };
    sessionUser = { id: 'u1', name: 'Vi', email: 'a@b.c' };
    await sync.startSync();
    const s = useMusicStore.getState();
    expect(s.settings.capo).toBe(3);
    expect(s.settings.labels).toBe('degree');
    expect(s.progress.ear.interval?.correct).toBe(7);
    // As progressões (que o servidor não tinha) sobem; o resto não volta como eco.
    expect(calls).toEqual(['fetch', 'push:progressions']);
  });

  it('mudança local sobe sozinha depois de um instante, só o bloco mudado', async () => {
    vi.useFakeTimers();
    sessionUser = { id: 'u1', name: 'Vi', email: 'a@b.c' };
    await sync.startSync();
    calls.length = 0;
    useMusicStore.getState().updateSettings({ capo: 5 });
    useMusicStore.getState().updateSettings({ capo: 6 });
    expect(calls).toEqual([]);
    await vi.advanceTimersByTimeAsync(2000);
    expect(calls).toEqual(['push:settings']);
    expect((server!.settings as { capo: number }).capo).toBe(6);
  });

  it('o mais novo vence: mudança feita no outro aparelho depois sobrescreve a daqui', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-18T12:00:00Z'));
    sessionUser = { id: 'u1', name: 'Vi', email: 'a@b.c' };
    await sync.startSync();
    useMusicStore.getState().updateSettings({ capo: 1 }); // 12:00 aqui
    await vi.advanceTimersByTimeAsync(2000);
    // Outro aparelho grava às 12:10.
    server = {
      ...server,
      settings: { ...useMusicStore.getState().settings, capo: 4 },
      settings_at: '2026-10-18T12:10:00Z',
    };
    await sync.syncNow();
    expect(useMusicStore.getState().settings.capo).toBe(4);
  });

  it('senha errada e e-mail repetido mostram a mensagem certa', async () => {
    await sync.startSync();
    expect(await sync.signIn('a@b.c', 'errada')).toBe(false);
    expect(useMusicStore.getState().account.error).toBe('E-mail ou senha incorretos.');
    expect(await sync.signUp('X', 'a@b.c', 'qualquer-123')).toBe(false);
    expect(useMusicStore.getState().account.error).toBe('Já existe uma conta com esse e-mail.');
  });

  it('sair encerra a sessão; mudanças depois disso não sobem', async () => {
    vi.useFakeTimers();
    sessionUser = { id: 'u1', name: 'Vi', email: 'a@b.c' };
    await sync.startSync();
    await sync.signOut();
    calls.length = 0;
    useMusicStore.getState().updateSettings({ capo: 2 });
    await vi.advanceTimersByTimeAsync(2000);
    expect(calls).toEqual([]);
    expect(useMusicStore.getState().account.status).toBe('signedOut');
  });
});
