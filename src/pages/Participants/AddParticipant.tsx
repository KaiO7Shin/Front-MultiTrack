import type { ParticipantCreateDTO, BikeType, Course } from "@/lib/type";
import { BIKE_TYPE_LABELS, BIKE_TYPES } from "@/lib/type";
import { fetchCoursesDetailed } from "@/services/courses";
import { createParticipant } from "@/services/participants";
import { Breadcrumb } from "@/components/Breadcrumb";
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
    <section className="space-y-4">
      <Breadcrumb
        items={[
          { label: "Participants", to: "/participants" },
          { label: "Ajouter un participant" },
        ]}
      />
      <h1 className="text-2xl font-semibold">Ajouter un participant</h1>

      <form onSubmit={handleSubmit} className="bg-white border rounded-2xl p-6 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="participant-prenom" className="block text-xs font-medium text-slate-600 mb-1">
            Prénom *
          </label>
          <input
            id="participant-prenom"
            className="w-full border rounded-xl px-3 py-2"
            placeholder="Prénom"
            value={form.prenom}
            onChange={(e) => handleChange("prenom", e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="participant-nom" className="block text-xs font-medium text-slate-600 mb-1">
            Nom *
          </label>
          <input
            id="participant-nom"
            className="w-full border rounded-xl px-3 py-2"
            placeholder="Nom"
            value={form.nom}
            onChange={(e) => handleChange("nom", e.target.value)}
            required
          />
        </div>

        <input
          className="border rounded-xl px-3 py-2"
          type="date"
          value={form.dateNaissance}
          onChange={(e) => handleChange("dateNaissance", e.target.value)}
          required
        />

        <select
          className="border rounded-xl px-3 py-2"
          value={form.genre}
          onChange={(e) => handleChange("genre", e.target.value as "Homme" | "Femme")}
        >
          <option value="Homme">Homme</option>
          <option value="Femme">Femme</option>
        </select>

        <select
          className="border rounded-xl px-3 py-2"
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

        {showBikeType && (
          <div className="sm:col-span-2">
            <label htmlFor="type-velo" className="block text-xs font-medium text-slate-600 mb-1">
              Type de vélo *
            </label>
            <select
              id="type-velo"
              className="w-full border rounded-xl px-3 py-2"
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
            <p className="text-xs text-slate-500 mt-1">
              Requis pour les courses Descente (DH).
            </p>
          </div>
        )}

        <div className="sm:col-span-2 flex gap-2">
          <button disabled={loading} className="rounded-xl bg-slate-900 text-white px-4 py-2 text-sm">
            {loading ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>

        {success && <p className="text-green-600 text-sm sm:col-span-2">{success}</p>}
        {err && <p className="text-red-600 text-sm sm:col-span-2">{err}</p>}
      </form>
    </section>
  );
};
