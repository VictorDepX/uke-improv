import '@testing-library/jest-dom/vitest';

// jsdom não implementa matchMedia; o braço usa para escolher a orientação.
if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }),
  });
}

// Avisos (toasts) são globais: um teste não pode herdar os do anterior.
if (typeof window !== 'undefined') {
  const { afterEach } = await import('vitest');
  const { useToasts } = await import('@/ui/toast');
  afterEach(() => {
    for (const t of useToasts.getState().toasts) useToasts.getState().dismiss(t.id);
  });
}
