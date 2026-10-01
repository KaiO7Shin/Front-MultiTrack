import { useNavigate } from "react-router-dom";
import { Pencil, Trash2, Users } from "lucide-react";
import type { ParticipantProjection } from "@/lib/type";
import { EmptyState, Spinner } from "@/components/ui/feedback";
import { statusBadgeClass, statusLabel } from "./participantStatus";

type ParticipantsTableProps = {
  loading: boolean;
  rows: ParticipantProjection[];
  /** Mode inscription : pas d’édition / suppression participant. */
  sourceMode?: "INSCRIPTION" | "PARTICIPANT";
  onEdit: (row: ParticipantProjection) => void;
  onDelete: (row: ParticipantProjection) => void;
};

export function ParticipantsTable({
  loading,
  rows,
  sourceMode = "PARTICIPANT",
  onEdit,
  onDelete,
}: ParticipantsTableProps) {
  const navigate = useNavigate();
  const isInscription = sourceMode === "INSCRIPTION";

  if (loading) {
    return (
      <div className="bg-white border rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2 justify-center p-8 text-slate-500">
          <Spinner className="text-brand" />
          <span className="text-sm">
            {isInscription
              ? "Chargement des inscriptions…"
              : "Chargement des participants…"}
          </span>
        </div>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="bg-white border rounded-2xl overflow-hidden">
        <EmptyState
          icon={<Users className="h-10 w-10" />}
          title={isInscription ? "Aucune inscription trouvée" : "Aucun participant trouvé"}
          description="Aucun résultat pour les filtres actuels."
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
              <th className="px-3 py-2 text-left">Id</th>
              {!isInscription && (
                <th className="px-3 py-2 text-left">Dossard</th>
              )}
              <th className="px-3 py-2 text-left">Nom</th>
              <th className="px-3 py-2 text-left">Prénom</th>
              <th className="px-3 py-2 text-left">Genre</th>
              <th className="px-3 py-2 text-left">Course</th>
              <th className="px-3 py-2 text-left">
                {isInscription ? "Contact" : "Catégorie"}
              </th>
              <th className="px-3 py-2 text-left">Statut</th>
              {!isInscription && (
                <th className="px-3 py-2 text-right">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((p) => {
              const detailPath = isInscription
                ? `/inscriptions/${p.id}`
                : `/participants/${p.id}`;
              return (
                <tr
                  key={`${p.source ?? sourceMode}-${p.id}`}
                  data-participant-id={p.id}
                  role="link"
                  tabIndex={0}
                  onClick={() => navigate(detailPath)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navigate(detailPath);
                    }
                  }}
                  className="cursor-pointer hover:bg-[#8c9962]/5 focus-visible:bg-[#8c9962]/10 focus-visible:outline-none"
                >
                  <td className="px-3 py-2 tabular-nums font-medium">{p.id}</td>
                  {!isInscription && (
                    <td className="px-3 py-2 tabular-nums">
                      {p.numDossard?.trim() || "—"}
                    </td>
                  )}
                  <td className="px-3 py-2">{p.nom}</td>
                  <td className="px-3 py-2">{p.prenom}</td>
                  <td className="px-3 py-2">{p.genre}</td>
                  <td className="px-3 py-2">
                    {p.courseLibelle || p.nomCourse || "—"}
                  </td>
                  <td className="px-3 py-2">
                    {isInscription
                      ? p.email || p.contact || "—"
                      : p.aliasCategorie || "—"}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(p.statut)}`}
                    >
                      {statusLabel(p.statut)}
                    </span>
                  </td>
                  {!isInscription && (
                    <td
                      className="px-3 py-2 text-right"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      <div className="inline-flex flex-wrap justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onEdit(p)}
                          className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-[#8c9962]/10"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Modifier
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(p)}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#a72a1f]/25 px-2.5 py-1 text-xs font-medium text-[#a72a1f] hover:bg-[#fff0ee]"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Supprimer
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
