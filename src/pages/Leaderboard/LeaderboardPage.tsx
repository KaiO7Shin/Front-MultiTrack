import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Trophy,
  Medal,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type {
  BikeType,
  Course,
  DHPhaseRanking,
  EnduroPhaseRanking,
  Row,
  UICategory,
} from "../../lib/type";
import { BIKE_TYPE_LABELS, BIKE_TYPES } from "../../lib/type";
import {
  buildCumulatedPodiumGroups,
  buildPodiumGroups,
  courseLabelOf,
  formatParticipantName,
  isBikeCourse,
  toRow,
} from "@/lib/utils";
import { fetchCategories, fetchCourses, fetchCoursesDetailed, fetchRanking } from "@/services/courses";
import { ACCENT } from "@/lib/constants";
import { DHLeaderboard } from "./DHLeaderboard";
import { EnduroLeaderboard } from "./EnduroLeaderboard";
import { XCLeaderboard } from "./XCLeaderboard";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { ParticipantStatus } from "@/lib/type";
import {
  PARTICIPANT_STATUSES,
  PARTICIPANT_STATUS_LABELS,
  statusLabel,
} from "@/pages/Participants/participantStatus";

const COURSES_FALLBACK: { id: number; label: string }[] = [
  { id: 1, label: "Trail 12K" },
  { id: 2, label: "Trail 35K" },
];

function formatGenderClt(rank: number | null | undefined, genre?: "Homme" | "Femme") {
  if (rank == null) return "—";
  const letter = genre === "Femme" ? "F" : genre === "Homme" ? "H" : "";
  return letter ? `${rank} ${letter}` : String(rank);
}

function formatCategoryClt(rank: number | null | undefined, alias?: string) {
  if (rank == null) return "—";
  const cat = (alias ?? "").trim();
  return cat ? `${rank} ${cat}` : String(rank);
}

