import { diatonicChords, findDiatonic, sameChord } from './harmony';
import {
  TONICS,
  chordInfo,
  chromaName,
  chromaOf,
  isValidChord,
  mod12,
  prefersFlats,
} from './music';
import { MAX_CHORDS_PER_BAR } from './rhythm';
import type { HarmonicFunction, KeyContext, Mode, ScaleName } from './types';

/**
 * Analisador de cifra colada: lê os acordes de um texto (com ou sem letra), acha o tom
 * mais provável e explica cada acorde (diatônico, dominante secundária, empréstimo).
 */

const ROOT = '[A-G][#b]?';
const TOKEN_RE = new RegExp(`^(${ROOT})([^/\\s]*)(?:/(${ROOT}))?$`);
/** Caracteres que aparecem na qualidade de uma cifra (pt-BR e internacional). */
const QUALITY_RE = /^[0-9mMajinduspº°ø+()b#-]*$/;

export interface ParsedChord {
  /** Como estava escrito ("A7M(9)"). */
  written: string;
  /** Reduzido ao que o app toca e analisa ("Amaj7"). */
  symbol: string;
  /** Baixo invertido, se houver ("F#" em "D/F#"). */
  bass?: string;
}

/**
 * Reduz a qualidade a tríade ou tétrade: tensões (9, 11, 13) e add saem; a notação
 * brasileira (7M, º, ø, -) vira a internacional.
 */
export function simplifyQuality(raw: string): string | null {
  if (!QUALITY_RE.test(raw)) return null;
  let q = raw.replace(/[()]/g, '');
  if (/^(ø|m7b5|m7-5|-7b5)/.test(q)) return 'm7b5';
  if (/^(º|°|dim)/.test(q)) return /7/.test(q) ? 'dim7' : 'dim';
  if (/^(\+|aug|5\+)/.test(q) || q === '+5') return 'aug';
  const minor = /^(m(?!aj)|min|-)/.test(q);
  q = q.replace(/^(min|m(?!aj)|-)/, '');
  const maj7 = /^(7M|M7|maj7|maj9|maj|7\+)/.test(q);
  const sus4 = /sus4?|^4$/.test(q) && !minor;
  const sus2 = /sus2/.test(q) && !minor;
  const six = /^6/.test(q);
  const add = /add/.test(q);
  const seventh = !maj7 && !add && !six && /^(7|9|11|13)/.test(q);
  if (sus4) return seventh ? '7sus4' : 'sus4';
  if (sus2) return 'sus2';
  if (six) return minor ? 'm6' : '6';
  if (maj7) return minor ? 'mMaj7' : 'maj7';
  if (seventh) return minor ? 'm7' : '7';
  return minor ? 'm' : '';
}

/** Lê um token de cifra; devolve null se não for acorde. */
export function parseChordToken(token: string): ParsedChord | null {
  let t = token.replace(/^[[]+|[\],.;:]+$/g, '');
  // Parênteses de fora (anotação) saem; os da cifra, como A7(9), ficam.
  if (t.startsWith('(') && t.endsWith(')')) t = t.slice(1, -1);
  const open = (t.match(/\(/g) ?? []).length;
  const close = (t.match(/\)/g) ?? []).length;
  if (close > open) t = t.replace(/\)+$/, '');
  if (t.startsWith('(') && open > close) t = t.slice(1);
  const m = TOKEN_RE.exec(t);
  if (!m) return null;
  const [, root, rawQ, bass] = m;
  const quality = simplifyQuality(rawQ!);
  if (quality === null) return null;
  const symbol = root! + quality;
  if (!isValidChord(symbol)) return null;
  return { written: t, symbol, ...(bass ? { bass } : {}) };
}

/** Rótulos de seção e marcações que não são acordes nem letra. */
const SECTION_RE =
  /^\s*[[(]?(intro|introdução|refrão|refrao|ponte|verso|estrofe|solo|final|pré-refrão|pre-refrão|chorus|verse|bridge|outro|parte \d+)\b.*?[\])]?:?\s*/i;

