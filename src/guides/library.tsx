/* eslint-disable react-refresh/only-export-components -- gera dados e páginas estáticas; não passa por fast refresh */
/**
 * Páginas geradas a partir do núcleo do app: uma por escala em cada tom e uma por campo
 * harmônico. Respondem buscas como "escala pentatônica de lá menor no ukulele" ou "campo
 * harmônico de sol", com os mesmos cálculos que o braço do app usa.
 */
import { diatonicChords, findDiatonic, numeralToChord } from '@/core/harmony';
import { shapesFor } from '@/core/chordShapes';
import { TUNINGS } from '@/core/fretboard';
import { chromaName, chromaOf, degreeLabel, mod12, prefersFlats, scaleChromas } from '@/core/music';
import { PROGRESSIONS, progressionBars } from '@/core/progressions';
import type { KeyContext } from '@/core/types';
import { ChordDiagram } from '@/ui/components/ChordDiagram';
import { GuideBoard } from './GuideBoard';
import type { Guide } from './index';
import { HUB_PATH, type GuideLang } from './links';

const UPDATED = '2026-10-31';

const SOLFEGE: Record<string, string> = {
  C: 'Dó',
  D: 'Ré',
  E: 'Mi',
  F: 'Fá',
  G: 'Sol',
  A: 'Lá',
  B: 'Si',
};
const ACC = { pt: { '#': ' sustenido', b: ' bemol' }, en: { '#': '-sharp', b: '-flat' } };

/** "Lá", "Si bemol"; "A", "Bb". */
const notePt = (n: string) => SOLFEGE[n[0]!]! + (n[1] ? ACC.pt[n[1] as '#' | 'b'] : '');
const slugify = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');
const noteSlug = (n: string, lang: GuideLang) =>
  lang === 'pt' ? slugify(notePt(n)) : slugify(n[0]! + (n[1] ? ACC.en[n[1] as '#' | 'b'] : ''));
/** Nome na página: "Lá (A)" em português, "A" em inglês. */
const noteName = (n: string, lang: GuideLang) => (lang === 'pt' ? `${notePt(n)} (${n})` : n);
const shortName = (n: string, lang: GuideLang) => (lang === 'pt' ? notePt(n) : n);

type LibScale = 'major' | 'minor' | 'majorPentatonic' | 'minorPentatonic' | 'blues';

const SCALE_TEXT: Record<
  LibScale,
  {
    pt: string;
    en: string;
    ptSlug: (n: string) => string;
    enSlug: string;
    usePt: string;
    useEn: string;
  }
> = {
  major: {
    pt: 'maior',
    en: 'major',
    ptSlug: (n) => `${n}-maior`,
    enSlug: 'major',
    usePt:
      'É a escala das músicas alegres e da maior parte do pop. Serve para melodias cantáveis sobre qualquer acorde do tom maior.',
    useEn:
      'It is the scale of happy songs and most pop music. Use it for singable melodies over any chord in the major key.',
  },
  minor: {
    pt: 'menor',
    en: 'minor',
    ptSlug: (n) => `${n}-menor`,
    enSlug: 'minor',
    usePt:
      'Também chamada de menor natural. Soa melancólica e serve para músicas em tom menor; sobre o acorde V maior, troque o 7º grau pela sensível (menor harmônica).',
    useEn:
      'Also called natural minor. It sounds melancholic and fits songs in a minor key; over the major V chord, raise the 7th degree (harmonic minor).',
  },
  majorPentatonic: {
    pt: 'pentatônica maior',
    en: 'major pentatonic',
    ptSlug: (n) => `pentatonica-maior-de-${n}`,
    enSlug: 'major-pentatonic',
    usePt:
      'São cinco notas da escala maior, sem as duas que mais geram atrito (4º e 7º graus). Quase nada soa errado sobre os acordes do tom: é o jeito mais fácil de começar a improvisar em tom maior, no country, no folk e no pop.',
    useEn:
      'Five notes of the major scale, without the two that clash the most (the 4th and 7th degrees). Almost nothing sounds wrong over the chords of the key: the easiest way to start improvising in a major key, in country, folk and pop.',
  },
  minorPentatonic: {
    pt: 'pentatônica menor',
    en: 'minor pentatonic',
    ptSlug: (n) => `pentatonica-menor-de-${n}`,
    enSlug: 'minor-pentatonic',
    usePt:
      'A escala mais usada para solar no rock e no blues. Tem as mesmas notas da pentatônica maior do tom relativo, mas a frase repousa na tônica menor.',
    useEn:
      'The most used scale for soloing in rock and blues. It has the same notes as the major pentatonic of the relative key, but the phrase rests on the minor tonic.',
  },
  blues: {
    pt: 'blues',
    en: 'blues',
    ptSlug: (n) => `blues-de-${n}`,
    enSlug: 'blues',
    usePt:
      'É a pentatônica menor com uma nota a mais, a "blue note" (5º grau diminuto). Use a blue note de passagem, entre o 4º e o 5º grau, e não pare nela. Funciona sobre o blues de 12 compassos inteiro.',
    useEn:
      'It is the minor pentatonic with one extra note, the "blue note" (flat 5th). Use the blue note in passing, between the 4th and 5th degrees, and don\'t stop on it. It works over the whole 12-bar blues.',
  },
};

