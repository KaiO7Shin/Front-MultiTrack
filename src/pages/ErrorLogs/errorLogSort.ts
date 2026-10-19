import type { ErrorLogListItem } from "@/services/errorLogs";
import { compareTimestamp, sortRows, type ColumnSort } from "@/lib/tableSort";

export type ErrorLogSortKey = "date";
export type ErrorLogSort = ColumnSort<ErrorLogSortKey>;

export function sortErrorLogs(rows: ErrorLogListItem[], sort: ErrorLogSort): ErrorLogListItem[] {
  return sortRows(
    rows,
    sort,
    (left, right) => compareTimestamp(left.dateCreation, right.dateCreation),
    (left, right) => left.id - right.id
  );
}
