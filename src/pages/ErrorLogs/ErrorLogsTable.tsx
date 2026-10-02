import { useNavigate } from "react-router-dom";
import { ScrollText } from "lucide-react";
import { EmptyState, Spinner } from "@/components/ui/feedback";
import type { ErrorLogListItem } from "@/services/errorLogs";
import { displayErrorLogValue, formatErrorLogDate } from "./errorLogFormat";

export function ErrorLogsTable({
  loading,
  rows,
}: {
  loading: boolean;
  rows: ErrorLogListItem[];
}) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="bg-white border rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2 justify-center p-8 text-slate-500">
          <Spinner className="text-brand" />
          <span className="text-sm">Chargement des journaux…</span>
        </div>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="bg-white border rounded-2xl overflow-hidden">
        <EmptyState
          icon={<ScrollText className="h-10 w-10" />}
          title="Aucun journal d’erreur"
          description="Aucune ligne pour cette page."
        />
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-2xl overflow-hidden">
      <div className="table-scroll">
        <table>
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left">Date</th>
              <th className="px-3 py-2 text-left">Type</th>
              <th className="px-3 py-2 text-left">Niveau</th>
              <th className="px-3 py-2 text-left">Code</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row) => (
              <tr
                key={row.id}
                role="link"
                tabIndex={0}
                onClick={() => navigate(`/journaux/${row.id}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    navigate(`/journaux/${row.id}`);
                  }
                }}
                className="cursor-pointer hover:bg-[#8c9962]/5 focus-visible:bg-[#8c9962]/10 focus-visible:outline-none"
              >
                <td className="px-3 py-2 tabular-nums">
                  {formatErrorLogDate(row.dateCreation)}
                </td>
                <td className="px-3 py-2">{displayErrorLogValue(row.type)}</td>
                <td className="px-3 py-2">{displayErrorLogValue(row.niveau)}</td>
                <td className="px-3 py-2">{displayErrorLogValue(row.code)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
