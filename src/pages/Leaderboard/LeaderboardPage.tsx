import { useEffect, useMemo, useState } from "react";
import { Trophy, Medal, Filter, Download, Search } from "lucide-react";
import api from "../../lib/api";

const ACCENT = "#8c9962";

/* ===== Types ===== */
type ApiRow = {
  rank: number | null;
  participantId: number;
  bibNumber: string;
  athleteName: string;
  categoryName: string;
  raceTime: string | null;
  status: string | null;
};

type Row = {
  rank: number | null;
  dossard: number;
  nom: string;
  categorie: string;
  courseId: number;
  course: string;
  raceTime: string | null;
  status: string | null;
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
  if (x && typeof x === "object" && Array.isArray((x as any).data)) return (x as any).data;
  return [];
}
function normalizeCourse(raw: any): { id: number; label: string } {
  const id = Number(raw?.id ?? raw?.raceId ?? 0);
  const label = String(raw?.name ?? raw?.label ?? raw?.title ?? `Course #${id}`);
  return { id, label };
}
function normalizeCategory(raw: any): UICategory {
  return { id: Number(raw?.id ?? 0), alias: String(raw?.alias ?? "") };
}
function toRow(raw: ApiRow, ctx: { raceId: number; raceLabel: string }): Row {
  const bib = Number(raw?.bibNumber ?? 0);
  return {
    rank: raw?.rank ?? null,
    dossard: Number.isFinite(bib) ? bib : 0,
    nom: String(raw?.athleteName ?? ""),
    categorie: String(raw?.categoryName ?? ""),
    courseId: ctx.raceId,
    course: ctx.raceLabel,
    raceTime: raw?.raceTime ?? null,
    status: raw?.status ?? null,
  };
}

/* ===== API calls ===== */
async function fetchRanking(
  raceId: number,
  params: { gender?: "Homme" | "Femme"; categoryId?: number }
): Promise<ApiRow[]> {
  const qs = new URLSearchParams();
  if (params.gender) qs.set("gender", params.gender);
  if (params.categoryId != null) qs.set("categoryId", String(params.categoryId));
  const res = await api.get(`/races/${raceId}/ranking?${qs.toString()}`);
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
export const LeaderboardPage = () => {
  const [courseId, setCourseId] = useState<number | "all">(1);
  const [gender, setGender] = useState<"all" | "Homme" | "Femme">("all");
  const [categoryId, setCategoryId] = useState<number | "" | null>("");
  const [searchBib, setSearchBib] = useState("");

  const [courses, setCourses] = useState<{ id: number; label: string }[]>(COURSES_FALLBACK);
  const [categories, setCategories] = useState<UICategory[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // fetch races + categories
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [cList, catList] = await Promise.allSettled([
          fetchCourses(),
          fetchCategories(),
        ]);
        if (!mounted) return;
        if (cList.status === "fulfilled" && cList.value.length)
          setCourses(cList.value);
        if (catList.status === "fulfilled") setCategories(catList.value);
      } catch {}
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // fetch classement
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        if (courseId === "all") {
          setRows([]);
          return;
        }
        const apiRows = await fetchRanking(courseId, {
          gender: gender === "all" ? undefined : gender,
          categoryId: categoryId === "" || categoryId == null ? undefined : Number(categoryId),
        });
        if (!mounted) return;
        const raceLabel = courseLabelOf(courseId, courses);
        setRows(apiRows.map((r) => toRow(r, { raceId: courseId, raceLabel })));
      } catch (e: any) {
        if (!mounted) return;
        setErr(e?.message || "Erreur de chargement du classement");
        setRows([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [courseId, gender, categoryId, courses]);

  // filtre local par dossard
  const filteredRows = useMemo(() => {
    const term = searchBib.trim();
    if (!term) return rows;
    return rows.filter((r) => String(r.dossard).includes(term));
  }, [rows, searchBib]);

  const podium = useMemo(() => filteredRows.slice(0, 3), [filteredRows]);
  const finishers = filteredRows.filter((r) => (r.status ?? "").toLowerCase().startsWith("finish")).length;

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Classement</h1>
          <p className="text-sm text-slate-500">
            {loading ? "Chargement..." : "Résultats provisoires (à homologuer)"}{err ? ` — ${err}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="rounded-xl border px-4 py-2 text-sm hover:bg-[#8c9962]/10"
          >
            <Download className="inline-block h-4 w-4 mr-2" />
            Exporter PDF
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Filter className="h-4 w-4" />
          <span>Filtres</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Course */}
          <select
            className="rounded-lg border px-2 py-1 text-sm focus:ring-2 focus:ring-[#8c9962]/30"
            value={String(courseId)}
            onChange={(e) => setCourseId(e.target.value === "all" ? "all" : Number(e.target.value))}
          >
            <option value="all">Sélectionne une course…</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>

          {/* Genre */}
          <select
            className="rounded-lg border px-2 py-1 text-sm focus:ring-2 focus:ring-[#8c9962]/30"
            value={gender}
            onChange={(e) => setGender(e.target.value as "all" | "Homme" | "Femme")}
          >
            <option value="all">Tous genres</option>
            <option value="Homme">Homme</option>
            <option value="Femme">Femme</option>
          </select>

          {/* Catégorie */}
          <select
            className="rounded-lg border px-2 py-1 text-sm focus:ring-2 focus:ring-[#8c9962]/30"
            value={String(categoryId ?? "")}
            onChange={(e) => {
              const v = e.target.value;
              setCategoryId(v === "" ? "" : Number(v));
            }}
          >
            <option value="">Toutes catégories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.alias}
              </option>
            ))}
          </select>

          {/* Recherche dossard */}
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher dossard..."
              value={searchBib}
              onChange={(e) => setSearchBib(e.target.value)}
              className="pl-8 rounded-lg border px-2 py-1 text-sm focus:ring-2 focus:ring-[#8c9962]/30"
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
            <PodiumCard key={`${r.courseId}-${r.dossard}`} row={r} rank={(i + 1) as 1 | 2 | 3} />
          ))
        )}
      </div>

      {/* Tableau */}
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
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredRows.map((r) => (
                <tr key={`${r.courseId}-${r.dossard}`} className="hover:bg-[#8c9962]/5">
                  <Td className="font-medium">{r.rank ?? "—"}</Td>
                  <Td className="font-medium tabular-nums">{r.dossard}</Td>
                  <Td>{r.nom}</Td>
                  <Td>{r.categorie}</Td>
                  <Td>{r.course}</Td>
                  <Td className="tabular-nums">{r.raceTime ?? "—"}</Td>
                  <Td>{r.status ?? "—"}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile list */}
        <div className="md:hidden divide-y">
          {filteredRows.map((r) => (
            <div key={`${r.courseId}-${r.dossard}`} className="p-4">
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
                <div className="text-sm font-medium tabular-nums">{r.raceTime ?? "—"}</div>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                <span>{r.categorie}</span>
                <span>{r.status ?? "—"}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ---------- Helpers ---------- */
function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-2 text-slate-500 text-xs uppercase tracking-wide">{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-2 ${className}`}>{children}</td>;
}

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