/** As escalas por tom com mais busca; o resto entra conforme o Search Console mostrar demanda. */
const SCALE_PAGES: [LibScale, string[]][] = [
  ['major', ['C', 'G', 'D', 'A', 'E', 'F']],
  ['minor', ['A', 'E', 'D', 'B']],
  ['majorPentatonic', ['C', 'G', 'D', 'A']],
  ['minorPentatonic', ['A', 'E', 'D', 'G']],
  ['blues', ['A', 'E']],
];

// Sem F# maior e Eb menor: as grafias deles pedem E# e Cb, que o núcleo escreve como F e B.
const MAJOR_KEYS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'G', 'Ab', 'A', 'Bb', 'B'];
const MINOR_KEYS = ['C', 'C#', 'D', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];

const isMinor = (s: LibScale) => s === 'minor' || s === 'minorPentatonic' || s === 'blues';
const tonicChord = (tonic: string, s: LibScale) => (isMinor(s) ? `${tonic}m` : tonic);

export const scalePath = (scale: LibScale, tonic: string, lang: GuideLang) =>
  lang === 'pt'
    ? `/escalas/${SCALE_TEXT[scale].ptSlug(noteSlug(tonic, 'pt'))}`
    : `/en/scales/${noteSlug(tonic, 'en')}-${SCALE_TEXT[scale].enSlug}`;

export const keyPath = (tonic: string, minor: boolean, lang: GuideLang) =>
  lang === 'pt'
    ? `/campo-harmonico/${noteSlug(tonic, 'pt')}-${minor ? 'menor' : 'maior'}`
    : `/en/keys/${noteSlug(tonic, 'en')}-${minor ? 'minor' : 'major'}`;

export { HUB_PATH };

const hasScalePage = (scale: LibScale, tonic: string) =>
  SCALE_PAGES.some(([s, ts]) => s === scale && ts.includes(tonic));

/** Casas 0–5 de cada corda (G C E A) que estão na escala. */
function firstFrets(key: KeyContext) {
  const chromas = new Set(scaleChromas(key));
  const flats = prefersFlats(key);
  const open = TUNINGS.GCEA.open;
  return ['G', 'C', 'E', 'A'].map((name, i) => {
    const frets = [0, 1, 2, 3, 4, 5].filter((f) => chromas.has(mod12(open[i]! + f)));
    return { name, frets: frets.map((f) => ({ f, note: chromaName(mod12(open[i]! + f), flats) })) };
  });
}

/** Acordes que combinam: o campo do tom (pentatônicas usam o do tom pai; blues, I7 IV7 V7). */
function chordsFor(tonic: string, scale: LibScale): { numeral: string; symbol: string }[] {
  if (scale === 'blues')
    return ['I7', 'IV7', 'V7'].map((n) => ({
      numeral: n,
      symbol: numeralToChord(n, { tonic, scale: 'major' }),
    }));
  // Pentatônicas não têm as notas que formam o diminuto; ele fica de fora.
  const pent = scale === 'majorPentatonic' || scale === 'minorPentatonic';
  return diatonicChords({ tonic, scale: isMinor(scale) ? 'minor' : 'major' }).filter(
    (d) =>
      d.numeral !== 'V7' &&
      (!isMinor(scale) || d.numeral !== 'V') &&
      !(pent && d.symbol.endsWith('dim')),
  );
}

