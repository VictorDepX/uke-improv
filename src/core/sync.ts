/**
 * Sincronização entre aparelhos, por blocos: cada bloco (ajustes, progressões, progresso)
 * guarda o instante da última mudança, e a versão mais recente vence. Puro e testável.
 */

export const SECTIONS = ['settings', 'progressions', 'progress'] as const;
export type SectionId = (typeof SECTIONS)[number];

export interface Section<T = unknown> {
  value: T;
  /** Milissegundos desde 1970 da última mudança. */
  at: number;
}

export type Snapshot = Partial<Record<SectionId, Section>>;

export interface MergeResult {
  /** Blocos em que a versão do servidor é mais nova: aplicar no aparelho. */
  pull: Partial<Record<SectionId, Section>>;
  /** Blocos em que a versão do aparelho é mais nova (ou o servidor não tem): enviar. */
  push: Partial<Record<SectionId, Section>>;
}

/**
 * Compara aparelho e servidor bloco a bloco. Empate fica como está; bloco que só existe
 * de um lado vai para o outro.
 */
export function mergeSnapshots(local: Snapshot, remote: Snapshot): MergeResult {
  const pull: MergeResult['pull'] = {};
  const push: MergeResult['push'] = {};
  for (const id of SECTIONS) {
    const l = local[id];
    const r = remote[id];
    if (l && (!r || l.at > r.at)) push[id] = l;
    else if (r && (!l || r.at > l.at)) pull[id] = r;
  }
  return { pull, push };
}

/** Linha da tabela user_data ⇄ Snapshot. */
export interface UserDataRow {
  user_id?: string;
  settings?: unknown;
  settings_at?: string | null;
  progressions?: unknown;
  progressions_at?: string | null;
  progress?: unknown;
  progress_at?: string | null;
}

export function rowToSnapshot(row: UserDataRow | null | undefined): Snapshot {
  const out: Snapshot = {};
  if (!row) return out;
  for (const id of SECTIONS) {
    const at = row[`${id}_at`];
    const value = row[id];
    if (at && value !== null && value !== undefined) out[id] = { value, at: Date.parse(at) };
  }
  return out;
}

export function snapshotToRow(snap: Snapshot): UserDataRow {
  const row: UserDataRow = {};
  for (const id of SECTIONS) {
    const s = snap[id];
    if (!s) continue;
    row[id] = s.value;
    row[`${id}_at`] = new Date(s.at).toISOString();
  }
  return row;
}
