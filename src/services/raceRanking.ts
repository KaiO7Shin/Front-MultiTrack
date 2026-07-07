import api from "@/lib/api";
import { API } from "@/lib/apiEndpoints";
import { apiOrLocal, apiWriteOrLocal } from "@/lib/apiFallback";
import {
  localDisqualifyParticipant,
  localGetAssignmentsForPhase,
  localGetAllResultatsManche,
  localGetDisqualificationsByCourse,
  localRevokeDisqualification,
} from "@/lib/localData";
import {
  buildDHPhaseRanking,
  buildXCPhaseRanking,
  getNextPhaseId,
} from "@/lib/raceRanking";
import { fetchPhasesByCourse, fetchManchesByPhase } from "@/services/raceStructure";
import { fetchParticipantsByCourse } from "@/services/participants";
import type {
  BikeType,
  CategoryGenre,
  DHPhaseRanking,
  Phase,
  XCPhaseRanking,
} from "@/lib/type";

export async function fetchDHPhaseRanking(
  courseId: number,
  phaseId: number,
  filters?: { gender?: CategoryGenre; categoryAlias?: string; bikeType?: BikeType }
): Promise<DHPhaseRanking> {
  return apiOrLocal(
    async () => {
      const { data } = await api.get<{ data: DHPhaseRanking }>(
        API.raceRankingDh(courseId),
        { params: { phaseId, ...filters } }
      );
      return data.data;
    },
    async () => {
      const [phases, participants, resultats, disqualifications] =
        await Promise.all([
          fetchPhasesByCourse(courseId),
          Promise.resolve(fetchParticipantsByCourse(courseId)),
          Promise.resolve(localGetAllResultatsManche()),
          Promise.resolve(localGetDisqualificationsByCourse(courseId)),
        ]);
      const phase = phases.find((p) => p.id === phaseId);
      if (!phase) throw new Error("Phase introuvable");
      const manches = (
        await Promise.all(phases.map((p) => fetchManchesByPhase(p.id)))
      ).flat();
      return buildDHPhaseRanking({
        phase,
        phases,
        manches,
        participants,
        resultats,
        disqualifications,
        gender: filters?.gender,
        categoryAlias: filters?.categoryAlias,
        bikeType: filters?.bikeType,
      });
    },
    { label: `GET ${API.raceRankingDh(courseId)}` }
  );
}

export async function fetchXCPhaseRanking(
  courseId: number,
  phaseId: number,
  filters?: { gender?: CategoryGenre; categoryAlias?: string }
): Promise<XCPhaseRanking> {
  return apiOrLocal(
    async () => {
      const { data } = await api.get<{ data: XCPhaseRanking }>(
        API.raceRankingXc(courseId),
        { params: { phaseId, ...filters } }
      );
      return data.data;
    },
    async () => {
      const [phases, participants, resultats, disqualifications] =
        await Promise.all([
          fetchPhasesByCourse(courseId),
          Promise.resolve(fetchParticipantsByCourse(courseId)),
          Promise.resolve(localGetAllResultatsManche()),
          Promise.resolve(localGetDisqualificationsByCourse(courseId)),
        ]);
      const phase = phases.find((p) => p.id === phaseId);
      if (!phase) throw new Error("Phase introuvable");
      const manches = (
        await Promise.all(phases.map((p) => fetchManchesByPhase(p.id)))
      ).flat();
      const coursePhases = phases
        .filter((p) => p.courseId === courseId)
        .sort((a, b) => a.id - b.id);
      const isFinalePhase =
        coursePhases[coursePhases.length - 1]?.id === phase.id;
      const assignments = localGetAssignmentsForPhase(phaseId, manches);

      return buildXCPhaseRanking({
        phase,
        phases: coursePhases,
        manches,
        participants,
        resultats,
        disqualifications,
        gender: filters?.gender,
        categoryAlias: filters?.categoryAlias,
        isFinalePhase,
        assignments,
      });
    },
    { label: `GET ${API.raceRankingXc(courseId)}` }
  );
}

export async function disqualifyParticipant(input: {
  participantId: number;
  courseId: number;
  currentPhaseId: number;
  mancheId?: number;
  reason?: string;
}): Promise<void> {
  const phases = await fetchPhasesByCourse(input.courseId);
  const fromPhaseId = getNextPhaseId(phases, input.currentPhaseId);
  if (!fromPhaseId) {
    throw new Error("Aucune phase suivante pour appliquer la disqualification.");
  }

  return apiWriteOrLocal(
    async () => {
      await api.post(API.participantDisqualify, {
        ...input,
        fromPhaseId,
      });
    },
    () => {
      localDisqualifyParticipant({
        participantId: input.participantId,
        courseId: input.courseId,
        fromPhaseId,
        mancheId: input.mancheId,
        reason: input.reason,
      });
    },
    `POST ${API.participantDisqualify}`
  );
}

export async function revokeDisqualification(
  participantId: number
): Promise<void> {
  return apiWriteOrLocal(
    async () => {
      await api.delete(API.participantRevokeDisqualify(participantId));
    },
    () => {
      localRevokeDisqualification(participantId);
    },
    `DELETE ${API.participantRevokeDisqualify(participantId)}`
  );
}

export async function fetchPhasesForCourse(courseId: number): Promise<Phase[]> {
  return fetchPhasesByCourse(courseId);
}