function ScaleBody({ scale, tonic, lang }: { scale: LibScale; tonic: string; lang: GuideLang }) {
  const L = (pt: string, en: string) => (lang === 'pt' ? pt : en);
  const key: KeyContext = { tonic, scale };
  const flats = prefersFlats(key);
  const t = chromaOf(tonic);
  const notes = scaleChromas(key).map((c) => ({
    name: chromaName(c, flats),
    deg: degreeLabel(c, t),
  }));
  const info = SCALE_TEXT[scale];
  const chords = chordsFor(tonic, scale);
  const triad = chordsFor(tonic, scale === 'blues' ? 'minor' : scale)[0]!;
  const minor = isMinor(scale);
  const others = (Object.keys(SCALE_TEXT) as LibScale[]).filter(
    (s) => s !== scale && hasScalePage(s, tonic),
  );
  return (
    <>
      <p className="guide-lead">
        {L(
          `A escala ${info.pt} de ${noteName(tonic, 'pt')} tem as notas ${notes.map((n) => n.name).join(' ')}. ${info.usePt}`,
          `The ${tonic} ${info.en} scale has the notes ${notes.map((n) => n.name).join(' ')}. ${info.useEn}`,
        )}
      </p>

      <h2>{L('Notas e graus', 'Notes and degrees')}</h2>
      <table>
        <thead>
          <tr>
            <th scope="col">{L('Nota', 'Note')}</th>
            {notes.map((n) => (
              <td key={n.name}>{n.name}</td>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">{L('Grau', 'Degree')}</th>
            {notes.map((n) => (
              <td key={n.name}>{n.deg}</td>
            ))}
          </tr>
        </tbody>
      </table>

      <h2>{L('Nas cinco primeiras casas', 'In the first five frets')}</h2>
      <p>
        {L(
          'Afinação padrão G C E A (G agudo). O número é a casa; 0 é a corda solta.',
          'Standard G C E A tuning (high G). The number is the fret; 0 is the open string.',
        )}
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">{L('Corda', 'String')}</th>
            <th scope="col">{L('Casas (nota)', 'Frets (note)')}</th>
          </tr>
        </thead>
        <tbody>
          {firstFrets(key).map((s) => (
            <tr key={s.name}>
              <td>{s.name}</td>
              <td>{s.frets.map((x) => `${x.f} (${x.note})`).join(' · ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <GuideBoard
        keyContext={key}
        chord={tonicChord(tonic, scale)}
        caption={L(
          `${capital(info.pt)} de ${shortName(tonic, 'pt')} no braço inteiro, sobre o acorde ${tonicChord(tonic, scale)}: verde são as notas do acorde.`,
          `${tonic} ${info.en} across the whole fretboard, over the ${tonicChord(tonic, scale)} chord: green marks the chord tones.`,
        )}
      />

      <h2>{L('Acordes que combinam', 'Chords that fit')}</h2>
      <p>
        {L(
          `Sobre estes acordes a escala soa ${scale === 'blues' ? 'como blues' : 'dentro do tom'}. Mire nas notas de cada acorde nos tempos fortes.`,
          `Over these chords the scale sounds ${scale === 'blues' ? 'bluesy' : 'in key'}. Aim for each chord's notes on the strong beats.`,
        )}
      </p>
      <ChordRow chords={chords} />

      <h2>{L('Como usar', 'How to use it')}</h2>
      <ul>
        <li>
          {L(
            `Comece e termine as frases em ${tonic}: é onde a escala descansa.`,
            `Start and end your phrases on ${tonic}: that is where the scale rests.`,
          )}
        </li>
        <li>
          {L(
            `Sobre ${triad.symbol}, as notas mais seguras são as do acorde. No app, elas aparecem em verde.`,
            `Over ${triad.symbol}, the safest notes are the chord tones. In the app, they show in green.`,
          )}
        </li>
        <li>
          {L(
            'Ande por graus vizinhos e deixe espaço entre as frases; o ritmo pesa tanto quanto a nota.',
            'Move by neighboring steps and leave space between phrases; rhythm matters as much as the note.',
          )}
        </li>
      </ul>
      <p>
        {L('Veja também: ', 'See also: ')}
        <a href={keyPath(tonic, minor, lang)}>
          {L(
            `campo harmônico de ${shortName(tonic, 'pt')} ${minor ? 'menor' : 'maior'}`,
            `chords in the key of ${tonic} ${minor ? 'minor' : 'major'}`,
          )}
        </a>
        {others.map((s) => (
          <span key={s}>
            {' · '}
            <a href={scalePath(s, tonic, lang)}>
              {L(
                s === 'major' || s === 'minor'
                  ? `escala de ${shortName(tonic, 'pt')} ${SCALE_TEXT[s].pt}`
                  : `${SCALE_TEXT[s].pt} de ${shortName(tonic, 'pt')}`,
                `${tonic} ${SCALE_TEXT[s].en}`,
              )}
            </a>
          </span>
        ))}
      </p>
    </>
  );
}

function ChordRow({ chords }: { chords: { numeral: string; symbol: string }[] }) {
  return (
    <ul className="guide-chords">
      {chords.map((c) => {
        const shape = shapesFor(c.symbol)[0];
        return (
          <li key={c.numeral}>
            {shape ? <ChordDiagram shape={shape} label={c.symbol} size="sm" /> : null}
            <strong>{c.symbol}</strong>
            <span className="mono">{c.numeral}</span>
          </li>
        );
      })}
    </ul>
  );
}

const FUNC = {
  T: { pt: 'tônica (repouso)', en: 'tonic (rest)' },
  S: { pt: 'subdominante (afasta)', en: 'subdominant (moves away)' },
  D: { pt: 'dominante (tensão)', en: 'dominant (tension)' },
};

function KeyBody({ tonic, minor, lang }: { tonic: string; minor: boolean; lang: GuideLang }) {
  const L = (pt: string, en: string) => (lang === 'pt' ? pt : en);
  const key: KeyContext = { tonic, scale: minor ? 'minor' : 'major' };
  const chords = diatonicChords(key);
  const triads = chords.filter((c) => c.numeral !== 'V7' && (!minor || c.numeral !== 'V'));
  // Só as que usam acordes do próprio tom (o groove dórico, com IV maior, fica de fora).
  const progressions = PROGRESSIONS.filter(
    (p) =>
      p.mode === key.scale &&
      progressionBars(p, key)
        .flat()
        .every((c) => findDiatonic(c, key)),
  ).slice(0, 4);
  const relRoot = chromaName(mod12(chromaOf(tonic) + (minor ? 3 : 9)), prefersFlats(key));
  const relative = MAJOR_KEYS.concat(MINOR_KEYS).find(
    (k) => chromaOf(k) === chromaOf(relRoot) && (minor ? MAJOR_KEYS : MINOR_KEYS).includes(k),
  );
  const mode = L(minor ? 'menor' : 'maior', minor ? 'minor' : 'major');
  const scaleKind: LibScale = minor ? 'minorPentatonic' : 'majorPentatonic';
  return (
    <>
      <p className="guide-lead">
        {L(
          `O campo harmônico de ${noteName(tonic, 'pt')} ${mode} são os acordes formados com as notas da escala: ${triads.map((c) => c.symbol).join(', ')}. Quase toda música nesse tom usa só eles, com a dominante ${chords.find((c) => c.numeral === 'V7')!.symbol} levando de volta para ${triads[0]!.symbol}.`,
          `The chords in the key of ${tonic} ${mode} are built from the notes of the scale: ${triads.map((c) => c.symbol).join(', ')}. Almost every song in this key uses only these, with the dominant ${chords.find((c) => c.numeral === 'V7')!.symbol} leading back to ${triads[0]!.symbol}.`,
        )}
      </p>

      <h2>{L('Os acordes do tom', 'The chords of the key')}</h2>
      <ChordRow chords={chords} />
      <table>
        <thead>
          <tr>
            <th scope="col">{L('Grau', 'Degree')}</th>
            <th scope="col">{L('Acorde', 'Chord')}</th>
            <th scope="col">{L('Função', 'Function')}</th>
          </tr>
        </thead>
        <tbody>
          {chords.map((c) => (
            <tr key={c.numeral}>
              <td>{c.numeral}</td>
              <td>{c.symbol}</td>
              <td>{FUNC[c.func][lang]}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>{L('Progressões comuns', 'Common progressions')}</h2>
      <ul>
        {progressions.map((p) => (
          <li key={p.id}>
            <strong>{typeof p.name === 'string' ? p.name : p.name[lang]}:</strong>{' '}
            {progressionBars(p, key)
              .map((b) => b.join(' '))
              .join(' – ')}
          </li>
        ))}
      </ul>

      <h2>{L('Para improvisar', 'To improvise')}</h2>
      <p>
        {L(
          `A escala ${minor ? 'menor' : 'maior'} de ${shortName(tonic, 'pt')} serve sobre todos esses acordes. Para começar com menos risco, use a pentatônica ${minor ? 'menor' : 'maior'}: cinco notas que quase nunca soam erradas no tom.`,
          `The ${tonic} ${mode} scale works over all these chords. To start with less risk, use the ${mode} pentatonic: five notes that almost never sound wrong in this key.`,
        )}
        {hasScalePage(scaleKind, tonic) ? (
          <>
            {' '}
            <a href={scalePath(scaleKind, tonic, lang)}>
              {L(`Pentatônica ${mode} de ${shortName(tonic, 'pt')}`, `${tonic} ${mode} pentatonic`)}
            </a>
            {hasScalePage(key.scale as LibScale, tonic) ? (
              <>
                {' · '}
                <a href={scalePath(key.scale as LibScale, tonic, lang)}>
                  {L(`Escala de ${shortName(tonic, 'pt')} ${mode}`, `${tonic} ${mode} scale`)}
                </a>
              </>
            ) : null}
          </>
        ) : null}
      </p>
      {relative ? (
        <p>
          {L('Tom relativo: ', 'Relative key: ')}
          <a href={keyPath(relative, !minor, lang)}>
            {L(
              `${shortName(relative, 'pt')} ${minor ? 'maior' : 'menor'}`,
              `${relative} ${minor ? 'major' : 'minor'}`,
            )}
          </a>
          {L(
            ', com as mesmas notas e repouso em outro acorde.',
            ', with the same notes and a different home chord.',
          )}
        </p>
      ) : null}
    </>
  );
}

const capital = (s: string) => s[0]!.toUpperCase() + s.slice(1);

function scaleGuide(scale: LibScale, tonic: string, lang: GuideLang): Guide {
  const info = SCALE_TEXT[scale];
  const notes = scaleChromas({ tonic, scale })
    .map((c) => chromaName(c, prefersFlats({ tonic, scale })))
    .join(' ');
  return {
    id: `scale-${scale}-${tonic}`,
    kind: 'scale',
    lang,
    path: scalePath(scale, tonic, lang),
    title:
      lang === 'pt'
        ? `Escala ${info.pt} de ${noteName(tonic, 'pt')} no ukulele`
        : `${tonic} ${info.en} scale on ukulele`,
    description:
      lang === 'pt'
        ? `Escala ${info.pt} de ${shortName(tonic, 'pt')} no ukulele: notas (${notes}), casas no braço GCEA e os acordes que combinam.`
        : `${tonic} ${info.en} scale on ukulele: the notes (${notes}), where they are on the GCEA fretboard and the chords that fit.`,
    updated: UPDATED,
    Body: () => <ScaleBody scale={scale} tonic={tonic} lang={lang} />,
  };
}

function keyGuide(tonic: string, minor: boolean, lang: GuideLang): Guide {
  const triads = diatonicChords({ tonic, scale: minor ? 'minor' : 'major' })
    .filter((c) => c.numeral !== 'V7' && (!minor || c.numeral !== 'V'))
    .map((c) => c.symbol)
    .join(', ');
  return {
    id: `key-${minor ? 'minor' : 'major'}-${tonic}`,
    kind: 'key',
    lang,
    path: keyPath(tonic, minor, lang),
    title:
      lang === 'pt'
        ? `Campo harmônico de ${noteName(tonic, 'pt')} ${minor ? 'menor' : 'maior'} no ukulele`
        : `Chords in the key of ${tonic} ${minor ? 'minor' : 'major'} on ukulele`,
    description:
      lang === 'pt'
        ? `Os acordes do tom de ${shortName(tonic, 'pt')} ${minor ? 'menor' : 'maior'} no ukulele, com diagramas: ${triads}. Funções e progressões comuns.`
        : `The chords in the key of ${tonic} ${minor ? 'minor' : 'major'} on ukulele, with diagrams: ${triads}. Functions and common progressions.`,
    updated: UPDATED,
    Body: () => <KeyBody tonic={tonic} minor={minor} lang={lang} />,
  };
}

const LANGS: GuideLang[] = ['pt', 'en'];

export const LIBRARY: Guide[] = LANGS.flatMap((lang) => [
  ...SCALE_PAGES.flatMap(([scale, tonics]) => tonics.map((t) => scaleGuide(scale, t, lang))),
  ...MAJOR_KEYS.map((t) => keyGuide(t, false, lang)),
  ...MINOR_KEYS.map((t) => keyGuide(t, true, lang)),
]);
