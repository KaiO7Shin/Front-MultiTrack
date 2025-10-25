import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Trophy,
  Medal,
  Filter,
  Download,
  Search,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import api from "../../lib/api";

const ACCENT = "#8c9962";

/* ===== Types ===== */
type ControlPoint = {
  pointId: number;
  numero: number;
  libelle: string;
  heurePassage: string | null;
};

type ApiRow = {
  rank: number | null;
  participantId: number;
  bibNumber: string;
  athleteName: string;
  categoryName: string;
  raceTime: string | null;
  status: string | null;
  controlPoints?: ControlPoint[];
};

type Row = {
  rank: number | null;
  participantId: number;
  dossard: string;
  nom: string;
  categorie: string;
  courseId: number;
  course: string;
  raceTime: string | null;
  status: string | null;
  controlPoints: ControlPoint[];
};

type UICategory = { id: number; alias: string };

const COURSES_FALLBACK: { id: number; label: string }[] = [
  { id: 1, label: "Trail 12K" },
  { id: 2, label: "Trail 35K" },
];

/* ===== Utils ===== */
function courseLabelOf(id: number, list: { id: number; label: string }[]) {
  return list.find((c) => c.id === id)?.label ?? `Course #${id}`;
}
function coerceArray(x: any): any[] {
  if (Array.isArray(x)) return x;
  if (x && typeof x === "object" && Array.isArray((x as any).data))
    return (x as any).data;
  return [];
}
function normalizeCourse(raw: any): { id: number; label: string } {
  const id = Number(raw?.id ?? raw?.raceId ?? 0);
  const label = String(
    raw?.name ?? raw?.label ?? raw?.title ?? `Course #${id}`
  );
  return { id, label };
}
function normalizeCategory(raw: any): UICategory {
  return { id: Number(raw?.id ?? 0), alias: String(raw?.alias ?? "") };
}
function toRow(raw: ApiRow, ctx: { raceId: number; raceLabel: string }): Row {
  const bibRaw = raw?.bibNumber ?? "";
  return {
    rank: raw?.rank ?? null,
    participantId: Number(raw?.participantId ?? 0),
    dossard: String(bibRaw),
    nom: String(raw?.athleteName ?? ""),
    categorie: String(raw?.categoryName ?? ""),
    courseId: ctx.raceId,
    course: ctx.raceLabel,
    raceTime: raw?.raceTime ?? null,
    status: raw?.status ?? null,
    controlPoints: Array.isArray(raw?.controlPoints) ? raw.controlPoints : [],
  };
}

/* ===== API calls ===== */
async function fetchRanking(
  raceId: number,
  params: { gender?: "Homme" | "Femme"; categoryId?: number },
  signal?: AbortSignal
): Promise<ApiRow[]> {
  const qs = new URLSearchParams();
  if (params.gender) qs.set("gender", params.gender);
  if (params.categoryId != null) qs.set("categoryId", String(params.categoryId));
  // If api.get supports signal, pass it; otherwise ignore
  const opts: any = {};
  if (signal) opts.signal = signal;
  const res = await api.get(`/races/${raceId}/ranking?${qs.toString()}`, opts);
  const payload = res?.data ?? {};
  return Array.isArray(payload?.data) ? (payload.data as ApiRow[]) : [];
}
async function fetchCourses(): Promise<{ id: number; label: string }[]> {
  const res = await api.get("/races");
  return coerceArray(res?.data).map(normalizeCourse);
}
async function fetchCategories(): Promise<UICategory[]> {
  const res = await api.get("/categories");
  return coerceArray(res?.data).map(normalizeCategory);
}

