import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  deleteParticipant,
  fetchAllParticipants,
} from "@/services/participants";
import { fetchCategories, fetchCoursesDetailed } from "@/services/courses";
import { fetchGenres, type GenreOption } from "@/services/genres";
import { fetchStatuts, type StatutOption } from "@/services/statuts";
import type {
  CourseType,
  ParticipantProjection,
} from "@/lib/type";
import { formatParticipantName } from "@/lib/utils";
import { ROLE_ADMIN, useAuth } from "@/lib/auth";
import { ParticipantCreateForm } from "./ParticipantCreateForm";
import { ParticipantsTable } from "./ParticipantsTable";
import { statusLabel } from "./participantStatus";
import { Alert } from "@/components/ui/feedback";
import { FormField, selectClassName } from "@/components/ui/form-field";
import { Modal } from "@/components/ui/modal";

type UICourse = { id: number; label: string; type: CourseType };
type UICategory = { id: number; alias: string };

function scrollToParticipantForm() {
  document.getElementById("participant-form")?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

function scrollToParticipantRow(id: number) {
  requestAnimationFrame(() => {
    document
      .querySelector(`[data-participant-id="${id}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

export function ParticipantsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === ROLE_ADMIN;
  const feedbackRef = useRef<HTMLDivElement>(null);

  const [participants, setParticipants] = useState<ParticipantProjection[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [courses, setCourses] = useState<UICourse[]>([]);
  const [categories, setCategories] = useState<UICategory[]>([]);
  const [genres, setGenres] = useState<GenreOption[]>([]);
  const [statuts, setStatuts] = useState<StatutOption[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | "all">("all");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | "all">("all");
  const [selectedGender, setSelectedGender] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const [editingParticipant, setEditingParticipant] =
    useState<ParticipantProjection | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<ParticipantProjection | null>(null);
  const [deleteSaving, setDeleteSaving] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadParticipants = useCallback(async () => {
    setLoading(true);
    setListError(null);
    try {
      setParticipants(await fetchAllParticipants());
    } catch {
      setParticipants([]);
      setListError("Impossible de charger les participants.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadParticipants();
  }, [loadParticipants]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [courseList, catList, genreList, statutList] = await Promise.all([
          fetchCoursesDetailed(),
          fetchCategories(),
          fetchGenres(),
          fetchStatuts(),
        ]);
        if (!mounted) return;
        setCourses(courseList.map((c) => ({ id: c.id, label: c.name, type: c.type })));
        setCategories(catList);
        setGenres(genreList);
        setStatuts(statutList);
      } catch {
        if (mounted) {
          setListError("Impossible de charger les listes de filtres.");
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    let base = participants;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      base = base.filter(
        (p) =>
          p.nom.toLowerCase().includes(q) ||
          p.prenom.toLowerCase().includes(q) ||
          formatParticipantName(p.prenom, p.nom).toLowerCase().includes(q) ||
          p.numDossard.includes(q) ||
          String(p.id).includes(q)
      );
    }
    if (selectedCourseId !== "all") {
      base = base.filter((p) => p.courseId === selectedCourseId);
    }
    if (selectedGender !== "all") {
      base = base.filter((p) => p.genre === selectedGender);
    }
    if (selectedStatus !== "all") {
      base = base.filter((p) => p.statut === selectedStatus);
    }
    if (selectedCategoryId !== "all") {
      const alias =
        categories.find((c) => c.id === selectedCategoryId)?.alias?.toLowerCase() ?? "";
      if (alias) {
        base = base.filter((p) =>
          (p.aliasCategorie || "").toLowerCase().includes(alias)
        );
      }
    }
    return base;
  }, [
    participants,
    query,
    selectedCourseId,
    selectedGender,
    selectedStatus,
    selectedCategoryId,
    categories,
  ]);

  const showFeedback = (message: string) => {
    setActionSuccess(message);
    requestAnimationFrame(() => {
      feedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  };

  const handleFormSuccess = async (message: string, participantId?: number) => {
    setEditingParticipant(null);
    await loadParticipants();
    showFeedback(message);
    if (participantId != null) {
      setTimeout(() => scrollToParticipantRow(participantId), 80);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteSaving(true);
    setDeleteError(null);
    try {
      const res = await deleteParticipant(deleteTarget.id);
      await loadParticipants();
      setDeleteTarget(null);
      showFeedback(res.message || "Participant supprimé.");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      setDeleteError(
        error.response?.data?.message ||
          error.message ||
          "Impossible de supprimer le participant."
      );
    } finally {
      setDeleteSaving(false);
    }
  };

  const exportPdf = () => {
    if (filtered.length === 0) return;
    const doc = new jsPDF("p", "mm", "a4");
    doc.setFontSize(16);
    doc.text("Liste des participants", 14, 20);
    autoTable(doc, {
      startY: 28,
      head: [["Id", "Nom", "Prénom", "Genre", "Course", "Statut"]],
      body: filtered.map((p) => [
        String(p.id),
        p.nom,
        p.prenom,
        p.genre,
        p.courseLibelle || p.nomCourse || "—",
        statusLabel(p.statut),
      ]),
      styles: { fontSize: 9 },
    });
    doc.save("participants.pdf");
  };

  return (
    <section className="page-section">
      <div className="page-header">
        <div className="min-w-0">
          <h1 className="page-title">Participants</h1>
          <p className="page-subtitle">
            {isAdmin
              ? "Gérez les inscrits, validez les dossiers et suivez les courses."
              : "Ajoutez un coureur et suivez les inscrits."}
          </p>
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
          {isAdmin && (
            <Link
              to="/participants/import"
              className="rounded-xl border px-3 py-2 text-sm hover:bg-[#8c9962]/10 text-center"
            >
              Importer CSV
            </Link>
          )}
        </div>
      </div>

      <div ref={feedbackRef}>
        {listError && (
          <Alert variant="error" role="alert">
            {listError}
          </Alert>
        )}
        {actionSuccess && (
          <Alert variant="success" role="status">
            {actionSuccess}
          </Alert>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-brand uppercase tracking-wide">
          {editingParticipant
            ? "Modification d’un participant"
            : "Ajout d’un participant"}
        </h2>
        <ParticipantCreateForm
          editing={editingParticipant}
          onCancelEdit={() => setEditingParticipant(null)}
          onSuccess={(message, participantId) => {
            void handleFormSuccess(message, participantId);
          }}
        />
      </div>

      <hr className="border-border" />

      <div className="filter-panel">
        <div className="relative w-full">
          <label htmlFor="participant-search" className="sr-only">
            Rechercher un participant
          </label>
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            id="participant-search"
            type="text"
            placeholder="Nom, prénom, dossard ou id…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActionSuccess(null);
            }}
            className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border focus:ring-2 focus:ring-brand/30"
          />
        </div>

        <div className="filter-fields">
          <FormField label="Course" htmlFor="filter-course">
            <select
              id="filter-course"
              className={selectClassName}
              value={String(selectedCourseId)}
              onChange={(e) => {
                setSelectedCourseId(
                  e.target.value === "all" ? "all" : Number(e.target.value)
                );
                setActionSuccess(null);
              }}
            >
              <option value="all">Toutes les courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Catégorie" htmlFor="filter-category">
            <select
              id="filter-category"
              className={selectClassName}
              value={String(selectedCategoryId)}
              onChange={(e) =>
                setSelectedCategoryId(
                  e.target.value === "all" ? "all" : Number(e.target.value)
                )
              }
            >
              <option value="all">Toutes catégories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.alias}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Genre" htmlFor="filter-gender">
            <select
              id="filter-gender"
              className={selectClassName}
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
            >
              <option value="all">Tous genres</option>
              {genres.map((g) => (
                <option key={g.id} value={g.libelle}>
                  {g.libelle}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Statut" htmlFor="filter-status">
            <select
              id="filter-status"
              className={selectClassName}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">Tous les statuts</option>
              {statuts.map((s) => (
                <option key={s.id} value={s.libelle}>
                  {s.libelle}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        {!loading && (
          <p className="text-xs text-slate-500">
            {filtered.length} participant{filtered.length > 1 ? "s" : ""}
          </p>
        )}
      </div>

      <ParticipantsTable
        loading={loading}
        rows={filtered}
        onEdit={(row) => {
          setActionSuccess(null);
          setEditingParticipant(row);
          requestAnimationFrame(() => scrollToParticipantForm());
        }}
        onDelete={(row) => {
          setDeleteError(null);
          setActionSuccess(null);
          setDeleteTarget(row);
        }}
      />

      <Modal
        open={deleteTarget !== null}
        title="Supprimer le participant"
        onClose={() => {
          if (deleteSaving) return;
          setDeleteTarget(null);
          setDeleteError(null);
        }}
        disabled={deleteSaving}
        size="sm"
      >
        <div className="space-y-4 p-4 sm:p-5">
          {deleteError && (
            <Alert variant="error" role="alert">
              {deleteError}
            </Alert>
          )}
          <p className="text-sm text-foreground">
            Souhaitez-vous vraiment supprimer{" "}
            <span className="font-medium">
              {deleteTarget
                ? formatParticipantName(deleteTarget.prenom, deleteTarget.nom)
                : ""}
            </span>{" "}
            ?
          </p>
          <p className="text-xs text-muted-foreground">
            Cette action est définitive.
          </p>
          <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
            <button
              type="button"
              onClick={() => {
                if (deleteSaving) return;
                setDeleteTarget(null);
                setDeleteError(null);
              }}
              disabled={deleteSaving}
              className="btn-secondary px-4 py-2 text-sm disabled:opacity-40"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={() => void confirmDelete()}
              disabled={deleteSaving}
              className="rounded-xl border border-[#a72a1f]/35 bg-[#fff0ee] px-4 py-2 text-sm font-medium text-[#a72a1f] hover:bg-[#fde8e4] disabled:opacity-40"
            >
              {deleteSaving ? "Suppression…" : "Supprimer"}
            </button>
          </div>
        </div>
      </Modal>
    </section>
  );
}

/** @deprecated Prefer ParticipantsPage */
export const ParticipantsList = ParticipantsPage;
