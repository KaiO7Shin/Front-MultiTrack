import type {
  BikeType,
  CategoryGenre,
  DHPhaseRanking,
  Manche,
  ParticipantDisqualification,
  ParticipantProjection,
  Phase,
  ResultatManche,
  MancheAssignment,
  XCPhaseRanking,
  XCRankingRow,
  DHRankingRow,
} from "./type";

export function durationMs(
  depart: string | null,
  arrive: string | null
): number | null {
  if (!depart || !arrive) return null;
  const ms = Date.parse(arrive) - Date.parse(depart);
  return Number.isFinite(ms) && ms >= 0 ? ms : null;
}

export function formatMs(ms: number | null): string | null {
  if (ms == null) return null;
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const cs = Math.floor((ms % 1000) / 10);
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

export function formatArrivalTime(iso: string | null): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  } catch {
    return iso;
  }
}

function phaseIndex(phases: Phase[], phaseId: number): number {
  return phases.findIndex((p) => p.id === phaseId);
}

export function getDisqualification(
  participantId: number,
  disqualifications: ParticipantDisqualification[]
): ParticipantDisqualification | undefined {
  return disqualifications.find((d) => d.participantId === participantId);
}

export function hasResultInPhase(
  participantId: number,
  phaseId: number,
  manches: Manche[],
  resultats: ResultatManche[]
): boolean {
  const mancheIds = new Set(
    manches.filter((m) => m.phaseId === phaseId).map((m) => m.id)
  );
  return resultats.some(
    (r) => r.participantId === participantId && mancheIds.has(r.mancheId)
  );
}

/** Visible dans une phase : pas DQ pour cette phase, ou a déjà des résultats dedans */
export function canAppearInPhase(
  participantId: number,
  phaseId: number,
  phases: Phase[],
  disqualifications: ParticipantDisqualification[],
  manches: Manche[],
  resultats: ResultatManche[]
): boolean {
  const dq = getDisqualification(participantId, disqualifications);
  if (!dq) return true;
  const fromIdx = phaseIndex(phases, dq.fromPhaseId);
  const targetIdx = phaseIndex(phases, phaseId);
  if (fromIdx < 0 || targetIdx < 0) return true;
  if (targetIdx < fromIdx) return true;
  return hasResultInPhase(participantId, phaseId, manches, resultats);
}

export type CheckpointMancheMode = "dh-depart" | "dh-arrivee" | "xc-arrivee";

/**
 * Éligible au pointage checkpoint.
 * Les disqualifiés sont exclus des manches non commencées,
 * mais peuvent finir une manche déjà entamée (départ DH enregistré).
 */
export function canCheckParticipantOnManche(
  participantId: number,
  mancheId: number,
  phaseId: number,
  phases: Phase[],
  disqualifications: ParticipantDisqualification[],
  manches: Manche[],
  resultats: ResultatManche[],
  mode: CheckpointMancheMode,
  assignments: MancheAssignment[] = []
): boolean {
  const res = resultats.find(
    (r) => r.participantId === participantId && r.mancheId === mancheId
  );

  if (res?.tempsArrive) return false;

  if (mode === "dh-depart") {
    if (res?.tempsDepart) return false;
    return canAppearInPhase(
      participantId,
      phaseId,
      phases,
      disqualifications,
      manches,
      resultats
    );
  }

  if (mode === "dh-arrivee") {
    return !!res?.tempsDepart;
  }

  // xc-arrivee — pas visible sur une autre poule de la même phase
  if (
    isAssignedToOtherMancheInPhase(
      participantId,
      mancheId,
      phaseId,
      manches,
      assignments,
      resultats
    )
  ) {
    return false;
  }

  return canAppearInPhase(
    participantId,
    phaseId,
    phases,
    disqualifications,
    manches,
    resultats
  );
}

