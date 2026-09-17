import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Ban, RotateCcw } from "lucide-react";
import type {
  BikeType,
  CategoryGenre,
  EnduroPhaseRanking,
  EnduroRankingRow,
  UICategory,
} from "@/lib/type";
import { BIKE_TYPE_LABELS } from "@/lib/type";
import {
  disqualifyParticipant,
  fetchEnduroPhaseRanking,
  revokeDisqualification,
} from "@/services/raceRanking";
import { fetchPhasesByCourse } from "@/services/raceStructure";

type EnduroLeaderboardProps = {
  courseId: number;
  courseName: string;
  gender: "all" | CategoryGenre;
  categoryId: number | "" | null;
  categories: UICategory[];
  searchBib: string;
  bikeType: "all" | BikeType;
  onExportContextChange?: (ctx: {
    data: EnduroPhaseRanking | null;
    view: "scratch" | "category";
  }) => void;
};

const COLUMN_COUNT = 11;

export function EnduroLeaderboard({
  courseId,
  courseName,
  gender,
  categoryId,
  categories,
  searchBib,
  bikeType,
  onExportContextChange,
}: EnduroLeaderboardProps) {
  const [phases, setPhases] = useState<{ id: number; label: string }[]>([]);
  const [phaseId, setPhaseId] = useState<number | "">("");
  const [view, setView] = useState<"scratch" | "category">("scratch");
  const [data, setData] = useState<EnduroPhaseRanking | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [dqBusy, setDqBusy] = useState<number | null>(null);

  const categoryAlias = useMemo(() => {
    if (!categoryId) return undefined;
    return categories.find((c) => c.id === categoryId)?.alias;
  }, [categoryId, categories]);

  useEffect(() => {
    fetchPhasesByCourse(courseId)
      .then((list) => {
        setPhases(list);
        setPhaseId(list[0]?.id ?? "");
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
        await fetchEnduroPhaseRanking(courseId, Number(phaseId), {
          gender: gender === "all" ? undefined : gender,
          categoryAlias,
          bikeType: bikeType === "all" ? undefined : bikeType,
        })
      );
    } catch (e: unknown) {
      const error = e as { response?: { data?: { message?: string } }; message?: string };
      setErr(error.response?.data?.message ?? error.message ?? "Erreur");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [courseId, phaseId, gender, categoryAlias, bikeType]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    onExportContextChange?.({ data, view });
  }, [data, view, onExportContextChange]);

  const displayRows = useMemo(() => {
    if (!data) return [] as EnduroRankingRow[];
    const base =
      view === "scratch" ? data.scratch : data.byCategory.flatMap((g) => g.rows);
    const term = searchBib.trim();
    if (!term) return base;
    return base.filter((r) => r.dossard.includes(term));
  }, [data, view, searchBib]);

  async function handleDQ(row: EnduroRankingRow) {
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

  async function handleRevoke(row: EnduroRankingRow) {
    setDqBusy(row.participantId);
    try {
      await revokeDisqualification(row.participantId);
      await load();
    } catch {
      alert("Erreur lors de l'annulation");
    } finally {
      setDqBusy(null);
    }
  }

  return (
    <div className="space-y-4">
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
            onClick={() => setView("scratch")}
            className={`flex-1 px-3 py-1.5 text-xs rounded-md ${view === "scratch" ? "bg-white shadow" : ""}`}
          >
            Scratch
          </button>
          <button
            type="button"
            onClick={() => setView("category")}
            className={`flex-1 px-3 py-1.5 text-xs rounded-md ${view === "category" ? "bg-white shadow" : ""}`}
          >
            Par catégorie
          </button>
        </div>
      </div>

      {loading && <p className="text-sm text-slate-500">Chargement…</p>}
      {err && <p className="text-sm text-red-600">{err}</p>}

      {!loading && data && (
        <>
          <p className="text-sm text-slate-500">
            {courseName} — {data.phaseLabel} — cumul des temps sur{" "}
            {data.totalManches} spéciale{data.totalManches > 1 ? "s" : ""}
          </p>

          <div className="bg-white border rounded-2xl overflow-hidden">
            <div className="table-scroll table-scroll-wide">
              <table>
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left">#</th>
                    <th className="px-4 py-2 text-left">Dossard</th>
                    <th className="px-4 py-2 text-left">Prénom</th>
                    <th className="px-4 py-2 text-left">Nom</th>
                    <th className="px-4 py-2 text-left">Cat.</th>
                    <th className="px-4 py-2 text-left">Type vélo</th>
                    <th className="px-4 py-2 text-left">Spéciales</th>
                    <th className="px-4 py-2 text-left">Temps cumulé</th>
                    <th className="px-4 py-2 text-left">Temps total</th>
                    <th className="px-4 py-2"></th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {displayRows.length === 0 ? (
                    <tr>
                      <td colSpan={COLUMN_COUNT} className="px-4 py-6 text-center text-slate-500">
                        Aucun résultat.
                      </td>
                    </tr>
                  ) : (
                    displayRows.map((row) => {
                      const open = !!expanded[row.participantId];
                      const rank = view === "scratch" ? row.rankScratch : row.rankCategory;
                      return (
                        <Fragment key={row.participantId}>
                          <tr
                            className={`hover:bg-[#8c9962]/5 ${row.disqualified ? "opacity-60" : ""}`}
                          >
                            <td className="px-4 py-2 font-medium">{rank ?? "—"}</td>
                            <td className="px-4 py-2">{row.dossard}</td>
                            <td className="px-4 py-2">{row.prenom}</td>
                            <td className="px-4 py-2">{row.nom}</td>
                            <td className="px-4 py-2">{row.categorie}</td>
                            <td className="px-4 py-2">
                              {row.typeVelo ? (
                                <span className="inline-flex rounded-full border px-2 py-0.5 text-xs font-medium bg-orange-50 text-orange-800 border-orange-200">
                                  {BIKE_TYPE_LABELS[row.typeVelo]}
                                </span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                            <td className="px-4 py-2">
                              <span
                                className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium tabular-nums ${
                                  row.complete
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                    : "bg-amber-50 text-amber-800 border-amber-200"
                                }`}
                              >
                                {row.completedManches}/{row.totalManches}
                              </span>
                            </td>
                            <td className="px-4 py-2 tabular-nums font-medium">
                              {row.totalTimeFormatted ?? "—"}
                              {row.disqualified && (
                                <span className="ml-2 text-xs text-red-600">DQ</span>
                              )}
                            </td>
                            <td className="px-4 py-2 tabular-nums text-slate-600">
                              {row.elapsedTimeFormatted ?? "—"}
                            </td>
                            <td className="px-4 py-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setExpanded((p) => ({
                                    ...p,
                                    [row.participantId]: !p[row.participantId],
                                  }))
                                }
                                className="p-1 rounded"
                              >
                                {open ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </button>
                            </td>
                            <td className="px-4 py-2">
                              {row.disqualified ? (
                                <button
                                  type="button"
                                  disabled={dqBusy === row.participantId}
                                  onClick={() => handleRevoke(row)}
                                  className="text-xs text-slate-600 inline-flex items-center gap-1"
                                >
                                  <RotateCcw className="h-3 w-3" /> Annuler DQ
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled={dqBusy === row.participantId}
                                  onClick={() => handleDQ(row)}
                                  className="text-xs text-red-600 inline-flex items-center gap-1"
                                >
                                  <Ban className="h-3 w-3" /> DQ
                                </button>
                              )}
                            </td>
                          </tr>
                          {open && (
                            <tr className="bg-slate-50">
                              <td colSpan={COLUMN_COUNT} className="px-4 py-3">
                                <div className="text-xs text-slate-500 mb-2">
                                  Détail par spéciale
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {row.mancheTimes.map((mt) => (
                                    <span
                                      key={mt.mancheId}
                                      className="rounded-lg border bg-white px-2 py-1 text-xs"
                                    >
                                      {mt.mancheLabel} : {mt.timeFormatted ?? "—"}
                                    </span>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-xs text-slate-500">
            Temps cumulé : somme des temps réalisés sur les spéciales de la phase —
            base du classement, attribué une fois toutes les spéciales bouclées.
            Temps total : écart entre l'arrivée sur la dernière spéciale et le départ
            sur la première, liaisons comprises.
          </p>
        </>
      )}
    </div>
  );
}
