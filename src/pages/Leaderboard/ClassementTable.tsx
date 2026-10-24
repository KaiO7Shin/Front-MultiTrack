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
    <div className="page-card overflow-hidden">
      <div className="table-scroll">
        <table>
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
              <th className="w-12 px-2 py-3 text-center">
                <span className="sr-only">Dossier</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row) => {
              const name = [row.prenom, row.nom].filter(Boolean).join(" ");
              return (
                <tr key={row.participantId} className="hover:bg-[#8c9962]/5">
                  <td className="px-4 py-3 text-right tabular-nums">{formatRang(row.rang)}</td>
                  <td className="px-4 py-3 text-center">{row.dossard}</td>
                  <td className="px-4 py-3 text-left">{row.nom}</td>
                  <td className="px-4 py-3 text-left">{row.prenom || "—"}</td>
                  <td className="px-4 py-3 text-center">{row.categorieAlias || "—"}</td>
                  <td className="px-4 py-3 text-center tabular-nums">{row.temps || "—"}</td>
                  <td className="px-4 py-3 text-center">{formatCltGenre(row)}</td>
                  <td className="px-4 py-3 text-center">{formatCltCategorie(row)}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(row.statut)}`}
                    >
                      {statusLabel(row.statut)}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <Link
                      to={`/participants/${row.participantId}?from=leaderboard`}
                      className="group relative inline-flex rounded-md p-1 hover:bg-[#8c9962]/10"
                      aria-label={`Ouvrir le dossier de ${name}`}
                    >
                      <img src="/lien-externe.svg" alt="" className="h-4 w-4" />
                      <span
                        aria-hidden
                        className="pointer-events-none absolute right-full top-1/2 z-10 mr-1 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-navy px-2 py-1 text-[11px] font-medium text-white shadow-sm group-hover:block group-focus-visible:block"
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
