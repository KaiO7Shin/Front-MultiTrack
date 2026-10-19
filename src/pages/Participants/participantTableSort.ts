import type { ParticipantProjection } from "@/lib/type";
import {
  compareTextFr,
  nextColumnSort,
  sortRows,
  type ColumnSort,
  type SortDirection,
} from "@/lib/tableSort";

export type { SortDirection };

export type ParticipantSortKey = "id" | "numDossard" | "nom" | "prenom";

export type ParticipantSort = ColumnSort<ParticipantSortKey>;

function compareDossard(left: string, right: string) {
  const a = left.trim();
  const b = right.trim();
  const aNum = /^\d+$/.test(a) ? Number(a) : null;
  const bNum = /^\d+$/.test(b) ? Number(b) : null;
  if (aNum != null && bNum != null) return aNum - bNum;
  if (aNum != null) return -1;
  if (bNum != null) return 1;
  return compareTextFr(a, b);
}

export function nextParticipantSort(
  current: ParticipantSort,
  key: ParticipantSortKey
): ParticipantSort {
  return nextColumnSort(current, key);
}

export function sortParticipants(
  rows: ParticipantProjection[],
  sort: ParticipantSort
): ParticipantProjection[] {
  return sortRows(
    rows,
    sort,
    (a, b, key) => {
      switch (key) {
        case "id":
          return a.id - b.id;
        case "numDossard":
          return compareDossard(a.numDossard ?? "", b.numDossard ?? "");
        case "nom":
          return compareTextFr(a.nom ?? "", b.nom ?? "");
        case "prenom":
          return compareTextFr(a.prenom ?? "", b.prenom ?? "");
      }
    },
    (a, b) => a.id - b.id
  );
}
