import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronDown, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import { Breadcrumb } from "@/components/Breadcrumb";
import type { Course, Manche, Phase, PhaseWithManches } from "@/lib/type";
import {
  formatDurationBetween,
  formatTimeShort,
  normalizeCourseStatus,
} from "@/lib/utils";
import { fetchCoursesDetailed } from "@/services/courses";
import {
  createManche,
  createPhase,
  deleteManche,
  deletePhase,
  fetchPhasesWithManches,
  fetchResultatsByManche,
  updateManche,
  updatePhase,
} from "@/services/raceStructure";
import {
  createControlPoint,
  deleteControlPoint,
  fetchControlPointsByCourse,
  updateControlPoint,
} from "@/services/controlPoints";
import { PhaseFormModal } from "./PhaseFormModal";
import { MancheFormModal } from "./MancheFormModal";
import { ControlPointFormModal } from "./ControlPointFormModal";
import type { ControlPointConfig } from "@/lib/type";

export const CourseDetails = () => {
  const { id } = useParams();
  const courseId = Number(id);

  const [course, setCourse] = useState<Course | null>(null);
  const [structure, setStructure] = useState<PhaseWithManches[]>([]);
  const [expandedPhases, setExpandedPhases] = useState<Set<number>>(new Set());
  const [selectedManche, setSelectedManche] = useState<{
    manche: Manche;
    phase: Phase;
  } | null>(null);
  const [resultats, setResultats] = useState<
    Awaited<ReturnType<typeof fetchResultatsByManche>>
  >([]);

  const [phaseModal, setPhaseModal] = useState<{
    open: boolean;
    mode: "create" | "edit";
    target: Phase | null;
  }>({ open: false, mode: "create", target: null });
  const [mancheModal, setMancheModal] = useState<{
    open: boolean;
    mode: "create" | "edit";
    target: Manche | null;
    phase: Phase | null;
  }>({ open: false, mode: "create", target: null, phase: null });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [controlPoints, setControlPoints] = useState<ControlPointConfig[]>([]);
  const [cpModal, setCpModal] = useState<{
    open: boolean;
    mode: "create" | "edit";
    target: ControlPointConfig | null;
  }>({ open: false, mode: "create", target: null });
  const [revealedPasscode, setRevealedPasscode] = useState<string | null>(null);

  const loadCourse = useCallback(async () => {
    const list = await fetchCoursesDetailed();
    setCourse(list.find((c) => c.id === courseId) ?? null);
  }, [courseId]);

  const loadStructure = useCallback(async () => {
    const list = await fetchPhasesWithManches(courseId);
    setStructure(list);
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      list.forEach((p) => next.add(p.id));
      return next;
    });
    setSelectedManche((prev) => {
      if (!prev) return null;
      const phase = list.find((p) => p.id === prev.phase.id);
      const manche = phase?.manches.find((m) => m.id === prev.manche.id);
      return phase && manche ? { phase, manche } : null;
    });
  }, [courseId]);

  const loadControlPoints = useCallback(async () => {
    if (!course || course.type !== "TRAIL") {
      setControlPoints([]);
      return;
    }
    try {
      setControlPoints(await fetchControlPointsByCourse(courseId));
    } catch {
      setControlPoints([]);
    }
  }, [course, courseId]);

  const loadResultats = useCallback(async () => {
    if (!selectedManche) {
      setResultats([]);
      return;
    }
    setResultats(await fetchResultatsByManche(selectedManche.manche.id));
  }, [selectedManche]);

  useEffect(() => {
    loadCourse();
    loadStructure();
  }, [loadCourse, loadStructure]);

  useEffect(() => {
    loadControlPoints();
  }, [loadControlPoints]);

  useEffect(() => {
    loadResultats();
  }, [loadResultats]);

  const showStructure = useMemo(
    () => course?.type === "DH" || course?.type === "XC",
    [course?.type]
  );

  const showControlPoints = useMemo(
    () => course?.type === "TRAIL",
    [course?.type]
  );

  const totalManches = useMemo(
    () => structure.reduce((n, p) => n + p.manches.length, 0),
    [structure]
  );

  function togglePhase(phaseId: number) {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(phaseId)) next.delete(phaseId);
      else next.add(phaseId);
      return next;
    });
  }

  async function handlePhaseSubmit(dto: { courseId: number; label: string }) {
    setSaving(true);
    setFormError(null);
    try {
      if (phaseModal.mode === "create") {
        await createPhase(dto);
      } else if (phaseModal.target) {
        await updatePhase(phaseModal.target.id, { label: dto.label });
      }
      setPhaseModal({ open: false, mode: "create", target: null });
      await loadStructure();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setFormError(err.response?.data?.message ?? "Erreur phase");
    } finally {
      setSaving(false);
    }
  }

  async function handleMancheSubmit(dto: { phaseId: number; label: string }) {
    if (!mancheModal.phase) return;
    setSaving(true);
    setFormError(null);
    try {
      if (mancheModal.mode === "create") {
        await createManche(dto);
      } else if (mancheModal.target) {
        await updateManche(mancheModal.target.id, { label: dto.label });
      }
      setMancheModal({ open: false, mode: "create", target: null, phase: null });
      await loadStructure();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setFormError(err.response?.data?.message ?? "Erreur manche");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeletePhase(phase: PhaseWithManches) {
    const count = phase.manches.length;
    const msg =
      count > 0
        ? `Supprimer la phase « ${phase.label} » et ses ${count} manche${count > 1 ? "s" : ""} ?`
        : `Supprimer la phase « ${phase.label} » ?`;
    if (!window.confirm(msg)) return;
    try {
      await deletePhase(phase.id);
      if (selectedManche?.phase.id === phase.id) setSelectedManche(null);
      await loadStructure();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      alert(err.response?.data?.message ?? "Erreur lors de la suppression de la phase.");
    }
  }

  async function handleDeleteManche(manche: Manche) {
    if (!window.confirm(`Supprimer la manche « ${manche.label} » ?`)) return;
    try {
      await deleteManche(manche.id);
      if (selectedManche?.manche.id === manche.id) setSelectedManche(null);
      await loadStructure();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      alert(err.response?.data?.message ?? "Erreur lors de la suppression de la manche.");
    }
  }

  async function handleControlPointSubmit(dto: {
    courseId: number;
    label: string;
    numero: number;
    passcode?: string;
  }) {
    setSaving(true);
    setFormError(null);
    setRevealedPasscode(null);
    try {
      if (cpModal.mode === "create") {
        const created = await createControlPoint(dto);
        if (created.passcode) setRevealedPasscode(created.passcode);
      } else if (cpModal.target) {
        const updated = await updateControlPoint(cpModal.target.id, {
          label: dto.label,
          numero: dto.numero,
          passcode: dto.passcode,
        });
        if (updated.passcode) setRevealedPasscode(updated.passcode);
      }
      setCpModal({ open: false, mode: "create", target: null });
      await loadControlPoints();
      await loadCourse();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setFormError(err.response?.data?.message ?? "Erreur point de contrôle");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteControlPoint(cp: ControlPointConfig) {
    if (!window.confirm(`Supprimer le point « ${cp.label} » ?`)) return;
    try {
      await deleteControlPoint(cp.id);
      await loadControlPoints();
      await loadCourse();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      alert(err.response?.data?.message ?? "Erreur lors de la suppression.");
    }
  }

  if (!course) {
    return (
      <section className="space-y-4">
        <p className="text-slate-500">Course introuvable.</p>
        <Link to="/courses" className="text-sm underline">
          Retour aux courses
        </Link>
      </section>
    );
  }

  return (
    <section className="page-section">
      <Breadcrumb
        items={[
          { label: "Courses", to: "/courses" },
          { label: course.name },
        ]}
      />

      <div className="page-header sm:items-start">
        <div className="min-w-0">
          <h1 className="page-title break-words">{course.name}</h1>
          <p className="page-subtitle">
            {course.type} · {normalizeCourseStatus(course.status)}
            {course.distanceKm != null ? ` · ${course.distanceKm} km` : ""}
          </p>
        </div>
        <Link
          to="/checkpoint/scan"
          className="rounded-xl border px-4 py-2 text-sm hover:bg-[#8c9962]/10 self-stretch sm:self-start text-center"
        >
          Ouvrir le checkpoint
        </Link>
      </div>

      {showStructure ? (
        <div className="space-y-4">
          <div className="bg-white border rounded-2xl p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between mb-1">
              <div className="min-w-0">
                <h2 className="font-semibold">Phases & manches</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Une phase regroupe une ou plusieurs manches. Chaque manche
                  appartient à une seule phase.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFormError(null);
                  setPhaseModal({ open: true, mode: "create", target: null });
                }}
                className="inline-flex items-center justify-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs hover:bg-[#8c9962]/10 shrink-0 w-full sm:w-auto"
              >
                <Plus className="h-3 w-3" />
                Phase
              </button>
            </div>

            {structure.length === 0 ? (
              <p className="text-sm text-slate-500 py-4">
                Aucune phase. Commencez par créer une phase, puis ajoutez des
                manches à l'intérieur.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {structure.map((phase) => {
                  const expanded = expandedPhases.has(phase.id);
                  return (
                    <div
                      key={phase.id}
                      className="border rounded-xl overflow-hidden"
                    >
                      <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50">
                        <button
                          type="button"
                          onClick={() => togglePhase(phase.id)}
                          className="p-0.5 rounded hover:bg-slate-200"
                          aria-label={expanded ? "Replier" : "Déplier"}
                        >
                          {expanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-sm">{phase.label}</span>
                          <span className="text-xs text-slate-500 ml-2">
                            {phase.manches.length} manche
                            {phase.manches.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button
                            type="button"
                            className="p-1 rounded hover:bg-slate-200"
                            title="Modifier la phase"
                            onClick={() => {
                              setFormError(null);
                              setPhaseModal({
                                open: true,
                                mode: "edit",
                                target: phase,
                              });
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            className="p-1 rounded text-red-600 hover:bg-red-50"
                            title="Supprimer la phase"
                            onClick={() => handleDeletePhase(phase)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {expanded && (
                        <div className="px-3 py-2 space-y-1">
                          {phase.manches.length === 0 ? (
                            <p className="text-xs text-slate-500 py-2 pl-6">
                              Aucune manche dans cette phase.
                            </p>
                          ) : (
                            <ul className="space-y-0.5">
                              {phase.manches.map((manche) => {
                                const isSelected =
                                  selectedManche?.manche.id === manche.id;
                                return (
                                  <li
                                    key={manche.id}
                                    className={`flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between py-1.5 pl-6 pr-1 rounded-lg ${
                                      isSelected ? "bg-[#8c9962]/10" : ""
                                    }`}
                                  >
                                    <button
                                      type="button"
                                      className="text-sm text-left flex-1"
                                      onClick={() =>
                                        setSelectedManche({ manche, phase })
                                      }
                                    >
                                      {manche.label}
                                    </button>
                                    <div className="flex gap-1">
                                      <button
                                        type="button"
                                        className="p-1 rounded hover:bg-slate-100"
                                        title="Modifier la manche"
                                        onClick={() => {
                                          setFormError(null);
                                          setMancheModal({
                                            open: true,
                                            mode: "edit",
                                            target: manche,
                                            phase,
                                          });
                                        }}
                                      >
                                        <Pencil className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        className="p-1 rounded text-red-600 hover:bg-red-50"
                                        title="Supprimer la manche"
                                        onClick={() => handleDeleteManche(manche)}
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setFormError(null);
                              setMancheModal({
                                open: true,
                                mode: "create",
                                target: null,
                                phase,
                              });
                            }}
                            className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 pl-6 py-1.5"
                          >
                            <Plus className="h-3 w-3" />
                            Manche dans « {phase.label} »
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {structure.length > 0 && (
              <p className="text-xs text-slate-400 mt-3 pt-3 border-t">
                {structure.length} phase{structure.length !== 1 ? "s" : ""} ·{" "}
                {totalManches} manche{totalManches !== 1 ? "s" : ""} au total
              </p>
            )}
          </div>
        </div>
      ) : showControlPoints ? (
        <div className="space-y-4">
          <div className="bg-white border rounded-2xl p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between mb-1">
              <div className="min-w-0">
                <h2 className="font-semibold">Points de contrôle</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chaque point génère un passcode collaborateur pour le scan
                  dossard sur la page checkpoint.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFormError(null);
                  setRevealedPasscode(null);
                  setCpModal({ open: true, mode: "create", target: null });
                }}
                className="inline-flex items-center justify-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs hover:bg-[#8c9962]/10 shrink-0 w-full sm:w-auto"
              >
                <Plus className="h-3 w-3" />
                Point de contrôle
              </button>
            </div>

            {revealedPasscode && (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                Passcode collaborateur :{" "}
                <strong className="font-mono">{revealedPasscode}</strong>
                <span className="block text-xs mt-1 text-amber-700">
                  Notez-le maintenant : il ne sera plus affiché ensuite.
                </span>
              </div>
            )}

            {controlPoints.length === 0 ? (
              <p className="text-sm text-slate-500 py-4">
                Aucun point de contrôle. Ajoutez au moins un PC intermédiaire ;
                l'arrivée finale se fait via le mode arrivée (admin) ou un PC
                dédié.
              </p>
            ) : (
              <ul className="mt-4 divide-y rounded-xl border overflow-hidden">
                {controlPoints.map((cp) => (
                  <li
                    key={cp.id}
                    className="flex items-center justify-between gap-2 px-3 py-2.5 bg-white"
                  >
                    <div className="min-w-0">
                      <span className="font-medium text-sm">{cp.label}</span>
                      <span className="text-xs text-slate-500 ml-2">
                        n°{cp.numero}
                      </span>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        type="button"
                        className="p-1 rounded hover:bg-slate-100"
                        title="Modifier"
                        onClick={() => {
                          setFormError(null);
                          setRevealedPasscode(null);
                          setCpModal({
                            open: true,
                            mode: "edit",
                            target: cp,
                          });
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        className="p-1 rounded text-red-600 hover:bg-red-50"
                        title="Supprimer"
                        onClick={() => handleDeleteControlPoint(cp)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {controlPoints.length > 0 && (
              <p className="text-xs text-slate-400 mt-3 pt-3 border-t">
                {controlPoints.length} point
                {controlPoints.length !== 1 ? "s" : ""} de contrôle
              </p>
            )}
          </div>

          <div className="bg-white border rounded-2xl p-4 text-sm text-slate-600">
            Course <strong>Trail</strong> : le pointage se fait via scan dossard
            sur chaque point de contrôle. Les collaborateurs se connectent avec
            le passcode de leur PC assigné.
          </div>
        </div>
      ) : (
        <div className="bg-white border rounded-2xl p-4 text-sm text-slate-600">
          Type de course non pris en charge pour la configuration checkpoint.
        </div>
      )}

      {showStructure && selectedManche && (
        <div className="bg-white border rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b bg-slate-50">
            <h2 className="font-semibold text-sm">
              Résultats — {selectedManche.phase.label} ›{" "}
              {selectedManche.manche.label}
            </h2>
          </div>
          {resultats.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">
              Aucun résultat enregistré pour cette manche.
            </p>
          ) : (
            <div className="table-scroll">
              <table>
                <thead className="bg-slate-50 text-left">
                  <tr>
                    <th className="px-4 py-2">Dossard</th>
                    <th className="px-4 py-2">Prénom</th>
                    <th className="px-4 py-2">Nom</th>
                    <th className="px-4 py-2">Départ</th>
                    <th className="px-4 py-2">Arrivée</th>
                    <th className="px-4 py-2">Durée</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {resultats.map((r) => (
                    <tr key={r.id}>
                      <td className="px-4 py-2 font-medium">{r.numDossard}</td>
                      <td className="px-4 py-2">{r.prenom}</td>
                      <td className="px-4 py-2">{r.nom}</td>
                      <td className="px-4 py-2 tabular-nums">
                        {formatTimeShort(r.tempsDepart)}
                      </td>
                      <td className="px-4 py-2 tabular-nums">
                        {formatTimeShort(r.tempsArrive)}
                      </td>
                      <td className="px-4 py-2 tabular-nums">
                        {formatDurationBetween(r.tempsDepart, r.tempsArrive) ??
                          "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <PhaseFormModal
        open={phaseModal.open}
        mode={phaseModal.mode}
        courseId={courseId}
        initial={phaseModal.target}
        saving={saving}
        error={formError}
        onClose={() => {
          if (saving) return;
          setPhaseModal({ open: false, mode: "create", target: null });
          setFormError(null);
        }}
        onSubmit={handlePhaseSubmit}
      />

      {mancheModal.phase && (
        <MancheFormModal
          open={mancheModal.open}
          mode={mancheModal.mode}
          phaseId={mancheModal.phase.id}
          phaseLabel={mancheModal.phase.label}
          initial={mancheModal.target}
          saving={saving}
          error={formError}
          onClose={() => {
            if (saving) return;
            setMancheModal({
              open: false,
              mode: "create",
              target: null,
              phase: null,
            });
            setFormError(null);
          }}
          onSubmit={handleMancheSubmit}
        />
      )}

      <ControlPointFormModal
        open={cpModal.open}
        mode={cpModal.mode}
        courseId={courseId}
        initial={cpModal.target}
        saving={saving}
        error={formError}
        onClose={() => {
          if (saving) return;
          setCpModal({ open: false, mode: "create", target: null });
          setFormError(null);
        }}
        onSubmit={handleControlPointSubmit}
      />
    </section>
  );
};
