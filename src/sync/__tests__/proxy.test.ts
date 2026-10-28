import { describe, expect, it, vi } from 'vitest';
import {
  firstPartyCookie,
  incomingHeaders,
  outgoingHeaders,
  proxyAuth,
  routeOf,
  targetUrl,
} from '../proxy';

const BASE = 'https://neon.example/neondb/auth';

describe('proxy do Neon Auth', () => {
  it('monta o destino pelo caminho ou pelo ?path= do rewrite', () => {
    expect(targetUrl('https://app.dev/api/auth/sign-in/email', BASE)).toBe(`${BASE}/sign-in/email`);
    expect(targetUrl('https://app.dev/api/neon-auth?path=get-session', BASE)).toBe(
      `${BASE}/get-session`,
    );
    expect(targetUrl('https://app.dev/api/neon-auth?path=sign-up/email&x=1', BASE)).toBe(
      `${BASE}/sign-up/email?x=1`,
    );
  });

  it('tira host e X-Forwarded-*, mantém Origin e cookie', () => {
    const h = outgoingHeaders(
      new Headers({
        host: 'app.dev',
        'x-forwarded-host': 'app.dev',
        'x-forwarded-for': '1.2.3.4',
        'x-vercel-id': 'abc',
        origin: 'https://app.dev',
        cookie: '__Secure-neon-auth.session_token=t',
        'content-type': 'application/json',
      }),
    );
    expect([...h.keys()].sort()).toEqual(['content-type', 'cookie', 'origin']);
  });

  it('repassa vários Set-Cookie separados e tira content-encoding', () => {
    const up = new Headers({ 'content-type': 'application/json', 'content-encoding': 'gzip' });
    up.append('set-cookie', 'a=1; Path=/; HttpOnly');
    up.append('set-cookie', 'b=2; Path=/');
    const h = incomingHeaders(up);
    expect(h.get('content-encoding')).toBeNull();
    expect(h.getSetCookie()).toEqual([
      'a=1; Path=/; HttpOnly; SameSite=Lax',
      'b=2; Path=/; SameSite=Lax',
    ]);
    expect(h.get('cache-control')).toBe('no-store');
  });

  it('encaminha método, corpo e status', async () => {
    const fetchImpl = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      expect(url).toBe(`${BASE}/sign-in/email`);
      expect(init?.method).toBe('POST');
      expect(new TextDecoder().decode(init?.body as ArrayBuffer)).toBe('{"email":"a@b.c"}');
      return new Response('{"message":"x"}', {
        status: 401,
        headers: { 'content-type': 'application/json' },
      });
    }) as unknown as typeof fetch;
    const res = await proxyAuth(
      new Request('https://app.dev/api/neon-auth?path=sign-in/email', {
        method: 'POST',
        body: '{"email":"a@b.c"}',
        headers: { origin: 'https://app.dev', 'x-forwarded-host': 'app.dev' },
      }),
      fetchImpl,
      BASE,
    );
    expect(res.status).toBe(401);
    expect(await res.text()).toBe('{"message":"x"}');
  });

  const ok = vi.fn(async () => new Response('{}', { status: 200 })) as unknown as typeof fetch;
  const call = (url: string, init: RequestInit = {}) => proxyAuth(new Request(url, init), ok, BASE);

  it('recusa chamadas de outro site (sessão e JWT não vazam)', async () => {
    const evil = { headers: { origin: 'https://evil.example', 'sec-fetch-site': 'cross-site' } };
    expect((await call('https://app.dev/api/auth/get-session', evil)).status).toBe(403);
    expect((await call('https://app.dev/api/auth/token', evil)).status).toBe(403);
    const onlyFetchSite = { headers: { 'sec-fetch-site': 'cross-site' } };
    expect((await call('https://app.dev/api/auth/token', onlyFetchSite)).status).toBe(403);
    const same = { headers: { 'sec-fetch-site': 'same-origin' } };
    expect((await call('https://app.dev/api/auth/get-session', same)).status).toBe(200);
  });

  it('só repassa as rotas e métodos que o app usa', async () => {
    expect((await call('https://app.dev/api/auth/admin/list-users')).status).toBe(404);
    expect((await call('https://app.dev/api/auth/delete-user', { method: 'POST' })).status).toBe(
      404,
    );
    expect((await call('https://app.dev/api/neon-auth?path=../../neondb/rest/v1')).status).toBe(
      404,
    );
    expect((await call('https://app.dev/api/auth/sign-in/email')).status).toBe(405);
    expect(routeOf('https://app.dev/api/neon-auth?path=sign-in%2F..%2F..')).toBeNull();
  });

  it('recusa corpo grande demais', async () => {
    const big = { method: 'POST', body: 'x'.repeat(9000) };
    expect((await call('https://app.dev/api/auth/sign-in/email', big)).status).toBe(413);
  });

  it('não devolve CORS e grava o cookie como SameSite=Lax', () => {
    const up = new Headers({
      'access-control-allow-origin': 'https://evil.example',
      'access-control-allow-credentials': 'true',
    });
    up.append('set-cookie', '__Secure-neonauth.session_token=t; Path=/; Secure; SameSite=None');
    const h = incomingHeaders(up);
    expect(h.get('access-control-allow-origin')).toBeNull();
    expect(h.get('access-control-allow-credentials')).toBeNull();
    expect(h.getSetCookie()).toEqual([
      '__Secure-neonauth.session_token=t; Path=/; Secure; SameSite=Lax',
    ]);
    expect(firstPartyCookie('a=1; samesite=strict; Path=/')).toBe('a=1; SameSite=Lax; Path=/');
  });
});
