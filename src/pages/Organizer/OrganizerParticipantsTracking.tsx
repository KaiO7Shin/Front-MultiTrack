import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Users } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { fetchCoursesDetailed } from "@/services/courses";
import { fetchAllParticipants } from "@/services/participants";
import type { ParticipantProjection, ParticipantStatus } from "@/lib/type";
import { formatParticipantName } from "@/lib/utils";
import { Alert, EmptyState, Spinner } from "@/components/ui/feedback";
import { FormField, selectClassName } from "@/components/ui/form-field";
import {
  PARTICIPANT_STATUSES,
  PARTICIPANT_STATUS_LABELS,
  statusBadgeClass,
  statusLabel,
} from "@/pages/Participants/participantStatus";

type UICourse = { id: number; label: string };

type OrganizerParticipantsTrackingProps = {
  refreshKey?: number;
};

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100, 500] as const;
type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number] | "all";

export function OrganizerParticipantsTracking({
  refreshKey = 0,
}: OrganizerParticipantsTrackingProps) {
  const [participants, setParticipants] = useState<ParticipantProjection[]>([]);
  const [courses, setCourses] = useState<UICourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCourseId, setSelectedCourseId] = useState<number | "all">("all");
  const [selectedGender, setSelectedGender] = useState<"all" | "Homme" | "Femme">("all");
  const [selectedStatus, setSelectedStatus] = useState<"all" | ParticipantStatus>("all");
  const [pageSize, setPageSize] = useState<PageSizeOption>(20);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [courseList, rows] = await Promise.all([
        fetchCoursesDetailed(),
        fetchAllParticipants(),
      ]);
      setCourses(courseList.map((c) => ({ id: c.id, label: c.name })));
      setParticipants(rows);
    } catch {
      setParticipants([]);
      setError("Impossible de charger les participants.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const filtered = useMemo(() => {
    let base = participants;
    if (selectedCourseId !== "all") {
      base = base.filter((p) => p.courseId === selectedCourseId);
    }
    if (selectedGender !== "all") {
      base = base.filter((p) => p.genre === selectedGender);
    }
    if (selectedStatus !== "all") {
      base = base.filter((p) => p.statut === selectedStatus);
    }
    return base;
  }, [participants, selectedCourseId, selectedGender, selectedStatus]);

  useEffect(() => {
    setPage(1);
  }, [selectedCourseId, selectedGender, selectedStatus, pageSize]);

  const totalPages =
    pageSize === "all" ? 1 : Math.max(1, Math.ceil(filtered.length / pageSize));

  const currentPage = Math.min(page, totalPages);

  const paged = useMemo(() => {
    if (pageSize === "all") return filtered;
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, pageSize, currentPage]);

  const exportPdf = () => {
    if (filtered.length === 0) return;
    const doc = new jsPDF("p", "mm", "a4");
    doc.setFontSize(16);
    doc.text("Suivi des participants", 14, 20);
    autoTable(doc, {
      startY: 28,
      head: [["Id", "Nom et prénom", "Naissance", "Genre", "Course", "Statut"]],
      body: filtered.map((p) => [
        String(p.id),
        formatParticipantName(p.prenom, p.nom),
        p.dateNaissance || "—",
        p.genre,
        p.courseLibelle || p.nomCourse || "—",
        statusLabel(p.statut),
      ]),
      styles: { fontSize: 9 },
    });
    doc.save("participants-suivi.pdf");
  };

  const rangeLabel = (() => {
    if (filtered.length === 0) return "0 participant";
    if (pageSize === "all") {
      return `${filtered.length} participant${filtered.length > 1 ? "s" : ""}`;
    }
    const from = (currentPage - 1) * pageSize + 1;
    const to = Math.min(currentPage * pageSize, filtered.length);
    return `${from}–${to} sur ${filtered.length}`;
  })();

  return (
    <div className="space-y-4">
      <div className="page-header">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-brand uppercase tracking-wide">
            Suivi des participants
          </h2>
          <p className="page-subtitle">Liste filtrable des inscrits</p>
        </div>
        <div className="page-actions">
          <button
            type="button"
            onClick={exportPdf}
            disabled={filtered.length === 0}
            className="btn-secondary px-3 py-2 text-sm disabled:opacity-40"
          >
            <img src="/pdf.svg" alt="" className="h-4 w-4" aria-hidden />
            Exporter
          </button>
        </div>
      </div>

      {error && (
        <Alert variant="error" role="alert">
          {error}
        </Alert>
      )}

      <div className="filter-panel">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="filter-fields flex-1">
            <FormField label="Statut" htmlFor="orga-filter-status">
              <select
                id="orga-filter-status"
                className={selectClassName}
                value={selectedStatus}
                onChange={(e) =>
                  setSelectedStatus(
                    e.target.value === "all"
                      ? "all"
                      : (e.target.value as ParticipantStatus)
                  )
                }
              >
                <option value="all">Tous les statuts</option>
                {PARTICIPANT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {PARTICIPANT_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Course" htmlFor="orga-filter-course">
              <select
                id="orga-filter-course"
                className={selectClassName}
                value={String(selectedCourseId)}
                onChange={(e) =>
                  setSelectedCourseId(
                    e.target.value === "all" ? "all" : Number(e.target.value)
                  )
                }
              >
                <option value="all">Toutes les courses</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Genre" htmlFor="orga-filter-gender">
              <select
                id="orga-filter-gender"
                className={selectClassName}
                value={selectedGender}
                onChange={(e) =>
                  setSelectedGender(e.target.value as "all" | "Homme" | "Femme")
                }
              >
                <option value="all">Tous genres</option>
                <option value="Homme">Homme</option>
                <option value="Femme">Femme</option>
              </select>
            </FormField>
          </div>

          <FormField
            label="Par page"
            htmlFor="orga-page-size"
            className="w-full sm:w-40 lg:shrink-0 lg:ml-auto"
          >
            <select
              id="orga-page-size"
              className={selectClassName}
              value={String(pageSize)}
              onChange={(e) => {
                const value = e.target.value;
                setPageSize(value === "all" ? "all" : (Number(value) as PageSizeOption));
              }}
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
              <option value="all">Tous</option>
            </select>
          </FormField>
        </div>
        {!loading && (
          <p className="text-xs text-slate-500">{rangeLabel}</p>
        )}
      </div>

      <div className="bg-white border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-8 text-slate-500">
            <Spinner className="text-brand" />
            <span className="text-sm">Chargement…</span>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Users className="h-10 w-10" />}
            title="Aucun participant"
            description="Aucun résultat pour les filtres sélectionnés."
          />
        ) : (
          <>
            <div className="table-scroll">
              <table>
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left">Id</th>
                    <th className="px-3 py-2 text-left">Nom et prénom</th>
                    <th className="px-3 py-2 text-left">Date de naissance</th>
                    <th className="px-3 py-2 text-left">Genre</th>
                    <th className="px-3 py-2 text-left">Course choisie</th>
                    <th className="px-3 py-2 text-left">Statut</th>
                    <th className="px-3 py-2 text-right">Détails</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {paged.map((p) => (
                    <tr key={p.id} className="hover:bg-[#8c9962]/5">
                      <td className="px-3 py-2 tabular-nums">{p.id}</td>
                      <td className="px-3 py-2">
                        {formatParticipantName(p.prenom, p.nom)}
                      </td>
                      <td className="px-3 py-2 tabular-nums">
                        {p.dateNaissance || "—"}
                      </td>
                      <td className="px-3 py-2">{p.genre}</td>
                      <td className="px-3 py-2">
                        {p.courseLibelle || p.nomCourse || "—"}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(p.statut)}`}
                        >
                          {statusLabel(p.statut)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Link
                          to={`/participants/${p.id}`}
                          className="inline-flex rounded-lg border px-2.5 py-1 text-xs font-medium hover:bg-[#8c9962]/10"
                        >
                          Détails
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pageSize !== "all" && totalPages > 1 && (
              <div className="flex items-center justify-between gap-3 border-t px-3 py-2.5">
                <p className="text-xs text-slate-500">
                  Page {currentPage} / {totalPages}
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    className="btn-secondary px-2.5 py-1.5 text-xs disabled:opacity-40"
                    disabled={currentPage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    aria-label="Page précédente"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Précédent
                  </button>
                  <button
                    type="button"
                    className="btn-secondary px-2.5 py-1.5 text-xs disabled:opacity-40"
                    disabled={currentPage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    aria-label="Page suivante"
                  >
                    Suivant
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
