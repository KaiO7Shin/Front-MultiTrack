import type { ParticipantProjection } from "@/lib/type";

export type ParticipantSortKey = "id" | "numDossard" | "nom" | "prenom";
export type SortDirection = "asc" | "desc";

export type ParticipantSort = {
  key: ParticipantSortKey;
  direction: SortDirection;
} | null;

const NAME_COLLATOR = new Intl.Collator("fr", { sensitivity: "base" });

function compareText(left: string, right: string) {
  return NAME_COLLATOR.compare(left, right);
}

function compareDossard(left: string, right: string) {
  const a = left.trim();
  const b = right.trim();
  const aNum = /^\d+$/.test(a) ? Number(a) : null;
  const bNum = /^\d+$/.test(b) ? Number(b) : null;
  if (aNum != null && bNum != null) return aNum - bNum;
  if (aNum != null) return -1;
  if (bNum != null) return 1;
  return compareText(a, b);
}

export function nextParticipantSort(
  current: ParticipantSort,
  key: ParticipantSortKey
): ParticipantSort {
  if (current?.key !== key) {
    return { key, direction: "asc" };
  }
  if (current.direction === "asc") {
    return { key, direction: "desc" };
  }
  return null;
}

export function sortParticipants(
  rows: ParticipantProjection[],
  sort: ParticipantSort
): ParticipantProjection[] {
  if (!sort) return rows;
  const sorted = [...rows];
  const factor = sort.direction === "asc" ? 1 : -1;
  sorted.sort((a, b) => {
    let result = 0;
    switch (sort.key) {
      case "id":
        result = a.id - b.id;
        break;
      case "numDossard":
        result = compareDossard(a.numDossard ?? "", b.numDossard ?? "");
        break;
      case "nom":
        result = compareText(a.nom ?? "", b.nom ?? "");
        break;
      case "prenom":
        result = compareText(a.prenom ?? "", b.prenom ?? "");
        break;
    }
    if (result !== 0) return result * factor;
    return a.id - b.id;
  });
  return sorted;
}
