import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { COURSE_TYPES, type Course, type CourseCreateDTO, type CourseType } from "@/lib/type";

const TYPE_LABELS: Record<CourseType, string> = {
  TRAIL: "Trail",
  DH: "Descente (DH)",
  XC: "Cross-Country (XC)",
};

type CourseFormModalProps = {
  open: boolean;
  mode: "create" | "edit";
  initial?: Course | null;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (dto: CourseCreateDTO) => void;
};

const emptyForm: CourseCreateDTO = {
  name: "",
  type: "TRAIL",
  distanceKm: undefined,
  elevation: undefined,
  description: "",
};

export function CourseFormModal({
  open,
  mode,
  initial,
  saving,
  error,
  onClose,
  onSubmit,
}: CourseFormModalProps) {
  const [form, setForm] = useState<CourseCreateDTO>(emptyForm);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && initial) {
      setForm({
        name: initial.name,
        type: initial.type,
        distanceKm: initial.distanceKm,
        elevation: initial.elevation,
        description: initial.description ?? "",
      });
    } else {
      setForm(emptyForm);
    }
  }, [open, mode, initial]);

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      name: form.name.trim(),
      type: form.type,
      distanceKm: form.distanceKm || undefined,
      elevation: form.elevation || undefined,
      description: form.description?.trim() || undefined,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={() => !saving && onClose()}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="course-form-title"
        className="w-full max-w-lg rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b px-5 py-4">
          <div>
            <h2 id="course-form-title" className="text-lg font-semibold">
              {mode === "create" ? "Ajouter une course" : "Modifier la course"}
            </h2>
            {mode === "edit" && initial && (
              <p className="text-xs text-slate-500 mt-0.5">{initial.name}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-40"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          <div className="space-y-1">
            <label htmlFor="course-name" className="text-xs font-medium text-slate-600">
              Nom de la course *
            </label>
            <input
              id="course-name"
              required
              className="w-full rounded-lg border px-3 py-2 text-sm"
              placeholder="Ex. Trail Légende 21 km"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              disabled={saving}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="course-type" className="text-xs font-medium text-slate-600">
              Type *
            </label>
            <select
              id="course-type"
              required
              className="w-full rounded-lg border px-3 py-2 text-sm"
              value={form.type}
              onChange={(e) =>
                setForm((f) => ({ ...f, type: e.target.value as CourseType }))
              }
              disabled={saving}
            >
              {COURSE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="course-distance" className="text-xs font-medium text-slate-600">
                Distance (km)
              </label>
              <input
                id="course-distance"
                type="number"
                min={0}
                step={0.1}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                value={form.distanceKm ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    distanceKm: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
                disabled={saving}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="course-elevation" className="text-xs font-medium text-slate-600">
                D+ (m)
              </label>
              <input
                id="course-elevation"
                type="number"
                min={0}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                value={form.elevation ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    elevation: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
                disabled={saving}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="course-description" className="text-xs font-medium text-slate-600">
              Description
            </label>
            <textarea
              id="course-description"
              rows={3}
              className="w-full rounded-lg border px-3 py-2 text-sm resize-none"
              placeholder="Infos complémentaires…"
              value={form.description ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              disabled={saving}
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
          )}

          <div className="flex justify-end gap-2 border-t pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-40"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving || !form.name.trim()}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-40"
            >
              {saving
                ? "Enregistrement..."
                : mode === "create"
                  ? "Créer"
                  : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export { TYPE_LABELS };
