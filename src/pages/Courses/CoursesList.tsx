import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../lib/api"; // axios instance

const ACCENT = "#8c9962";

/* ========= UI type unifié ========= */
type CourseStatus = "Brouillon" | "Prête" | "En cours" | "Terminée";

type UICourse = {
  id: number;
  name: string;
  distanceKm?: number;
  elevation?: number;
  startAt?: string; // ISO
  status: CourseStatus;
  checkpoints: number;
  cutoffMinutes?: number;
  description?: string;
};

/* ========= Helpers de normalisation =========
   S'adapte aux réponses: array direct, {data:[...]}, {races:[...]}, etc.
   Gère les clés: name/label, distanceKm/distance_km, elevation/elevation_gain,
   startAt/start_at, checkpoints/checkpoints_count, status/code/status_label, etc.
*/
function coerceArray<T = unknown>(payload: any): T[] {
  if (Array.isArray(payload)) return payload;
  if (payload?.data && Array.isArray(payload.data)) return payload.data;
  if (payload?.races && Array.isArray(payload.races)) return payload.races;
  if (payload?.items && Array.isArray(payload.items)) return payload.items;
  return [];
}

function normalizeCourse(raw: any): UICourse {
  const id = Number(
    raw?.id ??
      raw?.course_id ??
      raw?.race_id ??
      Math.floor(Math.random() * 100000)
  );

  // Nom: accepte name, label, title
  const name: string =
    raw?.name ?? raw?.label ?? raw?.title ?? `Course #${id}`;

  // Distance (km): distanceKm, distance_km, distance
  const distanceKm = numOrUndef(
    raw?.distanceKm ?? raw?.distance_km ?? raw?.distance
  );

  // D+ : elevation, elevation_gain, ascent
  const elevation = numOrUndef(
    raw?.elevation ?? raw?.elevation_gain ?? raw?.ascent
  );

  // Start: startAt, start_at, start_time
  const startAt: string | undefined =
    raw?.startAt ?? raw?.start_at ?? raw?.start_time ?? undefined;

  // Checkpoints: checkpoints, checkpoints_count, cps
  const checkpoints = intOrZero(
    raw?.checkpoints ?? raw?.checkpoints_count ?? raw?.cps
  );

  // Cutoff: cutoffMinutes, cutoff_minutes, barrier_minutes
  const cutoffMinutes = numOrUndef(
    raw?.cutoffMinutes ?? raw?.cutoff_minutes ?? raw?.barrier_minutes
  );

  // Description
  const description: string | undefined =
    raw?.description ?? raw?.desc ?? undefined;

  // Status: accepte plusieurs variantes puis map vers les 4 états UI
  const statusRaw: string =
    (raw?.status_label ??
      raw?.status ??
      raw?.state ??
      raw?.code ??
      "Brouillon") as string;

  const status: CourseStatus = toUiStatus(statusRaw);

  return {
    id,
    name,
    distanceKm,
    elevation,
    startAt,
    status,
    checkpoints,
    cutoffMinutes,
    description,
  };
}

function toUiStatus(s: string): CourseStatus {
  const val = String(s).toLowerCase();
  if (["ready", "prête", "prete", "ready_to_start"].includes(val)) return "Prête";
  if (["running", "en cours", "in_progress", "started"].includes(val))
    return "En cours";
  if (["done", "finished", "terminée", "terminee"].includes(val))
    return "Terminée";
  return "Brouillon";
}

function numOrUndef(v: any): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}
function intOrZero(v: any): number {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : 0;
}

/* ========= Composant principal ========= */
export const CoursesList = () => {
  const [courses, setCourses] = useState<UICourse[]>([]);
  const [openNew, setOpenNew] = useState(false);

  const counts = useMemo(() => {
    const total = courses.length;
    const ready = courses.filter((c) => c.status === "Prête").length;
    const running = courses.filter((c) => c.status === "En cours").length;
    return { total, ready, running };
  }, [courses]);

  useEffect(() => {
    let mounted = true;

    async function fetchCourses() {
      try {
        // Exemple d'endpoint: "/races" (adapter si nécessaire)
        const res = await api.get("/races");
        const arr = coerceArray(res?.data);
        const mapped = arr.map(normalizeCourse);
        if (!mounted) return;
        setCourses(mapped);
      } catch (err) {
        console.error("Failed to load courses", err);
      }
    }

    fetchCourses();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Courses</h1>
          <p className="text-sm text-slate-500">
            Gère les courses, leurs checkpoints et horaires
          </p>
        </div>
        <button
          onClick={() => setOpenNew(true)}
          className="rounded-xl bg-slate-900 text-white px-4 py-2 text-sm hover:opacity-90"
        >
          + Nouvelle course
        </button>
      </div>

      {/* Stats rapides */}
      <div className="grid gap-3 sm:grid-cols-3">
        <StatPill label="Total" value={counts.total} />
        <StatPill label="Prêtes" value={counts.ready} />
        <StatPill label="En cours" value={counts.running} />
      </div>

      {/* Liste / État vide */}
      {courses.length === 0 ? (
        <EmptyState onCreate={() => setOpenNew(true)} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {courses.map((c) => (
            <CourseCard
              key={c.id}
              course={c}
              onLocalUpdate={(upd) => {
                setCourses((prev) =>
                  prev.map((x) => (x.id === c.id ? { ...x, ...upd } : x))
                );
              }}
            />
          ))}
        </div>
      )}

      {/* Modal Nouvelle course */}
      {openNew && (
        <NewCourseModal
          onClose={() => setOpenNew(false)}
          onCreate={(payload) => {
            // Exemple local (remplacer par POST API si besoin)
            const tmp: UICourse = {
              id: Math.floor(Math.random() * 100000),
              name: payload.name,
              distanceKm: Number(payload.distanceKm ?? 0) || undefined,
              elevation: payload.elevation
                ? Number(payload.elevation)
                : undefined,
              startAt: payload.startAt || undefined,
              status: "Brouillon",
              checkpoints: Number(payload.checkpoints ?? 0),
              cutoffMinutes: payload.cutoffMinutes
                ? Number(payload.cutoffMinutes)
                : undefined,
              description: payload.description || undefined,
            };
            setCourses((arr) => [tmp, ...arr]);
            setOpenNew(false);
          }}
        />
      )}
    </section>
  );
};

/* ---------- UI sub components ---------- */

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

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center">
      <div
        className="mx-auto h-24 w-24 rounded-2xl mb-3"
        style={{ background: `linear-gradient(135deg, #f4f6ef, #e0e7db)` }}
      />
      <h3 className="text-base font-medium">Aucune course pour l’instant</h3>
      <p className="text-sm text-slate-500 mt-1">
        Crée ta première course et configure ses checkpoints.
      </p>
      <button
        onClick={onCreate}
        className="mt-4 rounded-xl border px-4 py-2 text-sm hover:bg-[#8c9962]/10"
      >
        + Nouvelle course
      </button>
    </div>
  );
}

