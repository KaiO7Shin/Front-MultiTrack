export type SortDirection = "asc" | "desc";

export type ColumnSort<K extends string> = {
  key: K;
  direction: SortDirection;
} | null;

const TEXT_COLLATOR = new Intl.Collator("fr", { sensitivity: "base" });

export function compareTextFr(left: string, right: string): number {
  return TEXT_COLLATOR.compare(left, right);
}

/** Horodatage sous-jacent (ISO ou libellé français jj/mm/aaaa). */
export function timestampOf(value: string | null | undefined): number | null {
  if (!value) return null;
  const direct = new Date(value).getTime();
  if (!Number.isNaN(direct)) return direct;

  const match = value
    .trim()
    .match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[,\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const hours = Number(match[4] ?? 0);
  const minutes = Number(match[5] ?? 0);
  const seconds = Number(match[6] ?? 0);
  const parsed = new Date(year, month - 1, day, hours, minutes, seconds).getTime();
  return Number.isNaN(parsed) ? null : parsed;
}

export function compareTimestamp(
  left: string | null | undefined,
  right: string | null | undefined
): number {
  const a = timestampOf(left);
  const b = timestampOf(right);
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return a - b;
}

/** 1er clic croissant, 2e décroissant, 3e retour à l’ordre d’origine. */
export function nextColumnSort<K extends string>(
  current: ColumnSort<K>,
  key: K
): ColumnSort<K> {
  if (current?.key !== key) return { key, direction: "asc" };
  if (current.direction === "asc") return { key, direction: "desc" };
  return null;
}

export function sortRows<T, K extends string>(
  rows: readonly T[],
  sort: ColumnSort<K>,
  compare: (left: T, right: T, key: K) => number,
  tieBreak?: (left: T, right: T) => number
): T[] {
  if (!sort) return rows as T[];
  const factor = sort.direction === "asc" ? 1 : -1;
  return [...rows].sort((left, right) => {
    const result = compare(left, right, sort.key);
    if (result !== 0) return result * factor;
    return tieBreak ? tieBreak(left, right) : 0;
  });
}
