import { PROGRESSIONS, meterOf, progressionBars } from '@/core/progressions';
import type { KeyContext } from '@/core/types';
import { GUIDES, type Guide } from './index';
import { HUB_PATH, type GuideLang } from './links';

const BLURB: Record<string, { pt: string; en: string }> = {
  pop: {
    pt: 'A progressão de milhares de músicas pop. Soa resolvida e um pouco nostálgica; o vi dá o toque menor.',
    en: 'The progression behind thousands of pop songs. It sounds resolved and a little nostalgic; the vi adds the minor touch.',
  },
  'doo-wop': {
    pt: 'A volta dos anos 50, de baladas e doo-wop. Boa para treinar troca de acorde no tempo.',
    en: 'The 1950s loop of ballads and doo-wop. Good for practicing chord changes in time.',
  },
  jazz: {
    pt: 'O movimento mais comum do jazz: preparação (ii), tensão (V7) e resolução (I). Mire na sensível do V7 subindo para a tônica.',
    en: 'The most common move in jazz: setup (ii), tension (V7) and resolution (I). Aim for the leading tone of the V7 rising to the tonic.',
  },
  blues: {
    pt: 'Doze compassos com três acordes com sétima. Use a escala blues ou a pentatônica menor por cima.',
    en: 'Twelve bars of three seventh chords. Use the blues scale or the minor pentatonic over it.',
  },
  minor: {
    pt: 'Uma volta menor de som épico, comum em trilhas e no rock. A pentatônica menor serve do começo ao fim.',
    en: 'An epic-sounding minor loop, common in soundtracks and rock. The minor pentatonic works from start to finish.',
  },
  andaluz: {
    pt: 'A cadência andaluza, do flamenco: desce até um V maior que pede volta à tônica.',
    en: 'The Andalusian cadence, from flamenco: it walks down to a major V that wants to return home.',
  },
  'dorian-vamp': {
    pt: 'Dois acordes, i e IV maior: o som do modo dórico, do funk e do soul. Toque a escala dórica e destaque a 6ª maior.',
    en: 'Two chords, i and a major IV: the sound of the Dorian mode, funk and soul. Play the Dorian scale and lean on the major 6th.',
  },
  turnaround: {
    pt: 'Dois acordes por compasso, usado no fim de seções para voltar ao começo. Treina mudar de alvo a cada dois tempos.',
    en: 'Two chords per bar, used at the end of sections to loop back. It trains switching targets every two beats.',
  },
  valsa: {
    pt: 'Em 3/4, contando 1-2-3. Comece as frases no tempo 1 de cada compasso.',
    en: 'In 3/4, counting 1-2-3. Start your phrases on beat 1 of each bar.',
  },
  'balada-68': {
    pt: 'A mesma volta dos anos 50 em 6/8, o balanço das baladas lentas.',
    en: 'The same 1950s loop in 6/8, the sway of slow ballads.',
  },
  'mixo-vamp': {
    pt: 'O bVII no lugar do V dá o som mixolídio, do rock clássico. Use a escala mixolídia.',
    en: 'The bVII instead of the V gives the Mixolydian sound of classic rock. Use the Mixolydian scale.',
  },
};

export function ProgressionsBody({ lang }: { lang: GuideLang }) {
  const L = (pt: string, en: string) => (lang === 'pt' ? pt : en);
  return (
    <>
      <p className="guide-lead">
        {L(
          'As progressões mais usadas, com os acordes em dois tons comuns no ukulele. Cada uma está no app: escolha na aba Jam e toque por cima com a base.',
          'The most used progressions, with the chords in two keys that are common on ukulele. Each one is in the app: pick it in the Jam tab and play over the backing track.',
        )}
      </p>
      <p>
        {L(
          'Os algarismos romanos dizem o grau de cada acorde no tom (I = tônica). Assim a mesma progressão vale em qualquer tom: em C, I–V–vi–IV é C–G–Am–F; em G, é G–D–Em–C.',
          'Roman numerals give each chord’s degree in the key (I = tonic). That way the same progression works in any key: in C, I–V–vi–IV is C–G–Am–F; in G, it is G–D–Em–C.',
        )}
      </p>
      {PROGRESSIONS.map((p) => {
        const keys: KeyContext[] =
          p.mode === 'major'
            ? [
                { tonic: 'C', scale: 'major' },
                { tonic: 'G', scale: 'major' },
              ]
            : [
                { tonic: 'A', scale: 'minor' },
                { tonic: 'E', scale: 'minor' },
              ];
        const name = typeof p.name === 'string' ? p.name : p.name[lang];
        return (
          <section key={p.id}>
            <h2>{name}</h2>
            <p>{BLURB[p.id]?.[lang]}</p>
            <ul>
              {keys.map((k) => (
                <li key={k.tonic}>
                  <strong>
                    {k.tonic}
                    {k.scale === 'minor' ? 'm' : ''}:
                  </strong>{' '}
                  {progressionBars(p, k)
                    .map((b) => b.join(' '))
                    .join(' | ')}
                  {meterOf(p) !== '4/4' ? ` (${meterOf(p)})` : ''}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}

const byKind = (lang: GuideLang, kind: Guide['kind']) =>
  GUIDES.filter((g) => g.lang === lang && g.kind === kind);

/** Índice de guias: liga todas as páginas de conteúdo (nenhuma fica órfã). */
export function HubBody({ lang }: { lang: GuideLang }) {
  const L = (pt: string, en: string) => (lang === 'pt' ? pt : en);
  const list = (items: Guide[]) => (
    <ul>
      {items.map((g) => (
        <li key={g.path}>
          <a href={g.path}>{g.title}</a>
        </li>
      ))}
    </ul>
  );
  return (
    <>
      <p className="guide-lead">
        {L(
          'Guias para improvisar no ukulele, escalas por tom e os acordes de cada tom, com diagramas na afinação G C E A.',
          'Guides to improvising on ukulele, scales in each key and the chords of every key, with diagrams in G C E A tuning.',
        )}
      </p>
      <h2>{L('Guias', 'Guides')}</h2>
      {list(byKind(lang, 'article'))}
      <h2>{L('Escalas por tom', 'Scales by key')}</h2>
      {list(byKind(lang, 'scale'))}
      <h2>{L('Campo harmônico por tom', 'Chords by key')}</h2>
      {list(byKind(lang, 'key'))}
      <h2>{L('Ferramentas', 'Tools')}</h2>
      <ul>
        <li>
          <a href={L('/afinador', '/en/tuner')}>{L('Afinador de ukulele', 'Ukulele tuner')}</a>
        </li>
        <li>
          <a href={L('/analisar-cifra', '/en/chord-chart-analyzer')}>
            {L('Descobrir o tom pela cifra', 'Find the key from a chord chart')}
          </a>
        </li>
        <li>
          <a href={L('/jam', '/en/jam')}>{L('Base para improvisar', 'Backing tracks')}</a>
        </li>
        <li>
          <a href={L('/ouvido', '/en/ear')}>{L('Treino de ouvido', 'Ear training')}</a>
        </li>
      </ul>
    </>
  );
}

export { HUB_PATH };
