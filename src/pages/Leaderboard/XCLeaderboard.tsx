import { useCallback, useEffect, useMemo, useState } from "react";
import { Ban, RotateCcw, Users } from "lucide-react";
import type { CategoryGenre, UICategory, XCRankingRow } from "@/lib/type";
import {
  disqualifyParticipant,
  fetchXCPhaseRanking,
  revokeDisqualification,
} from "@/services/raceRanking";
import { fetchPhasesByCourse } from "@/services/raceStructure";

type XCLeaderboardProps = {
  courseId: number;
  courseName: string;
  gender: "all" | CategoryGenre;
  categoryId: number | "" | null;
  categories: UICategory[];
  searchBib: string;
};

type XCView = "poules" | "general" | "category";

function RankingTable({
  rows,
  showCategoryRank = false,
  showPouleRank = true,
  onDQ,
  onRevoke,
  dqBusy,
}: {
  rows: XCRankingRow[];
  showCategoryRank?: boolean;
  showPouleRank?: boolean;
  onDQ?: (row: XCRankingRow) => void;
  onRevoke?: (row: XCRankingRow) => void;
  dqBusy: number | null;
}) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-slate-500 px-4 py-6 text-center">
        Aucun participant dans cette poule.
      </p>
    );
  }

  return (
    <table className="min-w-full text-sm">
      <thead className="bg-slate-50">
        <tr>
          {showPouleRank && <th className="px-4 py-2 text-left">#</th>}
          <th className="px-4 py-2 text-left">Dossard</th>
          <th className="px-4 py-2 text-left">Prénom</th>
          <th className="px-4 py-2 text-left">Nom</th>
          <th className="px-4 py-2 text-left">Cat.</th>
          <th className="px-4 py-2 text-left">Arrivée</th>
          {showCategoryRank && <th className="px-4 py-2">Clt cat.</th>}
          {onDQ && <th className="px-4 py-2"></th>}
        </tr>
      </thead>
      <tbody className="divide-y">
        {rows.map((row) => (
          <tr
            key={row.participantId}
            className={row.disqualified ? "opacity-60" : undefined}
          >
            {showPouleRank && (
              <td className="px-4 py-2 font-medium">
                {row.timeMs != null ? (row.rankScratch ?? "—") : "—"}
              </td>
            )}
            <td className="px-4 py-2">{row.dossard}</td>
            <td className="px-4 py-2">{row.prenom}</td>
            <td className="px-4 py-2">{row.nom}</td>
            <td className="px-4 py-2">{row.categorie}</td>
            <td className="px-4 py-2 tabular-nums">
              {row.timeFormatted ?? (
                <span className="text-slate-400">En attente</span>
              )}
              {row.disqualified && (
                <span className="ml-2 text-xs text-red-600">DQ</span>
              )}
            </td>
            {showCategoryRank && (
              <td className="px-4 py-2 text-center">{row.rankCategory ?? "—"}</td>
            )}
            {onDQ && (
              <td className="px-4 py-2">
                {row.disqualified ? (
                  <button
                    type="button"
                    disabled={dqBusy === row.participantId}
                    onClick={() => onRevoke?.(row)}
                    className="text-xs text-slate-600 inline-flex items-center gap-1"
                  >
                    <RotateCcw className="h-3 w-3" /> Annuler DQ
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={dqBusy === row.participantId}
                    onClick={() => onDQ(row)}
                    className="text-xs text-red-600 inline-flex items-center gap-1"
                  >
                    <Ban className="h-3 w-3" /> DQ
                  </button>
                )}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function XCLeaderboard({
  courseId,
  courseName,
  gender,
  categoryId,
  categories,
  searchBib,
}: XCLeaderboardProps) {
  const [phases, setPhases] = useState<{ id: number; label: string }[]>([]);
  const [phaseId, setPhaseId] = useState<number | "">("");
  const [view, setView] = useState<XCView>("poules");
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchXCPhaseRanking>> | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [dqBusy, setDqBusy] = useState<number | null>(null);

  const categoryAlias = useMemo(() => {
    if (!categoryId) return undefined;
    return categories.find((c) => c.id === categoryId)?.alias;
  }, [categoryId, categories]);

  const isEliminatoires = useMemo(() => {
    const label = data?.phaseLabel?.toLowerCase() ?? "";
    return label.includes("éliminatoire") || label.includes("eliminatoire");
  }, [data?.phaseLabel]);

  useEffect(() => {
    fetchPhasesByCourse(courseId)
      .then((list) => {
        setPhases(list);
        const elim = list.find((p) =>
          p.label.toLowerCase().includes("éliminatoire")
        );
        setPhaseId(elim?.id ?? list[0]?.id ?? "");
        setView("poules");
      })
      .catch(() => {
        setPhases([]);
        setPhaseId("");
      });
  }, [courseId]);

  const load = useCallback(async () => {
    if (!phaseId) {
      setData(null);
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      setData(
        await fetchXCPhaseRanking(courseId, Number(phaseId), {
          gender: gender === "all" ? undefined : gender,
          categoryAlias,
        })
      );
    } catch (e: unknown) {
      const error = e as { response?: { data?: { message?: string } }; message?: string };
      setErr(error.response?.data?.message ?? error.message ?? "Erreur");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [courseId, phaseId, gender, categoryAlias]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (isEliminatoires) setView("poules");
  }, [isEliminatoires, phaseId]);

  const filterBib = (rows: XCRankingRow[]) => {
    const term = searchBib.trim();
    if (!term) return rows;
    return rows.filter((r) => r.dossard.includes(term));
  };

  async function handleDQ(row: XCRankingRow) {
    if (!phaseId || row.disqualified) return;
    const reason = window.prompt("Motif de disqualification (optionnel) :");
    if (reason === null) return;
    setDqBusy(row.participantId);
    try {
      await disqualifyParticipant({
        participantId: row.participantId,
        courseId,
        currentPhaseId: Number(phaseId),
        reason: reason || undefined,
      });
      await load();
    } catch (e: unknown) {
      const error = e as { response?: { data?: { message?: string } }; message?: string };
      alert(error.response?.data?.message ?? error.message ?? "Erreur");
    } finally {
      setDqBusy(null);
    }
  }

  async function handleRevoke(row: XCRankingRow) {
    setDqBusy(row.participantId);
    try {
      await revokeDisqualification(row.participantId);
      await load();
    } catch {
      alert("Erreur");
    } finally {
      setDqBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border rounded-2xl p-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1 sm:flex-row sm:gap-2 sm:items-center w-full sm:w-auto">
          <span className="text-sm text-slate-600">Phase</span>
          <select
            className="w-full sm:w-auto rounded-lg border px-2 py-2 text-sm"
            value={phaseId === "" ? "" : String(phaseId)}
            onChange={(e) => setPhaseId(e.target.value ? Number(e.target.value) : "")}
          >
            <option value="">Sélectionner…</option>
            {phases.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </div>

        <div className="flex rounded-lg border p-0.5 bg-slate-50 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setView("poules")}
            className={`flex-1 px-2 sm:px-3 py-1.5 text-xs rounded-md ${view === "poules" ? "bg-white shadow" : ""}`}
          >
            Par poule
          </button>
          <button
            type="button"
            onClick={() => setView("general")}
            className={`flex-1 px-2 sm:px-3 py-1.5 text-xs rounded-md ${view === "general" ? "bg-white shadow" : ""}`}
          >
            Général
          </button>
          <button
            type="button"
            onClick={() => setView("category")}
            className={`flex-1 px-2 sm:px-3 py-1.5 text-xs rounded-md ${view === "category" ? "bg-white shadow" : ""}`}
          >
            Par catégorie
          </button>
        </div>
      </div>

      {loading && <p className="text-sm text-slate-500">Chargement…</p>}
      {err && <p className="text-sm text-red-600">{err}</p>}

      {data && !loading && (
        <>
          <p className="text-sm text-slate-500">
            {courseName} — {data.phaseLabel}
            {isEliminatoires && view === "poules" && (
              <span> — résultats par poule (manche)</span>
            )}
          </p>

          {view === "poules" && (
            <div className="space-y-4">
              {data.mancheGroups.length === 0 ? (
                <div className="bg-white border rounded-2xl p-6 text-center text-sm text-slate-500">
                  Aucune poule configurée pour cette phase.
                </div>
              ) : (
                data.mancheGroups.map((group) => (
                  <div
                    key={group.mancheId}
                    className="bg-white border rounded-2xl overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b bg-[#8c9962]/10 flex items-center justify-between gap-2">
                      <div className="font-semibold text-sm">{group.mancheLabel}</div>
                      <div className="flex items-center gap-1 text-xs text-slate-600">
                        <Users className="h-3.5 w-3.5" />
                        {group.finishedCount}/{group.rosterCount} arrivés
                      </div>
                    </div>
                    <div className="table-scroll table-scroll-wide">
                      <RankingTable
                        rows={filterBib(group.rows)}
                        onDQ={handleDQ}
                        onRevoke={handleRevoke}
                        dqBusy={dqBusy}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {view === "general" && (
            <div className="bg-white border rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b bg-slate-50 font-medium text-sm">
                Classement général — {data.phaseLabel}
              </div>
              <div className="table-scroll table-scroll-wide">
                <RankingTable rows={filterBib(data.scratchGeneral)} dqBusy={dqBusy} />
              </div>
            </div>
          )}

          {view === "category" &&
            data.byCategory.map((group) => (
              <div
                key={group.categorie}
                className="bg-white border rounded-2xl overflow-hidden"
              >
                <div className="px-4 py-3 border-b bg-slate-50 font-medium text-sm">
                  Catégorie {group.categorie}
                </div>
                <div className="table-scroll table-scroll-wide">
                  <RankingTable
                    rows={filterBib(group.rows)}
                    showCategoryRank
                    dqBusy={dqBusy}
                  />
                </div>
              </div>
            ))}
        </>
      )}
    </div>
  );
}
