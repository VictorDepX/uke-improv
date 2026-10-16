import type { StateStorage } from 'zustand/middleware';

/**
 * localStorage pode lançar exceção (aba anônima, dados bloqueados, iframes).
 * Este wrapper nunca lança: sem armazenamento, o app só não lembra as preferências.
 */
export const safeStorage: StateStorage = {
  getItem: (name) => {
    try {
      return window.localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      window.localStorage.setItem(name, value);
    } catch {
      /* ignorado de propósito */
    }
  },
  removeItem: (name) => {
    try {
      window.localStorage.removeItem(name);
    } catch {
      /* ignorado de propósito */
    }
  },
};