/* ===== Page ===== */
export const LeaderboardPage: React.FC = () => {
  const [courseId, setCourseId] = useState<number | "all">(1);
  const [gender, setGender] = useState<"all" | "Homme" | "Femme">("all");
  const [categoryId, setCategoryId] = useState<number | "" | null>("");
  const [searchBib, setSearchBib] = useState("");

  const [courses, setCourses] = useState<{ id: number; label: string }[]>(
    COURSES_FALLBACK
  );
  const [categories, setCategories] = useState<UICategory[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // expanded set (participantId -> boolean)
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  /* Load courses & categories once */
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [cRes, catRes] = await Promise.allSettled([
          fetchCourses(),
          fetchCategories(),
        ]);
        if (!mounted) return;
        if (cRes.status === "fulfilled" && cRes.value.length) setCourses(cRes.value);
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

  /* Load ranking when filters change; use AbortController to avoid races */
  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setErr(null);
        if (courseId === "all") {
          setRows([]);
          return;
        }
        const apiRows = await fetchRanking(
          courseId as number,
          {
            gender: gender === "all" ? undefined : gender,
            categoryId:
              categoryId === "" || categoryId == null ? undefined : Number(categoryId),
          },
          controller.signal
        );
        if (!mounted) return;
        const raceLabel = courseLabelOf(courseId as number, courses);
        setRows(apiRows.map((r) => toRow(r, { raceId: courseId as number, raceLabel })));
        setExpanded({}); // close accordion on new data
      } catch (e: any) {
        if (!mounted) return;
        if (e?.name === "AbortError") return;
        setErr(e?.message || "Erreur de chargement du classement");
        setRows([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [courseId, gender, categoryId, courses]);

  /* Debounce search for UX */
  const [debouncedSearch, setDebouncedSearch] = useState(searchBib);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchBib), 200);
    return () => clearTimeout(t);
  }, [searchBib]);

  /* Filtered rows by dossard */
  const filteredRows = useMemo(() => {
    const term = debouncedSearch.trim();
    if (!term) return rows;
    return rows.filter((r) => r.dossard.includes(term));
  }, [rows, debouncedSearch]);

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

  /* Safe date formatting helper */
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

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Classement</h1>
          <p className="text-sm text-slate-500">
            {loading ? "Chargement..." : "Résultats provisoires (à homologuer)"}
            {err ? ` — ${err}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="rounded-xl border px-4 py-2 text-sm hover:bg-[#8c9962]/10"
            aria-label="Exporter en PDF"
          >
            <Download className="inline-block h-4 w-4 mr-2" />
            Exporter PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Filter className="h-4 w-4" />
          <span>Filtres</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            className="rounded-lg border px-2 py-1 text-sm focus:ring-2 focus:ring-[#8c9962]/30"
            value={String(courseId)}
            onChange={(e) => setCourseId(e.target.value === "all" ? "all" : Number(e.target.value))}
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
            className="rounded-lg border px-2 py-1 text-sm focus:ring-2 focus:ring-[#8c9962]/30"
            value={gender}
            onChange={(e) => setGender(e.target.value as "all" | "Homme" | "Femme")}
            aria-label="Filtrer par genre"
          >
            <option value="all">Tous genres</option>
            <option value="Homme">Homme</option>
            <option value="Femme">Femme</option>
          </select>

          <select
            className="rounded-lg border px-2 py-1 text-sm focus:ring-2 focus:ring-[#8c9962]/30"
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

          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher dossard..."
              value={searchBib}
              onChange={(e) => setSearchBib(e.target.value)}
              className="pl-8 rounded-lg border px-2 py-1 text-sm focus:ring-2 focus:ring-[#8c9962]/30"
              aria-label="Rechercher dossard"
            />
          </div>
        </div>
      </div>

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
                <Th>Nom</Th>
                <Th>Catégorie</Th>
                <Th>Course</Th>
                <Th>Temps</Th>
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
                      <Td>{r.nom}</Td>
                      <Td>{r.categorie}</Td>
                      <Td>{r.course}</Td>
                      <Td className="tabular-nums">{r.raceTime ?? "—"}</Td>
                      <Td>{r.status ?? "—"}</Td>
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
                      <td colSpan={8} className="px-4 py-3 text-sm text-slate-700">
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
              <div key={r.participantId} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 font-semibold">
                      {r.rank ?? "—"}
                    </span>
                    <div>
                      <div className="text-sm font-medium">{r.nom}</div>
                      <div className="text-xs text-slate-500">
                        Dossard {r.dossard} · {r.course}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
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
    <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div
          className="h-10 w-10 rounded-xl flex items-center justify-center border"
          style={{ borderColor: `${medal}66`, color: medal }}
          title={`#${rank}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-sm font-semibold">{row.nom}</div>
          <div className="text-xs text-slate-500">Dossard {row.dossard} · {row.course}</div>
        </div>
      </div>
      <div className="text-sm font-medium tabular-nums">{row.raceTime ?? "—"}</div>
    </div>
  );
}