/** Uma linha é de acordes se quase todos os tokens são acordes. */
function chordLine(line: string): ParsedChord[][] | null {
  if (/[-=]{3,}|^\s*[eBGDAE]\|/.test(line)) return null; // tablatura
  const body = line.replace(SECTION_RE, '');
  const parts = body.includes('|') ? body.split('|') : [body];
  const tokens = body.split(/[\s|]+/).filter(Boolean);
  if (tokens.length === 0) return null;
  const marks = /^(x\d+|\d+x|\(x\d+\)|%|-|\.{2,}|N\.C\.)$/i;
  const real = tokens.filter((t) => !marks.test(t));
  const chords = real.map(parseChordToken);
  const ok = chords.filter(Boolean).length;
  // "A" e "E" são palavras em português: exigimos maioria clara e nenhuma palavra minúscula longa.
  if (ok === 0 || ok / Math.max(1, real.length) < 0.75) return null;
  if (real.some((t, i) => !chords[i] && /^[a-zà-ú]{3,}$/.test(t))) return null;
  return parts
    .map((p) =>
      p
        .split(/\s+/)
        .filter(Boolean)
        .map(parseChordToken)
        .filter((c): c is ParsedChord => c !== null),
    )
    .filter((bar) => bar.length > 0);
}

export interface ParsedChart {
  /** Acordes na ordem em que aparecem. */
  chords: ParsedChord[];
  /** Compassos: pelas barras "|" quando houver; senão, um acorde por compasso. */
  bars: string[][];
  /** Se o texto marcou compassos com "|". */
  barred: boolean;
}

/** Tamanho máximo de cifra colada; o resto é ignorado (uma música inteira cabe com folga). */
export const MAX_CHART_TEXT = 20_000;

export function parseChart(input: string): ParsedChart {
  const text = input.slice(0, MAX_CHART_TEXT);
  const chords: ParsedChord[] = [];
  const bars: string[][] = [];
  let barred = false;
  for (const line of text.split(/\r?\n/)) {
    const groups = chordLine(line);
    if (!groups) continue;
    const lineBarred = line.includes('|');
    barred ||= lineBarred;
    for (const group of groups) {
      chords.push(...group);
      const symbols = group.map((c) => c.symbol);
      if (lineBarred) {
        // Mais de 2 acordes num compasso: divide em compassos de até 2.
        for (let i = 0; i < symbols.length; i += MAX_CHORDS_PER_BAR)
          bars.push(symbols.slice(i, i + MAX_CHORDS_PER_BAR));
      } else {
        for (const s of symbols) {
          const last = bars.at(-1);
          // Sem barras, acorde repetido seguido vira um compasso só.
          if (!(last && last.length === 1 && last[0] === s)) bars.push([s]);
        }
      }
    }
  }
  return { chords, bars, barred };
}

export type ChordRole = 'diatonic' | 'secondary' | 'borrowed' | 'chromatic';

export interface AnalyzedChord {
  symbol: string;
  /** Como apareceu escrito (a primeira grafia). */
  written: string;
  count: number;
  numeral: string;
  role: ChordRole;
  func?: HarmonicFunction;
  /** Explicação curta ("prepara Em", "emprestado do tom menor"). */
  note: string;
}

export interface KeyCandidate {
  key: KeyContext;
  score: number;
}

export interface ChartAnalysis {
  key: KeyContext;
  /** Leituras alternativas, da mais provável para a menos. */
  alternatives: KeyCandidate[];
  /** 0–1: fração dos acordes explicada pelo tom (diatônicos + secundárias + empréstimos). */
  fit: number;
  chords: AnalyzedChord[];
  /** Por que essa escala. */
  scaleReason: string;
}

const FUNC_TEXT: Record<HarmonicFunction, string> = {
  T: 'tônica',
  S: 'subdominante',
  D: 'dominante',
};

const parallel = (key: KeyContext): KeyContext => ({
  tonic: key.tonic,
  scale: key.scale === 'major' ? 'minor' : 'major',
});

const isDominantQuality = (symbol: string): boolean => {
  const info = chordInfo(symbol);
  return info.isMajor && (info.seventh === null || mod12(info.seventh - info.root) === 10);
};

