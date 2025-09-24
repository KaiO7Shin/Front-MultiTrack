import { useMemo, useState } from "react";
import { Trophy, Medal, Filter, Download, ArrowUpDown } from "lucide-react";
// import api from "../../lib/api"; // à brancher

const ACCENT = "#8c9962";

type Row = {
  dossard: number;
  nom: string;
  genre: "M" | "F";
  categorie: string;
  courseId: number;
  course: string;
  // temps d'arrivée en secondes depuis départ (plus simple pour trier)
  timeSec: number;
  statut: "FINISH" | "EN COURS" | "DNF";
};

/** --- MOCK (remplace par ton GET /leaderboard?course_id=... etc) --- */
const mockRows: Row[] = [
  { dossard: 124, nom: "Rasoa M.", genre: "F", categorie: "Senior", courseId: 1, course: "Trail 12K", timeSec: 4662, statut: "FINISH" },
  { dossard: 89, nom: "Rakoto J.", genre: "M", categorie: "Senior", courseId: 1, course: "Trail 12K", timeSec: 4711, statut: "FINISH" },
  { dossard: 301, nom: "Hanitra A.", genre: "F", categorie: "Veteran", courseId: 1, course: "Trail 12K", timeSec: 4742, statut: "FINISH" },
  { dossard: 55, nom: "Tovo K.", genre: "M", categorie: "Senior", courseId: 1, course: "Trail 12K", timeSec: 4780, statut: "FINISH" },
  { dossard: 12, nom: "Miora R.", genre: "F", categorie: "Junior", courseId: 2, course: "Trail 35K", timeSec: 12540, statut: "EN COURS" },
];

