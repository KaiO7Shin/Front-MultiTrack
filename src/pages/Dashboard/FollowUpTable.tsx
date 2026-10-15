import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { EmptyState } from "@/components/ui/feedback";
import { FormField, selectClassName } from "@/components/ui/form-field";
import { statusBadgeClass, statusLabel } from "@/pages/Participants/participantStatus";
import { DashboardPanel } from "./DashboardPanel";
import { formatCount } from "./dashboardView";
import {
  FOLLOW_UP_PAGE_SIZES,
  type FollowUpPageSize,
  type FollowUpRow,
  type ParticipantStatut,
} from "./dashboardTypes";

function pageCount(total: number, pageSize: FollowUpPageSize) {
  if (pageSize === "all" || total === 0) return 1;
  return Math.ceil(total / pageSize);
}

export function FollowUpTable({
  rows,
  participantStatut,
}: {
  rows: FollowUpRow[];
  participantStatut: ParticipantStatut | "all";
}) {
  const [pageSize, setPageSize] = useState<FollowUpPageSize>(10);
  const [page, setPage] = useState(1);
  const totalPages = pageCount(rows.length, pageSize);
  const currentPage = Math.min(page, totalPages);
  const pagedRows =
    pageSize === "all"
      ? rows
      : rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const rowKey = rows.map((row) => row.id).join(",");

  useEffect(() => {
    setPage(1);
  }, [rowKey, pageSize]);

  const emptyDescription =
    participantStatut !== "all" &&
    participantStatut !== "DNF" &&
    participantStatut !== "DSQ" &&
    participantStatut !== "DNS"
      ? "Ce tableau liste les DNF, DSQ et DNS. Le statut choisi n’en fait pas partie."
      : "Aucun participant DNF, DSQ ou DNS pour cette sélection.";

  return (
    <DashboardPanel
        title="Participants à suivre"
        aside={
          <p className="text-xs tabular-nums text-muted-foreground">
            {formatCount(rows.length)} participant{rows.length > 1 ? "s" : ""}
          </p>
        }
      >
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <FormField label="Lignes affichées" htmlFor="follow-up-page-size" className="sm:w-44">
            <select
              id="follow-up-page-size"
              className={selectClassName}
              value={String(pageSize)}
              onChange={(event) => {
                const value = event.target.value;
                setPageSize(value === "all" ? "all" : (Number(value) as FollowUpPageSize));
              }}
            >
              {FOLLOW_UP_PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
              <option value="all">Tous</option>
            </select>
          </FormField>
          {rows.length > 0 && pageSize !== "all" && (
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
              <span className="tabular-nums">
                Page {currentPage.toLocaleString("fr-FR")} / {totalPages.toLocaleString("fr-FR")}
              </span>
              <button
                type="button"
                className="btn-secondary px-2.5 py-1.5 text-xs disabled:opacity-40"
                disabled={currentPage <= 1}
                onClick={() => setPage(currentPage - 1)}
                aria-label="Page précédente"
              >
                <ChevronLeft className="h-4 w-4" />
                Précédent
              </button>
              <button
                type="button"
                className="btn-secondary px-2.5 py-1.5 text-xs disabled:opacity-40"
                disabled={currentPage >= totalPages}
                onClick={() => setPage(currentPage + 1)}
                aria-label="Page suivante"
              >
                Suivant
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {rows.length === 0 ? (
          <EmptyState title="Aucun participant à suivre" description={emptyDescription} />
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left">Nom</th>
                  <th className="px-3 py-2 text-left">Course</th>
                  <th className="px-3 py-2 text-center">Statut</th>
                  <th className="px-3 py-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {pagedRows.map((row) => (
                  <tr key={row.id} className="hover:bg-[#8c9962]/5">
                    <td className="px-3 py-2 text-left">{row.fullName}</td>
                    <td className="px-3 py-2 text-left">{row.course}</td>
                    <td className="px-3 py-2 text-center">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(row.statut)}`}
                      >
                        {statusLabel(row.statut)}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <Link
                        to={`/participants/${row.id}?from=dashboard`}
                        className="btn-secondary inline-flex px-3 py-1.5 text-xs"
                        aria-label={`Consulter ${row.fullName}`}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Consulter
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </DashboardPanel>
  );
}
