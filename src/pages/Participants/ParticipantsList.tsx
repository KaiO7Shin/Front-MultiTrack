import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Users } from "lucide-react";
import api from "../../lib/api"; // axios instance

type Participant = {
  id: number;
  nom: string;
  dossard: number;
  genre: "M" | "F";
  course: string;     // libellé de course
  categorie: string;  // peut être label (ex: "Senior") ou alias (ex: "SEH") selon ta data
};

type UICourse = { id: number; label: string };
type UICategory = { id: number; alias: string };

/* ===== Helpers communs ===== */
function coerceArray<T = unknown>(payload: any): T[] {
  if (Array.isArray(payload)) return payload;
  if (payload?.data && Array.isArray(payload.data)) return payload.data;
  if (payload?.races && Array.isArray(payload.races)) return payload.races;
  if (payload?.items && Array.isArray(payload.items)) return payload.items;
  return [];
}
function normalizeCourse(raw: any): UICourse {
  const id = Number(raw?.id ?? raw?.raceId ?? raw?.course_id ?? 0);
  const label = String(raw?.name ?? raw?.label ?? raw?.title ?? `Course #${id}`);
  return { id, label };
}
function normalizeCategory(raw: any): UICategory {
  return { id: Number(raw?.id ?? 0), alias: String(raw?.alias ?? "") };
}
function courseLabelOf(id: number, list: UICourse[]) {
  return list.find((c) => c.id === id)?.label ?? `Course #${id}`;
}

export const ParticipantsList = () => {
  // Mock (remplace par API /participants quand prêt)
  const [participants] = useState<Participant[]>([
    { id: 1, nom: "Rasoa M.", dossard: 124, genre: "F", course: "Trail 12K", categorie: "SEF" },     // alias
    { id: 2, nom: "Rakoto J.", dossard: 89,  genre: "M", course: "Trail 12K", categorie: "Senior" }, // label
  ]);

  // États recherche & filtres
  const [query, setQuery] = useState("");
  const [courses, setCourses] = useState<UICourse[]>([]);
  const [categories, setCategories] = useState<UICategory[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | "all">("all");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | "all">("all");
  const [selectedGender, setSelectedGender] = useState<"all" | "Homme" | "Femme">("all");

  // Charger courses & catégories
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [racesRes, catsRes] = await Promise.allSettled([
          api.get("/races"),
          api.get("/categories"),
        ]);
        if (!mounted) return;

        if (racesRes.status === "fulfilled") {
          setCourses(coerceArray(racesRes.value?.data).map(normalizeCourse));
        }
        if (catsRes.status === "fulfilled") {
          setCategories(coerceArray(catsRes.value?.data).map(normalizeCategory));
        }
      } catch (e) {
        console.error("Failed to load filters", e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Filtrage local
  const filtered = useMemo(() => {
    let base = participants;

    // Recherche nom/dossard
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      base = base.filter(
        (p) =>
          p.nom.toLowerCase().includes(q) ||
          String(p.dossard).includes(q)
      );
    }

    // Filtre course
    if (selectedCourseId !== "all") {
      const label = courseLabelOf(Number(selectedCourseId), courses);
      base = base.filter((p) => p.course === label);
    }

    // Filtre genre (si tu as besoin de "Homme"/"Femme" côté API, mappe localement M/F -> Homme/Femme)
    if (selectedGender !== "all") {
      const want = selectedGender === "Homme" ? "M" : "F";
      base = base.filter((p) => p.genre === want);
    }

    // Filtre catégorie par alias (tolérant si p.categorie est un label)
    if (selectedCategoryId !== "all") {
      const cat = categories.find((c) => c.id === selectedCategoryId);
      const alias = cat?.alias ?? "";
      if (alias) {
        const aliasLower = alias.toLowerCase();
        base = base.filter((p) => {
          const cur = (p.categorie || "").toString();
          // match si déjà alias exact, ou si contient l'alias (ex: "Senior Homme (SEH)")
          // ou fallback : si label commence par même lettre (S=Senior vs SEH…), très permissif
          return (
            cur.toLowerCase() === aliasLower ||
            cur.toLowerCase().includes(aliasLower) ||
            cur[0]?.toLowerCase() === aliasLower[0] // petit filet de sécurité
          );
        });
      }
    }

    return base;
  }, [participants, query, selectedCourseId, courses, selectedGender, selectedCategoryId, categories]);

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Participants</h1>
          <p className="text-sm text-slate-500">Liste des inscrits aux différentes courses</p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/participants/import"
            className="rounded-xl border px-3 py-2 text-sm hover:bg-[#8c9962]/10"
          >
            Importer CSV
          </Link>
          <Link
            to="/participants/add"
            className="rounded-xl bg-slate-900 text-white px-4 py-2 text-sm hover:opacity-90"
          >
            + Ajouter
          </Link>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Recherche */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par nom ou dossard..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#8c9962]/30"
          />
        </div>

        {/* Filtres dynamiques */}
        <div className="flex flex-wrap gap-2">
          {/* Course dynamique */}
          <select
            className="rounded-lg border px-2 py-1 text-sm focus:ring-2 focus:ring-[#8c9962]/30"
            value={String(selectedCourseId)}
            onChange={(e) =>
              setSelectedCourseId(e.target.value === "all" ? "all" : Number(e.target.value))
            }
          >
            <option value="all">Toutes les courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>

          {/* Catégorie dynamique (alias) */}
          <select
            className="rounded-lg border px-2 py-1 text-sm focus:ring-2 focus:ring-[#8c9962]/30"
            value={String(selectedCategoryId)}
            onChange={(e) =>
              setSelectedCategoryId(e.target.value === "all" ? "all" : Number(e.target.value))
            }
          >
            <option value="all">Toutes catégories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.alias}
              </option>
            ))}
          </select>

          {/* Genre (local) */}
          <select
            className="rounded-lg border px-2 py-1 text-sm focus:ring-2 focus:ring-[#8c9962]/30"
            value={selectedGender}
            onChange={(e) => setSelectedGender(e.target.value as "all" | "Homme" | "Femme")}
          >
            <option value="all">Tous genres</option>
            <option value="Homme">Homme</option>
            <option value="Femme">Femme</option>
          </select>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-slate-500">
            <Users className="h-10 w-10 mx-auto mb-2 text-slate-400" />
            <p className="text-sm">Aucun participant trouvé.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left">
                  <th className="px-4 py-2">Dossard</th>
                  <th className="px-4 py-2">Nom</th>
                  <th className="px-4 py-2">Genre</th>
                  <th className="px-4 py-2">Course</th>
                  <th className="px-4 py-2">Catégorie</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-[#8c9962]/5">
                    <td className="px-4 py-2 font-medium">{p.dossard}</td>
                    <td className="px-4 py-2">{p.nom}</td>
                    <td className="px-4 py-2">{p.genre}</td>
                    <td className="px-4 py-2">{p.course}</td>
                    <td className="px-4 py-2">{p.categorie}</td>
                    <td className="px-4 py-2 text-right">
                      <Link
                        to={`/participants/${p.id}`}
                        className="text-sm underline text-slate-700 hover:text-[#8c9962]"
                      >
                        Détails
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};
