import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../lib/api"; // axios instance

const ACCENT = "#8c9962";

/* ========= Types ========= */

type CourseStatus = "A venir" | "En cours" | "Terminée";

type UICourse = {
  id: number;
  name: string;
  distanceKm?: number;
  elevation?: number;
  startAt?: string; // ISO
  status: CourseStatus | string; // on tolère la valeur brute API puis on normalise
  checkpoints: number;
  cutoffMinutes?: number;
  description?: string;
};

/* ========= Helpers ========= */

function coerceArray<T = unknown>(payload: any): T[] {
  if (Array.isArray(payload)) return payload;
  if (payload?.data && Array.isArray(payload.data)) return payload.data;
  if (payload?.races && Array.isArray(payload.races)) return payload.races;
  if (payload?.items && Array.isArray(payload.items)) return payload.items;
  return [];
}

function numOrUndef(v: any): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}
function intOrZero(v: any): number {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : 0;
}

/** Normalise strictement vers : "A venir" | "En cours" | "Terminée" */
function normalizeStatus(v: any): CourseStatus {
  const lower = String(v ?? "").trim().toLowerCase().replace(/\s+/g, " ");
  if (lower === "a venir" || lower === "à venir") return "A venir";
  if (lower === "en cours") return "En cours";
  if (lower === "terminee" || lower === "terminée") return "Terminée";
  return "A venir";
}

function normalizeCourse(raw: any): UICourse {
  const id = Number(
    raw?.id ?? raw?.course_id ?? raw?.race_id ?? Math.floor(Math.random() * 100000)
  );

  const name: string = raw?.name ?? raw?.label ?? raw?.title ?? `Course #${id}`;

  const distanceKm = numOrUndef(raw?.distanceKm ?? raw?.distance_km ?? raw?.distance);
  const elevation = numOrUndef(raw?.elevation ?? raw?.elevation_gain ?? raw?.ascent);
  const startAt: string | undefined =
    raw?.startAt ?? raw?.start_at ?? raw?.start_time ?? raw?.start_date_time;

  const checkpoints = intOrZero(raw?.checkpoints ?? raw?.checkpoints_count ?? raw?.cps);
  const cutoffMinutes = numOrUndef(raw?.cutoffMinutes ?? raw?.cutoff_minutes ?? raw?.barrier_minutes);
  const description: string | undefined = raw?.description ?? raw?.desc;

  const status = normalizeStatus(raw?.status ?? raw?.status_label ?? raw?.code ?? raw?.state);

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

/* ========= API client (nouvel endpoint) ========= */

async function updateRaceStatus(raceId: number, newStatus: CourseStatus) {
  // POST /race/change/status
  // body: { race_id, new_status }
  // return: { race_id, start_date_time, status }
  const res = await api.post("/race/change/status", {
    race_id: raceId,
    new_status: newStatus,
  });
  const data = res?.data ?? {};
  return {
    raceId: Number(data?.race_id ?? raceId),
    startAt: data?.start_date_time as string | undefined,
    status: normalizeStatus(data?.status ?? newStatus),
  };
}

/* ========= Composant principal ========= */

export const CoursesList = () => {
  const [courses, setCourses] = useState<UICourse[]>([]);

  const counts = useMemo(() => {
    const total = courses.length;
    const upcoming = courses.filter((c) => normalizeStatus(c.status) === "A venir").length;
    const running = courses.filter((c) => normalizeStatus(c.status) === "En cours").length;
    const done = courses.filter((c) => normalizeStatus(c.status) === "Terminée").length;
    return { total, upcoming, running, done };
  }, [courses]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // liste: si ton endpoint a changé, adapte ici
        const res = await api.get("/races");
        const arr = coerceArray(res?.data);
        const mapped = arr.map(normalizeCourse);
        if (!mounted) return;
        setCourses(mapped);
      } catch (err) {
        console.error("Failed to load courses", err);
      }
    })();
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
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-4">
        <StatPill label="Total" value={counts.total} />
        <StatPill label="A venir" value={counts.upcoming} />
        <StatPill label="En cours" value={counts.running} />
        <StatPill label="Terminées" value={counts.done} />
      </div>

      
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {courses.map((c) => (
          <CourseCard
            key={c.id}
            course={c}
            onLocalUpdate={(upd) => {
              setCourses((prev) => prev.map((x) => (x.id === c.id ? { ...x, ...upd } : x)));
            }}
            onRefresh={async () => {
              try {
                const res = await api.get("/races");
                setCourses(coerceArray(res?.data).map(normalizeCourse));
              } catch (e) {
                console.error(e);
              }
            }}
          />
        ))}
      </div>

      
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


function CourseCard({
  course,
  onLocalUpdate,
  onRefresh,
}: {
  course: UICourse;
  onLocalUpdate: (upd: Partial<UICourse>) => void;
  onRefresh: () => Promise<void>;
}) {
  const status = normalizeStatus(course.status);

  function confirm(message: string): Promise<boolean> {
    return Promise.resolve(window.confirm(message));
  }

  const canStart = status === "A venir";
  const canFinish = status === "En cours";

  async function handleStart() {
    try {
      // new_status = "En cours"
      const res = await updateRaceStatus(course.id, "En cours");
      onLocalUpdate({
        status: res.status,
        startAt: res.startAt || course.startAt,
      });
      await onRefresh();
    } catch (e) {
      console.error(e);
    }
  }

  async function handleFinish() {
    if (!(await confirm(`Terminer la course "${course.name}" ? Action irréversible.`))) return;
    try {
      // new_status = "Terminée"
      const res = await updateRaceStatus(course.id, "Terminée");
      onLocalUpdate({
        status: res.status,
        startAt: res.startAt || course.startAt,
      });
      await onRefresh();
    } catch (e) {
      console.error(e);
    }
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
          <div className="text-xs text-slate-500 mt-0.5">
            {status}
            {course.distanceKm ? ` • ${course.distanceKm} km` : ""}
            {course.elevation ? ` • D+ ${course.elevation} m` : ""}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex gap-2">
          {canStart && (
            <button
              className="rounded-lg border px-3 py-1.5 text-sm hover:bg-[#8c9962]/10"
              onClick={handleStart}
              type="button"
              aria-label={`Lancer la course ${course.name}`}
            >
              Lancer
            </button>
          )}
          {canFinish && (
            <button
              className="rounded-lg border px-3 py-1.5 text-sm hover:bg-[#8c9962]/10"
              onClick={handleFinish}
              type="button"
              aria-label={`Terminer la course ${course.name}`}
            >
              Terminer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
