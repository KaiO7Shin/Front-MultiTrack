import type { ParticipantCreateDTO, BikeType, Course } from "@/lib/type";
import { BIKE_TYPE_LABELS, BIKE_TYPES } from "@/lib/type";
import { fetchCoursesDetailed } from "@/services/courses";
import { createParticipant } from "@/services/participants";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Alert, Spinner } from "@/components/ui/feedback";
import { FormField, inputClassName, selectClassName } from "@/components/ui/form-field";
import { useEffect, useMemo, useState } from "react";

const emptyForm: ParticipantCreateDTO = {
  nom: "",
  prenom: "",
  dateNaissance: "",
  genre: "Homme",
  courseChoisieId: 0,
  typeVelo: undefined,
};

function isBikeCourse(type: Course["type"] | undefined): boolean {
  return type === "DH";
}

export const AddParticipant = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [form, setForm] = useState<ParticipantCreateDTO>(emptyForm);

  useEffect(() => {
    fetchCoursesDetailed()
      .then(setCourses)
      .catch(() => setErr("Impossible de charger les courses"));
  }, []);

  const selectedCourse = useMemo(
    () => courses.find((c) => c.id === form.courseChoisieId),
    [courses, form.courseChoisieId]
  );

  const showBikeType = isBikeCourse(selectedCourse?.type);

  function handleChange<K extends keyof ParticipantCreateDTO>(
    key: K,
    value: ParticipantCreateDTO[K]
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleCourseChange(courseId: number) {
    const course = courses.find((c) => c.id === courseId);
    setForm((f) => ({
      ...f,
      courseChoisieId: courseId,
      typeVelo: isBikeCourse(course?.type) ? f.typeVelo : undefined,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSuccess(null);

    if (showBikeType && !form.typeVelo) {
      setErr("Le type de vélo est requis pour une course DH.");
      return;
    }

    setLoading(true);

    const payload: ParticipantCreateDTO = {
      nom: form.nom,
      prenom: form.prenom,
      dateNaissance: form.dateNaissance,
      genre: form.genre,
      courseChoisieId: form.courseChoisieId,
      ...(showBikeType && form.typeVelo ? { typeVelo: form.typeVelo } : {}),
    };

    try {
      const res = await createParticipant(payload);
      setSuccess(res.message);
      setForm(emptyForm);
    } catch (e: unknown) {
      const error = e as { response?: { data?: { message?: string } } };
      setErr(error.response?.data?.message || "Erreur serveur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="page-section">
      <Breadcrumb
        items={[
          { label: "Participants", to: "/participants" },
          { label: "Ajouter un participant" },
        ]}
      />
      <div>
        <h1 className="page-title">Ajouter un participant</h1>
        <p className="page-subtitle">
          Inscrivez un coureur à une course.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border rounded-2xl p-4 sm:p-6 grid gap-4 sm:grid-cols-2">
        <FormField label="Prénom" htmlFor="participant-prenom" required>
          <input
            id="participant-prenom"
            className={inputClassName}
            placeholder="Prénom"
            value={form.prenom}
            onChange={(e) => handleChange("prenom", e.target.value)}
            required
          />
        </FormField>

        <FormField label="Nom" htmlFor="participant-nom" required>
          <input
            id="participant-nom"
            className={inputClassName}
            placeholder="Nom"
            value={form.nom}
            onChange={(e) => handleChange("nom", e.target.value)}
            required
          />
        </FormField>

        <FormField label="Date de naissance" htmlFor="participant-birth" required>
          <input
            id="participant-birth"
            className={inputClassName}
            type="date"
            value={form.dateNaissance}
            onChange={(e) => handleChange("dateNaissance", e.target.value)}
            required
          />
        </FormField>

        <FormField label="Genre" htmlFor="participant-genre" required>
          <select
            id="participant-genre"
            className={selectClassName}
            value={form.genre}
            onChange={(e) => handleChange("genre", e.target.value as "Homme" | "Femme")}
          >
            <option value="Homme">Homme</option>
            <option value="Femme">Femme</option>
          </select>
        </FormField>

        <FormField label="Course" htmlFor="participant-course" required className="sm:col-span-2">
          <select
            id="participant-course"
            className={selectClassName}
            value={form.courseChoisieId || ""}
            onChange={(e) => handleCourseChange(Number(e.target.value))}
            required
          >
            <option value="" disabled>Sélectionne une course…</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.type})
              </option>
            ))}
          </select>
        </FormField>

        {showBikeType && (
          <FormField
            label="Type de vélo"
            htmlFor="type-velo"
            hint="Requis pour les courses Descente (DH)."
            required
            className="sm:col-span-2"
          >
            <select
              id="type-velo"
              className={selectClassName}
              value={form.typeVelo ?? ""}
              onChange={(e) =>
                handleChange("typeVelo", e.target.value as BikeType)
              }
              required
            >
              <option value="" disabled>Sélectionne un type de vélo…</option>
              {BIKE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {BIKE_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </FormField>
        )}

        <div className="sm:col-span-2 flex flex-col sm:flex-row gap-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto rounded-xl bg-slate-900 text-white px-4 py-2.5 text-sm disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && <Spinner className="border-white" />}
            {loading ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>

        {success && (
          <div className="sm:col-span-2">
            <Alert variant="success">{success}</Alert>
          </div>
        )}
        {err && (
          <div className="sm:col-span-2">
            <Alert variant="error" role="alert">{err}</Alert>
          </div>
        )}
      </form>
    </section>
  );
};
