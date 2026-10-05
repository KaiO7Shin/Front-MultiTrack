import { FormField, selectClassName } from "@/components/ui/form-field";
import {
  ERROR_LOG_PAGE_SIZES,
  type ErrorLogPageSize,
} from "@/services/errorLogs";

const SIZE_LABEL: Record<ErrorLogPageSize, string> = {
  "10": "10",
  "20": "20",
  "50": "50",
  "100": "100",
  all: "Toutes",
};

export function ErrorLogsPagination({
  page,
  totalPages,
  totalElements,
  pageSize,
  disabled,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  totalPages: number;
  totalElements: number;
  pageSize: ErrorLogPageSize;
  disabled?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: ErrorLogPageSize) => void;
}) {
  const showPager = pageSize !== "all";
  const lastPage = Math.max(totalPages, 1);
  const current = Math.min(page, lastPage);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <FormField label="Lignes affichées" htmlFor="error-log-page-size" className="sm:w-44">
        <select
          id="error-log-page-size"
          className={selectClassName}
          value={pageSize}
          disabled={disabled}
          onChange={(event) => onPageSizeChange(event.target.value as ErrorLogPageSize)}
        >
          {ERROR_LOG_PAGE_SIZES.map((size) => (
            <option key={size} value={size}>
              {SIZE_LABEL[size]}
            </option>
          ))}
        </select>
      </FormField>

      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
        <span>
          {totalElements} journal{totalElements > 1 ? "aux" : ""}
        </span>
        {showPager && (
          <>
            <button
              type="button"
              className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-40"
              disabled={disabled || current <= 1}
              onClick={() => onPageChange(current - 1)}
            >
              Précédent
            </button>
            <span className="tabular-nums">
              Page {current} / {lastPage}
            </span>
            <button
              type="button"
              className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-40"
              disabled={disabled || current >= lastPage || totalPages === 0}
              onClick={() => onPageChange(current + 1)}
            >
              Suivant
            </button>
          </>
        )}
      </div>
    </div>
  );
}
