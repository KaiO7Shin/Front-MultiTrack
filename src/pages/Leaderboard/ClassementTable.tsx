import { Link } from "react-router-dom";
import {
  formatCltCategorie,
  formatCltGenre,
  formatRang,
} from "./classementView";
import type { ClassementLigne } from "@/services/classement";
import {
  statusBadgeClass,
  statusLabel,
} from "@/pages/Participants/participantStatus";

export function ClassementTable({ rows }: { rows: ClassementLigne[] }) {
  if (rows.length === 0) {
    return (
      <div className="page-card p-8 text-center text-sm text-muted-foreground">
        Aucun participant pour ces filtres.
      </div>
    );
  }

  return (
    <div className="page-card min-w-0 max-w-full">
      <div className="table-scroll min-w-0 max-w-full">
        <table className="border-separate border-spacing-0">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-right">Rang</th>
              <th className="px-4 py-3 text-center">Dossard</th>
              <th className="px-4 py-3 text-left">Nom</th>
              <th className="px-4 py-3 text-left">Prénom</th>
              <th className="px-4 py-3 text-center">Cat.</th>
              <th className="px-4 py-3 text-center">Temps</th>
              <th className="px-4 py-3 text-center">Clt genre</th>
              <th className="px-4 py-3 text-center">Clt cat.</th>
              <th className="px-4 py-3 text-center">Statut</th>
              <th className="sticky right-0 z-20 w-14 bg-slate-50 px-2 py-3 text-center shadow-[-6px_0_8px_-6px_rgba(15,23,43,0.18)]">
                <span className="sr-only">Dossier</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const name = [row.prenom, row.nom].filter(Boolean).join(" ");
              return (
                <tr key={row.participantId} className="group">
                  <td className="border-t border-border px-4 py-3 text-right tabular-nums group-hover:bg-[#8c9962]/5">
                    {formatRang(row.rang)}
                  </td>
                  <td className="border-t border-border px-4 py-3 text-center group-hover:bg-[#8c9962]/5">
                    {row.dossard}
                  </td>
                  <td className="border-t border-border px-4 py-3 text-left group-hover:bg-[#8c9962]/5">
                    {row.nom}
                  </td>
                  <td className="border-t border-border px-4 py-3 text-left group-hover:bg-[#8c9962]/5">
                    {row.prenom || "—"}
                  </td>
                  <td className="border-t border-border px-4 py-3 text-center group-hover:bg-[#8c9962]/5">
                    {row.categorieAlias || "—"}
                  </td>
                  <td className="border-t border-border px-4 py-3 text-center tabular-nums group-hover:bg-[#8c9962]/5">
                    {row.temps || "—"}
                  </td>
                  <td className="border-t border-border px-4 py-3 text-center group-hover:bg-[#8c9962]/5">
                    {formatCltGenre(row)}
                  </td>
                  <td className="border-t border-border px-4 py-3 text-center group-hover:bg-[#8c9962]/5">
                    {formatCltCategorie(row)}
                  </td>
                  <td className="border-t border-border px-4 py-3 text-center group-hover:bg-[#8c9962]/5">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(row.statut)}`}
                    >
                      {statusLabel(row.statut)}
                    </span>
                  </td>
                  <td className="sticky right-0 z-10 border-t border-border bg-white px-1 py-2 text-center shadow-[-6px_0_8px_-6px_rgba(15,23,43,0.18)] group-hover:bg-[#f4f6ef]">
                    <Link
                      to={`/participants/${row.participantId}?from=leaderboard`}
                      className="group/link relative inline-flex h-11 w-11 items-center justify-center rounded-md hover:bg-[#8c9962]/10"
                      aria-label={`Ouvrir le dossier de ${name}`}
                    >
                      <img src="/lien-externe.svg" alt="" className="h-4 w-4" />
                      <span
                        aria-hidden
                        className="pointer-events-none absolute right-full top-1/2 z-10 mr-1 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-navy px-2 py-1 text-[11px] font-medium text-white shadow-sm group-hover/link:block group-focus-visible/link:block"
                      >
                        Voir dossier
                      </span>
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
