import { useEffect, useMemo, useRef, useState } from "react";
import { deleteParticipant } from "@/services/participants";
import { fetchCategories, fetchCoursesDetailed } from "@/services/courses";
import { fetchGenres, type GenreOption } from "@/services/genres";
import { fetchStatuts, type StatutOption } from "@/services/statuts";
import type { ParticipantProjection } from "@/lib/type";
import { ROLE_ADMIN, useAuth } from "@/lib/auth";
import { ParticipantCreateForm } from "./ParticipantCreateForm";
import { ParticipantDeleteModal } from "./ParticipantDeleteModal";
import { ParticipantListFilters } from "./ParticipantListFilters";
import { ParticipantsTable } from "./ParticipantsTable";
import {
  DEFAULT_STATUT_BY_SOURCE,
  defaultListSourceForRole,
  statutScopeParam,
  type ParticipantListSource,
} from "./participantListSource";
import {
  filterParticipantsByQuery,
  useParticipantListSearch,
} from "./useParticipantListSearch";
import { Alert } from "@/components/ui/feedback";
import { exportParticipantsPdf } from "./participantsPdf";
import {
  nextParticipantSort,
  sortParticipants,
  type ParticipantSort,
  type ParticipantSortKey,
} from "./participantTableSort";

type UICourse = { id: number; label: string };
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

  const [source, setSource] = useState<ParticipantListSource>(() =>
    defaultListSourceForRole(user?.role)
  );
  const [query, setQuery] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState<number | "all">("all");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | "all">("all");
  const [selectedGender, setSelectedGender] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState(() =>
    DEFAULT_STATUT_BY_SOURCE[defaultListSourceForRole(user?.role)]
  );

  const [courses, setCourses] = useState<UICourse[]>([]);
  const [categories, setCategories] = useState<UICategory[]>([]);
  const [genres, setGenres] = useState<GenreOption[]>([]);
  const [statuts, setStatuts] = useState<StatutOption[]>([]);

  const { rows, loading, error: listError, setError: setListError, reload } =
    useParticipantListSearch({
      source,
      courseId: selectedCourseId,
      categoryId: selectedCategoryId,
      gender: selectedGender,
      status: selectedStatus,
    });

  const filteredRows = useMemo(
    () => filterParticipantsByQuery(rows, query),
    [rows, query]
  );
  const [sort, setSort] = useState<ParticipantSort>(null);
  const displayRows = useMemo(
    () => sortParticipants(filteredRows, sort),
    [filteredRows, sort]
  );

  function handleSort(key: ParticipantSortKey) {
    setSort((current) => nextParticipantSort(current, key));
  }

  const [editingParticipant, setEditingParticipant] =
    useState<ParticipantProjection | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ParticipantProjection | null>(null);
  const [deleteSaving, setDeleteSaving] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [courseList, catList, genreList] = await Promise.all([
          fetchCoursesDetailed(),
          fetchCategories(),
          fetchGenres(),
        ]);
        if (!mounted) return;
        setCourses(courseList.map((c) => ({ id: c.id, label: c.name })));
        setCategories(catList);
        setGenres(genreList);
      } catch {
        if (mounted) setListError("Impossible de charger les listes de filtres.");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [setListError]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const statutList = await fetchStatuts(statutScopeParam(source));
        if (!mounted) return;
        setStatuts(statutList);
        const defaultStatut = DEFAULT_STATUT_BY_SOURCE[source];
        const stillValid = statutList.some((s) => s.libelle === selectedStatus);
        if (!stillValid) {
          setSelectedStatus(
            statutList.find((s) => s.libelle === defaultStatut)?.libelle ??
              statutList[0]?.libelle ??
              defaultStatut
          );
        }
      } catch {
        if (mounted) setListError("Impossible de charger les statuts.");
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- options liées à la source uniquement
  }, [source, setListError]);

  const showFeedback = (message: string) => {
    setActionSuccess(message);
    requestAnimationFrame(() => {
      feedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  };

  const handleFormSuccess = async (message: string, participantId?: number) => {
    setEditingParticipant(null);
    if (source !== "PARTICIPANT") {
      setSource("PARTICIPANT");
      setSelectedStatus(DEFAULT_STATUT_BY_SOURCE.PARTICIPANT);
    } else {
      await reload();
    }
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
      await reload();
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
    exportParticipantsPdf(displayRows, {
      title:
        source === "INSCRIPTION" ? "Liste des inscriptions" : "Liste des participants",
      filename: source === "INSCRIPTION" ? "inscriptions.pdf" : "participants.pdf",
    });
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
            disabled={filteredRows.length === 0}
            className="btn-secondary px-3 py-2 text-sm disabled:opacity-40"
          >
            <img src="/pdf.svg" alt="" className="h-4 w-4" aria-hidden />
            Exporter
          </button>
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

      <ParticipantListFilters
        query={query}
        source={source}
        selectedCourseId={selectedCourseId}
        selectedCategoryId={selectedCategoryId}
        selectedGender={selectedGender}
        selectedStatus={selectedStatus}
        courses={courses}
        categories={categories}
        genres={genres}
        statuts={statuts}
        showCount={!loading}
        resultCount={filteredRows.length}
        onQueryChange={(value) => {
          setQuery(value);
          setActionSuccess(null);
        }}
        onSourceChange={(value) => {
          setSource(value);
          setSelectedCategoryId("all");
          setSelectedStatus(DEFAULT_STATUT_BY_SOURCE[value]);
          setSort(null);
          setActionSuccess(null);
        }}
        onCourseChange={(value) => {
          setSelectedCourseId(value);
          setActionSuccess(null);
        }}
        onCategoryChange={setSelectedCategoryId}
        onGenderChange={setSelectedGender}
        onStatusChange={setSelectedStatus}
      />

      <ParticipantsTable
        loading={loading}
        rows={displayRows}
        sort={sort}
        onSort={handleSort}
        sourceMode={source}
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

      <ParticipantDeleteModal
        target={deleteTarget}
        saving={deleteSaving}
        error={deleteError}
        onClose={() => {
          setDeleteTarget(null);
          setDeleteError(null);
        }}
        onConfirm={() => void confirmDelete()}
      />
    </section>
  );
}

/** @deprecated Prefer ParticipantsPage */
export const ParticipantsList = ParticipantsPage;
