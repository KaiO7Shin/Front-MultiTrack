import type { Course, ParticipantCreateDTO, ParticipantProjection } from "@/lib/type";
import { fetchCoursesForRegistration } from "@/services/courses";
import { fetchGenres, type GenreOption } from "@/services/genres";
import { fetchTaillesTShirt, type TailleTShirtOption } from "@/services/taillesTShirt";
import { createParticipant, updateParticipant } from "@/services/participants";
import { Alert, Spinner } from "@/components/ui/feedback";
import { FormField, inputClassName, selectClassName } from "@/components/ui/form-field";
import { useEffect, useState } from "react";

const emptyForm: ParticipantCreateDTO = {
  nom: "",
  prenom: "",
  dateNaissance: "",
  genre: "",
  courseChoisieId: 0,
  tailleTShirt: "",
};

type ParticipantFormProps = {
  editing?: ParticipantProjection | null;
  onCancelEdit?: () => void;
  /** Appelé après création ou modification réussie. */
  onSuccess?: (message: string, participantId?: number) => void;
  /** @deprecated Prefer onSuccess */
  onCreated?: () => void;
};

export function ParticipantCreateForm({
  editing = null,
  onCancelEdit,
  onSuccess,
  onCreated,
}: ParticipantFormProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [genres, setGenres] = useState<GenreOption[]>([]);
  const [tailles, setTailles] = useState<TailleTShirtOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState<ParticipantCreateDTO>(emptyForm);

  const isEditing = Boolean(editing);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [courseList, genreList, tailleList] = await Promise.all([
          fetchCoursesForRegistration(),
          fetchGenres(),
          fetchTaillesTShirt(),
        ]);
        if (!mounted) return;
        setCourses(courseList);
        setGenres(genreList);
        setTailles(tailleList);
        setForm((f) => ({
          ...f,
          genre: f.genre || genreList[0]?.libelle || "",
        }));
      } catch {
        if (mounted) setErr("Impossible de charger les données d'inscription");
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setErr(null);
    if (!editing) {
      setForm({
        ...emptyForm,
        genre: genres[0]?.libelle || "",
      });
      return;
    }
    setForm({
      nom: editing.nom,
      prenom: editing.prenom,
      dateNaissance: editing.dateNaissance,
      genre: editing.genre,
      courseChoisieId: editing.courseId,
      tailleTShirt: editing.tailleTShirt ?? "",
    });
  }, [editing]);

  useEffect(() => {
    if (editing) return;
    setForm((f) => (f.genre ? f : { ...f, genre: genres[0]?.libelle || "" }));
  }, [genres, editing]);

  function handleChange<K extends keyof ParticipantCreateDTO>(
    key: K,
    value: ParticipantCreateDTO[K]
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (!form.genre) {
      setErr("Choisissez un genre.");
      return;
    }
    if (!form.tailleTShirt) {
      setErr("Choisissez une taille de t-shirt.");
      return;
    }

    setLoading(true);
    try {
      if (editing) {
        const res = await updateParticipant({
          bibNumber: editing.numDossard,
          numDossard: editing.numDossard,
          nom: form.nom,
          prenom: form.prenom,
          dateNaissance: form.dateNaissance,
          genre: form.genre,
          courseChoisieId: form.courseChoisieId,
          statut: editing.statut,
          tailleTShirt: form.tailleTShirt,
        });
        setForm({ ...emptyForm, genre: genres[0]?.libelle || "" });
        onSuccess?.(res.message || "Participant mis à jour.", editing.id);
        onCreated?.();
      } else {
        const res = await createParticipant({
          nom: form.nom,
          prenom: form.prenom,
          dateNaissance: form.dateNaissance,
          genre: form.genre,
          courseChoisieId: form.courseChoisieId,
          tailleTShirt: form.tailleTShirt,
        });
        setForm({ ...emptyForm, genre: genres[0]?.libelle || "" });
        onSuccess?.(res.message || "Participant créé avec succès.");
        onCreated?.();
      }
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
      id="participant-form"
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
          onChange={(e) => handleChange("genre", e.target.value)}
          required
        >
          <option value="" disabled>
            Sélectionne un genre…
          </option>
          {genres.map((g) => (
            <option key={g.id} value={g.libelle}>
              {g.libelle}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Course" htmlFor="participant-course" required>
        <select
          id="participant-course"
          className={selectClassName}
          value={form.courseChoisieId || ""}
          onChange={(e) => handleChange("courseChoisieId", Number(e.target.value))}
          required
        >
          <option value="" disabled>
            Sélectionne une course…
          </option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
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
          {tailles.map((size) => (
            <option key={size.id} value={size.alias}>
              {size.alias}
            </option>
          ))}
        </select>
      </FormField>

      <div className="sm:col-span-2 flex flex-col sm:flex-row gap-2">
        {isEditing && (
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              setErr(null);
              setForm({ ...emptyForm, genre: genres[0]?.libelle || "" });
              onCancelEdit?.();
            }}
            className="btn-secondary w-full sm:w-auto py-2.5 disabled:opacity-60"
          >
            Annuler
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-2.5 disabled:opacity-60 sm:flex-1"
        >
          {loading && <Spinner className="border-white" />}
          {loading
            ? "Enregistrement…"
            : isEditing
              ? "Modifier"
              : "Valider"}
        </button>
      </div>
    </form>
  );
}