export const LeaderboardPage: React.FC = () => {
  const [courseId, setCourseId] = useState<number | "all">(1);
  const [gender, setGender] = useState<"all" | "Homme" | "Femme">("all");
  const [categoryId, setCategoryId] = useState<number | "" | null>("");
  const [searchBib, setSearchBib] = useState("");
  const [bikeType, setBikeType] = useState<"all" | BikeType>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | ParticipantStatus>("all");
  const [cumulMode, setCumulMode] = useState<"sans_cumul" | "avec_cumul">("sans_cumul");

  const [courses, setCourses] = useState<{ id: number; label: string }[]>(
    COURSES_FALLBACK
  );
  const [coursesDetailed, setCoursesDetailed] = useState<Course[]>([]);
  const [categories, setCategories] = useState<UICategory[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // expanded set (participantId -> boolean)
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [dhExportCtx, setDhExportCtx] = useState<{
    data: DHPhaseRanking | null;
    view: "scratch" | "category";
  }>({ data: null, view: "scratch" });

  const handleDhExportContextChange = useCallback(
    (ctx: { data: DHPhaseRanking | null; view: "scratch" | "category" }) => {
      setDhExportCtx(ctx);
    },
    []
  );

  const [enduroExportCtx, setEnduroExportCtx] = useState<{
    data: EnduroPhaseRanking | null;
    view: "scratch" | "category";
  }>({ data: null, view: "scratch" });

  const handleEnduroExportContextChange = useCallback(
    (ctx: { data: EnduroPhaseRanking | null; view: "scratch" | "category" }) => {
      setEnduroExportCtx(ctx);
    },
    []
  );

  const formatDateTime = useCallback((raw?: string | null) => {
    if (!raw) return "—";
    try {
      const d = new Date(raw);
      if (isNaN(d.getTime())) return raw;
      return d.toLocaleString("fr-FR", { hour12: false });
    } catch {
      return raw;
    }
  }, []);

const exportGeneralPdf = () => {
  if (!rows.length) return;

  const courseName = rows[0]?.course ?? "";
  const doc = new jsPDF("p", "mm", "a4");

  /* =========================
     Header
  ========================= */

  // Titre principal
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Classement officiel", 14, 18);

  // Sous-titre (course)
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(courseName, 14, 26);

  // Ligne de séparation
  doc.setDrawColor(180);
  doc.line(14, 30, 196, 30);

  /* =========================
     Tableau
  ========================= */

  autoTable(doc, {
    startY: 34,

    head: [[
      "Rang",
      "Dossard",
      "Nom et prénom",
      "Cat",
      "Temps",
      "Clt Genre",
      "Clt Cat",
      "Statut",
    ]],

    body: filteredRows.map((r) => [
      r.rank ?? "—",
      r.dossard,
      formatParticipantName(r.prenom, r.nom),
      r.categorie ?? "—",
      r.raceTime ?? "—",
      formatGenderClt(r.genderRank, r.genre),
      formatCategoryClt(r.categoryRank, r.categorie),
      statusLabel(r.status),
    ]),

    styles: {
      fontSize: 9,
      cellPadding: 3,
      valign: "middle",
      overflow: "linebreak", 
    },

    headStyles: {
      fillColor: [140, 153, 98], 
      textColor: 255,
      fontStyle: "bold",
      halign: "center",          
      valign: "middle",          
      cellPadding: { top: 3, bottom: 3, left: 2, right: 2 },
    },

    alternateRowStyles: {
      fillColor: [245, 247, 242],
    },

    columnStyles: {
      0: { halign: "center", cellWidth: 12 },
      1: { halign: "center", cellWidth: 18 },
      2: { cellWidth: 42 },
      3: { halign: "center", cellWidth: 18 },
      4: { halign: "center", cellWidth: 20 },
      5: { halign: "center", cellWidth: 22 },
      6: { halign: "center", cellWidth: 28 },
      7: { halign: "center", cellWidth: 22 },
    },

    didParseCell: (data) => {
      const r = filteredRows[data.row.index];
      if (!r) return;

      const category = (r.categorie ?? "").toUpperCase();
      // const status = (r.status ?? "").toLowerCase();

      if (category.endsWith("F")) {
        data.cell.styles.fillColor = [255, 230, 235];
      }

    },
  });

  /* =========================
     Footer (toutes les pages)
  ========================= */

  const pageCount = doc.getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120);

    doc.text(
      `Page ${i} / ${pageCount}`,
      196,
      doc.internal.pageSize.getHeight() - 5,
      { align: "right" }
    );

    doc.text(
      "© Multitrack – Tous droits réservés",
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  doc.save(`classement-${courseName}.pdf`);
};

  const exportDhRankingPdf = () => {
    const { data, view } = dhExportCtx;
    if (!data) return;

    const base =
      view === "scratch"
        ? data.scratch
        : data.byCategory.flatMap((g) => g.rows);

    const term = debouncedSearch.trim();
    const exportRows = term
      ? base.filter((r) => r.dossard.includes(term))
      : base;

    if (!exportRows.length) return;

    const courseName = selectedCourse?.name ?? "";
    const mancheLabels =
      exportRows[0]?.mancheTimes.map((mt) => mt.mancheLabel) ?? [];

    const doc = new jsPDF("l", "mm", "a4");

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Classement DH", 14, 16);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`${courseName} — ${data.phaseLabel}`, 14, 24);
    doc.text(
      view === "scratch" ? "Vue scratch" : "Vue par catégorie",
      14,
      30
    );

    doc.setDrawColor(180);
    doc.line(14, 34, 283, 34);

    const head = [
      "Rang",
      "Dossard",
      "Prénom",
      "Nom",
      "Cat.",
      "Type vélo",
      "Meilleur temps",
      ...mancheLabels,
      "Statut",
    ];

    autoTable(doc, {
      startY: 38,
      head: [head],
      body: exportRows.map((r) => [
        (view === "scratch" ? r.rankScratch : r.rankCategory) ?? "—",
        r.dossard,
        r.prenom,
        r.nom,
        r.categorie,
        r.typeVelo ? BIKE_TYPE_LABELS[r.typeVelo] : "—",
        r.bestTimeFormatted ?? "—",
        ...r.mancheTimes.map((mt) => mt.timeFormatted ?? "—"),
        r.disqualified ? "DQ" : "—",
      ]),
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [140, 153, 98],
        textColor: 255,
        fontStyle: "bold",
        halign: "center",
      },
      alternateRowStyles: {
        fillColor: [245, 247, 242],
      },
    });

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(120);
      doc.text(
        `Page ${i} / ${pageCount}`,
        283,
        doc.internal.pageSize.getHeight() - 5,
        { align: "right" }
      );
    }

    doc.save(`classement-dh-${courseName}.pdf`);
  };

  const exportEnduroRankingPdf = () => {
    const { data, view } = enduroExportCtx;
    if (!data) return;

    const base =
      view === "scratch" ? data.scratch : data.byCategory.flatMap((g) => g.rows);

    const term = debouncedSearch.trim();
    const exportRows = term ? base.filter((r) => r.dossard.includes(term)) : base;

    if (!exportRows.length) return;

    const courseName = selectedCourse?.name ?? "";
    const mancheLabels = exportRows[0]?.mancheTimes.map((mt) => mt.mancheLabel) ?? [];

    const doc = new jsPDF("l", "mm", "a4");

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Classement Enduro", 14, 16);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`${courseName} — ${data.phaseLabel}`, 14, 24);
    doc.text(view === "scratch" ? "Vue scratch" : "Vue par catégorie", 14, 30);

    doc.setDrawColor(180);
    doc.line(14, 34, 283, 34);

    const head = [
      "Rang",
      "Dossard",
      "Prénom",
      "Nom",
      "Cat.",
      "Type vélo",
      "Spéciales",
      "Temps cumulé",
      "Temps total",
      ...mancheLabels,
      "Statut",
    ];

    autoTable(doc, {
      startY: 38,
      head: [head],
      body: exportRows.map((r) => [
        (view === "scratch" ? r.rankScratch : r.rankCategory) ?? "—",
        r.dossard,
        r.prenom,
        r.nom,
        r.categorie,
        r.typeVelo ? BIKE_TYPE_LABELS[r.typeVelo] : "—",
        `${r.completedManches}/${r.totalManches}`,
        r.totalTimeFormatted ?? "—",
        r.elapsedTimeFormatted ?? "—",
        ...r.mancheTimes.map((mt) => mt.timeFormatted ?? "—"),
        r.disqualified ? "DQ" : "—",
      ]),
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [140, 153, 98],
        textColor: 255,
        fontStyle: "bold",
        halign: "center",
      },
      alternateRowStyles: {
        fillColor: [245, 247, 242],
      },
    });

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(120);
      doc.text(
        `Page ${i} / ${pageCount}`,
        283,
        doc.internal.pageSize.getHeight() - 5,
        { align: "right" }
      );
    }

    doc.save(`classement-enduro-${courseName}.pdf`);
  };

  const exportCumulatedPodiumPdf = () => {
    if (!rows.length) return;

    const courseName = rows[0]?.course ?? "";
    const doc = new jsPDF("p", "mm", "a4");

    doc.setFontSize(16);
    doc.text(`Podiums cumulés – ${courseName}`, 14, 20);

    const groups = buildCumulatedPodiumGroups(rows);
    let y = 30;

    groups.forEach(group => {
      if (group.rows.length === 0) return;

      doc.setFontSize(13);
      doc.text(group.title, 14, y);
      y += 6;

      autoTable(doc, {
        startY: y,
        head: [],
        body: group.rows.map((r, i) => [
          i + 1,
          r.dossard,
          r.prenom,
          r.nom,
          r.categorie,
          r.raceTime ?? "—",
        ]),
        styles: { fontSize: 9 },
        didParseCell: (data) => {
          if (data.row.index === 0) data.cell.styles.fillColor = [255, 236, 179];
          if (data.row.index === 1) data.cell.styles.fillColor = [230, 230, 230];
          if (data.row.index === 2) data.cell.styles.fillColor = [235, 216, 199];
        },
      });

      y = (doc as any).lastAutoTable.finalY + 10;
    });

    doc.save(`podiums-cumules-${courseName}.pdf`);
  };

  const exportPodiumPdf = () => {
    if (!rows.length) return;

    const courseName = rows[0]?.course ?? "";

    const doc = new jsPDF("p", "mm", "a4");

    doc.setFontSize(16);
    doc.text(`Podiums – ${courseName}`, 14, 20);

    const groups = buildPodiumGroups(rows);

    let y = 30;

    groups.forEach((group) => {
      doc.setFontSize(13);
      doc.text(group.title, 14, y);
      y += 6;

      autoTable(doc, {
        startY: y,
        head: [],
        body: group.rows.map((r, i) => [
          i + 1,
          r.dossard,
          r.prenom,
          r.nom,
          r.categorie,
          r.raceTime ?? "—",
        ]),
        styles: { fontSize: 9 },
        didParseCell: (data) => {
        if (data.row.index === 0) data.cell.styles.fillColor = [255, 236, 179]; // 🥇 or pastel
        if (data.row.index === 1) data.cell.styles.fillColor = [230, 230, 230]; // 🥈 gris clair
        if (data.row.index === 2) data.cell.styles.fillColor = [235, 216, 199]; // 🥉 bronze clair
      },
      });

      y = (doc as any).lastAutoTable.finalY + 10;
    });

    doc.save(`podiums-${courseName}.pdf`);
  };

  const selectedCourse = useMemo(
    () => coursesDetailed.find((c) => c.id === courseId),
    [coursesDetailed, courseId]
  );
  const courseType = selectedCourse?.type;

  const loadRanking = useCallback(async () => {
    if (!courseType || courseId === "all" || courseType !== "TRAIL") {
      setRows([]);
      setErr(null);
      return;
    }

    const controller = new AbortController();

    try {
      setLoading(true);
      setErr(null);

      const apiRows = await fetchRanking(
        courseId as number,
        {
          gender: gender === "all" ? undefined : gender,
          categoryId:
            categoryId === "" || categoryId == null ? undefined : Number(categoryId),
        },
        controller.signal
      );

      const raceLabel = courseLabelOf(courseId as number, courses);
      setRows(apiRows.map((r) => toRow(r, { raceId: courseId as number, raceLabel })));
      setExpanded({});
    } catch (e: any) {
      if (e?.name !== "AbortError") {
        setErr(e?.message || "Erreur de chargement du classement");
        setRows([]);
      }
    } finally {
      setLoading(false);
    }
  }, [courseId, gender, categoryId, courses, courseType]);

  const canExportTrail = courseType === "TRAIL" && rows.length > 0;
  const canExportDh =
    courseType === "DH" && (dhExportCtx.data?.scratch.length ?? 0) > 0;
  const canExportEnduro =
    courseType === "ENDURO" && (enduroExportCtx.data?.scratch.length ?? 0) > 0;

  const handleExportRanking = () => {
    if (courseType === "DH") {
      exportDhRankingPdf();
      return;
    }
    if (courseType === "ENDURO") {
      exportEnduroRankingPdf();
      return;
    }
    exportGeneralPdf();
  };


  /* Load courses & categories once */
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [cRes, cDetRes, catRes] = await Promise.allSettled([
          fetchCourses(),
          fetchCoursesDetailed(),
          fetchCategories(),
        ]);
        if (!mounted) return;
        if (cRes.status === "fulfilled" && cRes.value.length) setCourses(cRes.value);
        if (cDetRes.status === "fulfilled") setCoursesDetailed(cDetRes.value);
        if (catRes.status === "fulfilled") setCategories(catRes.value);
      } catch (e) {
        if (!mounted) return;
        setErr("Impossible de charger courses/catégories.");
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    loadRanking();
  }, [loadRanking]);


  /* Debounce search for UX */
  const [debouncedSearch, setDebouncedSearch] = useState(searchBib);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchBib), 200);
    return () => clearTimeout(t);
  }, [searchBib]);

  /* Filtered rows by dossard + statut ; Clt Cat selon mode cumul */
  const filteredRows = useMemo(() => {
    let base = rows;
    if (statusFilter !== "all") {
      base = base.filter((r) => (r.status ?? "") === statusFilter);
    }
    const term = debouncedSearch.trim();
    if (term) {
      base = base.filter((r) => r.dossard.includes(term));
    }
    if (cumulMode === "avec_cumul") return base;

    // Sans cumul : les scratch H/F (top 3 finishers par genre) n'ont pas de rang catégorie
    const finishers = rows.filter((r) =>
      (r.status ?? "").toLowerCase().includes("finish")
    );
    const scratchIds = new Set<number>([
      ...finishers.filter((r) => r.categorie.endsWith("H")).slice(0, 3).map((r) => r.participantId),
      ...finishers.filter((r) => r.categorie.endsWith("F")).slice(0, 3).map((r) => r.participantId),
    ]);

    const categoryCounters: Record<string, number> = {};
    const categoryRankById = new Map<number, number | null>();
    for (const r of finishers) {
      if (scratchIds.has(r.participantId)) {
        categoryRankById.set(r.participantId, null);
        continue;
      }
      const key = r.categorie || "";
      categoryCounters[key] = (categoryCounters[key] ?? 0) + 1;
      categoryRankById.set(r.participantId, categoryCounters[key]);
    }

    return base.map((r) =>
      categoryRankById.has(r.participantId)
        ? { ...r, categoryRank: categoryRankById.get(r.participantId) ?? null }
        : r
    );
  }, [rows, debouncedSearch, statusFilter, cumulMode]);

  /* Podium should be from full ranking */
  const podium = useMemo(() => rows.slice(0, 3), [rows]);

  /* Finishers detection robust FR/EN */
  const FINISH_STATUS_PATTERNS = useMemo(
    () => [/^finish/i, /^arriv/i, /^arrivé/i, /^finished/i, /^finis/i],
    []
  );
  const finishers = useMemo(
    () =>
      filteredRows.filter((r) => {
        const s = (r.status ?? "").trim();
        return FINISH_STATUS_PATTERNS.some((p) => p.test(s));
      }).length,
    [filteredRows, FINISH_STATUS_PATTERNS]
  );

  /* Handlers */
  const toggleExpanded = useCallback((participantId: number) => {
    setExpanded((prev) => ({ ...prev, [participantId]: !prev[participantId] }));
  }, []);

  return (
    <section className="page-section">
      {/* Header */}
      <div className="page-header">
        <div className="min-w-0">
          <h1 className="page-title">Classement</h1>
          <p className="page-subtitle">
            {loading ? "Chargement..." : "Résultats provisoires (à homologuer)"}
            {selectedCourse && courseType && courseType !== "TRAIL" && (
              <span className="ml-1">— Mode {courseType}</span>
            )}
            {err ? ` — ${err}` : ""}
          </p>
        </div>
        <div className="page-actions">
        <button
          onClick={loadRanking}
          disabled={loading || courseType !== "TRAIL"}
          className="rounded-xl border px-4 py-2 text-sm flex items-center gap-2 hover:bg-[#8c9962]/10 disabled:opacity-50"
        >
          <svg
            className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 12a9 9 0 1 1-2.64-6.36" />
            <polyline points="21 3 21 9 15 9" />
          </svg>
          Rafraîchir
        </button>

          <button
            onClick={handleExportRanking}
            disabled={!canExportTrail && !canExportDh && !canExportEnduro}
            title="Exporter le classement général"
            className="btn-secondary px-4 py-2 text-sm disabled:opacity-40"
          >
            <img src="/pdf.svg" alt="" className="h-4 w-4" aria-hidden />
            Général
          </button>

          <button
            onClick={exportPodiumPdf}
            disabled={!canExportTrail}
            title="Exporter le podium"
            className="btn-secondary px-4 py-2 text-sm disabled:opacity-40"
          >
            <img src="/pdf.svg" alt="" className="h-4 w-4" aria-hidden />
            Podium
          </button>

          <button
            onClick={exportCumulatedPodiumPdf}
            disabled={!canExportTrail}
            title="Exporter le podium cumulé"
            className="btn-secondary px-4 py-2 text-sm disabled:opacity-40"
          >
            <img src="/pdf.svg" alt="" className="h-4 w-4" aria-hidden />
            Podium cumulé
          </button>

        </div>
      </div>

      {/* Filters */}
      <div className="filter-panel">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Filter className="h-4 w-4" />
          <span>Filtres</span>
        </div>
        <div className="filter-fields !grid-cols-1 sm:!grid-cols-2 lg:!grid-cols-3 xl:!grid-cols-6">
          <select
            className="w-full rounded-lg border px-2 py-2 text-sm focus:ring-2 focus:ring-[#8c9962]/30"
            value={String(courseId)}
            onChange={(e) => {
              setCourseId(e.target.value === "all" ? "all" : Number(e.target.value));
              setBikeType("all");
            }}
            aria-label="Sélectionner une course"
          >
            <option value="all" disabled>
              Sélectionne une course…
            </option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>

          <select
            className="w-full rounded-lg border px-2 py-2 text-sm focus:ring-2 focus:ring-[#8c9962]/30"
            value={gender}
            onChange={(e) => setGender(e.target.value as "all" | "Homme" | "Femme")}
            aria-label="Filtrer par genre"
          >
            <option value="all">Tous genres</option>
            <option value="Homme">Homme</option>
            <option value="Femme">Femme</option>
          </select>

          <select
            className="w-full rounded-lg border px-2 py-2 text-sm focus:ring-2 focus:ring-[#8c9962]/30"
            value={String(categoryId ?? "")}
            onChange={(e) => {
              const v = e.target.value;
              setCategoryId(v === "" ? "" : Number(v));
            }}
            aria-label="Filtrer par catégorie"
          >
            <option value="">Toutes catégories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.alias}
              </option>
            ))}
          </select>

          <select
            className="w-full rounded-lg border px-2 py-2 text-sm focus:ring-2 focus:ring-[#8c9962]/30"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value === "all"
                  ? "all"
                  : (e.target.value as ParticipantStatus)
              )
            }
            aria-label="Filtrer par statut"
          >
            <option value="all">Tous les statuts</option>
            {PARTICIPANT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {PARTICIPANT_STATUS_LABELS[status]}
              </option>
            ))}
          </select>

          <select
            className="w-full rounded-lg border px-2 py-2 text-sm focus:ring-2 focus:ring-[#8c9962]/30"
            value={cumulMode}
            onChange={(e) =>
              setCumulMode(e.target.value as "sans_cumul" | "avec_cumul")
            }
            aria-label="Mode de cumul des résultats"
          >
            <option value="sans_cumul">Sans cumul</option>
            <option value="avec_cumul">Avec cumul</option>
          </select>

          {isBikeCourse(courseType) && (
            <select
              className="w-full rounded-lg border px-2 py-2 text-sm focus:ring-2 focus:ring-[#8c9962]/30"
              value={bikeType}
              onChange={(e) =>
                setBikeType(e.target.value as "all" | BikeType)
              }
              aria-label="Filtrer par type de vélo"
            >
              <option value="all">Tous types de vélo</option>
              {BIKE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {BIKE_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          )}

          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher dossard..."
              value={searchBib}
              onChange={(e) => setSearchBib(e.target.value)}
              className="w-full pl-8 rounded-lg border px-2 py-2 text-sm focus:ring-2 focus:ring-[#8c9962]/30"
              aria-label="Rechercher dossard"
            />
          </div>
        </div>
      </div>

      {courseType === "DH" && courseId !== "all" && (
        <DHLeaderboard
          courseId={courseId as number}
          courseName={selectedCourse?.name ?? ""}
          gender={gender}
          categoryId={categoryId}
          categories={categories}
          searchBib={debouncedSearch}
          bikeType={bikeType}
          onExportContextChange={handleDhExportContextChange}
        />
      )}

      {courseType === "ENDURO" && courseId !== "all" && (
        <EnduroLeaderboard
          courseId={courseId as number}
          courseName={selectedCourse?.name ?? ""}
          gender={gender}
          categoryId={categoryId}
          categories={categories}
          searchBib={debouncedSearch}
          bikeType={bikeType}
          onExportContextChange={handleEnduroExportContextChange}
        />
      )}

      {courseType === "XC" && courseId !== "all" && (
        <XCLeaderboard
          courseId={courseId as number}
          courseName={selectedCourse?.name ?? ""}
          gender={gender}
          categoryId={categoryId}
          categories={categories}
          searchBib={debouncedSearch}
        />
      )}

      {courseType === "TRAIL" && (
        <>
      {/* Podium */}
      <div className="grid gap-4 sm:grid-cols-3">
        {podium.length === 0 ? (
          <div className="sm:col-span-3 text-sm text-slate-500 bg-white border border-slate-200 rounded-2xl p-4">
            Aucun résultat pour l’instant.
          </div>
        ) : (
          podium.map((r, i) => (
            <PodiumCard key={`${r.courseId}-${r.participantId}`} row={r} rank={(i + 1) as 1 | 2 | 3} />
          ))
        )}
      </div>

      <div id="print-podium" className="hidden print:block">
  <h1 className="text-2xl font-bold mb-6">
    Résultats Officiels – {rows[0]?.course}
  </h1>

  {(cumulMode === "avec_cumul"
    ? buildCumulatedPodiumGroups(rows)
    : buildPodiumGroups(rows)
  ).map((group, i) => (
    <div key={i} className="mb-6 break-inside-avoid">
      <h2 className="text-lg font-semibold mb-2">{group.title}</h2>

      <table className="w-full text-sm border">
        <thead>
          <tr className="border-b">
            <th>#</th>
            <th>Dossard</th>
            <th>Prénom</th>
            <th>Nom</th>
            <th>Catégorie</th>
            <th>Temps</th>
          </tr>
        </thead>
        <tbody>
          {group.rows.map((r, idx) => (
            <tr key={r.participantId}>
              <td>{idx + 1}</td>
              <td>{r.dossard}</td>
              <td>{r.prenom}</td>
              <td>{r.nom}</td>
              <td>{r.categorie}</td>
              <td>{r.raceTime}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ))}
</div>


      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 bg-slate-50">
          <div className="text-sm text-slate-600">
            {finishers} finisher{finishers > 1 ? "s" : ""} / {filteredRows.length} participants
          </div>
        </div>

        <div className="hidden md:block overflow-auto max-h-[70vh]">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-white">
              <tr className="text-left border-b">
                <Th>#</Th>
                <Th>Dossard</Th>
                <Th>Nom et prénom</Th>
                <Th>Catégorie</Th>
                <Th>Temps</Th>
                <Th>Clt Genre</Th>
                <Th>Clt Cat</Th>
                <Th>Statut</Th>
                <Th></Th>
              </tr>
            </thead>

            {/* SINGLE TBODY (correct HTML) */}
            <tbody className="divide-y">
              {filteredRows.map((r) => {
                const isOpen = !!expanded[r.participantId];
                return (
                  <React.Fragment key={r.participantId}>
                    <tr className="hover:bg-[#8c9962]/5">
                      <Td className="font-medium">{r.rank ?? "—"}</Td>
                      <Td className="font-medium tabular-nums">{r.dossard}</Td>
                      <Td>{formatParticipantName(r.prenom, r.nom)}</Td>
                      <Td>{r.categorie || "—"}</Td>
                      <Td className="tabular-nums">{r.raceTime ?? "—"}</Td>
                      <Td className="tabular-nums">
                        {formatGenderClt(r.genderRank, r.genre)}
                      </Td>
                      <Td className="tabular-nums">
                        {formatCategoryClt(r.categoryRank, r.categorie)}
                      </Td>
                      <Td>{statusLabel(r.status)}</Td>
                      <Td className="px-4 py-2 text-right">
                        <button
                          onClick={() => toggleExpanded(r.participantId)}
                          aria-expanded={isOpen}
                          aria-controls={`details-${r.participantId}`}
                          className="p-1 rounded"
                        >
                          {isOpen ? <ChevronUp className="h-4 w-4 inline-block" /> : <ChevronDown className="h-4 w-4 inline-block" />}
                        </button>
                      </Td>
                    </tr>

                    {/* details row */}
                    <tr
                      id={`details-${r.participantId}`}
                      className="bg-slate-50"
                      // Keep the details row always present in DOM for table integrity
                    >
                      <td colSpan={9} className="px-4 py-3 text-sm text-slate-700">
                        <div
                          // simple collapse effect using maxHeight + overflow
                          style={{
                            transition: "max-height 220ms ease",
                            maxHeight: isOpen ? 400 : 0,
                            overflow: "hidden",
                          }}
                        >
                          <div className="space-y-2">
                            <div className="text-xs text-slate-500">Points de contrôle</div>

                            {r.controlPoints.length === 0 ? (
                              <div className="text-sm text-slate-500">Aucun point de contrôle enregistré.</div>
                            ) : (
                              <div className="overflow-auto">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="text-left text-xs text-slate-500">
                                      <th className="py-1 pr-4">#</th>
                                      <th className="py-1 pr-4">Libellé</th>
                                      <th className="py-1 pr-4">Heure de passage</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {r.controlPoints.map((cp) => (
                                      <tr key={cp.pointId} className="border-t">
                                        <td className="py-2 pr-4 tabular-nums">{cp.numero}</td>
                                        <td className="py-2 pr-4">{cp.libelle}</td>
                                        <td className="py-2 pr-4 tabular-nums">{formatDateTime(cp.heurePassage)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile list */}
        <div className="md:hidden divide-y">
          {filteredRows.map((r) => {
            const isOpen = !!expanded[r.participantId];
            return (
              <div key={r.participantId} className="p-4 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="inline-flex items-center justify-center w-8 h-8 shrink-0 rounded-lg bg-slate-100 font-semibold">
                      {r.rank ?? "—"}
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">
                        {formatParticipantName(r.prenom, r.nom)}
                      </div>
                      <div className="text-xs text-slate-500 break-words">
                        Dossard {r.dossard} · {r.categorie || "—"} ·{" "}
                        {statusLabel(r.status)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-sm font-medium tabular-nums">{r.raceTime ?? "—"}</div>
                    <button
                      className="p-1 rounded"
                      onClick={() => toggleExpanded(r.participantId)}
                      aria-label={isOpen ? "Fermer détails" : "Voir détails"}
                    >
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="mt-2 text-xs text-slate-700">
                    <div className="text-xs text-slate-500 mb-2">Points de contrôle</div>
                    {r.controlPoints.length === 0 ? (
                      <div className="text-sm text-slate-500">Aucun point de contrôle enregistré.</div>
                    ) : (
                      <ul className="space-y-2">
                        {r.controlPoints.map((cp) => (
                          <li key={cp.pointId} className="flex justify-between">
                            <div>
                              <div className="font-medium text-sm">PC{cp.numero} — {cp.libelle}</div>
                              <div className="text-xs text-slate-500">{formatDateTime(cp.heurePassage)}</div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
        </>
      )}
    </section>
  );
};

/* ---------- Helpers components ---------- */
function Th({ children }: { children?: React.ReactNode }) {
  return <th className="px-4 py-2 text-slate-500 text-xs uppercase tracking-wide">{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-2 ${className}`}>{children}</td>;
}

/* Podium card (unchanged) */
function PodiumCard({ row, rank }: { row: Row; rank: 1 | 2 | 3 }) {
  const medal = rank === 1 ? ACCENT : rank === 2 ? "#cbd5e1" : "#d4a373";
  const Icon = rank === 1 ? Trophy : Medal;
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div
          className="h-10 w-10 rounded-xl flex items-center justify-center border"
          style={{ borderColor: `${medal}66`, color: medal }}
          title={`#${rank}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-sm font-semibold">{row.prenom || row.nom}</div>
          <div className="text-xs text-slate-500">
            {row.prenom && row.nom ? `${row.nom} · ` : ""}
            Dossard {row.dossard} · {row.course}
          </div>
        </div>
      </div>
      <div className="text-sm font-medium tabular-nums">{row.raceTime ?? "—"}</div>
    </div>
  );
}
