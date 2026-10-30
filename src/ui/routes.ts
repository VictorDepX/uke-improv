import type { Lang, Txt } from '@/i18n';

interface TabDef {
  id: 'explorar' | 'jam' | 'ouvido' | 'ajustes';
  label: Txt;
  title: Txt;
  description: Txt;
}

/** Abas do app: nome, título e descrição de cada uma, nos dois idiomas (usados no pré-render). */
export const TABS = [
  {
    id: 'explorar',
    label: { pt: 'Explorar', en: 'Explore' },
    title: {
      pt: 'Uke Improv — improvise no ukulele sabendo a próxima nota',
      en: 'Uke Improv — improvise on ukulele knowing the next note',
    },
    description: {
      pt: 'Escolha o tom e o acorde: o braço do ukulele mostra quais notas soam bem a seguir e quais acordes combinam. Grátis, funciona offline.',
      en: 'Pick the key and the chord: the ukulele fretboard shows which notes sound good next and which chords fit. Free, works offline.',
    },
  },
  {
    id: 'jam',
    label: { pt: 'Jam', en: 'Jam' },
    title: {
      pt: 'Jam — base em loop para improvisar · Uke Improv',
      en: 'Jam — looping backing track to improvise over · Uke Improv',
    },
    description: {
      pt: 'Base de acordes, baixo e bateria em 4/4, 3/4 e 6/8, em pop, reggae, bossa nova, swing e valsa, com looper e analisador de cifra.',
      en: 'Chords, bass and drums in 4/4, 3/4 and 6/8 — pop, reggae, bossa nova, swing and waltz — with a looper and a chord chart analyzer.',
    },
  },
  {
    id: 'ouvido',
    label: { pt: 'Ouvido', en: 'Ear' },
    title: { pt: 'Treino de ouvido · Uke Improv', en: 'Ear training · Uke Improv' },
    description: {
      pt: 'Treine intervalos, maior × menor e função harmônica tocando no ukulele.',
      en: 'Train intervals, major vs. minor and harmonic function by playing the ukulele.',
    },
  },
  {
    id: 'ajustes',
    label: { pt: 'Ajustes', en: 'Settings' },
    title: { pt: 'Ajustes · Uke Improv', en: 'Settings · Uke Improv' },
    description: {
      pt: 'Afinação, capotraste, calibração do microfone e conta para sincronizar.',
      en: 'Tuning, capo, microphone calibration and an account to sync.',
    },
  },
] as const satisfies readonly TabDef[];
export type TabId = (typeof TABS)[number]['id'];

export interface Route {
  tab: TabId;
  lang: Lang;
}

/**
 * Cada aba tem seu endereço em cada idioma (/jam, /en/jam), para o Google indexar e para dar
 * para compartilhar. Na página única (artifact) não há servidor para esses caminhos, então lá
 * as abas seguem no # (#jam) e o idioma vem da preferência salva.
 */
export const USE_PATHS = __PWA__;
export const TAB_PATHS: Record<Lang, Record<TabId, string>> = {
  pt: { explorar: '/', jam: '/jam', ouvido: '/ouvido', ajustes: '/ajustes' },
  en: { explorar: '/en', jam: '/en/jam', ouvido: '/en/ear', ajustes: '/en/settings' },
};
const TAB_IDS = TABS.map((t) => t.id) as TabId[];
const isTab = (v: string): v is TabId => (TAB_IDS as string[]).includes(v);

export const hrefFor = (id: TabId, lang: Lang) =>
  USE_PATHS ? TAB_PATHS[lang][id] : id === 'explorar' ? '#' : `#${id}`;

/**
 * Aba e idioma pelo endereço; aceita também o formato antigo com # (#jam), de links já
 * compartilhados. `null` no idioma: o endereço não diz (página única).
 */
export function routeFromLocation(
  pathname: string,
  hash: string,
): { tab: TabId; lang: Lang | null } {
  const path = pathname.replace(/\/+$/, '') || '/';
  for (const lang of ['pt', 'en'] as const) {
    const found = TAB_IDS.find((id) => TAB_PATHS[lang][id] === path);
    if (found) {
      const fromHash = hash.slice(1);
      return { tab: isTab(fromHash) ? fromHash : found, lang: USE_PATHS ? lang : null };
    }
  }
  const fromHash = hash.slice(1);
  return { tab: isTab(fromHash) ? fromHash : 'explorar', lang: null };
}

export const tabFromLocation = (pathname: string, hash: string): TabId =>
  routeFromLocation(pathname, hash).tab;
