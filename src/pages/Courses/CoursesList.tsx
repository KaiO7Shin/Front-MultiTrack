import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Settings2, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import type { Course, CourseCreateDTO, CourseType } from "@/lib/type";
import { normalizeCourseStatus } from "@/lib/utils";
import {
  changeRaceStatus,
  createCourse,
  deleteCourse,
  fetchCoursesDetailed,
  updateCourse,
} from "@/services/courses";
import { CourseFormModal } from "./CourseFormModal";

const ACCENT = "#8c9962";

const TYPE_BADGE: Record<CourseType, string> = {
  TRAIL: "bg-[#8c9962]/15 text-[#5c6640] border-[#8c9962]/40",
  DH: "bg-orange-100 text-orange-800 border-orange-200",
  XC: "bg-blue-100 text-blue-800 border-blue-200",
};

export const CoursesList = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editTarget, setEditTarget] = useState<Course | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setCourses(await fetchCoursesDetailed());
    } catch {
      setLoadError("Impossible de charger les courses.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const counts = useMemo(() => {
    const total = courses.length;
    const upcoming = courses.filter((c) => c.status === "A venir").length;
    const running = courses.filter((c) => c.status === "En cours").length;
    const done = courses.filter((c) => c.status === "Terminee").length;
    return { total, upcoming, running, done };
  }, [courses]);

  function openCreate() {
    setModalMode("create");
    setEditTarget(null);
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(course: Course) {
    setModalMode("edit");
    setEditTarget(course);
    setFormError(null);
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
    setEditTarget(null);
    setFormError(null);
  }

  async function handleFormSubmit(dto: CourseCreateDTO) {
    setSaving(true);
    setFormError(null);
    try {
      if (modalMode === "create") {
        const created = await createCourse(dto);
        setCourses((prev) => [...prev, created]);
      } else if (editTarget) {
        const updated = await updateCourse(editTarget.id, dto);
        setCourses((prev) =>
          prev.map((c) => (c.id === editTarget.id ? updated : c))
        );
      }
      closeModal();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setFormError(
        err?.response?.data?.message ?? "Erreur lors de l'enregistrement."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(course: Course) {
    if (normalizeCourseStatus(course.status) !== "A venir") {
      alert("Seules les courses « À venir » peuvent être supprimées.");
      return;
    }
    if (!window.confirm(`Supprimer la course « ${course.name} » ?`)) return;

    try {
      await deleteCourse(course.id);
      setCourses((prev) => prev.filter((c) => c.id !== course.id));
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      alert(err?.response?.data?.message ?? "Erreur lors de la suppression.");
    }
  }

  return (
    <section className="page-section">
      <div className="page-header">
        <div className="min-w-0">
          <h1 className="page-title">Courses</h1>
          <p className="page-subtitle">
            Créer, modifier et gérer les courses par type (Trail, DH, XC)
          </p>
        </div>
        <div className="page-actions">
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 text-white px-4 py-2 text-sm hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Ajouter une course
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <StatPill label="Total" value={counts.total} />
        <StatPill label="A venir" value={counts.upcoming} />
        <StatPill label="En cours" value={counts.running} />
        <StatPill label="Terminées" value={counts.done} />
      </div>

      {loadError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </div>
      )}

      {loading ? (
        <div className="text-center text-sm text-slate-500 py-12">
          Chargement des courses…
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center text-sm text-slate-500 py-12 bg-white border rounded-2xl">
          Aucune course. Cliquez sur « Ajouter une course » pour commencer.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((c) => (
            <CourseCard
              key={c.id}
              course={c}
              onEdit={() => openEdit(c)}
              onDelete={() => handleDelete(c)}
              onLocalUpdate={(upd) => {
                setCourses((prev) =>
                  prev.map((x) => (x.id === c.id ? { ...x, ...upd } : x))
                );
              }}
              onRefresh={refresh}
            />
          ))}
        </div>
      )}

      <CourseFormModal
        open={modalOpen}
        mode={modalMode}
        initial={editTarget}
        saving={saving}
        error={formError}
        onClose={closeModal}
        onSubmit={handleFormSubmit}
      />
    </section>
  );
};

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div
      className="rounded-2xl border bg-white px-4 py-3 flex items-center justify-between"
      style={{ borderColor: `${ACCENT}40` }}
    >
      <span className="text-sm text-slate-600">{label}</span>
      <span className="text-lg font-semibold">{value}</span>
    </div>
  );
}

function CourseCard({
  course,
  onEdit,
  onDelete,
  onLocalUpdate,
  onRefresh,
}: {
  course: Course;
  onEdit: () => void;
  onDelete: () => void;
  onLocalUpdate: (upd: Partial<Course>) => void;
  onRefresh: () => Promise<void>;
}) {
  const status = normalizeCourseStatus(course.status);
  const [loading, setLoading] = useState(false);

  const canStart = status === "A venir";
  const canFinish = status === "En cours";
  const canEdit = status === "A venir";
  const canDelete = status === "A venir";

  async function handleStart() {
    if (loading) return;
    setLoading(true);
    try {
      const res = await changeRaceStatus(course.id, "En cours");
      onLocalUpdate({
        status: res.status,
        startAt: res.startAt || course.startAt,
      });
      await onRefresh();
    } catch {
      alert("Erreur lors du lancement de la course.");
    } finally {
      setLoading(false);
    }
  }

  async function handleFinish() {
    if (loading) return;
    if (!window.confirm(`Terminer la course « ${course.name} » ? Action irréversible.`))
      return;
    setLoading(true);
    try {
      const res = await changeRaceStatus(course.id, "Terminee");
      onLocalUpdate({
        status: res.status,
        startAt: res.startAt || course.startAt,
      });
      await onRefresh();
    } catch {
      alert("Erreur lors de la clôture de la course.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base font-semibold truncate">{course.name}</span>
            <span
              className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TYPE_BADGE[course.type]}`}
            >
              {course.type}
            </span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {status}
            {course.distanceKm != null ? ` • ${course.distanceKm} km` : ""}
            {course.elevation != null ? ` • D+ ${course.elevation} m` : ""}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-auto pt-1 border-t border-slate-100">
        <Link
          to={`/courses/${course.id}`}
          className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs hover:bg-[#8c9962]/10"
        >
          <Settings2 className="h-3 w-3" />
          Phases & manches
        </Link>
        {canStart && (
          <button
            className="rounded-lg border px-3 py-1.5 text-xs hover:bg-[#8c9962]/10"
            onClick={handleStart}
            type="button"
            disabled={loading}
          >
            {loading ? "..." : "Lancer"}
          </button>
        )}
        {canFinish && (
          <button
            className="rounded-lg border px-3 py-1.5 text-xs hover:bg-[#8c9962]/10"
            onClick={handleFinish}
            type="button"
            disabled={loading}
          >
            {loading ? "..." : "Terminer"}
          </button>
        )}
        {canEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs hover:bg-[#8c9962]/10"
          >
            <Pencil className="h-3 w-3" />
            Modifier
          </button>
        )}
        {canDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-3 w-3" />
            Supprimer
          </button>
        )}
      </div>
    </div>
  );
}
