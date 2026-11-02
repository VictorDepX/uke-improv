import { meterOf } from './progressions';
import type { KeyContext, Progression } from './types';
import { sanitizeKey, sanitizeProgressions } from './validate';
import { STYLE_GROOVES, DEFAULT_GROOVES } from './grooves';

/** O que um link de progressão carrega: tom, compassos, andamento e estilo. */
export interface SharedJam {
  key: KeyContext;
  progression: Progression;
  bpm: number;
  grooveId: string | null;
}

const toB64Url = (s: string) =>
  btoa(String.fromCharCode(...new TextEncoder().encode(s)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
const fromB64Url = (s: string) =>
  new TextDecoder().decode(
    Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0)),
  );

export function encodeShare(j: SharedJam): string {
  const { name, mode, numerals } = j.progression;
  return toB64Url(
    JSON.stringify({
      k: j.key,
      p: { name, mode, numerals, meter: meterOf(j.progression) },
      b: j.bpm,
      g: j.grooveId,
    }),
  );
}

const GROOVE_IDS = new Set([...STYLE_GROOVES, ...Object.values(DEFAULT_GROOVES)].map((g) => g.id));

/** Lê um link recebido. Vem de fora: tudo passa pelas mesmas validações do armazenamento. */
export function decodeShare(code: string, id: string): SharedJam | null {
  if (code.length > 2000) return null;
  let raw: unknown;
  try {
    raw = JSON.parse(fromB64Url(code));
  } catch {
    return null;
  }
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const key = sanitizeKey(r.k);
  const p = r.p as Record<string, unknown> | undefined;
  const [progression] = sanitizeProgressions([{ ...p, id, custom: true }]);
  if (!key || !progression) return null;
  const bpm = typeof r.b === 'number' && Number.isFinite(r.b) ? r.b : 90;
  const grooveId = typeof r.g === 'string' && GROOVE_IDS.has(r.g) ? r.g : null;
  return { key, progression, bpm, grooveId };
}