function CourseCard({
  course,
  onLocalUpdate,
}: {
  course: UICourse;
  onLocalUpdate: (upd: Partial<UICourse>) => void;
}) {

  function showConfirmationDialog(message: string): Promise<boolean> {
    return new Promise((resolve) => {
      const confirmed = window.confirm(message);
      resolve(confirmed);
    });
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <Link
            to={`/courses/${course.id}`}
            className="text-base font-semibold hover:underline decoration-[#8c9962] underline-offset-4"
          >
            {course.name}
          </Link>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">

        <div className="flex gap-2">
          {course.status !== "En cours" && course.status !== "Terminée" && (
            <button
              className="rounded-lg border px-3 py-1.5 text-sm hover:bg-[#8c9962]/10"
              onClick={async () => {
                // await api.post(`/races/${course.id}/start`);
                onLocalUpdate({
                  status: "En cours",
                  startAt: new Date().toISOString(),
                });
              }}
            >
              Lancer
            </button>
          )}
          {course.status === "En cours" && (
            <button
              className="rounded-lg border px-3 py-1.5 text-sm hover:bg-[#8c9962]/10"
              onClick={async () => {
              const confirmed = await showConfirmationDialog(
                `Terminer la course "${course.name}" ? Cette action est irréversible.`
              );
              if (!confirmed) return;
              // await api.post(`/races/${course.id}/finish`);
              onLocalUpdate({ status: "Terminée" });
              }}
              type="button"
              aria-label={`Terminer la course ${course.name}`}
            >
              Terminer
            </button>
          )}
          <Link
            to={`/courses/${course.id}`}
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-[#8c9962]/10"
          >
            Détails
          </Link>
        </div>
      </div>
    </div>
  );
}

function NewCourseModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (payload: {
    name: string;
    distanceKm?: string;
    elevation?: string;
    startAt?: string;
    checkpoints?: string;
    cutoffMinutes?: string;
    description?: string;
  }) => void;
}) {
  const [loading, setLoading] = useState(false);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries()) as any;
    setLoading(true);
    try {
      onCreate(payload);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 p-6 space-y-4"
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="text-lg font-semibold">Nouvelle course</div>
            <div className="text-xs text-slate-500">
              Renseigne les infos minimales, tu pourras éditer plus tard.
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border px-3 py-1.5 hover:bg-[#8c9962]/10"
          >
            Fermer
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nom de la course" required>
            <input
              name="name"
              required
              className="w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#8c9962]/30"
              placeholder="Trail Tafaray 12K"
            />
          </Field>

          <Field label="Distance (km)">
            <input
              name="distanceKm"
              type="number"
              min={0}
              step="0.1"
              className="w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#8c9962]/30"
              placeholder="12"
            />
          </Field>

          <Field label="Dénivelé + (m)">
            <input
              name="elevation"
              type="number"
              min={0}
              step="1"
              className="w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#8c9962]/30"
              placeholder="450"
            />
          </Field>

          <Field label="Heure de départ">
            <input
              name="startAt"
              type="datetime-local"
              className="w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#8c9962]/30"
            />
          </Field>

          <Field label="Nombre de checkpoints">
            <input
              name="checkpoints"
              type="number"
              min={0}
              step={1}
              className="w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#8c9962]/30"
              placeholder="4"
            />
          </Field>

          <Field label="Barrière horaire (minutes)">
          <input
              name="cutoffMinutes"
              type="number"
              min={0}
              step={1}
              className="w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#8c9962]/30"
              placeholder="180"
            />
          </Field>

          <Field label="Description" full>
            <textarea
              name="description"
              rows={3}
              className="w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#8c9962]/30"
              placeholder="Infos parcours, recommandations…"
            />
          </Field>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border px-4 py-2 text-sm hover:bg-[#8c9962]/10"
          >
            Annuler
          </button>
          <button
            className="rounded-xl bg-slate-900 text-white px-4 py-2 text-sm disabled:opacity-60 flex items-center gap-2"
            disabled={loading}
          >
            {loading && (
              <span className="inline-block h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full" />
            )}
            Créer la course
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  children,
  required,
  full,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  full?: boolean;
}) {
  return (
    <label className={`space-y-1 ${full ? "sm:col-span-2" : ""}`}>
      <span className="text-sm text-slate-600">
        {label} {required && <span className="text-red-600">*</span>}
      </span>
      {children}
    </label>
  );
}