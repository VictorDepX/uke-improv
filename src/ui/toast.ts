import { create } from 'zustand';

/** Aviso curto no canto da tela: confirma uma ação ou explica uma falha. */
export interface Toast {
  id: number;
  kind: 'success' | 'error' | 'info';
  message: string;
  /** Botão opcional (ex.: "Desfazer"). */
  action?: { label: string; run: () => void };
}

interface ToastState {
  toasts: Toast[];
  push: (t: Omit<Toast, 'id'>) => number;
  dismiss: (id: number) => void;
}

/** Quanto cada aviso fica na tela; erros ficam mais, avisos com ação também. */
export const TOAST_MS = { success: 3500, info: 4000, error: 7000, action: 6000 } as const;
const MAX_VISIBLE = 3;

let nextId = 1;
const timers = new Map<number, ReturnType<typeof setTimeout>>();

export const useToasts = create<ToastState>((set, get) => ({
  toasts: [],
  push: (t) => {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts, { ...t, id }].slice(-MAX_VISIBLE) }));
    const ms = t.action ? TOAST_MS.action : TOAST_MS[t.kind];
    timers.set(
      id,
      setTimeout(() => get().dismiss(id), ms),
    );
    return id;
  },
  dismiss: (id) => {
    clearTimeout(timers.get(id));
    timers.delete(id);
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },
}));

export const toast = {
  success: (message: string, action?: Toast['action']) =>
    useToasts.getState().push({ kind: 'success', message, action }),
  error: (message: string, action?: Toast['action']) =>
    useToasts.getState().push({ kind: 'error', message, action }),
  info: (message: string, action?: Toast['action']) =>
    useToasts.getState().push({ kind: 'info', message, action }),
};
