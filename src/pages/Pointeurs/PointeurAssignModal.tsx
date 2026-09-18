import { useEffect, useMemo, useState } from "react";
import type { Course, PhaseWithManches, Pointeur } from "@/lib/type";
import { Alert } from "@/components/ui/feedback";
import { Modal } from "@/components/ui/modal";

type TreeNode = { course: Course; phases: PhaseWithManches[] };

type PointeurAssignModalProps = {
  open: boolean;
  pointeur: Pointeur | null;
  tree: TreeNode[];
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (mancheIds: number[]) => void;
};

export function PointeurAssignModal({
  open,
  pointeur,
  tree,
  saving,
  error,
  onClose,
  onSubmit,
}: PointeurAssignModalProps) {
  const [selected, setSelected] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!open || !pointeur) return;
    setSelected(new Set(pointeur.assignedManches.map((m) => m.id)));
  }, [open, pointeur]);

  const totalManches = useMemo(
    () => tree.reduce((n, node) => n + node.phases.reduce((a, p) => a + p.manches.length, 0), 0),
    [tree]
  );

  function toggle(mancheId: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(mancheId)) next.delete(mancheId);
      else next.add(mancheId);
      return next;
    });
  }

  function togglePhase(mancheIds: number[], checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const id of mancheIds) {
        if (checked) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }

  return (
    <Modal
      open={open}
      title={
        pointeur
          ? `Assigner des manches — ${pointeur.libelle}`
          : "Assigner des manches"
      }
      onClose={onClose}
      disabled={saving}
      size="lg"
      className="max-w-2xl"
    >
      <div className="space-y-4 px-5 py-4">
        <p className="text-sm text-slate-500">
          Cochez les manches DH / Enduro accessibles à ce pointeur au checkpoint.
        </p>

        {tree.length === 0 || totalManches === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-600">
            Aucune manche DH / Enduro disponible. Configurez d&apos;abord les
            phases et manches sur les courses.
          </div>
        ) : (
          <div className="max-h-[50vh] space-y-4 overflow-y-auto pr-1">
            {tree.map(({ course, phases }) => (
              <div key={course.id} className="rounded-xl border border-slate-200">
                <div className="border-b border-slate-100 bg-slate-50 px-3 py-2 text-sm font-medium">
                  {course.name}{" "}
                  <span className="text-xs font-normal text-slate-500">
                    ({course.type})
                  </span>
                </div>
                <div className="divide-y divide-slate-100">
                  {phases.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-slate-400">
                      Aucune phase
                    </p>
                  ) : (
                    phases.map((phase) => {
                      const ids = phase.manches.map((m) => m.id);
                      const allChecked =
                        ids.length > 0 && ids.every((id) => selected.has(id));
                      const someChecked =
                        !allChecked && ids.some((id) => selected.has(id));
                      return (
                        <div key={phase.id} className="px-3 py-2">
                          <label className="flex items-center gap-2 text-sm font-medium">
                            <input
                              type="checkbox"
                              checked={allChecked}
                              ref={(el) => {
                                if (el) el.indeterminate = someChecked;
                              }}
                              onChange={(e) =>
                                togglePhase(ids, e.target.checked)
                              }
                              disabled={saving || ids.length === 0}
                            />
                            {phase.label}
                          </label>
                          <ul className="mt-1 ml-6 space-y-1">
                            {phase.manches.map((manche) => (
                              <li key={manche.id}>
                                <label className="flex items-center gap-2 text-sm text-slate-700">
                                  <input
                                    type="checkbox"
                                    checked={selected.has(manche.id)}
                                    onChange={() => toggle(manche.id)}
                                    disabled={saving}
                                  />
                                  {manche.label}
                                </label>
                              </li>
                            ))}
                            {phase.manches.length === 0 && (
                              <li className="text-xs text-slate-400">
                                Aucune manche
                              </li>
                            )}
                          </ul>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <Alert variant="error" role="alert">
            {error}
          </Alert>
        )}

        <div className="flex items-center justify-between gap-2 border-t pt-4">
          <span className="text-xs text-slate-500">
            {selected.size} manche{selected.size === 1 ? "" : "s"} sélectionnée
            {selected.size === 1 ? "" : "s"}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border px-4 py-2 text-sm hover:bg-brand-muted"
            >
              Annuler
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => onSubmit([...selected])}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-40"
            >
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
