/**
 * Monitoramento de erros no navegador (Sentry, projeto victor-0g/uke-improv). Só liga no
 * build de produção normal (não na página única). O DSN é público por natureza; um fork pode
 * trocar pelo seu com VITE_SENTRY_DSN, ou desligar com VITE_SENTRY_DSN vazio. O SDK é baixado depois que a página carrega, para não pesar na
 * abertura; erros que acontecem antes disso ficam guardados e são enviados assim que ele chega.
 * Não envia dados de usuário, cookies, cabeçalhos nem corpos de requisição.
 */
const DSN =
  import.meta.env.VITE_SENTRY_DSN ??
  'https://235b588517119787a138b8cdbca9dd7f@o4512334733705216.ingest.us.sentry.io/4512334765490176';
/** Só o domínio principal é produção; prévias e builds locais ficam separados no Sentry. */
const environment = (host: string) =>
  host === 'uke-improv.vercel.app'
    ? 'production'
    : host.endsWith('.vercel.app')
      ? 'preview'
      : 'local';
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
        environment: environment(location.hostname),
        // Nada de dado pessoal: sem usuário, cookies, cabeçalhos, corpos ou parâmetros de URL.
        dataCollection: {
          userInfo: false,
          cookies: false,
          httpHeaders: false,
          httpBodies: [],
          urlQueryParams: false,
        },
        // Desempenho: 20% das visitas (cabe no plano grátis). Sem cabeçalhos de rastreio nas
        // chamadas: /api repassa ao Neon, que não precisa deles.
        integrations: [Sentry.browserTracingIntegration()],
        tracesSampleRate: 0.2,
        tracePropagationTargets: [],
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
