import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { Course, CourseCreateDTO } from "@/lib/type";
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

function toTimeInput(value?: string): string {
  if (!value) return "04:00";
  return value.length >= 5 ? value.slice(0, 5) : value;
}

function toTimeApi(value: string): string {
  if (!value) return "04:00:00";
  return value.length === 5 ? `${value}:00` : value;
}

const emptyForm: CourseCreateDTO = {
  libelle: "",
  typeCourseId: 0,
  distance: 0,
  totalDenivele: 0,
  dureeBarriereHoraire: "04:00",
  nomSequence: "",
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
  const [types, setTypes] = useState<{ id: number; libelle: string }[]>([]);

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
        types.find((t) => t.libelle === initial.type)?.id ??
        0;

      setForm({
        libelle: initial.name,
        typeCourseId,
        distance: initial.distanceKm ?? 0,
        totalDenivele: initial.elevation ?? 0,
        dureeBarriereHoraire: toTimeInput(initial.dureeBarriereHoraire),
        nomSequence: initial.nomSequence ?? "",
      });
      return;
    }

    const defaultTypeId = types[0]?.id ?? 0;
    setForm({
      ...emptyForm,
      typeCourseId: defaultTypeId,
    });
  }, [open, mode, initial, types]);

  if (!open) return null;

  const isValid =
    form.libelle.trim().length > 0 &&
    form.libelle.trim().length <= 25 &&
    form.typeCourseId > 0 &&
    form.distance > 0 &&
    form.totalDenivele >= 0 &&
    form.dureeBarriereHoraire.length > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      libelle: form.libelle.trim(),
      typeCourseId: form.typeCourseId,
      distance: form.distance,
      totalDenivele: form.totalDenivele,
      dureeBarriereHoraire: toTimeApi(form.dureeBarriereHoraire),
      nomSequence: form.nomSequence?.trim() || undefined,
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
          <div className="space-y-1">
            <label htmlFor="course-libelle" className="text-xs font-medium text-slate-600">
              Libellé *
            </label>
            <input
              id="course-libelle"
              required
              maxLength={25}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              placeholder="Ex. Trail Légende 21 km"
              value={form.libelle}
              onChange={(e) => setForm((f) => ({ ...f, libelle: e.target.value }))}
              disabled={saving}
            />
            <p className="text-[10px] text-slate-400">25 caractères max.</p>
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
                setForm((f) => ({
                  ...f,
                  typeCourseId: Number(e.target.value),
                }))
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
                min={0}
                step={1}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                value={form.totalDenivele || ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    totalDenivele: e.target.value ? Number(e.target.value) : 0,
                  }))
                }
                disabled={saving}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="course-barriere"
              className="text-xs font-medium text-slate-600"
            >
              Barrière horaire *
            </label>
            <input
              id="course-barriere"
              type="time"
              required
              step={60}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              value={form.dureeBarriereHoraire}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  dureeBarriereHoraire: e.target.value,
                }))
              }
              disabled={saving}
            />
            <p className="text-[10px] text-slate-400">
              Durée limite pour terminer la course (ex. 04:00 = 4 h).
            </p>
          </div>

          <div className="space-y-1">
            <label htmlFor="course-sequence" className="text-xs font-medium text-slate-600">
              Nom de séquence
            </label>
            <input
              id="course-sequence"
              maxLength={30}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              placeholder="Ex. trail_legende_seq"
              value={form.nomSequence ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, nomSequence: e.target.value }))
              }
              disabled={saving}
            />
            <p className="text-[10px] text-slate-400">
              Identifiant PostgreSQL pour les dossards (ex. cross_country_seq).
              Créée automatiquement à l'enregistrement de la course.
            </p>
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
              disabled={saving || !isValid}
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
