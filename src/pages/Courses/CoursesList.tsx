import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
// import api from "../../lib/api"; // <- axios instance si tu veux brancher

const ACCENT = "#8c9962";

type Course = {
  id: number;
  name: string;
  distanceKm: number;
  elevation?: number;
  startAt?: string; // ISO
  status: "Brouillon" | "Prête" | "En cours" | "Terminée";
  checkpoints: number;
};

export const CoursesList = () => {
  // MOCK: remplace par tes données API
  const [courses, setCourses] = useState<Course[]>([]);
  const [openNew, setOpenNew] = useState(false);

  const counts = useMemo(() => {
    const total = courses.length;
    const running = courses.filter(c => c.status === "En cours").length;
    const ready = courses.filter(c => c.status === "Prête").length;
    return { total, running, ready };
  }, [courses]);

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
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((c) => (
            <CourseCard key={c.id} course={c} onLocalUpdate={(upd) => {
              setCourses(prev => prev.map(x => x.id === c.id ? { ...x, ...upd } : x));
            }} />
          ))}
        </div>
      )}

      {/* Modal Nouvelle course */}
      {openNew && (
        <NewCourseModal
          onClose={() => setOpenNew(false)}
          onCreate={(payload) => {
            // TODO: appeler ton API
            // const { data } = await api.post<Course>("/api/courses", payload);
            const tmp: Course = {
              id: Math.floor(Math.random() * 100000),
              name: payload.name,
              distanceKm: Number(payload.distanceKm ?? 0),
              elevation: payload.elevation ? Number(payload.elevation) : undefined,
              startAt: payload.startAt || undefined,
              status: "Brouillon",
              checkpoints: Number(payload.checkpoints ?? 0),
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

function StatusBadge({ status }: { status: Course["status"] }) {
  const map = {
    Brouillon: { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200" },
    "Prête": { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
    "En cours": { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
    "Terminée": { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-300" },
  } as const;
  const c = map[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs border ${c.bg} ${c.text} ${c.border}`}>
      {status}
    </span>
  );
}

function CourseCard({
  course,
  onLocalUpdate,
}: {
  course: Course;
  onLocalUpdate: (upd: Partial<Course>) => void;
}) {
  const startAt = course.startAt ? new Date(course.startAt) : null;

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
          <div className="text-xs text-slate-500">
            {course.distanceKm} km{course.elevation ? ` · D+ ${course.elevation} m` : ""} ·{" "}
            {course.checkpoints} PC
          </div>
        </div>
        <StatusBadge status={course.status} />
      </div>

      <div
        className="h-24 w-full rounded-xl"
        style={{
          background: `linear-gradient(135deg, #f1f5f9, #e2e8f0)`,
        }}
        aria-hidden="true"
      />

      <div className="flex items-center justify-between text-sm">
        <div className="text-slate-600">
          {startAt ? (
            <>
              Départ:&nbsp;
              <span className="font-medium">
                {startAt.toLocaleDateString()} {startAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </>
          ) : (
            <span className="text-slate-500">Heure de départ non définie</span>
          )}
        </div>

        <div className="flex gap-2">
          {course.status !== "En cours" && course.status !== "Terminée" && (
            <button
              className="rounded-lg border px-3 py-1.5 text-sm hover:bg-[#8c9962]/10"
              onClick={async () => {
                // TODO: await api.post(`/api/courses/${course.id}/start`)
                onLocalUpdate({ status: "En cours", startAt: new Date().toISOString() });
              }}
            >
              Lancer
            </button>
          )}
          {course.status === "En cours" && (
            <button
              className="rounded-lg border px-3 py-1.5 text-sm hover:bg-[#8c9962]/10"
              onClick={async () => {
                // TODO: await api.post(`/api/courses/${course.id}/finish`)
                onLocalUpdate({ status: "Terminée" });
              }}
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
            <div className="text-xs text-slate-500">Renseigne les infos minimales, tu pourras éditer plus tard.</div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg border px-3 py-1.5 hover:bg-[#8c9962]/10">
            Fermer
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nom de la course" required>
            <input name="name" required className="w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#8c9962]/30" placeholder="Trail Tafaray 12K" />
          </Field>

          <Field label="Distance (km)">
            <input name="distanceKm" type="number" min={0} step="0.1" className="w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#8c9962]/30" placeholder="12" />
          </Field>

          <Field label="Dénivelé + (m)">
            <input name="elevation" type="number" min={0} step="1" className="w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#8c9962]/30" placeholder="450" />
          </Field>

          <Field label="Heure de départ">
            <input name="startAt" type="datetime-local" className="w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#8c9962]/30" />
          </Field>

          <Field label="Nombre de checkpoints">
            <input name="checkpoints" type="number" min={0} step="1" className="w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#8c9962]/30" placeholder="4" />
          </Field>

          <Field label="Barrière horaire (minutes)">
            <input name="cutoffMinutes" type="number" min={0} step="1" className="w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#8c9962]/30" placeholder="180" />
          </Field>

          <Field label="Description" full>
            <textarea name="description" rows={3} className="w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#8c9962]/30" placeholder="Infos parcours, recommandations…" />
          </Field>
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-xl border px-4 py-2 text-sm hover:bg-[#8c9962]/10">
            Annuler
          </button>
          <button
            className="rounded-xl bg-slate-900 text-white px-4 py-2 text-sm disabled:opacity-60 flex items-center gap-2"
            disabled={loading}
          >
            {loading && <span className="inline-block h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full" />}
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
