"use client";

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Users } from "lucide-react";
import api from "@/lib/api";
import { fetchParticipantsByCourse } from "@/services/participants";
import {
  coerceArrayList,
  normalizeCategory,
  normalizeCourse,
} from "@/lib/utils";
import type { ParticipantProjection } from "@/lib/type";

type Participant = {
  id: number;
  nom: string;
  dossard: number;
  genre: "Homme" | "Femme";
  aliasCategorie: string;
};

type UICourse = { id: number; label: string };
type UICategory = { id: number; alias: string };

export const ParticipantsList = () => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(false);

  const [query, setQuery] = useState("");
  const [courses, setCourses] = useState<UICourse[]>([]);
  const [categories, setCategories] = useState<UICategory[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | "all">("all");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | "all">("all");
  const [selectedGender, setSelectedGender] = useState<"all" | "Homme" | "Femme">("all");

  /* Chargement des courses & catégories */
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
          setCourses(coerceArrayList(racesRes.value?.data).map(normalizeCourse));
        }
        if (catsRes.status === "fulfilled") {
          setCategories(coerceArrayList(catsRes.value?.data).map(normalizeCategory));
        }
      } catch (e) {
        console.error("Erreur chargement filtres", e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  /* Chargement participants quand course change */
  useEffect(() => {
    if (selectedCourseId === "all") {
      setParticipants([]);
      return;
    }

    setLoading(true);
    fetchParticipantsByCourse(Number(selectedCourseId))
      .then((rows: ParticipantProjection[]) => {
        return setParticipants(
          rows.map((p) => ({
            id: p.id,
            nom: p.nom,
            dossard: Number(p.numDossard),
            genre: p.genre,
            aliasCategorie: p.aliasCategorie,
          }))
        );
      })
      .catch(() => setParticipants([]))
      .finally(() => setLoading(false));
  }, [selectedCourseId]);

  /* Filtrage local */
  const filtered = useMemo(() => {
    let base = participants;

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      base = base.filter(
        (p) =>
          p.nom.toLowerCase().includes(q) ||
          String(p.dossard).includes(q)
      );
    }

    if (selectedGender !== "all") {
      const want = selectedGender === "Homme" ? "Homme" : "Femme";
      base = base.filter((p) => p.genre === want);
    }

    if (selectedCategoryId !== "all") {
      const cat = categories.find((c) => c.id === selectedCategoryId);
      const alias = cat?.alias?.toLowerCase() ?? "";
      if (alias) {
        base = base.filter((p) =>
          (p.aliasCategorie || "").toLowerCase().includes(alias)
        );
      }
    }

    return base;
  }, [participants, query, selectedGender, selectedCategoryId, categories]);

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Participants</h1>
          <p className="text-sm text-slate-500">
            Liste des inscrits par course
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/participants/import" className="rounded-xl border px-3 py-2 text-sm hover:bg-[#8c9962]/10">
            Importer CSV
          </Link>
          <Link to="/participants/add" className="rounded-xl bg-slate-900 text-white px-4 py-2 text-sm hover:opacity-90">
            + Ajouter
          </Link>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border rounded-2xl p-4 flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Nom ou dossard..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border focus:ring-2 focus:ring-[#8c9962]/30"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            className="rounded-lg border px-2 py-1 text-sm"
            value={String(selectedCourseId)}
            onChange={(e) => setSelectedCourseId(e.target.value === "all" ? "all" : Number(e.target.value))}
          >
            <option value="all">Toutes les courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>

          <select
            className="rounded-lg border px-2 py-1 text-sm"
            value={String(selectedCategoryId)}
            onChange={(e) => setSelectedCategoryId(e.target.value === "all" ? "all" : Number(e.target.value))}
          >
            <option value="all">Toutes catégories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.alias}</option>
            ))}
          </select>

          <select
            className="rounded-lg border px-2 py-1 text-sm"
            value={selectedGender}
            onChange={(e) => setSelectedGender(e.target.value as any)}
          >
            <option value="all">Tous genres</option>
            <option value="Homme">Homme</option>
            <option value="Femme">Femme</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-slate-500">
            Chargement des participants...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-center text-slate-500">
            <Users className="h-10 w-10 mx-auto mb-2 text-slate-400" />
            <p>Aucun participant trouvé.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left">Dossard</th>
                  <th className="px-4 py-2 text-left">Nom</th>
                  <th className="px-4 py-2 text-left">Genre</th>
                  <th className="px-4 py-2 text-left">Catégorie</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-[#8c9962]/5">
                    <td className="px-4 py-2 font-medium">{p.dossard}</td>
                    <td className="px-4 py-2">{p.nom}</td>
                    <td className="px-4 py-2">{p.genre}</td>
                    <td className="px-4 py-2">{p.aliasCategorie}</td>
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
