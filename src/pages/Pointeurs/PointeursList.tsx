import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2, Link2 } from "lucide-react";
import type { Course, PhaseWithManches, Pointeur } from "@/lib/type";
import {
  assignPointeurManches,
  createPointeur,
  deletePointeur,
  fetchPointeurs,
  updatePointeur,
} from "@/services/pointeurs";
import { fetchCoursesDetailed } from "@/services/courses";
import { fetchPhasesWithManches } from "@/services/raceStructure";
import { PointeurFormModal } from "./PointeurFormModal";
import { PointeurAssignModal } from "./PointeurAssignModal";

export const PointeursList = () => {
  const [pointeurs, setPointeurs] = useState<Pointeur[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editTarget, setEditTarget] = useState<Pointeur | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [createdPasscode, setCreatedPasscode] = useState<string | null>(null);

  const [assignTarget, setAssignTarget] = useState<Pointeur | null>(null);
  const [assignSaving, setAssignSaving] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [vttTree, setVttTree] = useState<
    { course: Course; phases: PhaseWithManches[] }[]
  >([]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setPointeurs(await fetchPointeurs());
    } catch {
      setLoadError("Impossible de charger les pointeurs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    async function loadTree() {
      try {
        const courses = await fetchCoursesDetailed();
        const vtt = courses.filter(
          (c) => c.type === "DH" || c.type === "ENDURO"
        );
        const tree = await Promise.all(
          vtt.map(async (course) => ({
            course,
            phases: await fetchPhasesWithManches(course.id),
          }))
        );
        setVttTree(tree);
      } catch {
        setVttTree([]);
      }
    }
    loadTree();
  }, []);

  const sorted = useMemo(
    () => [...pointeurs].sort((a, b) => a.libelle.localeCompare(b.libelle)),
    [pointeurs]
  );

  function openCreate() {
    setFormMode("create");
    setEditTarget(null);
    setFormError(null);
    setCreatedPasscode(null);
    setFormOpen(true);
  }

  function openEdit(p: Pointeur) {
    setFormMode("edit");
    setEditTarget(p);
    setFormError(null);
    setCreatedPasscode(null);
    setFormOpen(true);
  }

  function closeForm() {
    if (saving) return;
    setFormOpen(false);
    setEditTarget(null);
    setFormError(null);
  }

  async function handleFormSubmit(dto: {
    libelle: string;
    passcode?: string;
  }) {
    if (!dto.libelle.trim()) {
      setFormError("Le libellé est obligatoire.");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      if (formMode === "create") {
        const created = await createPointeur({
          libelle: dto.libelle.trim(),
          passcode: dto.passcode?.trim() || undefined,
        });
        setCreatedPasscode(created.passcode ?? null);
        await refresh();
        setFormMode("edit");
        setEditTarget(created);
      } else if (editTarget) {
        const updated = await updatePointeur(editTarget.id, {
          libelle: dto.libelle.trim(),
          passcode: dto.passcode?.trim() || undefined,
        });
        if (updated.passcode) setCreatedPasscode(updated.passcode);
        await refresh();
        setEditTarget(updated);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setFormError(e.response?.data?.message ?? "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(p: Pointeur) {
    if (p.hasTrailControlPoint) {
      alert(
        "Ce pointeur est lié à un point de contrôle TRAIL. Supprimez d'abord le PC."
      );
      return;
    }
    if (!confirm(`Supprimer le pointeur « ${p.libelle} » ?`)) return;
    try {
      await deletePointeur(p.id);
      await refresh();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message ?? "Suppression impossible");
    }
  }

  async function handleAssign(mancheIds: number[]) {
    if (!assignTarget) return;
    setAssignSaving(true);
    setAssignError(null);
    try {
      await assignPointeurManches(assignTarget.id, mancheIds);
      await refresh();
      setAssignTarget(null);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setAssignError(e.response?.data?.message ?? "Assignation impossible");
    } finally {
      setAssignSaving(false);
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Pointeurs</h1>
          <p className="text-sm text-slate-500 mt-1">
            Créer des comptes checkpoint et les assigner aux manches DH / Enduro.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-sm text-white hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Nouveau pointeur
        </button>
      </div>

      {loadError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Libellé</th>
              <th className="px-4 py-3 font-medium">Manches assignées</th>
              <th className="px-4 py-3 font-medium">TRAIL</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  Chargement…
                </td>
              </tr>
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  Aucun pointeur pour le moment.
                </td>
              </tr>
            ) : (
              sorted.map((p) => (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium">{p.libelle || `Pointeur #${p.id}`}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {p.assignedManches.length === 0 ? (
                      <span className="text-slate-400">Aucune</span>
                    ) : (
                      <span className="line-clamp-2">
                        {p.assignedManches
                          .map(
                            (m) =>
                              `${m.courseLabel} / ${m.phaseLabel} / ${m.label}`
                          )
                          .join(" · ")}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {p.hasTrailControlPoint ? (
                      <span className="inline-flex rounded-full border px-2 py-0.5 text-xs bg-amber-50 text-amber-800 border-amber-200">
                        PC lié
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        title="Assigner manches"
                        className="rounded-lg border px-2 py-1.5 hover:bg-slate-50"
                        onClick={() => {
                          setAssignError(null);
                          setAssignTarget(p);
                        }}
                      >
                        <Link2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        title="Modifier"
                        className="rounded-lg border px-2 py-1.5 hover:bg-slate-50"
                        onClick={() => openEdit(p)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        title="Supprimer"
                        className="rounded-lg border border-red-200 px-2 py-1.5 text-red-600 hover:bg-red-50 disabled:opacity-40"
                        disabled={p.hasTrailControlPoint}
                        onClick={() => handleDelete(p)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <PointeurFormModal
        open={formOpen}
        mode={formMode}
        initial={editTarget}
        saving={saving}
        error={formError}
        revealedPasscode={createdPasscode}
        onClose={closeForm}
        onSubmit={handleFormSubmit}
      />

      <PointeurAssignModal
        open={!!assignTarget}
        pointeur={assignTarget}
        tree={vttTree}
        saving={assignSaving}
        error={assignError}
        onClose={() => !assignSaving && setAssignTarget(null)}
        onSubmit={handleAssign}
      />
    </section>
  );
};
