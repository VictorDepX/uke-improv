/**
 * Encaminha as chamadas de /api/auth para o Neon Auth (função Edge da Vercel).
 * Um rewrite simples não serve: a Vercel acrescenta X-Forwarded-Host com o nosso domínio
 * e o Neon Auth recusa ("Invalid hostname header"). Aqui a requisição sai limpa, mantendo
 * Origin (conferido contra os domínios confiáveis) e o cookie de sessão.
 */

export const NEON_AUTH_URL =
  'https://ep-spring-river-b61bz03f.neonauth.c-2.sa-east-1.aws.neon.tech/neondb/auth';

/** Cabeçalhos de saída que não podem chegar ao Neon Auth. */
const DROP_REQUEST =
  /^(host|x-forwarded-.*|x-real-ip|x-vercel-.*|forwarded|connection|content-length)$/i;
/** O corpo já vem descompactado pelo fetch: repassar estes cabeçalhos quebraria a resposta. */
const DROP_RESPONSE = /^(content-encoding|content-length|transfer-encoding|connection)$/i;

export function targetUrl(requestUrl: string, base = NEON_AUTH_URL): string {
  const u = new URL(requestUrl);
  // /api/auth/sign-in/email?x=1 → <base>/sign-in/email?x=1 (o rewrite manda o caminho em ?path=)
  const viaQuery = u.searchParams.get('path');
  u.searchParams.delete('path');
  const path = viaQuery !== null ? `/${viaQuery}` : u.pathname.replace(/^\/api\/auth/, '');
  const query = u.searchParams.toString();
  return `${base}${path.replace(/\/{2,}/g, '/')}${query ? `?${query}` : ''}`;
}

export function outgoingHeaders(incoming: Headers): Headers {
  const out = new Headers();
  incoming.forEach((value, key) => {
    if (!DROP_REQUEST.test(key)) out.set(key, value);
  });
  return out;
}

export function incomingHeaders(upstream: Headers): Headers {
  const out = new Headers();
  upstream.forEach((value, key) => {
    if (DROP_RESPONSE.test(key) || key.toLowerCase() === 'set-cookie') return;
    out.set(key, value);
  });
  // Vários Set-Cookie precisam seguir separados.
  for (const c of upstream.getSetCookie?.() ?? []) out.append('set-cookie', c);
  out.set('cache-control', 'no-store');
  return out;
}

export async function proxyAuth(
  req: Request,
  fetchImpl: typeof fetch = fetch,
  base = NEON_AUTH_URL,
): Promise<Response> {
  const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
  const res = await fetchImpl(targetUrl(req.url, base), {
    method: req.method,
    headers: outgoingHeaders(req.headers),
    body: hasBody ? await req.arrayBuffer() : undefined,
    redirect: 'manual',
  });
  return new Response(req.method === 'HEAD' ? null : await res.arrayBuffer(), {
    status: res.status,
    statusText: res.statusText,
    headers: incomingHeaders(res.headers),
  });
}
