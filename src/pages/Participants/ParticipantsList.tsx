"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, Search, Users } from "lucide-react";
import {
  changeParticipantStatus,
  fetchParticipantsByCourse,
  updateParticipant,
} from "@/services/participants";
import { fetchCategories, fetchCoursesDetailed } from "@/services/courses";
import type { BikeType, CourseType, ParticipantProjection, ParticipantStatus } from "@/lib/type";
import { BIKE_TYPE_LABELS, BIKE_TYPES } from "@/lib/type";
import { formatParticipantName } from "@/lib/utils";
import { ParticipantEditModal } from "./ParticipantEditModal";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type Participant = {
  id: number;
  nom: string;
  prenom: string;
  numDossard: string;
  genre: "Homme" | "Femme";
  aliasCategorie: string;
  statut: ParticipantStatus;
  dateNaissance: string;
  courseId: number;
  typeVelo?: BikeType;
};

type UICourse = { id: number; label: string; type: CourseType };
type UICategory = { id: number; alias: string };

function mapProjection(p: ParticipantProjection): Participant {
  return {
    id: p.id || Number(p.numDossard),
    nom: p.nom,
    prenom: p.prenom ?? "",
    numDossard: p.numDossard,
    genre: p.genre,
    aliasCategorie: p.aliasCategorie,
    statut: p.statut,
    dateNaissance: p.dateNaissance ?? "",
    courseId: p.courseId,
    typeVelo: p.typeVelo,
  };
}

