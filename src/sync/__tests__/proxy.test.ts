import { describe, expect, it, vi } from 'vitest';
import { incomingHeaders, outgoingHeaders, proxyAuth, targetUrl } from '../proxy';

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
    expect(h.getSetCookie()).toEqual(['a=1; Path=/; HttpOnly', 'b=2; Path=/']);
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
});
