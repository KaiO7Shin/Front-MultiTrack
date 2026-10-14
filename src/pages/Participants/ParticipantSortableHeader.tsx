import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { ParticipantSort, ParticipantSortKey } from "./participantTableSort";

export function ParticipantSortableHeader({
  label,
  sortKey,
  sort,
  onSort,
  className = "text-left",
}: {
  label: string;
  sortKey: ParticipantSortKey;
  sort: ParticipantSort;
  onSort: (key: ParticipantSortKey) => void;
  className?: string;
}) {
  const active = sort?.key === sortKey;
  const Icon = active ? (sort.direction === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;

  return (
    <th className={`px-3 py-2 ${className}`}>
      <button
        type="button"
        className="inline-flex items-center gap-1 font-medium text-slate-700 hover:text-brand"
        onClick={() => onSort(sortKey)}
        aria-label={`Trier par ${label}${active ? ` (${sort.direction === "asc" ? "croissant" : "décroissant"})` : ""}`}
      >
        <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
        {label}
      </button>
    </th>
  );
}
