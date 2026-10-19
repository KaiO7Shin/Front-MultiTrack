import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "@/components/ui/feedback";
import { nextColumnSort } from "@/lib/tableSort";
import {
  apiErrorMessage,
  fetchErrorLogs,
  type ErrorLogListItem,
  type ErrorLogPageSize,
} from "@/services/errorLogs";
import { sortErrorLogs, type ErrorLogSort, type ErrorLogSortKey } from "./errorLogSort";
import { ErrorLogsPagination } from "./ErrorLogsPagination";
import { ErrorLogsTable } from "./ErrorLogsTable";

export function ErrorLogsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<ErrorLogPageSize>("20");
  const [rows, setRows] = useState<ErrorLogListItem[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sort, setSort] = useState<ErrorLogSort>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchErrorLogs(page, pageSize);
      setRows(data.items);
      setTotalElements(data.totalElements);
      setTotalPages(data.totalPages);
    } catch (err: unknown) {
      setRows([]);
      setTotalElements(0);
      setTotalPages(1);
      setError(apiErrorMessage(err, "Impossible de charger les journaux d’erreurs."));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const displayRows = useMemo(() => sortErrorLogs(rows, sort), [rows, sort]);

  function handleSort(key: ErrorLogSortKey) {
    setSort((current) => nextColumnSort(current, key));
  }

  return (
    <section className="page-section">
      <div className="page-header">
        <div className="min-w-0">
          <h1 className="page-title">Journaux d’erreurs</h1>
          <p className="page-subtitle">
            Consultation des erreurs techniques et métier de l’application.
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="error" role="alert">
          {error}
        </Alert>
      )}

      <ErrorLogsPagination
        page={page}
        totalPages={totalPages}
        totalElements={totalElements}
        pageSize={pageSize}
        disabled={loading}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />

      <ErrorLogsTable loading={loading} rows={displayRows} sort={sort} onSort={handleSort} />
    </section>
  );
}
