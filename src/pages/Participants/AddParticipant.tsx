import type { ParticipantCreateDTO } from "@/lib/type";
import { fetchCourses } from "@/services/courses";
import { createParticipant } from "@/services/participants";
import { Breadcrumb } from "@/components/Breadcrumb";
import { useEffect, useState } from "react";

type Course = { id: number; label: string };

export const AddParticipant = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [form, setForm] = useState<ParticipantCreateDTO>({
    nom: "",
    dateNaissance: "",
    genre: "Homme",
    courseChoisieId: 0,
  });

  useEffect(() => {
    fetchCourses().then(setCourses).catch(() => setErr("Impossible de charger courses"));
  }, []);

  function handleChange<K extends keyof ParticipantCreateDTO>(key: K, value: ParticipantCreateDTO[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await createParticipant(form);
      setSuccess(res.message);
      setForm({ nom: "", dateNaissance: "", genre: "Homme", courseChoisieId: 0 });
    } catch (e: any) {
      setErr(e.response?.data?.message || "Erreur serveur");
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
        <input
          className="border rounded-xl px-3 py-2"
          placeholder="Nom"
          value={form.nom}
          onChange={(e) => handleChange("nom", e.target.value)}
          required
        />

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
          onChange={(e) => handleChange("courseChoisieId", Number(e.target.value))}
          required
        >
          <option value="" disabled>Sélectionne une course…</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>

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
