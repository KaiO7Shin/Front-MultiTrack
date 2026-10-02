import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Alert } from "@/components/ui/feedback";
import type { Course, CourseCreateDTO, TypeCourse } from "@/lib/type";
import { fetchTypesCourse } from "@/services/typesCourse";

type CourseFormModalProps = {
  open: boolean;
  mode: "create" | "edit";
  initial?: Course | null;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (dto: CourseCreateDTO) => void;
};

function toTimeInput(value?: string | null): string {
  if (!value) return "";
  return value.length >= 5 ? value.slice(0, 5) : value;
}

function toTimeApi(value: string): string | null {
  if (!value.trim()) return null;
  return value.length === 5 ? `${value}:00` : value;
}

const emptyForm: CourseCreateDTO = {
  libelle: "",
  typeCourseId: 0,
  distance: 0,
  denivelePositif: 0,
  dureeBarriereHoraire: null,
  tarif: 0,
  description: null,
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
  const [types, setTypes] = useState<TypeCourse[]>([]);
  const [barriere, setBarriere] = useState("");

  useEffect(() => {
    if (!open) return;
    fetchTypesCourse()
      .then(setTypes)
      .catch(() => setTypes([]));
  }, [open]);

  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && initial) {
      const typeCourseId =
        initial.typeCourseId ??
        types.find((t) => t.libelle.toUpperCase() === initial.type)?.id ??
        0;

      setForm({
        libelle: initial.name,
        typeCourseId,
        distance: initial.distanceKm ?? 0,
        denivelePositif: initial.elevation ?? 0,
        dureeBarriereHoraire: initial.dureeBarriereHoraire ?? null,
        tarif: initial.tarif ?? 0,
        description: initial.description ?? null,
      });
      setBarriere(toTimeInput(initial.dureeBarriereHoraire));
      return;
    }

    const defaultType = types[0];
    setForm({
      ...emptyForm,
      typeCourseId: defaultType?.id ?? 0,
    });
    setBarriere("");
  }, [open, mode, initial, types]);

  if (!open) return null;

  const isValid =
    form.libelle.trim().length > 0 &&
    form.libelle.trim().length <= 75 &&
    form.typeCourseId > 0 &&
    form.distance > 0 &&
    form.denivelePositif > 0 &&
    form.tarif > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      libelle: form.libelle.trim(),
      typeCourseId: form.typeCourseId,
      distance: form.distance,
      denivelePositif: form.denivelePositif,
      dureeBarriereHoraire: toTimeApi(barriere),
      tarif: form.tarif,
      description: form.description?.trim() || null,
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
        className="w-full max-w-lg rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto"
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
          {error && (
            <Alert variant="error" role="alert">
              {error}
            </Alert>
          )}

          <div className="space-y-1">
            <label htmlFor="course-libelle" className="text-xs font-medium text-slate-600">
              Libellé *
            </label>
            <input
              id="course-libelle"
              required
              maxLength={75}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              placeholder="Ex. Challenge Initiation — Trail 12 km"
              value={form.libelle}
              onChange={(e) => setForm((f) => ({ ...f, libelle: e.target.value }))}
              disabled={saving}
            />
            <p className="text-[10px] text-slate-400">75 caractères max. Unique.</p>
          </div>

          <div className="space-y-1">
            <label htmlFor="course-type" className="text-xs font-medium text-slate-600">
              Type de course *
            </label>
            <select
              id="course-type"
              required
              className="w-full rounded-lg border px-3 py-2 text-sm"
              value={form.typeCourseId || ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, typeCourseId: Number(e.target.value) }))
              }
              disabled={saving || types.length === 0}
            >
              {types.length === 0 ? (
                <option value="">Chargement…</option>
              ) : (
                types.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.libelle}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="course-distance" className="text-xs font-medium text-slate-600">
                Distance (km) *
              </label>
              <input
                id="course-distance"
                type="number"
                required
                min={0.01}
                step={0.01}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                value={form.distance || ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    distance: e.target.value ? Number(e.target.value) : 0,
                  }))
                }
                disabled={saving}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="course-elevation" className="text-xs font-medium text-slate-600">
                Dénivelé D+ (m) *
              </label>
              <input
                id="course-elevation"
                type="number"
                required
                min={0.01}
                step={1}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                value={form.denivelePositif || ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    denivelePositif: e.target.value ? Number(e.target.value) : 0,
                  }))
                }
                disabled={saving}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="course-tarif" className="text-xs font-medium text-slate-600">
                Tarif *
              </label>
              <input
                id="course-tarif"
                type="number"
                required
                min={0.01}
                step={100}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                value={form.tarif || ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    tarif: e.target.value ? Number(e.target.value) : 0,
                  }))
                }
                disabled={saving}
              />
            </div>
            <div className="space-y-1">
              <label
                htmlFor="course-barriere"
                className="text-xs font-medium text-slate-600"
              >
                Barrière horaire
              </label>
              <input
                id="course-barriere"
                type="time"
                step={60}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                value={barriere}
                onChange={(e) => setBarriere(e.target.value)}
                disabled={saving}
              />
              <p className="text-[10px] text-slate-400">Optionnel.</p>
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="course-description" className="text-xs font-medium text-slate-600">
              Description
            </label>
            <textarea
              id="course-description"
              rows={3}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              placeholder="Description optionnelle"
              value={form.description ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              disabled={saving}
            />
          </div>

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
              disabled={saving || !isValid}
              className="rounded-xl bg-navy px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-40"
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
