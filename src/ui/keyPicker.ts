import { create } from 'zustand';

/**
 * Seletor de tom (tônica e escala) aberto ou fechado. Fica recolhido atrás do tom: no celular,
 * o botão do topo; no desktop, a casa "Tom" do visor. Os dois controlam o mesmo painel.
 */
export const useKeyPicker = create<{ open: boolean; toggle: () => void; close: () => void }>(
  (set) => ({
    open: false,
    toggle: () => set((s) => ({ open: !s.open })),
    close: () => set({ open: false }),
  }),
);
