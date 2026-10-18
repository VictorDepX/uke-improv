/// <reference types="vite/client" />

/** Verdadeiro no build normal (com service worker); falso na página avulsa. */
declare const __PWA__: boolean;
/** Contas e sincronização disponíveis (há proxy de /api). */
declare const __ACCOUNTS__: boolean;
