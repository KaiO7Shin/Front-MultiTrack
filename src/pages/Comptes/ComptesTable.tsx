import { Pencil, UserCircle } from "lucide-react";
import type { CompteUtilisateurRow } from "@/lib/type";
import { EmptyState, Spinner } from "@/components/ui/feedback";
import { SortableHeader } from "@/components/ui/SortableHeader";
import type { CompteSort, CompteSortKey } from "./compteListUtils";

type ComptesTableProps = {
  loading: boolean;
  rows: CompteUtilisateurRow[];
  sort: CompteSort;
  onSort: (key: CompteSortKey) => void;
  onEdit: (row: CompteUtilisateurRow) => void;
};

export function ComptesTable({ loading, rows, sort, onSort, onEdit }: ComptesTableProps) {
  if (loading) {
    return (
      <div className="bg-white border rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2 justify-center p-8 text-slate-500">
          <Spinner className="text-brand" />
          <span className="text-sm">Chargement des comptes…</span>
        </div>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="bg-white border rounded-2xl overflow-hidden">
        <EmptyState
          icon={<UserCircle className="h-10 w-10" />}
          title="Aucun compte trouvé"
          description="Aucun résultat pour la recherche ou les filtres actuels."
        />
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-2xl overflow-hidden">
      <div className="table-scroll table-scroll-wide">
        <table>
          <thead className="bg-slate-50">
            <tr>
              <SortableHeader
                label="Id"
                sortKey="id"
                sort={sort}
                onSort={onSort}
                className="text-right"
              />
              <SortableHeader
                label="Nom d'utilisateur"
                sortKey="username"
                sort={sort}
                onSort={onSort}
              />
              <SortableHeader
                label="E-mail"
                sortKey="email"
                sort={sort}
                onSort={onSort}
              />
              <th className="px-3 py-2 text-left">Téléphone</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-[#8c9962]/5">
                <td className="px-3 py-2 text-right tabular-nums font-medium">
                  {row.id.toLocaleString("fr-FR")}
                </td>
                <td className="px-3 py-2">{row.username}</td>
                <td className="px-3 py-2">{row.email}</td>
                <td className="px-3 py-2 tabular-nums">{row.phone}</td>
                <td className="px-3 py-2 text-right">
                  <button
                    type="button"
                    onClick={() => onEdit(row)}
                    className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-[#8c9962]/10"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Modifier
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