/** Acorde diatônico que este acorde prepara como dominante secundária, se houver. */
function secondaryTarget(symbol: string, key: KeyContext): string | undefined {
  if (!isDominantQuality(symbol)) return undefined;
  const target = mod12(chordInfo(symbol).root + 5);
  return diatonicChords(key).find(
    (d) =>
      chordInfo(d.symbol).root === target &&
      !d.symbol.includes('dim') &&
      d.numeral !== 'V7' &&
      // V7/I é só o V; conta como secundária quando o acorde não é o próprio V diatônico.
      !findDiatonic(symbol, key),
  )?.symbol;
}

const ROMANS = ['I', 'bII', 'II', 'bIII', 'III', 'IV', '#IV', 'V', 'bVI', 'VI', 'bVII', 'VII'];

/** Numeral para leitura: iv6, ii7, IVmaj7, viiø7, bVII. */
export function displayNumeral(symbol: string, key: KeyContext): string {
  const info = chordInfo(symbol);
  const q = symbol.replace(/^[A-G][#b]?/, '');
  const roman = ROMANS[mod12(info.root - chromaOf(key.tonic))]!;
  const minorish = /^(m(?!aj)|dim)/.test(q);
  const base = minorish ? roman.replace(/[IV]+/, (r) => r.toLowerCase()) : roman;
  const suffix =
    q === 'm7b5'
      ? 'ø7'
      : q === 'dim'
        ? '°'
        : q === 'dim7'
          ? '°7'
          : q === 'aug'
            ? '+'
            : q.replace(/^m(?!aj)/, '');
  return base + suffix;
}

/** Tríade de base de um acorde (Bm7b5 → Bdim, Gsus4 → G, Cmaj7 → C). */
function triadOf(symbol: string, key: KeyContext): string {
  const info = chordInfo(symbol);
  const has = (semis: number) => info.chromas.includes(mod12(info.root + semis));
  const quality =
    has(3) && has(6) ? 'dim' : has(4) && has(8) && !has(7) ? 'aug' : has(3) ? 'm' : '';
  return chromaName(info.root, prefersFlats(key)) + quality;
}

function classify(symbol: string, key: KeyContext): Omit<AnalyzedChord, 'written' | 'count'> {
  const d = findDiatonic(symbol, key);
  if (d)
    return { symbol, numeral: d.numeral, role: 'diatonic', func: d.func, note: FUNC_TEXT[d.func] };
  // Tétrades e sus: se a tríade de base é diatônica, ainda conta como diatônico.
  const triad = triadOf(symbol, key);
  const target = secondaryTarget(symbol, key);
  if (target)
    return {
      symbol,
      numeral: `V7/${findDiatonic(target, key)!.numeral}`,
      role: 'secondary',
      func: 'D',
      note: `dominante secundária: prepara ${target}`,
    };
  const dTriad = findDiatonic(triad, key);
  if (dTriad)
    return {
      symbol,
      numeral: displayNumeral(symbol, key),
      role: 'diatonic',
      func: dTriad.func,
      note: `${FUNC_TEXT[dTriad.func]} com cor extra`,
    };
  const p = parallel(key);
  if (findDiatonic(symbol, p) || findDiatonic(triad, p))
    return {
      symbol,
      numeral: displayNumeral(symbol, key),
      role: 'borrowed',
      note: key.scale === 'major' ? 'emprestado do tom menor' : 'emprestado do tom maior',
    };
  return {
    symbol,
    numeral: displayNumeral(symbol, key),
    role: 'chromatic',
    note: 'cromático, fora do tom',
  };
}

const ROLE_WEIGHT: Record<ChordRole, number> = {
  diatonic: 1,
  secondary: 0.6,
  borrowed: 0.45,
  chromatic: 0,
};

const CHROMAS = Array.from({ length: 12 }, (_, i) => i);

function scoreKey(chords: readonly string[], key: KeyContext): number {
  if (chords.length === 0) return 0;
  const tonic = chromaOf(key.tonic);
  const wantMajor = key.scale === 'major';
  const isTonicChord = (s: string) => {
    const i = chordInfo(s);
    return i.root === tonic && i.isMajor === wantMajor && !s.includes('dim');
  };
  let fit = 0;
  let cadences = 0;
  chords.forEach((s, i) => {
    fit += ROLE_WEIGHT[classify(s, key).role];
    const next = chords[i + 1];
    // Cadência V → I (ou V7 → I).
    if (
      next &&
      isTonicChord(next) &&
      chordInfo(s).root === mod12(tonic + 7) &&
      chordInfo(s).isMajor
    )
      cadences += 1;
  });
  // O encaixe no campo harmônico decide; tônica no começo, no fim e frequente desempata
  // tons relativos (C × Am), que têm os mesmos acordes.
  return (
    fit / chords.length +
    (isTonicChord(chords[0]!) ? 0.15 : 0) +
    (isTonicChord(chords.at(-1)!) ? 0.2 : 0) +
    0.4 * (chords.filter(isTonicChord).length / chords.length) +
    0.08 * Math.min(cadences, 3)
  );
}

/** Escala sugerida para o improviso, dado o tom e os acordes. */
function suggestScale(
  chords: readonly string[],
  key: KeyContext,
): { scale: ScaleName; reason: string } {
  const tonic = chromaOf(key.tonic);
  const rel = (s: string) => mod12(chordInfo(s).root - tonic);
  const has = (semis: number, major: boolean) =>
    chords.some((s) => rel(s) === semis && chordInfo(s).isMajor === major);
  if (key.scale === 'major') {
    const dom7 = chords.every((s) => isDominantQuality(s) && chordInfo(s).seventh !== null);
    const roots = new Set(chords.map(rel));
    if (dom7 && [...roots].every((r) => r === 0 || r === 5 || r === 7))
      return { scale: 'blues', reason: 'I7, IV7 e V7: a cara do blues.' };
    if (has(10, true) && !has(7, true))
      return { scale: 'mixolydian', reason: 'bVII no lugar do V: som mixolídio.' };
    return { scale: 'major', reason: 'Acordes do campo maior.' };
  }
  if (has(5, true) && !has(8, true))
    return { scale: 'dorian', reason: 'IV maior no tom menor: som dórico.' };
  if (has(7, true))
    return { scale: 'minor', reason: 'Menor natural; sobre o V maior, a menor harmônica encaixa.' };
  return { scale: 'minor', reason: 'Acordes do campo menor.' };
}

/**
 * Acha o tom mais provável e classifica cada acorde. Com `force` (tônica e modo maior/menor),
 * analisa nessa leitura em vez da mais provável.
 */
export function analyzeChart(parsed: ParsedChart, force?: KeyContext): ChartAnalysis | null {
  const seq = parsed.chords.map((c) => c.symbol);
  if (seq.length === 0) return null;
  const candidates: KeyCandidate[] = [];
  for (const t of CHROMAS)
    for (const mode of ['major', 'minor'] as Mode[]) {
      const scale: ScaleName = mode;
      // Tônica com a grafia do seletor de tom (C, Db, D, Eb…).
      const tonic = TONICS[t]!;
      const key = { tonic, scale };
      candidates.push({ key, score: scoreKey(seq, key) });
    }
  candidates.sort((a, b) => b.score - a.score);
  const forced =
    force &&
    candidates.find(
      (c) =>
        chromaOf(c.key.tonic) === chromaOf(force.tonic) &&
        c.key.scale === (force.scale === 'major' ? 'major' : 'minor'),
    );
  const best = forced ?? candidates[0]!;
  const base = best.key;
  const { scale, reason } = suggestScale(seq, base);
  const key: KeyContext = { tonic: base.tonic, scale };

  const byChord = new Map<string, AnalyzedChord>();
  for (const c of parsed.chords) {
    const existing = [...byChord.values()].find((a) => sameChord(a.symbol, c.symbol));
    if (existing) {
      existing.count += 1;
      continue;
    }
    byChord.set(c.symbol, { ...classify(c.symbol, base), written: c.written, count: 1 });
  }
  const chords = [...byChord.values()];
  const explained = parsed.chords.filter(
    (c) => classify(c.symbol, base).role !== 'chromatic',
  ).length;
  return {
    key,
    alternatives: candidates
      .filter((c) => c !== best)
      .slice(0, 2)
      .filter((c) => c.score >= candidates[0]!.score * 0.8),
    fit: explained / parsed.chords.length,
    chords,
    scaleReason: reason,
  };
}

/** Até quantos compassos da cifra viram progressão do jam. */
export const MAX_CHART_BARS = 32;
