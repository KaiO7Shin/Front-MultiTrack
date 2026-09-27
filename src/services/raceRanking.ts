// API désactivée : classements calculés sur les données statiques.
// import api from "@/lib/api";
// import { API } from "@/lib/apiEndpoints";
import { staticStore } from "@/data/staticStore";
import {
  buildDHPhaseRanking,
  buildXCPhaseRanking,
  canAppearInPhase,
  durationMs,
  formatMs,
  isDisqualifiedFlag,
} from "@/lib/raceRanking";
import type {
  BikeType,
  CategoryGenre,
  DHPhaseRanking,
  EnduroPhaseRanking,
  EnduroRankingRow,
  MancheTimeDetail,
  XCPhaseRanking,
} from "@/lib/type";

export async function fetchDHPhaseRanking(
  courseId: number,
  phaseId: number,
  filters?: { gender?: CategoryGenre; categoryAlias?: string; bikeType?: BikeType }
): Promise<DHPhaseRanking> {
  // const { data } = await api.get(API.raceRankingDh(courseId), { params: { phaseId, ...filters } });
  // return data.data;
  const input = staticStore.phaseRankingInput(courseId, phaseId);
  return buildDHPhaseRanking({ ...input, ...filters });
}

export async function fetchXCPhaseRanking(
  courseId: number,
  phaseId: number,
  filters?: { gender?: CategoryGenre; categoryAlias?: string }
): Promise<XCPhaseRanking> {
  // const { data } = await api.get(API.raceRankingXc(courseId), { params: { phaseId, ...filters } });
  // return data.data;
  const input = staticStore.phaseRankingInput(courseId, phaseId);
  return buildXCPhaseRanking({
    ...input,
    ...filters,
    isFinalePhase: input.phase.label.toLowerCase().includes("finale"),
  });
}

export async function fetchEnduroPhaseRanking(
  courseId: number,
  phaseId: number,
  filters?: { gender?: CategoryGenre; categoryAlias?: string; bikeType?: BikeType }
): Promise<EnduroPhaseRanking> {
  // const { data } = await api.get(API.raceRankingEnduro(courseId), { params: { phaseId, ...filters } });
  // return data.data;
  const input = staticStore.phaseRankingInput(courseId, phaseId);
  return buildEnduroPhaseRanking(input, filters);
}

export async function disqualifyParticipant(input: {
  participantId: number;
  courseId: number;
  currentPhaseId?: number;
  mancheId?: number;
  reason?: string;
}): Promise<void> {
  // await api.post(API.participantDisqualify, input);
  staticStore.disqualify(input);
}

export async function revokeDisqualification(participantId: number): Promise<void> {
  // await api.delete(API.participantRevokeDisqualify(participantId));
  staticStore.revokeDisqualification(participantId);
}

