/// <reference types="vite/client" />

/** Verdadeiro no build normal (com service worker); falso na página avulsa. */
declare const __PWA__: boolean;
/** Contas e sincronização disponíveis (há proxy de /api). */
declare const __ACCOUNTS__: boolean;
/** Commit do deploy (ou "local"). */
declare const __RELEASE__: string;

interface ImportMetaEnv {
  /** DSN do Sentry; vazio desliga o monitoramento. */
  readonly VITE_SENTRY_DSN?: string;
}
