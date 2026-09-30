import type { BikeType, Course, ParticipantCreateDTO } from "@/lib/type";
import { fetchCoursesForRegistration } from "@/services/courses";
import { createParticipant } from "@/services/participants";
import { fetchTypesVelo } from "@/services/typesVelo";
import { Alert, Spinner } from "@/components/ui/feedback";
import { FormField, inputClassName, selectClassName } from "@/components/ui/form-field";
import { TSHIRT_SIZES } from "@/lib/participantIdentity";
import { isBikeCourse } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";

const emptyForm: ParticipantCreateDTO = {
  nom: "",
  prenom: "",
  dateNaissance: "",
  genre: "Homme",
  courseChoisieId: 0,
  tailleTShirt: "",
  typeVelo: undefined,
};

type ParticipantCreateFormProps = {
  /** Appelé après un enregistrement réussi (ex. rafraîchir le suivi). */
  onCreated?: () => void;
};

export function ParticipantCreateForm({ onCreated }: ParticipantCreateFormProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [bikeTypes, setBikeTypes] = useState<{ id: number; libelle: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState<ParticipantCreateDTO>(emptyForm);

  useEffect(() => {
    Promise.all([fetchCoursesForRegistration(), fetchTypesVelo()])
      .then(([loadedCourses, loadedBikeTypes]) => {
        setCourses(loadedCourses);
        setBikeTypes(loadedBikeTypes);
      })
      .catch(() => setErr("Impossible de charger les données d'inscription"));
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

    if (!form.tailleTShirt) {
      setErr("Choisissez une taille de t-shirt.");
      return;
    }
    if (showBikeType && !form.typeVelo) {
      setErr("Le type de vélo est requis pour une course DH ou Enduro.");
      return;
    }

    setLoading(true);
    const payload: ParticipantCreateDTO = {
      nom: form.nom,
      prenom: form.prenom,
      dateNaissance: form.dateNaissance,
      genre: form.genre,
      courseChoisieId: form.courseChoisieId,
      tailleTShirt: form.tailleTShirt,
      ...(showBikeType && form.typeVelo ? { typeVelo: form.typeVelo } : {}),
    };

    try {
      const res = await createParticipant(payload);
      setSuccess(res.message);
      setForm(emptyForm);
      onCreated?.();
    } catch (e: unknown) {
      const error = e as { response?: { data?: { message?: string } }; message?: string };
      setErr(
        error.response?.data?.message ||
          error.message ||
          "Erreur serveur"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border rounded-2xl p-4 sm:p-6 grid gap-4 sm:grid-cols-2"
    >
      {err && (
        <div className="sm:col-span-2">
          <Alert variant="error" role="alert">
            {err}
          </Alert>
        </div>
      )}
      {success && (
        <div className="sm:col-span-2">
          <Alert variant="success">{success}</Alert>
        </div>
      )}

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

      <FormField label="Course" htmlFor="participant-course" required>
        <select
          id="participant-course"
          className={selectClassName}
          value={form.courseChoisieId || ""}
          onChange={(e) => handleCourseChange(Number(e.target.value))}
          required
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
      </FormField>

      <FormField label="Taille t-shirt" htmlFor="participant-tshirt" required>
        <select
          id="participant-tshirt"
          className={selectClassName}
          value={form.tailleTShirt ?? ""}
          onChange={(e) => handleChange("tailleTShirt", e.target.value)}
          required
        >
          <option value="" disabled>
            Sélectionne une taille…
          </option>
          {TSHIRT_SIZES.map((size) => (
            <option key={size.id} value={size.alias}>
              {size.alias}
            </option>
          ))}
        </select>
      </FormField>

      {showBikeType && (
        <FormField
          label="Type de vélo"
          htmlFor="type-velo"
          hint="Requis pour les courses DH et Enduro."
          required
          className="sm:col-span-2"
        >
          <select
            id="type-velo"
            className={selectClassName}
            value={form.typeVelo ?? ""}
            onChange={(e) => handleChange("typeVelo", e.target.value as BikeType)}
            required
          >
            <option value="" disabled>
              Sélectionne un type de vélo…
            </option>
            {bikeTypes.map((t) => (
              <option key={t.id} value={t.libelle}>
                {t.libelle}
              </option>
            ))}
          </select>
        </FormField>
      )}

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-2.5 disabled:opacity-60"
        >
          {loading && <Spinner className="border-white" />}
          {loading ? "Enregistrement…" : "Valider"}
        </button>
      </div>
    </form>
  );
}