function buildEnduroPhaseRanking(
  input: ReturnType<typeof staticStore.phaseRankingInput>,
  filters?: { gender?: CategoryGenre; categoryAlias?: string; bikeType?: BikeType }
): EnduroPhaseRanking {
  const phaseManches = input.manches.filter((m) => m.phaseId === input.phase.id);
  const rows: EnduroRankingRow[] = [];

  for (const participant of input.participants) {
    if (
      !canAppearInPhase(
        participant.id,
        input.phase.id,
        input.phases,
        input.disqualifications,
        input.manches,
        input.resultats
      )
    ) {
      continue;
    }

    const mancheTimes: MancheTimeDetail[] = phaseManches.map((manche) => {
      const res = input.resultats.find(
        (r) => r.participantId === participant.id && r.mancheId === manche.id
      );
      const timeMs = res ? durationMs(res.tempsDepart, res.tempsArrive) : null;
      return {
        mancheId: manche.id,
        mancheLabel: manche.label,
        timeMs,
        timeFormatted: formatMs(timeMs),
        finished: timeMs != null,
      };
    });

    const finished = mancheTimes.filter((t) => t.timeMs != null);
    if (finished.length === 0 && !mancheTimes.some((t) =>
      input.resultats.some(
        (r) => r.participantId === participant.id && r.mancheId === t.mancheId
      )
    )) {
      continue;
    }

    const totalTimeMs =
      finished.length > 0
        ? finished.reduce((sum, t) => sum + (t.timeMs ?? 0), 0)
        : null;

    const firstManche = phaseManches[0];
    const lastManche = phaseManches[phaseManches.length - 1];
    const firstDepart = firstManche
      ? input.resultats.find(
          (r) => r.participantId === participant.id && r.mancheId === firstManche.id
        )?.tempsDepart
      : null;
    const lastArrive = lastManche
      ? input.resultats.find(
          (r) => r.participantId === participant.id && r.mancheId === lastManche.id
        )?.tempsArrive
      : null;
    const elapsedTimeMs =
      firstDepart && lastArrive ? durationMs(firstDepart, lastArrive) : null;

    rows.push({
      participantId: participant.id,
      dossard: participant.numDossard,
      prenom: participant.prenom,
      nom: participant.nom,
      categorie: participant.aliasCategorie,
      genre: participant.genre,
      typeVelo: participant.typeVelo,
      totalTimeMs,
      totalTimeFormatted: formatMs(totalTimeMs),
      elapsedTimeMs,
      elapsedTimeFormatted: formatMs(elapsedTimeMs),
      completedManches: finished.length,
      totalManches: phaseManches.length,
      complete: finished.length === phaseManches.length && phaseManches.length > 0,
      rankScratch: null,
      rankCategory: null,
      disqualified: isDisqualifiedFlag(participant.id, input.disqualifications),
      mancheTimes,
    });
  }

  let filtered = rows;
  if (filters?.gender) filtered = filtered.filter((r) => r.genre === filters.gender);
  if (filters?.categoryAlias) {
    const alias = filters.categoryAlias.toLowerCase();
    filtered = filtered.filter((r) => r.categorie.toLowerCase() === alias);
  }
  if (filters?.bikeType) {
    filtered = filtered.filter((r) => r.typeVelo === filters.bikeType);
  }

  const ranked = assignRanks(filtered, (r) => r.totalTimeMs);
  const withCategory = assignCategoryRanks(ranked);

  const byCategory = new Map<string, EnduroRankingRow[]>();
  for (const row of withCategory) {
    const key = row.categorie || "—";
    const list = byCategory.get(key) ?? [];
    list.push(row);
    byCategory.set(key, list);
  }

  return {
    phaseId: input.phase.id,
    phaseLabel: input.phase.label,
    totalManches: phaseManches.length,
    scratch: withCategory,
    byCategory: Array.from(byCategory.entries())
      .sort(([a], [b]) => a.localeCompare(b, "fr"))
      .map(([categorie, catRows]) => ({
        categorie,
        rows: catRows.sort((a, b) => (a.rankCategory ?? 99) - (b.rankCategory ?? 99)),
      })),
  };
}

function assignRanks(
  rows: EnduroRankingRow[],
  timeField: (row: EnduroRankingRow) => number | null
): EnduroRankingRow[] {
  const sorted = [...rows].sort((a, b) => {
    if (a.disqualified && !b.disqualified) return 1;
    if (!a.disqualified && b.disqualified) return -1;
    const ta = timeField(a);
    const tb = timeField(b);
    if (ta == null && tb == null) return 0;
    if (ta == null) return 1;
    if (tb == null) return -1;
    return ta - tb;
  });
  let rank = 0;
  let lastTime: number | null = null;
  let pos = 0;
  return sorted.map((row) => {
    pos += 1;
    const time = timeField(row);
    if (row.disqualified || time == null) return { ...row, rankScratch: null };
    if (time !== lastTime) {
      rank = pos;
      lastTime = time;
    }
    return { ...row, rankScratch: rank };
  });
}

function assignCategoryRanks(rows: EnduroRankingRow[]): EnduroRankingRow[] {
  const byCat = new Map<string, EnduroRankingRow[]>();
  for (const row of rows) {
    const key = row.categorie || "—";
    const list = byCat.get(key) ?? [];
    list.push(row);
    byCat.set(key, list);
  }
  const catRank = new Map<number, number | null>();
  for (const catRows of byCat.values()) {
    for (const ranked of assignRanks(catRows, (r) => r.totalTimeMs)) {
      catRank.set(ranked.participantId, ranked.rankScratch);
    }
  }
  return rows.map((row) => ({
    ...row,
    rankCategory: catRank.get(row.participantId) ?? null,
  }));
}
