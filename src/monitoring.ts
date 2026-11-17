/**
 * Monitoramento de erros no navegador (Sentry, projeto victor-0g/uke-improv). Só liga no
 * build de produção normal (não na página única). O DSN é público por natureza; um fork pode
 * trocar pelo seu com VITE_SENTRY_DSN, ou desligar com VITE_SENTRY_DSN vazio. O SDK é baixado depois que a página carrega, para não pesar na
 * abertura; erros que acontecem antes disso ficam guardados e são enviados assim que ele chega.
 * Não envia dados de usuário, cookies, cabeçalhos nem corpos de requisição.
 */
import type * as SentryBrowser from '@sentry/browser';

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
/** Tempo máximo esperando o Sentry confirmar o envio de um feedback. */
const FEEDBACK_FLUSH_MS = 5000;

type Capture = (err: unknown) => void;
let capture: Capture | null = null;
const early: unknown[] = [];

/** Reporta um erro (ex.: o que a tela de erro pegou). Sem Sentry ligado, não faz nada. */
export function reportError(err: unknown): void {
  if (capture) capture(err);
  else if (early.length < MAX_EARLY) early.push(err);
}

type SentryModule = typeof SentryBrowser;
let sentry: Promise<SentryModule> | null = null;

/** Monitoramento só no build de produção normal, com DSN. */
const enabled = () => Boolean(DSN) && __PWA__ && import.meta.env.PROD;

/** Baixa e liga o SDK uma vez só; quem chega depois recebe o mesmo. */
function loadSentry(): Promise<SentryModule> {
  sentry ??= import('@sentry/browser').then((Sentry) => {
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
    capture = (err) => Sentry.captureException(err);
    early.splice(0).forEach(capture);
    return Sentry;
  });
  return sentry;
}

/** O botão de feedback só aparece onde há para onde mandar (fora da página única). */
export const feedbackAvailable = Boolean(DSN) && __PWA__;

/**
 * Manda um feedback escrito pela pessoa ao Sentry (aba User Feedback), com a página e a versão.
 * O e-mail só vai se a pessoa escreveu um. Devolve se o envio foi confirmado. Fora da produção
 * não manda nada: só mostra no console, para testar a tela.
 */
export async function sendFeedback(message: string, email?: string): Promise<boolean> {
  if (!enabled()) {
    console.info('[feedback]', { message, email });
    return true;
  }
  try {
    const Sentry = await loadSentry();
    Sentry.captureFeedback({
      message,
      ...(email ? { email } : {}),
      url: location.origin + location.pathname,
    });
    return await Sentry.flush(FEEDBACK_FLUSH_MS);
  } catch {
    return false;
  }
}

export function startMonitoring(): void {
  if (!enabled()) return;
  const onError = (e: ErrorEvent) => reportError(e.error ?? e.message);
  const onRejection = (e: PromiseRejectionEvent) => reportError(e.reason);
  window.addEventListener('error', onError);
  window.addEventListener('unhandledrejection', onRejection);

  // O SDK passa a ouvir erros sozinho; os ouvintes provisórios saem.
  const load = () =>
    loadSentry().then(() => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    });

  if (document.readyState === 'complete') setTimeout(load, 0);
  else window.addEventListener('load', () => setTimeout(load, 0), { once: true });
}