/** XC : déjà affecté ou chronométré sur une autre poule de la phase */
export function isAssignedToOtherMancheInPhase(
  participantId: number,
  mancheId: number,
  phaseId: number,
  manches: Manche[],
  assignments: MancheAssignment[],
  resultats: ResultatManche[]
): boolean {
  const phaseMancheIds = new Set(
    manches.filter((m) => m.phaseId === phaseId).map((m) => m.id)
  );

  const assignment = assignments.find(
    (a) =>
      a.participantId === participantId &&
      phaseMancheIds.has(a.mancheId)
  );
  if (assignment && assignment.mancheId !== mancheId) return true;

  return resultats.some(
    (r) =>
      r.participantId === participantId &&
      phaseMancheIds.has(r.mancheId) &&
      r.mancheId !== mancheId
  );
}

export function isDisqualifiedFlag(
  participantId: number,
  disqualifications: ParticipantDisqualification[]
): boolean {
  return disqualifications.some((d) => d.participantId === participantId);
}

type Rankable = { disqualified: boolean };

function assignRanks<T extends Rankable>(
  rows: T[],
  timeField: (r: T) => number | null
): (T & { rankScratch: number | null })[] {
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
    pos++;
    const t = timeField(row);
    if (row.disqualified || t == null) {
      return { ...row, rankScratch: null };
    }
    if (t !== lastTime) {
      rank = pos;
      lastTime = t;
    }
    return { ...row, rankScratch: rank };
  });
}

function assignCategoryRanks<
  T extends Rankable & { categorie: string; participantId: number },
>(rows: (T & { rankScratch: number | null })[], timeField: (r: T) => number | null): (T & {
  rankScratch: number | null;
  rankCategory: number | null;
})[] {
  const byCat = new Map<string, (T & { rankScratch: number | null })[]>();
  rows.forEach((r) => {
    const key = r.categorie || "—";
    if (!byCat.has(key)) byCat.set(key, []);
    byCat.get(key)!.push(r);
  });

  const catRankMap = new Map<number, number | null>();
  byCat.forEach((catRows) => {
    assignRanks(catRows, timeField).forEach((r) =>
      catRankMap.set(r.participantId, r.rankScratch)
    );
  });

  return rows.map((r) => ({
    ...r,
    rankCategory: catRankMap.get(r.participantId) ?? null,
  }));
}

function filterParticipant<
  T extends { genre: CategoryGenre; categorie: string; typeVelo?: BikeType },
>(
  rows: T[],
  gender?: CategoryGenre,
  categoryAlias?: string,
  bikeType?: BikeType
): T[] {
  let out = rows;
  if (gender) out = out.filter((r) => r.genre === gender);
  if (categoryAlias)
    out = out.filter(
      (r) => r.categorie.toLowerCase() === categoryAlias.toLowerCase()
    );
  if (bikeType) out = out.filter((r) => r.typeVelo === bikeType);
  return out;
}

