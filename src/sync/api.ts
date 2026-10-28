import type { UserDataRow } from '@/core/sync';

/**
 * Cliente mínimo do Neon Auth (Better Auth gerenciado) e do Data API (PostgREST),
 * pelos caminhos /api do próprio domínio (rewrite na Vercel, proxy no Vite).
 * A sessão fica num cookie HttpOnly primário; o Data API recebe um JWT curto do /token.
 */

const AUTH = 'api/auth';
const DATA = 'api/data';

export interface AccountUser {
  id: string;
  name: string;
  email: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
  }
}

/** Sempre a partir da raiz do domínio: a página pode estar em /jam, /ouvido etc. */
const url = (path: string) => new URL(`/${path}`, window.location.origin).toString();

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(url(path), {
    credentials: 'include',
    ...init,
    headers: { 'Content-Type': 'application/json', ...init.headers },
  });
  const text = await res.text();
  const body = text ? (JSON.parse(text) as unknown) : null;
  if (!res.ok) {
    const b = (body ?? {}) as { message?: string; code?: string };
    throw new ApiError(b.message ?? `HTTP ${res.status}`, res.status, b.code);
  }
  return body as T;
}

const toUser = (u: { id: string; name?: string; email: string }): AccountUser => ({
  id: u.id,
  name: u.name ?? '',
  email: u.email,
});

let jwt: { token: string; exp: number } | null = null;

export async function signUp(name: string, email: string, password: string): Promise<AccountUser> {
  jwt = null;
  const r = await request<{ user: { id: string; name: string; email: string } }>(
    `${AUTH}/sign-up/email`,
    {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    },
  );
  return toUser(r.user);
}

export async function signIn(email: string, password: string): Promise<AccountUser> {
  jwt = null;
  const r = await request<{ user: { id: string; name: string; email: string } }>(
    `${AUTH}/sign-in/email`,
    {
      method: 'POST',
      body: JSON.stringify({ email, password, rememberMe: true }),
    },
  );
  return toUser(r.user);
}

export async function signOut(): Promise<void> {
  jwt = null;
  await request(`${AUTH}/sign-out`, { method: 'POST', body: '{}' });
}

export async function getSessionUser(): Promise<AccountUser | null> {
  const r = await request<{ user?: { id: string; name: string; email: string } } | null>(
    `${AUTH}/get-session`,
  );
  return r?.user ? toUser(r.user) : null;
}

/** `exp` do JWT, em ms. */
export function jwtExpiry(token: string): number {
  try {
    const payload = JSON.parse(
      atob(token.split('.')[1]!.replace(/-/g, '+').replace(/_/g, '/')),
    ) as {
      exp?: number;
    };
    return (payload.exp ?? 0) * 1000;
  } catch {
    return 0;
  }
}

async function token(): Promise<string> {
  if (jwt && jwt.exp - Date.now() > 30_000) return jwt.token;
  const r = await request<{ token: string }>(`${AUTH}/token`);
  jwt = { token: r.token, exp: jwtExpiry(r.token) };
  return r.token;
}

async function data<T>(path: string, init: RequestInit = {}): Promise<T> {
  const t = await token();
  return request<T>(`${DATA}/${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${t}`, ...init.headers },
  });
}

const COLUMNS = 'user_id,settings,settings_at,progressions,progressions_at,progress,progress_at';

export async function fetchUserData(): Promise<UserDataRow | null> {
  const rows = await data<UserDataRow[]>(`user_data?select=${COLUMNS}`);
  return rows[0] ?? null;
}

/** Grava os blocos enviados (cria a linha na primeira vez). */
export async function upsertUserData(userId: string, row: UserDataRow): Promise<void> {
  await data('user_data?on_conflict=user_id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ ...row, user_id: userId, updated_at: new Date().toISOString() }),
  });
}
