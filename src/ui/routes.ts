/** Abas do app: endereço, título e descrição de cada uma (usados também no pré-render). */
export const TABS = [
  {
    id: 'explorar',
    label: 'Explorar',
    title: 'Uke Improv — improvise no ukulele sabendo a próxima nota',
    description:
      'Escolha o tom e o acorde: o braço do ukulele mostra quais notas soam bem a seguir e quais acordes combinam. Grátis, funciona offline.',
  },
  {
    id: 'jam',
    label: 'Jam',
    title: 'Jam — base em loop para improvisar · Uke Improv',
    description:
      'Base de acordes, baixo e bateria em 4/4, 3/4 e 6/8, em pop, reggae, bossa nova, swing e valsa, com looper e analisador de cifra.',
  },
  {
    id: 'ouvido',
    label: 'Ouvido',
    title: 'Treino de ouvido · Uke Improv',
    description: 'Treine intervalos, maior × menor e função harmônica tocando no ukulele.',
  },
  {
    id: 'ajustes',
    label: 'Ajustes',
    title: 'Ajustes · Uke Improv',
    description: 'Afinação, capotraste, calibração do microfone e conta para sincronizar.',
  },
] as const;
export type TabId = (typeof TABS)[number]['id'];

/**
 * Cada aba tem seu endereço (/jam, /ouvido, /ajustes), para o Google indexar cada uma e para
 * dar para compartilhar. Na página única (artifact) não há servidor para esses caminhos, então
 * lá as abas seguem no # (#jam).
 */
export const USE_PATHS = __PWA__;
export const TAB_PATHS: Record<TabId, string> = {
  explorar: '/',
  jam: '/jam',
  ouvido: '/ouvido',
  ajustes: '/ajustes',
};
const isTab = (v: string): v is TabId => TABS.some((t) => t.id === v);
export const hrefFor = (id: TabId) =>
  USE_PATHS ? TAB_PATHS[id] : id === 'explorar' ? '#' : `#${id}`;

/** Aba pelo endereço; aceita também o formato antigo com # (#jam), de links já compartilhados. */
export function tabFromLocation(pathname: string, hash: string): TabId {
  const fromHash = hash.slice(1);
  if (isTab(fromHash)) return fromHash;
  const path = pathname.replace(/\/+$/, '') || '/';
  const found = (Object.keys(TAB_PATHS) as TabId[]).find((id) => TAB_PATHS[id] === path);
  return found ?? 'explorar';
}
