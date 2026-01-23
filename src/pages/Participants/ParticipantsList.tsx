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
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type Participant = {
  id: number;
  nom: string;
  dossard: number;
  genre: "Homme" | "Femme";
  aliasCategorie: string;
  statut: "Inscrit" | "Present" | "En course" | "DNS" | "DNF";
};

type ParticipantStatus = "Inscrit" | "Present" | "En course" | "DNS" | "DNF";

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

  const exportPdf = () => {
    if (selectedCourseId === "all") return;

    const courseName =
      courses.find((c) => c.id === selectedCourseId)?.label || "";

    const doc = new jsPDF("p", "mm", "a4");

    doc.setFontSize(16);
    doc.text(`Liste des participants de ${courseName}`, 14, 20);

    autoTable(doc, {
      startY: 30,
      head: [],
      body: filtered.map((p) => [
        p.dossard,
        p.nom,
        p.genre,
        p.aliasCategorie,
      ]),
      styles: {
        fontSize: 10,
      },
      didParseCell: (data) => {
        const raw = data.row.raw;
        const genre = Array.isArray(raw) ? raw[2] : undefined;
        if (genre === "Femme") {
          data.cell.styles.fillColor = [255, 205, 210]; // rose nude
        }
      },
    });

    doc.save(`participants-${courseName}.pdf`);
  };

  const getNextStatus = (current: ParticipantStatus): ParticipantStatus => {
    switch (current) {
      case "Inscrit":
        return "Present";

      case "Present":
        return "Inscrit";

      case "En course":
        return "DNF";

      case "DNF":
        return "En course";

      case "DNS":
        return "En course";

      default:
        return current;
    }
  };


  const changeParticipantStatus = async (
    bibNumber: number,
    newStatus: ParticipantStatus
  ) => {
    await api.post("/participant/change/status", {
      bibNumber: String(bibNumber),
      newStatus,
    });
  };

  const togglePresence = async (p: Participant) => {
    const nextStatus = getNextStatus(p.statut);

    try {
      await changeParticipantStatus(p.dossard, nextStatus);

      setParticipants((prev) =>
        prev.map((item) =>
          item.dossard === p.dossard
            ? { ...item, statut: nextStatus }
            : item
        )
      );
    } catch {
      alert("Erreur lors du changement de statut");
    }
  };

  const statusStyle = (statut: ParticipantStatus) => {
    switch (statut) {
      case "Present":
        return "bg-green-100 text-green-700 hover:bg-green-200";

      case "En course":
        return "bg-blue-100 text-blue-700 hover:bg-blue-200";

      case "DNF":
        return "bg-orange-100 text-orange-700 hover:bg-orange-200";

      case "DNS":
        return "bg-red-100 text-red-700 hover:bg-red-200";

      default:
        return "bg-slate-100 text-slate-700 hover:bg-slate-200";
    }
  };


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
            statut: p.statut,
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
          <button
            onClick={exportPdf}
            disabled={filtered.length === 0 || selectedCourseId === "all"}
            className="rounded-xl border px-3 py-2 text-sm hover:bg-[#8c9962]/10 disabled:opacity-40"
          >
            Exporter les participants
          </button>
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
                  <th className="px-4 py-2">Presence</th>
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
                    <td className="px-4 py-2">
                      <button
                        onClick={() => togglePresence(p)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition ${statusStyle(p.statut)}`}
                      >
                        {p.statut}
                      </button>
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
