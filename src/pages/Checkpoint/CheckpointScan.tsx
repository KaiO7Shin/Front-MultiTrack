import { useEffect, useMemo, useState } from "react";
import type { Course, CourseType, ParticipantProjection } from "@/lib/type";
import { formatParticipantName, formatTimeShort, captureClientTimestamp } from "@/lib/utils";
import { durationMs, formatMs } from "@/lib/raceRanking";
import { fetchCoursesDetailed } from "@/services/courses";
import { fetchControlPointsByCourse } from "@/services/controlPoints";
import {
  fetchCheckpointEligibleParticipants,
  fetchManchesByPhase,
  fetchPhasesByCourse,
  recordArriveDH,
  recordArriveXC,
  recordDepart,
} from "@/services/raceStructure";
import type { CheckpointMancheMode } from "@/lib/raceRanking";
import { ParticipantAutocomplete } from "@/components/ParticipantAutocomplete";
import { TrailCheckpointForm } from "./TrailCheckpointForm";
import { DhStopwatch, type DhStopwatchStatus } from "./DhStopwatch";
import { ROLE_CHECKPOINT, useAuth } from "@/lib/auth";
import type { ControlPointConfig } from "@/lib/type";

type DHMode = "depart" | "arrivee";

export const CheckpointScan = () => {
  const { user } = useAuth();
  const isCollaborateur = user?.role === ROLE_CHECKPOINT;
  const assignedCourseId = user?.assignedControlPoint?.courseId ?? null;

  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState<number | "">("");
  const [phaseId, setPhaseId] = useState<number | "">("");
  const [mancheId, setMancheId] = useState<number | "">("");
  const [dhMode, setDhMode] = useState<DHMode>("depart");
  const [controlPoints, setControlPoints] = useState<ControlPointConfig[]>([]);

  const [phases, setPhases] = useState<{ id: number; label: string }[]>([]);
  const [manches, setManches] = useState<{ id: number; label: string }[]>([]);
  const [participants, setParticipants] = useState<ParticipantProjection[]>([]);
  const [selected, setSelected] = useState<ParticipantProjection | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [stopwatchStatus, setStopwatchStatus] = useState<DhStopwatchStatus>("idle");
  const [stopwatchStartedAt, setStopwatchStartedAt] = useState<number | null>(null);
  const [stopwatchFrozenMs, setStopwatchFrozenMs] = useState(0);

  function resetStopwatch() {
    setStopwatchStatus("idle");
    setStopwatchStartedAt(null);
    setStopwatchFrozenMs(0);
  }

  const visibleCourses = useMemo(() => {
    if (isCollaborateur && assignedCourseId) {
      return courses.filter((c) => c.id === assignedCourseId);
    }
    return courses;
  }, [courses, isCollaborateur, assignedCourseId]);

  const selectedCourse = useMemo(
    () => courses.find((c) => c.id === courseId),
    [courses, courseId]
  );
  const courseType: CourseType | null = selectedCourse?.type ?? null;

  const checkpointMode: CheckpointMancheMode | null = useMemo(() => {
    if (courseType === "DH") return dhMode === "depart" ? "dh-depart" : "dh-arrivee";
    if (courseType === "XC") return "xc-arrivee";
    return null;
  }, [courseType, dhMode]);

  useEffect(() => {
    fetchCoursesDetailed().then(setCourses).catch(() => setCourses([]));
  }, []);

  useEffect(() => {
    if (isCollaborateur && assignedCourseId) {
      setCourseId(assignedCourseId);
    }
  }, [isCollaborateur, assignedCourseId]);

  useEffect(() => {
    if (!courseId || courseType !== "TRAIL") {
      setControlPoints([]);
      return;
    }
    fetchControlPointsByCourse(Number(courseId))
      .then(setControlPoints)
      .catch(() => setControlPoints([]));
  }, [courseId, courseType]);

  useEffect(() => {
    if (!courseId) {
      setPhases([]);
      setPhaseId("");
      return;
    }
    fetchPhasesByCourse(Number(courseId))
      .then((list) => {
        setPhases(list);
        setPhaseId(list[0]?.id ?? "");
      })
      .catch(() => {
        setPhases([]);
        setPhaseId("");
      });
  }, [courseId]);

  useEffect(() => {
    if (!phaseId) {
      setManches([]);
      setMancheId("");
      return;
    }
    fetchManchesByPhase(Number(phaseId))
      .then((list) => {
        setManches(list);
        setMancheId(list[0]?.id ?? "");
      })
      .catch(() => {
        setManches([]);
        setMancheId("");
      });
  }, [phaseId]);

  useEffect(() => {
    if (!courseId || courseType === "TRAIL" || !phaseId || !mancheId || !checkpointMode) {
      setParticipants([]);
      setSelected(null);
      return;
    }
    fetchCheckpointEligibleParticipants(
      Number(courseId),
      Number(phaseId),
      Number(mancheId),
      checkpointMode
    )
      .then((list) => {
        setParticipants(list);
        setSelected((prev) =>
          prev && list.some((p) => p.id === prev.id) ? prev : null
        );
      })
      .catch(() => {
        setParticipants([]);
        setSelected(null);
      });
  }, [courseId, courseType, phaseId, mancheId, checkpointMode]);

  useEffect(() => {
    resetStopwatch();
  }, [courseId, phaseId, mancheId]);

  function resetMessages() {
    setError(null);
    setSuccess(null);
  }

  async function handleBikeAction() {
    if (!selected || !mancheId) return;
    const recordedAt = captureClientTimestamp();
    const chronoSnapshot =
      courseType === "DH" && dhMode === "arrivee" && stopwatchStartedAt != null
        ? Date.now() - stopwatchStartedAt
        : null;
    const departChronoStart =
      courseType === "DH" && dhMode === "depart" ? Date.now() : null;
    resetMessages();
    setBusy(true);
    try {
      let result;
      if (courseType === "DH") {
        result =
          dhMode === "depart"
            ? await recordDepart(selected.id, Number(mancheId), recordedAt)
            : await recordArriveDH(selected.id, Number(mancheId), recordedAt);
      } else if (courseType === "XC") {
        result = await recordArriveXC(selected.id, Number(mancheId));
      } else {
        return;
      }

      let label: string;
      if (courseType === "DH" && dhMode === "depart") {
        label = `Départ enregistré à ${formatTimeShort(result.tempsDepart)}`;
      } else if (courseType === "DH" && dhMode === "arrivee") {
        const elapsedLabel = formatMs(
          durationMs(result.tempsDepart, result.tempsArrive)
        );
        label = elapsedLabel
          ? `Arrivée à ${formatTimeShort(result.tempsArrive)} — Temps : ${elapsedLabel}`
          : `Arrivée enregistrée à ${formatTimeShort(result.tempsArrive)}`;
      } else {
        label = `Arrivée enregistrée à ${formatTimeShort(result.tempsArrive)}`;
      }

      setSuccess(
        `${formatParticipantName(selected.prenom, selected.nom)} (dossard ${selected.numDossard}) — ${label}`
      );

      if (courseType === "DH") {
        if (dhMode === "depart" && departChronoStart != null) {
          setStopwatchStatus("running");
          setStopwatchStartedAt(departChronoStart);
          setStopwatchFrozenMs(0);
        } else if (dhMode === "arrivee") {
          setStopwatchStatus("stopped");
          setStopwatchFrozenMs(chronoSnapshot ?? 0);
        }
      }

      setSelected(null);
      if (courseId && phaseId && mancheId && checkpointMode) {
        const list = await fetchCheckpointEligibleParticipants(
          Number(courseId),
          Number(phaseId),
          Number(mancheId),
          checkpointMode
        );
        setParticipants(list);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message ?? "Erreur lors de l'enregistrement");
    } finally {
      setBusy(false);
    }
  }

  const needsPhaseManche = courseType === "DH" || courseType === "XC";
  const canSubmitBike =
    !!selected &&
    !!mancheId &&
    !busy &&
    (courseType === "XC" || (courseType === "DH" && dhMode));

  return (
    <section className="space-y-4 w-full max-w-xl mx-auto min-w-0 px-0 sm:px-0">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Checkpoint</h1>
        <p className="text-sm text-slate-500 mt-1">
          Pointage selon le type de course
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-600">Course</label>
          <select
            className="w-full rounded-lg border px-3 py-2 text-sm"
            value={courseId === "" ? "" : String(courseId)}
            onChange={(e) => {
              const v = e.target.value;
              setCourseId(v ? Number(v) : "");
              resetMessages();
            }}
            disabled={isCollaborateur && !!assignedCourseId}
          >
            <option value="">Sélectionner une course…</option>
            {visibleCourses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.type})
              </option>
            ))}
          </select>
        </div>

        {needsPhaseManche && courseId && (
          <>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Phase</label>
              <select
                className="w-full rounded-lg border px-3 py-2 text-sm"
                value={phaseId === "" ? "" : String(phaseId)}
                onChange={(e) => {
                  const v = e.target.value;
                  setPhaseId(v ? Number(v) : "");
                  resetMessages();
                }}
                disabled={phases.length === 0}
              >
                <option value="">
                  {phases.length === 0
                    ? "Aucune phase — configurez dans la course"
                    : "Sélectionner une phase…"}
                </option>
                {phases.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">
                Manche
                {phaseId && manches.length > 0 && (
                  <span className="font-normal text-slate-400 ml-1">
                    (de la phase sélectionnée)
                  </span>
                )}
              </label>
              <select
                className="w-full rounded-lg border px-3 py-2 text-sm"
                value={mancheId === "" ? "" : String(mancheId)}
                onChange={(e) => {
                  const v = e.target.value;
                  setMancheId(v ? Number(v) : "");
                  resetMessages();
                }}
                disabled={manches.length === 0}
              >
                <option value="">
                  {manches.length === 0
                    ? "Aucune manche — configurez dans la course"
                    : "Sélectionner une manche…"}
                </option>
                {manches.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        {courseType && (
          <span className="inline-flex rounded-full border px-2 py-0.5 text-xs text-slate-600">
            Mode {courseType}
            {courseType === "TRAIL" && controlPoints.length > 0 && (
              <span className="ml-1 text-slate-400">
                · {controlPoints.length} PC
              </span>
            )}
          </span>
        )}
      </div>

      {courseType === "TRAIL" && courseId && (
        <TrailCheckpointForm
          courseId={Number(courseId)}
          controlPoints={controlPoints}
        />
      )}

      {!courseId && (
        <div className="text-center text-sm text-slate-500 py-8 bg-white border rounded-2xl">
          Choisissez une course pour commencer le pointage.
        </div>
      )}

      {courseType === "DH" && courseId && (
        <div className="space-y-4">
          <div className="flex rounded-xl border p-1 bg-slate-50">
            <button
              type="button"
              onClick={() => {
                setDhMode("depart");
                resetMessages();
                if (stopwatchStatus === "stopped") {
                  resetStopwatch();
                }
              }}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                dhMode === "depart"
                  ? "bg-white shadow text-slate-900"
                  : "text-slate-500"
              }`}
            >
              Départ
            </button>
            <button
              type="button"
              onClick={() => {
                setDhMode("arrivee");
                resetMessages();
              }}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                dhMode === "arrivee"
                  ? "bg-white shadow text-slate-900"
                  : "text-slate-500"
              }`}
            >
              Arrivée
            </button>
          </div>

          <DhStopwatch
            status={stopwatchStatus}
            startedAt={stopwatchStartedAt}
            frozenMs={stopwatchFrozenMs}
          />

          <div className="bg-white border rounded-2xl p-4 sm:p-6 space-y-4">
            <label className="text-sm text-slate-600">Participant</label>
            <ParticipantAutocomplete
              participants={participants}
              value={selected}
              onChange={(p) => {
                setSelected(p);
                resetMessages();
              }}
              disabled={busy || !mancheId}
            />

            {error && (
              <div className="text-sm rounded-xl bg-red-50 text-red-700 px-3 py-2 border border-red-200">
                {error}
              </div>
            )}
            {success && (
              <div className="text-sm rounded-xl bg-green-50 text-green-700 px-3 py-2 border border-green-200">
                {success}
              </div>
            )}

            <button
              type="button"
              disabled={!canSubmitBike}
              onClick={handleBikeAction}
              className="w-full rounded-2xl bg-slate-900 text-white px-4 py-3 text-base disabled:opacity-50"
            >
              {busy
                ? "Enregistrement…"
                : dhMode === "depart"
                  ? "Démarrer"
                  : "Terminer"}
            </button>
          </div>
        </div>
      )}

      {courseType === "XC" && courseId && (
        <div className="bg-white border rounded-2xl p-4 sm:p-6 space-y-4">
          <div className="text-sm font-medium text-slate-700">Arrivée manche</div>
          <label className="text-sm text-slate-600">Participant</label>
          <ParticipantAutocomplete
            participants={participants}
            value={selected}
            onChange={(p) => {
              setSelected(p);
              resetMessages();
            }}
            disabled={busy || !mancheId}
          />

          {error && (
            <div className="text-sm rounded-xl bg-red-50 text-red-700 px-3 py-2 border border-red-200">
              {error}
            </div>
          )}
          {success && (
            <div className="text-sm rounded-xl bg-green-50 text-green-700 px-3 py-2 border border-green-200">
              {success}
            </div>
          )}

          <button
            type="button"
            disabled={!canSubmitBike}
            onClick={handleBikeAction}
            className="w-full rounded-2xl bg-slate-900 text-white px-4 py-3 text-base disabled:opacity-50"
          >
            {busy ? "Enregistrement…" : "Enregistrer l'arrivée"}
          </button>
        </div>
      )}
    </section>
  );
};
