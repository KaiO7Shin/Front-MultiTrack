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

  // Scratch
  const men = finishers.filter(r => r.categorie.endsWith("H")).slice(0, 3);
  const women = finishers.filter(r => r.categorie.endsWith("F")).slice(0, 3);

  if (men.length) groups.push({ title: "Scratch Hommes", rows: men });
  if (women.length) groups.push({ title: "Scratch Femmes", rows: women });

  // Catégories triées
  const byCategory: Record<string, Row[]> = {};
  finishers.forEach(r => {
    if (!byCategory[r.categorie]) byCategory[r.categorie] = [];
    byCategory[r.categorie].push(r);
  });

  const orderedCats = Object.keys(byCategory).sort((a, b) =>
    a.localeCompare(b, "fr", { numeric: true })
  );

  orderedCats.forEach(cat => {
    const podium = byCategory[cat].slice(0, 3);
    if (podium.length)
      groups.push({ title: `Catégorie ${cat}`, rows: podium });
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