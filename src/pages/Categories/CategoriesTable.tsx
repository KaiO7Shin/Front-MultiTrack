import { Pencil, Trash2 } from "lucide-react";
import type { Category } from "@/lib/type";
import { formatAgeRange } from "@/lib/utils";
import { SortableHeader } from "@/components/ui/SortableHeader";
import { categoryLabel, type CategorySort, type CategorySortKey } from "./categorySort";

type CategoriesTableProps = {
  rows: Category[];
  sort: CategorySort;
  onSort: (key: CategorySortKey) => void;
  onEdit: (cat: Category) => void;
  onDelete: (cat: Category) => void;
};

export function CategoriesTable({
  rows,
  sort,
  onSort,
  onEdit,
  onDelete,
}: CategoriesTableProps) {
  return (
    <div className="table-scroll">
      <table>
        <thead className="bg-slate-50">
          <tr>
            <SortableHeader
              label="Alias"
              sortKey="alias"
              sort={sort}
              onSort={onSort}
              className="text-center"
            />
            <SortableHeader
              label="Libellé"
              sortKey="libelle"
              sort={sort}
              onSort={onSort}
              className="text-left"
            />
            <SortableHeader
              label="Tranche d'âge"
              sortKey="ageMin"
              sort={sort}
              onSort={onSort}
              className="text-right"
            />
            <th className="px-3 py-2 text-right font-medium text-slate-600">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((cat) => (
            <tr key={cat.id} className="hover:bg-[#8c9962]/5">
              <td className="px-4 py-3 text-center font-semibold">{cat.alias}</td>
              <td className="px-4 py-3 text-left">{categoryLabel(cat)}</td>
              <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                {formatAgeRange(cat.ageMin, cat.ageMax)}
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex flex-col sm:flex-row sm:inline-flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => onEdit(cat)}
                    className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs hover:bg-[#8c9962]/10"
                  >
                    <Pencil className="h-3 w-3" />
                    Modifier
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(cat)}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1 text-xs text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3" />
                    Supprimer
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
