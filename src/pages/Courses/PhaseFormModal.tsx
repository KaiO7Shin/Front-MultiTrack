import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { Phase, PhaseCreateDTO } from "@/lib/type";

type PhaseFormModalProps = {
  open: boolean;
  mode: "create" | "edit";
  courseId: number;
  initial?: Phase | null;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (dto: PhaseCreateDTO) => void;
};

export function PhaseFormModal({
  open,
  mode,
  courseId,
  initial,
  saving,
  error,
  onClose,
  onSubmit,
}: PhaseFormModalProps) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    if (!open) return;
    setLabel(mode === "edit" && initial ? initial.label : "");
  }, [open, mode, initial]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={() => !saving && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b px-5 py-4">
          <h2 className="text-lg font-semibold">
            {mode === "create" ? "Ajouter une phase" : "Modifier la phase"}
          </h2>
          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit({ courseId, label: label.trim() });
          }}
          className="space-y-4 px-5 py-4"
        >
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">
              Nom de la phase
            </label>
            <input
              className="w-full rounded-lg border px-3 py-2 text-sm"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ex. Qualifications, Éliminatoires, Finale…"
              required
              disabled={saving}
            />
            <p className="text-xs text-slate-400">
              Une phase peut contenir plusieurs manches (ex. poules, manches de
              qualif).
            </p>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 border-t pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border px-4 py-2 text-sm"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving || !label.trim()}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-40"
            >
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
