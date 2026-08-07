import { useCallback, useEffect, useMemo, useState } from "react";
import type { Course, CourseType, ParticipantProjection } from "@/lib/type";
import {
  captureClientTimestamp,
  formatParticipantName,
  formatTimeShort,
  usesPhaseMancheStructure,
  usesStartStopTiming,
} from "@/lib/utils";
import { durationMs, formatMs } from "@/lib/raceRanking";
import { fetchCoursesDetailed } from "@/services/courses";
import { fetchControlPointsByCourse } from "@/services/controlPoints";
import {
  fetchCheckpointEligibleParticipants,
  fetchManchesByPhase,
  fetchPhasesByCourse,
  fetchResultatsByManche,
  recordArriveDH,
  recordArriveXC,
  recordDepart,
  cancelResultatManche,
} from "@/services/raceStructure";
import { ParticipantAutocomplete } from "@/components/ParticipantAutocomplete";
import { TrailCheckpointForm } from "./TrailCheckpointForm";
import { MancheTimer, type MancheTimerStatus } from "./MancheTimer";
import { ROLE_CHECKPOINT, useAuth } from "@/lib/auth";
import type { ControlPointConfig } from "@/lib/type";
import { Undo2 } from "lucide-react";

/** Participant éligible, enrichi de son départ déjà enregistré sur la manche. */
type TimedParticipant = ParticipantProjection & { departAt: string | null };

type FinishedRun = {
  participantId: number;
  participantLabel: string;
  elapsedMs: number;
  arriveeAt: string | null;
};

type RecordedPointage = {
  participantId: number;
  participantLabel: string;
};

