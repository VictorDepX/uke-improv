/**
 * Monitoramento de erros no navegador (Sentry). Só liga em produção, no build normal e com
 * VITE_SENTRY_DSN definido. O SDK é baixado depois que a página carrega, para não pesar na
 * abertura; erros que acontecem antes disso ficam guardados e são enviados assim que ele chega.
 * Não envia dados de usuário, cookies, cabeçalhos nem corpos de requisição.
 */
const DSN = import.meta.env.VITE_SENTRY_DSN ?? '';
const MAX_EARLY = 10;

type Capture = (err: unknown) => void;
let capture: Capture | null = null;
const early: unknown[] = [];

/** Reporta um erro (ex.: o que a tela de erro pegou). Sem Sentry ligado, não faz nada. */
export function reportError(err: unknown): void {
  if (capture) capture(err);
  else if (early.length < MAX_EARLY) early.push(err);
}

export function startMonitoring(): void {
  if (!DSN || !__PWA__ || !import.meta.env.PROD) return;
  const onError = (e: ErrorEvent) => reportError(e.error ?? e.message);
  const onRejection = (e: PromiseRejectionEvent) => reportError(e.reason);
  window.addEventListener('error', onError);
  window.addEventListener('unhandledrejection', onRejection);

  const load = () =>
    import('@sentry/browser').then((Sentry) => {
      Sentry.init({
        dsn: DSN,
        release: __RELEASE__,
        environment: 'production',
        // Nada de dado pessoal: sem usuário, cookies, cabeçalhos, corpos ou parâmetros de URL.
        dataCollection: {
          userInfo: false,
          cookies: false,
          httpHeaders: false,
          httpBodies: [],
          urlQueryParams: false,
        },
        tracesSampleRate: 0,
        // Erros de extensões e de scripts de terceiros não são do app.
        denyUrls: [/^chrome-extension:\/\//, /^moz-extension:\/\//, /^safari-extension:\/\//],
      });
      // O SDK passa a ouvir erros sozinho; os ouvintes provisórios saem.
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
      capture = (err) => Sentry.captureException(err);
      early.splice(0).forEach(capture);
    });

  if (document.readyState === 'complete') setTimeout(load, 0);
  else window.addEventListener('load', () => setTimeout(load, 0), { once: true });
}
