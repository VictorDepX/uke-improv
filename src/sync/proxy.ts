/**
 * Encaminha as chamadas de /api/auth para o Neon Auth (função Edge da Vercel).
 * Um rewrite simples não serve: a Vercel acrescenta X-Forwarded-Host com o nosso domínio
 * e o Neon Auth recusa ("Invalid hostname header"). Aqui a requisição sai limpa, mantendo
 * Origin (conferido contra os domínios confiáveis) e o cookie de sessão.
 *
 * Segurança: o app chama /api/auth só do próprio domínio. O proxy recusa qualquer outra
 * origem, só repassa as rotas que o app usa, não devolve cabeçalhos CORS e grava o cookie
 * de sessão como SameSite=Lax. Sem isso, o Neon Auth responde com CORS para qualquer origem
 * e cookie SameSite=None, e um site qualquer leria a sessão e o JWT de quem está logado.
 */

export const NEON_AUTH_URL =
  'https://ep-spring-river-b61bz03f.neonauth.c-2.sa-east-1.aws.neon.tech/neondb/auth';

/** Rotas do Neon Auth que o app usa, com os métodos aceitos. O resto é recusado. */
export const ALLOWED_ROUTES: Readonly<Record<string, readonly string[]>> = {
  '/sign-up/email': ['POST'],
  '/sign-in/email': ['POST'],
  '/sign-out': ['POST'],
  '/get-session': ['GET'],
  '/token': ['GET'],
};

/** Cabeçalhos de saída que não podem chegar ao Neon Auth. */
const DROP_REQUEST =
  /^(host|x-forwarded-.*|x-real-ip|x-vercel-.*|forwarded|connection|content-length)$/i;
/**
 * O corpo já vem descompactado pelo fetch: repassar content-encoding quebraria a resposta.
 * CORS sai inteiro: o app é do mesmo domínio e não precisa dele.
 */
const DROP_RESPONSE =
  /^(content-encoding|content-length|transfer-encoding|connection|access-control-.*)$/i;
/** Corpo máximo aceito (e-mail, senha e nome cabem com folga). */
export const MAX_BODY_BYTES = 8 * 1024;

/** Caminho do Neon Auth pedido, sem a query; null se tiver "..", "%" ou barras repetidas. */
export function routeOf(requestUrl: string): string | null {
  const u = new URL(requestUrl);
  // /api/auth/sign-in/email → /sign-in/email (o rewrite da Vercel manda o caminho em ?path=)
  const viaQuery = u.searchParams.get('path');
  const path = viaQuery !== null ? `/${viaQuery}` : u.pathname.replace(/^\/api\/auth/, '');
  if (!/^(\/[a-z0-9-]+)+$/.test(path)) return null;
  return path;
}

export function targetUrl(requestUrl: string, base = NEON_AUTH_URL): string {
  const u = new URL(requestUrl);
  const path = routeOf(requestUrl) ?? '/';
  u.searchParams.delete('path');
  const query = u.searchParams.toString();
  return `${base}${path}${query ? `?${query}` : ''}`;
}

/**
 * A requisição veio do próprio app? Navegadores mandam Sec-Fetch-Site em toda requisição e
 * Origin em toda requisição de outra origem; qualquer um dos dois apontando para fora recusa.
 */
export function isSameOrigin(req: Request): boolean {
  const own = new URL(req.url).origin;
  const site = req.headers.get('sec-fetch-site');
  if (site && site !== 'same-origin' && site !== 'none') return false;
  const origin = req.headers.get('origin');
  if (origin && origin !== own) return false;
  return true;
}

export function outgoingHeaders(incoming: Headers): Headers {
  const out = new Headers();
  incoming.forEach((value, key) => {
    if (!DROP_REQUEST.test(key)) out.set(key, value);
  });
  return out;
}

/** O cookie agora é do domínio do app: SameSite=Lax impede que outro site o envie. */
export function firstPartyCookie(cookie: string): string {
  return /;\s*samesite=/i.test(cookie)
    ? cookie.replace(/;\s*samesite=[^;]*/i, '; SameSite=Lax')
    : `${cookie}; SameSite=Lax`;
}

export function incomingHeaders(upstream: Headers): Headers {
  const out = new Headers();
  upstream.forEach((value, key) => {
    if (DROP_RESPONSE.test(key) || key.toLowerCase() === 'set-cookie') return;
    out.set(key, value);
  });
  // Vários Set-Cookie precisam seguir separados.
  for (const c of upstream.getSetCookie?.() ?? []) out.append('set-cookie', firstPartyCookie(c));
  out.set('cache-control', 'no-store');
  return out;
}

const refuse = (status: number, message: string) =>
  new Response(JSON.stringify({ message }), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });

export async function proxyAuth(
  req: Request,
  fetchImpl: typeof fetch = fetch,
  base = NEON_AUTH_URL,
): Promise<Response> {
  if (!isSameOrigin(req)) return refuse(403, 'Origem não permitida.');
  const route = routeOf(req.url);
  const methods = route ? ALLOWED_ROUTES[route] : undefined;
  if (!methods) return refuse(404, 'Rota não encontrada.');
  if (!methods.includes(req.method)) return refuse(405, 'Método não permitido.');

  const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
  const body = hasBody ? await req.arrayBuffer() : undefined;
  if (body && body.byteLength > MAX_BODY_BYTES) return refuse(413, 'Requisição grande demais.');

  const res = await fetchImpl(targetUrl(req.url, base), {
    method: req.method,
    headers: outgoingHeaders(req.headers),
    body,
    redirect: 'manual',
  });
  return new Response(await res.arrayBuffer(), {
    status: res.status,
    statusText: res.statusText,
    headers: incomingHeaders(res.headers),
  });
}
