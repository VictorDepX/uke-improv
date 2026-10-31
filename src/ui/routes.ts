import type { Lang, Txt } from '@/i18n';

export interface TabDef {
  id: 'explorar' | 'jam' | 'ouvido' | 'ajustes' | 'afinador' | 'cifra';
  label: Txt;
  title: Txt;
  description: Txt;
  /** Título principal da página (H1); nas abas do menu fica só para leitores e buscadores. */
  h1: Txt;
  /** Texto do rodapé: o que esta página faz, em prosa. */
  about: Txt;
  /** Fora do menu de abas: página própria para uma busca (afinador, analisador de cifra). */
  hidden?: boolean;
}

/** Abas e páginas do app, nos dois idiomas (usadas também no pré-render). */
export const TABS = [
  {
    id: 'explorar',
    label: { pt: 'Explorar', en: 'Explore' },
    title: {
      pt: 'Uke Improv — app grátis para improvisar no ukulele',
      en: 'Uke Improv — free app to improvise on the ukulele',
    },
    description: {
      pt: 'Escolha o tom e o acorde: o braço do ukulele mostra a escala, as notas que soam bem a seguir e os acordes que combinam. Com base, afinador e treino de ouvido.',
      en: 'Pick the key and the chord: the ukulele fretboard shows the scale, the notes that sound good next and the chords that fit. With backing tracks, a tuner and ear training.',
    },
    h1: {
      pt: 'Improvise no ukulele: escalas, acordes e a próxima nota no braço',
      en: 'Improvise on the ukulele: scales, chords and the next note on the fretboard',
    },
    about: {
      pt: 'Escolha o tom e o acorde: o braço mostra em cores quais notas repousam, quais servem de passagem e quais pedem resolução, e sugere os próximos acordes. Toque junto com bases em pop, reggae, bossa nova, swing e valsa, grave loops e treine o ouvido. O microfone reconhece o que você toca no seu ukulele. Grátis, sem anúncios e funciona offline.',
      en: 'Pick the key and the chord: the fretboard shows in color which notes rest, which work as passing notes and which want to resolve, and suggests the next chords. Play along with backing tracks in pop, reggae, bossa nova, swing and waltz, record loops and train your ear. The microphone recognizes what you play on your ukulele. Free, no ads, and it works offline.',
    },
  },
  {
    id: 'jam',
    label: { pt: 'Jam', en: 'Jam' },
    title: {
      pt: 'Base para improvisar no ukulele: pop, reggae e bossa · Uke Improv',
      en: 'Free ukulele backing tracks to improvise over · Uke Improv',
    },
    description: {
      pt: 'Base de acordes, baixo e bateria para tocar junto no ukulele, em 4/4, 3/4 e 6/8: pop, reggae, bossa nova, swing e valsa, com looper e analisador de cifra.',
      en: 'Chords, bass and drums to play along with on ukulele, in 4/4, 3/4 and 6/8: pop, reggae, bossa nova, swing and waltz, with a looper and a chord chart analyzer.',
    },
    h1: {
      pt: 'Base para improvisar no ukulele',
      en: 'Ukulele backing tracks to improvise over',
    },
    about: {
      pt: 'Escolha uma progressão (pop, blues de 12 compassos, ii–V–I, andaluza, valsa e outras), o estilo e o andamento, e improvise por cima. O braço acompanha o acorde da vez e, no último tempo antes de cada troca, contorna as notas do próximo. Monte suas próprias progressões, cole uma cifra para tocar a música inteira ou grave loops em camadas.',
      en: 'Pick a progression (pop, 12-bar blues, ii–V–I, Andalusian, waltz and more), a style and a tempo, and improvise over it. The fretboard follows the current chord and, on the last beat before each change, outlines the notes of the next one. Build your own progressions, paste a chord chart to play the whole song or record loops in layers.',
    },
  },
  {
    id: 'ouvido',
    label: { pt: 'Ouvido', en: 'Ear' },
    title: {
      pt: 'Treino de ouvido para ukulele: intervalos e acordes · Uke Improv',
      en: 'Ukulele ear training: intervals and chords · Uke Improv',
    },
    description: {
      pt: 'Treine o ouvido com sons de ukulele: reconheça intervalos subindo, descendo e juntos, acordes maiores e menores e a função de cada acorde no tom.',
      en: 'Train your ear with ukulele sounds: recognize intervals rising, falling and together, major and minor chords, and each chord’s function in the key.',
    },
    h1: { pt: 'Treino de ouvido para ukulele', en: 'Ukulele ear training' },
    about: {
      pt: 'Improvisar é tocar o que se ouve por dentro, e isso se treina. Comece pelos intervalos básicos (terças, quarta, quinta e oitava) subindo; quando acertar quase sempre, passe para descendo e para notas juntas. Depois treine maior × menor e, por último, a função: uma cadência firma o tom e você diz qual grau soou. Dez minutos por dia rendem mais que uma hora por semana. O placar e a melhor sequência ficam salvos.',
      en: 'Improvising is playing what you hear inside, and that can be trained. Start with the basic intervals (thirds, fourth, fifth and octave) rising; once you get them almost every time, move on to falling and to notes played together. Then train major vs. minor and, finally, function: a cadence sets the key and you name the degree that played. Ten minutes a day beats an hour a week. Your score and best streak are saved.',
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
    h1: { pt: 'Ajustes', en: 'Settings' },
    about: {
      pt: 'Afinação com Sol agudo ou grave, capotraste, rótulos nas casas, região do braço, idioma e nomes das notas. Com uma conta opcional, tudo sincroniza entre aparelhos.',
      en: 'High or low G tuning, capo, fret labels, fretboard region, language and note names. With an optional account, everything syncs across devices.',
    },
  },
  {
    id: 'afinador',
    label: { pt: 'Afinador', en: 'Tuner' },
    title: {
      pt: 'Afinador de ukulele online pelo microfone · Uke Improv',
      en: 'Online ukulele tuner with your microphone · Uke Improv',
    },
    description: {
      pt: 'Afine o ukulele (G C E A, Sol agudo ou grave) pelo microfone do celular ou do computador. Grátis, sem instalar nada e sem anúncios.',
      en: 'Tune your ukulele (G C E A, high or low G) with your phone or computer microphone. Free, nothing to install and no ads.',
    },
    h1: { pt: 'Afinador de ukulele', en: 'Ukulele tuner' },
    about: {
      pt: 'A afinação padrão do ukulele soprano, concerto e tenor é G C E A, da corda mais perto do rosto para a mais perto do chão. Na versão comum o G é agudo (mais alto que o C); na de Sol grave, ele fica uma oitava abaixo. Toque uma corda de cada vez, deixe soar e gire a tarraxa até o ponteiro parar no centro. Se a nota mostrada estiver longe, aperte ou solte bem devagar: corda de náilon estica nos primeiros dias e desafina de novo, é normal.',
      en: 'The standard tuning for soprano, concert and tenor ukuleles is G C E A, from the string nearest your face to the one nearest the floor. The common version has a high G (above the C); low-G tuning puts it an octave lower. Play one string at a time, let it ring and turn the peg until the needle stops in the center. If the note shown is far off, tighten or loosen very slowly: nylon strings stretch for the first few days and go out of tune again, which is normal.',
    },
    hidden: true,
  },
  {
    id: 'cifra',
    label: { pt: 'Analisar cifra', en: 'Chart analyzer' },
    title: {
      pt: 'Descobrir o tom de uma música pela cifra · Uke Improv',
      en: 'Find the key of a song from its chords · Uke Improv',
    },
    description: {
      pt: 'Cole a cifra (com ou sem letra): o app acha o tom, sugere a escala para improvisar, explica cada acorde e toca a progressão como base.',
      en: 'Paste a chord chart (with or without lyrics): the app finds the key, suggests a scale to improvise, explains each chord and plays the progression as a backing track.',
    },
    h1: {
      pt: 'Descobrir o tom pela cifra',
      en: 'Find the key from a chord chart',
    },
    about: {
      pt: 'O tom de uma música é o acorde onde ela descansa, e quase sempre os acordes vêm do mesmo campo harmônico. O analisador testa os 24 tons, conta quantos acordes cabem em cada um (contando dominantes secundárias e empréstimos) e dá peso à tônica no começo e no fim e às cadências V → I. Quando duas leituras empatam, como C maior e A menor, ele mostra as duas.',
      en: 'A song’s key is the chord where it comes to rest, and its chords almost always come from the same key. The analyzer tests all 24 keys, counts how many chords fit each one (including secondary dominants and borrowed chords) and weighs the tonic at the start and end and V → I cadences. When two readings tie, like C major and A minor, it shows both.',
    },
    hidden: true,
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
  pt: {
    explorar: '/',
    jam: '/jam',
    ouvido: '/ouvido',
    ajustes: '/ajustes',
    afinador: '/afinador',
    cifra: '/analisar-cifra',
  },
  en: {
    explorar: '/en',
    jam: '/en/jam',
    ouvido: '/en/ear',
    ajustes: '/en/settings',
    afinador: '/en/tuner',
    cifra: '/en/chord-chart-analyzer',
  },
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
