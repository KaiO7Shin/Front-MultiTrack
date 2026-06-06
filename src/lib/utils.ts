import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { PodiumGroup, Row, UICategory } from "./type";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/* ===== Utils ===== */
export function courseLabelOf(id: number, list: { id: number; label: string }[]) {
  return list.find((c) => c.id === id)?.label ?? `Course #${id}`;
}
export function coerceArray(x: any): any[] {
  if (Array.isArray(x)) return x;
  if (x && typeof x === "object" && Array.isArray((x as any).data))
    return (x as any).data;
  return [];
}
export function normalizeCourse(raw: any): { id: number; label: string } {
  const id = Number(raw?.id ?? raw?.raceId ?? 0);
  const label = String(
    raw?.name ?? raw?.label ?? raw?.title ?? `Course #${id}`
  );
  return { id, label };
}
export function normalizeCategory(raw: any): UICategory {
  return { id: Number(raw?.id ?? 0), alias: String(raw?.alias ?? "") };
}

export function buildPodiumGroups(rows: Row[]): PodiumGroup[] {
  const finishers = rows.filter(r =>
    (r.status ?? "").toLowerCase().includes("finish")
  );

  const groups: PodiumGroup[] = [];

  // Scratch Hommes / Femmes : top 3 finishers par genre
  const men = finishers.filter(r => r.categorie.endsWith("H")).slice(0, 3);
  const women = finishers.filter(r => r.categorie.endsWith("F")).slice(0, 3);

  if (men.length) groups.push({ title: "Scratch Hommes", rows: men });
  if (women.length) groups.push({ title: "Scratch Femmes", rows: women });

  // Participants déjà récompensés au scratch : on les exclut des podiums catégorie
  const scratchIds = new Set<number>([
    ...men.map(r => r.participantId),
    ...women.map(r => r.participantId),
  ]);

  // Regroupement par catégorie en sautant les scratch.
  // L'ordre des finishers est conservé (donc le premier non-scratch
  // de chaque catégorie devient le 1er/1ère catégorie).
  const byCategory = new Map<string, Row[]>();
  finishers.forEach(r => {
    if (scratchIds.has(r.participantId)) return;
    if (!byCategory.has(r.categorie)) byCategory.set(r.categorie, []);
    byCategory.get(r.categorie)!.push(r);
  });

  const orderedCats = Array.from(byCategory.keys()).sort((a, b) =>
    a.localeCompare(b, "fr", { numeric: true })
  );

  orderedCats.forEach(cat => {
    const winner = byCategory.get(cat)?.[0];
    if (winner) {
      groups.push({ title: `Catégorie ${cat}`, rows: [winner] });
    }
  });

  return groups;
}

export function toRow(apiRow: any, ctx: { raceId: number; raceLabel: string }): Row {
  return {
    participantId: apiRow.participantId,
    rank: apiRow.rank, // ✅ rang officiel
    dossard: apiRow.bibNumber,
    nom: apiRow.athleteName,
    categorie: apiRow.categoryName,
    raceTime: apiRow.raceTime,
    status: apiRow.status,

    // 🆕 nouveaux champs
    categoryRank: apiRow.categoryRank,
    genderRank: apiRow.genderRank,

    courseId: ctx.raceId,
    course: ctx.raceLabel,
    controlPoints: apiRow.controlPoints ?? [],
  };
}

export function coerceArrayList<T = unknown>(payload: any): T[] {
  if (Array.isArray(payload)) return payload;
  if (payload?.data && Array.isArray(payload.data)) return payload.data;
  if (payload?.races && Array.isArray(payload.races)) return payload.races;
  if (payload?.items && Array.isArray(payload.items)) return payload.items;
  return [];
}

export function buildCumulatedPodiumGroups(rows: Row[]) {
  if (!rows.length) return [];

  // 1. Scratch podium (top 3 général)
  const scratch = rows.slice(0, 3);
  const scratchIds = new Set(scratch.map(r => r.participantId));

  // 2. Catégories sans les scratch
  const byCategory = new Map<string, Row[]>();

  rows.forEach(row => {
    if (scratchIds.has(row.participantId)) return;

    const key = row.categorie;
    if (!byCategory.has(key)) byCategory.set(key, []);
    byCategory.get(key)!.push(row);
  });

  const categoryGroups = Array.from(byCategory.entries()).map(
    ([category, catRows]) => ({
      title: `Catégorie ${category}`,
      rows: catRows.slice(0, 3),
    })
  );

  return [
    {
      title: "Scratch Général",
      rows: scratch,
    },
    ...categoryGroups,
  ];
}