export const LeaderboardPage = () => {
  const [courseId, setCourseId] = useState<number | "all">(1);
  const [scope, setScope] = useState<"general" | "categorie">("general");
  const [genre, setGenre] = useState<"all" | "M" | "F">("all");
  const [sortAsc, setSortAsc] = useState(true);

  // Filtres
  const filtered = useMemo(() => {
    let rows = mockRows.slice();
    if (courseId !== "all") rows = rows.filter((r) => r.courseId === courseId);
    if (genre !== "all") rows = rows.filter((r) => r.genre === genre);
    // scope "categorie" : on gardera l’affichage par catégorie (mais tri reste global)
    rows.sort((a, b) => (sortAsc ? a.timeSec - b.timeSec : b.timeSec - a.timeSec));
    // On garde que les FINISH en tête, puis EN COURS, puis DNF (ordre visuel)
    rows.sort((a, b) => statutRank(a.statut) - statutRank(b.statut) || (sortAsc ? a.timeSec - b.timeSec : b.timeSec - a.timeSec));
    return rows;
  }, [courseId, genre, sortAsc]);

  // Podium sur la course sélectionnée, FINISH uniquement
  const podium = useMemo(() => {
    const base = filtered.filter((r) => r.statut === "FINISH");
    return base.slice(0, 3);
  }, [filtered]);

  const finishers = filtered.filter((r) => r.statut === "FINISH").length;

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Classement</h1>
          <p className="text-sm text-slate-500">Résultats provisoires (à homologuer)</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()} // placeholder export
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
          <select
            className="rounded-lg border px-2 py-1 text-sm focus:ring-2 focus:ring-[#8c9962]/30"
            value={String(courseId)}
            onChange={(e) => setCourseId(e.target.value === "all" ? "all" : Number(e.target.value))}
          >
            <option value="all">Toutes les courses</option>
            <option value="1">Trail 12K</option>
            <option value="2">Trail 35K</option>
          </select>

          <select
            className="rounded-lg border px-2 py-1 text-sm focus:ring-2 focus:ring-[#8c9962]/30"
            value={scope}
            onChange={(e) => setScope(e.target.value as any)}
          >
            <option value="general">Général</option>
            <option value="categorie">Par catégorie</option>
          </select>

          <select
            className="rounded-lg border px-2 py-1 text-sm focus:ring-2 focus:ring-[#8c9962]/30"
            value={genre}
            onChange={(e) => setGenre(e.target.value as any)}
          >
            <option value="all">Tous genres</option>
            <option value="M">Homme</option>
            <option value="F">Femme</option>
          </select>
        </div>
      </div>

      {/* Podium */}
      <div className="grid gap-4 sm:grid-cols-3">
        {podium.length === 0 ? (
          <div className="sm:col-span-3 text-sm text-slate-500 bg-white border border-slate-200 rounded-2xl p-4">
            Aucun finisher pour l’instant.
          </div>
        ) : (
          podium.map((r, i) => <PodiumCard key={r.dossard} row={r} rank={(i + 1) as 1 | 2 | 3} />)
        )}
      </div>

      {/* Tableau résultats */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 bg-slate-50">
          <div className="text-sm text-slate-600">
            {finishers} finisher{finishers > 1 ? "s" : ""} / {filtered.length} participants
          </div>
          <button
            onClick={() => setSortAsc((v) => !v)}
            className="text-sm rounded-lg border px-2 py-1 hover:bg-[#8c9962]/10"
            title="Trier par temps"
          >
            <ArrowUpDown className="inline-block h-4 w-4 mr-1" />
            {sortAsc ? "Temps ↑" : "Temps ↓"}
          </button>
        </div>

        {/* Table desktop */}
        <div className="hidden md:block overflow-auto max-h-[70vh]">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-white">
              <tr className="text-left border-b">
                <Th>#</Th>
                <Th>Dossard</Th>
                <Th>Nom</Th>
                <Th>Genre</Th>
                {scope === "categorie" && <Th>Catégorie</Th>}
                <Th>Course</Th>
                <Th>Temps</Th>
                <Th>Statut</Th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((r, idx) => (
                <tr key={r.dossard} className="hover:bg-[#8c9962]/5">
                  <Td className="font-medium">{displayRank(idx, r.statut)}</Td>
                  <Td className="font-medium tabular-nums">{r.dossard}</Td>
                  <Td>{r.nom}</Td>
                  <Td>{r.genre}</Td>
                  {scope === "categorie" && <Td>{r.categorie}</Td>}
                  <Td>{r.course}</Td>
                  <Td className="tabular-nums">{formatTime(r.timeSec)}</Td>
                  <Td><StatusBadge statut={r.statut} /></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* List mobile */}
        <div className="md:hidden divide-y">
          {filtered.map((r, idx) => (
            <div key={r.dossard} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 font-semibold">
                    {typeof displayRank(idx, r.statut) === "number" ? displayRank(idx, r.statut) : "—"}
                  </span>
                  <div>
                    <div className="text-sm font-medium">{r.nom}</div>
                    <div className="text-xs text-slate-500">
                      Dossard {r.dossard} · {r.course}
                    </div>
                  </div>
                </div>
                <div className="text-sm font-medium tabular-nums">{formatTime(r.timeSec)}</div>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-slate-600">
                  {r.genre}
                  {scope === "categorie" ? ` · ${r.categorie}` : ""}
                </span>
                <StatusBadge statut={r.statut} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ---------- Sub components & helpers ---------- */

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-2 text-slate-500 text-xs uppercase tracking-wide">{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-2 ${className}`}>{children}</td>;
}

function PodiumCard({ row, rank }: { row: Row; rank: 1 | 2 | 3 }) {
  const medal = rank === 1 ? ACCENT : rank === 2 ? "#cbd5e1" : "#d4a373"; // or light bronze
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
      <div className="text-sm font-medium tabular-nums">{formatTime(row.timeSec)}</div>
    </div>
  );
}

function StatusBadge({ statut }: { statut: Row["statut"] }) {
  const m = {
    FINISH: { bg: "bg-emerald-50", text: "text-emerald-700", br: "border-emerald-200", label: "FINISH" },
    "EN COURS": { bg: "bg-amber-50", text: "text-amber-700", br: "border-amber-200", label: "EN COURS" },
    DNF: { bg: "bg-red-50", text: "text-red-700", br: "border-red-200", label: "DNF" },
  } as const;
  const c = m[statut];
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs border ${c.bg} ${c.text} ${c.br}`}>
      {c.label}
    </span>
  );
}

function statutRank(s: Row["statut"]) {
  // FINISH (0), EN COURS (1), DNF (2)
  return s === "FINISH" ? 0 : s === "EN COURS" ? 1 : 2;
}

function displayRank(index: number, statut: Row["statut"]) {
  // Affiche un rang uniquement pour FINISH
  return statut === "FINISH" ? index + 1 : "—";
}

function formatTime(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return (h > 0 ? `${pad(h)}:` : "") + `${pad(m)}:${pad(s)}`;
}
