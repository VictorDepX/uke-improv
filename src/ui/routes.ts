import type { Lang, Txt } from '@/i18n';

export interface TabDef {
  id: 'explorar' | 'jam' | 'ouvido' | 'ajustes' | 'afinador' | 'cifra';
  label: Txt;
  title: Txt;
  description: Txt;
  /** Título principal da página (H1); fica só para leitores e buscadores (o menu já diz onde se está). */
  h1: Txt;
  /** Texto do rodapé: o que esta página faz, em prosa. */
  about: Txt;
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
      en: 'Pick the key and chord: the ukulele fretboard shows the scale, the best next notes and the chords that fit. With backing tracks, a tuner and ear training.',
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
      pt: 'Improvisar é tocar o que se ouve por dentro, e isso se treina. O treino de ouvido do Uke Improv toca sons de ukulele e pergunta o que você ouviu, em três modos: intervalos, maior × menor e função harmônica.\n\nIntervalos: duas notas, uma depois da outra ou juntas, e você diz a distância entre elas. Comece pelos básicos (terça menor, terça maior, quarta, quinta e oitava) subindo. Uma dica antiga ajuda: associe cada intervalo ao começo de uma música que você conhece. Quando acertar quase sempre, passe para descendo e depois para as notas juntas, que é como elas aparecem nos acordes.\n\nMaior × menor: o acorde toca em arpejo e depois junto. O maior soa aberto e o menor, mais escuro; a diferença está só na terça. No nível completo entram o diminuto, tenso e instável, e o aumentado, que soa suspenso.\n\nFunção: uma cadência (I, IV, V7 e I) firma o tom e depois soa um acorde do campo harmônico. Você diz o grau dele. É o treino mais útil para tocar de ouvido, porque a maioria das músicas usa os mesmos graus: reconhecer o IV ou o vi pelo som é reconhecer a música.\n\nUm plano simples: na primeira semana, intervalos básicos subindo; na segunda, descendo; na terceira, maior × menor; na quarta, função no tom de dó. Dez minutos por dia rendem mais que uma hora por semana. O placar e a melhor sequência de cada modo ficam salvos, e com conta eles sincronizam entre aparelhos.',
      en: "Improvising is playing what you hear inside, and that can be trained. Uke Improv's ear training plays ukulele sounds and asks what you heard, in three modes: intervals, major vs. minor and harmonic function.\n\nIntervals: two notes, one after the other or together, and you name the distance between them. Start with the basics (minor third, major third, fourth, fifth and octave) rising. An old trick helps: link each interval to the opening of a song you know. Once you get them almost every time, move on to falling intervals and then to notes played together, which is how they appear in chords.\n\nMajor vs. minor: the chord plays as an arpeggio and then together. Major sounds open and minor sounds darker; the only difference is the third. The full level adds diminished, tense and unstable, and augmented, which sounds suspended.\n\nFunction: a cadence (I, IV, V7 and I) sets the key and then a chord from the key plays. You name its degree. It is the most useful drill for playing by ear, because most songs use the same degrees: recognizing the IV or the vi by sound is recognizing the song.\n\nA simple plan: in week one, basic intervals rising; in week two, falling; in week three, major vs. minor; in week four, function in the key of C. Ten minutes a day beats an hour a week. Your score and best streak in each mode are saved, and with an account they sync across devices.",
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
      pt: 'A afinação padrão do ukulele soprano, concerto e tenor é G C E A, da corda mais perto do rosto para a mais perto do chão. Na versão mais comum o G é agudo, mais alto que o C: é a afinação reentrante, que dá o som brilhante do ukulele. Na afinação de Sol grave, o G fica uma oitava abaixo e o instrumento ganha graves, bom para melodias e solos. O afinador funciona com as duas; escolha a sua em Ajustes para o braço mostrar as notas certas.\n\nComo afinar: ligue o microfone, toque uma corda solta de cada vez e deixe soar. O afinador mostra a nota mais próxima e o ponteiro indica se ela está alta (à direita) ou baixa (à esquerda). Gire a tarraxa devagar até o ponteiro parar no centro. Se a nota mostrada for outra, a corda está muito longe: aperte ou solte com calma até chegar ao nome certo e então ajuste fino.\n\nPor que desafina: corda de náilon estica muito nos primeiros dias e precisa ser afinada várias vezes ao dia até assentar. Mudança de temperatura e umidade também mexem na afinação, e por isso vale afinar sempre antes de tocar. Se uma corda nunca segura a afinação, confira se ela está bem presa na ponte e na tarraxa.\n\nUkulele barítono usa outra afinação, D G B E (igual às quatro cordas mais agudas do violão). O afinador mostra a nota de qualquer corda, então serve também para ele, mas o braço do app segue a afinação G C E A.\n\nFunciona no navegador do celular ou do computador, sem instalar nada. O som do microfone é analisado no próprio aparelho e não é enviado a lugar nenhum. Em ambiente barulhento, use a calibração para o afinador ignorar o ruído.',
      en: "The standard tuning for soprano, concert and tenor ukuleles is G C E A, from the string nearest your face to the one nearest the floor. The most common version has a high G, above the C: this is reentrant tuning, which gives the ukulele its bright sound. In low-G tuning, the G sits an octave lower and the instrument gains bass, which suits melodies and solos. The tuner works with both; pick yours in Settings so the fretboard shows the right notes.\n\nHow to tune: turn on the microphone, play one open string at a time and let it ring. The tuner shows the nearest note and the needle tells you whether it is sharp (to the right) or flat (to the left). Turn the peg slowly until the needle stops in the center. If the note shown is a different one, the string is far off: tighten or loosen it calmly until you reach the right name, then fine-tune.\n\nWhy it goes out of tune: nylon strings stretch a lot in the first few days and need retuning several times a day until they settle. Changes in temperature and humidity also move the tuning, which is why it is worth tuning every time before you play. If a string never holds its tuning, check that it is properly secured at the bridge and the peg.\n\nBaritone ukuleles use a different tuning, D G B E (the same as the four highest strings of a guitar). The tuner shows the note of any string, so it works for them too, but the app's fretboard follows G C E A tuning.\n\nIt works in your phone or computer browser, with nothing to install. The microphone sound is analyzed on your device and is not sent anywhere. In a noisy room, use calibration so the tuner ignores the background noise.",
    },
  },
  {
    id: 'cifra',
    label: { pt: 'Cifra', en: 'Chords' },
    title: {
      pt: 'Descobrir o tom de uma música pela cifra · Uke Improv',
      en: 'Find the key of a song from its chords · Uke Improv',
    },
    description: {
      pt: 'Cole a cifra (com ou sem letra): o app acha o tom, sugere a escala para improvisar, explica cada acorde e toca a progressão como base.',
      en: 'Paste a chord chart, with or without lyrics: the app finds the key, suggests a scale to improvise, explains each chord and plays it as a backing track.',
    },
    h1: {
      pt: 'Descobrir o tom pela cifra',
      en: 'Find the key from a chord chart',
    },
    about: {
      pt: 'O tom de uma música é o acorde onde ela descansa, e quase sempre os acordes vêm do mesmo campo harmônico. Saber o tom diz qual escala usar para improvisar e quais acordes esperar a seguir.\n\nComo usar: cole a cifra como ela aparece em sites de cifras, com ou sem letra. O analisador lê só as linhas de acordes e ignora o resto. Se a cifra marcar compassos com barras (| Dm7 G7 | C |), ele usa essa divisão; sem barras, conta um acorde por compasso. Aceita as grafias comuns no Brasil, como C7M, C7+, Bm7(b5) e acordes com baixo (D/F#).\n\nComo ele decide: testa os 24 tons, maiores e menores, e conta quantos acordes cabem em cada um. Acordes diatônicos contam inteiros; dominantes secundárias (como E7 antes de Am) e empréstimos do tom paralelo (como Fm em dó maior) contam parcialmente. Depois dá peso extra à tônica no começo, no fim e repetida ao longo da música, e às cadências V → I. Quando duas leituras empatam, como dó maior e lá menor, que usam os mesmos acordes, ele mostra as duas e você escolhe.\n\nO resultado: o tom, a escala sugerida para improvisar (com o motivo, como blues para I7–IV7–V7 ou mixolídio quando aparece o bVII), o papel de cada acorde e a porcentagem da música explicada pelo tom. Um botão leva a progressão para a aba Jam, onde ela toca como base no andamento que você quiser, para treinar o improviso sobre a música de verdade.\n\nTudo roda no navegador; a cifra colada não sai do seu aparelho.',
      en: "A song's key is the chord where it comes to rest, and its chords almost always come from the same key. Knowing the key tells you which scale to improvise with and which chords to expect next.\n\nHow to use it: paste the chord chart as it appears on chord sites, with or without lyrics. The analyzer reads only the chord lines and ignores the rest. If the chart marks bars with slashes (| Dm7 G7 | C |), it uses that split; without them, it counts one chord per bar. It accepts common spellings such as Cmaj7, C7M, Bm7b5 and slash chords (D/F#).\n\nHow it decides: it tests all 24 keys, major and minor, and counts how many chords fit each one. Diatonic chords count fully; secondary dominants (like E7 before Am) and chords borrowed from the parallel key (like Fm in C major) count partially. Then it gives extra weight to the tonic at the start, at the end and repeated through the song, and to V → I cadences. When two readings tie, like C major and A minor, which use the same chords, it shows both and you choose.\n\nThe result: the key, the suggested scale for improvising (with the reason, such as blues for I7–IV7–V7 or Mixolydian when a bVII appears), the role of each chord and the share of the song the key explains. One button sends the progression to the Jam tab, where it plays as a backing track at any tempo, so you can practice improvising over the real song.\n\nEverything runs in your browser; the pasted chart never leaves your device.",
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

/**
 * Abre uma aba de dentro de uma página (ex.: "Levar para o Jam"): troca o endereço e avisa o
 * App pelo mesmo evento do voltar/avançar do navegador.
 */
export function navigateTo(tab: TabId, lang: Lang): void {
  const url = USE_PATHS
    ? `${TAB_PATHS[lang][tab]}${window.location.search}`
    : `${window.location.pathname}${window.location.search}${tab === 'explorar' ? '' : `#${tab}`}`;
  history.pushState(null, '', url);
  window.dispatchEvent(new PopStateEvent('popstate'));
}
