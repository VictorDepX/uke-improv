import { lazy, type ComponentType } from 'react';

/**
 * Como React.lazy, mas com `preload()`: depois que o pacote chegou, a página desenha direto,
 * sem passar pelo esqueleto. Assim a aba aberta pelo endereço substitui o HTML pré-renderizado
 * sem a tela piscar (nem deslocar o layout).
 */
export function lazyPage(load: () => Promise<ComponentType>) {
  let loaded: ComponentType | null = null;
  const preload = () =>
    load().then((C) => {
      loaded = C;
      return C;
    });
  const Lazy = lazy(() => preload().then((C) => ({ default: C })));
  function Page() {
    const C = loaded;
    return C ? <C /> : <Lazy />;
  }
  Page.preload = preload;
  return Page;
}
