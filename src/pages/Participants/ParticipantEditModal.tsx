import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import {
  BIKE_TYPE_LABELS,
  BIKE_TYPES,
  type BikeType,
  type Course,
  type ParticipantUpdateDTO,
  type ParticipantStatus,
} from "@/lib/type";
import { fetchCoursesDetailed } from "@/services/courses";
import { formatParticipantName } from "@/lib/utils";

export type ParticipantEditTarget = {
  numDossard: string;
  nom: string;
  prenom: string;
  genre: "Homme" | "Femme";
  dateNaissance: string;
  courseId: number;
  statut: ParticipantStatus;
  typeVelo?: BikeType;
};

type ParticipantEditModalProps = {
  participant: ParticipantEditTarget | null;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (dto: ParticipantUpdateDTO) => void;
};

function isBikeCourse(type: Course["type"] | undefined): boolean {
  return type === "DH";
}

const emptyForm: Omit<ParticipantUpdateDTO, "bibNumber"> = {
  numDossard: "",
  nom: "",
  prenom: "",
  dateNaissance: "",
  genre: "Homme",
  courseChoisieId: 0,
  statut: "Inscrit",
  typeVelo: undefined,
};

export function ParticipantEditModal({
  participant,
  saving,
  error,
  onClose,
  onSubmit,
}: ParticipantEditModalProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    fetchCoursesDetailed()
      .then(setCourses)
      .catch(() => setCourses([]));
  }, []);

  useEffect(() => {
    if (!participant) return;
    setForm({
      numDossard: participant.numDossard,
      nom: participant.nom,
      prenom: participant.prenom,
      dateNaissance: participant.dateNaissance,
      genre: participant.genre,
      courseChoisieId: participant.courseId,
      statut: participant.statut,
      typeVelo: participant.typeVelo,
    });
  }, [participant]);

  const selectedCourse = useMemo(
    () => courses.find((c) => c.id === form.courseChoisieId),
    [courses, form.courseChoisieId]
  );

  const showBikeType = isBikeCourse(selectedCourse?.type);

  if (!participant) return null;

  const handleCourseChange = (courseId: number) => {
    const course = courses.find((c) => c.id === courseId);
    setForm((f) => ({
      ...f,
      courseChoisieId: courseId,
      typeVelo: isBikeCourse(course?.type) ? f.typeVelo : undefined,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (showBikeType && !form.typeVelo) return;

    onSubmit({
      bibNumber: participant.numDossard,
      numDossard: form.numDossard.trim(),
      nom: form.nom.trim(),
      prenom: form.prenom.trim(),
      dateNaissance: form.dateNaissance,
      genre: form.genre,
      courseChoisieId: form.courseChoisieId,
      statut: form.statut,
      ...(showBikeType && form.typeVelo ? { typeVelo: form.typeVelo } : {}),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold">Modifier le participant</h2>
            <p className="text-xs text-slate-500">
              Dossard {participant.numDossard} —{" "}
              {formatParticipantName(participant.prenom, participant.nom)}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-40"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">
                Dossard
              </label>
              <input
                type="number"
                min={1}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                value={form.numDossard}
                onChange={(e) =>
                  setForm((f) => ({ ...f, numDossard: e.target.value }))
                }
                required
                disabled={saving}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">
                Prénom
              </label>
              <input
                type="text"
                className="w-full rounded-lg border px-3 py-2 text-sm"
                value={form.prenom}
                onChange={(e) =>
                  setForm((f) => ({ ...f, prenom: e.target.value }))
                }
                required
                disabled={saving}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Nom</label>
              <input
                type="text"
                className="w-full rounded-lg border px-3 py-2 text-sm"
                value={form.nom}
                onChange={(e) =>
                  setForm((f) => ({ ...f, nom: e.target.value }))
                }
                required
                disabled={saving}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">
                Date de naissance
              </label>
              <input
                type="date"
                className="w-full rounded-lg border px-3 py-2 text-sm"
                value={form.dateNaissance}
                onChange={(e) =>
                  setForm((f) => ({ ...f, dateNaissance: e.target.value }))
                }
                required
                disabled={saving}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">
                Genre
              </label>
              <select
                className="w-full rounded-lg border px-3 py-2 text-sm"
                value={form.genre}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    genre: e.target.value as "Homme" | "Femme",
                  }))
                }
                disabled={saving}
              >
                <option value="Homme">Homme</option>
                <option value="Femme">Femme</option>
              </select>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-medium text-slate-600">
                Course
              </label>
              <select
                className="w-full rounded-lg border px-3 py-2 text-sm"
                value={form.courseChoisieId || ""}
                onChange={(e) => handleCourseChange(Number(e.target.value))}
                required
                disabled={saving}
              >
                <option value="" disabled>
                  Sélectionne une course…
                </option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.type})
                  </option>
                ))}
              </select>
            </div>

            {showBikeType && (
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-medium text-slate-600">
                  Type de vélo *
                </label>
                <select
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  value={form.typeVelo ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      typeVelo: e.target.value as BikeType,
                    }))
                  }
                  required
                  disabled={saving}
                >
                  <option value="" disabled>
                    Sélectionne un type de vélo…
                  </option>
                  {BIKE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {BIKE_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-medium text-slate-600">
                Statut
              </label>
              <select
                className="w-full rounded-lg border px-3 py-2 text-sm"
                value={form.statut}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    statut: e.target.value as ParticipantStatus,
                  }))
                }
                disabled={saving}
              >
                <option value="Inscrit">Inscrit</option>
                <option value="Present">Present</option>
                <option value="En course">En course</option>
                <option value="DNS">DNS</option>
                <option value="DNF">DNF</option>
              </select>
            </div>
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
              className="rounded-xl border px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-40"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={
                saving ||
                !form.prenom.trim() ||
                !form.nom.trim() ||
                !form.dateNaissance ||
                !form.courseChoisieId ||
                (showBikeType && !form.typeVelo)
              }
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-40"
            >
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
