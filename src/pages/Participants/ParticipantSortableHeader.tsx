import { SortableHeader } from "@/components/ui/SortableHeader";
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
  return (
    <SortableHeader
      label={label}
      sortKey={sortKey}
      sort={sort}
      onSort={onSort}
      className={className}
    />
  );
}
