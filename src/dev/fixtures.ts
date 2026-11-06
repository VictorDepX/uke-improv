/**
 * Dados de teste para quebrar a interface (só em desenvolvimento). Entram pela mesma porta
 * dos dados reais: o store, e a cifra pelo mesmo caminho do "Analisar" (parseChart →
 * analyzeChart → loadChart). Nada aqui vai para produção: o toggle só existe com import.meta.env.DEV.
 */
import { analyzeChart, MAX_CHART_BARS, parseChart } from '@/core/chart';
import { barLabel } from '@/core/progressions';
import { nm } from '@/i18n';
import { useMusicStore } from '@/store/useMusicStore';

export type DevDataset = 'demo' | 'worst' | 'one';

/**
 * Cifra real de pior caso: F# menor, acordes com extensão e baixo, dois acordes por compasso,
 * mais compassos que o limite (32) e um título longo na primeira linha.
 */
const WORST_CHART = `[Intro] | F#m7 C#7/G# | Bm7 E7(9) | Amaj7 D7M | G#m7(b5) C#7(b9) |
[Verso]
F#m7        C#7/G#         F#m7/A      B7(13)
  Uma frase longa da letra que ocupa a linha inteira
Em7   A7   Dmaj7   Bm7/F#   G#m7(b5)   C#7   F#m   F#m/E
| D7M C#7 | F#m C#m7 | Bm7 E7 | A7M D7M | Bm7 C#7 | F#m F#m/E | D7M C#7 | F#m |
| Bm7 E7 | A7M F#m7 | Bm7 C#7(b9) | F#m D | E C#7 | F#m Bm | G#m7(b5) C#7 | F#m |
| D C#m | Bm A | G#m7(b5) C#7 | F#m E | D E | F#m |`;

/** Uma cifra mínima: um compasso só (para "1 compasso" e listas de um item). */
const ONE_CHART = `| Bm |`;

function loadFromChart(text: string): void {
  const parsed = parseChart(text);
  const analysis = analyzeChart(parsed);
  if (!analysis) return;
  const bars = parsed.bars.slice(0, MAX_CHART_BARS);
  // Mesmo nome que o analisador de cifra dá (ChartAnalyzer).
  const name = `Cifra: ${bars
    .slice(0, 4)
    .map((b) => barLabel(b.map(nm)))
    .join(' – ')}${bars.length > 4 ? ' …' : ''}`;
  useMusicStore.getState().loadChart({ key: analysis.key, bars, name });
}

let demoSnapshot: ReturnType<typeof useMusicStore.getState> | null = null;

export function applyDevDataset(set: DevDataset): void {
  const store = useMusicStore;
  // A primeira troca guarda o estado de quem está desenvolvendo, para "Demo" devolvê-lo.
  if (!demoSnapshot) demoSnapshot = store.getState();
  store.setState(demoSnapshot, true);
  if (set === 'demo') return;

  const s = store.getState();
  if (set === 'one') {
    store.setState({
      customProgressions: [],
      lastNotes: [],
      progress: {
        ear: { interval: { correct: 1, total: 1, streak: 1, best: 1 } },
        exercises: { repouso: { completed: 1, bestMisses: 1 } },
      },
      settings: { ...s.settings, onboarded: true },
    });
    loadFromChart(ONE_CHART);
    return;
  }

  store.setState({
    key: { tonic: 'F#', scale: 'harmonicMinor' },
    currentChord: 'F#m',
    customProgressions: [],
    lastNotes: [66, 73, 62, 65],
    settings: {
      ...s.settings,
      onboarded: true,
      noteNames: 'solfege',
      capo: 7,
      extras: { secondaryDominants: true, modalBorrowing: true },
    },
    progress: {
      ear: {
        interval: { correct: 1284, total: 1301, streak: 0, best: 214 },
        quality: { correct: 0, total: 37, streak: 0, best: 0 },
        function: { correct: 999, total: 1000, streak: 999, best: 999 },
      },
      exercises: {
        repouso: { completed: 1284, bestMisses: 0 },
        resolva: { completed: 1, bestMisses: 12 },
      },
    },
    account: {
      status: 'signedIn',
      user: {
        id: '9f8e7d6c-5b4a-4c3d-8e2f-1a0b9c8d7e6f',
        name: 'Aleksandra Wiśniewska-Kowalczyk',
        email: 'bartholomew.fitzgerald@northwind-industries-holdings.example.com',
      },
      sync: 'error',
      lastSync: Date.now() - 1000 * 60 * 60 * 24 * 400,
      error: 'Não foi possível sincronizar: o servidor demorou demais para responder (timeout).',
    },
  });
  loadFromChart(WORST_CHART);
  // Uma segunda progressão própria, montada à mão, com o nome padrão.
  loadFromChart(`| F#m | F#m | Bm | C#7 |`);
}
