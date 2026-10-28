import {
  SECTIONS,
  mergeSnapshots,
  rowToSnapshot,
  snapshotToRow,
  type SectionId,
  type Snapshot,
} from '@/core/sync';
import { useMusicStore, type MusicState } from '@/store/useMusicStore';
import * as api from './api';

/** O que cada bloco leva do store. */
const pick: Record<SectionId, (s: MusicState) => unknown> = {
  settings: (s) => s.settings,
  progressions: (s) => s.customProgressions,
  progress: (s) => s.progress,
};

/** Limites dos campos de conta. O servidor também valida; isto evita enviar lixo. */
export const ACCOUNT_LIMITS = { name: 60, email: 254, passwordMin: 8, passwordMax: 128 } as const;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Mensagem de erro para dados de conta inválidos; null se estiverem bons. */
export function credentialsError(email: string, password: string, name?: string): string | null {
  const creating = name !== undefined;
  if (email.length > ACCOUNT_LIMITS.email || !EMAIL_RE.test(email)) return 'E-mail inválido.';
  if (password.length > ACCOUNT_LIMITS.passwordMax)
    return 'A senha pode ter no máximo 128 caracteres.';
  // No login, senha curta só pode estar errada: o servidor responde como qualquer senha errada.
  if (creating && password.length < ACCOUNT_LIMITS.passwordMin)
    return 'A senha precisa de pelo menos 8 caracteres.';
  if (creating && (name.length === 0 || name.length > ACCOUNT_LIMITS.name))
    return 'O nome precisa ter de 1 a 60 caracteres.';
  return null;
}

const PUSH_DELAY = 1500;
const FOCUS_THROTTLE = 30_000;

let started = false;
let applying = false;
let pushTimer = 0;
let lastPull = 0;
let pending = new Set<SectionId>();

const state = () => useMusicStore.getState();
const setAccount = (patch: Partial<MusicState['account']>) => state().setAccount(patch);

function localSnapshot(only?: Iterable<SectionId>): Snapshot {
  const s = state();
  const out: Snapshot = {};
  for (const id of only ?? SECTIONS) {
    // Sem registro de mudança (dados de antes das contas): conta como muito antigo, então o
    // servidor vence se já tiver o bloco; se não tiver, o do aparelho sobe.
    const at = s.syncMeta[id] ?? 1;
    out[id] = { value: pick[id](s), at };
  }
  return out;
}

function message(err: unknown): string {
  if (err instanceof api.ApiError) {
    if (err.code === 'USER_ALREADY_EXISTS' || err.code === 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL')
      return 'Já existe uma conta com esse e-mail.';
    if (err.code === 'INVALID_EMAIL_OR_PASSWORD') return 'E-mail ou senha incorretos.';
    if (err.code === 'PASSWORD_TOO_SHORT') return 'A senha precisa de pelo menos 8 caracteres.';
    if (err.code === 'INVALID_EMAIL' || err.code === 'VALIDATION_ERROR') return 'E-mail inválido.';
    if (err.code === 'INVALID_ORIGIN')
      return 'Este endereço do app não está autorizado a usar contas.';
    if (err.status === 401) return 'Sessão expirada. Entre de novo.';
    return err.message;
  }
  return 'Sem conexão com o servidor. As mudanças ficam no aparelho e sobem depois.';
}

/** Puxa do servidor, aplica o que for mais novo e envia o resto. */
export async function syncNow(): Promise<void> {
  const user = state().account.user;
  if (!user) return;
  setAccount({ sync: 'syncing', error: null });
  try {
    const remote = rowToSnapshot(await api.fetchUserData());
    const { pull, push } = mergeSnapshots(localSnapshot(), remote);
    if (Object.keys(pull).length) {
      applying = true;
      state().applyRemote(pull);
      applying = false;
    }
    if (Object.keys(push).length) await api.upsertUserData(user.id, snapshotToRow(push));
    lastPull = Date.now();
    pending = new Set();
    setAccount({ sync: 'ok', lastSync: Date.now() });
  } catch (err) {
    applying = false;
    if (err instanceof api.ApiError && err.status === 401) {
      setAccount({ status: 'signedOut', user: null, sync: 'idle', error: message(err) });
      return;
    }
    setAccount({ sync: 'error', error: message(err) });
  }
}

async function pushPending(): Promise<void> {
  const user = state().account.user;
  if (!user || pending.size === 0) return;
  const sections = [...pending];
  pending = new Set();
  setAccount({ sync: 'syncing', error: null });
  try {
    await api.upsertUserData(user.id, snapshotToRow(localSnapshot(sections)));
    setAccount({ sync: 'ok', lastSync: Date.now() });
  } catch (err) {
    sections.forEach((id) => pending.add(id));
    setAccount({ sync: 'error', error: message(err) });
  }
}

/** Marca blocos mudados neste aparelho e agenda o envio. */
function watchChanges(): void {
  useMusicStore.subscribe((s, prev) => {
    if (applying) return;
    const changed = SECTIONS.filter((id) => pick[id](s) !== pick[id](prev));
    if (changed.length === 0) return;
    const now = Date.now();
    useMusicStore.setState({
      syncMeta: { ...s.syncMeta, ...Object.fromEntries(changed.map((id) => [id, now])) },
    });
    if (!s.account.user) return;
    changed.forEach((id) => pending.add(id));
    window.clearTimeout(pushTimer);
    pushTimer = window.setTimeout(() => void pushPending(), PUSH_DELAY);
  });
}

/** Liga a sincronização: confere a sessão e acompanha mudanças. Uma vez por página. */
export async function startSync(): Promise<void> {
  if (started) return;
  started = true;
  watchChanges();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && Date.now() - lastPull > FOCUS_THROTTLE)
      void syncNow();
    if (document.visibilityState === 'hidden') void pushPending();
  });
  window.addEventListener('online', () => void syncNow());
  try {
    const user = await api.getSessionUser();
    setAccount({ status: user ? 'signedIn' : 'signedOut', user });
    if (user) await syncNow();
  } catch {
    // Sem rede: segue como está; tenta de novo ao voltar a conexão ou ao focar o app.
    setAccount({ status: 'signedOut', user: null });
  }
}

export async function signUp(name: string, email: string, password: string): Promise<boolean> {
  const invalid = credentialsError(email, password, name);
  setAccount({ error: invalid });
  if (invalid) return false;
  try {
    const user = await api.signUp(name, email, password);
    setAccount({ status: 'signedIn', user });
    await syncNow();
    return true;
  } catch (err) {
    setAccount({ error: message(err) });
    return false;
  }
}

export async function signIn(email: string, password: string): Promise<boolean> {
  const invalid = credentialsError(email, password);
  setAccount({ error: invalid });
  if (invalid) return false;
  try {
    const user = await api.signIn(email, password);
    setAccount({ status: 'signedIn', user });
    await syncNow();
    return true;
  } catch (err) {
    setAccount({ error: message(err) });
    return false;
  }
}

export async function signOut(): Promise<void> {
  await pushPending();
  try {
    await api.signOut();
  } finally {
    setAccount({ status: 'signedOut', user: null, sync: 'idle', lastSync: null, error: null });
  }
}

/** Para testes: volta ao estado inicial do módulo. */
export function __resetSyncForTests(): void {
  started = false;
  applying = false;
  pending = new Set();
  lastPull = 0;
  window.clearTimeout(pushTimer);
}