export function buildDHPhaseRanking(input: {
  phase: Phase;
  phases: Phase[];
  manches: Manche[];
  participants: ParticipantProjection[];
  resultats: ResultatManche[];
  disqualifications: ParticipantDisqualification[];
  gender?: CategoryGenre;
  categoryAlias?: string;
  bikeType?: BikeType;
}): DHPhaseRanking {
  const phaseManches = input.manches.filter((m) => m.phaseId === input.phase.id);

  const rows: DHRankingRow[] = [];

  for (const p of input.participants) {
    if (
      !canAppearInPhase(
        p.id,
        input.phase.id,
        input.phases,
        input.disqualifications,
        input.manches,
        input.resultats
      )
    ) {
      continue;
    }

    const mancheTimes = phaseManches.map((m) => {
      const res = input.resultats.find(
        (r) => r.participantId === p.id && r.mancheId === m.id
      );
      const ms = res
        ? durationMs(res.tempsDepart, res.tempsArrive)
        : null;
      return {
        mancheId: m.id,
        mancheLabel: m.label,
        timeMs: ms,
        timeFormatted: ms != null ? formatMs(ms) : null,
        finished: ms != null,
      };
    });

    const finishedTimes = mancheTimes
      .map((t) => t.timeMs)
      .filter((t): t is number => t != null);
    const bestTimeMs =
      finishedTimes.length > 0 ? Math.min(...finishedTimes) : null;

    const hasAnyActivity = mancheTimes.some(
      (t) => t.finished || input.resultats.some(
        (r) => r.participantId === p.id && r.mancheId === t.mancheId
      )
    );

    if (!hasAnyActivity && bestTimeMs == null) continue;

    rows.push({
      participantId: p.id,
      dossard: p.numDossard,
      prenom: p.prenom,
      nom: p.nom,
      categorie: p.aliasCategorie,
      genre: p.genre,
      typeVelo: p.typeVelo,
      bestTimeMs,
      bestTimeFormatted: bestTimeMs != null ? formatMs(bestTimeMs) : null,
      rankScratch: null,
      rankCategory: null,
      disqualified: isDisqualifiedFlag(p.id, input.disqualifications),
      mancheTimes,
    });
  }

  const filtered = filterParticipant(
    rows,
    input.gender,
    input.categoryAlias,
    input.bikeType
  );
  const withScratch = assignRanks(filtered, (r) => r.bestTimeMs);
  const ranked = assignCategoryRanks(withScratch, (r) => r.bestTimeMs);

  const byCategoryMap = new Map<string, DHRankingRow[]>();
  ranked.forEach((r) => {
    const key = r.categorie || "—";
    if (!byCategoryMap.has(key)) byCategoryMap.set(key, []);
    byCategoryMap.get(key)!.push(r);
  });

  return {
    phaseId: input.phase.id,
    phaseLabel: input.phase.label,
    scratch: ranked,
    byCategory: Array.from(byCategoryMap.entries())
      .sort(([a], [b]) => a.localeCompare(b, "fr"))
      .map(([categorie, catRows]) => ({
        categorie,
        rows: catRows.sort(
          (a, b) => (a.rankCategory ?? 99) - (b.rankCategory ?? 99)
        ),
      })),
  };
}

function buildXCRow(
  p: ParticipantProjection,
  res: ResultatManche | undefined,
  disqualifications: ParticipantDisqualification[]
): XCRankingRow {
  const arriveMs = res?.tempsArrive ? Date.parse(res.tempsArrive) : null;
  return {
    participantId: p.id,
    dossard: p.numDossard,
    prenom: p.prenom,
    nom: p.nom,
    categorie: p.aliasCategorie,
    genre: p.genre,
    timeMs: arriveMs,
    timeFormatted: formatArrivalTime(res?.tempsArrive ?? null),
    rankScratch: null,
    rankCategory: null,
    disqualified: isDisqualifiedFlag(p.id, disqualifications),
  };
}