export const ParticipantsList = () => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(false);

  const [query, setQuery] = useState("");
  const [courses, setCourses] = useState<UICourse[]>([]);
  const [categories, setCategories] = useState<UICategory[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | "all">("all");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | "all">("all");
  const [selectedGender, setSelectedGender] = useState<"all" | "Homme" | "Femme">("all");
  const [selectedBikeType, setSelectedBikeType] = useState<"all" | BikeType>("all");

  const [editTarget, setEditTarget] = useState<Participant | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const reloadParticipants = useCallback(async (courseId: number) => {
    const rows = await fetchParticipantsByCourse(courseId);
    setParticipants(rows.map(mapProjection));
  }, []);

  const closeEdit = () => {
    if (editSaving) return;
    setEditTarget(null);
    setEditError(null);
  };

  const submitEdit = async (dto: Parameters<typeof updateParticipant>[0]) => {
    setEditError(null);
    setEditSaving(true);
    try {
      await updateParticipant(dto);

      if (selectedCourseId !== "all") {
        await reloadParticipants(Number(selectedCourseId));
      }

      setEditTarget(null);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setEditError(
        error.response?.data?.message ||
          "Erreur lors de la mise à jour du participant"
      );
    } finally {
      setEditSaving(false);
    }
  };

  const selectedCourse = useMemo(
    () =>
      selectedCourseId === "all"
        ? null
        : courses.find((c) => c.id === selectedCourseId) ?? null,
    [courses, selectedCourseId]
  );
  const isDhCourse = selectedCourse?.type === "DH";

  const exportPdf = () => {
    if (selectedCourseId === "all") return;

    const courseName =
      courses.find((c) => c.id === selectedCourseId)?.label || "";

    const doc = new jsPDF("p", "mm", "a4");

    doc.setFontSize(16);
    doc.text(`Liste des participants de ${courseName}`, 14, 20);

    autoTable(doc, {
      startY: 30,
      head: [
        isDhCourse
          ? ["Dossard", "Prénom", "Nom", "Genre", "Catégorie", "Type vélo"]
          : ["Dossard", "Prénom", "Nom", "Genre", "Catégorie"],
      ],
      body: filtered.map((p) =>
        isDhCourse
          ? [
              p.numDossard,
              p.prenom,
              p.nom,
              p.genre,
              p.aliasCategorie,
              p.typeVelo ? BIKE_TYPE_LABELS[p.typeVelo] : "—",
            ]
          : [p.numDossard, p.prenom, p.nom, p.genre, p.aliasCategorie]
      ),
      styles: {
        fontSize: 10,
      },
      didParseCell: (data) => {
        const raw = data.row.raw;
        const genre = Array.isArray(raw) ? raw[3] : undefined;
        if (genre === "Femme") {
          data.cell.styles.fillColor = [255, 205, 210];
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

  const togglePresence = async (p: Participant) => {
    const nextStatus = getNextStatus(p.statut);

    try {
      await changeParticipantStatus(p.numDossard, nextStatus);

      setParticipants((prev) =>
        prev.map((item) =>
          item.numDossard === p.numDossard
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

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [courseList, catList] = await Promise.all([
          fetchCoursesDetailed(),
          fetchCategories(),
        ]);
        if (!mounted) return;
        setCourses(
          courseList.map((c) => ({ id: c.id, label: c.name, type: c.type }))
        );
        setCategories(catList);
      } catch (e) {
        console.error("Erreur chargement filtres", e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (selectedCourseId === "all") {
      setParticipants([]);
      setSelectedBikeType("all");
      return;
    }

    setLoading(true);
    fetchParticipantsByCourse(Number(selectedCourseId))
      .then((rows) => setParticipants(rows.map(mapProjection)))
      .catch(() => setParticipants([]))
      .finally(() => setLoading(false));
  }, [selectedCourseId]);

  const filtered = useMemo(() => {
    let base = participants;

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      base = base.filter(
        (p) =>
          p.nom.toLowerCase().includes(q) ||
          p.prenom.toLowerCase().includes(q) ||
          formatParticipantName(p.prenom, p.nom).toLowerCase().includes(q) ||
          p.numDossard.includes(q)
      );
    }

    if (selectedGender !== "all") {
      base = base.filter((p) => p.genre === selectedGender);
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

    if (isDhCourse && selectedBikeType !== "all") {
      base = base.filter((p) => p.typeVelo === selectedBikeType);
    }

    return base;
  }, [
    participants,
    query,
    selectedGender,
    selectedCategoryId,
    selectedBikeType,
    isDhCourse,
    categories,
  ]);

  return (
    <section className="space-y-6">
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

      <div className="bg-white border rounded-2xl p-4 flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Nom, prénom ou dossard..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border focus:ring-2 focus:ring-[#8c9962]/30"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            className="rounded-lg border px-2 py-1 text-sm"
            value={String(selectedCourseId)}
            onChange={(e) => {
              setSelectedCourseId(
                e.target.value === "all" ? "all" : Number(e.target.value)
              );
              setSelectedBikeType("all");
            }}
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
            onChange={(e) => setSelectedGender(e.target.value as "all" | "Homme" | "Femme")}
          >
            <option value="all">Tous genres</option>
            <option value="Homme">Homme</option>
            <option value="Femme">Femme</option>
          </select>

          {isDhCourse && (
            <select
              className="rounded-lg border px-2 py-1 text-sm"
              value={selectedBikeType}
              onChange={(e) =>
                setSelectedBikeType(e.target.value as "all" | BikeType)
              }
            >
              <option value="all">Tous types de vélo</option>
              {BIKE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {BIKE_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

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
                  <th className="px-4 py-2 text-left">Prénom</th>
                  <th className="px-4 py-2 text-left">Nom</th>
                  <th className="px-4 py-2 text-left">Genre</th>
                  <th className="px-4 py-2 text-left">Catégorie</th>
                  {isDhCourse && (
                    <th className="px-4 py-2 text-left">Type vélo</th>
                  )}
                  <th className="px-4 py-2">Presence</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((p) => (
                  <tr key={`${p.courseId}-${p.numDossard}`} className="hover:bg-[#8c9962]/5">
                    <td className="px-4 py-2 font-medium">{p.numDossard}</td>
                    <td className="px-4 py-2">{p.prenom}</td>
                    <td className="px-4 py-2">{p.nom}</td>
                    <td className="px-4 py-2">{p.genre}</td>
                    <td className="px-4 py-2">{p.aliasCategorie}</td>
                    {isDhCourse && (
                      <td className="px-4 py-2">
                        {p.typeVelo ? (
                          <span className="inline-flex rounded-full border px-2 py-0.5 text-xs font-medium bg-orange-50 text-orange-800 border-orange-200">
                            {BIKE_TYPE_LABELS[p.typeVelo]}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    )}
                    <td className="px-4 py-2">
                      <button
                        onClick={() => togglePresence(p)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition ${statusStyle(p.statut)}`}
                      >
                        {p.statut}
                      </button>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setEditError(null);
                          setEditTarget(p);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-[#8c9962]/10"
                        title="Modifier le participant"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Modifier
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ParticipantEditModal
        participant={editTarget}
        saving={editSaving}
        error={editError}
        onClose={closeEdit}
        onSubmit={submitEdit}
      />
    </section>
  );
};
