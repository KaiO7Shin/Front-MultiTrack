import { statusLabel } from "@/pages/Participants/participantStatus";
import type { StatutOption } from "@/services/statuts";
import { compareTextFr, sortRows, type ColumnSort } from "@/lib/tableSort";

export type StatutSortKey = "id" | "libelle";
export type StatutSort = ColumnSort<StatutSortKey>;

export function sortStatuts(rows: StatutOption[], sort: StatutSort): StatutOption[] {
  return sortRows(
    rows,
    sort,
    (left, right, key) => {
      switch (key) {
        case "id":
          return left.id - right.id;
        case "libelle":
          return compareTextFr(statusLabel(left.libelle), statusLabel(right.libelle));
      }
    },
    (left, right) => left.id - right.id
  );
}