export const CheckpointScan = () => {
  const { user } = useAuth();
  const isCollaborateur = user?.role === ROLE_CHECKPOINT;
  const operatorId = user?.id;
  const assignedCourseId = user?.assignedControlPoint?.courseId ?? null;
  const assignedManches = useMemo(
    () => user?.assignedManches ?? [],
    [user?.assignedManches]
  );
  const hasMancheAssignments = assignedManches.length > 0;
  const singleAssignedManche =
    isCollaborateur && assignedManches.length === 1
      ? assignedManches[0]
      : null;

  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState<number | "">("");
  const [phaseId, setPhaseId] = useState<number | "">("");
  const [mancheId, setMancheId] = useState<number | "">("");
  const [controlPoints, setControlPoints] = useState<ControlPointConfig[]>([]);

  const [phases, setPhases] = useState<{ id: number; label: string }[]>([]);
  const [manches, setManches] = useState<{ id: number; label: string }[]>([]);
  const [participants, setParticipants] = useState<TimedParticipant[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  /** Départ déclenché depuis cet écran : chrono immédiat sans attendre le refetch. */
  const [localRun, setLocalRun] = useState<{
    participantId: number;
    startedAt: number;
  } | null>(null);
  const [finishedRun, setFinishedRun] = useState<FinishedRun | null>(null);
  const [xcRecorded, setXcRecorded] = useState<RecordedPointage | null>(null);

  const visibleCourses = useMemo(() => {
    if (!isCollaborateur) return courses;
    const allowed = new Set<number>();
    if (assignedCourseId) allowed.add(assignedCourseId);
    for (const m of assignedManches) allowed.add(m.courseId);
    if (allowed.size === 0) return [];
    return courses.filter((c) => allowed.has(c.id));
  }, [courses, isCollaborateur, assignedCourseId, assignedManches]);

  const selectedCourse = useMemo(
    () => courses.find((c) => c.id === courseId),
    [courses, courseId]
  );
  const courseType: CourseType | null = selectedCourse?.type ?? null;
  const isTimedRun = usesStartStopTiming(courseType);
  const needsPhaseManche = usesPhaseMancheStructure(courseType ?? undefined);

  const courseSelectLocked =
    !!singleAssignedManche ||
    (isCollaborateur && visibleCourses.length === 1);
  const phaseMancheLocked = !!singleAssignedManche;

  const selected = useMemo(
    () => participants.find((p) => p.id === selectedId) ?? null,
    [participants, selectedId]
  );

  useEffect(() => {
    fetchCoursesDetailed().then(setCourses).catch(() => setCourses([]));
  }, []);

  useEffect(() => {
    if (!isCollaborateur) return;
    if (singleAssignedManche) {
      setCourseId(singleAssignedManche.courseId);
      setPhaseId(singleAssignedManche.phaseId);
      setMancheId(singleAssignedManche.id);
      return;
    }
    if (assignedCourseId && !hasMancheAssignments) {
      setCourseId(assignedCourseId);
      return;
    }
    if (visibleCourses.length === 1) {
      setCourseId(visibleCourses[0].id);
    }
  }, [
    isCollaborateur,
    singleAssignedManche,
    assignedCourseId,
    hasMancheAssignments,
    visibleCourses,
  ]);

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
    if (!courseId || singleAssignedManche) {
      if (!courseId) {
        setPhases([]);
        setPhaseId("");
      }
      return;
    }
    fetchPhasesByCourse(Number(courseId))
      .then((list) => {
        let filtered = list;
        if (isCollaborateur && hasMancheAssignments) {
          const phaseIds = new Set(
            assignedManches
              .filter((m) => m.courseId === Number(courseId))
              .map((m) => m.phaseId)
          );
          filtered = list.filter((p) => phaseIds.has(p.id));
        }
        setPhases(filtered);
        setPhaseId(filtered[0]?.id ?? "");
      })
      .catch(() => {
        setPhases([]);
        setPhaseId("");
      });
  }, [
    courseId,
    isCollaborateur,
    hasMancheAssignments,
    assignedManches,
    singleAssignedManche,
  ]);

  useEffect(() => {
    if (!phaseId || singleAssignedManche) {
      if (!phaseId && !singleAssignedManche) {
        setManches([]);
        setMancheId("");
      }
      return;
    }
    fetchManchesByPhase(Number(phaseId))
      .then((list) => {
        let filtered = list;
        if (isCollaborateur && hasMancheAssignments) {
          const mancheIds = new Set(
            assignedManches
              .filter((m) => m.phaseId === Number(phaseId))
              .map((m) => m.id)
          );
          filtered = list.filter((m) => mancheIds.has(m.id));
        }
        setManches(filtered);
        setMancheId(filtered[0]?.id ?? "");
      })
      .catch(() => {
        setManches([]);
        setMancheId("");
      });
  }, [
    phaseId,
    isCollaborateur,
    hasMancheAssignments,
    assignedManches,
    singleAssignedManche,
  ]);

  useEffect(() => {
    if (!singleAssignedManche) return;
    setPhases([
      {
        id: singleAssignedManche.phaseId,
        label: singleAssignedManche.phaseLabel,
      },
    ]);
    setManches([
      { id: singleAssignedManche.id, label: singleAssignedManche.label },
    ]);
  }, [singleAssignedManche]);

  const loadParticipants = useCallback(async () => {
    if (!courseId || !phaseId || !mancheId || !courseType || courseType === "TRAIL") {
      setParticipants([]);
      return;
    }
    const cid = Number(courseId);
    const pid = Number(phaseId);
    const mid = Number(mancheId);

    try {
      if (!usesStartStopTiming(courseType)) {
        const list = await fetchCheckpointEligibleParticipants(
          cid,
          pid,
          mid,
          "xc-arrivee"
        );
        setParticipants(list.map((p) => ({ ...p, departAt: null })));
        return;
      }

      const [pending, inRun, resultats] = await Promise.all([
        fetchCheckpointEligibleParticipants(cid, pid, mid, "dh-depart"),
        fetchCheckpointEligibleParticipants(cid, pid, mid, "dh-arrivee"),
        fetchResultatsByManche(mid),
      ]);
      const departByParticipant = new Map(
        resultats.map((r) => [r.participantId, r.tempsDepart])
      );

      // Les partis en piste d'abord : ce sont eux qu'il faut arrêter.
      setParticipants([
        ...inRun.map((p) => ({
          ...p,
          departAt: departByParticipant.get(p.id) ?? null,
        })),
        ...pending.map((p) => ({ ...p, departAt: null })),
      ]);
    } catch {
      setParticipants([]);
    }
  }, [courseId, phaseId, mancheId, courseType]);

  useEffect(() => {
    loadParticipants();
  }, [loadParticipants]);

  useEffect(() => {
    setSelectedId(null);
    setLocalRun(null);
    setFinishedRun(null);
    setXcRecorded(null);
    setError(null);
    setSuccess(null);
  }, [courseId, phaseId, mancheId]);

  function resetMessages() {
    setError(null);
    setSuccess(null);
  }

  function handleSelect(participant: ParticipantProjection | null) {
    setSelectedId(participant?.id ?? null);
    setFinishedRun(null);
    setXcRecorded(null);
    resetMessages();
  }

  const startedAt = useMemo(() => {
    if (!selected) return null;
    if (localRun?.participantId === selected.id) return localRun.startedAt;
    return selected.departAt ? Date.parse(selected.departAt) : null;
  }, [selected, localRun]);

  const timerStatus: MancheTimerStatus = finishedRun
    ? "stopped"
    : startedAt != null
      ? "running"
      : "idle";

  const canStart = !!selected && !!mancheId && startedAt == null && !finishedRun;

  const canCancelTimed =
    !!mancheId &&
    !busy &&
    ((timerStatus === "running" && !!selected) || !!finishedRun);

  const canCancelXc = !!mancheId && !busy && !!xcRecorded;

  const participantLabel = (p: TimedParticipant) =>
    `${formatParticipantName(p.prenom, p.nom)} (dossard ${p.numDossard})`;

  async function handleStart() {
    if (!selected || !mancheId || startedAt != null || operatorId == null) return;
    const recordedAt = captureClientTimestamp();
    const clickedAt = Date.now();
    resetMessages();
    setBusy(true);
    try {
      const result = await recordDepart(
        selected.id,
        Number(mancheId),
        recordedAt,
        operatorId
      );
      setLocalRun({ participantId: selected.id, startedAt: clickedAt });
      setSuccess(
        `${participantLabel(selected)} — Départ à ${formatTimeShort(result.tempsDepart)}`
      );
      await loadParticipants();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message ?? "Erreur lors de l'enregistrement du départ");
    } finally {
      setBusy(false);
    }
  }

  async function handleStop() {
    if (!selected || !mancheId || operatorId == null) return;
    const recordedAt = captureClientTimestamp();
    const label = participantLabel(selected);
    const localElapsed = startedAt != null ? Date.now() - startedAt : 0;
    resetMessages();
    setBusy(true);
    try {
      const result = await recordArriveDH(
        selected.id,
        Number(mancheId),
        recordedAt,
        operatorId
      );
      const serverMs = durationMs(result.tempsDepart, result.tempsArrive);
      const elapsedMs = serverMs ?? localElapsed;

      setFinishedRun({
        participantId: selected.id,
        participantLabel: label,
        elapsedMs,
        arriveeAt: result.tempsArrive,
      });
      setLocalRun(null);
      setSelectedId(null);
      setSuccess(
        `${label} — Arrivée à ${formatTimeShort(result.tempsArrive)}${
          formatMs(elapsedMs) ? ` — Temps : ${formatMs(elapsedMs)}` : ""
        }`
      );
      await loadParticipants();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message ?? "Erreur lors de l'enregistrement de l'arrivée");
    } finally {
      setBusy(false);
    }
  }

  async function handleCancelTimed() {
    const participantId = finishedRun?.participantId ?? selected?.id;
    if (!participantId || !mancheId || operatorId == null) return;

    const label =
      finishedRun?.participantLabel ??
      (selected ? participantLabel(selected) : "");
    const isFullRun = !!finishedRun;

    if (
      !window.confirm(
        isFullRun
          ? `Annuler le pointage complet de ${label} ?`
          : `Annuler le départ de ${label} ?`
      )
    ) {
      return;
    }

    resetMessages();
    setBusy(true);
    try {
      await cancelResultatManche(participantId, Number(mancheId), operatorId);
      setLocalRun(null);
      setFinishedRun(null);
      if (isFullRun) {
        setSelectedId(null);
      }
      setSuccess(
        isFullRun
          ? `Pointage annulé pour ${label}`
          : `Départ annulé pour ${label}`
      );
      await loadParticipants();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message ?? "Erreur lors de l'annulation");
    } finally {
      setBusy(false);
    }
  }

  async function handleCancelXc() {
    if (!xcRecorded || !mancheId || operatorId == null) return;

    if (
      !window.confirm(
        `Annuler l'arrivée de ${xcRecorded.participantLabel} ?`
      )
    ) {
      return;
    }

    resetMessages();
    setBusy(true);
    try {
      await cancelResultatManche(
        xcRecorded.participantId,
        Number(mancheId),
        operatorId
      );
      setXcRecorded(null);
      setSuccess(`Arrivée annulée pour ${xcRecorded.participantLabel}`);
      await loadParticipants();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message ?? "Erreur lors de l'annulation");
    } finally {
      setBusy(false);
    }
  }

  async function handleXcArrivee() {
    if (!selected || !mancheId) return;
    const label = participantLabel(selected);
    resetMessages();
    setBusy(true);
    try {
      const result = await recordArriveXC(selected.id, Number(mancheId));
      setXcRecorded({
        participantId: selected.id,
        participantLabel: label,
      });
      setSuccess(
        `${label} — Arrivée enregistrée à ${formatTimeShort(result.tempsArrive)}`
      );
      setSelectedId(null);
      await loadParticipants();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message ?? "Erreur lors de l'enregistrement");
    } finally {
      setBusy(false);
    }
  }

  const timerHint = !mancheId
    ? "Sélectionnez une manche pour commencer"
    : participants.length === 0
      ? "Aucun participant éligible sur cette manche"
      : undefined;

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
            disabled={courseSelectLocked}
          >
            <option value="">Sélectionner une course…</option>
            {visibleCourses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.type})
              </option>
            ))}
          </select>
          {isCollaborateur &&
            !hasMancheAssignments &&
            !assignedCourseId && (
              <p className="text-xs text-amber-700 mt-1">
                Aucune manche assignée. Demandez à un admin de configurer vos
                assignations.
              </p>
            )}
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
                disabled={phaseMancheLocked || phases.length === 0}
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
                {phaseId && manches.length > 0 && !phaseMancheLocked && (
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
                disabled={phaseMancheLocked || manches.length === 0}
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

      {isTimedRun && courseId && (
        <div className="space-y-4">
          <div className="bg-white border rounded-2xl p-4 sm:p-6 space-y-3">
            <label className="text-sm text-slate-600">Participant</label>
            <ParticipantAutocomplete
              participants={participants}
              value={selected}
              onChange={handleSelect}
              disabled={busy || !mancheId}
            />

            {selected && (
              <p className="text-xs text-slate-500">
                {startedAt != null
                  ? `En piste depuis ${formatTimeShort(new Date(startedAt).toISOString())}`
                  : "Prêt à partir"}
              </p>
            )}
          </div>

          <MancheTimer
            status={timerStatus}
            startedAt={startedAt}
            frozenMs={finishedRun?.elapsedMs ?? 0}
            busy={busy}
            canStart={canStart}
            onStart={handleStart}
            onStop={handleStop}
            hint={timerHint}
          />

          {canCancelTimed && timerStatus === "running" && (
            <button
              type="button"
              disabled={busy}
              onClick={handleCancelTimed}
              className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 hover:bg-red-100 disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              <Undo2 className="h-4 w-4" />
              Annuler le départ
            </button>
          )}

          {finishedRun && (
            <div className="bg-white border rounded-2xl p-4 space-y-3 text-center">
              <p className="text-sm text-slate-700">
                {finishedRun.participantLabel}
              </p>
              <p className="text-xs text-slate-500">
                Arrivée à {formatTimeShort(finishedRun.arriveeAt)}
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleCancelTimed}
                  className="flex-1 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 hover:bg-red-100 disabled:opacity-50 inline-flex items-center justify-center gap-2"
                >
                  <Undo2 className="h-4 w-4" />
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFinishedRun(null);
                    resetMessages();
                  }}
                  className="flex-1 rounded-xl border px-4 py-2.5 text-sm hover:bg-[#8c9962]/10"
                >
                  Nouveau pointage
                </button>
              </div>
            </div>
          )}

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
        </div>
      )}

      {courseType === "XC" && courseId && (
        <div className="bg-white border rounded-2xl p-4 sm:p-6 space-y-4">
          <div className="text-sm font-medium text-slate-700">Arrivée manche</div>
          <label className="text-sm text-slate-600">Participant</label>
          <ParticipantAutocomplete
            participants={participants}
            value={selected}
            onChange={handleSelect}
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
            disabled={!selected || !mancheId || busy}
            onClick={handleXcArrivee}
            className="w-full rounded-2xl bg-slate-900 text-white px-4 py-3 text-base disabled:opacity-50"
          >
            {busy ? "Enregistrement…" : "Enregistrer l'arrivée"}
          </button>

          {canCancelXc && (
            <button
              type="button"
              disabled={busy}
              onClick={handleCancelXc}
              className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 hover:bg-red-100 disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              <Undo2 className="h-4 w-4" />
              Annuler l'arrivée
            </button>
          )}
        </div>
      )}
    </section>
  );
};
