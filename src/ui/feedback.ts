import { create } from 'zustand';

/** Diálogo de feedback aberto ou fechado; abre pelo trilho, pela gaveta ou pelo rodapé. */
export const useFeedback = create<{ open: boolean; show: () => void; hide: () => void }>((set) => ({
  open: false,
  show: () => set({ open: true }),
  hide: () => set({ open: false }),
}));