export function buildXCPhaseRanking(input: {
  phase: Phase;
  phases: Phase[];
  manches: Manche[];
  participants: ParticipantProjection[];
  resultats: ResultatManche[];
  disqualifications: ParticipantDisqualification[];
  gender?: CategoryGenre;
  categoryAlias?: string;
  isFinalePhase?: boolean;
  /** Affectations poule → participants (phases éliminatoires) */
  assignments?: MancheAssignment[];
}): XCPhaseRanking {
  const phaseManches = input.manches.filter((m) => m.phaseId === input.phase.id);
  const assignments = input.assignments ?? [];

  const mancheGroups: XCPhaseRanking["mancheGroups"] = phaseManches.map(
    (manche) => {
      const rows: XCRankingRow[] = [];

      const rosterIds = input.isFinalePhase
        ? []
        : assignments
            .filter((a) => a.mancheId === manche.id)
            .map((a) => a.participantId);

      const participantIdsToShow = input.isFinalePhase
        ? input.participants
            .filter((p) =>
              canAppearInPhase(
                p.id,
                input.phase.id,
                input.phases,
                input.disqualifications,
                input.manches,
                input.resultats
              )
            )
            .map((p) => p.id)
        : rosterIds.length > 0
          ? rosterIds
          : input.resultats
              .filter((r) => r.mancheId === manche.id)
              .map((r) => r.participantId);

      for (const pid of participantIdsToShow) {
        const p = input.participants.find((x) => x.id === pid);
        if (!p) continue;

        const res = input.resultats.find(
          (r) => r.participantId === p.id && r.mancheId === manche.id
        );

        if (!res?.tempsArrive) {
          if (
            input.isFinalePhase &&
            canAppearInPhase(
              p.id,
              input.phase.id,
              input.phases,
              input.disqualifications,
              input.manches,
              input.resultats
            )
          ) {
            rows.push({
              participantId: p.id,
              dossard: p.numDossard,
              prenom: p.prenom,
              nom: p.nom,
              categorie: p.aliasCategorie,
              genre: p.genre,
              timeMs: null,
              timeFormatted: null,
              rankScratch: null,
              rankCategory: null,
              disqualified: isDisqualifiedFlag(p.id, input.disqualifications),
            });
          } else if (!input.isFinalePhase) {
            rows.push({
              participantId: p.id,
              dossard: p.numDossard,
              prenom: p.prenom,
              nom: p.nom,
              categorie: p.aliasCategorie,
              genre: p.genre,
              timeMs: null,
              timeFormatted: null,
              rankScratch: null,
              rankCategory: null,
              disqualified: isDisqualifiedFlag(p.id, input.disqualifications),
            });
          }
          continue;
        }

        if (
          !canAppearInPhase(
            p.id,
            input.phase.id,
            input.phases,
            input.disqualifications,
            input.manches,
            input.resultats
          )
        ) {
          continue;
        }

        rows.push(buildXCRow(p, res, input.disqualifications));
      }

      const filtered = filterParticipant(rows, input.gender, input.categoryAlias);
      const finished = filtered.filter((r) => r.timeMs != null);
      const withScratch = assignRanks(finished, (r) => r.timeMs);
      const rankedMap = new Map(withScratch.map((r) => [r.participantId, r]));

      const ranked = filtered.map((r) => {
        const rankedRow = rankedMap.get(r.participantId);
        return rankedRow ?? r;
      });

      const withCatRanks = assignCategoryRanks(
        ranked.filter((r) => r.timeMs != null),
        (r) => r.timeMs
      );
      const catMap = new Map(withCatRanks.map((r) => [r.participantId, r.rankCategory]));
      const finalRows = ranked.map((r) => ({
        ...r,
        rankCategory: catMap.get(r.participantId) ?? r.rankCategory,
      }));

      return {
        mancheId: manche.id,
        mancheLabel: manche.label,
        rosterCount: participantIdsToShow.length,
        finishedCount: finished.length,
        rows: finalRows,
      };
    }
  );

  const allRows: XCRankingRow[] = [];
  mancheGroups.forEach((g) => {
    g.rows.forEach((r) => {
      if (r.timeMs != null) allRows.push({ ...r });
    });
  });

  const scratchRanked = assignCategoryRanks(
    assignRanks(allRows, (r) => r.timeMs),
    (r) => r.timeMs
  );

  const byCategoryMap = new Map<string, XCRankingRow[]>();
  scratchRanked.forEach((r) => {
    const key = r.categorie || "—";
    if (!byCategoryMap.has(key)) byCategoryMap.set(key, []);
    byCategoryMap.get(key)!.push(r);
  });

  return {
    phaseId: input.phase.id,
    phaseLabel: input.phase.label,
    mancheGroups,
    scratchGeneral: scratchRanked,
    byCategory: Array.from(byCategoryMap.entries())
      .sort(([a], [b]) => a.localeCompare(b, "fr"))
      .map(([categorie, catRows]) => ({
        categorie,
        rows: catRows.sort(
          (a, b) => (a.rankCategory ?? 99) - (b.rankCategory ?? 99)
        ),
      })),
  };
}

export function getNextPhaseId(
  phases: Phase[],
  currentPhaseId: number
): number | null {
  const sorted = [...phases].sort((a, b) => a.id - b.id);
  const idx = sorted.findIndex((p) => p.id === currentPhaseId);
  if (idx < 0 || idx >= sorted.length - 1) return null;
  return sorted[idx + 1].id;
}
